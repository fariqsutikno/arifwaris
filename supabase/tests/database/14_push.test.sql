-- supabase/tests/database/14_push.test.sql
-- Spec push notifikasi: siapa dikirimi apa, kapan. Streak terancam (>= 3 hari, hari ini belum aktif, 17:00-19:59 lokal, mendesak,
-- tanpa batas harian) dan peringkat mingguan (Senin 08:00-09:59 lokal, maksimal satu kabar biasa per hari). Kunci unik mencegah dobel,
-- sakelar profil dan langganan menentukan siapa yang masuk, dan hanya service role yang boleh memilih kandidat.
-- Waktu acuan: Kamis 2026-10-01 18:00 WIB (streak) dan Senin 2026-10-05 08:30 WIB (peringkat pekan lalu = minggu 09-28).
begin;
select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'p1@tes.local'), ('00000000-0000-0000-0000-0000000000f2', 'p2@tes.local'),
  ('00000000-0000-0000-0000-0000000000f3', 'p3@tes.local'), ('00000000-0000-0000-0000-0000000000f4', 'p4@tes.local'),
  ('00000000-0000-0000-0000-0000000000f5', 'p5@tes.local'), ('00000000-0000-0000-0000-0000000000f6', 'p6@tes.local');
insert into profil (user_id, nama_tampilan, ikut_papan_peringkat, zona_waktu, push_streak) values
  ('00000000-0000-0000-0000-0000000000f1', 'Satu', true, 'Asia/Jakarta', true),
  ('00000000-0000-0000-0000-0000000000f2', 'Dua', true, 'Asia/Jakarta', true),
  ('00000000-0000-0000-0000-0000000000f3', 'Tiga', false, 'Asia/Jakarta', true),
  ('00000000-0000-0000-0000-0000000000f4', 'Empat', true, 'Asia/Jakarta', false),
  ('00000000-0000-0000-0000-0000000000f5', 'Lima', true, 'Asia/Jakarta', true),
  ('00000000-0000-0000-0000-0000000000f6', 'Enam', true, 'Asia/Jayapura', true);

insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-0000000000f1', 'materi', 'm1'), ('10000000-0000-0000-0000-0000000000f2', 'materi', 'm2'),
  ('10000000-0000-0000-0000-0000000000f3', 'materi', 'm3');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into revisi (id, entri_id, isi, dibuat_oleh, status, refs) values
  ('20000000-0000-0000-0000-0000000000f1', '10000000-0000-0000-0000-0000000000f1', '{}', '00000000-0000-0000-0000-0000000000f1', 'disetujui', '{R09-7}'),
  ('20000000-0000-0000-0000-0000000000f2', '10000000-0000-0000-0000-0000000000f2', '{}', '00000000-0000-0000-0000-0000000000f1', 'disetujui', '{R09-7}'),
  ('20000000-0000-0000-0000-0000000000f3', '10000000-0000-0000-0000-0000000000f3', '{}', '00000000-0000-0000-0000-0000000000f1', 'disetujui', '{R09-7}');
update entri_konten set revisi_terbit_id = ('20000000' || substr(id::text, 9))::uuid, versi_terbit = 1 where slug in ('m1', 'm2', 'm3');

