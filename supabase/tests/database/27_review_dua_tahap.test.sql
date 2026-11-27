-- supabase/tests/database/27_review_dua_tahap.test.sql
-- K1: soal_kuis lewat dua tahap (diajukan -> diperiksa -> disetujui) dengan checklist 5 butir; materi tetap satu tahap.
begin;
select plan(20);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-0000000000b3', 'keilmuan@tes.local'),
  ('00000000-0000-0000-0000-0000000000b4', 'admin@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-0000000000b1', 'penulis'),
  ('00000000-0000-0000-0000-0000000000b2', 'reviewer'),
  ('00000000-0000-0000-0000-0000000000b3', 'keilmuan'),
  ('00000000-0000-0000-0000-0000000000b4', 'admin');
insert into daftar_refs values ('R04-2', 4) on conflict do nothing;
insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-0000000000b1', 'soal_kuis', 'K-dua'),
  ('10000000-0000-0000-0000-0000000000b2', 'soal_kuis', 'K-kembali'),
  ('10000000-0000-0000-0000-0000000000b3', 'materi', 'M-satu'),
  ('10000000-0000-0000-0000-0000000000b9', 'soal_kuis', 'K-draf');
insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('20000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-0000000000b1', '{}', '{R04-2}', 'diajukan', '00000000-0000-0000-0000-0000000000b1'),
  ('20000000-0000-0000-0000-0000000000b2', '10000000-0000-0000-0000-0000000000b2', '{}', '{R04-2}', 'diajukan', '00000000-0000-0000-0000-0000000000b1'),
  ('20000000-0000-0000-0000-0000000000b3', '10000000-0000-0000-0000-0000000000b3', '{}', '{R04-2}', 'diajukan', '00000000-0000-0000-0000-0000000000b1'),
  ('20000000-0000-0000-0000-0000000000b9', '10000000-0000-0000-0000-0000000000b9', '{}', '{R04-2}', 'draf', '00000000-0000-0000-0000-0000000000b1');

set local role authenticated;

-- penulis tidak bisa mencentang
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok($$insert into ceklis_review (revisi_id, butir) values ('20000000-0000-0000-0000-0000000000b1', 1)$$, '42501', null, 'penulis tidak bisa mencentang checklist');

-- reviewer
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select throws_ok($$select setujui_revisi('20000000-0000-0000-0000-0000000000b1')$$, 'P0001', 'soal kuis harus diperiksa dulu sebelum disetujui', 'diajukan -> disetujui langsung ditolak untuk soal_kuis');
select throws_ok($$select periksa_revisi('20000000-0000-0000-0000-0000000000b1')$$, 'P0001', 'checklist review belum lengkap', 'diperiksa tanpa checklist ditolak');
select lives_ok($$insert into ceklis_review (revisi_id, butir) select '20000000-0000-0000-0000-0000000000b1', n from generate_series(1, 4) n$$, 'reviewer mencentang 4 butir');
select throws_ok($$select periksa_revisi('20000000-0000-0000-0000-0000000000b1')$$, 'P0001', 'checklist review belum lengkap', '4 dari 5 butir belum cukup');
select throws_ok($$insert into ceklis_review (revisi_id, butir) values ('20000000-0000-0000-0000-0000000000b1', 6)$$, '23514', null, 'butir di luar 1..5 ditolak');
select lives_ok($$insert into ceklis_review (revisi_id, butir) values ('20000000-0000-0000-0000-0000000000b1', 5)$$, 'butir kelima dicentang');
select lives_ok($$select periksa_revisi('20000000-0000-0000-0000-0000000000b1')$$, 'checklist lengkap: diajukan -> diperiksa');
select is((select status::text from revisi where id = '20000000-0000-0000-0000-0000000000b1'), 'diperiksa', 'status menjadi diperiksa');
select throws_ok($$select setujui_revisi('20000000-0000-0000-0000-0000000000b1')$$, 'P0001', 'hanya keilmuan atau admin yang bisa menyetujui soal kuis', 'reviewer tidak bisa menyetujui soal_kuis');

-- checklist beku setelah diperiksa
select is_empty($$with d as (delete from ceklis_review where revisi_id = '20000000-0000-0000-0000-0000000000b1' returning 1) select * from d$$, 'checklist tidak bisa dicabut setelah diperiksa');

-- keilmuan
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000b3","role":"authenticated"}';
select lives_ok($$select setujui_revisi('20000000-0000-0000-0000-0000000000b1')$$, 'keilmuan menyetujui soal_kuis yang diperiksa');
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-0000000000b1'), '20000000-0000-0000-0000-0000000000b1'::uuid, 'entri terbit');
select throws_ok($$select setujui_revisi('20000000-0000-0000-0000-0000000000b3')$$, 'P0001', 'keilmuan hanya menyetujui soal kuis', 'keilmuan tidak menyetujui materi');
select throws_ok($$select kembalikan_revisi('20000000-0000-0000-0000-0000000000b2', 'catatan')$$, 'P0001', 'keilmuan hanya mengembalikan soal yang sudah diperiksa', 'keilmuan tidak mengembalikan dari diajukan');

-- dikembalikan dari diajukan (reviewer) dan dari diperiksa (keilmuan)
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select lives_ok($$select kembalikan_revisi('20000000-0000-0000-0000-0000000000b2', 'pengecoh 2 kurang masuk akal')$$, 'dikembalikan dari diajukan');

-- materi tetap satu tahap
select throws_ok($$select periksa_revisi('20000000-0000-0000-0000-0000000000b3')$$, 'P0001', 'hanya soal kuis yang melewati tahap diperiksa', 'materi tidak melewati diperiksa');
select lives_ok($$select setujui_revisi('20000000-0000-0000-0000-0000000000b3')$$, 'materi: diajukan -> disetujui satu tahap oleh reviewer');

-- admin bisa menyetujui diperiksa, dan dikembalikan dari diperiksa
reset role;
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-0000000000b4', 'soal_kuis', 'K-admin');
insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('20000000-0000-0000-0000-0000000000b4', '10000000-0000-0000-0000-0000000000b4', '{}', '{R04-2}', 'diperiksa', '00000000-0000-0000-0000-0000000000b1');
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000b3","role":"authenticated"}';
select lives_ok($$select kembalikan_revisi('20000000-0000-0000-0000-0000000000b4', 'rujukan tidak cocok')$$, 'keilmuan mengembalikan dari diperiksa');

-- admin tidak bisa menerbitkan langsung draf soal kuis
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000b4","role":"authenticated"}';
select throws_ok($$select terbitkan_langsung('20000000-0000-0000-0000-0000000000b9')$$, 'P0001', null, 'terbitkan langsung ditolak untuk soal kuis');

select * from finish();
rollback;
