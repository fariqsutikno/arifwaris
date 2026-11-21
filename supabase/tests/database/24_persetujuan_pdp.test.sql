-- supabase/tests/database/24_persetujuan_pdp.test.sql
-- PDP dasar: papan opt-in, persetujuan append-only dengan efek langsung, unduh data hanya milik pemanggil,
-- dan setiap FK ke auth.users cascade (kecuali jejak editorial yang terdaftar).
begin;
select plan(12);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'a@tes.local', '{"full_name":"Aisyah Putri"}'),
  ('00000000-0000-0000-0000-0000000000e2', 'b@tes.local', '{}');
insert into entri_konten (id, jenis, slug, revisi_terbit_id) values ('00000000-0000-0000-0000-0000000000f1', 'soal_kuis', 'K-77', null);
insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', '{"tingkat":"dasar"}', '{R01-1}', 'disetujui', '00000000-0000-0000-0000-0000000000e1');
update entri_konten set revisi_terbit_id = '00000000-0000-0000-0000-0000000000f2' where id = '00000000-0000-0000-0000-0000000000f1';
insert into log_kegiatan (id, user_id, jenis, slug, benar) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', 'kuis', 'K-77', true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e2', 'kuis', 'K-77', true);

-- Papan: pengguna baru (tanpa profil) tidak tampil; tampil setelah ikut.
select is((select count(*) from papan_peringkat_pada('semua', 10, now(), null)), 0::bigint, 'pengguna baru tidak tampil di papan');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated"}';
select lives_ok($$select atur_persetujuan('papan_peringkat', true, 1)$$, 'ikut papan lewat atur_persetujuan');
select is((select nama_tampilan from profil), 'Aisyah', 'nama awal = nama depan akun, bukan email');
select is((select count(*) from papan_peringkat('semua', 10)), 1::bigint, 'tampil setelah ikut; yang belum ikut tidak');

-- Menarik persetujuan langsung berlaku.
select atur_persetujuan('papan_peringkat', false, 1);
select is((select count(*) from papan_peringkat('semua', 10)), 0::bigint, 'menarik persetujuan langsung menyembunyikan dari papan');
select is((select setuju from persetujuan_saya() where jenis = 'papan_peringkat'), false, 'keadaan efektif = baris terakhir');

-- Append-only: tidak ada tulis langsung, tidak bisa membaca milik orang lain.
select throws_ok($$insert into persetujuan (jenis, versi, setuju) values ('push', 1, true)$$, '42501', null, 'tidak bisa menyisipkan langsung');
select throws_ok($$delete from persetujuan$$, '42501', null, 'tidak bisa menghapus baris persetujuan');
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e2", "role": "authenticated"}';
select is((select count(*) from persetujuan), 0::bigint, 'persetujuan orang lain tidak terbaca');

-- Unduh hanya baris milik pemanggil.
select is(jsonb_array_length(unduh_data_saya() -> 'log_kegiatan'), 1, 'unduh hanya log milik pemanggil');
select is((unduh_data_saya() -> 'log_kegiatan' -> 0 ->> 'user_id'), '00000000-0000-0000-0000-0000000000e2', 'baris yang diunduh milik pemanggil');
reset role;

-- Cascade: FK ke auth.users yang BUKAN cascade hanyalah jejak editorial ini; tabel data pengguna baru wajib cascade.
select is((select array_agg(conrelid::regclass::text || '.' || a.attname order by conrelid::regclass::text || '.' || a.attname) from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
  where c.contype = 'f' and c.confrelid = 'auth.users'::regclass and c.confdeltype <> 'c'),
  array['entri_konten.diarsipkan_oleh', 'entri_konten.dibuang_oleh', 'jejak_entri.pelaku', 'revisi.dibuat_oleh', 'revisi.diperiksa_oleh',
        'revisi_diksi.dibuat_oleh', 'revisi_diksi.diperiksa_oleh'],
  'semua FK data pengguna ke auth.users on delete cascade');

select * from finish();
rollback;
