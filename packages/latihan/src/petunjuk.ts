// Pemilih petunjuk tangga bantuan (spec tangga-bantuan-soal bagian 6, revisi 7).
//   Menerima: kolom + hasil kolom (dari nilaiSemuaKolom) + isian pelajar + kunci (tabel) + konteks jejak engine.
//   Memutuskan: kunci diksi dan parameter petunjuk 1 dan 2 untuk satu kolom. Hanya data, tidak ada kalimat.
//   Menyerahkan: PetunjukKolom ke web; web menyusun kalimat dari kamus diksi `hitung.bantuan.*`.
// Tidak ada kalimat fikih yang dikarang: kunci dipilih dari jenis kekeliruan dan jenis jejak, pasangan kontras dari kasus bab 16.

import type { IdOrang, LangkahJejak } from '@waris/engine';
import type { HasilOk, HasilTampil } from './jalankan.js';
import { labelBagian } from './tabel/susunBiasa.js';
import { BAGIAN_TERHALANG, ID_BARIS_MAUQUF, type HasilKolom, type IsianTabel, type KolomSoal, type TabelSoal } from './tabel/model.js';

export type Fokus = 'keturunan' | 'saudara' | 'keturunanDanSaudara' | 'generasiAtas' | 'sederajat' | 'lebihDekat' | 'kakekSaudara' | 'sifatOrang';
/** Urutan tampil kategori bila satu sel punya lebih dari satu. */
const URUTAN_FOKUS: readonly Fokus[] = ['keturunan', 'saudara', 'keturunanDanSaudara', 'generasiAtas', 'sederajat', 'lebihDekat', 'kakekSaudara', 'sifatOrang'];

export type KasusKhusus = 'akdariyyah' | 'musyarrakah' | 'umariyyatain' | 'khilaf';

export interface KonteksPetunjuk {
  jejak: readonly LangkahJejak[];
  /** id orang → kunci peran (`ISTRI`, `AYAH`, ...). */
  peran: Readonly<Record<IdOrang, string>>;
  /** id kelompok engine → anggotanya. */
  anggotaKelompok: Readonly<Record<string, readonly IdOrang[]>>;
}
export const KONTEKS_KOSONG: KonteksPetunjuk = { jejak: [], peran: {}, anggotaKelompok: {} };

export function konteksDariHasil(hasil: HasilOk): KonteksPetunjuk {
  return {
    jejak: hasil.jejak,
    peran: Object.fromEntries(Object.entries(hasil.statusOrang).flatMap(([id, status]) => ('peran' in status ? [[id, status.peran.kunci]] : []))),
    anggotaKelompok: Object.fromEntries(hasil.tabel.baris.map(baris => [baris.kelompok, baris.anggota])),
  };
}

/** Hanya soal biasa/dzawil arham yang punya jejak per orang; jenis lain tanpa konteks (petunjuk tetap jalan dari jenis kekeliruan). */
export const konteksDariTampil = (tampil: HasilTampil): KonteksPetunjuk =>
  tampil.jenis === 'biasa' && tampil.hasil.status === 'OK' ? konteksDariHasil(tampil.hasil) : KONTEKS_KOSONG;

// ── Arah perhatian (6.3) ────────────────────────────────────────────────────────────────────────────────────────

const adalahFaru = (kunci: string | undefined) => kunci === 'ANAK_LK' || kunci === 'ANAK_PR' || kunci === 'CUCU_LK' || kunci === 'CUCU_PR';
const adalahSaudara = (kunci: string | undefined) => !!kunci && (kunci.startsWith('SAUDARA_') || kunci.startsWith('SAUDARI_'));
const adalahGenerasiAtas = (kunci: string | undefined) => kunci === 'AYAH' || kunci === 'KAKEK' || kunci === 'IBU';

/** Saudara baru disebut 'saudara' sebagai penyebab hajb nuqshan; sebagai penghalang penuh antar ashabah ia 'lebihDekat' [R06-3]. */
function kategoriPenghalang(konteks: KonteksPetunjuk, idOrang: readonly IdOrang[], nuqshan: boolean): Fokus[] {
  return idOrang.map((id): Fokus => {
    const kunci = konteks.peran[id];
    return adalahFaru(kunci) ? 'keturunan' : adalahSaudara(kunci) && nuqshan ? 'saudara' : adalahGenerasiAtas(kunci) ? 'generasiAtas' : 'lebihDekat';
  });
}

