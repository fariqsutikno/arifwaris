-- supabase/migrations/20261003000001_bagikan_kasus.sql
-- Bagikan kasus hitung lewat tautan pendek (#/k/<slug>). Satu baris per kasus (id riwayat) milik pemilik; isinya ikut
-- diperbarui pemilik (live). akses: privat (hanya pemilik), tautan (siapa pun yang punya tautan), email (hanya email terdaftar
-- yang sudah masuk). Penerima hanya membaca; tabel tidak dibuka ke anon, pembacaan lewat fungsi per slug supaya daftar
-- kasus tidak bisa disisir.

create table kasus_dibagikan (
  pemilik uuid not null default auth.uid() references auth.users on delete cascade,
  id_riwayat text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  akses text not null check (akses in ('privat', 'tautan', 'email')),
  email text[] not null default '{}' check (cardinality(email) <= 50),
  kasus jsonb not null check (pg_column_size(kasus) < 200000),
  diubah_pada timestamptz not null default now(),
  primary key (pemilik, id_riwayat)
);

alter table kasus_dibagikan enable row level security;
create policy milik_sendiri on kasus_dibagikan for all to authenticated
  using (pemilik = auth.uid()) with check (pemilik = auth.uid());
revoke all on kasus_dibagikan from anon;

-- Hasil: {status, kasus?, akses?, pemilik?}. status: ok | perlu_masuk | tidak_boleh | tidak_ada.
-- Kasus privat milik orang lain dilaporkan 'tidak_ada' supaya keberadaannya tidak bocor.
create function baca_kasus_dibagikan(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  baris kasus_dibagikan;
  surel text := lower(coalesce(auth.jwt() ->> 'email', ''));
  boleh boolean;
begin
  select * into baris from kasus_dibagikan where slug = p_slug;
  if not found or (baris.akses = 'privat' and baris.pemilik is distinct from auth.uid()) then
    return jsonb_build_object('status', 'tidak_ada');
  end if;
  boleh := baris.pemilik is not distinct from auth.uid() or baris.akses = 'tautan'
    or (baris.akses = 'email' and exists (select 1 from unnest(baris.email) as e where lower(e) = surel));
  if not boleh then
    return jsonb_build_object('status', case when auth.uid() is null then 'perlu_masuk' else 'tidak_boleh' end);
  end if;
  return jsonb_build_object('status', 'ok', 'kasus', baris.kasus, 'akses', baris.akses,
    'pemilik', baris.pemilik is not distinct from auth.uid());
end $$;
revoke execute on function baca_kasus_dibagikan(text) from public;
grant execute on function baca_kasus_dibagikan(text) to anon, authenticated;
