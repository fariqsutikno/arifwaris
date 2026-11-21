-- supabase/migrations/20261121000004_persetujuan_pdp.sql
-- G3 / UU PDP dasar (01 bagian 2.1-2.3): papan peringkat opt-in, persetujuan terekam append-only, unduh data.

-- ===== papan peringkat opt-in (PDP-2) =====
alter table profil alter column ikut_papan_peringkat set default false;
-- Migrasi opt-out menimpa semua pilihan dengan true, jadi pilihan eksplisit tidak bisa dibedakan: semua dikembalikan.
update profil set ikut_papan_peringkat = false;

-- Hanya pengguna yang BERBARIS profil dan memilih ikut; tanpa baris = tidak tampil.
create or replace function papan_peringkat_pada(p_periode text, p_batas int, p_sekarang timestamptz, p_pemanggil uuid)
returns table (peringkat int, nama_tampilan text, avatar text, xp int, streak_sekarang int, saya boolean)
language sql stable set search_path = public as $$
  with peserta as (
    select p.user_id, p.nama_tampilan, p.tampilkan_avatar, au.raw_user_meta_data ->> 'avatar_url' as avatar
    from profil p join auth.users au on au.id = p.user_id
    where p.ikut_papan_peringkat
  ), skor as (
    select x.user_id, sum(x.xp)::int as xp
    from peristiwa_xp(null) x join peserta p on p.user_id = x.user_id
    where p_periode = 'semua' or x.minggu = senin_wib(p_sekarang)
    group by x.user_id
  ), urut as (
    select s.user_id, s.xp, p.nama_tampilan, p.tampilkan_avatar, p.avatar,
      rank() over (order by s.xp desc)::int as peringkat,
      row_number() over (order by s.xp desc, p.nama_tampilan, s.user_id) as urutan
    from skor s join peserta p on p.user_id = s.user_id
    where s.xp > 0
  )
  select u.peringkat, u.nama_tampilan, case when u.tampilkan_avatar then u.avatar end,
    u.xp, coalesce(st.streak_sekarang, 0), coalesce(u.user_id = p_pemanggil, false)
  from urut u
  left join streak_pada(null, p_sekarang) st on st.user_id = u.user_id
  where u.urutan <= p_batas or u.user_id = p_pemanggil
  order by u.urutan
$$;

-- ===== persetujuan terekam (PDP-1, PDP-10) =====
create table persetujuan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  jenis text not null check (jenis in ('kebijakan_privasi','papan_peringkat','push','ai_konteks','usia_18','kelas_berbagi_nilai')),
  versi int not null check (versi >= 0),   -- versiTerbit kebijakan yang dibaca saat memilih
  setuju boolean not null,
  pada timestamptz not null default now()
);
create index persetujuan_pengguna_jenis on persetujuan (user_id, jenis, pada desc);

alter table persetujuan enable row level security;
create policy baca_sendiri on persetujuan for select to authenticated using (user_id = auth.uid());
-- Append-only: ditulis hanya lewat atur_persetujuan (tidak ada insert/update/delete langsung).
revoke all on persetujuan from anon, authenticated;
grant select on persetujuan to authenticated;

-- Menyisipkan baris, lalu menyetel keadaan efektif yang perlu cepat dibaca. Menarik persetujuan langsung berlaku.
create function atur_persetujuan(p_jenis text, p_setuju boolean, p_versi int default 0)
returns void language plpgsql security definer set search_path = public as $$
declare pemanggil uuid := auth.uid();
begin
  if pemanggil is null then raise exception 'belum masuk' using errcode = '42501'; end if;
  insert into persetujuan (user_id, jenis, versi, setuju) values (pemanggil, p_jenis, p_versi, p_setuju);
  if p_jenis = 'papan_peringkat' then
    if p_setuju then
      -- Nama awal dari akun (nama depan), supaya baris profil sah; tidak menimpa nama yang sudah dipilih.
      insert into profil (user_id, nama_tampilan, ikut_papan_peringkat)
      select pemanggil, nama_bawaan(au.raw_user_meta_data), true from auth.users au where au.id = pemanggil
      on conflict (user_id) do update set ikut_papan_peringkat = true;
    else
      update profil set ikut_papan_peringkat = false where user_id = pemanggil;
    end if;
  elsif p_jenis = 'push' and not p_setuju then
    delete from langganan_push where user_id = pemanggil;
  end if;
end $$;

-- Keadaan efektif per jenis = baris terakhir; jenis yang belum pernah dipilih tidak muncul.
create function persetujuan_saya() returns table (jenis text, versi int, setuju boolean)
language sql stable security definer set search_path = public as $$
  select distinct on (p.jenis) p.jenis, p.versi, p.setuju from persetujuan p
  where p.user_id = auth.uid() order by p.jenis, p.pada desc, p.id
$$;

-- ===== unduh data (PDP-3) =====
-- Semua baris milik pemanggil dari tiap tabel data pengguna. Tanpa parameter user_id.
create function unduh_data_saya() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare pemanggil uuid := auth.uid();
begin
  if pemanggil is null then raise exception 'belum masuk' using errcode = '42501'; end if;
  return jsonb_build_object(
    'diunduh_pada', now(),
    'profil', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from profil t where t.user_id = pemanggil),
    'preferensi', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from preferensi t where t.user_id = pemanggil),
    'riwayat_hitung', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from riwayat_hitung t where t.user_id = pemanggil),
    'progres_belajar', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from progres_belajar t where t.user_id = pemanggil),
    'progres_latihan', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from progres_latihan t where t.user_id = pemanggil),
    'log_kegiatan', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from log_kegiatan t where t.user_id = pemanggil),
    'percobaan_soal', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from percobaan_soal t where t.user_id = pemanggil),
    'kasus_dibagikan', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from kasus_dibagikan t where t.pemilik = pemanggil),
    'persetujuan', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from persetujuan t where t.user_id = pemanggil),
    -- Kunci langganan push (rahasia perangkat) sengaja tidak ikut; cukup bukti ada langganan.
    'langganan_push', (select coalesce(jsonb_agg(jsonb_build_object('bahasa', t.bahasa, 'dibuat_pada', t.dibuat_pada)), '[]') from langganan_push t where t.user_id = pemanggil),
    'pemakaian_ai', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from pemakaian_ai t where t.user_id = pemanggil)
  );
end $$;

revoke execute on function atur_persetujuan(text, boolean, int), persetujuan_saya(), unduh_data_saya() from public, anon;
grant execute on function atur_persetujuan(text, boolean, int), persetujuan_saya(), unduh_data_saya() to authenticated;
