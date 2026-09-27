-- supabase/tests/database/07_peringkat_otomatis.test.sql
-- Keputusan 2026-09-28: papan opt-out. Tanpa baris profil tetap tampil dengan nama depan Google (bukan email);
-- ikut_papan_peringkat = false menyembunyikan.
begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'rahasia@tes.local', '{"full_name": "Aisyah binti Abi Bakr"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'tanpanama@tes.local', '{}'),
  ('00000000-0000-0000-0000-0000000000f3', 'sembunyi@tes.local', '{"full_name": "Sembunyi"}');
insert into profil (user_id, nama_tampilan, ikut_papan_peringkat) values ('00000000-0000-0000-0000-0000000000f3', 'Sembunyi', false);

insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-0000000000f1', 'soal_kuis', 'K-f');
insert into revisi (id, entri_id, isi, dibuat_oleh, status, refs) values
  ('20000000-0000-0000-0000-0000000000f1', '10000000-0000-0000-0000-0000000000f1', '{}', '00000000-0000-0000-0000-0000000000f1', 'disetujui', '{R09-7}');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-0000000000f1', versi_terbit = 1 where slug = 'K-f';
insert into log_kegiatan (user_id, jenis, slug, benar, terjadi_pada)
  select id, 'kuis', 'K-f', true, '2026-09-29 12:00+07' from auth.users
  where id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f3');

select results_eq(
  $$select nama_tampilan from papan_peringkat_pada('semua', 10, '2026-09-30 10:00+07', null) order by 1$$,
  $$values ('Aisyah'), ('Pengguna')$$,
  'tanpa profil tetap tampil: nama depan Google, atau "Pengguna"; yang menyembunyikan diri tidak');
select ok(not exists (select 1 from papan_peringkat_pada('semua', 10, '2026-09-30 10:00+07', null) where nama_tampilan like '%@%'),
  'email tidak pernah tampil');
select is((select avatar from papan_peringkat_pada('semua', 10, '2026-09-30 10:00+07', null) where nama_tampilan = 'Aisyah'), null,
  'avatar tetap mati tanpa izin');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated"}';
insert into profil (nama_tampilan) values ('Baru');
select is((select ikut_papan_peringkat from profil), true, 'profil baru ikut papan secara bawaan');
select throws_ok($$select nama_bawaan('{}')$$, '42501', null, 'fungsi internal tidak bisa dipanggil klien');

select * from finish();
rollback;
