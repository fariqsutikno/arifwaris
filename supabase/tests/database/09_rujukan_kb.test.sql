-- supabase/tests/database/09_rujukan_kb.test.sql
-- Jenis rujukan: slug harus berbentuk kode; rujukan yang terbit otomatis masuk daftar_refs.
begin;
select plan(4);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local');
select throws_ok($$insert into entri_konten (jenis, slug) values ('rujukan', 'bukan-kode')$$, '23514', null, 'slug rujukan harus kode');
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-000000000009', 'rujukan', 'R09-99');
insert into revisi (id, entri_id, isi, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', '{}', '00000000-0000-0000-0000-00000000000a');
select is((select count(*) from daftar_refs where kode = 'R09-99'), 0::bigint, 'draf belum masuk daftar_refs');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000009' where id = '10000000-0000-0000-0000-000000000009';
select is((select bab from daftar_refs where kode = 'R09-99'), 9, 'terbit → masuk daftar_refs dengan babnya');
insert into entri_konten (jenis, slug) values ('faq', 'contoh-rujukan');
select lives_ok($$insert into revisi (entri_id, isi, refs, dibuat_oleh)
  select id, '{}', '{R09-99}', '00000000-0000-0000-0000-00000000000a' from entri_konten where slug = 'contoh-rujukan'$$, 'konten lain boleh merujuknya');

select * from finish();
rollback;
