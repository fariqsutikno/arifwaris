-- supabase/migrations/20261124000001_tangga_bantuan.sql
-- Tangga bantuan soal hitung (spec-tangga-bantuan-soal bagian 5 dan 8): aksi `petunjuk` dan `buka_kolom` di percobaan_soal,
-- dan XP soal = XP dasar 60% + bonus mandiri 40%.
--   - Bonus mandiri lepas bila ada petunjuk, atau Periksa salah lebih dari 3 kali, sebelum benar pertama (semua sesi).
--   - Buka kolom sebelum benar pertama = 0 XP selamanya (seperti lihat_jawaban).

alter table percobaan_soal drop constraint percobaan_soal_aksi_check;
alter table percobaan_soal add constraint percobaan_soal_aksi_check
  check (aksi in ('buka','periksa','kirim','lihat_jawaban','petunjuk','buka_kolom'));
-- petunjuk: {"idKolom": "...", "tingkat": 1|2}; buka_kolom: {"idKolom": "..."}. Hanya mode latihan.
alter table percobaan_soal add column bantuan jsonb check (pg_column_size(bantuan) < 1000);
alter table percobaan_soal add constraint percobaan_soal_bantuan_sesuai_aksi
  check ((aksi in ('petunjuk','buka_kolom')) = (bantuan is not null) and (bantuan is null or mode = 'latihan'));

-- Tanda tangan berubah (p_bantuan di akhir), jadi fungsi lama dibuang lalu dibuat ulang.
drop function catat_percobaan(uuid, uuid, uuid, text, uuid, text, text, text, jsonb, jsonb, jsonb, boolean, timestamptz, jsonb);

create function catat_percobaan(
  p_user uuid, p_id uuid, p_id_sesi_soal uuid, p_soal_id text, p_revisi_soal uuid, p_jenis_soal text, p_mode text,
  p_aksi text, p_isian jsonb, p_jangkar jsonb, p_hasil_kolom jsonb, p_benar_semua boolean, p_dimulai_pada timestamptz,
  p_versi jsonb, p_bantuan jsonb default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  BATAS_PER_MENIT constant int := 30;
  BATAS_PER_HARI constant int := 2000;
  lama percobaan_soal;
  sesi_pertama percobaan_soal;
begin
  -- Idempoten: id sama dengan isi sama = hasil lama; isi berbeda = bentrok.
  select * into lama from percobaan_soal where user_id = p_user and id = p_id;
  if found then
    if (lama.id_sesi_soal, lama.soal_id, lama.revisi_soal, lama.mode, lama.aksi, lama.isian, lama.jangkar, lama.bantuan)
       is not distinct from (p_id_sesi_soal, p_soal_id, p_revisi_soal, p_mode, p_aksi, p_isian, p_jangkar, p_bantuan) then
      return jsonb_build_object('duplikat', true, 'diterima_pada', lama.diterima_pada, 'hasil_kolom', lama.hasil_kolom, 'benar_semua', lama.benar_semua);
    end if;
    raise exception 'ID_BENTROK' using errcode = 'PT409';
  end if;

  if (select count(*) from percobaan_soal where user_id = p_user and diterima_pada > now() - interval '1 minute') >= BATAS_PER_MENIT
     or (select count(*) from percobaan_soal where user_id = p_user and diterima_pada > now() - interval '1 day') >= BATAS_PER_HARI then
    raise exception 'LAJU_TERLAMPAUI' using errcode = 'PT429';
  end if;

  if (p_mode = 'ujian' and p_aksi in ('periksa', 'petunjuk', 'buka_kolom')) or (p_mode = 'latihan' and p_aksi = 'kirim')
     or ((p_aksi in ('petunjuk', 'buka_kolom')) <> (p_bantuan is not null)) then
    raise exception 'AKSI_TIDAK_SESUAI_MODE' using errcode = 'PT400';
  end if;

  -- Satu sesi = satu soal, satu mode; sesudah Kirim Ujian hanya lihat jawaban yang boleh.
  select * into sesi_pertama from percobaan_soal where user_id = p_user and id_sesi_soal = p_id_sesi_soal order by diterima_pada limit 1;
  if found then
    if sesi_pertama.soal_id <> p_soal_id or sesi_pertama.mode <> p_mode then raise exception 'SESI_BEDA_SOAL' using errcode = 'PT409'; end if;
    if p_aksi <> 'lihat_jawaban' and exists (
      select 1 from percobaan_soal where user_id = p_user and id_sesi_soal = p_id_sesi_soal and aksi = 'kirim' and mode = 'ujian') then
      raise exception 'SESI_SUDAH_DIKIRIM' using errcode = 'PT409';
    end if;
  end if;

  begin
    insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, isian, jangkar,
      hasil_kolom, benar_semua, dimulai_pada_klien, versi, bantuan)
    values (p_id, p_user, p_id_sesi_soal, p_soal_id, p_revisi_soal, p_jenis_soal, p_mode, p_aksi, p_isian, p_jangkar,
      p_hasil_kolom, p_benar_semua, p_dimulai_pada, p_versi, p_bantuan)
    returning * into lama;
  exception when unique_violation then
    -- Balapan dua Kirim Ujian / dua buka: yang kalah ditolak oleh indeks unik.
    raise exception 'SESI_SUDAH_DIKIRIM' using errcode = 'PT409';
  end;
  return jsonb_build_object('duplikat', false, 'diterima_pada', lama.diterima_pada, 'hasil_kolom', lama.hasil_kolom, 'benar_semua', lama.benar_semua);
