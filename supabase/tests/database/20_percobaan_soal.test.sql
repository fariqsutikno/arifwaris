-- supabase/tests/database/20_percobaan_soal.test.sql
-- percobaan_soal: klien hanya bisa membaca miliknya; tidak ada tulis; satu Kirim Ujian dan satu buka per sesi.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'a@tes.local'),
  ('00000000-0000-0000-0000-0000000000e2', 'b@tes.local');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0000-0000000000f1', 'soal_hitung', 'T-01');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', '{}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');

-- Penulis (service role / pemilik tabel) menyisipkan dua baris, satu per pengguna.
insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, versi) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 'T-01',
   '00000000-0000-0000-0000-0000000000f2', 'biasa', 'ujian', 'kirim', '{}'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a2', 'T-01',
   '00000000-0000-0000-0000-0000000000f2', 'biasa', 'latihan', 'buka', '{}');

select throws_ok($$insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, versi) values
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 'T-01',
   '00000000-0000-0000-0000-0000000000f2', 'biasa', 'ujian', 'kirim', '{}')$$,
  '23505', null, 'Kirim Ujian kedua dalam sesi yang sama ditolak indeks unik');
select throws_ok($$insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, versi) values
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a2', 'T-01',
   '00000000-0000-0000-0000-0000000000f2', 'biasa', 'latihan', 'buka', '{}')$$,
  '23505', null, 'buka kedua dalam sesi yang sama ditolak');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated"}';

select is((select count(*) from percobaan_soal), 1::bigint, 'hanya baris sendiri yang terbaca');
select throws_ok($$insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, versi) values
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a5', 'T-01',
   '00000000-0000-0000-0000-0000000000f2', 'biasa', 'latihan', 'periksa', '{}')$$,
  '42501', null, 'authenticated tidak bisa menyisipkan, termasuk untuk dirinya');
select throws_ok($$update percobaan_soal set benar_semua = true$$, '42501', null, 'authenticated tidak bisa mengubah');
select throws_ok($$delete from percobaan_soal$$, '42501', null, 'authenticated tidak bisa menghapus');

set local role anon;
select throws_ok($$select count(*) from percobaan_soal$$, '42501', null, 'anon tidak bisa membaca');
select throws_ok($$insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, versi) values
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a6', 'T-01',
   '00000000-0000-0000-0000-0000000000f2', 'biasa', 'latihan', 'periksa', '{}')$$,
  '42501', null, 'anon tidak bisa menulis');

select * from finish();
rollback;
