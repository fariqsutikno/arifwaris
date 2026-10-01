import { describe, expect, it } from 'vitest';
import type { GrafKeluarga, KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan } from '../kasus';
import { aksiTersedia, bolehHapus, dampakHapus, pasanganAktif, PASANGAN_LAIN, tambahDariOrang } from '../kerabatPohon';

const bangun = (kunci: KunciAhliWaris[]): GrafKeluarga =>
  kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasusBaru('L').graf);

describe('aksiTersedia', () => {
  it('pewaris kosong: orang tua, pasangan, anak, saudara', () => {
    expect(aksiTersedia(bangun([]), 'PEWARIS')).toEqual(['orangTua', 'pasangan', 'anak', 'saudara']);
  });
  it('ayah dan ibu sudah terisi: orang tua hilang', () => {
    expect(aksiTersedia(bangun(['AYAH', 'IBU']), 'PEWARIS')).not.toContain('orangTua');
  });
  it('empat istri: pasangan hilang [R04-3]', () => {
    expect(aksiTersedia(bangun(['ISTRI', 'ISTRI', 'ISTRI', 'ISTRI']), 'PEWARIS')).not.toContain('pasangan');
  });
});

describe('tambahDariOrang', () => {
  it('pasangan pewaris laki-laki = istri, bernama', () => {
    const { graf, idBaru } = tambahDariOrang(bangun([]), 'PEWARIS', { aksi: 'pasangan', nama: '  Siti ' });
    expect(graf.orang[idBaru]).toMatchObject({ jenisKelamin: 'P', nama: 'Siti' });
    expect(graf.pernikahan).toEqual([{ idSuami: 'PEWARIS', idIstri: idBaru, status: 'utuh' }]);
  });
  it('anak lewat menu = anak lewat daftar ± (graf identik)', () => {
    const awal = bangun(['ISTRI']);
    const lewatMenu = tambahDariOrang(awal, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L' }).graf;
    expect(lewatMenu).toEqual(tambahAhliWaris(awal, 'PEWARIS', 'ANAK_LK'));
  });
  it('dua istri hidup tanpa pilihan: galat; dengan pilihan atau PASANGAN_LAIN: lolos', () => {
    const graf = bangun(['ISTRI', 'ISTRI']);
    const [istri1] = pasanganAktif(graf, 'PEWARIS');
    expect(() => tambahDariOrang(graf, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L' })).toThrow();
    expect(tambahDariOrang(graf, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L', idPasangan: istri1 }).graf.orang).toBeTruthy();
    const lain = tambahDariOrang(graf, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'P', idPasangan: PASANGAN_LAIN });
    expect(lain.graf.orang[lain.idBaru]!.idIbu).toBeUndefined();
  });
  it('orang tua: ayah menempel pada idAyah', () => {
    const { graf, idBaru } = tambahDariOrang(bangun([]), 'PEWARIS', { aksi: 'orangTua', sebagai: 'ayah' });
    expect(graf.orang.PEWARIS!.idAyah).toBe(idBaru);
    expect(() => tambahDariOrang(graf, 'PEWARIS', { aksi: 'orangTua', sebagai: 'ayah' })).toThrow();
  });
  it('saudara sebapak: ayah sama, ibu berbeda', () => {
    const awal = bangun(['AYAH', 'IBU']);
    const { graf, idBaru } = tambahDariOrang(awal, 'PEWARIS', { aksi: 'saudara', jenisKelamin: 'L', jalur: 'sebapak' });
    expect(graf.orang[idBaru]!.idAyah).toBe(awal.orang.PEWARIS!.idAyah);
    expect(graf.orang[idBaru]!.idIbu).not.toBe(awal.orang.PEWARIS!.idIbu);
  });
});

describe('hapus', () => {
  it('pewaris tidak boleh dihapus', () => {
    expect(bolehHapus(bangun([]), 'PEWARIS')).toBe(false);
  });
  it('orang dengan keturunan menjadi penghubung', () => {
    const awal = tambahDariOrang(bangun(['ANAK_LK']), 'PEWARIS', { aksi: 'pasangan' }).graf;
    const anak = Object.values(awal.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    const dengan = tambahDariOrang(awal, anak, { aksi: 'anak', jenisKelamin: 'L' }).graf;
    expect(dampakHapus(dengan, anak).menjadiPenghubung).toBe(true);
    expect(dampakHapus(dengan, anak).pasangan).toEqual([]);
    expect(bolehHapus(dengan, anak)).toBe(true);
  });
  it('rapikanKeadaan membuang id yang sudah dihapus dari urutan wafat', () => {
    let kasus = { ...kasusBaru('L'), graf: bangun(['ANAK_LK']) };
    const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [anak]: { ...kasus.graf.orang[anak]!, statusHidup: 'hidup' } } }, urutanWafat: [anak] };
    const { [anak]: _hapus, ...sisa } = kasus.graf.orang;
    expect(rapikanKeadaan({ ...kasus, graf: { ...kasus.graf, orang: sisa } }).urutanWafat).toEqual([]);
  });
});
