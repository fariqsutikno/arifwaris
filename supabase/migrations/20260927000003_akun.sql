-- supabase/migrations/20260927000003_akun.sql
-- Akun pengguna (spec 2026-09-27): baris yang lebih lama tidak menimpa yang lebih baru (jam perangkat bisa salah),
-- dan log_kegiatan = catatan mentah untuk streak/leaderboard tahap 5 (hanya bisa ditambah, waktu dari server).

-- Dalam INSERT ... ON CONFLICT DO UPDATE, trigger BEFORE UPDATE yang mengembalikan null membatalkan pembaruan baris itu.
-- tg_argv[0] = nama kolom waktu.
create function tolak_data_lebih_lama() returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) ->> tg_argv[0])::timestamptz <= (to_jsonb(old) ->> tg_argv[0])::timestamptz then
    return null;
  end if;
  return new;
end $$;

create trigger terbaru_menang before update on riwayat_hitung
  for each row execute function tolak_data_lebih_lama('disimpan_pada');
create trigger terbaru_menang before update on progres_belajar
  for each row execute function tolak_data_lebih_lama('diubah_pada');
create trigger terbaru_menang before update on progres_latihan
  for each row execute function tolak_data_lebih_lama('diubah_pada');
create trigger terbaru_menang before update on preferensi
  for each row execute function tolak_data_lebih_lama('diubah_pada');

create table log_kegiatan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  jenis text not null check (jenis in ('pelajaran', 'soal', 'kuis')),
  slug text not null,
  benar boolean,
  terjadi_pada timestamptz not null default now()
);
create index log_kegiatan_pengguna_waktu on log_kegiatan (user_id, terjadi_pada);

alter table log_kegiatan enable row level security;
create policy tambah_sendiri on log_kegiatan for insert to authenticated with check (user_id = auth.uid());
create policy baca_sendiri on log_kegiatan for select to authenticated using (user_id = auth.uid());
-- Waktu hanya dari server: klien tidak diberi hak menulis kolom terjadi_pada.
revoke insert on log_kegiatan from authenticated;
grant insert (id, jenis, slug, benar) on log_kegiatan to authenticated;
