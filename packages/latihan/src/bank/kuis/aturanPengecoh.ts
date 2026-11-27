// Aturan salah paham yang melahirkan pengecoh (spec soal kuis §3.2). Menerima fakta kasus + pertanyaan; menyerahkan
// daftar jawaban keliru (kosong bila aturan tak berlaku atau tak bisa dihitung jujur untuk pertanyaan itu).
// Tiap aturan membawa `dasar` = kode rujukan KB yang meluruskannya. Urutan tabel = prioritas bila dua aturan
// menghasilkan angka yang sama (yang pertama memilikinya). Pembangun menjatuhkan pengecoh yang sama dengan jawaban benar.

import type { KunciAhliWaris } from '@waris/engine';
import { kali, pecahan, type Pecahan } from '@waris/math';
import { kunciAshabah, urutKunci, type FaktaKasus, type BarisFakta, type Jawaban } from './fakta.js';
import { hisabUlang, type HasilHisab } from './hisabUlang.js';
import type { PertanyaanKuis } from './kodeKuis.js';

export const DAFTAR_ATURAN = ['lupaAul', 'lupaRadd', 'lupaHajb', 'ibuTetapSepertiga', 'pasanganTertukar', 'ashabahSamaRata', 'ashabahTerbalik'] as const;
export type AturanPengecoh = typeof DAFTAR_ATURAN[number];

/** Satu jawaban keliru + bahan kalimat alasannya (diisi aturan; kata-katanya milik diksi `soal_kuis.pengecoh.*`). */
export type Pengecoh = { aturan: AturanPengecoh; jawaban: Jawaban; bahan: BahanAlasan };
export type BahanAlasan =
  | { aturan: 'lupaAul'; ashl: bigint; aul: bigint }
  | { aturan: 'lupaRadd'; ashl: bigint; radd: bigint }
  | { aturan: 'lupaHajb'; mahjub: KunciAhliWaris; hajib: KunciAhliWaris[]; tanya: 'gugur' | 'ashabah' }
  | { aturan: 'ibuTetapSepertiga'; sebab: 'faruWarits' | 'jamIkhwah' }
  | { aturan: 'pasanganTertukar'; pasangan: 'SUAMI' | 'ISTRI'; benar: Pecahan; keliru: Pecahan; sebab: 'adaKeturunan' | 'tanpaKeturunan' }
  | { aturan: 'ashabahSamaRata' }
  | { aturan: 'ashabahTerbalik'; kalah: KunciAhliWaris; kuat: KunciAhliWaris[]; tanya: 'gugur' | 'ashabah' };

type Aturan = {
  id: AturanPengecoh;
  /** Kode rujukan KB (tabel "Dasar dan Rujukan") yang meluruskan salah paham ini. */
  dasar: readonly string[];
  hitung: (fakta: FaktaKasus, tanya: PertanyaanKuis) => Array<Omit<Pengecoh, 'aturan'>>;
};

/** [R05-2] ashabah bi nafsihi, yang bisa kalah kuat oleh kerabat yang lebih dekat. */
const KUNCI_ASHABAH_BI_NAFSIHI: readonly KunciAhliWaris[] = [
  'ANAK_LK', 'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK',
  'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK',
];

const FARDH_IBU_TANPA_PENGURANG = pecahan(1n, 3n);
const PASANGAN: ReadonlyArray<{ id: 'SUAMI' | 'ISTRI'; tanpaKeturunan: Pecahan; adaKeturunan: Pecahan }> = [
  { id: 'SUAMI', tanpaKeturunan: pecahan(1n, 2n), adaKeturunan: pecahan(1n, 4n) },
  { id: 'ISTRI', tanpaKeturunan: pecahan(1n, 4n), adaKeturunan: pecahan(1n, 8n) },
];

/** Bagian satu kunci di dunia hasil hisab ulang; baris berkunci banyak dibagi menurut perbandingan saham engine. */
function bagianKunciDunia(fakta: FaktaKasus, dunia: HasilHisab, kunci: KunciAhliWaris): Pecahan | null {
  let total = pecahan(0n);
  for (const isi of fakta.baris) {
    const saham = isi.sahamAkhir[kunci];
    if (!saham) continue;
    total = tambahPecahan(total, kali(dunia.bagianBaris.get(isi.id)!, pecahan(saham, jumlahSaham(isi))));
  }
  return total.n > 0n ? total : null;
}
const jumlahSaham = (isi: BarisFakta) => Object.values(isi.sahamAkhir).reduce<bigint>((total, saham) => total + (saham ?? 0n), 0n);
const tambahPecahan = (a: Pecahan, b: Pecahan) => pecahan(a.n * b.d + b.n * a.d, a.d * b.d);

