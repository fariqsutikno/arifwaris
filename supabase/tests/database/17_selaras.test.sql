-- supabase/tests/database/17_selaras.test.sql
-- K2: fungsi ajuan_diksi terpasang dan sisa rujukan_kb tidak ada.
begin;
select plan(8);
select has_function('terbitkan_langsung_diksi', array['uuid']);
select has_function('perbarui_ajuan', array['uuid', 'jsonb', 'text[]']);
select has_function('perbarui_ajuan_diksi', array['uuid', 'text', 'text']);
select hasnt_trigger('entri_konten', 'daftarkan_rujukan', 'trigger rujukan_kb sudah dibuang');
select hasnt_function('daftarkan_rujukan_terbit');
select is(has_function_privilege('anon', 'perbarui_ajuan(uuid, jsonb, text[])', 'execute'), false, 'anon tidak bisa memperbarui ajuan');
select is(has_function_privilege('anon', 'terbitkan_langsung_diksi(uuid)', 'execute'), false, 'anon tidak bisa menerbitkan langsung');
select throws_ok($$insert into entri_konten (jenis, slug) values ('rujukan', 'R09-7')$$, '23514', null, 'jenis rujukan tidak lagi dikenal');
select * from finish();
rollback;
