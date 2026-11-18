import { describe, expect, it } from 'vitest';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { aturTahunWafat, bandingTanggal, terapkanPeristiwa, turunkanDariWaktu, urutkanMenurutTahun, waktuRelatif } from '../silsilah';

const t = (tahun: number, bulan?: number) => ({ tahun, kiraKira: false, ...(bulan ? { bulan } : {}) });
function keluarga() {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const isian = hitungIsian(kasus.graf, 'PEWARIS');
  return { kasus, istri: isian.ISTRI![0]!, a1: isian.ANAK_LK![0]!, a2: isian.ANAK_LK![1]!, pr: isian.ANAK_PR![0]! };
}

describe('silsilah', () => {
  it('bandingTanggal: tahun, lalu bulan; tahun sama tanpa bulan = tidak bisa dibandingkan', () => {
    expect(bandingTanggal(t(1990), t(1998))).toBe(-1);
    expect(bandingTanggal(t(1998), t(1990))).toBe(1);
    expect(bandingTanggal(t(1990, 3), t(1990, 7))).toBe(-1);
    expect(bandingTanggal(t(1990), t(1990))).toBeNull();
    expect(bandingTanggal(t(1990), undefined)).toBeNull();
  });

  it('waktuRelatif dari tahun wafat dua orang', () => {
    const { kasus, a1 } = keluarga();
    const k: Kasus = { ...kasus, waktu: { PEWARIS: { wafat: t(1975) }, [a1]: { wafat: t(1998) } } };
    expect(waktuRelatif(k, a1, 'PEWARIS')).toBe('sesudah');
    expect(waktuRelatif(k, 'PEWARIS', a1)).toBe('sebelum');
    expect(waktuRelatif(kasus, a1, 'PEWARIS')).toBeNull();
  });

  it('urutkanMenurutTahun: yang bertahun diurutkan; yang tanpa tahun tetap di tempatnya', () => {
    const { kasus, istri, a1, a2 } = keluarga();
    const k: Kasus = { ...kasus, urutanWafat: [a1, istri, a2], waktu: { [a1]: { wafat: t(1998) }, [a2]: { wafat: t(1990) } } };
    expect(urutkanMenurutTahun(k).urutanWafat).toEqual([a2, istri, a1]);
    const sama: Kasus = { ...kasus, urutanWafat: [a1, a2], waktu: { [a1]: { wafat: t(1990) }, [a2]: { wafat: t(1990) } } };
    expect(urutkanMenurutTahun(sama)).toBe(sama);
  });

  it('peristiwa lahir → dikandungSetelahWafat', () => {
    const { kasus, a1, pr } = keluarga();
    const k: Kasus = { ...kasus, urutanWafat: [a1], peristiwa: [{ jenis: 'lahir', idOrang: pr, sesudahWafat: a1 }] };
    expect(terapkanPeristiwa(k).dikandungSetelahWafat).toEqual({ [pr]: a1 });
  });

  it('peristiwa cerai (a1 dan istrinya, sesudah pewaris wafat, sebelum a1 wafat) → talak bain', () => {
    const { kasus, a1 } = keluarga();
    let k = { ...kasus, graf: tambahAhliWaris(kasus.graf, a1, 'ISTRI') };
    const istriA1 = hitungIsian(k.graf, a1).ISTRI![0]!;
    k = { ...k, urutanWafat: [a1], peristiwa: [{ jenis: 'cerai', idOrang: a1, idPasangan: istriA1, sesudahWafat: 'PEWARIS' }] };
    const nikah = terapkanPeristiwa(k).graf.pernikahan.find(n => n.idSuami === a1 && n.idIstri === istriA1)!;
    expect(nikah.status).toBe('talakBain');
  });

  it('turunkanDariWaktu = urutkan lalu peristiwa; tanpa waktu/peristiwa mengembalikan objek yang sama', () => {
    const { kasus } = keluarga();
    expect(turunkanDariWaktu(kasus)).toBe(kasus);
  });
});

describe('aturTahunWafat', () => {
  it('menulis tahun wafat dan menghapusnya (waktu kosong ikut dibuang)', () => {
    const { kasus, a1 } = keluarga();
    const ditulis = aturTahunWafat(kasus, a1, t(1998));
    expect(ditulis.waktu).toEqual({ [a1]: { wafat: t(1998) } });
    const dihapus = aturTahunWafat(ditulis, a1, undefined);
    expect(dihapus).not.toHaveProperty('waktu');
  });

  it('tahun lahir orang itu tidak ikut terhapus', () => {
    const { kasus, a1 } = keluarga();
    const k: Kasus = { ...kasus, waktu: { [a1]: { wafat: t(1998), lahir: t(1950) } } };
    expect(aturTahunWafat(k, a1, undefined).waktu).toEqual({ [a1]: { lahir: t(1950) } });
  });
});
