-- Arsip: entri ditarik dari web tanpa dibuang (niatnya "disimpan", bukan "dihapus"). Semua peran boleh langsung
-- mengarsipkan & mengeluarkan dari arsip, tanpa review. Isi & revisi tidak disentuh; entri terbit mendapat versi_terbit
-- baru supaya web yang menyinkron membuang/mengambil lagi entri itu. Kejadiannya tercatat di jejak_entri.
alter table entri_konten add column diarsipkan_pada timestamptz, add column diarsipkan_oleh uuid references auth.users;

alter table jejak_entri drop constraint jejak_entri_aksi_check;
alter table jejak_entri add constraint jejak_entri_aksi_check
  check (aksi in ('dibuang', 'buang_diajukan', 'dipulihkan', 'diarsipkan', 'dikeluarkan_arsip'));

create function arsipkan_entri(p_entri uuid, p_alasan text default null) returns void
language plpgsql security definer set search_path = public as $$
declare e entri_konten;
begin
  if peran_saya() is null then raise exception 'belum punya peran'; end if;
  select * into e from entri_konten where id = p_entri for update;
  if not found then raise exception 'entri % tidak ditemukan', p_entri; end if;
  if e.diarsipkan_pada is not null then raise exception 'entri sudah diarsipkan'; end if;
  if e.dibuang_pada is not null or penanda_hapus_terbit(e) then raise exception 'entri ada di Sampah; pulihkan dulu'; end if;
  update entri_konten set diarsipkan_pada = now(), diarsipkan_oleh = auth.uid(),
    versi_terbit = case when revisi_terbit_id is null then versi_terbit else naikkan_versi_konten() end
    where id = p_entri;
  insert into jejak_entri (entri_id, aksi, catatan) values (p_entri, 'diarsipkan', nullif(btrim(p_alasan), ''));
end $$;

create function keluarkan_arsip_entri(p_entri uuid) returns void
language plpgsql security definer set search_path = public as $$
declare e entri_konten;
begin
  if peran_saya() is null then raise exception 'belum punya peran'; end if;
  select * into e from entri_konten where id = p_entri for update;
  if not found then raise exception 'entri % tidak ditemukan', p_entri; end if;
  if e.diarsipkan_pada is null then raise exception 'entri tidak diarsipkan'; end if;
  update entri_konten set diarsipkan_pada = null, diarsipkan_oleh = null,
    versi_terbit = case when revisi_terbit_id is null then versi_terbit else naikkan_versi_konten() end
    where id = p_entri;
  insert into jejak_entri (entri_id, aksi) values (p_entri, 'dikeluarkan_arsip');
end $$;

revoke execute on function arsipkan_entri(uuid, text), keluarkan_arsip_entri(uuid) from public, anon;
