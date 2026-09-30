// Bab penjelasan dzawil arham (bab 14): tanzil → mas'alah perantara → turun ke penerima → (gabung pasangan).
//   Menerima : konteks hasil `hitungDzawilArham` + fungsi penyebut orang (id atau Arab).
//   Memutuskan: hanya memilih kunci & sisipan; jejak DZAWIL_ARHAM_* sudah memuat semua keputusan fikihnya.
//   Menyerahkan: satu Bab yang disisipkan di antara bab harta dan bab hasil (narasi.ts).
// Semua kalimat = templat diksi `narasi.dzawil_arham.*` (id + ar dalam satu kunci; bahasa dipilih penyusun).

import type { GrafKeluarga, IdOrang, KodeKhilafOverlay, Ruleset } from '@waris/engine';
import { angkaArab, barisSisaKeluar, gabungWa, type SebutArab } from './arab.js';
import { ceritaSisaKeluar, type Bab } from './cerita.js';
import type { HasilOk, Konteks } from './context.js';
import { urutanKe } from './people.js';
import { buatBaris, gabungDan, susun, teksKamus, type BarisPenjelasan, type Potongan, type Sisipan } from './segments.js';

const teks = (konteks: Konteks, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] =>
  susun(konteks.penyusun, `narasi.dzawil_arham.${kunci}`, sisipan);

/** Dzawil arham selalu punya langkah mas'alah perantara; hasil pipeline biasa tidak pernah. */
export const adaDzawilArham = (hasil: HasilOk): boolean =>
  hasil.jejak.some(langkah => langkah.jenis === 'DZAWIL_ARHAM_MASALAH_PERANTARA');

export function babDzawilArham(konteks: Konteks, sebut: SebutArab): Bab {
  const arab = konteks.penyusun.bahasa === 'ar';
  // Baris Arab memakai angka Arab (٠١٢) seperti bab Arab lain.
  const baris = (potongan: Potongan[], refs: string[], subjek?: IdOrang[]): BarisPenjelasan => {
    const dasar = buatBaris(potongan, refs, subjek);
    return arab ? { ...dasar, daftarPotongan: dasar.daftarPotongan.map(unsur => ({ ...unsur, teks: angkaArab(unsur.teks) })) } : dasar;
  };
  const daftarBaris: BarisPenjelasan[] = [];

  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) daftarBaris.push(arab ? barisSisaKeluar(konteks, sebut, sisaKeluar) : ceritaSisaKeluar(konteks, sisaKeluar));
  daftarBaris.push(baris(teks(konteks, 'pembuka'), ['R14-5', 'R14-6']));
  daftarBaris.push(...barisKhilaf(konteks, baris));

  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_TANZIL')) {
    daftarBaris.push(baris(teks(konteks, 'tanzil', {
      siapa: sebut([langkah.idOrang]), perantara: sebut([langkah.perantara]), langkah: langkah.langkah,
    }), langkah.refs, [langkah.idOrang]));
  }
  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_TERHIJAB_JIHAH')) {
    daftarBaris.push(baris(teks(konteks, 'terhijab_jihah', { siapa: sebut([langkah.idOrang]), oleh: sebut(langkah.oleh) }), langkah.refs, [langkah.idOrang]));
  }

  const [masalah] = konteks.daftarLangkah('DZAWIL_ARHAM_MASALAH_PERANTARA');
  if (masalah) {
    const butir = Object.entries(masalah.saham).map(([id, saham]) => teks(konteks, 'masalah_butir', { perantara: sebut([id]), saham }));
    const rincian = arab ? gabungWa(konteks.penyusun, butir) : gabungDan(konteks.penyusun, butir);
    daftarBaris.push(baris(teks(konteks, 'masalah', { rincian, masalah: masalah.masalah }), masalah.refs));
    if (masalah.aul !== undefined) daftarBaris.push(baris(teks(konteks, 'aul', { ashl: masalah.ashl, aul: masalah.aul }), ['R14-13']));
    for (const id of masalah.mahjub) daftarBaris.push(baris(teks(konteks, 'perantara_terhijab', { perantara: sebut([id]) }), ['R14-10']));
  }

  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_TURUN')) {
    const penerima = Object.keys(langkah.saham);
    daftarBaris.push(baris(teks(konteks, langkah.rasio === 'samaRata' ? 'turun_sama_rata' : 'turun', {
      perantara: sebut([langkah.perantara]), penerima: sebut(penerima),
    }), langkah.refs, penerima));
  }
  for (const langkah of konteks.daftarLangkah('DZAWIL_ARHAM_DUA_JALUR')) {
    daftarBaris.push(baris(teks(konteks, 'dua_jalur', { siapa: sebut([langkah.idOrang]), perantara: sebut(langkah.perantara) }), langkah.refs, [langkah.idOrang]));
  }
  const [gabung] = konteks.daftarLangkah('DZAWIL_ARHAM_GABUNG_PASANGAN');
  if (gabung) daftarBaris.push(baris(teks(konteks, 'gabung_pasangan', { saham: gabung.saham, masalah: gabung.masalah, jamiah: gabung.jamiah }), gabung.refs));
  return { judul: teksKamus(konteks.penyusun, 'narasi.dzawil_arham.judul'), daftarBaris, kolom: 'bagian' };
}

