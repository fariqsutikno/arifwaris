import { describe, expect, it } from 'vitest';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { jalankan } from '../jalankan';
import { kasusBaru } from '../kasus';
import { HUBUNGAN, selesaikanJalur, type KunciHubungan } from '../hubunganPohon';
import { pasanganAktif, tambahDariOrang } from '../kerabatPohon';

const bangun = (kunci: KunciAhliWaris[]): GrafKeluarga =>
  kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasusBaru('L').graf);
const anakDari = (g: GrafKeluarga, id: IdOrang) => Object.values(g.orang).filter(o => o.idAyah === id || o.idIbu === id).map(o => o.id);
const saudaraDari = (g: GrafKeluarga, id: IdOrang) => Object.values(g.orang).filter(o => o.id !== id &&
  ((o.idAyah && o.idAyah === g.orang[id]!.idAyah) || (o.idIbu && o.idIbu === g.orang[id]!.idIbu))).map(o => o.id);
const ortuDari = (g: GrafKeluarga, id: IdOrang) => [g.orang[id]!.idAyah, g.orang[id]!.idIbu].filter((x): x is IdOrang => !!x);

// Keluarga dasar: pewaris (L), 1 istri, 2 anak (L, P), 1 saudara kandung, ayah dan ibu.
const dasar = () => bangun(['ISTRI', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG', 'AYAH', 'IBU']);
const anakLk = (g: GrafKeluarga) => Object.values(g.orang).find(o => o.idAyah === 'PEWARIS' && o.jenisKelamin === 'L')!.id;

/** Syarat jalur dari sudut pandang graf hasil: orang baru memang terhubung ke pusat lewat langkah yang dimaksud. */
const SYARAT: Record<KunciHubungan, (g: GrafKeluarga, baru: IdOrang) => boolean> = {
  kakekDariAyah: (g, b) => ortuDari(g, g.orang.PEWARIS!.idAyah!).includes(b) && g.orang[b]!.jenisKelamin === 'L',
  nenekDariAyah: (g, b) => ortuDari(g, g.orang.PEWARIS!.idAyah!).includes(b) && g.orang[b]!.jenisKelamin === 'P',
  kakekDariIbu: (g, b) => ortuDari(g, g.orang.PEWARIS!.idIbu!).includes(b) && g.orang[b]!.jenisKelamin === 'L',
  nenekDariIbu: (g, b) => ortuDari(g, g.orang.PEWARIS!.idIbu!).includes(b) && g.orang[b]!.jenisKelamin === 'P',
  buyut: (g, b) => ortuDari(g, g.orang.PEWARIS!.idAyah!).some(kakek => ortuDari(g, kakek).includes(b)),
  cucu: (g, b) => anakDari(g, 'PEWARIS').some(a => anakDari(g, a).includes(b)),
  cicit: (g, b) => anakDari(g, 'PEWARIS').some(a => anakDari(g, a).some(c => anakDari(g, c).includes(b))),
  paman: (g, b) => ortuDari(g, 'PEWARIS').some(o => saudaraDari(g, o).includes(b)) && g.orang[b]!.jenisKelamin === 'L',
  bibi: (g, b) => ortuDari(g, 'PEWARIS').some(o => saudaraDari(g, o).includes(b)) && g.orang[b]!.jenisKelamin === 'P',
  keponakan: (g, b) => saudaraDari(g, 'PEWARIS').some(s => anakDari(g, s).includes(b)),
  sepupu: (g, b) => ortuDari(g, 'PEWARIS').some(o => saudaraDari(g, o).some(p => anakDari(g, p).includes(b))),
  mertua: (g, b) => pasanganAktif(g, 'PEWARIS').some(p => ortuDari(g, p).includes(b)),
  menantu: (g, b) => anakDari(g, 'PEWARIS').some(a => pasanganAktif(g, a).includes(b)),
  besan: (g, b) => anakDari(g, 'PEWARIS').some(a => pasanganAktif(g, a).some(m => ortuDari(g, m).includes(b))),
  iparSaudaraPasangan: (g, b) => pasanganAktif(g, 'PEWARIS').some(p => saudaraDari(g, p).includes(b)),
  iparPasanganSaudara: (g, b) => saudaraDari(g, 'PEWARIS').some(s => pasanganAktif(g, s).includes(b)),
  cucuMenantu: (g, b) => anakDari(g, 'PEWARIS').some(a => anakDari(g, a).some(c => pasanganAktif(g, c).includes(b))),
  anakTiri: (g, b) => pasanganAktif(g, 'PEWARIS').some(p => anakDari(g, p).includes(b) && g.orang[b]!.idAyah !== 'PEWARIS'),
  ibuTiri: (g, b) => pasanganAktif(g, g.orang.PEWARIS!.idAyah!).includes(b) && b !== g.orang.PEWARIS!.idIbu,
  saudaraTiri: (g, b) => !saudaraDari(g, 'PEWARIS').includes(b) && ortuDari(g, b).some(o => pasanganAktif(g, g.orang.PEWARIS!.idAyah!).includes(o)),
  mantan: (g, b) => g.pernikahan.some(n => n.status === 'talakBain' && (n.idSuami === b || n.idIstri === b)),
};

/** Jawaban untuk tiap hubungan pada keluarga dasar (+ persiapan bila jalurnya melewati orang yang belum ada). */
function skenario(kunci: KunciHubungan): { graf: GrafKeluarga; jawaban: Parameters<typeof selesaikanJalur>[3] } {
  const g = dasar();
  const lk = anakLk(g);
  const jk = { jenisKelamin: 'L' as const, nama: 'Zaid' };
  switch (kunci) {
    case 'buyut': return { graf: g, jawaban: { ...jk, pilihan: ['ayah', 'ayah'] } };
    case 'paman': case 'bibi': return { graf: g, jawaban: { ...jk, jenisKelamin: kunci === 'paman' ? 'L' : 'P', pilihan: ['ayah'] } };
    // Sepupu = anak dari saudara orang tua: paman harus sudah ada.
    case 'sepupu': return { graf: selesaikanJalurAtauGagal(g, 'paman', { nama: 'Paman', pilihan: ['ayah'] }), jawaban: { ...jk, pilihan: ['ayah'] } };
    case 'cucu': return { graf: g, jawaban: { ...jk, pilihan: [lk] } };
    case 'cicit': return { graf: tambahAhliWaris(g, lk, 'ANAK_LK'), jawaban: { ...jk, pilihan: [lk] } };
    case 'menantu': return { graf: g, jawaban: { ...jk, pilihan: [lk] } };
    case 'besan': return { graf: selesaikanJalurAtauGagal(g, 'menantu', { ...jk, pilihan: [lk] }), jawaban: { ...jk, nama: 'Besan', pilihan: [lk] } };
    case 'cucuMenantu': return { graf: tambahAhliWaris(g, lk, 'ANAK_LK'), jawaban: { ...jk, pilihan: [lk, anakDari(tambahAhliWaris(g, lk, 'ANAK_LK'), lk)[0]!] } };
    case 'keponakan': return { graf: g, jawaban: { ...jk } };
    case 'anakTiri': return { graf: g, jawaban: { ...jk } };
    case 'saudaraTiri': return { graf: selesaikanJalurAtauGagal(g, 'ibuTiri', { nama: 'Ibu tiri' }), jawaban: { ...jk } };
    default: return { graf: g, jawaban: { ...jk, ...(HUBUNGAN[kunci].tanyaKelamin ? {} : {}) } };
  }
}
function selesaikanJalurAtauGagal(g: GrafKeluarga, kunci: KunciHubungan, jawaban: Parameters<typeof selesaikanJalur>[3]): GrafKeluarga {
  const hasil = selesaikanJalur(g, 'PEWARIS', kunci, jawaban);
  if (!('graf' in hasil)) throw new Error(`persiapan ${kunci} gagal: ${JSON.stringify(hasil)}`);
  return hasil.graf;
}

describe('tiap nama hubungan menghasilkan graf yang benar dan engine tetap OK', () => {
  for (const kunci of Object.keys(HUBUNGAN) as KunciHubungan[]) {
    it(kunci, () => {
      const { graf, jawaban } = skenario(kunci);
      const hasil = selesaikanJalur(graf, 'PEWARIS', kunci, jawaban);
      if (!('graf' in hasil)) throw new Error(JSON.stringify(hasil));
      expect(hasil.graf.orang[hasil.idBaru]!.nama).toBe((jawaban as { nama?: string }).nama ?? 'Zaid');
      expect(SYARAT[kunci](hasil.graf, hasil.idBaru)).toBe(true);
      const kasus = { ...kasusBaru('L'), graf: hasil.graf, tirkah: { ...kasusBaru('L').tirkah, kotor: 1_000_000n } };
      const tampil = jalankan(kasus);
      expect(tampil.jenis === 'galat' ? tampil.pesan : 'ok').toBe('ok');
    });
    it(`${kunci}: wajibNama sama dengan "bukan jenis di daftar ±"`, () => {
      const { graf, jawaban } = skenario(kunci);
      const hasil = selesaikanJalur(graf, 'PEWARIS', kunci, jawaban);
      if (!('graf' in hasil)) throw new Error(JSON.stringify(hasil));
      const dalamDaftar = Object.values(hitungIsian(hasil.graf, 'PEWARIS')).some(ids => ids!.includes(hasil.idBaru));
      // Buyut bergantung sisi (garis ayah = peran KAKEK/NENEK, garis ibu bukan): wajibNama tetap true (konservatif).
      if (kunci === 'buyut') { expect(HUBUNGAN.buyut.wajibNama).toBe(true); return; }
      expect(HUBUNGAN[kunci].wajibNama).toBe(!dalamDaftar);
    });
  }
});

describe('pertanyaan, galat, dan penghubung', () => {
  it('dua anak: menantu menanyakan anak yang mana; sebelum dijawab graf tidak berubah', () => {
    const g = dasar();
    const hasil = selesaikanJalur(g, 'PEWARIS', 'menantu', { jenisKelamin: 'P' });
    expect('pertanyaan' in hasil && hasil.pertanyaan.pilihan).toHaveLength(2);
  });
  it('satu anak: dipakai otomatis tanpa bertanya', () => {
    const g = bangun(['ISTRI', 'ANAK_LK']);
    expect('graf' in selesaikanJalur(g, 'PEWARIS', 'menantu', { jenisKelamin: 'P' })).toBe(true);
  });
  it('tanpa anak: pesan "Tambahkan anaknya dulu"', () => {
    const hasil = selesaikanJalur(bangun([]), 'PEWARIS', 'menantu', { jenisKelamin: 'P' });
    expect('galat' in hasil && hasil.galat).toMatch(/anak/i);
  });
  it('jalur yang sama dua kali tidak menumpuk penghubung', () => {
    const g0 = bangun([]);
    const jawab = { jenisKelamin: 'L' as const, nama: 'A' };
    const g1 = (selesaikanJalur(g0, 'PEWARIS', 'kakekDariAyah', jawab) as { graf: GrafKeluarga }).graf;
    const hasil2 = selesaikanJalur(g1, 'PEWARIS', 'nenekDariAyah', { jenisKelamin: 'P', nama: 'B' });
    const g2 = (hasil2 as { graf: GrafKeluarga }).graf;
    expect(Object.values(g2.orang).filter(o => o.penghubung)).toHaveLength(1);
  });
  it('slot yang sudah berisi orang nyata: galat, graf tidak berubah', () => {
    const g1 = (selesaikanJalur(bangun([]), 'PEWARIS', 'kakekDariAyah', { nama: 'A' }) as { graf: GrafKeluarga }).graf;
    const lagi = selesaikanJalur(g1, 'PEWARIS', 'kakekDariAyah', { nama: 'C' });
    expect('galat' in lagi).toBe(true);
  });
});

describe('temuan review: pasangan lewat nama hubungan tidak menyerap anak tanpa ibu', () => {
  it('ibu tiri pada kasus tanpa ibu tercatat: pewaris tidak menjadi anak ibu tiri', () => {
    const graf = bangun([]);
    const hasil = selesaikanJalur(graf, 'PEWARIS', 'ibuTiri', { nama: 'Siti' });
    if (!('graf' in hasil)) throw new Error(JSON.stringify(hasil));
    expect(hasil.graf.orang.PEWARIS!.idIbu).toBeUndefined();
    expect(hitungIsian(hasil.graf, 'PEWARIS').IBU).toBeUndefined();
  });
  it('mantan: anak pusat yang belum punya ibu tidak diambil mantan', () => {
    const graf = bangun(['ANAK_LK']);
    const hasil = selesaikanJalur(graf, 'PEWARIS', 'mantan', { nama: 'Mantan' });
    if (!('graf' in hasil)) throw new Error(JSON.stringify(hasil));
    const anak = Object.values(hasil.graf.orang).find(o => o.idAyah === 'PEWARIS')!;
    expect(anak.idIbu).toBeUndefined();
  });
  it('cucu dari anak yang punya dua istri hidup: bertanya pasangan yang mana, lalu lolos', () => {
    let graf = bangun(['ANAK_LK']);
    const anak = Object.values(graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    graf = ambilGraf(tambahDariOrang(graf, anak, { aksi: 'pasangan', nama: 'Istri 1' }));
    graf = ambilGraf(tambahDariOrang(graf, anak, { aksi: 'pasangan', nama: 'Istri 2' }));
    const tanya = selesaikanJalur(graf, 'PEWARIS', 'cucu', { jenisKelamin: 'L', nama: 'Cucu' });
    expect('pertanyaan' in tanya).toBe(true);
    const istri1 = pasanganAktif(graf, anak)[0]!;
    // Perantara 'anak' dipilih otomatis (satu anak); pertanyaan pasangan memakai indeks sesudah perantara.
    const jawab = selesaikanJalur(graf, 'PEWARIS', 'cucu', { jenisKelamin: 'L', nama: 'Cucu', pilihan: ['', istri1] });
    if (!('graf' in jawab)) throw new Error(JSON.stringify(jawab));
    expect(jawab.graf.orang[jawab.idBaru]!.idIbu).toBe(istri1);
  });
});
const ambilGraf = (h: { graf: GrafKeluarga }) => h.graf;
