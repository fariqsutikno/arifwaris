-- Melengkapi K1: (1) membuang entri soal kuis juga menarik revisi 'diperiksa' ke draf, bukan hanya 'diajukan';
-- (2) checklist dihapus begitu revisi kembali ke draf (perbarui_ajuan, buang, tarik), supaya centang lama tidak
-- berlaku untuk isi yang sudah berubah.
create or replace function buang_entri(p_entri uuid, p_alasan text default null) returns text
language plpgsql security definer set search_path = public as $$
declare
  e entri_konten;
  terbit revisi;
  v_id uuid;
  v_alasan text := nullif(btrim(p_alasan), '');
begin
  if peran_saya() is null or peran_saya() not in ('admin', 'penulis') then raise exception 'perlu peran admin/penulis'; end if;
  select * into e from entri_konten where id = p_entri for update;
  if not found then raise exception 'entri % tidak ditemukan', p_entri; end if;
  if e.dibuang_pada is not null or penanda_hapus_terbit(e) then raise exception 'entri sudah di Sampah'; end if;

  if e.revisi_terbit_id is null then
    if peran_saya() = 'penulis' and exists (select 1 from revisi where entri_id = p_entri and dibuat_oleh <> auth.uid()) then
      raise exception 'entri ini memuat revisi orang lain; hanya admin yang bisa membuangnya';
    end if;
    -- Pengajuan yang masih menunggu ditarik kembali supaya tidak bisa disetujui selama di Sampah.
    update revisi set status = 'draf' where entri_id = p_entri and status in ('diajukan', 'diperiksa');
    update entri_konten set dibuang_pada = now(), dibuang_oleh = auth.uid() where id = p_entri;
    insert into jejak_entri (entri_id, aksi, catatan) values (p_entri, 'dibuang', v_alasan);
    return 'dibuang';
  end if;

  if exists (select 1 from revisi where entri_id = p_entri and hapus and status = 'diajukan') then
    raise exception 'pemindahan ke Sampah sudah diajukan';
  end if;
  select * into terbit from revisi where id = e.revisi_terbit_id;
  insert into revisi (entri_id, isi, refs, status, hapus) values (p_entri, terbit.isi, terbit.refs, 'diajukan', true)
    returning id into v_id;
  if peran_saya() = 'admin' then
    update revisi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = v_id;
    update entri_konten set revisi_terbit_id = v_id, versi_terbit = naikkan_versi_konten() where id = p_entri;
    insert into jejak_entri (entri_id, aksi, catatan) values (p_entri, 'dibuang', v_alasan);
    return 'dibuang';
  end if;
  insert into jejak_entri (entri_id, aksi, catatan) values (p_entri, 'buang_diajukan', v_alasan);
  return 'diajukan';
end $$;

create function hapus_ceklis_basi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'draf' and old.status is distinct from 'draf' then delete from ceklis_review where revisi_id = new.id; end if;
  return new;
end $$;
revoke execute on function hapus_ceklis_basi() from public, anon, authenticated;
create trigger hapus_ceklis_basi after update of status on revisi for each row execute function hapus_ceklis_basi();
