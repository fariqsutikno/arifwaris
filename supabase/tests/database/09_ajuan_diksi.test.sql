-- supabase/tests/database/09_ajuan_diksi.test.sql
-- Admin menerbitkan diksi langsung; pembuat/admin memperbarui ajuan konten & diksi di tempat (tetap diajukan);
-- reviewer dan penulis lain tidak bisa.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@tes.local'),
  ('00000000-0000-0000-0000-00000000000d', 'penulis2@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'), ('00000000-0000-0000-0000-00000000000b', 'reviewer'),
  ('00000000-0000-0000-0000-00000000000c', 'admin'), ('00000000-0000-0000-0000-00000000000d', 'penulis');
insert into daftar_refs values ('R09-7', 9), ('R04-2', 4) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-000000000001', 'faq', 'ajuan');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'diajukan');
insert into diksi (kunci, halaman) values ('uji.satu', 'uji'), ('uji.dua', 'uji');
insert into revisi_diksi (id, kunci, id_teks, dibuat_oleh, status) values
  ('30000000-0000-0000-0000-000000000001', 'uji.satu', 'lama', '00000000-0000-0000-0000-00000000000a', 'diajukan'),
  ('30000000-0000-0000-0000-000000000002', 'uji.dua', 'draf admin', '00000000-0000-0000-0000-00000000000c', 'draf'),
  ('30000000-0000-0000-0000-000000000003', 'uji.dua', 'draf penulis', '00000000-0000-0000-0000-00000000000a', 'draf');

set local role anon;
select throws_ok($$select terbitkan_langsung_diksi('30000000-0000-0000-0000-000000000002')$$, '42501', null, 'anon tidak punya hak execute');
reset role;
set local role authenticated;

-- penulis pembuat ajuan
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select lives_ok($$select perbarui_ajuan('20000000-0000-0000-0000-000000000001', '{"v":2}', '{R04-2}')$$, 'pembuat memperbarui ajuan konten');
select lives_ok($$select perbarui_ajuan_diksi('30000000-0000-0000-0000-000000000001', 'baru', 'جديد')$$, 'pembuat memperbarui ajuan diksi');
select throws_ok($$select terbitkan_langsung_diksi('30000000-0000-0000-0000-000000000003')$$, 'P0001', 'hanya admin yang bisa menerbitkan langsung', 'penulis tidak menerbitkan diksi langsung');

-- penulis lain & reviewer
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select throws_ok($$select perbarui_ajuan('20000000-0000-0000-0000-000000000001', '{"v":3}', '{R09-7}')$$, 'P0001', null, 'penulis lain tidak bisa');
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select throws_ok($$select perbarui_ajuan_diksi('30000000-0000-0000-0000-000000000001', 'x', null)$$, 'P0001', null, 'reviewer tidak bisa');

-- admin
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select lives_ok($$select terbitkan_langsung_diksi('30000000-0000-0000-0000-000000000002')$$, 'admin menerbitkan diksi langsung');
select throws_ok($$select terbitkan_langsung_diksi('30000000-0000-0000-0000-000000000001')$$, 'P0001', 'hanya draf yang bisa diterbitkan langsung', 'ajuan bukan draf');
reset role;

select is((select (isi, refs, status)::text from revisi where id = '20000000-0000-0000-0000-000000000001'),
  ('{"v": 2}'::jsonb, '{R04-2}'::text[], 'diajukan'::status_revisi)::text, 'isi & refs ajuan konten diganti, tetap diajukan');
select is((select (id_teks, ar_teks, status)::text from revisi_diksi where id = '30000000-0000-0000-0000-000000000001'),
  ('baru', 'جديد', 'diajukan'::status_revisi)::text, 'teks ajuan diksi diganti, tetap diajukan');
select is((select revisi_terbit_id from diksi where kunci = 'uji.dua'), '30000000-0000-0000-0000-000000000002'::uuid, 'diksi terbit menunjuk revisi admin');
select is((select status from revisi_diksi where id = '30000000-0000-0000-0000-000000000002'), 'disetujui'::status_revisi, 'revisi admin disetujui');

select * from finish();
rollback;
