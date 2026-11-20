-- supabase/tests/database/16_email_terverifikasi.test.sql
-- K1: kasus berakses 'email' hanya terbuka bagi JWT penyedia google; penyedia email (tanpa verifikasi) ditolak.
begin;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'pemilik@tes.local'),
  ('00000000-0000-0000-0000-0000000000f2', 'teman@tes.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f1", "role": "authenticated", "email": "pemilik@tes.local", "app_metadata": {"provider": "google"}}';
insert into kasus_dibagikan (id_riwayat, slug, akses, email, kasus) values ('r1', 'kasus-teman', 'email', '{teman@tes.local}', '{"a":1}');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated", "email": "teman@tes.local", "app_metadata": {"provider": "email"}}';
select is(baca_kasus_dibagikan('kasus-teman') ->> 'status', 'tidak_boleh', 'provider email: email yang sama ditolak');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated", "email": "teman@tes.local"}';
select is(baca_kasus_dibagikan('kasus-teman') ->> 'status', 'tidak_boleh', 'tanpa app_metadata: ditolak');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated", "email": "teman@tes.local", "app_metadata": {"provider": "google"}}';
select is(baca_kasus_dibagikan('kasus-teman') ->> 'status', 'ok', 'provider google: email terdaftar boleh');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f1", "role": "authenticated", "email": "pemilik@tes.local", "app_metadata": {"provider": "email"}}';
select is(baca_kasus_dibagikan('kasus-teman') ->> 'status', 'ok', 'pemilik tetap membaca kasusnya sendiri');

select * from finish();
rollback;
