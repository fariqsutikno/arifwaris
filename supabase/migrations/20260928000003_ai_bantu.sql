-- supabase/migrations/20260928000003_ai_bantu.sql
-- Fase 5 AI (C7): pemakaian Edge Function ai-bantu dicatat per pengguna untuk kuota harian; hanya Edge Function
-- (service role) yang menulis/membaca, jadi tanpa kebijakan RLS untuk klien.
-- Soal kuis yang dibuat dengan AI (isi.dibantuAi) wajib lewat review sebelum pertama kali tayang, termasuk bila
-- pembuatnya admin; sesudah pernah lolos review, suntingan berikutnya mengikuti aturan biasa.

create table pemakaian_ai (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  fitur text not null check (fitur in ('rapikan', 'drafKuis', 'saran')),
  berhasil boolean not null,
  token_masuk int,
  token_keluar int,
  pada timestamptz not null default now()
);
create index on pemakaian_ai (user_id, pada);
alter table pemakaian_ai enable row level security;

create or replace function terbitkan_langsung(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa menerbitkan langsung'; end if;
  select * into r from revisi where id = p_id and status = 'draf' for update;
  if not found then raise exception 'hanya draf yang bisa diterbitkan langsung'; end if;
  if exists (select 1 from entri_konten where id = r.entri_id and dibuang_pada is not null) then
    raise exception 'entri ada di Sampah; pulihkan dulu';
  end if;
  if coalesce((r.isi ->> 'dibantuAi')::boolean, false)
     and exists (select 1 from entri_konten where id = r.entri_id and revisi_terbit_id is null) then
    raise exception 'draf yang dibuat dengan AI wajib lewat review';
  end if;
  update revisi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;