-- f1, f4, f5: streak 3 (09-28..09-30). f6 sama tetapi di WIT. f3: streak 3 yang sudah aktif hari ini (09-29..10-01).
-- f2: pelajaran m1 di minggu 09-21 dan m2 di minggu 09-28, tanpa streak.
insert into log_kegiatan (user_id, jenis, slug, benar, terjadi_pada)
select u, 'pelajaran', m, null, (t || ' 09:00+07')::timestamptz
from (values
  ('00000000-0000-0000-0000-0000000000f1'::uuid, 'm1', '2026-09-28'), ('00000000-0000-0000-0000-0000000000f1', 'm2', '2026-09-29'), ('00000000-0000-0000-0000-0000000000f1', 'm3', '2026-09-30'),
  ('00000000-0000-0000-0000-0000000000f4', 'm1', '2026-09-28'), ('00000000-0000-0000-0000-0000000000f4', 'm2', '2026-09-29'), ('00000000-0000-0000-0000-0000000000f4', 'm3', '2026-09-30'),
  ('00000000-0000-0000-0000-0000000000f5', 'm1', '2026-09-28'), ('00000000-0000-0000-0000-0000000000f5', 'm2', '2026-09-29'), ('00000000-0000-0000-0000-0000000000f5', 'm3', '2026-09-30'),
  ('00000000-0000-0000-0000-0000000000f3', 'm1', '2026-09-29'), ('00000000-0000-0000-0000-0000000000f3', 'm2', '2026-09-30'), ('00000000-0000-0000-0000-0000000000f3', 'm3', '2026-10-01'),
  ('00000000-0000-0000-0000-0000000000f2', 'm1', '2026-09-22'), ('00000000-0000-0000-0000-0000000000f2', 'm2', '2026-09-29')
) as v(u, m, t);
insert into log_kegiatan (user_id, jenis, slug, benar, terjadi_pada) values
  ('00000000-0000-0000-0000-0000000000f6', 'pelajaran', 'm1', null, '2026-09-28 09:00+09'),
  ('00000000-0000-0000-0000-0000000000f6', 'pelajaran', 'm2', null, '2026-09-29 09:00+09'),
  ('00000000-0000-0000-0000-0000000000f6', 'pelajaran', 'm3', null, '2026-09-30 09:00+09');

-- Semua punya langganan kecuali f5.
insert into langganan_push (user_id, endpoint, p256dh, auth) select u, 'https://push.tes/' || u, 'k', 'a'
from unnest(array['00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f3',
  '00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000f6']::uuid[]) as u;

-- ===== streak terancam =====
select results_eq($$select user_id, jenis, kunci, parameter, tautan, mendesak from kandidat_push('2026-10-01 18:00+07') where jenis = 'streak_terancam'$$,
  $$values ('00000000-0000-0000-0000-0000000000f1'::uuid, 'streak_terancam', 'streak_terancam:2026-10-01', '{"jumlah": 3}'::jsonb, '#/belajar', true)$$,
  'hanya f1: streak 3, belum aktif, jam 18 WIB; f3 sudah aktif, f4 mematikan sakelar, f5 tanpa langganan, f6 sudah jam 20 di WIT');
select results_eq($$select user_id from kandidat_push('2026-10-01 16:00+07')$$, $$values ('00000000-0000-0000-0000-0000000000f6'::uuid)$$,
  'jam 16 WIB = 18 WIT: hanya f6, jendela jam mengikuti zona waktu profil');
select is((select count(*) from kandidat_push('2026-10-01 20:00+07') where user_id = '00000000-0000-0000-0000-0000000000f1'), 0::bigint, 'jam 20 lokal sudah lewat jendela');
select is((select count(*) from kandidat_push('2026-10-01 12:00+07')), 0::bigint, 'sebelum jam 17 tidak ada kiriman');

-- Streak 2 hari tidak diingatkan: f2 hanya aktif 09-29.
select is((select count(*) from kandidat_push('2026-10-01 18:00+07') where user_id = '00000000-0000-0000-0000-0000000000f2'), 0::bigint, 'streak di bawah 3 hari tidak diingatkan');

-- Kabar mendesak tidak terkena batas harian: kabar biasa hari ini tidak menghalanginya.
insert into kirim_push (user_id, jenis, kunci, judul, isi, mendesak, dikirim_pada) values
  ('00000000-0000-0000-0000-0000000000f1', 'peringkat_pekan', 'peringkat_pekan:2026-09-28', 'j', 'i', false, '2026-10-01 10:00+07');
select is((select count(*) from kandidat_push('2026-10-01 18:00+07') where user_id = '00000000-0000-0000-0000-0000000000f1'), 1::bigint,
  'kabar biasa hari ini tidak menghalangi kabar mendesak');
insert into kirim_push (user_id, jenis, kunci, judul, isi, mendesak, dikirim_pada) values
  ('00000000-0000-0000-0000-0000000000f1', 'streak_terancam', 'streak_terancam:2026-10-01', 'j', 'i', true, '2026-10-01 18:00+07');
select is((select count(*) from kandidat_push('2026-10-01 18:15+07') where user_id = '00000000-0000-0000-0000-0000000000f1'), 0::bigint,
  'kunci yang sudah dikirim tidak dikirim lagi walau jadwal berjalan tiap 15 menit');
