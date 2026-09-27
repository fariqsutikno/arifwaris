-- supabase/tests/database/05_urutan.test.sql
-- atur_urutan: admin & penulis boleh, reviewer ditolak, satu jenis saja, status revisi tak berubah, entri terbit naik versi.
begin;
select plan(8);

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
  ('10000000-0000-0000-0000-000000000001', 'faq', 'satu', 10),
  ('10000000-0000-0000-0000-000000000002', 'faq', 'dua', 20),
  ('10000000-0000-0000-0000-000000000003', 'kitab', 'kitab', 10);
insert into revisi (id, entri_id, isi, refs, dibuat_oleh, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'disetujui'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{"v":2}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'draf');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000001', versi_terbit = -1
  where id = '10000000-0000-0000-0000-000000000001';

set local role authenticated;

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select throws_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001']::uuid[])$$,
  'P0001', null, 'reviewer tidak boleh mengatur urutan');

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003']::uuid[])$$,
  'P0001', null, 'campur jenis ditolak');
select throws_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001']::uuid[])$$,
  'P0001', null, 'id ganda ditolak');
select throws_ok($$select atur_urutan(array[]::uuid[])$$, 'P0001', null, 'daftar kosong ditolak');
select lives_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001']::uuid[])$$,
  'penulis mengatur urutan');

reset role;
select results_eq($$select slug, urutan from entri_konten where jenis = 'faq' order by urutan$$,
  $$values ('dua'::text, 10), ('satu'::text, 20)$$, 'urutan = posisi * 10');
select results_eq($$select status::text from revisi order by id$$, $$values ('disetujui'), ('draf')$$, 'status revisi tidak berubah');
select ok((select e.versi_terbit = v.angka from entri_konten e, versi_konten v where e.id = '10000000-0000-0000-0000-000000000001'),
  'entri terbit mendapat versi_terbit terbaru');

select * from finish();
rollback;
