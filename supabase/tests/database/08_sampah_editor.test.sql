-- supabase/tests/database/08_sampah_editor.test.sql
-- Sampah (tanpa hapus permanen) & alur sunting: buang entri belum terbit langsung (penulis hanya bila semua revisinya
-- miliknya), entri terbit lewat pengajuan (admin langsung), pulihkan, jejak tercatat, entri di Sampah tidak disunting,
-- draf biasa tak bisa jadi penanda hapus, tarik kembali, terbitkan langsung khusus admin, nama tim.
begin;
select plan(25);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local', '{"full_name":"Aisyah"}'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local', '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@tes.local', '{}');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer'),
  ('00000000-0000-0000-0000-00000000000c', 'admin');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug, urutan) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'terbit', 10),
  ('10000000-0000-0000-0000-000000000002', 'faq', 'draf-sendiri', 20),
  ('10000000-0000-0000-0000-000000000003', 'faq', 'draf-admin', 30),
  ('10000000-0000-0000-0000-000000000004', 'faq', 'terbit-admin', 40);
insert into revisi (id, entri_id, isi, refs, dibuat_oleh, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'disetujui'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{"v":2}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'diajukan'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '{"v":3}', '{R09-7}', '00000000-0000-0000-0000-00000000000c', 'draf'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '{"v":4}', '{R09-7}', '00000000-0000-0000-0000-00000000000c', 'disetujui');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000001', versi_terbit = 1 where id = '10000000-0000-0000-0000-000000000001';
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000004', versi_terbit = 1 where id = '10000000-0000-0000-0000-000000000004';

set local role anon;
select throws_ok($$select buang_entri('10000000-0000-0000-0000-000000000001')$$, '42501', null, 'anon tidak punya hak execute');
reset role;

set local role authenticated;

-- penulis
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$insert into revisi (entri_id, isi, refs, hapus) values ('10000000-0000-0000-0000-000000000003', '{}', '{R09-7}', true)$$,
  '42501', null, 'draf tidak bisa langsung ditandai hapus');
select throws_ok($$select buang_entri('10000000-0000-0000-0000-000000000003')$$,
  'P0001', 'entri ini memuat revisi orang lain; hanya admin yang bisa membuangnya', 'penulis tidak membuang entri berisi revisi orang lain');
select is(buang_entri('10000000-0000-0000-0000-000000000002', ' salah buat '), 'dibuang', 'penulis membuang entri belum terbit miliknya');
select is((select status::text from revisi where id = '20000000-0000-0000-0000-000000000002'), 'draf', 'pengajuannya ditarik saat dibuang');
select throws_ok($$insert into revisi (entri_id, isi, refs) values ('10000000-0000-0000-0000-000000000002', '{}', '{R09-7}')$$,
  '42501', null, 'entri di Sampah tidak bisa disunting');
select throws_ok($$select buang_entri('10000000-0000-0000-0000-000000000002')$$, 'P0001', 'entri sudah di Sampah', 'buang ganda ditolak');
select lives_ok($$select pulihkan_entri('10000000-0000-0000-0000-000000000002')$$, 'penulis memulihkan entri belum terbit miliknya');
select is(buang_entri('10000000-0000-0000-0000-000000000001', 'duplikat'), 'diajukan', 'penulis mengajukan buang entri terbit');
select throws_ok($$select buang_entri('10000000-0000-0000-0000-000000000001')$$,
  'P0001', 'pemindahan ke Sampah sudah diajukan', 'pengajuan ganda ditolak');
select lives_ok($$select tarik_revisi((select id from revisi where hapus and status = 'diajukan'))$$, 'penulis membatalkan pengajuannya');
select is((select catatan_review from revisi where hapus), 'pengajuan ditarik kembali', 'pengajuan batal tercatat, tidak hilang');
select is(buang_entri('10000000-0000-0000-0000-000000000001'), 'diajukan', 'penulis mengajukan lagi');
select throws_ok($$select terbitkan_langsung('20000000-0000-0000-0000-000000000003')$$,
  'P0001', 'hanya admin yang bisa menerbitkan langsung', 'penulis tidak menerbitkan langsung');
select is((select nama from daftar_nama_tim() where user_id = '00000000-0000-0000-0000-00000000000b'), 'reviewer', 'nama tim: bagian depan email bila tanpa nama');

-- reviewer
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-000000000001'),
  '20000000-0000-0000-0000-000000000001'::uuid, 'sebelum disetujui entri tetap tayang');
select lives_ok($$select setujui_revisi((select id from revisi where hapus and status = 'diajukan'))$$, 'reviewer menyetujui pemindahan ke Sampah');
select ok((select r.hapus and e.versi_terbit = v.angka from entri_konten e join revisi r on r.id = e.revisi_terbit_id, versi_konten v
  where e.id = '10000000-0000-0000-0000-000000000001'), 'penanda hapus tayang dengan versi terbaru');
select lives_ok($$select pulihkan_entri('10000000-0000-0000-0000-000000000001')$$, 'reviewer memulihkan entri terbit');
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-000000000001'),
  '20000000-0000-0000-0000-000000000001'::uuid, 'versi terakhir yang disetujui tayang lagi');

-- admin
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is(buang_entri('10000000-0000-0000-0000-000000000004'), 'dibuang', 'admin langsung membuang entri terbit');
select lives_ok($$select terbitkan_langsung('20000000-0000-0000-0000-000000000003')$$, 'admin menerbitkan drafnya langsung');
select is((select status::text from revisi where id = '20000000-0000-0000-0000-000000000003'), 'disetujui', 'draf langsung disetujui');

reset role;
select results_eq($$select aksi from jejak_entri order by pada, aksi$$,
  $$values ('buang_diajukan'), ('buang_diajukan'), ('dibuang'), ('dibuang'), ('dipulihkan'), ('dipulihkan')$$, 'semua kejadian Sampah tercatat');
select is((select count(*)::int from entri_konten where id::text like '10000000-%'), 4, 'tidak ada entri yang terhapus permanen');

select * from finish();
rollback;