select is((select count(*) from kandidat_push('2026-10-02 18:00+07') where user_id = '00000000-0000-0000-0000-0000000000f1'), 0::bigint,
  'besoknya streak f1 sudah putus (kemarin tidak aktif), jadi tidak ada kiriman');

-- ===== peringkat mingguan =====
-- Minggu 09-28: f1, f4, f5, f6 masing-masing 36 XP (peringkat 1, seri); f2 12 XP (peringkat 5); f3 tidak ikut papan.
-- Minggu 09-21: hanya f2 (12 XP, peringkat 1) -> turun 4. f1 tanpa pekan sebelumnya -> awal.
select results_eq($$select user_id, jenis, kunci, parameter, tautan, mendesak from kandidat_push('2026-10-05 08:30+07')
    where user_id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2') order by user_id$$,
  $$values ('00000000-0000-0000-0000-0000000000f1'::uuid, 'peringkat_pekan', 'peringkat_pekan:2026-10-05', '{"peringkat": 1, "arah": "awal", "selisih": 0}'::jsonb, '#/peringkat', false),
           ('00000000-0000-0000-0000-0000000000f2', 'peringkat_pekan', 'peringkat_pekan:2026-10-05', '{"peringkat": 5, "arah": "turun", "selisih": 4}', '#/peringkat', false)$$,
  'Senin pagi: peringkat pekan lalu, dengan arah dan selisih dari pekan sebelumnya');
select is((select count(*) from kandidat_push('2026-10-05 08:30+07') where user_id = '00000000-0000-0000-0000-0000000000f3'), 0::bigint, 'yang tidak ikut papan tidak dikirimi peringkat');
select is((select count(*) from kandidat_push('2026-10-05 08:30+07') where user_id = '00000000-0000-0000-0000-0000000000f5'), 0::bigint, 'tanpa langganan tidak dikirimi');
select is((select count(*) from kandidat_push('2026-10-06 08:30+07') where jenis = 'peringkat_pekan'), 0::bigint, 'hanya Senin');
select is((select count(*) from kandidat_push('2026-10-05 11:00+07') where jenis = 'peringkat_pekan'), 0::bigint, 'hanya jam 08:00-09:59');

update profil set push_peringkat = false where user_id = '00000000-0000-0000-0000-0000000000f1';
select is((select count(*) from kandidat_push('2026-10-05 08:30+07') where user_id = '00000000-0000-0000-0000-0000000000f1'), 0::bigint, 'sakelar peringkat dihormati');

insert into kirim_push (user_id, jenis, kunci, judul, isi, mendesak, dikirim_pada) values
  ('00000000-0000-0000-0000-0000000000f2', 'peringkat_pekan', 'kabar-biasa-lain', 'j', 'i', false, '2026-10-05 07:00+07');
select is((select count(*) from kandidat_push('2026-10-05 08:30+07') where user_id = '00000000-0000-0000-0000-0000000000f2'), 0::bigint,
  'kabar biasa dibatasi satu per hari lokal');

-- ===== hak akses =====
-- Edge Function memanggil sebagai service_role, yang tidak boleh membaca auth.users secara langsung.
set local role service_role;
select lives_ok($$select * from kandidat_push('2026-10-05 08:30+07')$$, 'service role bisa memilih kandidat');

set local role anon;
select throws_ok($$select * from langganan_push$$, '42501', null, 'anon tidak bisa membaca langganan');
select throws_ok($$select * from kandidat_push(now())$$, '42501', null, 'anon tidak bisa memilih kandidat');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f1", "role": "authenticated"}';
select is((select count(*) from langganan_push), 1::bigint, 'pengguna hanya melihat langganannya sendiri');
select throws_ok($$insert into langganan_push (user_id, endpoint, p256dh, auth) values ('00000000-0000-0000-0000-0000000000f2', 'https://x', 'k', 'a')$$,
  '42501', null, 'tidak bisa mendaftarkan langganan atas nama orang lain');
select throws_ok($$insert into kirim_push (user_id, jenis, kunci, judul, isi, mendesak) values ('00000000-0000-0000-0000-0000000000f1', 'streak_terancam', 'x', 'j', 'i', true)$$,
  '42501', null, 'klien tidak bisa menulis log kiriman');
select throws_ok($$select * from kandidat_push(now())$$, '42501', null, 'klien tidak bisa memilih kandidat');

select * from finish();
rollback;
