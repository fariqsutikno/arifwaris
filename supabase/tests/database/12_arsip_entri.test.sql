-- supabase/tests/database/12_arsip_entri.test.sql
-- Arsip: semua peran langsung mengarsipkan & mengeluarkan (tanpa review), entri terbit dapat versi baru, jejak tercatat,
-- entri di Sampah tidak bisa diarsipkan, anon tidak punya akses.
begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug, urutan, dibuang_pada) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'terbit', 10, null),
  ('10000000-0000-0000-0000-000000000002', 'faq', 'di-sampah', 20, now());
insert into revisi (id, entri_id, isi, refs, dibuat_oleh, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'disetujui');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000001', versi_terbit = 1 where id = '10000000-0000-0000-0000-000000000001';

set local role anon;
select throws_ok($$select arsipkan_entri('10000000-0000-0000-0000-000000000001')$$, '42501', null, 'anon tidak punya hak execute');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select lives_ok($$select arsipkan_entri('10000000-0000-0000-0000-000000000001', 'usang')$$, 'reviewer langsung mengarsipkan');
select throws_ok($$select arsipkan_entri('10000000-0000-0000-0000-000000000001')$$, 'P0001', 'entri sudah diarsipkan', 'tidak dua kali');
select throws_ok($$select arsipkan_entri('10000000-0000-0000-0000-000000000002')$$, 'P0001', 'entri ada di Sampah; pulihkan dulu', 'Sampah tidak diarsipkan');

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select lives_ok($$select keluarkan_arsip_entri('10000000-0000-0000-0000-000000000001')$$, 'penulis langsung mengeluarkan');
select throws_ok($$select keluarkan_arsip_entri('10000000-0000-0000-0000-000000000001')$$, 'P0001', 'entri tidak diarsipkan', 'tidak diarsipkan');
reset role;

select is((select diarsipkan_pada from entri_konten where id = '10000000-0000-0000-0000-000000000001'), null, 'tidak lagi diarsipkan');
select cmp_ok((select versi_terbit from entri_konten where id = '10000000-0000-0000-0000-000000000001'), '>', 1::bigint, 'versi terbit naik');
select results_eq($$select aksi, catatan from jejak_entri where entri_id = '10000000-0000-0000-0000-000000000001' order by aksi$$,
  $$values ('diarsipkan', 'usang'), ('dikeluarkan_arsip', null)$$, 'jejak tercatat');

select * from finish();
rollback;
