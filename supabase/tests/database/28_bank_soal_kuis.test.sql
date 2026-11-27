-- supabase/tests/database/28_bank_soal_kuis.test.sql
-- K5: bank_soal bentuk 'kuis' + persetujuan aturan pengecoh (RLS) + cari_soal bentuk (default hitung, kuis hanya aturan disetujui)
-- + contoh_soal_kuis (khusus keilmuan/admin).
begin;
select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'keilmuan@tes.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'admin@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-0000000000c1', 'keilmuan'),
  ('00000000-0000-0000-0000-0000000000c2', 'penulis'),
  ('00000000-0000-0000-0000-0000000000c3', 'admin');

-- 40 soal hitung (bawaan) dan 60 soal kuis: n genap = {lupaAul}, kelipatan 3 = {lupaRadd}, kelipatan 6 = keduanya, sisanya {lupaHajb}.
insert into bank_soal (kode, versi_generator, keluarga, tingkat, modul, label, jumlah_mayit, jumlah_ahli_waris)
select 'H-' || n, 1, 'biasa', 'dasar', '{3}', '{a}', 1, 3 from generate_series(1, 40) n;
insert into bank_soal (kode, versi_generator, keluarga, tingkat, modul, label, jumlah_mayit, jumlah_ahli_waris, bentuk, aturan)
select 'K-' || n, 1, 'biasa', (array['dasar', 'menengah'])[n % 2 + 1], '{6}', '{aul:6>7}', 1, 0, 'kuis',
  case when n % 6 = 0 then array['lupaAul', 'lupaRadd']
       when n % 2 = 0 then array['lupaAul']
       when n % 3 = 0 then array['lupaRadd']
       else array['lupaHajb'] end
from generate_series(1, 60) n;

select is((select count(*) from bank_soal where bentuk = 'hitung'), 40::bigint, 'baris lama/bawaan berbentuk hitung');

-- RLS aturan_pengecoh_disetujui
set local role anon;
select is((select count(*) from aturan_pengecoh_disetujui), 0::bigint, 'anonim bisa membaca (kosong)');
select throws_ok($$insert into aturan_pengecoh_disetujui (aturan) values ('lupaAul')$$, '42501', null, 'anonim tidak bisa menyetujui');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}';
select throws_ok($$insert into aturan_pengecoh_disetujui (aturan) values ('lupaAul')$$, '42501', null, 'penulis tidak bisa menyetujui');
reset role;

-- Sebelum ada persetujuan: kuis kosong, hitung tetap jalan (pemanggil lama).
set local role anon;
select is((select count(*) from cari_soal(100, 'x', p_bentuk => 'kuis')), 0::bigint, 'tanpa aturan disetujui, soal kuis tidak keluar');
select is((select count(*) from cari_soal(100, 'x')), 40::bigint, 'tanpa p_bentuk = hanya soal hitung (pemanggil lama tetap sama)');
select is((select count(*) from cari_soal(100, 'x', p_label_semua => array['aul:6>7'])), 0::bigint, 'soal kuis tak bocor lewat filter label pada bentuk bawaan');
select throws_ok($$select * from cari_soal(5, 'x', p_bentuk => 'lain')$$, 'PT400', 'bentuk harus hitung atau kuis', 'bentuk tak dikenal ditolak');
reset role;

-- keilmuan menyetujui lupaAul
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select lives_ok($$insert into aturan_pengecoh_disetujui (aturan) values ('lupaAul')$$, 'keilmuan bisa menyetujui aturan');
select is((select disetujui_oleh from aturan_pengecoh_disetujui where aturan = 'lupaAul'), '00000000-0000-0000-0000-0000000000c1'::uuid, 'pencatat persetujuan = pengguna yang masuk');
reset role;

set local role anon;
-- lupaAul saja = genap bukan kelipatan 3: 30 genap - 10 kelipatan 6 = 20. Yang memakai lupaRadd juga belum boleh tampil.
select is((select count(*) from cari_soal(100, 'x', p_bentuk => 'kuis')), 20::bigint, 'hanya soal yang semua aturannya disetujui');
select is((select count(*) from cari_soal(100, 'x', p_bentuk => 'kuis') k where k !~ '^K-'), 0::bigint, 'bentuk kuis tidak mengembalikan soal hitung');
select is((select array_agg(k) from cari_soal(20, 'benih-a', p_bentuk => 'kuis') k), (select array_agg(k) from cari_soal(20, 'benih-a', p_bentuk => 'kuis') k), 'deterministik terhadap benih');
reset role;

-- admin menyetujui lupaRadd lalu keilmuan mencabut lupaAul
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}';
select lives_ok($$insert into aturan_pengecoh_disetujui (aturan) values ('lupaRadd')$$, 'admin bisa menyetujui aturan');
reset role;
set local role anon;
select is((select count(*) from cari_soal(100, 'x', p_bentuk => 'kuis')), 40::bigint, 'dua aturan disetujui: soal berisi keduanya ikut (20 + 10 + 10)');
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
delete from aturan_pengecoh_disetujui where aturan = 'lupaAul';
select is((select count(*) from cari_soal(100, 'x', p_bentuk => 'kuis')), 10::bigint, 'persetujuan dicabut: hanya soal lupaRadd murni yang tersisa');

-- contoh_soal_kuis: terlepas dari persetujuan, hanya keilmuan/admin
select is((select count(*) from contoh_soal_kuis('lupaHajb', 5, 'b1')), 5::bigint, 'keilmuan melihat contoh aturan yang belum disetujui');
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}';
select throws_ok($$select * from contoh_soal_kuis('lupaHajb', 5, 'b1')$$, '42501', 'hanya keilmuan atau admin', 'penulis tidak bisa meminta contoh');
reset role;

select * from finish();
rollback;
