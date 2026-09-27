-- supabase/tests/database/06_hapus.test.sql
-- Hapus entri: yang pernah terbit lewat revisi penghapusan (diajukan → disetujui reviewer), tetap terbit sampai
-- disetujui; yang belum terbit dihapus langsung (penulis hanya bila semua revisinya milik sendiri). Draf biasa tidak
-- bisa ditandai hapus lewat tabel.
begin;
select plan(15);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer'),
  ('00000000-0000-0000-0000-00000000000c', 'admin');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug, urutan) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'terbit', 10),
  ('10000000-0000-0000-0000-000000000002', 'faq', 'draf-sendiri', 20),
  ('10000000-0000-0000-0000-000000000003', 'faq', 'draf-admin', 30);
insert into revisi (id, entri_id, isi, refs, dibuat_oleh, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'disetujui'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{"v":2}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'draf'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '{"v":3}', '{R09-7}', '00000000-0000-0000-0000-00000000000c', 'draf');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000001', versi_terbit = 1
  where id = '10000000-0000-0000-0000-000000000001';

set local role anon;
select throws_ok($$select ajukan_hapus_entri('10000000-0000-0000-0000-000000000001')$$, '42501', null, 'anon tidak punya hak execute');
reset role;

set local role authenticated;

-- penulis
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$insert into revisi (entri_id, isi, refs, hapus) values ('10000000-0000-0000-0000-000000000002', '{}', '{R09-7}', true)$$,
  '42501', null, 'draf tidak bisa langsung ditandai hapus');
select throws_ok($$update revisi set hapus = true where id = '20000000-0000-0000-0000-000000000002'$$,
  '42501', null, 'draf tidak bisa diubah jadi penanda hapus');
select throws_ok($$select hapus_entri_belum_terbit('10000000-0000-0000-0000-000000000001')$$,
  'P0001', 'entri pernah terbit; penghapusan harus diajukan untuk direview', 'entri terbit tidak bisa dihapus langsung');
select throws_ok($$select ajukan_hapus_entri('10000000-0000-0000-0000-000000000002')$$,
  'P0001', 'entri belum terbit; hapus langsung tanpa pengajuan', 'entri belum terbit tidak diajukan');
select throws_ok($$select hapus_entri_belum_terbit('10000000-0000-0000-0000-000000000003')$$,
  'P0001', 'entri ini memuat revisi orang lain; hanya admin yang bisa menghapusnya', 'penulis tidak menghapus entri berisi revisi orang lain');
select lives_ok($$select hapus_entri_belum_terbit('10000000-0000-0000-0000-000000000002')$$, 'penulis menghapus entri drafnya sendiri');
select lives_ok($$select ajukan_hapus_entri('10000000-0000-0000-0000-000000000001')$$, 'penulis mengajukan hapus entri terbit');
select throws_ok($$select ajukan_hapus_entri('10000000-0000-0000-0000-000000000001')$$,
  'P0001', 'penghapusan entri ini sudah diajukan', 'pengajuan hapus ganda ditolak');

-- reviewer
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select throws_ok($$select ajukan_hapus_entri('10000000-0000-0000-0000-000000000001')$$, 'P0001', 'perlu peran admin/penulis', 'reviewer tidak mengajukan hapus');
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-000000000001'),
  '20000000-0000-0000-0000-000000000001'::uuid, 'sebelum disetujui entri tetap terbit dengan revisi lama');
select lives_ok($$select setujui_revisi((select id from revisi where hapus and status = 'diajukan'))$$, 'reviewer menyetujui penghapusan');

-- admin
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select lives_ok($$select hapus_entri_belum_terbit('10000000-0000-0000-0000-000000000003')$$, 'admin menghapus entri belum terbit milik siapa pun');

reset role;
select ok((select r.hapus and e.versi_terbit = v.angka from entri_konten e join revisi r on r.id = e.revisi_terbit_id, versi_konten v
  where e.id = '10000000-0000-0000-0000-000000000001'), 'revisi terbit kini penanda hapus dengan versi_terbit terbaru');
select results_eq($$select slug from entri_konten where id::text like '10000000-%'$$, $$values ('terbit'::text)$$,
  'entri belum terbit terhapus permanen, entri terbit tetap ada sebagai penanda');

select * from finish();
rollback;
