// Garis pohon dari kotak yang sudah terukur: menikah (mendatar + cincin), rel pasangan ganda, batang turun, cabang ke anak.
// Fungsi murni (kotak masuk, ruas garis keluar) supaya bisa diuji tanpa DOM; komponen hanya mengukur dan menggambar.

import type { IdOrang } from '@waris/engine';
import type { TataLetak } from './tataLetak';

export interface Kotak { kiri: number; kanan: number; atas: number; bawah: number; tengahX: number; tengahY: number }
/** Ruas lurus [x1, y1, x2, y2]; semuanya mendatar atau tegak. */
export type Ruas = [number, number, number, number];
export interface Garis { ruas: Ruas[]; cincin: Array<[number, number]> }

/** Jarak batang samping dan ujung rel dari tepi kotak. */
const JARAK_SAMPING = 14;
const JARAK_BATANG_DARI_ANAK = 18;
const SELISIH_BATANG = 9;
const JUMLAH_TINGGI_BATANG = 4;

export const jalurDariRuas = (ruas: Ruas[]) => ruas.map(([x1, y1, x2, y2]) => `M${x1},${y1}L${x2},${y2}`).join('');

export function susunGaris(kotak: (id: IdOrang) => Kotak | null, letak: TataLetak): Garis {
  const ruas: Ruas[] = [];
  const cincin: Array<[number, number]> = [];
  const garisNikah = (a: IdOrang, b: IdOrang): [number, number] | null => {
    const [kiri, kanan] = [kotak(a), kotak(b)].sort((p, q) => (p?.tengahX ?? 0) - (q?.tengahX ?? 0));
    if (!kiri || !kanan) return null;
    const y = Math.max(kiri.tengahY, kanan.tengahY);
    ruas.push([kiri.kanan, y, kanan.kiri, y]);
    const titik: [number, number] = [(kiri.kanan + kanan.kiri) / 2, y];
    cincin.push(titik);
    return titik;
  };

  // [C5-1] Induk turun ke satu rel; tiap pasangan menggantung di rel itu. Mengembalikan titik awal batang anak induk yang
  // ibu/ayah anaknya tidak diketahui: di luar kotak pasangan paling kanan, supaya garisnya tidak menembus kotak.
  const ujungRel = new Map<IdOrang, { dariX: number; titik: [number, number] }>();
  for (const { induk, pasangan } of letak.rel) {
    const kotakInduk = kotak(induk);
    const kotakPasangan = pasangan.map(kotak).filter((k): k is Kotak => !!k);
    if (!kotakInduk || kotakPasangan.length === 0) continue;
    const yRel = (kotakInduk.bawah + Math.min(...kotakPasangan.map(k => k.atas))) / 2;
    const xTengah = [kotakInduk.tengahX, ...kotakPasangan.map(k => k.tengahX)];
    ruas.push([kotakInduk.tengahX, kotakInduk.bawah, kotakInduk.tengahX, yRel]);
    ruas.push([Math.min(...xTengah), yRel, Math.max(...xTengah), yRel]);
    for (const k of kotakPasangan) ruas.push([k.tengahX, yRel, k.tengahX, k.atas]);
    cincin.push([kotakInduk.tengahX, yRel]);
    const xLuar = Math.max(...kotakPasangan.map(k => k.kanan)) + JARAK_SAMPING;
    ujungRel.set(induk, { dariX: Math.max(...xTengah), titik: [xLuar, yRel] });
  }

  const titikDariRel = (induk: IdOrang) => {
    const ujung = ujungRel.get(induk);
    if (ujung) ruas.push([ujung.dariX, ujung.titik[1], ujung.titik[0], ujung.titik[1]]);
    return ujung?.titik;
  };

  const semuaKotak = letak.baris.flat().map(kotak).filter((k): k is Kotak => !!k);
  // Keluarga yang anaknya di baris sama mendapat ketinggian batang berbeda, supaya garis mendatarnya tidak menumpuk.
  const jumlahDiBaris = new Map<number, number>();
  for (const { orangTua, anak } of letak.keluarga) {
    const titikAwal = orangTua.length === 2 ? garisNikah(orangTua[0]!, orangTua[1]!)
      : titikDariRel(orangTua[0]!) ?? (() => { const k = kotak(orangTua[0]!); return k ? [k.tengahX, k.bawah] as [number, number] : null; })();
    const daftarAnak = anak.map(kotak).filter((k): k is Kotak => !!k);
    if (!titikAwal || daftarAnak.length === 0) continue;
    // Anak yang terbungkus ke beberapa baris tampilan: tiap baris punya batang sendiri, disambung lewat batang samping di kiri.
    const barisTampil = [...new Set(daftarAnak.map(k => Math.round(k.atas)))].sort((a, b) => a - b);
    // Batang samping di kiri semua kotak pada baris tampil yang dilewatinya, supaya tidak menembus kotak kerabat lain di baris itu.
    const xSamping = barisTampil.length > 1
      ? Math.min(...semuaKotak.filter(k => k.atas >= barisTampil[0]! - 1 && k.atas <= barisTampil.at(-1)! + 1).map(k => k.kiri)) - JARAK_SAMPING : null;
    const yPertama = new Map<number, number>();
    for (const atasAnak of barisTampil) {
      const keBerapa = jumlahDiBaris.get(atasAnak) ?? 0;
      jumlahDiBaris.set(atasAnak, keBerapa + 1);
      const yBatang = atasAnak - JARAK_BATANG_DARI_ANAK - (keBerapa % JUMLAH_TINGGI_BATANG) * SELISIH_BATANG;
      yPertama.set(atasAnak, yBatang);
      const anakBaris = daftarAnak.filter(k => Math.round(k.atas) === atasAnak);
      const awal = atasAnak === barisTampil[0] ? [titikAwal[0]] : [];
      const semuaX = [...awal, ...anakBaris.map(k => k.tengahX), ...(xSamping === null ? [] : [xSamping])];
      if (awal.length) ruas.push([titikAwal[0], titikAwal[1], titikAwal[0], yBatang]);
      else ruas.push([xSamping!, yPertama.get(barisTampil[0]!)!, xSamping!, yBatang]);
      ruas.push([Math.min(...semuaX), yBatang, Math.max(...semuaX), yBatang]);
      for (const k of anakBaris) ruas.push([k.tengahX, yBatang, k.tengahX, k.atas]);
    }
  }
  for (const [a, b] of letak.pasanganSaja) garisNikah(a, b);
  return { ruas, cincin };
}

