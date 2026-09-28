-- supabase/tests/database/10_ai_bantu.test.sql
-- Draf kuis dibantu AI tidak bisa diterbitkan langsung sebelum pernah lolos review; pemakaian_ai tertutup untuk klien.
begin;
select plan(4);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'admin@tes.local');
insert into peran_pengguna values ('00000000-0000-0000-0000-00000000000c', 'admin');
insert into daftar_refs values ('R04-2', 4) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-000000000001', 'soal_kuis', 'K-ai'), ('10000000-0000-0000-0000-000000000002', 'soal_kuis', 'K-biasa');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"dibantuAi": true}', '{R04-2}', '00000000-0000-0000-0000-00000000000c'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{}', '{R04-2}', '00000000-0000-0000-0000-00000000000c');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select throws_ok($$select terbitkan_langsung('20000000-0000-0000-0000-000000000001')$$, 'P0001', 'draf yang dibuat dengan AI wajib lewat review',
  'draf AI tidak bisa langsung terbit');
select lives_ok($$select terbitkan_langsung('20000000-0000-0000-0000-000000000002')$$, 'draf biasa tetap bisa langsung terbit');
select is((select count(*) from pemakaian_ai), 0::bigint, 'klien tidak melihat pemakaian_ai');
select throws_ok($$insert into pemakaian_ai (user_id, fitur, berhasil) values ('00000000-0000-0000-0000-00000000000c', 'rapikan', true)$$,
  '42501', null, 'klien tidak bisa menulis pemakaian_ai');

select * from finish();
rollback;
