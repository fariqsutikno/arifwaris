-- supabase/migrations/20260927000006_peringkat.sql
-- Tahap 5 (spec streak-leaderboard): profil untuk papan peringkat, lalu hari aktif, streak, dan XP yang dihitung dari
-- log_kegiatan. Hitungan ada di sini, bukan di klien, karena log tidak bisa diubah klien dan waktunya dari server.
-- Fungsi internal menerima "sekarang" sebagai argumen supaya bisa diuji tanpa bergantung jam; fungsi untuk klien
-- (ringkasan_saya, papan_peringkat) hanya pembungkus yang mengisi auth.uid() dan now().

create table profil (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  nama_tampilan text not null check (nama_tampilan = btrim(nama_tampilan) and char_length(nama_tampilan) between 1 and 40),
  ikut_papan_peringkat boolean not null default false,
  tampilkan_avatar boolean not null default false,
  zona_waktu text not null default 'Asia/Jakarta'
);

-- CHECK tidak boleh berisi subkueri, jadi zona waktu dicek lewat trigger.
create function periksa_zona_waktu() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.zona_waktu) then
    raise exception 'zona waktu tidak dikenal: %', new.zona_waktu using errcode = '22023';
  end if;
  return new;
end $$;
create trigger zona_waktu_sah before insert or update of zona_waktu on profil
  for each row execute function periksa_zona_waktu();

alter table profil enable row level security;
create policy milik_sendiri on profil for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on profil from anon;

-- ===== angka tetap (spec "XP") =====

create function xp_konten(p_jenis text, p_tingkat text) returns int language sql immutable as $$
  select case p_jenis
    when 'pelajaran' then 10
    when 'soal' then case coalesce(p_tingkat, 'dasar') when 'sulit' then 30 when 'menengah' then 20 else 10 end
    when 'kuis' then case coalesce(p_tingkat, 'dasar') when 'sulit' then 15 when 'menengah' then 10 else 5 end
    else 0
  end $$;

create function xp_hari_aktif() returns int language sql immutable as $$ select 2 $$;

-- Kegiatan sebelum jam ini boleh menutup kemarin (spec "Toleransi luring").
create function batas_toleransi() returns time language sql immutable as $$ select time '02:00' $$;

-- Senin dari minggu sebuah tanggal (ISO: Senin = 1).
create function senin(p_tanggal date) returns date language sql immutable as $$
  select p_tanggal - (extract(isodow from p_tanggal)::int - 1) $$;

-- Papan mingguan satu untuk semua pengguna: minggu dihitung di WIB.
create function senin_wib(p_waktu timestamptz) returns date language sql immutable as $$
  select senin((p_waktu at time zone 'Asia/Jakarta')::date) $$;

-- ===== hitungan internal =====

-- Hanya log yang slug-nya terbit; slug karangan tidak memberi XP maupun hari aktif. p_user null = semua pengguna.
create function kegiatan_sah(p_user uuid)
returns table (user_id uuid, jenis text, slug text, benar boolean, terjadi_pada timestamptz, tingkat text, zona_waktu text)
language sql stable as $$
  select l.user_id, l.jenis, l.slug, l.benar, l.terjadi_pada, r.isi ->> 'tingkat', coalesce(p.zona_waktu, 'Asia/Jakarta')
  from log_kegiatan l
  join entri_konten e on e.slug = l.slug
    and e.jenis = case l.jenis when 'pelajaran' then 'materi' when 'soal' then 'soal_hitung' else 'soal_kuis' end
  join revisi r on r.id = e.revisi_terbit_id
  left join profil p on p.user_id = l.user_id
  where p_user is null or l.user_id = p_user
$$;

create function hari_aktif(p_user uuid) returns table (user_id uuid, tanggal date) language sql stable as $$
  with lokal as (
    select k.user_id, k.terjadi_pada at time zone k.zona_waktu as waktu from kegiatan_sah(p_user) k
  ), pasti as (
    select distinct l.user_id, l.waktu::date as tanggal from lokal l where l.waktu::time >= batas_toleransi()
  )
  select p.user_id, p.tanggal from pasti p
  union
  -- Dini hari menutup kemarin hanya bila kemarin belum aktif, supaya satu kegiatan tidak mengisi dua hari.
  select l.user_id,
    case when exists (select 1 from pasti p where p.user_id = l.user_id and p.tanggal = l.waktu::date - 1)
      then l.waktu::date else l.waktu::date - 1 end
  from lokal l where l.waktu::time < batas_toleransi()
$$;

-- XP konten diberikan sekali per (jenis, slug): pelajaran pada log pertamanya, soal & kuis pada jawaban benar pertama.
create function peristiwa_xp(p_user uuid) returns table (user_id uuid, xp int, minggu date) language sql stable as $$
  with pertama as (
    select distinct on (k.user_id, k.jenis, k.slug) k.user_id, k.jenis, k.tingkat, k.terjadi_pada
    from kegiatan_sah(p_user) k
    where k.jenis = 'pelajaran' or k.benar
    order by k.user_id, k.jenis, k.slug, k.terjadi_pada
  )
  select p.user_id, xp_konten(p.jenis, p.tingkat), senin_wib(p.terjadi_pada) from pertama p
  union all
  select h.user_id, xp_hari_aktif(), senin(h.tanggal) from hari_aktif(p_user) h