/** Ruang bingkai kelompok di luar kotak anggotanya; atas lebih longgar untuk label kecil. */
const RUANG_BINGKAI = 6;
const RUANG_BINGKAI_ATAS = 18;
export interface Bingkai { kiri: number; atas: number; lebar: number; tinggi: number; label: string }

/** Bingkai putus-putus per kelompok saudara; kelompok yang terbungkus ke dua baris tampil mendapat satu bingkai per baris, label hanya di yang pertama. */
export function susunBingkai(kotak: (id: IdOrang) => Kotak | null, kelompok: Array<{ label: string; anak: IdOrang[] }>): Bingkai[] {
  return kelompok.flatMap(({ label, anak }) => {
    const daftar = anak.map(kotak).filter((k): k is Kotak => !!k);
    const barisTampil = [...new Set(daftar.map(k => Math.round(k.atas)))].sort((a, b) => a - b);
    return barisTampil.map((atas, urutan): Bingkai => {
      const dibaris = daftar.filter(k => Math.round(k.atas) === atas);
      const kiri = Math.min(...dibaris.map(k => k.kiri)) - RUANG_BINGKAI;
      const kanan = Math.max(...dibaris.map(k => k.kanan)) + RUANG_BINGKAI;
      const bawah = Math.max(...dibaris.map(k => k.bawah)) + RUANG_BINGKAI;
      return { kiri, atas: atas - RUANG_BINGKAI_ATAS, lebar: kanan - kiri, tinggi: bawah - atas + RUANG_BINGKAI_ATAS, label: urutan === 0 ? label : '' };
    });
  });
}
