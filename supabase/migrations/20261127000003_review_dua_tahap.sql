-- supabase/migrations/20261127000003_review_dua_tahap.sql
-- K1 (spec-soal-kuis-ribuan 5.1-5.2): soal_kuis lewat dua tahap: diajukan -> diperiksa (admin/reviewer, checklist 5
-- butir lengkap) -> disetujui (keilmuan/admin, terbit). Jenis lain tetap satu tahap. Revisi penanda-hapus tidak ikut
-- dua tahap (isinya salinan revisi terbit, tidak ada yang dicentang).
-- Aturan sama dengan transisiRevisi di packages/content/src/editorial.ts; ubah keduanya bersama.

-- Satu-satunya sumber jumlah butir; teks butir ada di spec 5.2 dan ditampilkan layar admin (K3).
create function jumlah_butir_ceklis() returns smallint
language sql immutable set search_path = public as $$ select 5::smallint $$;

create table ceklis_review (
  revisi_id uuid not null references revisi on delete cascade,
  butir smallint not null check (butir between 1 and jumlah_butir_ceklis()),
  dicentang_oleh uuid not null default auth.uid() references auth.users on delete cascade,
  dicentang_pada timestamptz not null default now(),
  primary key (revisi_id, butir)
);
alter table ceklis_review enable row level security;

create policy baca on ceklis_review for select to authenticated using (peran_saya() is not null);
create policy centang on ceklis_review for insert to authenticated
  with check (peran_saya() in ('admin', 'reviewer') and dicentang_oleh = auth.uid()
    and exists (select 1 from revisi where id = revisi_id and status = 'diajukan'));
create policy cabut on ceklis_review for delete to authenticated
  using (peran_saya() in ('admin', 'reviewer') and exists (select 1 from revisi where id = revisi_id and status = 'diajukan'));
grant select, insert, delete on ceklis_review to authenticated;

-- true bila revisi ini harus lewat dua tahap.
create function butuh_dua_tahap(p_revisi revisi) returns boolean
language sql stable set search_path = public as $$
  select not p_revisi.hapus
     and exists (select 1 from entri_konten where id = p_revisi.entri_id and jenis = 'soal_kuis')
$$;
revoke execute on function butuh_dua_tahap(revisi) from public, anon, authenticated;

-- Pemeriksa tidak memeriksa revisinya sendiri; berlaku juga untuk keilmuan.
create or replace function periksa_boleh_memeriksa(p_pembuat uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if peran_saya() is null or peran_saya() = 'penulis' then
    raise exception 'hanya reviewer atau admin yang bisa memeriksa revisi';
  end if;
  if peran_saya() in ('reviewer', 'keilmuan') and p_pembuat = auth.uid() then
    raise exception 'pemeriksa tidak bisa memeriksa revisinya sendiri';
  end if;
end $$;
revoke execute on function periksa_boleh_memeriksa(uuid) from public, anon, authenticated;

-- Tahap 1 soal_kuis: diajukan -> diperiksa.
create function periksa_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  select * into r from revisi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi % tidak sedang diajukan', p_id; end if;
  if not butuh_dua_tahap(r) then raise exception 'hanya soal kuis yang melewati tahap diperiksa'; end if;
  if peran_saya() is distinct from 'admin' and peran_saya() is distinct from 'reviewer' then
    raise exception 'hanya reviewer atau admin yang bisa memeriksa soal kuis';
  end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  if (select count(*) from ceklis_review where revisi_id = p_id) < jumlah_butir_ceklis() then
    raise exception 'checklist review belum lengkap';
  end if;
  update revisi set status = 'diperiksa', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
end $$;

create or replace function setujui_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  select * into r from revisi where id = p_id and status in ('diajukan', 'diperiksa') for update;
  if not found then raise exception 'revisi % tidak sedang menunggu persetujuan', p_id; end if;
  if butuh_dua_tahap(r) then
    if r.status <> 'diperiksa' then raise exception 'soal kuis harus diperiksa dulu sebelum disetujui'; end if;
    if peran_saya() is distinct from 'admin' and peran_saya() is distinct from 'keilmuan' then
      raise exception 'hanya keilmuan atau admin yang bisa menyetujui soal kuis';
    end if;
  elsif peran_saya() = 'keilmuan' then
    raise exception 'keilmuan hanya menyetujui soal kuis';
  end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;

create or replace function kembalikan_revisi(p_id uuid, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if coalesce(btrim(p_catatan), '') = '' then raise exception 'mengembalikan revisi wajib disertai catatan'; end if;
  select * into r from revisi where id = p_id and status in ('diajukan', 'diperiksa') for update;
  if not found then raise exception 'revisi % tidak sedang menunggu pemeriksaan', p_id; end if;
  if r.status = 'diajukan' and peran_saya() = 'keilmuan' then
    raise exception 'keilmuan hanya mengembalikan soal yang sudah diperiksa';
  end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi set status = 'dikembalikan', diperiksa_oleh = auth.uid(), diperiksa_pada = now(), catatan_review = p_catatan
   where id = p_id;
end $$;

-- Rollback tetap untuk reviewer/admin saja; keilmuan hanya punya tahap persetujuan soal kuis.
create or replace function terbitkan_ulang_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if peran_saya() is distinct from 'admin' and peran_saya() is distinct from 'reviewer' then
    raise exception 'hanya reviewer atau admin yang bisa rollback';
  end if;
  select * into r from revisi where id = p_id and status = 'disetujui';
  if not found then raise exception 'hanya revisi disetujui yang bisa diterbitkan ulang'; end if;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;

revoke execute on function periksa_revisi(uuid) from public, anon;
