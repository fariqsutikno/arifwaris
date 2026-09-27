-- supabase/migrations/20260926000003_pengguna.sql
-- Data milik pengguna yang login (spec "Data pengguna"). Konflik antar perangkat: yang terakhir menang per baris
-- berdasarkan diubah_pada (ditangani klien). Hasil hitung tidak pernah masuk ke sini kecuali pengguna menekan "Simpan".

create table riwayat_hitung (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kasus jsonb not null,
  judul text not null,
  disimpan_pada timestamptz not null default now(),
  primary key (user_id, id)
);

create table progres_belajar (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  pelajaran_slug text not null,
  selesai boolean not null,
  diubah_pada timestamptz not null default now(),
  primary key (user_id, pelajaran_slug)
);

create table progres_latihan (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  soal_slug text not null,
  jenis text not null check (jenis in ('kuis', 'hitung')),
  jawaban_terakhir jsonb,
  benar boolean not null,
  jumlah_coba int not null check (jumlah_coba >= 1),
  diubah_pada timestamptz not null default now(),
  primary key (user_id, jenis, soal_slug)
);

create table preferensi (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  isi jsonb not null,
  diubah_pada timestamptz not null default now()
);