export interface ArahBaris { fokus: Fokus[]; khusus?: KasusKhusus; mani: boolean }

/** Kategori keluarga dari jejak yang menyangkut satu orang. Kasus khusus dan khilaf tanpa arah [R07-1] [R07-2] [R08-5]. */
export function arahBaris(idOrang: IdOrang, konteks: KonteksPetunjuk): ArahBaris {
  const kunciOrang = konteks.peran[idOrang];
  const kelompokOrang = new Set(Object.entries(konteks.anggotaKelompok).filter(([, anggota]) => anggota.includes(idOrang)).map(([id]) => id));
  const fokus = new Set<Fokus>();
  let khusus: KasusKhusus | undefined;
  let mani = false;
  for (const langkah of konteks.jejak) {
    switch (langkah.jenis) {
      case 'MANI': if (langkah.idOrang === idOrang) { mani = true; fokus.add('sifatOrang'); } break; // [R02-2]
      case 'HAJB_HIRMAN': if (langkah.mahjub === idOrang) kategoriPenghalang(konteks, langkah.hajib, false).forEach(kategori => fokus.add(kategori)); break;
      case 'HAJB_NUQSHAN': if (langkah.terdampak === idOrang) kategoriPenghalang(konteks, langkah.penyebab, true).forEach(kategori => fokus.add(kategori)); break;
      case 'FARDH': if (kelompokOrang.has(langkah.kelompok)) tambahFokusFardh(langkah.alasan.kode, kunciOrang, fokus); break;
      case 'ASHABAH':
        if (!kelompokOrang.has(langkah.kelompok)) break;
        fokus.add(langkah.pilihanJadd ? 'kakekSaudara' : langkah.jenisAshabah === 'binNafsi' ? 'lebihDekat' : 'sederajat');
        break;
      case 'KASUS_KHUSUS':
        if (langkah.nama === 'muaddah') { if (kunciOrang === 'KAKEK' || adalahSaudara(kunciOrang)) fokus.add('kakekSaudara'); } // [R08-2] [R08-4]
        else if (kunciOrang === 'KAKEK' || adalahSaudara(kunciOrang) || kunciOrang === 'IBU' || kunciOrang === 'SUAMI' || kunciOrang === 'ISTRI') khusus = langkah.nama;
        break;
      case 'KHILAF_MADZHAB': if (langkah.idOrang.includes(idOrang)) khusus = 'khilaf'; break;
      default: break;
    }
  }
  // [R04-4] ibu bergantung pada keturunan dan saudara sekaligus; kategori tunggalnya menunjuk alasan.
  if (kunciOrang === 'IBU' && [...konteks.jejak].some(langkah => langkah.jenis === 'FARDH' && kelompokOrang.has(langkah.kelompok))) {
    fokus.delete('keturunan'); fokus.delete('saudara'); fokus.add('keturunanDanSaudara');
  }
  return { fokus: khusus ? [] : URUTAN_FOKUS.filter(kategori => fokus.has(kategori)), ...(khusus ? { khusus } : {}), mani };
}

function tambahFokusFardh(kode: string, kunciOrang: string | undefined, fokus: Set<Fokus>): void {
  const kategori: Partial<Record<string, Fokus>> = {
    ADA_FARU_WARITS: 'keturunan', TANPA_FARU_WARITS: 'keturunan', ADA_FARU_MUDZAKKAR: 'keturunan', ADA_FARU_MUANNATS: 'keturunan', // [R04-2] [R04-5]
    JAM_IKHWAH: 'saudara', TANPA_FARU_WARITS_DAN_IKHWAH: 'keturunanDanSaudara', // [R04-4] [R06-6]
    NENEK_TANPA_IBU: 'sederajat', TANPA_MUASHSHIB: 'sederajat', TAKMILAH: 'sederajat', // [R04-8] [R04-11]–[R04-15]
    KALALAH: 'generasiAtas', JADD_SISA_SEDIKIT: 'kakekSaudara', JADD_WAL_IKHWAH: 'kakekSaudara', // [R04-9] [R08-1]
  };
  const hasil = kategori[kode];
  if (hasil) fokus.add(hasil);
  if (kunciOrang === 'IBU') fokus.add('keturunanDanSaudara');
}

