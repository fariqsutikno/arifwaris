-- supabase/tests/database/03_rls.test.sql
-- RLS (spec "Dijaga RLS"): anonim hanya melihat yang terbit; penulis tidak bisa mengubah status langsung;
-- pengguna A tidak bisa membaca data pengguna B.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000d', 'biasa-a@tes.local'),
  ('00000000-0000-0000-0000-00000000000e', 'biasa-b@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'terbit'),
  ('10000000-0000-0000-0000-000000000002', 'faq', 'belum');
insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{}', '{R09-7}', 'disetujui', '00000000-0000-0000-0000-00000000000a'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{}', '{R09-7}', 'draf', '00000000-0000-0000-0000-00000000000a');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000001' where id = '10000000-0000-0000-0000-000000000001';
insert into progres_belajar values ('00000000-0000-0000-0000-00000000000e', 'ashabah-1', true, now());

-- anonim
set local role anon;
select is((select count(*) from revisi), 1::bigint, 'anonim hanya melihat revisi terbit');
select is((select count(*) from entri_konten), 1::bigint, 'anonim hanya melihat entri yang punya revisi terbit');
select ok((select count(*) from daftar_refs) > 0, 'anonim bisa membaca daftar_refs');
select throws_ok($$insert into entri_konten (jenis, slug) values ('faq', 'x')$$, '42501', null, 'anonim tidak bisa menulis');

-- penulis
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*) from revisi), 2::bigint, 'penulis melihat semua revisi');
select lives_ok($$insert into revisi (entri_id, isi, refs) values ('10000000-0000-0000-0000-000000000002', '{}', '{R09-7}')$$, 'penulis membuat draf');
select throws_ok($$update revisi set status = 'disetujui' where id = '20000000-0000-0000-0000-000000000002'$$, '42501', null,
                 'penulis tidak bisa mengubah status langsung');
select throws_ok($$update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000002'$$, '42501', null,
                 'penulis tidak bisa menunjuk revisi terbit langsung');

-- reviewer tidak bisa update revisi langsung
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
update revisi set status = 'disetujui' where id = '20000000-0000-0000-0000-000000000002';
select is((select status from revisi where id = '20000000-0000-0000-0000-000000000002'), 'draf'::status_revisi,
          'reviewer juga harus lewat fungsi transisi');

-- pengguna biasa
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select is((select count(*) from progres_belajar), 0::bigint, 'A tidak melihat progres B');
select throws_ok($$insert into progres_belajar values ('00000000-0000-0000-0000-00000000000e', 'x', true, now())$$, '42501', null,
                 'A tidak bisa menulis atas nama B');
select lives_ok($$insert into preferensi (user_id, isi) values ('00000000-0000-0000-0000-00000000000d', '{"bahasa":"ar"}')$$,
                'A menulis preferensinya sendiri');

select * from finish();
rollback;
