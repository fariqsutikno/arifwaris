-- supabase/migrations/20261121000002_catat_percobaan.sql
-- Penulis atomik percobaan_soal untuk edge function `catat-percobaan` (service role saja). Aturan urutan, idempoten,
-- dan batas laju (spec 2.6 butir 4-5) ada di sini, bukan di fungsi edge, supaya satu transaksi dan teruji pgTAP.
-- Galat memakai SQLSTATE PT400/PT409/PT429 (PostgREST memetakannya menjadi status HTTP); pesan = kode galat.

create function catat_percobaan(
  p_user uuid, p_id uuid, p_id_sesi_soal uuid, p_soal_id text, p_revisi_soal uuid, p_jenis_soal text, p_mode text,
  p_aksi text, p_isian jsonb, p_jangkar jsonb, p_hasil_kolom jsonb, p_benar_semua boolean, p_dimulai_pada timestamptz,
  p_versi jsonb
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
    if (lama.id_sesi_soal, lama.soal_id, lama.revisi_soal, lama.mode, lama.aksi, lama.isian, lama.jangkar)
       is not distinct from (p_id_sesi_soal, p_soal_id, p_revisi_soal, p_mode, p_aksi, p_isian, p_jangkar) then
      return jsonb_build_object('duplikat', true, 'diterima_pada', lama.diterima_pada, 'hasil_kolom', lama.hasil_kolom, 'benar_semua', lama.benar_semua);
    end if;
    raise exception 'ID_BENTROK' using errcode = 'PT409';
  end if;

  if (select count(*) from percobaan_soal where user_id = p_user and diterima_pada > now() - interval '1 minute') >= BATAS_PER_MENIT
     or (select count(*) from percobaan_soal where user_id = p_user and diterima_pada > now() - interval '1 day') >= BATAS_PER_HARI then
    raise exception 'LAJU_TERLAMPAUI' using errcode = 'PT429';
  end if;

  if (p_mode = 'ujian' and p_aksi = 'periksa') or (p_mode = 'latihan' and p_aksi = 'kirim') then
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
      hasil_kolom, benar_semua, dimulai_pada_klien, versi)
    values (p_id, p_user, p_id_sesi_soal, p_soal_id, p_revisi_soal, p_jenis_soal, p_mode, p_aksi, p_isian, p_jangkar,
      p_hasil_kolom, p_benar_semua, p_dimulai_pada, p_versi)
    returning * into lama;
  exception when unique_violation then
    -- Balapan dua Kirim Ujian / dua buka: yang kalah ditolak oleh indeks unik.
    raise exception 'SESI_SUDAH_DIKIRIM' using errcode = 'PT409';
  end;
  return jsonb_build_object('duplikat', false, 'diterima_pada', lama.diterima_pada, 'hasil_kolom', lama.hasil_kolom, 'benar_semua', lama.benar_semua);
end $$;

revoke execute on function catat_percobaan(uuid, uuid, uuid, text, uuid, text, text, text, jsonb, jsonb, jsonb, boolean, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function catat_percobaan(uuid, uuid, uuid, text, uuid, text, text, text, jsonb, jsonb, jsonb, boolean, timestamptz, jsonb)
  to service_role;
