-- Menghapus entri konten dari portal. Entri yang pernah terbit dihapus lewat acc: "revisi penghapusan" (hapus = true)
-- masuk antrean review seperti suntingan biasa, isinya salinan revisi terbit supaya diff & riwayat tetap utuh. Saat
-- disetujui, setujui_revisi menunjuknya sebagai revisi terbit (penanda hapus) dan menaikkan versi, sehingga web yang
-- menyinkron sejak versi lama tahu entri itu harus dibuang. Rollback = terbitkan ulang revisi lama.
-- Entri yang belum pernah terbit tidak tampil di web, jadi boleh langsung dihapus permanen tanpa acc.
-- Aturan yang sama ada di caraHapusEntri (packages/content/src/editorial.ts).

alter table revisi add column hapus boolean not null default false;

-- Draf biasa tidak boleh diam-diam jadi penanda hapus; revisi penghapusan hanya lahir lewat ajukan_hapus_entri.
create policy bukan_hapus on revisi as restrictive for insert to authenticated with check (not hapus);
create policy bukan_hapus_ubah on revisi as restrictive for update to authenticated using (true) with check (not hapus);

create function ajukan_hapus_entri(p_entri uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  e entri_konten;
  terbit revisi;
  v_id uuid;
begin
  if peran_saya() is null or peran_saya() not in ('admin', 'penulis') then raise exception 'perlu peran admin/penulis'; end if;
  select * into e from entri_konten where id = p_entri for update;
  if not found then raise exception 'entri % tidak ditemukan', p_entri; end if;
  if e.revisi_terbit_id is null then raise exception 'entri belum terbit; hapus langsung tanpa pengajuan'; end if;
  select * into terbit from revisi where id = e.revisi_terbit_id;
  if terbit.hapus then raise exception 'entri sudah dihapus'; end if;
  if exists (select 1 from revisi where entri_id = p_entri and hapus and status = 'diajukan') then
    raise exception 'penghapusan entri ini sudah diajukan';
  end if;
  insert into revisi (entri_id, isi, refs, status, hapus)
    values (p_entri, terbit.isi, terbit.refs, 'diajukan', true)
    returning id into v_id;
  return v_id;
end $$;

create function hapus_entri_belum_terbit(p_entri uuid) returns void
language plpgsql security definer set search_path = public as $$
declare e entri_konten;
begin
  if peran_saya() is null or peran_saya() not in ('admin', 'penulis') then raise exception 'perlu peran admin/penulis'; end if;
  select * into e from entri_konten where id = p_entri for update;
  if not found then raise exception 'entri % tidak ditemukan', p_entri; end if;
  if e.revisi_terbit_id is not null then raise exception 'entri pernah terbit; penghapusan harus diajukan untuk direview'; end if;
  if peran_saya() = 'penulis' and exists (select 1 from revisi where entri_id = p_entri and dibuat_oleh <> auth.uid()) then
    raise exception 'entri ini memuat revisi orang lain; hanya admin yang bisa menghapusnya';
  end if;
  delete from entri_konten where id = p_entri;
end $$;

revoke execute on function ajukan_hapus_entri(uuid), hapus_entri_belum_terbit(uuid) from public, anon;
