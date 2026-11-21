-- supabase/migrations/20261121000003_xp_server.sql
-- G3 (spec 3.1, 2.5): XP dan hari aktif dihitung dari baris tulisan server. Klien tidak lagi bisa menulis log_kegiatan;
-- kuis/pelajaran masuk lewat edge function catat-percobaan (service role). XP soal tabel dihitung dari percobaan_soal.
-- Peralihan: soal yang sudah memberi XP lewat log_kegiatan lama tidak memberi lagi, jadi total XP pengguna lama tidak berubah.

revoke insert on log_kegiatan from authenticated;

-- Bobot XP revisi yang DIKERJAKAN (bukan revisi terbit sekarang); cadangan tingkat bagi revisi lama tanpa bobotXp.
create function bobot_xp_revisi(p_revisi uuid) returns int language sql stable set search_path = public as $$
  select coalesce((r.isi ->> 'bobotXp')::int, xp_konten('soal', r.isi ->> 'tingkat')) from revisi r where r.id = p_revisi
$$;

-- Satu baris per peristiwa XP soal tabel per (pengguna, soal), aturan spec 3.1:
--  - Lihat jawaban sebelum benar pertama (atau sebelum Kirim Ujian pertama) = 0 XP selamanya.
--  - Benar penuh pertama (Periksa Latihan atau Kirim Ujian, benar_semua) = bobot penuh; ulang = 0.
--  - Kirim Ujian pertama memberi bobot x kolom benar / kolom, lalu benar penuh menambah sisanya (total <= bobot).
create function xp_soal_baru(p_user uuid) returns table (user_id uuid, soal_id text, xp int, terjadi_pada timestamptz)
language sql stable set search_path = public as $$
  with sudah_di_log_lama as (
    select l.user_id, l.slug as soal_id from log_kegiatan l where l.jenis = 'soal' and l.benar and (p_user is null or l.user_id = p_user)
  ), kejadian as (
    select p.*, bobot_xp_revisi(p.revisi_soal) as bobot,
      (p.aksi = 'periksa' and p.mode = 'latihan' or p.aksi = 'kirim' and p.mode = 'ujian') and coalesce(p.benar_semua, false) as benar_penuh
    from percobaan_soal p
    where (p_user is null or p.user_id = p_user)
      and not exists (select 1 from sudah_di_log_lama s where s.user_id = p.user_id and s.soal_id = p.soal_id)
  ), per_soal as (
    select k.user_id, k.soal_id,
      min(k.diterima_pada) filter (where k.aksi = 'lihat_jawaban') as t_lihat,
      min(k.diterima_pada) filter (where k.benar_penuh) as t_benar,
      min(k.diterima_pada) filter (where k.aksi = 'kirim' and k.mode = 'ujian') as t_kirim
    from kejadian k group by k.user_id, k.soal_id
  ), parsial as (
    select s.user_id, s.soal_id, s.t_kirim as terjadi_pada,
      (k.bobot * (select count(*) from jsonb_array_elements(k.hasil_kolom) h where h ->> 'status' = 'benar')
        / greatest(jsonb_array_length(k.hasil_kolom), 1))::int as xp
    from per_soal s
    join lateral (select * from kejadian x where x.user_id = s.user_id and x.soal_id = s.soal_id and x.diterima_pada = s.t_kirim
      and x.aksi = 'kirim' and x.mode = 'ujian' order by x.id limit 1) k on true
    where s.t_kirim is not null and (s.t_lihat is null or s.t_lihat > s.t_kirim)
  ), sisa as (
    select s.user_id, s.soal_id, s.t_benar as terjadi_pada,
      greatest(k.bobot - coalesce(pa.xp, 0), 0) as xp
    from per_soal s
    join lateral (select * from kejadian x where x.user_id = s.user_id and x.soal_id = s.soal_id and x.diterima_pada = s.t_benar
      and x.benar_penuh order by x.id limit 1) k on true
    left join parsial pa on pa.user_id = s.user_id and pa.soal_id = s.soal_id
    where s.t_benar is not null and (s.t_lihat is null or s.t_lihat > s.t_benar)
  )
  select user_id, soal_id, xp, terjadi_pada from parsial where xp > 0
  union all
  select user_id, soal_id, xp, terjadi_pada from sisa where xp > 0
$$;

-- Hari aktif: kegiatan konten lama + setiap kejadian percobaan (benar, salah, lihat jawaban; spec 3.1 butir 7).
create or replace function hari_aktif(p_user uuid) returns table (user_id uuid, tanggal date) language sql stable set search_path = public as $$
  with lokal as (
    select k.user_id, k.terjadi_pada at time zone k.zona_waktu as waktu from kegiatan_sah(p_user) k
    union all
    select p.user_id, p.diterima_pada at time zone coalesce(pr.zona_waktu, 'Asia/Jakarta')
    from percobaan_soal p left join profil pr on pr.user_id = p.user_id
    where p_user is null or p.user_id = p_user
  ), pasti as (
    select distinct l.user_id, l.waktu::date as tanggal from lokal l where l.waktu::time >= batas_toleransi()
  )
  select p.user_id, p.tanggal from pasti p
  union
  select l.user_id,
    case when exists (select 1 from pasti p where p.user_id = l.user_id and p.tanggal = l.waktu::date - 1)
      then l.waktu::date else l.waktu::date - 1 end
  from lokal l where l.waktu::time < batas_toleransi()
$$;

create or replace function peristiwa_xp(p_user uuid) returns table (user_id uuid, xp int, minggu date) language sql stable set search_path = public as $$
  with pertama as (
    select distinct on (k.user_id, k.jenis, k.slug) k.user_id, k.jenis, k.tingkat, k.terjadi_pada
    from kegiatan_sah(p_user) k
    where k.jenis = 'pelajaran' or k.benar
    order by k.user_id, k.jenis, k.slug, k.terjadi_pada
  )
  select p.user_id, xp_konten(p.jenis, p.tingkat), senin_wib(p.terjadi_pada) from pertama p
  union all
  select s.user_id, s.xp, senin_wib(s.terjadi_pada) from xp_soal_baru(p_user) s
  union all
  select h.user_id, xp_hari_aktif(), senin(h.tanggal) from hari_aktif(p_user) h
$$;

revoke execute on function bobot_xp_revisi(uuid), xp_soal_baru(uuid) from public, anon, authenticated;

-- progres_latihan.benar = "pernah benar" (spec 2.5 butir 3); diisi ulang sekali dari log lama.
update progres_latihan p set benar = true
where not p.benar and exists (select 1 from log_kegiatan l where l.user_id = p.user_id and l.slug = p.soal_slug and l.benar);
