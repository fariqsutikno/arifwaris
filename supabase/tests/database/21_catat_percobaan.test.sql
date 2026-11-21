-- supabase/tests/database/21_catat_percobaan.test.sql
-- catat_percobaan: hanya service_role; idempoten; urutan sesi; Kirim Ujian sekali; batas laju per menit.
begin;
select plan(11);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'a@tes.local');
insert into entri_konten (id, jenis, slug) values ('00000000-0000-0000-0000-0000000000f1', 'soal_hitung', 'T-01');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', '{}', '{R01-1}', '00000000-0000-0000-0000-0000000000e1');

create function uji_catat(p_id int, p_sesi int, p_mode text, p_aksi text, p_isian jsonb default null) returns jsonb language sql as $$
  select catat_percobaan('00000000-0000-0000-0000-0000000000e1', ('00000000-0000-0000-0000-0000000000' || lpad(p_id::text, 2, '0'))::uuid,
    ('00000000-0000-0000-0000-0000000001' || lpad(p_sesi::text, 2, '0'))::uuid, 'T-01', '00000000-0000-0000-0000-0000000000f2', 'biasa',
    p_mode, p_aksi, p_isian, null, null, false, null, '{}') $$;

set local role authenticated;
select throws_ok($$select uji_catat(1, 1, 'latihan', 'buka')$$, '42501', null, 'authenticated tidak boleh memanggil');
reset role;

select is((uji_catat(1, 1, 'latihan', 'buka') ->> 'duplikat')::boolean, false, 'tercatat');
select is((uji_catat(1, 1, 'latihan', 'buka') ->> 'duplikat')::boolean, true, 'id sama isi sama = hasil lama (idempoten)');
select throws_ok($$select uji_catat(1, 1, 'latihan', 'periksa', '{"kepala":{},"sel":{}}')$$, 'PT409', 'ID_BENTROK', 'id sama isi beda = 409');
select throws_ok($$select uji_catat(2, 2, 'ujian', 'periksa', '{}')$$, 'PT400', 'AKSI_TIDAK_SESUAI_MODE', 'periksa di Ujian ditolak');
select lives_ok($$select uji_catat(3, 3, 'ujian', 'kirim', '{}')$$, 'Kirim Ujian pertama');
select throws_ok($$select uji_catat(4, 3, 'ujian', 'kirim', '{}')$$, 'PT409', 'SESI_SUDAH_DIKIRIM', 'Kirim Ujian kedua ditolak');
select lives_ok($$select uji_catat(5, 3, 'ujian', 'lihat_jawaban', '{}')$$, 'lihat jawaban sesudah Kirim boleh');
select throws_ok($$select uji_catat(6, 3, 'latihan', 'buka')$$, 'PT409', 'SESI_BEDA_SOAL', 'mode berbeda dalam satu sesi ditolak');

select lives_ok($$select uji_catat(10 + n, 10 + n, 'latihan', 'buka') from generate_series(1, 27) n$$, 'sampai batas per menit');
select throws_ok($$select uji_catat(60, 60, 'latihan', 'buka')$$, 'PT429', 'LAJU_TERLAMPAUI', 'lewat 30 per menit ditolak');

select * from finish();
rollback;
