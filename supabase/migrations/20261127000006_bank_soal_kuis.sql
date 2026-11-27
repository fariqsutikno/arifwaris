-- supabase/migrations/20261127000006_bank_soal_kuis.sql
-- K5 (spec-soal-kuis-ribuan 3.2-3.3): soal kuis angka buatan mesin di bank_soal. Kolom `bentuk` memisahkan soal hitung dan soal kuis,
-- `aturan` mencatat aturan salah paham yang melahirkan pengecohnya. Tim keilmuan menyetujui per aturan (bukan per soal); cari_soal
-- bentuk 'kuis' hanya mengembalikan soal yang SEMUA aturannya sudah disetujui.

alter table bank_soal
  add column bentuk text not null default 'hitung' check (bentuk in ('hitung', 'kuis')),
  add column aturan text[] not null default '{}';

create index bank_soal_kuis_aturan on bank_soal using gin (aturan) where bentuk = 'kuis';

create table aturan_pengecoh_disetujui (
  aturan text primary key check (char_length(aturan) between 1 and 100),
  disetujui_oleh uuid default auth.uid(),
  disetujui_pada timestamptz not null default now()
);

alter table aturan_pengecoh_disetujui enable row level security;
create policy baca on aturan_pengecoh_disetujui for select using (true);
create policy setujui on aturan_pengecoh_disetujui for insert to authenticated
  with check (peran_saya() in ('keilmuan', 'admin'));
create policy cabut on aturan_pengecoh_disetujui for delete to authenticated
  using (peran_saya() in ('keilmuan', 'admin'));
revoke insert, update, delete on aturan_pengecoh_disetujui from anon;

-- Tanda tangan lama dibuang: parameter baru `p_bentuk` (bawaan 'hitung') membuat pemanggil lama tetap mendapat soal hitung saja.
drop function cari_soal(int, text, text, smallint, text, text[], text[], text[]);

create function cari_soal(
  p_jumlah int, p_benih text,
  p_tingkat text default null, p_modul smallint default null, p_keluarga text default null,
  p_label_semua text[] default null, p_label_salah_satu text[] default null, p_label_tanpa text[] default null,
  p_bentuk text default 'hitung'
) returns setof text
language plpgsql stable security invoker set search_path = public as $$
declare
  batas_jumlah constant int := 200;
  titik bigint;
  disetujui text[];
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
  if p_bentuk is null or p_bentuk not in ('hitung', 'kuis') then
    raise exception 'bentuk harus hitung atau kuis' using errcode = 'PT400', detail = 'BENTUK_TIDAK_SAH';
  end if;
  titik := ('x' || substr(md5(p_benih), 1, 16))::bit(64)::bigint;
  -- Tabel kecil (satu baris per aturan), dibaca sekali per panggilan.
  select coalesce(array_agg(aturan), '{}') into disetujui from aturan_pengecoh_disetujui;

  return query
  select s.kode from (
    (select b.kode, 0 as bagian, b.urut from bank_soal b
      where b.urut >= titik and b.bentuk = p_bentuk
        and (p_bentuk = 'hitung' or b.aturan <@ disetujui)
        and (p_tingkat is null or b.tingkat = p_tingkat)
        and (p_keluarga is null or b.keluarga = p_keluarga)
        and (p_modul is null or b.modul @> array[p_modul])
        and (coalesce(cardinality(p_label_semua), 0) = 0 or b.label @> p_label_semua)
        and (coalesce(cardinality(p_label_salah_satu), 0) = 0 or b.label && p_label_salah_satu)
        and (coalesce(cardinality(p_label_tanpa), 0) = 0 or not (b.label && p_label_tanpa))
      order by b.urut, b.kode limit p_jumlah)
    union all
    (select b.kode, 1, b.urut from bank_soal b
      where b.urut < titik and b.bentuk = p_bentuk
        and (p_bentuk = 'hitung' or b.aturan <@ disetujui)
        and (p_tingkat is null or b.tingkat = p_tingkat)
        and (p_keluarga is null or b.keluarga = p_keluarga)
        and (p_modul is null or b.modul @> array[p_modul])
        and (coalesce(cardinality(p_label_semua), 0) = 0 or b.label @> p_label_semua)
        and (coalesce(cardinality(p_label_salah_satu), 0) = 0 or b.label && p_label_salah_satu)
        and (coalesce(cardinality(p_label_tanpa), 0) = 0 or not (b.label && p_label_tanpa))
      order by b.urut, b.kode limit p_jumlah)
  ) s order by s.bagian, s.urut, s.kode limit p_jumlah;
end $$;

-- Contoh soal kuis untuk satu aturan, tanpa melihat status persetujuan: bahan tim keilmuan memutuskan. Pola jendela sama dengan
-- cari_soal; hanya keilmuan/admin (soal belum disetujui tidak boleh bocor ke pelajar lewat jalur ini).
create function contoh_soal_kuis(p_aturan text, p_jumlah int, p_benih text)
returns setof text
language plpgsql stable security invoker set search_path = public as $$
declare
  batas_jumlah constant int := 20;
  titik bigint;
begin
  if peran_saya() not in ('keilmuan', 'admin') then
    raise exception 'hanya keilmuan atau admin' using errcode = '42501';
  end if;
  if p_jumlah is null or p_jumlah < 1 or p_jumlah > batas_jumlah then
    raise exception 'jumlah harus 1..%', batas_jumlah using errcode = 'PT400', detail = 'JUMLAH_TIDAK_SAH';
  end if;
  if p_aturan is null or char_length(p_aturan) not between 1 and 100 or p_benih is null or char_length(p_benih) not between 1 and 200 then
    raise exception 'aturan atau benih tidak sah' using errcode = 'PT400', detail = 'MASUKAN_TIDAK_SAH';
  end if;
  titik := ('x' || substr(md5(p_benih), 1, 16))::bit(64)::bigint;

  return query
  select s.kode from (
    (select b.kode, 0 as bagian, b.urut from bank_soal b
      where b.urut >= titik and b.bentuk = 'kuis' and b.aturan @> array[p_aturan]
      order by b.urut, b.kode limit p_jumlah)
    union all
    (select b.kode, 1, b.urut from bank_soal b
      where b.urut < titik and b.bentuk = 'kuis' and b.aturan @> array[p_aturan]
      order by b.urut, b.kode limit p_jumlah)
  ) s order by s.bagian, s.urut, s.kode limit p_jumlah;
end $$;