/** Jawaban untuk pertanyaan bagian/ashlAkhir di dunia keliru; null bila pertanyaan lain atau dunia itu tak terhitung. */
function jawabanDunia(fakta: FaktaKasus, tanya: PertanyaanKuis, dunia: HasilHisab | null): Jawaban | null {
  if (!dunia) return null;
  if (tanya.jenis === 'ashlAkhir') return fakta.tashih === undefined ? { tipe: 'penyebut', nilai: dunia.penyebut } : null;
  if (tanya.jenis !== 'bagian') return null;
  const nilai = bagianKunciDunia(fakta, dunia, tanya.kunci);
  return nilai ? { tipe: 'pecahan', nilai } : null;
}

const hanya = <T>(nilai: T | null | undefined): T[] => (nilai ? [nilai] : []);

/** Bagian sebelum tahap tertentu (kolom ashl) untuk kunci pertanyaan: saham di ashl ÷ ashl. */
function bagianDiAshl(fakta: FaktaKasus, kunci: KunciAhliWaris): Pecahan {
  let total = pecahan(0n);
  for (const isi of fakta.baris) {
    const saham = isi.sahamAkhir[kunci];
    if (saham) total = tambahPecahan(total, kali(pecahan(isi.sahamAshl, fakta.ashl), pecahan(saham, jumlahSaham(isi))));
  }
  return total;
}

function sebelumTahap(fakta: FaktaKasus, tanya: PertanyaanKuis): Jawaban | null {
  if (tanya.jenis === 'bagian') return { tipe: 'pecahan', nilai: bagianDiAshl(fakta, tanya.kunci) };
  return tanya.jenis === 'ashlAkhir' && fakta.tashih === undefined ? { tipe: 'penyebut', nilai: fakta.ashl } : null;
}