// ── Indeks pasangan kontras (6.4), dibangun dari hasil engine atas kasus bab 16 ───────────────────────────────────

export interface EntriKontras {
  /** Kode kasus bab 16 (`C16-03`). */
  kasus: string;
  peran: string;
  /** Kunci kolom Bagian untuk peran itu di kasus tersebut. */
  bagian: string;
  /** Kelompok jejak (arah perhatian digabung `,`); pasangan hanya dicari dalam kelompok yang sama. */
  fokus: string;
  /** Peran semua orang di kasus itu, terurut; dipakai membuang kasus yang sama dengan soal. */
  susunan: string[];
}
export type IndeksKontras = readonly EntriKontras[];

const susunanDari = (konteks: KonteksPetunjuk): string[] => [...new Set(Object.values(konteks.peran))].sort();

/** `daftar`: kasus bab 16 yang sudah dijalankan engine, status OK. Baris tanpa kunci Bagian atau berkasus khusus dilewati. */
export function bangunIndeksKontras(daftar: ReadonlyArray<{ id: string; hasil: HasilOk }>): EntriKontras[] {
  const indeks = new Map<string, EntriKontras>();
  for (const { id, hasil } of daftar) {
    const konteks = konteksDariHasil(hasil);
    const susunan = susunanDari(konteks);
    const kunciBagian = new Map(hasil.tabel.baris.flatMap(baris => baris.anggota.map(orang => [orang, labelBagian(baris)] as const)));
    for (const orang of hasil.tabel.dikecualikan) kunciBagian.set(orang, BAGIAN_TERHALANG);
    for (const [orang, bagian] of kunciBagian) {
      const peran = konteks.peran[orang];
      const arah = arahBaris(orang, konteks);
      if (!peran || arah.khusus || arah.fokus.length === 0) continue;
      const fokus = arah.fokus.join(',');
      indeks.set(`${id}|${peran}|${bagian}|${fokus}`, { kasus: id, peran, bagian, fokus, susunan });
    }
  }
  return [...indeks.values()];
}

/** Dua kasus bab 16 untuk peran dan kelompok jejak yang sama, jawabannya berbeda, bukan susunan soal ini. */
function cariPasangan(indeks: IndeksKontras, peran: string, fokus: string, susunanSoal: string[]) {
  const sama = (susunan: string[]) => susunan.length === susunanSoal.length && susunan.every((kunci, posisi) => kunci === susunanSoal[posisi]);
  const calon = indeks.filter(entri => entri.peran === peran && entri.fokus === fokus && !sama(entri.susunan));
  const a = calon[0];
  const b = a && calon.find(entri => entri.bagian !== a.bagian);
  return a && b ? { a, b } : null;
}

// ── Pemilih petunjuk ────────────────────────────────────────────────────────────────────────────────────────────

export interface Petunjuk { kunci: string; parameter: Record<string, string> }
export interface PetunjukKolom {
  /** `hitung.bantuan.p1.<kunci>`; kolom pilihan juga membawa arah perhatian. */
  p1: Petunjuk & { fokus: Fokus[] };
  /** `hitung.bantuan.p2.<kunci>`. */
  p2: Petunjuk;
}

export interface MasukanPetunjuk {
  tabel: TabelSoal;
  hasil: HasilKolom;
  isian: IsianTabel;
  konteks: KonteksPetunjuk;
  indeksKontras: IndeksKontras;
}

type CaraMewarisi = 'terhalang' | 'ashabah' | 'campur' | 'pasti';
const caraDari = (bagian: string): CaraMewarisi => (bagian === BAGIAN_TERHALANG ? 'terhalang' : bagian === 'Ashabah' ? 'ashabah' : bagian === '1/6 + Ashabah' ? 'campur' : 'pasti');

/** 6.2: jenis kekeliruan dari isian vs kunci. */
function jenisKeliru(kolom: KolomSoal, isian: string, kunci: string): string {
  if (kolom.idJudul === 'didudukkanSebagai') return 'kedudukanKeliru';
  const caraIsian = caraDari(isian);
  const caraKunci = caraDari(kunci);
  if (caraKunci === 'terhalang') return 'mewarisiKeliru';
  if (caraIsian === 'terhalang') return 'terhalangKeliru';
  return caraIsian === caraKunci ? 'besarKeliru' : 'caraKeliru';
}

