-- supabase/tests/database/26_bank_soal.test.sql
-- Bank soal generator (G4): RLS (baca semua, tulis admin) dan cari_soal (determinisme benih, filter label, batas jumlah).
begin;
select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'impor@tes.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'penulis@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'penulis');

-- 300 baris: kode T-n; tiap baris berlabel 'a', kelipatan 2 'b', kelipatan 3 'c', kelipatan 5 'aul'; tingkat & modul bergantian.
insert into bank_soal (kode, versi_generator, keluarga, tingkat, modul, label, jumlah_mayit, jumlah_ahli_waris)
select 'T-' || n, 1, case when n % 7 = 0 then 'gharqa' else 'biasa' end,
  (array['dasar', 'menengah', 'sulit'])[n % 3 + 1], array[(n % 4 + 1)::smallint],
  array['a'] || case when n % 2 = 0 then array['b'] else '{}'::text[] end
    || case when n % 3 = 0 then array['c'] else '{}'::text[] end
    || case when n % 5 = 0 then array['aul'] else '{}'::text[] end, 1, 3
from generate_series(1, 300) as n;

-- RLS
set local role anon;
select is((select count(*) from bank_soal), 300::bigint, 'anonim bisa membaca bank');
select throws_ok($$insert into bank_soal values ('X', 1, 'biasa', 'dasar', '{}', '{}', 1, 1)$$, '42501', null, 'anonim tidak bisa menambah');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}';
select throws_ok($$insert into bank_soal values ('X', 1, 'biasa', 'dasar', '{}', '{}', 1, 1)$$, '42501', null, 'penulis tidak bisa menambah');
select is((select count(*) from bank_soal), 300::bigint, 'penulis tetap bisa membaca');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok($$insert into bank_soal values ('X-1', 1, 'biasa', 'dasar', '{1}', '{a}', 1, 2)$$, 'admin (peran impor) bisa menambah');
select lives_ok($$insert into bank_soal values ('X-1', 1, 'biasa', 'sulit', '{1}', '{a}', 1, 2) on conflict (kode) do update set tingkat = excluded.tingkat$$, 'admin bisa upsert idempoten');
select is((select tingkat from bank_soal where kode = 'X-1'), 'sulit', 'upsert mengubah baris');
select isnt((select urut from bank_soal where kode = 'X-1'), null::bigint, 'urut terisi otomatis dari kode');
delete from bank_soal where kode = 'X-1';
reset role;

-- cari_soal (jalan sebagai anon: security invoker + RLS baca publik)
set local role anon;
select is((select count(*) from cari_soal(10, 'benih-1')), 10::bigint, 'jumlah sesuai permintaan');
select is((select array_agg(k) from cari_soal(20, 'benih-1') k), (select array_agg(k) from cari_soal(20, 'benih-1') k), 'benih sama = kode sama');
select isnt((select array_agg(k) from cari_soal(20, 'benih-1') k), (select array_agg(k) from cari_soal(20, 'benih-2') k), 'benih lain = kode lain');
select is((select count(distinct k) from cari_soal(200, 'x') k), 200::bigint, 'tanpa duplikat, dan jendela melingkar bila melewati ujung');
select is((select count(*) from cari_soal(200, 'x', p_label_semua => array['b', 'c']) k), 50::bigint, 'semua: b dan c = kelipatan 6');
select is((select count(*) from cari_soal(200, 'x', p_label_salah_satu => array['c', 'aul']) k), 140::bigint, 'salahSatu: kelipatan 3 atau 5');
select is((select count(*) from cari_soal(200, 'x', p_label_tanpa => array['b']) k), 150::bigint, 'tanpa: buang kelipatan 2');
select is((select count(*) from cari_soal(200, 'x', p_tingkat => 'sulit', p_modul => 2::smallint, p_keluarga => 'gharqa') k),
  (select count(*) from bank_soal where tingkat = 'sulit' and modul @> array[2::smallint] and keluarga = 'gharqa'), 'tingkat + modul + keluarga');
select throws_ok($$select * from cari_soal(201, 'x')$$, 'PT400', 'jumlah harus 1..200', 'jumlah di atas batas ditolak');
select throws_ok($$select * from cari_soal(0, 'x')$$, 'PT400', 'jumlah harus 1..200', 'jumlah nol ditolak');
reset role;

select * from finish();
rollback;
