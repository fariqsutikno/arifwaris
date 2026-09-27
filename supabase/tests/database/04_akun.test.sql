-- supabase/tests/database/04_akun.test.sql
-- Spec akun pengguna: data lebih lama tidak menimpa yang lebih baru; log_kegiatan hanya bisa ditambah pemiliknya.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'a@tes.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'b@tes.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated"}';

insert into progres_belajar (pelajaran_slug, selesai, diubah_pada) values ('ashabah-1', true, '2026-09-27T10:00Z');
insert into progres_belajar (pelajaran_slug, selesai, diubah_pada) values ('ashabah-1', false, '2026-09-27T09:00Z')
  on conflict (user_id, pelajaran_slug) do update set selesai = excluded.selesai, diubah_pada = excluded.diubah_pada;
select is((select selesai from progres_belajar), true, 'upsert dengan diubah_pada lebih lama diabaikan');

insert into progres_belajar (pelajaran_slug, selesai, diubah_pada) values ('ashabah-1', false, '2026-09-27T11:00Z')
  on conflict (user_id, pelajaran_slug) do update set selesai = excluded.selesai, diubah_pada = excluded.diubah_pada;
select is((select selesai from progres_belajar), false, 'upsert yang lebih baru menimpa');

insert into riwayat_hitung (id, kasus, judul, disimpan_pada) values ('k1', '{}', 'baru', '2026-09-27T10:00Z');
insert into riwayat_hitung (id, kasus, judul, disimpan_pada) values ('k1', '{}', 'lama', '2026-09-27T09:00Z')
  on conflict (user_id, id) do update set judul = excluded.judul, disimpan_pada = excluded.disimpan_pada;
select is((select judul from riwayat_hitung), 'baru', 'riwayat_hitung memakai disimpan_pada');

select lives_ok($$insert into log_kegiatan (id, jenis, slug, benar) values ('30000000-0000-0000-0000-000000000001', 'kuis', 'K-01', true)$$,
  'pemilik bisa menambah log');
select ok((select terjadi_pada from log_kegiatan) <= now(), 'terjadi_pada diisi server');
select throws_ok($$insert into log_kegiatan (jenis, slug, terjadi_pada) values ('kuis', 'K-02', '2020-01-01')$$,
  '42501', null, 'terjadi_pada tidak bisa diisi klien');
update log_kegiatan set slug = 'ubah';
delete from log_kegiatan;
select is((select slug from log_kegiatan), 'K-01', 'log tidak bisa diubah atau dihapus');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d2", "role": "authenticated"}';
select is((select count(*) from log_kegiatan), 0::bigint, 'log orang lain tidak terbaca');

select * from finish();
rollback;
