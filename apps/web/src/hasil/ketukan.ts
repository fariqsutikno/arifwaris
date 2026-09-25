// Ketukan animasi langkah perhitungan. Satu ketukan = satu baris penjelasan: siapa yang dibahas baris itu
// menyala dengan warna perannya, orang lain yang disebut menjadi penyebab (oranye) dengan panah ke yang terdampak.
// Tanpa ketukan (null) = seluruh bab sekaligus. Peran hanya dibaca dari data engine (statusOrang, tabel), tanpa aturan fikih baru.

import type { GrafKeluarga, IdOrang, TabelMasalah } from '@waris/engine';
import type { BabPenjelasan, BarisPenjelasan, KolomBab } from '@waris/explain';
import { orangDisebut } from '../layar/Penjelasan';
import type { RingkasanHasil } from './ringkasan';
import type { PeranSorot, SorotLangkah } from './sorot';

export interface DataPeran {
  idPewaris: IdOrang;
  /** Peran pembagian tiap penerima menurut tabel engine (baris punya fardh → fardh, selain itu ashabah). */
  pembagian: Map<IdOrang, 'fardh' | 'ashabah'>;
  terhalang: Set<IdOrang>;
  /** Orang di pohon yang tidak mewarisi dan tidak terhalang (bukan ahli waris sama sekali, atau terkena mani'). */
  bukanAhliWaris: IdOrang[];
}

export function dataPeranDari(graf: GrafKeluarga, ringkasan: RingkasanHasil, tabel: TabelMasalah | null, urutanWafat: IdOrang[]): DataPeran {
  const pembagian = new Map<IdOrang, 'fardh' | 'ashabah'>();
  for (const baris of tabel?.baris ?? []) {
    for (const id of Object.keys(baris.perOrang)) pembagian.set(id, baris.fardh ? 'fardh' : 'ashabah');
  }
  const menerima = new Set(ringkasan.penerima.map(orang => orang.id));
  const terhalang = new Set(ringkasan.terhalang.filter(orang => ringkasan.statusOrang[orang.id]?.jenis === 'mahjub').map(orang => orang.id));
  const bukanAhliWaris = Object.keys(graf.orang).filter(id =>
    id !== graf.idPewaris && !graf.orang[id]!.penghubung && !urutanWafat.includes(id) && !menerima.has(id) && !terhalang.has(id));
  return { idPewaris: graf.idPewaris, pembagian, terhalang, bukanAhliWaris };
}

/** Istilah ashabah di baris = baris itu membahas sisa harta, meski orangnya juga punya fardh (mis. ayah 1/6 + sisa). */
const ISTILAH_ASHABAH = new Set(['ashabah', 'bi-nafsihi', 'bil-ghair', 'maal-ghair', 'muashshib']);
const membahasAshabah = (baris: BarisPenjelasan) =>
  baris.daftarPotongan.some(potongan => potongan.jenis === 'istilah' && ISTILAH_ASHABAH.has(potongan.istilah));

export function sorotKetukan(bab: BabPenjelasan, ketukan: number | null, data: DataPeran, nomorKetukan: number): Omit<SorotLangkah, 'kolomTerbuka'> {
  const peran = new Map<IdOrang, PeranSorot>();
  const panah: Array<[IdOrang, IdOrang]> = [];
  // Saat seluruh bab ditampilkan, peran yang lebih spesifik menang atas "penyebab" dari baris lain.
  const pasang = (id: IdOrang, peranBaru: PeranSorot) => {
    if (id === data.idPewaris) { peran.set(id, 'pewaris'); return; }
    const lama = peran.get(id);
    if (!lama || lama === 'penyebab') peran.set(id, peranBaru);
  };
  const daftarBaris = ketukan === null ? bab.daftarBaris : bab.daftarBaris.slice(ketukan, ketukan + 1);
  for (const baris of daftarBaris) {
    const disebut = orangDisebut([baris]);
    const subjek = baris.subjek ?? [];
    const lain = disebut.filter(id => !subjek.includes(id) && id !== data.idPewaris);
    if (bab.kolom === 'ahliWaris') {
      if (subjek.length === 0) {
        disebut.forEach(id => pasang(id, 'ahliWaris'));
        data.bukanAhliWaris.forEach(id => pasang(id, 'bukan'));
      } else {
        subjek.forEach(id => pasang(id, data.terhalang.has(id) ? 'mahjub' : 'bukan'));
      }
    } else {
      const sasaran = subjek.length > 0 ? subjek : disebut;
      sasaran.forEach(id => pasang(id, membahasAshabah(baris) ? 'ashabah' : data.pembagian.get(id) ?? 'ahliWaris'));
    }
    if (subjek.length > 0) {
      lain.forEach(id => pasang(id, 'penyebab'));
      for (const dari of lain) for (const ke of subjek) panah.push([dari, ke]);
    }
    disebut.filter(id => id === data.idPewaris).forEach(id => pasang(id, 'pewaris'));
  }
  // Bab harta tidak menyebut siapa pun sebagai orang: sorot pewaris sebagai pemilik harta.
  if (peran.size === 0 && bab.kolom === 'nominal') peran.set(data.idPewaris, 'pewaris');
  return { peran, kolom: bab.kolom, panah, ketukan: nomorKetukan };
}

/**
 * Tutorial membangun tabel: kolom baru terbuka saat babnya sudah dilewati. Nominal dan saham per orang baru terbuka
 * di bab terakhir (hasil akhir), walau bab harta di awal juga menyorot kolom nominal.
 */
export function kolomTerbukaSampai(daftarBab: BabPenjelasan[], indeks: number): Set<KolomBab | 'perOrang'> {
  const terakhir = indeks === daftarBab.length - 1;
  const terbuka = new Set<KolomBab | 'perOrang'>(['ahliWaris']);
  daftarBab.slice(0, indeks + 1).forEach(bab => { if (bab.kolom && bab.kolom !== 'nominal') terbuka.add(bab.kolom); });
  if (terakhir) { terbuka.add('nominal'); terbuka.add('perOrang'); }
  return terbuka;
}