$$;

-- Streak sekarang hidup bila rangkaian terakhir berakhir hari ini atau kemarin; sebelum batas toleransi juga lusa,
-- karena kemarin masih bisa ditutup kegiatan dini hari ini.
create function streak_pada(p_user uuid, p_sekarang timestamptz)
returns table (user_id uuid, streak_sekarang int, streak_terpanjang int, aktif_hari_ini boolean)
language sql stable as $$
  with pulau as (
    select h.user_id, h.tanggal, h.tanggal - (row_number() over (partition by h.user_id order by h.tanggal))::int as kelompok
    from hari_aktif(p_user) h
  ), rangkaian as (
    select p.user_id, count(*)::int as panjang, max(p.tanggal) as akhir from pulau p group by p.user_id, p.kelompok
  ), kini as (
    select distinct r.user_id, p_sekarang at time zone coalesce(pr.zona_waktu, 'Asia/Jakarta') as waktu
    from rangkaian r left join profil pr on pr.user_id = r.user_id
  )
  select r.user_id,
    coalesce(max(r.panjang) filter (
      where r.akhir >= k.waktu::date - case when k.waktu::time < batas_toleransi() then 2 else 1 end), 0),
    max(r.panjang),
    bool_or(r.akhir = k.waktu::date)
  from rangkaian r join kini k on k.user_id = r.user_id
  group by r.user_id
$$;

create function ringkasan_pada(p_user uuid, p_sekarang timestamptz)
returns table (xp_total int, xp_minggu_ini int, streak_sekarang int, streak_terpanjang int, aktif_hari_ini boolean)
language sql stable as $$
  with xp as (select * from peristiwa_xp(p_user))
  select
    (select coalesce(sum(x.xp), 0)::int from xp x),
    (select coalesce(sum(x.xp), 0)::int from xp x where x.minggu = senin_wib(p_sekarang)),
    coalesce(s.streak_sekarang, 0), coalesce(s.streak_terpanjang, 0), coalesce(s.aktif_hari_ini, false)
  from (select 1) satu left join streak_pada(p_user, p_sekarang) s on true
$$;

-- Hanya yang ikut dan ber-XP > 0. Seri berbagi peringkat; urutan tampil dalam seri menurut nama.
create function papan_peringkat_pada(p_periode text, p_batas int, p_sekarang timestamptz, p_pemanggil uuid)
returns table (peringkat int, nama_tampilan text, avatar text, xp int, streak_sekarang int, saya boolean)
language sql stable as $$
  with peserta as (
    select * from profil where ikut_papan_peringkat
  ), skor as (
    select x.user_id, sum(x.xp)::int as xp
    from peristiwa_xp(null) x join peserta p on p.user_id = x.user_id
    where p_periode = 'semua' or x.minggu = senin_wib(p_sekarang)
    group by x.user_id
  ), urut as (
    select s.user_id, s.xp, p.nama_tampilan, p.tampilkan_avatar,
      rank() over (order by s.xp desc)::int as peringkat,
      row_number() over (order by s.xp desc, p.nama_tampilan, s.user_id) as urutan
    from skor s join peserta p on p.user_id = s.user_id
    where s.xp > 0
  )
  select u.peringkat, u.nama_tampilan,
    case when u.tampilkan_avatar then au.raw_user_meta_data ->> 'avatar_url' end,
    u.xp, coalesce(st.streak_sekarang, 0), coalesce(u.user_id = p_pemanggil, false)
  from urut u
  join auth.users au on au.id = u.user_id
  left join streak_pada(null, p_sekarang) st on st.user_id = u.user_id
  where u.urutan <= p_batas or u.user_id = p_pemanggil
  order by u.urutan
$$;

-- ===== untuk klien =====

create function ringkasan_saya()
returns table (xp_total int, xp_minggu_ini int, streak_sekarang int, streak_terpanjang int, aktif_hari_ini boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'belum masuk' using errcode = '42501'; end if;
  return query select * from ringkasan_pada(auth.uid(), now());
end $$;

create function papan_peringkat(p_periode text, p_batas int default 50)
returns table (peringkat int, nama_tampilan text, avatar text, xp int, streak_sekarang int, saya boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_periode not in ('minggu', 'semua') then
    raise exception 'periode tidak dikenal: %', p_periode using errcode = '22023';
  end if;
  return query select * from papan_peringkat_pada(p_periode, least(greatest(p_batas, 1), 100), now(), auth.uid());
end $$;

-- Fungsi internal membaca log & profil semua orang: hanya lewat dua pembungkus di atas.
revoke execute on function
  periksa_zona_waktu(), kegiatan_sah(uuid), hari_aktif(uuid), peristiwa_xp(uuid), streak_pada(uuid, timestamptz),
  ringkasan_pada(uuid, timestamptz), papan_peringkat_pada(text, int, timestamptz, uuid)
  from public, anon, authenticated;
revoke execute on function ringkasan_saya() from public, anon;
grant execute on function ringkasan_saya() to authenticated;
grant execute on function papan_peringkat(text, int) to anon, authenticated;
