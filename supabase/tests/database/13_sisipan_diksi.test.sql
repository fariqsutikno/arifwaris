-- supabase/tests/database/13_sisipan_diksi.test.sql
-- Revisi diksi tidak boleh mengubah himpunan {sisipan} dari teks terbit kuncinya (narasi & t() bergantung padanya).
begin;
select plan(4);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000b', 'penulis2@tes.local');
insert into diksi (kunci, halaman) values ('narasi.tes.contoh', 'narasi');
insert into revisi_diksi (id, kunci, id_teks, status, dibuat_oleh)
  values ('20000000-0000-0000-0000-000000000001', 'narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', 'disetujui', '00000000-0000-0000-0000-00000000000b');
update diksi set revisi_terbit_id = '20000000-0000-0000-0000-000000000001' where kunci = 'narasi.tes.contoh';

select lives_ok(
  $$insert into revisi_diksi (kunci, id_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Untuk {orang}: {jumlah}.', '00000000-0000-0000-0000-00000000000b')$$,
  'urutan sisipan boleh berubah');
select throws_ok(
  $$insert into revisi_diksi (kunci, id_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Harta untuk {orang}.', '00000000-0000-0000-0000-00000000000b')$$,
  'P0001', 'Teks harus tetap memuat bagian otomatis: {jumlah}, {orang}', 'sisipan hilang ditolak');
select throws_ok(
  $$insert into revisi_diksi (kunci, id_teks, ar_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', 'لـ{orang}', '00000000-0000-0000-0000-00000000000b')$$,
  'P0001', 'Teks harus tetap memuat bagian otomatis: {jumlah}, {orang}', 'sisipan hilang di teks Arab ditolak');
select lives_ok(
  $$insert into revisi_diksi (kunci, id_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', '00000000-0000-0000-0000-00000000000b')$$,
  'ar kosong tidak diperiksa');

select * from finish();
rollback;
