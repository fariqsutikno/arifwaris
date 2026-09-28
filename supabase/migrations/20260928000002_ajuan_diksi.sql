-- supabase/migrations/20260928000002_ajuan_diksi.sql
-- Umpan balik putaran 2 (A2, A9.1): admin menerbitkan teks aplikasi langsung; pembuat (atau admin) memperbarui ajuannya
-- yang masih menunggu review tanpa menariknya dulu. Aturan peran sama dengan transisiRevisi aksi 'terbitkan' & 'perbarui'
-- di packages/content/src/editorial.ts.

create function terbitkan_langsung_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa menerbitkan langsung'; end if;
  select * into r from revisi_diksi where id = p_id and status = 'draf' for update;
  if not found then raise exception 'hanya draf yang bisa diterbitkan langsung'; end if;
  update revisi_diksi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update diksi set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where kunci = r.kunci;
end $$;

-- Ajuan diganti di tempat & tetap di antrean. Trigger bekukan melarang mengubah isi revisi berstatus diajukan, jadi di
-- dalam satu transaksi: kembali ke draf → ganti isi → diajukan lagi. Reviewer tidak pernah melihat keadaan antaranya.
create function perbarui_ajuan(p_id uuid, p_isi jsonb, p_refs text[]) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  select * into r from revisi where id = p_id and status = 'diajukan' and not hapus for update;
  if not found or peran_saya() is null or peran_saya() = 'reviewer' or (r.dibuat_oleh <> auth.uid() and peran_saya() <> 'admin') then
    raise exception 'ajuan % tidak bisa diperbarui', p_id;
  end if;
  update revisi set status = 'draf' where id = p_id;
  update revisi set isi = p_isi, refs = p_refs, dibuat_pada = now() where id = p_id;
  update revisi set status = 'diajukan' where id = p_id;
end $$;

create function perbarui_ajuan_diksi(p_id uuid, p_id_teks text, p_ar_teks text) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  select * into r from revisi_diksi where id = p_id and status = 'diajukan' for update;
  if not found or peran_saya() is null or peran_saya() = 'reviewer' or (r.dibuat_oleh <> auth.uid() and peran_saya() <> 'admin') then
    raise exception 'ajuan % tidak bisa diperbarui', p_id;
  end if;
  update revisi_diksi set status = 'draf' where id = p_id;
  update revisi_diksi set id_teks = p_id_teks, ar_teks = p_ar_teks, dibuat_pada = now() where id = p_id;
  update revisi_diksi set status = 'diajukan' where id = p_id;
end $$;

revoke execute on function terbitkan_langsung_diksi(uuid), perbarui_ajuan(uuid, jsonb, text[]), perbarui_ajuan_diksi(uuid, text, text)
  from public, anon;
