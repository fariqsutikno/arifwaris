-- supabase/tests/database/23_xp_peralihan.test.sql
-- Peralihan ke XP server (spec 2.5): soal yang sudah memberi XP lewat log_kegiatan lama tidak memberi lagi;
-- soal baru memberi bobotXp revisinya; percobaan apa pun menjadi hari aktif; klien tak bisa menulis log.
begin;
select plan(5);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'a@tes.local');
insert into entri_konten (id, jenis, slug) values
  ('00000000-0000-0000-0000-0000000000f1', 'soal_hitung', 'T-01'), ('00000000-0000-0000-0000-0000000000f3', 'soal_hitung', 'T-02');
insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', '{"tingkat":"dasar"}', '{R01-1}', 'disetujui', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000f3', '{"tingkat":"dasar","bobotXp":20}', '{R01-1}', 'disetujui', '00000000-0000-0000-0000-0000000000e1');
update entri_konten set revisi_terbit_id = '00000000-0000-0000-0000-0000000000f2' where slug = 'T-01';
update entri_konten set revisi_terbit_id = '00000000-0000-0000-0000-0000000000f4' where slug = 'T-02';

create function xp_uji() returns int language sql as $$
  select xp_total from ringkasan_pada('00000000-0000-0000-0000-0000000000e1', '2026-11-10T00:00Z') $$;
create function percobaan_uji(p_nomor int, p_soal text, p_revisi uuid, p_aksi text, p_benar boolean, p_waktu timestamptz) returns void language sql as $$
  insert into percobaan_soal (id, user_id, id_sesi_soal, soal_id, revisi_soal, jenis_soal, mode, aksi, benar_semua, diterima_pada, versi)
  values (('00000000-0000-0000-0000-0000000001' || lpad(p_nomor::text, 2, '0'))::uuid, '00000000-0000-0000-0000-0000000000e1',
    ('00000000-0000-0000-0000-0000000002' || lpad(p_nomor::text, 2, '0'))::uuid, p_soal, p_revisi, 'biasa', 'latihan', p_aksi, p_benar, p_waktu, '{}') $$;

insert into log_kegiatan (id, user_id, jenis, slug, benar, terjadi_pada) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', 'soal', 'T-01', true, '2026-11-01 10:00+07');
select is(xp_uji(), 12, 'XP lama: soal dasar 10 + hari aktif 2');

select percobaan_uji(1, 'T-01', '00000000-0000-0000-0000-0000000000f2', 'periksa', true, '2026-11-01 11:00+07');
select is(xp_uji(), 12, 'soal yang sudah memberi XP di log lama tidak memberi lagi; hari yang sama tidak menambah');

select percobaan_uji(2, 'T-02', '00000000-0000-0000-0000-0000000000f4', 'periksa', true, '2026-11-01 12:00+07');
select is(xp_uji(), 32, 'soal baru memberi bobotXp revisi (20)');

select percobaan_uji(3, 'T-02', '00000000-0000-0000-0000-0000000000f4', 'lihat_jawaban', null, '2026-11-02 12:00+07');
select is(xp_uji(), 34, 'lihat jawaban hanya menambah hari aktif (2), bukan XP soal');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated"}';
select throws_ok($$insert into log_kegiatan (id, jenis, slug, benar) values ('30000000-0000-0000-0000-000000000009', 'soal', 'T-09', true)$$,
  '42501', null, 'klien tidak bisa menulis log_kegiatan untuk XP palsu');

select * from finish();
rollback;
