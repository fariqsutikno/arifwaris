-- supabase/migrations/20261127000001_bank_soal.sql
-- G4 (spec-bank-soal-generator bagian 5): indeks bank soal generator. Hanya kode dan atribut untuk mencari; kasus dan
-- kunci jawaban tidak disimpan (kode bisa diurai balik, dihitung engine). Diisi `pnpm bank:bangun` lewat peran impor (admin).
-- Perkiraan ukuran bank penuh 1.180.175 baris (terukur ~390 MB dengan semua indeks pada 1,18 juta baris tiruan).

create table bank_soal (
  kode text primary key check (char_length(kode) between 1 and 200),
  versi_generator smallint not null,
  keluarga text not null,
  tingkat text not null check (tingkat in ('dasar', 'menengah', 'sulit')),
  modul smallint[] not null default '{}',
  label text[] not null default '{}',
  jumlah_mayit smallint not null,
  jumlah_ahli_waris smallint not null,
  -- Kunci pengacakan: 64 bit pertama md5(kode). Ditentukan kode saja, jadi urutannya tetap walau baris ditulis ulang.
  urut bigint generated always as (('x' || substr(md5(kode), 1, 16))::bit(64)::bigint) stored,
  dibuat timestamptz not null default now()
);

create index bank_soal_label on bank_soal using gin (label);
create index bank_soal_modul on bank_soal using gin (modul);
create index bank_soal_keluarga_tingkat on bank_soal (keluarga, tingkat);
create index bank_soal_urut on bank_soal (urut, kode);

alter table bank_soal enable row level security;
create policy baca on bank_soal for select using (true);
-- Peran impor = admin (scripts/pulihkan/masuk.ts). Penulis/reviewer tidak menulis bank.
create policy tambah on bank_soal for insert to authenticated with check (peran_saya() = 'admin');
create policy ubah on bank_soal for update to authenticated using (peran_saya() = 'admin') with check (peran_saya() = 'admin');
create policy hapus on bank_soal for delete to authenticated using (peran_saya() = 'admin');
revoke insert, update, delete on bank_soal from anon;

-- Pencarian acak deterministik tanpa `order by random()`: benih menentukan satu titik pada lingkaran `urut`, hasil =
-- `p_jumlah` baris pertama yang cocok mulai dari titik itu (lanjut ke awal bila habis). Biaya ~ jumlah hasil, bukan jumlah
-- baris bank. Benih sama + isi tabel sama = kode sama; benih lain = jendela lain.
-- Kosong atau null pada filter = tidak disaring. `p_label_semua` = harus punya semua, `p_label_salah_satu` = minimal satu,
-- `p_label_tanpa` = tak boleh punya satu pun.
create function cari_soal(
  p_jumlah int, p_benih text,
  p_tingkat text default null, p_modul smallint default null, p_keluarga text default null,
  p_label_semua text[] default null, p_label_salah_satu text[] default null, p_label_tanpa text[] default null
) returns setof text
language plpgsql stable security invoker set search_path = public as $$
declare
  batas_jumlah constant int := 200;
  titik bigint;
begin
  if p_jumlah is null or p_jumlah < 1 or p_jumlah > batas_jumlah then
    raise exception 'jumlah harus 1..%', batas_jumlah using errcode = 'PT400', detail = 'JUMLAH_TIDAK_SAH';
  end if;
  if p_benih is null or char_length(p_benih) not between 1 and 200 then
    raise exception 'benih harus 1..200 karakter' using errcode = 'PT400', detail = 'BENIH_TIDAK_SAH';
  end if;
  if coalesce(cardinality(p_label_semua), 0) > 50 or coalesce(cardinality(p_label_salah_satu), 0) > 50
     or coalesce(cardinality(p_label_tanpa), 0) > 50 then
    raise exception 'label terlalu banyak' using errcode = 'PT400', detail = 'LABEL_TERLALU_BANYAK';
  end if;
  titik := ('x' || substr(md5(p_benih), 1, 16))::bit(64)::bigint;

  return query
  select s.kode from (
    (select b.kode, 0 as bagian, b.urut from bank_soal b
      where b.urut >= titik
        and (p_tingkat is null or b.tingkat = p_tingkat)
        and (p_keluarga is null or b.keluarga = p_keluarga)
        and (p_modul is null or b.modul @> array[p_modul])
        and (coalesce(cardinality(p_label_semua), 0) = 0 or b.label @> p_label_semua)
        and (coalesce(cardinality(p_label_salah_satu), 0) = 0 or b.label && p_label_salah_satu)
        and (coalesce(cardinality(p_label_tanpa), 0) = 0 or not (b.label && p_label_tanpa))
      order by b.urut, b.kode limit p_jumlah)
    union all
    (select b.kode, 1, b.urut from bank_soal b
      where b.urut < titik
        and (p_tingkat is null or b.tingkat = p_tingkat)
        and (p_keluarga is null or b.keluarga = p_keluarga)
        and (p_modul is null or b.modul @> array[p_modul])
        and (coalesce(cardinality(p_label_semua), 0) = 0 or b.label @> p_label_semua)
        and (coalesce(cardinality(p_label_salah_satu), 0) = 0 or b.label && p_label_salah_satu)
        and (coalesce(cardinality(p_label_tanpa), 0) = 0 or not (b.label && p_label_tanpa))
      order by b.urut, b.kode limit p_jumlah)
  ) s order by s.bagian, s.urut, s.kode limit p_jumlah;
end $$;
