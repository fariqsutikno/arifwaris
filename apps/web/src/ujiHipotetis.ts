// Uji hipotetis (spec kanvas silsilah 9.3): UI bertanya ke engine "kalau ada orang di posisi ini / kalau urutannya begini,
// apakah hasilnya berubah?" supaya hanya pertanyaan yang berpengaruh yang ditanyakan. Aturan hajb tetap di engine.
// Hasil engine yang tidak OK, galat, atau kasus yang memuat orang belum pasti = "tetap tanya" (aman).

import { hitungDzawilArham, hitungMunasakhat, type HasilEngine, type IdOrang, type KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from './checklist';
import { adaBelumPasti, keInputEngine } from '@waris/latihan';
import type { Kasus } from './kasus';

type HasilMunasakhatOk = Extract<ReturnType<typeof hitungMunasakhat>, { status: 'OK' }>;

// Engine diam-diam menganggap orang `tidakDiketahui` bukan ahli waris, jadi ujinya tidak boleh dipercaya (tetap tanya).
const tidakBisaDiuji = (kasus: Kasus) => adaBelumPasti(kasus)
  || Object.values(kasus.graf.orang).some(orang => !orang.penghubung && orang.statusHidup === 'tidakDiketahui');

/** Apakah `id` menerima saham. Bila `mayitKonteks` punya sisa yang keluar ke dzawil arham, kerabat jauhnya dianggap berpengaruh. */
export function menerima(kasus: Kasus, id: IdOrang, mayitKonteks?: IdOrang): boolean {
  if (tidakBisaDiuji(kasus)) return true;
  try {
    if (kasus.urutanWafat.length === 0) {
      const hasil = hitungDzawilArham(keInputEngine(kasus));
      return hasil.status !== 'OK' || adaSahamDi(hasil, id);
    }
    const hasil = hitungMunasakhatKasus(kasus);
    if (hasil.status !== 'OK') return true;
    return (hasil.saham[id] ?? 0n) > 0n
      || hasil.daftarLangkah.some(langkah => adaSahamDi(langkah.hasil, id))
      || (mayitKonteks !== undefined && hasil.sisaKeluar.some(sisa => sisa.mayit === mayitKonteks));
  } catch {
    return true;
  }
}

/** Posisi `kunci` (dari sisi `idMayit`) perlu ditanyakan bila orang hipotetis di posisi itu akan menerima sesuatu. */
export function posisiPerluDitanya(kasus: Kasus, idMayit: IdOrang, kunci: KunciAhliWaris, opsi: { idInduk?: IdOrang } = {}): boolean {
  let graf;
  try { graf = tambahAhliWaris(kasus.graf, idMayit, kunci, opsi); } catch { return false; }   // posisi sudah penuh = sudah diisi
  const idBaru = Object.keys(graf.orang).find(id => !kasus.graf.orang[id] && !graf.orang[id]!.penghubung);
  if (!idBaru) return true;
  return menerima({ ...kasus, graf }, idBaru, idMayit);
}

/** Apakah posisi `id` di urutan wafat mengubah saham akhir. Semua posisi dicoba (urutan wafat biasanya pendek). */
export function urutanBerpengaruh(kasus: Kasus, id: IdOrang): boolean {
  const tanpa = kasus.urutanWafat.filter(lain => lain !== id);
  const sidikSemua = new Set<string>();
  for (let posisi = 0; posisi <= tanpa.length; posisi++) {
    const sidik = sidikSaham({ ...kasus, urutanWafat: [...tanpa.slice(0, posisi), id, ...tanpa.slice(posisi)] });
    if (sidik === null) return true;
    sidikSemua.add(sidik);
    if (sidikSemua.size > 1) return true;
  }
  return false;
}

const hitungMunasakhatKasus = (kasus: Kasus) => hitungMunasakhat({
  dasar: keInputEngine(kasus),
  urutanWafat: kasus.urutanWafat,
  ...(kasus.dikandungSetelahWafat ? { dikandungSetelahWafat: kasus.dikandungSetelahWafat } : {}),
});

const adaSahamDi = (hasil: Extract<HasilEngine, { status: 'OK' }>, id: IdOrang) =>
  hasil.tabel.baris.some(baris => (baris.perOrang[id]?.saham ?? 0n) > 0n);

const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));

/** Saham dinormalkan terhadap jami'ah supaya dua urutan dengan jami'ah berbeda tetap bisa dibandingkan. */
function sidikSaham(kasus: Kasus): string | null {
  if (tidakBisaDiuji(kasus)) return null;
  try {
    const hasil: HasilMunasakhatOk | { status: string } = hitungMunasakhatKasus(kasus);
    if (hasil.status !== 'OK') return null;
    const { saham, jamiah } = hasil as HasilMunasakhatOk;
    return JSON.stringify(Object.entries(saham).filter(([, nilai]) => nilai > 0n).sort(([a], [b]) => a.localeCompare(b))
      .map(([orang, nilai]) => { const pembagi = fpb(nilai, jamiah); return [orang, `${nilai / pembagi}/${jamiah / pembagi}`]; }));
  } catch {
    return null;
  }
}
