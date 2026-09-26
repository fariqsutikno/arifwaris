-- supabase/tests/database/01_skema.test.sql
-- Tabel & constraint dasar: refs harus dikenal, jenis fikih wajib ref, revisi beku setelah diajukan.
begin;
select plan(8);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local');
insert into daftar_refs (kode, bab) values ('R09-7', 9), ('R04-2', 4) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'contoh'),
  ('10000000-0000-0000-0000-000000000002', 'cheatsheet', 'peta-hajb');

select throws_ok(
  $$insert into entri_konten (jenis, slug) values ('bukan_jenis', 'x')$$, '23514', null, 'jenis tak dikenal ditolak');
select throws_ok(
  $$insert into entri_konten (jenis, slug) values ('faq', 'contoh')$$, '23505', null, 'slug unik per jenis');
select throws_ok(
  $$insert into revisi (entri_id, isi, refs, dibuat_oleh) values ('10000000-0000-0000-0000-000000000001', '{}', '{R99-1}', '00000000-0000-0000-0000-00000000000a')$$,
  'P0001', 'ref tidak ada di KB: R99-1', 'ref tak dikenal ditolak');
select throws_ok(
  $$insert into revisi (entri_id, isi, refs, dibuat_oleh) values ('10000000-0000-0000-0000-000000000001', '{}', '{}', '00000000-0000-0000-0000-00000000000a')$$,
  'P0001', 'faq wajib punya minimal satu ref', 'jenis fikih tanpa ref ditolak');
select lives_ok(
  $$insert into revisi (entri_id, isi, refs, dibuat_oleh) values ('10000000-0000-0000-0000-000000000002', '{}', '{}', '00000000-0000-0000-0000-00000000000a')$$,
  'jenis non-fikih boleh tanpa ref');

insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"a":1}', '{R09-7}', 'diajukan', '00000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$update revisi set isi = '{"a":2}' where id = '20000000-0000-0000-0000-000000000001'$$,
  'P0001', 'revisi yang sudah diajukan tidak bisa diubah', 'isi revisi beku setelah diajukan');
select throws_ok(
  $$update revisi set refs = '{R04-2}' where id = '20000000-0000-0000-0000-000000000001'$$,
  'P0001', 'revisi yang sudah diajukan tidak bisa diubah', 'refs revisi beku setelah diajukan');
select is((select angka from versi_konten), 0::bigint, 'versi_konten mulai dari 0');

select * from finish();
rollback;
