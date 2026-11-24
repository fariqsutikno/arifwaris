-- supabase/tests/database/25_tangga_bantuan.test.sql
-- Tangga bantuan (spec-tangga-bantuan-soal bagian 5 dan 8): aturan aksi petunjuk/buka_kolom di catat_percobaan,
-- dan XP dasar 60% + bonus mandiri 40% dihitung lintas sesi. Kasus XP satu sesi ada di 22_xp_kasus (dibuat dari JSON).
begin;
select plan(11);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'a@tes.local');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0000-0000000000f1', 'soal_hitung', 'T-01');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', '{"bobotXp": 20}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');

create function uji_bantuan(p_id int, p_sesi int, p_mode text, p_aksi text, p_bantuan jsonb) returns jsonb language sql as $$
  select catat_percobaan('00000000-0000-0000-0000-0000000000e1', ('00000000-0000-0000-0000-0000000000' || lpad(p_id::text, 2, '0'))::uuid,
    ('00000000-0000-0000-0000-0000000001' || lpad(p_sesi::text, 2, '0'))::uuid, 'T-01', '00000000-0000-0000-0000-0000000000f2', 'biasa',
    p_mode, p_aksi, null, null, null, false, null, '{}', p_bantuan) $$;

-- Aturan aksi
select lives_ok($$select uji_bantuan(1, 1, 'latihan', 'petunjuk', '{"idKolom":"bagian","tingkat":1}')$$, 'petunjuk dicatat');
select is((uji_bantuan(1, 1, 'latihan', 'petunjuk', '{"idKolom":"bagian","tingkat":1}') ->> 'duplikat')::boolean, true, 'id sama isi sama = idempoten');
select throws_ok($$select uji_bantuan(1, 1, 'latihan', 'petunjuk', '{"idKolom":"bagian","tingkat":2}')$$, 'PT409', 'ID_BENTROK', 'bantuan berbeda dengan id sama = bentrok');
select lives_ok($$select uji_bantuan(2, 1, 'latihan', 'buka_kolom', '{"idKolom":"bagian"}')$$, 'buka kolom dicatat');
select throws_ok($$select uji_bantuan(3, 1, 'latihan', 'petunjuk', null)$$, 'PT400', 'AKSI_TIDAK_SESUAI_MODE', 'petunjuk tanpa bantuan ditolak');
select throws_ok($$select uji_bantuan(4, 1, 'latihan', 'periksa', '{"idKolom":"bagian"}')$$, 'PT400', 'AKSI_TIDAK_SESUAI_MODE', 'bantuan pada aksi lain ditolak');
select throws_ok($$select uji_bantuan(5, 2, 'ujian', 'petunjuk', '{"idKolom":"bagian","tingkat":1}')$$, 'PT400', 'AKSI_TIDAK_SESUAI_MODE', 'petunjuk di Ujian ditolak');

-- XP lintas sesi (bobot 20: dasar 12, bonus 8). Waktu eksplisit karena now() sama dalam satu transaksi.
create function uji_sisip(p_soal text, p_nomor int, p_sesi int, p_aksi text, p_benar boolean) returns void language sql as $$
  insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, benar_semua, diterima_pada, versi, bantuan)
  values (('00000000-0000-0000-0003-' || lpad(p_nomor::text, 12, '0'))::uuid, '00000000-0000-0000-0000-0000000000e1',
    ('00000000-0000-0000-0004-' || lpad(p_sesi::text, 12, '0'))::uuid, p_soal, '00000000-0000-0000-0000-0000000000f2', 'biasa', 'latihan', p_aksi, p_benar,
    timestamptz '2026-11-01 10:00+00' + p_nomor * interval '1 minute', '{}',
    case p_aksi when 'petunjuk' then '{"idKolom":"bagian","tingkat":1}'::jsonb when 'buka_kolom' then '{"idKolom":"bagian"}'::jsonb end) $$;
create function uji_xp(p_soal text) returns int language sql as $$
  select coalesce((select sum(xp) from xp_soal_baru('00000000-0000-0000-0000-0000000000e1') where soal_id = p_soal), 0)::int $$;

select uji_sisip('L-1', 101, 11, 'petunjuk', null); select uji_sisip('L-1', 102, 12, 'periksa', true);
select is(uji_xp('L-1'), 12, 'petunjuk di sesi lain tetap melepas bonus');

select uji_sisip('L-2', 201, 21, 'buka_kolom', null); select uji_sisip('L-2', 202, 22, 'periksa', true);
select is(uji_xp('L-2'), 0, 'buka kolom di sesi lain = 0 XP selamanya');

select uji_sisip('L-3', 301, 31, 'periksa', false); select uji_sisip('L-3', 302, 31, 'periksa', false);
select uji_sisip('L-3', 303, 32, 'periksa', false); select uji_sisip('L-3', 304, 32, 'periksa', false); select uji_sisip('L-3', 305, 33, 'periksa', true);
select is(uji_xp('L-3'), 12, 'empat Periksa salah lintas sesi melepas bonus');

select uji_sisip('L-4', 401, 41, 'periksa', false); select uji_sisip('L-4', 402, 42, 'periksa', false);
select uji_sisip('L-4', 403, 43, 'periksa', false); select uji_sisip('L-4', 404, 44, 'periksa', true);
select is(uji_xp('L-4'), 20, 'tiga Periksa salah lintas sesi masih mandiri');

select * from finish();
rollback;
