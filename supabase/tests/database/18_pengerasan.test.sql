-- supabase/tests/database/18_pengerasan.test.sql
-- K4–K6: fungsi portal tertutup bagi anon, search_path tetap, penulis hanya mengubah isi drafnya.
begin;
select plan(13);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'penulis@tes.local');
insert into peran_pengguna values ('00000000-0000-0000-0000-0000000000a1', 'penulis');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-0000000000a1', 'faq', 'draf-uji');
insert into diksi (kunci, halaman) values ('uji.kunci', 'uji');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values
  ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', '{}', '{R09-7}', '00000000-0000-0000-0000-0000000000a1');
insert into revisi_diksi (id, kunci, id_teks, dibuat_oleh) values
  ('30000000-0000-0000-0000-0000000000a1', 'uji.kunci', 'teks', '00000000-0000-0000-0000-0000000000a1');

-- K4
select is((select count(*) from unnest(array[
  'ajukan_revisi(uuid)', 'ajukan_revisi_diksi(uuid)', 'kembalikan_revisi(uuid, text)', 'kembalikan_revisi_diksi(uuid, text)',
  'setujui_revisi(uuid)', 'setujui_revisi_diksi(uuid)', 'terbitkan_ulang_revisi(uuid)', 'terbitkan_ulang_revisi_diksi(uuid)',
  'tautan_bagikan_tersedia(text, text)']) f where has_function_privilege('anon', f, 'execute')), 0::bigint,
  'anon tidak bisa menjalankan fungsi portal');
select is(has_function_privilege('anon', 'baca_kasus_dibagikan(text)', 'execute'), true, 'tautan publik tetap bisa dibaca anon');
select is(has_function_privilege('anon', 'peran_saya()', 'execute'), true, 'peran_saya tetap untuk kebijakan RLS baca anon');

-- K5
select is((select count(*) from pg_proc p where pronamespace = 'public'::regnamespace and prokind = 'f'
  and not exists (select 1 from unnest(coalesce(proconfig, '{}')) c where c like 'search_path=%')), 0::bigint,
  'semua fungsi public punya search_path tetap');

-- K6
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok($$update revisi set isi = '{"a":1}', refs = '{R09-7}' where id = '20000000-0000-0000-0000-0000000000a1'$$, 'penulis mengubah isi dan refs drafnya');
select throws_ok($$update revisi set dibuat_oleh = '00000000-0000-0000-0000-0000000000ff' where id = '20000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'penulis tidak bisa mengubah dibuat_oleh');
select throws_ok($$update revisi set entri_id = '10000000-0000-0000-0000-0000000000ff' where id = '20000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'penulis tidak bisa mengubah entri_id');
select throws_ok($$update revisi set status = 'diajukan' where id = '20000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'penulis tidak bisa mengubah status revisi');
select lives_ok($$update revisi_diksi set id_teks = 'baru', ar_teks = 'جديد', catatan = 'c' where id = '30000000-0000-0000-0000-0000000000a1'$$, 'penulis mengubah isi draf diksi');
select throws_ok($$update revisi_diksi set dibuat_oleh = '00000000-0000-0000-0000-0000000000ff' where id = '30000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'penulis tidak bisa mengubah dibuat_oleh diksi');
select throws_ok($$update revisi_diksi set kunci = 'uji.lain' where id = '30000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'penulis tidak bisa mengubah kunci diksi');
select throws_ok($$update revisi_diksi set status = 'diajukan' where id = '30000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'penulis tidak bisa mengubah status diksi');
select lives_ok($$select ajukan_revisi('20000000-0000-0000-0000-0000000000a1')$$, 'perpindahan status tetap lewat fungsi');

select * from finish();
rollback;