export const ATURAN_PENGECOH: readonly Aturan[] = [
  {
    // [R09-3] 'aul menaikkan penyebut dan mengecilkan semua bagian sebanding; [R09-4] batas 'aul.
    id: 'lupaAul', dasar: ['R09-3', 'R09-4'],
    hitung: (fakta, tanya) => (fakta.aul === undefined ? [] : hanya(sebelumTahap(fakta, tanya)).map(jawaban => ({ jawaban, bahan: { aturan: 'lupaAul' as const, ashl: fakta.ashl, aul: fakta.aul! } }))),
  },
  {
    // [R09-7] sisa dikembalikan menurut perbandingan saham (radd); angka sebelum radd adalah bagian fardh saja.
    id: 'lupaRadd', dasar: ['R09-7', 'R09-9'],
    hitung: (fakta, tanya) => (fakta.radd === undefined ? [] : hanya(sebelumTahap(fakta, tanya)).map(jawaban => ({ jawaban, bahan: { aturan: 'lupaRadd' as const, ashl: fakta.ashl, radd: fakta.radd! } }))),
  },
  {
    // [R06-3] [R06-4] [R06-5] tabel hajib-mahjub; [R05-3] yang terhalang tidak ikut menerima sisa.
    id: 'lupaHajb', dasar: ['R06-3', 'R06-4', 'R06-5'],
    hitung: (fakta, tanya) => {
      const [mahjub] = fakta.mahjub;
      if (!mahjub || fakta.mahjub.length !== 1 || fakta.istimewa) return [];
      if (tanya.jenis === 'gugur') return [{ jawaban: { tipe: 'kunci', nilai: [] }, bahan: { aturan: 'lupaHajb', mahjub: mahjub.kunci, hajib: mahjub.hajib, tanya: 'gugur' } }];
      if (tanya.jenis !== 'ashabah' || !KUNCI_ASHABAH_BI_NAFSIHI.includes(mahjub.kunci)) return [];
      const urut = urutKunci([...kunciAshabah(fakta), mahjub.kunci]);
      return [{ jawaban: { tipe: 'kunci', nilai: urut }, bahan: { aturan: 'lupaHajb', mahjub: mahjub.kunci, hajib: mahjub.hajib, tanya: 'ashabah' } }];
    },
  },
  {
    // [R04-4] ibu 1/3 hanya tanpa far'u warits dan tanpa dua saudara atau lebih (saudara yang gugur tetap dihitung [R06-6]).
    id: 'ibuTetapSepertiga', dasar: ['R04-4', 'R06-6'],
    hitung: (fakta, tanya) => {
      const ibu = fakta.baris.find(isi => isi.id === 'IBU');
      if (!ibu || (ibu.alasanFardh !== 'ADA_FARU_WARITS' && ibu.alasanFardh !== 'JAM_IKHWAH')) return [];
      const jawaban = jawabanDunia(fakta, tanya, hisabUlang(fakta, { IBU: FARDH_IBU_TANPA_PENGURANG }));
      return jawaban ? [{ jawaban, bahan: { aturan: 'ibuTetapSepertiga', sebab: ibu.alasanFardh === 'JAM_IKHWAH' ? 'jamIkhwah' : 'faruWarits' } }] : [];
    },
  },
  {
    // [R04-2] suami 1/2 atau 1/4, istri 1/4 atau 1/8, tergantung ada tidaknya far'u warits.
    id: 'pasanganTertukar', dasar: ['R04-2', 'R04-3'],
    hitung: (fakta, tanya) => PASANGAN.flatMap(pasangan => {
      const isi = fakta.baris.find(baris => baris.id === pasangan.id);
      if (!isi || (isi.alasanFardh !== 'ADA_FARU_WARITS' && isi.alasanFardh !== 'TANPA_FARU_WARITS')) return [];
      const adaKeturunan = isi.alasanFardh === 'ADA_FARU_WARITS';
      const keliru = adaKeturunan ? pasangan.tanpaKeturunan : pasangan.adaKeturunan;
      const jawaban = jawabanDunia(fakta, tanya, hisabUlang(fakta, { [pasangan.id]: keliru }));
      return jawaban ? [{ jawaban, bahan: { aturan: 'pasanganTertukar' as const, pasangan: pasangan.id, benar: isi.fardh!, keliru, sebab: adaKeturunan ? 'adaKeturunan' as const : 'tanpaKeturunan' as const } }] : [];
    }),
  },
  {
    // [R04-11] anak laki-laki mendapat dua kali anak perempuan; [R09-2] ashl semua ashabah = kepala dengan laki-laki dihitung 2.
    id: 'ashabahSamaRata', dasar: ['R04-11', 'R09-2'],
    hitung: (fakta, tanya) => {
      const bahan = { aturan: 'ashabahSamaRata' } as const;
      const isi = fakta.baris.find(baris => baris.ashabah === 'bilGhair' && baris.kunci.length >= 2);
      if (!isi) return [];
      const kepala = Object.values(isi.orang).reduce<number>((total, banyak) => total + (banyak ?? 0), 0);
      if (tanya.jenis === 'ashlAkhir') {
        return fakta.baris.length === 1 && fakta.tashih === undefined ? [{ jawaban: { tipe: 'penyebut', nilai: BigInt(kepala) }, bahan }] : [];
      }
      if (tanya.jenis !== 'bagian' || !isi.kunci.includes(tanya.kunci) || jumlahSaham(isi) === 0n) return [];
      const bagianBaris = pecahan(jumlahSaham(isi), fakta.penyebutAkhir);
      return [{ jawaban: { tipe: 'pecahan', nilai: kali(bagianBaris, pecahan(BigInt(isi.orang[tanya.kunci]!), BigInt(kepala))) }, bahan }];
    },
  },
  {
    // [R05-2] [R05-3] jihah → darajah → quwwah: yang lebih dekat menghalangi yang lebih jauh, bukan sebaliknya.
    id: 'ashabahTerbalik', dasar: ['R05-2', 'R05-3'],
    hitung: (fakta, tanya) => {
      const [mahjub] = fakta.mahjub;
      if (!mahjub || fakta.mahjub.length !== 1 || fakta.istimewa || !KUNCI_ASHABAH_BI_NAFSIHI.includes(mahjub.kunci)) return [];
      if (tanya.jenis === 'gugur') {
        return mahjub.hajib.map(kuat => ({ jawaban: { tipe: 'kunci' as const, nilai: [kuat] }, bahan: { aturan: 'ashabahTerbalik' as const, kalah: mahjub.kunci, kuat: [kuat], tanya: 'gugur' as const } }));
      }
      const kuat = kunciAshabah(fakta).filter(kunci => mahjub.hajib.includes(kunci));
      if (tanya.jenis !== 'ashabah' || kuat.length === 0) return [];
      return [{ jawaban: { tipe: 'kunci', nilai: [mahjub.kunci] }, bahan: { aturan: 'ashabahTerbalik', kalah: mahjub.kunci, kuat, tanya: 'ashabah' } }];
    },
  },
];

/** Semua jawaban keliru yang mungkin untuk pertanyaan ini, belum disaring (sama dengan benar / kembar). */
export const semuaPengecoh = (fakta: FaktaKasus, tanya: PertanyaanKuis): Pengecoh[] =>
  ATURAN_PENGECOH.flatMap(aturan => aturan.hitung(fakta, tanya).map(isi => ({ aturan: aturan.id, ...isi }) as Pengecoh));

