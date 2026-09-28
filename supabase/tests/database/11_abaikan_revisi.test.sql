-- supabase/tests/database/11_abaikan_revisi.test.sql
-- Revisi dikembalikan boleh dibuang (diabaikan) oleh pembuat atau admin; reviewer, penulis lain, dan revisi yang
-- bukan dikembalikan ditolak. Isi revisi tidak berubah.
begin;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000d', 'penulis2@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'), ('00000000-0000-0000-0000-00000000000b', 'reviewer'),
  ('00000000-0000-0000-0000-00000000000d', 'penulis');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-000000000001', 'faq', 'abaikan');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'dikembalikan'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '{"v":2}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'diajukan');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select throws_ok($$select abaikan_revisi('20000000-0000-0000-0000-000000000001')$$, 'P0001', null, 'penulis lain tidak bisa');
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select throws_ok($$select abaikan_revisi('20000000-0000-0000-0000-000000000001')$$, 'P0001', null, 'reviewer tidak bisa');
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$select abaikan_revisi('20000000-0000-0000-0000-000000000002')$$, 'P0001', null, 'ajuan yang masih menunggu tidak bisa dibuang');
select lives_ok($$select abaikan_revisi('20000000-0000-0000-0000-000000000001')$$, 'pembuat membuang revisi dikembalikan');
select throws_ok($$select abaikan_revisi('20000000-0000-0000-0000-000000000001')$$, 'P0001', null, 'sudah dibuang, tidak bisa dua kali');
reset role;

select is((select diabaikan from revisi where id = '20000000-0000-0000-0000-000000000001'), true, 'revisi bertanda diabaikan');
select is((select (isi, status)::text from revisi where id = '20000000-0000-0000-0000-000000000001'),
  ('{"v": 1}'::jsonb, 'dikembalikan'::status_revisi)::text, 'isi & status tetap (riwayat utuh)');

select * from finish();
rollback;
