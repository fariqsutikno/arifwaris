-- supabase/migrations/20260926000004_rls.sql
-- Siapa boleh apa (spec "Dijaga RLS"). Status revisi dan revisi_terbit_id hanya berubah lewat fungsi transisi
-- (security definer), jadi tidak ada kebijakan update yang mengizinkannya.

alter table daftar_refs enable row level security;
alter table versi_konten enable row level security;
alter table entri_konten enable row level security;
alter table revisi enable row level security;
alter table diksi enable row level security;
alter table revisi_diksi enable row level security;
alter table peran_pengguna enable row level security;
alter table riwayat_hitung enable row level security;
alter table progres_belajar enable row level security;
alter table progres_latihan enable row level security;
alter table preferensi enable row level security;

-- ===== baca publik =====
create policy baca on daftar_refs for select using (true);
create policy baca on versi_konten for select using (true);
create policy baca on entri_konten for select using (revisi_terbit_id is not null or peran_saya() is not null);
create policy baca on revisi for select
  using (peran_saya() is not null or id in (select revisi_terbit_id from entri_konten where revisi_terbit_id is not null));
create policy baca on diksi for select using (revisi_terbit_id is not null or peran_saya() is not null);
create policy baca on revisi_diksi for select
  using (peran_saya() is not null or id in (select revisi_terbit_id from diksi where revisi_terbit_id is not null));

-- ===== tim konten =====
-- Entri baru: penulis/admin. Ubah urutan/slug & hapus: admin saja. Kolom revisi_terbit_id/versi_terbit tidak
-- diberikan ke authenticated sama sekali (lihat revoke di bawah).
create policy tambah on entri_konten for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and revisi_terbit_id is null);
create policy ubah on entri_konten for update to authenticated using (peran_saya() = 'admin');
create policy hapus on entri_konten for delete to authenticated using (peran_saya() = 'admin');
create policy tambah on diksi for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and revisi_terbit_id is null);
create policy ubah on diksi for update to authenticated using (peran_saya() = 'admin');

-- Draf: dibuat & disunting pembuatnya (atau admin) selama masih draf. Reviewer tidak menulis draf lewat tabel.
create policy tambah on revisi for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and status = 'draf' and dibuat_oleh = auth.uid());
create policy ubah_draf on revisi for update to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin') and peran_saya() in ('admin', 'penulis'))
  with check (status = 'draf');
create policy hapus_draf on revisi for delete to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin'));
create policy tambah on revisi_diksi for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and status = 'draf' and dibuat_oleh = auth.uid());
create policy ubah_draf on revisi_diksi for update to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin') and peran_saya() in ('admin', 'penulis'))
  with check (status = 'draf');
create policy hapus_draf on revisi_diksi for delete to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin'));

-- Penunjuk terbit hanya berubah lewat fungsi transisi.
-- Supabase memberi UPDATE tingkat tabel; revoke per kolom tidak mencabutnya, jadi cabut tabel lalu beri kolom yang boleh.
revoke update on entri_konten, diksi from anon, authenticated;
grant update (jenis, slug, urutan) on entri_konten to authenticated;
grant update (halaman) on diksi to authenticated;
revoke insert, update, delete on daftar_refs, versi_konten from anon, authenticated;

-- ===== peran =====
create policy baca on peran_pengguna for select to authenticated using (user_id = auth.uid() or peran_saya() = 'admin');
create policy kelola on peran_pengguna for all to authenticated using (peran_saya() = 'admin') with check (peran_saya() = 'admin');

-- ===== data pengguna: hanya pemiliknya =====
create policy milik_sendiri on riwayat_hitung for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milik_sendiri on progres_belajar for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milik_sendiri on progres_latihan for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milik_sendiri on preferensi for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
