import { describe, expect, it } from 'vitest';
import { jalankan } from '../jalankan';
import { kasusBaru, type Kasus } from '../kasus';
import { terapkanKeadaan } from '../keadaanOrang';
import { alasanBarisKurang, alasanWafatSesudahDitolak, jawabLanjutan, keadaanTerpilih, lanjutanDiperlukan, pilihKeadaan, pilihanKeadaan } from '../keadaanBaris';
import { tambah } from './fixtures/kanvas';

const tahun = (nilai: number) => ({ tahun: nilai, kiraKira: false });
const wafatAlmarhum = (kasus: Kasus, nilai?: number): Kasus => (nilai ? { ...kasus, waktu: { PEWARIS: { wafat: tahun(nilai) } } } : kasus);
/** Satu baris baru yang belum dipilih keadaannya, seperti sesudah menekan "+". */
function barisBaru(kunci: 'ANAK_LK' | 'ISTRI' | 'AYAH', almarhumWafat?: number) {
  const { kasus, id } = tambah(kasusBaru('L'), 'PEWARIS', kunci);
  return { kasus: wafatAlmarhum({ ...kasus, belumDiisi: [id] }, almarhumWafat), id };
}

describe('pilihanKeadaan (spec kanvas 5.3, aturan 8)', () => {
  it('leluhur: hidup, wafat, belum tahu, hilang; semuanya tampil langsung', () => {
    expect(pilihanKeadaan('AYAH')).toEqual([
      { nilai: 'hidup', kelompok: 'utama' }, { nilai: 'wafat', kelompok: 'utama' },
      { nilai: 'belumTahu', kelompok: 'utama' }, { nilai: 'hilang', kelompok: 'utama' },
    ]);
  });

  it('pasangan: hilang dan bercerai ada di Lainnya', () => {
    const lainnya = pilihanKeadaan('ISTRI').filter(o => o.kelompok === 'lainnya').map(o => o.nilai);
    expect(lainnya).toEqual(['hilang', 'bercerai']);
  });

  it('keturunan: hilang dan kelamin belum jelas di Lainnya; kunci di luar KHUNTSA_MUNGKIN hanya hilang dan tampil langsung', () => {
    expect(pilihanKeadaan('ANAK_LK').filter(o => o.kelompok === 'lainnya').map(o => o.nilai)).toEqual(['hilang', 'khuntsa']);
    expect(pilihanKeadaan('MUTIQ').filter(o => o.nilai === 'hilang')).toEqual([{ nilai: 'hilang', kelompok: 'utama' }]);
  });
});

