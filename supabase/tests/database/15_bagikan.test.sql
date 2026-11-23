-- supabase/tests/database/15_bagikan.test.sql
-- Bagikan kasus: slug unik & berformat (akses tautan wajib acak 16 karakter), akses privat/tautan/email, penerima hanya membaca, anon tidak bisa menyisir tabel.
begin;
select plan(19);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'pemilik@tes.local'),
  ('00000000-0000-0000-0000-0000000000e2', 'teman@tes.local'),
  ('00000000-0000-0000-0000-0000000000e3', 'asing@tes.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated", "email": "pemilik@tes.local"}';

insert into kasus_dibagikan (id_riwayat, slug, akses, kasus) values ('r1', 'umum0a1b2c3d4e5f', 'tautan', '{"a":1}');
insert into kasus_dibagikan (id_riwayat, slug, akses, email, kasus) values ('r2', 'kasus-teman', 'email', '{Teman@Tes.Local}', '{"a":2}');
insert into kasus_dibagikan (id_riwayat, slug, akses, kasus) values ('r3', 'kasus-pribadi', 'privat', '{"a":3}');

select throws_ok($$insert into kasus_dibagikan (id_riwayat, slug, akses, kasus) values ('r4', 'umum0a1b2c3d4e5f', 'tautan', '{}')$$,
  '23505', null, 'slug harus unik');
select throws_ok($$insert into kasus_dibagikan (id_riwayat, slug, akses, kasus) values ('r5', 'Tidak Sah!', 'email', '{}')$$,
  '23514', null, 'slug berformat huruf kecil, angka, strip');
select throws_ok($$insert into kasus_dibagikan (id_riwayat, slug, akses, kasus) values ('r6', '-ab', 'email', '{}')$$,
  '23514', null, 'slug tidak boleh diawali strip');
select throws_ok($$insert into kasus_dibagikan (id_riwayat, slug, akses, kasus) values ('r7', 'kasus-bebas', 'tautan', '{}')$$,
  '23514', null, 'akses tautan dengan nama bebas ditolak');
select lives_ok($$insert into kasus_dibagikan (id_riwayat, slug, akses, email, kasus) values ('r8', 'nama-bebas', 'email', '{a@b.co}', '{}')$$,
  'akses email boleh bernama bebas');
select ok(not has_table_privilege('authenticated', 'kasus_dibagikan', 'TRUNCATE'), 'authenticated tidak punya TRUNCATE');
select is(baca_kasus_dibagikan('kasus-pribadi') ->> 'status', 'ok', 'pemilik membaca kasus privatnya');
select is(tautan_bagikan_tersedia('umum0a1b2c3d4e5f', 'r1'), true, 'slug milik kasus sendiri tidak dianggap bentrok');
select is(tautan_bagikan_tersedia('umum0a1b2c3d4e5f', 'lain'), false, 'slug milik kasus lain tidak tersedia');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e2", "role": "authenticated", "email": "teman@tes.local", "app_metadata": {"provider": "google"}}';
select is(baca_kasus_dibagikan('kasus-teman') ->> 'status', 'ok', 'email terdaftar boleh (tanpa beda huruf besar)');
select is(baca_kasus_dibagikan('kasus-pribadi') ->> 'status', 'tidak_ada', 'kasus privat orang lain dilaporkan tidak ada');
select is((select count(*) from kasus_dibagikan), 0::bigint, 'baris orang lain tidak terbaca langsung');
select is_empty($$update kasus_dibagikan set akses = 'tautan' returning 1$$, 'penerima tidak bisa mengubah');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e3", "role": "authenticated", "email": "asing@tes.local"}';
select is(baca_kasus_dibagikan('kasus-teman') ->> 'status', 'tidak_boleh', 'email lain ditolak');
select is(baca_kasus_dibagikan('umum0a1b2c3d4e5f') ->> 'status', 'ok', 'akses tautan terbuka untuk yang sudah masuk');

select is(tautan_bagikan_tersedia('umum0a1b2c3d4e5f', 'r1'), false, 'pengguna lain: slug yang sudah dipakai tidak tersedia');

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is(baca_kasus_dibagikan('umum0a1b2c3d4e5f') -> 'kasus' ->> 'a', '1', 'anon membaca lewat tautan');
select is(baca_kasus_dibagikan('kasus-teman') ->> 'status', 'perlu_masuk', 'akses email: anon diminta masuk');
select throws_ok($$select * from kasus_dibagikan$$, '42501', null, 'anon tidak bisa menyisir tabel');

select * from finish();
rollback;