end $$;

revoke execute on function catat_percobaan(uuid, uuid, uuid, text, uuid, text, text, text, jsonb, jsonb, jsonb, boolean, timestamptz, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function catat_percobaan(uuid, uuid, uuid, text, uuid, text, text, text, jsonb, jsonb, jsonb, boolean, timestamptz, jsonb, jsonb)
  to service_role;

-- XP soal tabel (spec tangga bantuan bagian 5): dasar 60% bobot, bonus mandiri 40% (sisanya, supaya jumlahnya tepat bobot).
--  - Buka kolom atau lihat jawaban sebelum benar pertama = 0 XP selamanya.
--  - Benar penuh pertama = dasar; ditambah bonus bila tanpa petunjuk dan Periksa salah <= 3 kali sebelumnya (semua sesi).
--  - Kirim Ujian pertama memberi bobot x kolom benar / kolom, lalu benar penuh menambah sisanya (total <= bobot yang berhak).
create or replace function xp_soal_baru(p_user uuid) returns table (user_id uuid, soal_id text, xp int, terjadi_pada timestamptz)
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
      min(k.diterima_pada) filter (where k.aksi in ('lihat_jawaban', 'buka_kolom')) as t_lihat,
      min(k.diterima_pada) filter (where k.benar_penuh) as t_benar,
      min(k.diterima_pada) filter (where k.aksi = 'kirim' and k.mode = 'ujian') as t_kirim
    from kejadian k group by k.user_id, k.soal_id
  ), mandiri as (
    select s.user_id, s.soal_id,
      count(*) filter (where k.aksi = 'petunjuk') = 0
      and count(*) filter (where k.aksi = 'periksa' and k.mode = 'latihan' and not coalesce(k.benar_semua, false)) <= 3 as ya
    from per_soal s
    join kejadian k on k.user_id = s.user_id and k.soal_id = s.soal_id and k.diterima_pada < s.t_benar
    where s.t_benar is not null
    group by s.user_id, s.soal_id
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
      greatest(k.bobot * 6 / 10 + case when coalesce(m.ya, true) then k.bobot - k.bobot * 6 / 10 else 0 end - coalesce(pa.xp, 0), 0) as xp
    from per_soal s
    join lateral (select * from kejadian x where x.user_id = s.user_id and x.soal_id = s.soal_id and x.diterima_pada = s.t_benar
      and x.benar_penuh order by x.id limit 1) k on true
    left join parsial pa on pa.user_id = s.user_id and pa.soal_id = s.soal_id
    left join mandiri m on m.user_id = s.user_id and m.soal_id = s.soal_id
    where s.t_benar is not null and (s.t_lihat is null or s.t_lihat > s.t_benar)
  )
  select user_id, soal_id, xp, terjadi_pada from parsial where xp > 0
  union all
  select user_id, soal_id, xp, terjadi_pada from sisa where xp > 0
$$;