describe('keadaan satu baris', () => {
  it('baris kosong menahan lanjut (Review Focus 1): belum terpilih, ada alasan; memilih hidup melengkapi', () => {
    const { kasus, id } = barisBaru('ANAK_LK');
    expect(keadaanTerpilih(kasus, id)).toBeNull();
    expect(alasanBarisKurang(kasus, id, 'PEWARIS')).toMatch(/Pilih keadaannya/);
    const hidup = pilihKeadaan(kasus, id, 'hidup', 'PEWARIS');
    expect(hidup.belumDiisi ?? []).toEqual([]);
    expect(keadaanTerpilih(hidup, id)).toBe('hidup');
    expect(alasanBarisKurang(hidup, id, 'PEWARIS')).toBeNull();
  });

  it('belum tahu menyimpan tidakDiketahui dan jalankan tidak melempar', () => {
    const { kasus, id } = barisBaru('ANAK_LK');
    const hasil = pilihKeadaan(kasus, id, 'belumTahu', 'PEWARIS');
    expect(hasil.graf.orang[id]!.statusHidup).toBe('tidakDiketahui');
    expect(hasil.belumDiisi ?? []).toEqual([]);
    expect(keadaanTerpilih(hasil, id)).toBe('belumTahu');
    expect(jalankan({ ...hasil, tirkah: { ...hasil.tirkah, kotor: 100n } }).jenis).not.toBe('galat');
  });

  it('wafat dengan dua tahun beda: sesudah almarhum → urutanWafat; sebelum → wafat biasa', () => {
    const sesudah = barisBaru('ANAK_LK', 1975);
    const a = jawabLanjutan(pilihKeadaan(sesudah.kasus, sesudah.id, 'wafat', 'PEWARIS'), sesudah.id, 'PEWARIS', { jenis: 'wafat', tahun: tahun(1998) });
    expect(a.urutanWafat).toContain(sesudah.id);
    expect(a.belumDiisi ?? []).toEqual([]);
    expect(keadaanTerpilih(a, sesudah.id)).toBe('wafat');

    const sebelum = barisBaru('ANAK_LK', 1975);
    const b = jawabLanjutan(pilihKeadaan(sebelum.kasus, sebelum.id, 'wafat', 'PEWARIS'), sebelum.id, 'PEWARIS', { jenis: 'wafat', tahun: tahun(1960) });
    expect(b.graf.orang[sebelum.id]!.statusHidup).toBe('wafat');
    expect(b.urutanWafat).not.toContain(sebelum.id);
    expect(b.belumDiisi ?? []).toEqual([]);
  });

  it('tahun sama → minta pilihan (Review Focus 4): tidak ditebak, baris tetap belum lengkap sampai sebelum/sesudah dipilih', () => {
    const { kasus, id } = barisBaru('ANAK_LK', 1990);
    const tertunda = jawabLanjutan(pilihKeadaan(kasus, id, 'wafat', 'PEWARIS'), id, 'PEWARIS', { jenis: 'wafat', tahun: tahun(1990) });
    expect(lanjutanDiperlukan(tertunda, id)).toBe('wafat');
    expect(tertunda.belumDiisi).toEqual([id]);
    expect(alasanBarisKurang(tertunda, id, 'PEWARIS')).toMatch(/sebelum\/sesudah/);
    const selesai = jawabLanjutan(tertunda, id, 'PEWARIS', { jenis: 'wafat', waktu: 'sesudah' });
    expect(selesai.urutanWafat).toContain(id);
    expect(selesai.belumDiisi ?? []).toEqual([]);
  });

  it('tahun almarhum kosong → minta pilihan; tanpa tahun sama sekali pun bisa langsung memilih', () => {
    const { kasus, id } = barisBaru('ANAK_LK');
    const tertunda = jawabLanjutan(pilihKeadaan(kasus, id, 'wafat', 'PEWARIS'), id, 'PEWARIS', { jenis: 'wafat', tahun: tahun(1998) });
    expect(lanjutanDiperlukan(tertunda, id)).toBe('wafat');
    const langsung = jawabLanjutan(pilihKeadaan(kasus, id, 'wafat', 'PEWARIS'), id, 'PEWARIS', { jenis: 'wafat', waktu: 'sebelum' });
    expect(langsung.graf.orang[id]!.statusHidup).toBe('wafat');
    expect(langsung.urutanWafat).not.toContain(id);
  });

  it('hilang → putusan: belum ada = mafqud, selesai; sudah ada = jalur wafat', () => {
    const { kasus, id } = barisBaru('ANAK_LK');
    const hilang = pilihKeadaan(kasus, id, 'hilang', 'PEWARIS');
    expect(lanjutanDiperlukan(hilang, id)).toBe('putusan');
    const belum = jawabLanjutan(hilang, id, 'PEWARIS', { jenis: 'putusan', ada: false });
    expect(belum.graf.orang[id]!.statusHidup).toBe('mafqud');
    expect(belum.belumDiisi ?? []).toEqual([]);
    const sudah = jawabLanjutan(hilang, id, 'PEWARIS', { jenis: 'putusan', ada: true });
    expect(keadaanTerpilih(sudah, id)).toBe('wafat');
    expect(lanjutanDiperlukan(sudah, id)).toBe('wafat');
  });

  it('bercerai → iddah: selesai = talakBain, belum = talakRajiIddah; kembali ke hidup memulihkan nikah utuh', () => {
    const { kasus, id } = barisBaru('ISTRI');
    const cerai = pilihKeadaan(kasus, id, 'bercerai', 'PEWARIS');
    expect(lanjutanDiperlukan(cerai, id)).toBe('iddah');
    const status = (k: Kasus) => k.graf.pernikahan.find(n => n.idIstri === id)!.status;
    expect(status(jawabLanjutan(cerai, id, 'PEWARIS', { jenis: 'iddah', selesai: true }))).toBe('talakBain');
    const belumSelesai = jawabLanjutan(cerai, id, 'PEWARIS', { jenis: 'iddah', selesai: false });
    expect(status(belumSelesai)).toBe('talakRajiIddah');
    expect(belumSelesai.belumDiisi ?? []).toEqual([]);
    expect(status(pilihKeadaan(belumSelesai, id, 'hidup', 'PEWARIS'))).toBe('utuh');
  });

  it('khuntsa → baligh memakai pemetaan DialogKeadaan', () => {
    const { kasus, id } = barisBaru('ANAK_LK');
    const dasar = pilihKeadaan(kasus, id, 'khuntsa', 'PEWARIS');
    expect(lanjutanDiperlukan(dasar, id)).toBe('baligh');
    const sudah = jawabLanjutan(dasar, id, 'PEWARIS', { jenis: 'baligh', sudah: true });
    const belum = jawabLanjutan(dasar, id, 'PEWARIS', { jenis: 'baligh', sudah: false });
    expect(sudah.graf.orang[id]!.khuntsa).toBe(terapkanKeadaan(kasus, id, { jenis: 'khuntsa', keadaan: 'tidakDiharapkanJelas' }).graf.orang[id]!.khuntsa);
    expect(belum.graf.orang[id]!.khuntsa).toBe('diharapkanJelas');
    expect(sudah.belumDiisi ?? []).toEqual([]);
  });

  it('mengganti dari wafat ke hidup membuang urutan wafat dan tahun wafat', () => {
    const { kasus, id } = barisBaru('ANAK_LK', 1975);
    const wafat = jawabLanjutan(pilihKeadaan(kasus, id, 'wafat', 'PEWARIS'), id, 'PEWARIS', { jenis: 'wafat', tahun: tahun(1998) });
    const hidup = pilihKeadaan(wafat, id, 'hidup', 'PEWARIS');
    expect(hidup.urutanWafat).not.toContain(id);
    expect(hidup.waktu?.[id]?.wafat).toBeUndefined();
  });
});

