-- supabase/migrations/20260926000002_transisi.sql
-- Transisi status revisi (spec "Alur editorial"). Satu-satunya jalan mengubah status: RLS melarang update status
-- langsung. security definer supaya penerbitan (status, revisi_terbit_id, versi_konten) terjadi dalam satu transaksi.
-- Aturan peran sama dengan transisiRevisi di packages/content/src/editorial.ts.

-- Naikkan versi_konten dan kembalikan angka barunya.
create function naikkan_versi_konten() returns bigint
language sql security definer set search_path = public as $$
  update versi_konten set angka = angka + 1 where satu returning angka
$$;

create function periksa_boleh_memeriksa(p_pembuat uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if peran_saya() is null or peran_saya() = 'penulis' then
    raise exception 'hanya reviewer atau admin yang bisa memeriksa revisi';
  end if;
  if peran_saya() = 'reviewer' and p_pembuat = auth.uid() then
    raise exception 'reviewer tidak bisa memeriksa revisinya sendiri';
  end if;
end $$;

-- ===== revisi konten =====

create function ajukan_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update revisi set status = 'diajukan'
   where id = p_id and status = 'draf' and peran_saya() is not null
     and (dibuat_oleh = auth.uid() or peran_saya() = 'admin');
  if not found then raise exception 'revisi % tidak bisa diajukan', p_id; end if;
end $$;

create function setujui_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  select * into r from revisi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;

create function kembalikan_revisi(p_id uuid, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if coalesce(btrim(p_catatan), '') = '' then raise exception 'mengembalikan revisi wajib disertai catatan'; end if;
  select * into r from revisi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi set status = 'dikembalikan', diperiksa_oleh = auth.uid(), diperiksa_pada = now(), catatan_review = p_catatan
   where id = p_id;
end $$;

-- Rollback: menunjuk ulang revisi yang dulu pernah disetujui.
create function terbitkan_ulang_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if peran_saya() is null or peran_saya() = 'penulis' then raise exception 'hanya reviewer atau admin yang bisa rollback'; end if;
  select * into r from revisi where id = p_id and status = 'disetujui';
  if not found then raise exception 'hanya revisi disetujui yang bisa diterbitkan ulang'; end if;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;

-- ===== revisi diksi (aturan sama, tabel lain) =====

create function ajukan_revisi_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update revisi_diksi set status = 'diajukan'
   where id = p_id and status = 'draf' and peran_saya() is not null
     and (dibuat_oleh = auth.uid() or peran_saya() = 'admin');
  if not found then raise exception 'revisi diksi % tidak bisa diajukan', p_id; end if;
end $$;

create function setujui_revisi_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  select * into r from revisi_diksi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi diksi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi_diksi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update diksi set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where kunci = r.kunci;
end $$;

create function kembalikan_revisi_diksi(p_id uuid, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  if coalesce(btrim(p_catatan), '') = '' then raise exception 'mengembalikan revisi wajib disertai catatan'; end if;
  select * into r from revisi_diksi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi diksi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi_diksi set status = 'dikembalikan', diperiksa_oleh = auth.uid(), diperiksa_pada = now(), catatan_review = p_catatan
   where id = p_id;
end $$;

create function terbitkan_ulang_revisi_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  if peran_saya() is null or peran_saya() = 'penulis' then raise exception 'hanya reviewer atau admin yang bisa rollback'; end if;
  select * into r from revisi_diksi where id = p_id and status = 'disetujui';
  if not found then raise exception 'hanya revisi disetujui yang bisa diterbitkan ulang'; end if;
  update diksi set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where kunci = r.kunci;
end $$;

-- naikkan_versi_konten & periksa_boleh_memeriksa hanya untuk dipakai fungsi di atas.
revoke execute on function naikkan_versi_konten(), periksa_boleh_memeriksa(uuid) from public, anon, authenticated;
