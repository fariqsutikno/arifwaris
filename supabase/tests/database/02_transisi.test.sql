-- supabase/tests/database/02_transisi.test.sql
-- Transisi status lewat fungsi: aturan peran sama dengan transisiRevisi di packages/content, dan penerbitan atomik.
begin;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer'),
  ('00000000-0000-0000-0000-00000000000c', 'admin');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-000000000001', 'faq', 'contoh');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '{"v":2}', '{R09-7}', '00000000-0000-0000-0000-00000000000b');
insert into diksi (kunci, halaman) values ('hitung.lanjut', 'hitung');
insert into revisi_diksi (id, kunci, id_teks, dibuat_oleh) values
  ('30000000-0000-0000-0000-000000000001', 'hitung.lanjut', 'Lanjut', '00000000-0000-0000-0000-00000000000a');

set local role authenticated;

-- penulis
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select lives_ok($$select ajukan_revisi('20000000-0000-0000-0000-000000000001')$$, 'penulis mengajukan drafnya');
select throws_ok($$select ajukan_revisi('20000000-0000-0000-0000-000000000002')$$, 'P0001', null, 'penulis tidak bisa mengajukan draf orang lain');
select throws_ok($$select setujui_revisi('20000000-0000-0000-0000-000000000001')$$, 'P0001', null, 'penulis tidak bisa menyetujui');
select lives_ok($$select ajukan_revisi_diksi('30000000-0000-0000-0000-000000000001')$$, 'penulis mengajukan draf diksi');

-- reviewer
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select lives_ok($$select ajukan_revisi('20000000-0000-0000-0000-000000000002')$$, 'reviewer mengajukan drafnya sendiri');
select throws_ok($$select setujui_revisi('20000000-0000-0000-0000-000000000002')$$, 'P0001', null, 'reviewer tidak bisa menyetujui revisinya sendiri');
select throws_ok($$select kembalikan_revisi('20000000-0000-0000-0000-000000000001', '  ')$$, 'P0001', null, 'kembalikan tanpa catatan ditolak');
select lives_ok($$select setujui_revisi('20000000-0000-0000-0000-000000000001')$$, 'reviewer menyetujui revisi penulis');
select lives_ok($$select setujui_revisi_diksi('30000000-0000-0000-0000-000000000001')$$, 'reviewer menyetujui diksi');

reset role;
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-000000000001'),
          '20000000-0000-0000-0000-000000000001'::uuid, 'setujui menunjuk revisi terbit');
select is((select angka from versi_konten), 2::bigint, 'versi_konten naik sekali per penerbitan');
select is((select versi_terbit from entri_konten where id = '10000000-0000-0000-0000-000000000001'), 1::bigint, 'entri mencatat versi terbitnya');

-- rollback: admin menyetujui revisi reviewer, lalu menerbitkan ulang revisi lama
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select setujui_revisi('20000000-0000-0000-0000-000000000002');
select terbitkan_ulang_revisi('20000000-0000-0000-0000-000000000001');
reset role;
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-000000000001'),
          '20000000-0000-0000-0000-000000000001'::uuid, 'rollback menerbitkan ulang revisi lama');

select * from finish();
rollback;