describe('wafat sesudah yang belum didukung engine (review P5)', () => {
  it('tahun yang berarti sesudah tetapi engine belum mendukungnya menampilkan alasan, bukan diam', () => {
    const a = tambah(kasusBaru('L'), 'PEWARIS', 'ANAK_LK');
    const b = tambah(a.kasus, 'PEWARIS', 'ANAK_PR');
    let kasus = terapkanKeadaan({ ...b.kasus, waktu: { PEWARIS: { wafat: tahun(1990) } } }, a.id, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    kasus = pilihKeadaan({ ...kasus, belumDiisi: [b.id] }, b.id, 'wafat', 'PEWARIS');
    kasus = jawabLanjutan(kasus, b.id, 'PEWARIS', { jenis: 'wafat', tahun: tahun(2000) });
    expect(kasus.urutanWafat).not.toContain(b.id);
    expect(alasanWafatSesudahDitolak(kasus, b.id, 'PEWARIS')).toBe('Keadaan ini belum bisa dihitung otomatis');
    expect(alasanWafatSesudahDitolak(kasus, a.id, 'PEWARIS')).toBeNull();
  });
});

describe('status nikah dibaca dan diubah pada pernikahan dengan almarhum (review kecil c)', () => {
  /** Siti istri pewaris; ia juga pernah menikah dengan Zaid (talak bain) yang tercatat lebih dulu di daftar. */
  function sitiDuaPernikahan() {
    const siti = tambah(kasusBaru('L'), 'PEWARIS', 'ISTRI');
    const zaid = tambah(siti.kasus, 'PEWARIS', 'SAUDARA_KANDUNG');
    const kasus: Kasus = {
      ...zaid.kasus,
      graf: { ...zaid.kasus.graf, pernikahan: [{ idSuami: zaid.id, idIstri: siti.id, status: 'talakBain' }, ...zaid.kasus.graf.pernikahan] },
    };
    return { kasus, siti: siti.id };
  }

  it('pernikahan lain yang berakhir tidak membuat Siti terbaca "bercerai"', () => {
    const { kasus, siti } = sitiDuaPernikahan();
    expect(keadaanTerpilih(kasus, siti)).toBe('hidup');
  });

  it('memilih bercerai mengubah pernikahan dengan pewaris, bukan yang pertama', () => {
    const { kasus, siti } = sitiDuaPernikahan();
    const hasil = pilihKeadaan(kasus, siti, 'bercerai', 'PEWARIS');
    const denganPewaris = hasil.graf.pernikahan.find(nikah => nikah.idSuami === 'PEWARIS')!;
    expect(denganPewaris.status).toBe('talakRajiIddah');
    expect(hasil.graf.pernikahan.find(nikah => nikah.idSuami !== 'PEWARIS')!.status).toBe('talakBain');
    expect(keadaanTerpilih(hasil, siti)).toBe('bercerai');
  });

  it('pindah dari bercerai ke hidup memulihkan pernikahan dengan pewaris saja', () => {
    const { kasus, siti } = sitiDuaPernikahan();
    const hasil = pilihKeadaan(pilihKeadaan(kasus, siti, 'bercerai', 'PEWARIS'), siti, 'hidup', 'PEWARIS');
    expect(hasil.graf.pernikahan.find(nikah => nikah.idSuami === 'PEWARIS')!.status).toBe('utuh');
    expect(hasil.graf.pernikahan.find(nikah => nikah.idSuami !== 'PEWARIS')!.status).toBe('talakBain');
  });
});