// ─── Khilaf madzhab ───────────────────────────────────────────────────────────

const namaMadzhab = (konteks: Konteks, ruleset: Ruleset): string =>
  teksKamus(konteks.penyusun, `narasi.${konteks.penyusun.bahasa === 'ar' ? 'arab' : 'umum'}.madzhab.${ruleset}`);
const kunciKhilaf = (kode: KodeKhilafOverlay): string => kode.toLowerCase().replace('-', '_');

function barisKhilaf(konteks: Konteks, baris: (potongan: Potongan[], refs: string[], subjek?: IdOrang[]) => BarisPenjelasan): BarisPenjelasan[] {
  return konteks.daftarLangkah('KHILAF_MADZHAB').map(langkah =>
    baris(teks(konteks, `khilaf_${kunciKhilaf(langkah.kode)}`, { madzhab: namaMadzhab(konteks, langkah.ruleset) }), langkah.refs, langkah.idOrang));
}

// ─── Sebutan orang ────────────────────────────────────────────────────────────

/**
 * Perantara sudah wafat dan dzawil arham tak punya peran di tabel (statusOrang.kunci = DZAWIL_ARHAM), jadi sebutan
 * biasa mengembalikan "kerabat" untuk semuanya. Di sini: perantara disebut menurut posisi tanzilnya ("ayah"), dzawil
 * arham sebagai "kerabat" (bernomor bila lebih dari satu), ahli waris biasa (pasangan) tetap lewat `sebutDasar`.
 */
export function buatSebutArham(konteks: Konteks, graf: GrafKeluarga, sebutDasar: SebutArab): SebutArab {
  const { penyusun } = konteks;
  const arab = penyusun.bahasa === 'ar';
  const kunciPerantara = new Map(konteks.daftarLangkah('DZAWIL_ARHAM_TANZIL').map(langkah => [langkah.perantara, langkah.kunciPerantara]));
  const kunciPeran = (id: IdOrang) => konteks.sebutan.peranDari(id)?.kunci;
  const ahliWarisBiasa = (id: IdOrang) => { const kunci = kunciPeran(id); return !!kunci && kunci !== 'DZAWIL_ARHAM' && kunci !== 'BUKAN_AHLI_WARIS'; };

  const labelDari = (id: IdOrang): string => {
    const kunci = kunciPerantara.get(id);
    if (!kunci) return teksKamus(penyusun, arab ? 'narasi.arab.qarib' : 'narasi.umum.kerabat');
    return teksKamus(penyusun, `narasi.${arab ? 'arab' : 'umum'}.ahli_waris.${kunci.toLowerCase()}`);
  };
  const terlibat = Object.keys(graf.orang).filter(id => !ahliWarisBiasa(id) && (kunciPerantara.has(id) || kunciPeran(id) === 'DZAWIL_ARHAM'));
  const sudahDisebut = new Set<IdOrang>();

  const tunggal = (id: IdOrang): string => {
    const nama = graf.orang[id]?.nama;
    const label = labelDari(id);
    if (nama) return sudahDisebut.has(id) ? nama : `${nama} (${label})`;
    const sePeran = terlibat.filter(lain => labelDari(lain) === label);
    if (sePeran.length < 2) return label;
    const urutan = sePeran.indexOf(id);
    return `${label} ${arab ? urutan + 1 : urutanKe(penyusun, urutan)}`;
  };

  return ids => {
    const bagian = ids.map(id => (ahliWarisBiasa(id) ? sebutDasar([id]).teks : tunggal(id)));
    ids.forEach(id => sudahDisebut.add(id));
    const gabungan = arab ? bagian.join(teksKamus(penyusun, 'narasi.arab.penghubung.wa'))
      : gabungDan(penyusun, bagian.map(unsur => [{ jenis: 'teks' as const, teks: unsur }])).map(unsur => unsur.teks).join('');
    return { jenis: 'orang', daftarIdOrang: ids, teks: gabungan };
  };
}