// Bab KB tempat materi tiap peran (spec 6.4); dipakai p2.materi bila tak ada pasangan kontras.
const BAB_PERAN: Record<string, string> = {
  SUAMI: '4.3', ISTRI: '4.4', AYAH: '4.5', IBU: '4.7', NENEK_DARI_IBU: '4.8', NENEK_DARI_AYAH: '4.8', SAUDARA_SEIBU: '4.9', SAUDARI_SEIBU: '4.9',
  ANAK_PR: '4.10', CUCU_PR: '4.11', SAUDARI_KANDUNG: '4.12', SAUDARI_SEBAPAK: '4.13', SAUDARA_KANDUNG: '6.4', KAKEK: '8',
  PAMAN_KANDUNG: '5.3', PAMAN_SEBAPAK: '5.3',
};
const BAB_KHUSUS: Record<KasusKhusus, string> = { akdariyyah: '8', musyarrakah: '7', umariyyatain: '7', khilaf: '18' };
const BAB_JUDUL: Record<string, string> = { didudukkanSebagai: '14.5', bagianPerantara: '14.5', bagianKemungkinan: '13a' };

const UMUM = (kolom: string, nama?: string): PetunjukKolom => ({
  p1: { kunci: 'umum', parameter: {}, fokus: [] }, p2: { kunci: 'umum', parameter: { kolom, ...(nama ? { nama } : {}) } },
});

/** Petunjuk 1 dan 2 untuk kolom yang belum benar. Kolom/jejak yang tak terpetakan → templat umum 6.9, bukan karangan. */
export function petunjukKolom({ tabel, hasil, isian, konteks, indeksKontras }: MasukanPetunjuk): PetunjukKolom {
  const idKolom = hasil.idKolom;
  const namaBaris = (id: string) => tabel.baris.find(baris => baris.id === id)?.nama;
  if (hasil.status === 'belumLengkap') return { p1: { kunci: 'kosong', parameter: { kolom: idKolom }, fokus: [] }, p2: { kunci: 'kosong', parameter: { kolom: idKolom } } };

  const kolom = tabel.kolom.find(kandidat => kandidat.id === idKolom);
  const sel = hasil.sel.find(kandidat => kandidat.idBaris === 'kepala' && !kandidat.benar) ?? hasil.sel.find(kandidat => !kandidat.benar);
  const idBaris = sel && sel.idBaris !== 'kepala' ? sel.idBaris : undefined;
  const nama = idBaris ? namaBaris(idBaris) : undefined;
  const kepalaSalah = sel?.idBaris === 'kepala';
  const tampung = (kunci: string, parameter: Record<string, string> = {}): PetunjukKolom => ({
    p1: { kunci, parameter, fokus: [] }, p2: { kunci, parameter: { ...parameter, ...(nama ? { nama } : {}) } },
  });

  if (idKolom === 'pengali') {
    const kolomMasalah = tabel.kolom.find(kandidat => kandidat.id === sel?.idBaris);
    return tampung('munasakhat.pengali', kolomMasalah?.mayit ? { mayit: kolomMasalah.mayit } : {});
  }
  if (!kolom || !sel) return UMUM(idKolom, nama);
  if (idBaris === ID_BARIS_MAUQUF) return tampung('kemungkinan.pemberian');

  switch (kolom.idJudul) {
    case 'bagian': case 'bagianKemungkinan': case 'bagianPerantara': case 'didudukkanSebagai':
      return petunjukPilihan(tabel, kolom, idBaris, isian, konteks, indeksKontras);
    case 'asalMasalah': return tampung(kepalaSalah ? 'ashl' : 'saham');
    case 'sahamKemungkinan': return tampung('ashl.kemungkinan', kolom.kemungkinan ? { kemungkinan: kolom.kemungkinan } : {});
    case 'masalahLanjutan': return tampung('munasakhat.masalah', kolom.mayit ? { mayit: kolom.mayit } : {});
    case 'jamiah': return tampung('munasakhat.jamiah');
    case 'jamiahSekarang': return tampung('kemungkinan.jamiah');
    case 'asalMasalahAkhir': return petunjukAkhir(tabel, kepalaSalah, idBaris, konteks, tampung);
    default: return UMUM(idKolom, nama);
  }
}

