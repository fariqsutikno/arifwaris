import { describe, expect, it } from 'vitest';
import { geserUrutan, jawabUrutanTertunda, orangUrutanBelumPasti, pertanyaanUrutanBerikut, selesaikanUrutan, tundaUrutan, urutanDariTahun } from '../antreanUrutan';
import { bagianLengkap } from '../kelompok';
import { kasusBaru, type Kasus } from '../kasus';
import { jawabSisip, pembanding } from '../urutan';
import { keluargaKarto, tambah } from './fixtures/kanvas';

const tahun = (t: number) => ({ wafat: { tahun: t, kiraKira: false } });

describe('antreanUrutan (spec kanvas 5.6)', () => {
  it('Sumi tanpa tahun, Budi 1998: Sumi ditanya dulu, dibanding Budi', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k: Kasus = { ...kasus, waktu: { [budi]: tahun(1998) } };
    const q = pertanyaanUrutanBerikut(k)!;
    expect(q.orang).toBe(sumi);
    expect(pembanding(q.sisipan)).toBe(budi);
  });

  it('dijawab sebelum/sesudah Budi → urutan sesuai jawaban, tidak ada pertanyaan lagi, bagian urutan lengkap', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k: Kasus = { ...kasus, waktu: { [budi]: tahun(1998) } };
    const q = pertanyaanUrutanBerikut(k)!;
    expect(selesaikanUrutan(k, q.orang, jawabSisip(q.sisipan, false)).urutanWafat).toEqual([budi, sumi]);   // "sesudah Budi"
    const selesai = selesaikanUrutan(k, q.orang, jawabSisip(q.sisipan, true));                               // "sebelum Budi"
    expect(selesai.urutanWafat).toEqual([sumi, budi]);
    expect(selesai.urutanDijawab).toEqual([sumi]);
    expect(pertanyaanUrutanBerikut(selesai)).toBeNull();
    expect(bagianLengkap(selesai, { id: 'urutan', milik: 'PEWARIS', jenis: 'urutan' })).toBe(true);
  });

  it('semua bertahun → tidak ada pertanyaan', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    expect(pertanyaanUrutanBerikut({ ...kasus, waktu: { [sumi]: tahun(1990), [budi]: tahun(1998) } })).toBeNull();
  });

  it('"Belum tahu" → belumPasti urutan, tidak ditanya lagi', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const ditunda = tundaUrutan(kasus, sumi, budi);
    expect(ditunda.belumPasti).toEqual([{ jenis: 'urutan', a: sumi, b: budi, bersamaan: false }]);
    expect(orangUrutanBelumPasti(ditunda)).toEqual([]);
  });

  it('satu orang saja di urutan wafat: tidak ada yang dibandingkan', () => {
    const { kasus, sumi } = keluargaKarto();
    expect(orangUrutanBelumPasti({ ...kasus, urutanWafat: [sumi] })).toEqual([]);
  });

  it('urutan yang tidak berpengaruh tidak ditanya: dua anak yang masing-masing punya anak laki-laki', () => {
    let k = kasusBaru('L');
    let r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const anak1 = r.id;
    r = tambah(k, 'PEWARIS', 'ANAK_LK'); k = r.kasus; const anak2 = r.id;
    r = tambah(k, anak1, 'ANAK_LK'); k = r.kasus;
    r = tambah(k, anak2, 'ANAK_LK'); k = r.kasus;
    expect(orangUrutanBelumPasti({ ...k, urutanWafat: [anak1, anak2] })).toEqual([]);
  });

  it('jawabUrutanTertunda: menghapus entri tunda, menempatkan a terhadap b, menandai dijawab', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const tunda = tundaUrutan({ ...kasus, urutanWafat: [budi, sumi] }, sumi, budi);
    const jawab = jawabUrutanTertunda(tunda, sumi, budi, 'sebelum');
    expect(jawab.urutanWafat).toEqual([sumi, budi]);
    expect(jawab.belumPasti).toBeUndefined();
    expect(jawab.urutanDijawab).toContain(sumi);
    expect(jawabUrutanTertunda(tunda, sumi, budi, 'sesudah').urutanWafat).toEqual([budi, sumi]);
  });

  it('jawabUrutanTertunda: b tidak di urutan wafat atau urutan sudah ditentukan tahun → urutan tidak berubah, entri tunda dibuang', () => {
    const { kasus, sumi, budi, andi } = keluargaKarto();
    const tunda = tundaUrutan(kasus, sumi, andi);
    const tanpaB = jawabUrutanTertunda(tunda, sumi, andi, 'sebelum');
    expect(tanpaB.urutanWafat).toEqual([sumi, budi]);
    expect(tanpaB.belumPasti).toBeUndefined();
    const bertahun: Kasus = { ...tundaUrutan(kasus, sumi, budi), waktu: { [sumi]: tahun(1990), [budi]: tahun(1998) } };
    const hasil = jawabUrutanTertunda(bertahun, sumi, budi, 'sesudah');
    expect(hasil.urutanWafat).toEqual([sumi, budi]);
    expect(hasil.belumPasti).toBeUndefined();
  });

  it('urutan bertahun tidak bisa digeser: urutanDariTahun true, geserUrutan tidak mengubah', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const bertahun: Kasus = { ...kasus, waktu: { [sumi]: tahun(1990), [budi]: tahun(1998) } };
    expect(urutanDariTahun(bertahun, sumi, budi)).toBe(true);
    expect(geserUrutan(bertahun, budi, -1)).toBe(bertahun);
    expect(geserUrutan(kasus, budi, -1).urutanWafat).toEqual([budi, sumi]);
  });
});
