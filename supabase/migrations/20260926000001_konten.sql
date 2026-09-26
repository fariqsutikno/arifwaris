-- supabase/migrations/20260926000001_konten.sql
-- Konten edukasi & diksi yang dikelola portal (spec "Model data"). Tiap entri punya banyak revisi; yang tampil ke
-- publik hanya revisi yang ditunjuk revisi_terbit_id. SQL Postgres biasa; satu-satunya ketergantungan Supabase
-- adalah auth.users dan auth.uid(), yang di VPS diganti tabel/fungsi setara.

create type status_revisi as enum ('draf', 'diajukan', 'disetujui', 'dikembalikan');
create type peran as enum ('admin', 'penulis', 'reviewer');

-- Diisi dari docs/kb oleh scripts/daftar-refs.ts (supabase/seed.sql); tidak disunting dari portal.
create table daftar_refs (
  kode text primary key check (kode ~ '^R\d{2}-\d+$'),
  bab int not null
);

-- Satu baris; naik tiap ada revisi terbit (konten atau diksi) supaya web cukup mengunduh yang berubah.
create table versi_konten (
  satu boolean primary key default true check (satu),
  angka bigint not null default 0
);
insert into versi_konten default values;

create table entri_konten (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in (
    'modul', 'materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'kitab', 'syahid',
    'glosarium_ar', 'ahwal', 'teks_edukasi', 'cheatsheet')),
  slug text not null,
  urutan int not null default 0,
  revisi_terbit_id uuid,
  versi_terbit bigint,
  unique (jenis, slug)
);

create table revisi (
  id uuid primary key default gen_random_uuid(),
  entri_id uuid not null references entri_konten on delete cascade,
  isi jsonb not null,
  refs text[] not null default '{}',
  status status_revisi not null default 'draf',
  dibuat_oleh uuid not null default auth.uid() references auth.users,
  diperiksa_oleh uuid references auth.users,
  catatan_review text,
  dibuat_pada timestamptz not null default now(),
  diperiksa_pada timestamptz
);
create index on revisi (entri_id);
alter table entri_konten add foreign key (revisi_terbit_id) references revisi;

create table diksi (
  kunci text primary key check (kunci ~ '^[a-z0-9_]+(\.[a-z0-9_]+)+$'),
  halaman text not null,
  revisi_terbit_id uuid,
  versi_terbit bigint
);

create table revisi_diksi (
  id uuid primary key default gen_random_uuid(),
  kunci text not null references diksi on delete cascade,
  id_teks text not null,
  ar_teks text,
  catatan text,
  status status_revisi not null default 'draf',
  dibuat_oleh uuid not null default auth.uid() references auth.users,
  diperiksa_oleh uuid references auth.users,
  catatan_review text,
  dibuat_pada timestamptz not null default now(),
  diperiksa_pada timestamptz
);
create index on revisi_diksi (kunci);
alter table diksi add foreign key (revisi_terbit_id) references revisi_diksi;

create table peran_pengguna (
  user_id uuid primary key references auth.users on delete cascade,
  peran peran not null
);

-- security definer supaya kebijakan RLS bisa membaca peran tanpa rekursi ke RLS peran_pengguna.
create function peran_saya() returns peran
language sql stable security definer set search_path = public as $$
  select peran from peran_pengguna where user_id = auth.uid()
$$;

-- Aturan yang sama dengan periksaRefs di packages/content/src/editorial.ts.
create function periksa_refs_revisi() returns trigger
language plpgsql set search_path = public as $$
declare
  jenis_entri text;
  tak_dikenal text;
begin
  select string_agg(kode, ', ') into tak_dikenal
    from unnest(new.refs) as kode where kode not in (select d.kode from daftar_refs d);
  if tak_dikenal is not null then raise exception 'ref tidak ada di KB: %', tak_dikenal; end if;
  select jenis into jenis_entri from entri_konten where id = new.entri_id;
  if jenis_entri in ('materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'ahwal', 'syahid')
     and cardinality(new.refs) = 0 then
    raise exception '% wajib punya minimal satu ref', jenis_entri;
  end if;
  return new;
end $$;
create trigger periksa_refs before insert or update of refs, entri_id on revisi
  for each row execute function periksa_refs_revisi();

-- Revisi tidak pernah diedit setelah diajukan; perubahan = revisi baru.
create function bekukan_revisi() returns trigger
language plpgsql as $$
begin
  if old.status <> 'draf' and (to_jsonb(new) - array['status', 'diperiksa_oleh', 'catatan_review', 'diperiksa_pada'])
                              is distinct from (to_jsonb(old) - array['status', 'diperiksa_oleh', 'catatan_review', 'diperiksa_pada']) then
    raise exception 'revisi yang sudah diajukan tidak bisa diubah';
  end if;
  return new;
end $$;
create trigger bekukan before update on revisi for each row execute function bekukan_revisi();
create trigger bekukan before update on revisi_diksi for each row execute function bekukan_revisi();