function petunjukPilihan(tabel: TabelSoal, kolom: KolomSoal, idBaris: IdOrang | undefined, isian: IsianTabel, konteks: KonteksPetunjuk, indeksKontras: IndeksKontras): PetunjukKolom {
  const baris = tabel.baris.find(kandidat => kandidat.id === idBaris);
  if (!baris) return UMUM(kolom.id);
  const kunci = baris.kunci[kolom.id]!;
  const diisi = isian.sel[baris.id]?.[kolom.id] ?? '';
  const arah = arahBaris(baris.id, konteks);
  const parameter: Record<string, string> = {
    ...(kolom.kemungkinan ? { kemungkinan: kolom.kemungkinan } : {}), ...(kolom.idJudul === 'bagianPerantara' ? { perantara: '1' } : {}),
  };
  const p1 = { kunci: `pilihan.${jenisKeliru(kolom, diisi, kunci)}`, parameter, fokus: arah.fokus };

  const peran = konteks.peran[baris.id];
  const pasangan = peran && kolom.idJudul === 'bagian' && !kolom.mayit && !arah.khusus && arah.fokus.length > 0
    ? cariPasangan(indeksKontras, peran, arah.fokus.join(','), susunanDari(konteks)) : null;
  if (pasangan && peran) {
    const { a, b } = pasangan;
    return { p1, p2: { kunci: 'kontras', parameter: { peran, susunanA: a.susunan.join(','), bagianA: a.bagian, susunanB: b.susunan.join(','), bagianB: b.bagian } } };
  }
  const bab = arah.khusus ? BAB_KHUSUS[arah.khusus] : arah.mani ? '2' : (peran && BAB_PERAN[peran]) || BAB_JUDUL[kolom.idJudul];
  return { p1, p2: bab ? { kunci: 'materi', parameter: { bab } } : { kunci: 'umum', parameter: { kolom: kolom.id, nama: baris.nama } } };
}

/** 6.6: kolom akhir; varian menurut jejak 'aul/radd/tashih/akdariyyah. */
function petunjukAkhir(tabel: TabelSoal, kepalaSalah: boolean, idBaris: IdOrang | undefined, konteks: KonteksPetunjuk, tampung: (kunci: string, parameter?: Record<string, string>) => PetunjukKolom): PetunjukKolom {
  const jejak = konteks.jejak;
  const adaTashih = jejak.some(langkah => langkah.jenis === 'TASHIH' && langkah.hasil !== langkah.dasar);
  const adaPerubahan = jejak.some(langkah => langkah.jenis === 'AUL' || langkah.jenis === 'RADD');
  const adaAkdariyyah = jejak.some(langkah => langkah.jenis === 'KASUS_KHUSUS' && langkah.nama === 'akdariyyah') && jejak.some(langkah => langkah.jenis === 'AUL');
  if (kepalaSalah) return tampung(adaTashih ? 'bulat' : 'jumlahSaham');
  if (adaTashih) {
    const baris = tabel.baris.find(kandidat => kandidat.id === idBaris);
    const kelompok = Object.keys(konteks.anggotaKelompok).find(id => baris && konteks.anggotaKelompok[id]!.includes(baris.id));
    return tampung('bulat.perOrang', kelompok ? { kelompok: konteks.anggotaKelompok[kelompok]!.map(id => tabel.baris.find(b => b.id === id)?.nama ?? id).join(', ') } : {});
  }
  if (adaAkdariyyah && idBaris) {
    const nama = (cocok: (kunci: string) => boolean) => tabel.baris.find(baris => cocok(konteks.peran[baris.id] ?? ''))?.nama;
    const kakek = nama(kunci => kunci === 'KAKEK');
    const saudari = nama(kunci => kunci.startsWith('SAUDARI_'));
    if (kakek && saudari) return tampung('saudariKakek.akhir', { kakek, saudari });
  }
  return adaPerubahan ? tampung('jumlahSaham.perOrang') : tampung('umum');
}
