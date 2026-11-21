-- supabase/migrations/20261121000001_percobaan_soal.sql
-- G3 / spec 2.4 + 2.6: kejadian percobaan soal tabel. SATU-SATUNYA penulis = edge function `catat-percobaan`
-- (service role) sesudah validasi; klien hanya boleh membaca barisnya sendiri. Kebenaran tidak pernah dari klien.
-- Kolom tugas_id menyusul bersama tabel tugas (fase kelas).

create table percobaan_soal (
  id uuid not null,
  user_id uuid not null references auth.users on delete cascade,
  id_sesi_soal uuid not null,
  soal_id text not null check (char_length(soal_id) <= 200),
  revisi_soal uuid not null references revisi,
  jenis_soal text not null check (jenis_soal in ('biasa','munasakhat','dzawil_arham','mafqud','khuntsa','haml','gharqa')),
  mode text not null check (mode in ('latihan','ujian')),
  -- 'buka' = soal dibuka; waktu pengerjaan = selisih diterima_pada server (spec 05 bagian 2).
  aksi text not null check (aksi in ('buka','periksa','kirim','lihat_jawaban')),
  isian jsonb check (pg_column_size(isian) < 16000),
  jangkar jsonb,
  hasil_kolom jsonb,
  benar_semua boolean,
  dimulai_pada_klien timestamptz,
  diterima_pada timestamptz not null default now(),
  versi jsonb not null,
  -- id dibuat klien; dipasangkan dengan user_id supaya orang lain tidak bisa "menduduki" id seseorang.
  primary key (user_id, id)
);

create index percobaan_soal_pengguna_soal on percobaan_soal (user_id, soal_id, diterima_pada);
-- Satu Kirim per sesi Ujian; satu buka per sesi.
create unique index percobaan_soal_satu_kirim_ujian on percobaan_soal (user_id, id_sesi_soal) where aksi = 'kirim' and mode = 'ujian';
create unique index percobaan_soal_satu_buka on percobaan_soal (user_id, id_sesi_soal) where aksi = 'buka';

alter table percobaan_soal enable row level security;
create policy baca_sendiri on percobaan_soal for select to authenticated using (user_id = auth.uid());
revoke all on percobaan_soal from anon, authenticated;
grant select on percobaan_soal to authenticated;
