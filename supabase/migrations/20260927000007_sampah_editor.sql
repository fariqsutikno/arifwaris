-- Sampah (soft delete) dan alur sunting portal. Tidak ada hapus permanen: entri hanya dipindah ke Sampah dan setiap
-- kejadiannya tercatat di jejak_entri, supaya semua perubahan tetap tertelusur.
--  * Entri belum pernah terbit: langsung ke Sampah (dibuang_pada) oleh pembuatnya atau admin.
--  * Entri pernah terbit: "revisi penghapusan" (revisi.hapus, isinya salinan revisi terbit) yang direview seperti
--    suntingan biasa; admin boleh langsung. Saat disetujui revisi itu jadi revisi terbit (penanda hapus) dan versi naik,
--    sehingga web yang menyinkron sejak versi lama tahu entri itu harus dibuang dari cache.
--  * Pulihkan: entri belum terbit oleh pembuatnya/admin; entri terbit oleh reviewer/admin (menayangkan lagi revisi
--    terakhir yang disetujui).
--  * tarik_revisi: pembuat menarik kembali pengajuannya (diajukan → draf) supaya bisa terus menyunting.
--  * terbitkan_langsung: admin menerbitkan drafnya tanpa antrean (simpan + ajukan + setujui dalam satu transaksi).
-- Aturan yang sama ada di caraBuangEntri, caraPulihkanEntri, transisiRevisi (packages/content/src/editorial.ts).

alter table revisi add column hapus boolean not null default false;
alter table entri_konten add column dibuang_pada timestamptz, add column dibuang_oleh uuid references auth.users;

create table jejak_entri (
  id uuid primary key default gen_random_uuid(),
  entri_id uuid not null references entri_konten on delete cascade,
  aksi text not null check (aksi in ('dibuang', 'buang_diajukan', 'dipulihkan')),
  pelaku uuid not null default auth.uid() references auth.users,
  pada timestamptz not null default now(),
  catatan text
);
create index on jejak_entri (entri_id);
alter table jejak_entri enable row level security;
-- Hanya dibaca tim; ditulis lewat fungsi security definer di bawah (tidak ada kebijakan tulis).
create policy baca on jejak_entri for select to authenticated using (peran_saya() is not null);

-- Draf biasa tidak boleh diam-diam jadi penanda hapus; revisi penghapusan hanya lahir lewat buang_entri.
create policy bukan_hapus on revisi as restrictive for insert to authenticated with check (not hapus);
create policy bukan_hapus_ubah on revisi as restrictive for update to authenticated using (true) with check (not hapus);
-- Entri di Sampah tidak disunting; pulihkan dulu.
create policy bukan_sampah on revisi as restrictive for insert to authenticated
  with check (not exists (select 1 from entri_konten e where e.id = entri_id and e.dibuang_pada is not null));

create function penanda_hapus_terbit(e entri_konten) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select hapus from revisi where id = e.revisi_terbit_id), false)
$$;

-- Mengembalikan 'dibuang' (langsung masuk Sampah) atau 'diajukan' (menunggu review).
create function buang_entri(p_entri uuid, p_alasan text default null) returns text
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
    update revisi set status = 'draf' where entri_id = p_entri and status = 'diajukan';
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

create function pulihkan_entri(p_entri uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  e entri_konten;
  v_revisi uuid;
begin
  if peran_saya() is null then raise exception 'belum punya peran'; end if;
  select * into e from entri_konten where id = p_entri for update;
  if not found then raise exception 'entri % tidak ditemukan', p_entri; end if;

  if e.dibuang_pada is not null then
    if peran_saya() = 'reviewer'
       or (peran_saya() = 'penulis' and exists (select 1 from revisi where entri_id = p_entri and dibuat_oleh <> auth.uid())) then
      raise exception 'hanya pembuat entri atau admin yang bisa memulihkannya';
    end if;
    update entri_konten set dibuang_pada = null, dibuang_oleh = null where id = p_entri;
  elsif penanda_hapus_terbit(e) then
    if peran_saya() = 'penulis' then raise exception 'hanya reviewer atau admin yang bisa memulihkan entri yang pernah terbit'; end if;
    select id into v_revisi from revisi where entri_id = p_entri and status = 'disetujui' and not hapus
      order by coalesce(diperiksa_pada, dibuat_pada) desc limit 1;
    if v_revisi is null then raise exception 'tidak ada revisi disetujui untuk ditayangkan lagi'; end if;
    update entri_konten set revisi_terbit_id = v_revisi, versi_terbit = naikkan_versi_konten() where id = p_entri;
  else
    raise exception 'entri tidak ada di Sampah';
  end if;
  insert into jejak_entri (entri_id, aksi) values (p_entri, 'dipulihkan');
end $$;

-- Pengajuan penghapusan yang ditarik tidak kembali jadi draf (penanda hapus tak bisa disunting), melainkan ditutup
-- sebagai "dikembalikan" dengan catatan, supaya tetap tercatat di riwayat.
create function tarik_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  select * into r from revisi where id = p_id and status = 'diajukan' for update;
  if not found or peran_saya() is null or peran_saya() = 'reviewer' or (r.dibuat_oleh <> auth.uid() and peran_saya() <> 'admin') then
    raise exception 'revisi % tidak bisa ditarik kembali', p_id;
  end if;
  if r.hapus then
    update revisi set status = 'dikembalikan', diperiksa_oleh = auth.uid(), diperiksa_pada = now(),
      catatan_review = 'pengajuan ditarik kembali' where id = p_id;
  else
    update revisi set status = 'draf' where id = p_id;
  end if;
end $$;

create function terbitkan_langsung(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa menerbitkan langsung'; end if;
  select * into r from revisi where id = p_id and status = 'draf' for update;
  if not found then raise exception 'hanya draf yang bisa diterbitkan langsung'; end if;
  if exists (select 1 from entri_konten where id = r.entri_id and dibuang_pada is not null) then
    raise exception 'entri ada di Sampah; pulihkan dulu';
  end if;
  update revisi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;

-- Nama anggota tim (tanpa email) untuk riwayat & alasan terkunci; hanya untuk pengguna berperan.
create function daftar_nama_tim() returns table (user_id uuid, nama text)
language plpgsql stable security definer set search_path = public as $$
begin
  if peran_saya() is null then raise exception 'belum punya peran'; end if;
  return query
    select p.user_id, coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email::text, '@', 1))::text
      from peran_pengguna p join auth.users u on u.id = p.user_id;
end $$;

revoke execute on function penanda_hapus_terbit(entri_konten) from public, anon, authenticated;
revoke execute on function buang_entri(uuid, text), pulihkan_entri(uuid), tarik_revisi(uuid), terbitkan_langsung(uuid),
  daftar_nama_tim() from public, anon;
