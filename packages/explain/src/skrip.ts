// Skrip belajar untuk kasus biasa (riset-narasi-pengajar bagian 5): tiap tahap = pertanyaan → dasar → di keluarga ini →
// logika → hitungan → jembatan, dengan dua teks per langkah (narasi dibacakan, papan ringkas).
// Menerima konteks (hasil engine + jejak); menyerahkan `Bab` berisi baris berjenis ke `linimasa.ts`.
// Tahap yang kasusnya belum dipetakan mengembalikan LAMA, lalu linimasa memakai bab cerita seperti sebelumnya.
// Tidak ada aturan fikih baru: tiap kalimat memakai angka dan sebab dari jejak, dan rujukan [Rxx-y] dari jejak itu.

import type { AlasanFardh, IdOrang } from '@waris/engine';
import { PERAN_BERPENDAHULU, ceritaArba, opsiKakek, persamaanKotakAshl, teksTujuanSisa, type Bab } from './cerita.js';
import { sebutKelompok, sebutSemua, type Konteks, type Langkah } from './context.js';
import { rupiah, tulisPecahan } from './format.js';
import { barisSkrip, buatBaris, denganHitungan, gabungDan, kalimat, susun, teksKamus, tekankan, type BarisPenjelasan, type JenisLangkah, type Potongan, type Sisipan } from './segments.js';
import { istilah, istilahNarasi, type IdIstilah } from './terms.js';

/** Kasus tahap ini belum dipetakan ke skrip; pakai bab cerita. */
export const LAMA = Symbol('lama');
export type HasilSkrip = Bab | undefined | typeof LAMA;

type Sisipanku = Record<string, Sisipan>;

const kunciKamus = (kunci: string) => `narasi.langkah.${kunci}`;
const judulSkrip = (konteks: Konteks, kunci: string): string => teksKamus(konteks.penyusun, kunciKamus(kunci));
const istilahUmum = (konteks: Konteks, id: IdIstilah): Potongan => istilahNarasi(konteks.penyusun, id);
/** Nama kasus khusus berlabel kitab (al-'Umariyyatain), bukan label istilah umum. */
const istilahKasus = (konteks: Konteks, id: 'umariyyatain' | 'musyarrakah' | 'akdariyyah' | 'muaddah'): Potongan =>
  istilah(id, teksKamus(konteks.penyusun, `narasi.cerita.bagian.istilah_${id}`));
const teks = (isi: string): Potongan => ({ jenis: 'teks', teks: isi });
const gabungPlus = (angka: Array<string | bigint>): Potongan[] => [teks(angka.join(' + '))];

/** Label baris hitungan ("Harta", "Jumlah"): kata dari diksi `narasi.langkah.label.*`. */
const labelHitung = (konteks: Konteks, nama: string): string => teksKamus(konteks.penyusun, kunciKamus(`label.${nama}`));

function langkah(
  konteks: Konteks, jenis: JenisLangkah, kunci: string | [string, string], narasi: Sisipanku, papan: Sisipanku, refs: string[] = [], subjek?: IdOrang[],
): BarisPenjelasan {
  return barisSkrip(konteks.penyusun, jenis, kunci, narasi, papan, refs, subjek);
}

// ─── Peta: pembuka seluruh penjelasan ─────────────────────────────────────────

export function langkahPeta(konteks: Konteks): BarisPenjelasan {
  return langkah(konteks, 'peta', konteks.tampilkanNominal ? 'peta.tiga' : 'peta.dua', {}, {});
}

// ─── Harta ────────────────────────────────────────────────────────────────────

export function babHartaSkrip(konteks: Konteks): HasilSkrip {
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  if (!tirkah || tirkah.kotor === 0n) return undefined;
  const pewaris = konteks.sebutan.pewaris();
  const judul = judulSkrip(konteks, 'harta.judul');
  if (tirkah.tajhiz === 0n && tirkah.hutang === 0n && tirkah.wasiatDiminta === 0n) {
    const kotor = rupiah(tirkah.kotor);
    const nolRupiah = rupiah(0n);
    const hitungHarta = denganHitungan(langkah(konteks, 'hitung', 'harta.tanpa_potongan', { pewaris, kotor }, { kotor }, ['R11-1']), labelHitung(konteks, 'harta'), kotor);
    return { judul, kolom: 'nominal', daftarBaris: [
      langkah(konteks, 'tanya', 'harta.tanya', { pewaris }, {}),
      langkah(konteks, 'dasar', 'harta.dasar', { tirkah: istilahUmum(konteks, 'tirkah') }, {}, ['R01-4']),
      langkah(konteks, 'keluarga', 'harta.tidak_ada_potongan', {}, {}, ['R01-4']),
      hitungHarta,
      denganHitungan(langkah(konteks, 'hitung', 'harta.tanpa_potongan_dikurangi', {}, {}, ['R01-4']), labelHitung(konteks, 'dikurangi'), `${nolRupiah} + ${nolRupiah} + ${nolRupiah}`),
      denganHitungan(langkah(konteks, 'hitung', 'harta.tanpa_potongan_dibagi', { kotor }, { kotor }, ['R11-1']), labelHitung(konteks, 'harta_dibagi'), kotor),
      langkah(konteks, 'jembatan', 'harta.jembatan', {}, {}),
    ] };
  }
  const daftarBaris = [
    langkah(konteks, 'tanya', 'harta.tanya', { pewaris }, {}),
    langkah(konteks, 'dasar', 'harta.dasar', { tirkah: istilahUmum(konteks, 'tirkah') }, {}, ['R01-4']),
  ];
  let sisa = tirkah.kotor;
  const kurangi = (apa: 'tajhiz' | 'hutang' | 'wasiat', nilai: bigint, refs: string[]) => {
    const sisipan = { sebelum: rupiah(sisa), nilai: rupiah(nilai), sisa: rupiah(sisa - nilai) };
    const namaApa = teksKamus(konteks.penyusun, kunciKamus(`harta.apa.${apa}`));
    daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'harta.kurangi', { ...sisipan, apa: namaApa }, sisipan, refs), namaApa, `${sisipan.sebelum} − ${sisipan.nilai} = ${sisipan.sisa}`));
    sisa -= nilai;
  };
  if (tirkah.tajhiz > 0n) kurangi('tajhiz', tirkah.tajhiz, tirkah.refs);
  if (tirkah.hutang > 0n) kurangi('hutang', tirkah.hutang, tirkah.refs);
  if (sisa === 0n && tirkah.hutang > 0n) daftarBaris.push(langkah(konteks, 'keluarga', 'harta.hutang_habis', {}, {}, tirkah.refs));
  if (tirkah.wasiatButuhIjazah > 0n) {
    const sisipan = { diminta: rupiah(tirkah.wasiatDiminta), batas: rupiah(tirkah.wasiatBatas), dipakai: rupiah(tirkah.wasiatDipakai) };
    daftarBaris.push(tekankan(langkah(konteks, 'keluarga', 'harta.wasiat_melebihi', { pewaris, ...sisipan, kelebihan: rupiah(tirkah.wasiatButuhIjazah) }, sisipan, ['R01-4']), 'perhatian'));
  }
  if (tirkah.wasiatDipakai > 0n) kurangi('wasiat', tirkah.wasiatDipakai, ['R01-4']);
  const bersih = rupiah(tirkah.bersih);
  daftarBaris.push(
    denganHitungan(langkah(konteks, 'hitung', 'harta.jadi', { bersih }, { bersih }, ['R11-1']), labelHitung(konteks, 'harta_dibagi'), bersih),
    langkah(konteks, 'jembatan', 'harta.jembatan', {}, {}),
  );
  return { judul, daftarBaris, kolom: 'nominal' };
}

// ─── Siapa yang mewarisi ──────────────────────────────────────────────────────

export function babAhliWarisSkrip(konteks: Konteks): HasilSkrip {
  const { statusOrang } = konteks.hasil;
  const idKerabat = Object.keys(statusOrang).filter(id => ['ahliWaris', 'mahjub', 'mamnu'].includes(statusOrang[id]!.jenis));
  const idAhliWaris = idKerabat.filter(id => statusOrang[id]!.jenis === 'ahliWaris');
  if (idKerabat.length === 0 || idAhliWaris.length === 0) return LAMA;

  const pewaris = konteks.sebutan.pewaris();
  const bentuk = idKerabat.length > 1 ? 'jamak' : 'mufrad';
  const kerabat = sebutSemua(konteks, idKerabat);
  const daftarBaris = [langkah(konteks, 'tanya', `ahli_waris.tanya.${bentuk}`, { pewaris, kerabat }, bentuk === 'jamak' ? { jumlah: idKerabat.length } : {})];
  const jembatan = langkah(konteks, 'jembatan', 'ahli_waris.jembatan', {}, {});

  const daftarMani = konteks.daftarLangkah('MANI');
  if (daftarMani.length) {
    daftarBaris.push(langkah(konteks, 'dasar', 'ahli_waris.dasar_mani', { mani: istilahUmum(konteks, 'mani') }, {}, daftarMani[0]!.refs));
    for (const satu of daftarMani) {
      const siapa = konteks.sebutan.sebut([satu.idOrang]);
      const kunciMani = satu.mani === 'qatl' ? 'ahli_waris.mani.qatl.narasi' : 'ahli_waris.mani.beda_agama.narasi';
      daftarBaris.push(langkah(konteks, 'keluarga', [kunciMani, 'ahli_waris.mani.papan'], { siapa, pewaris }, { siapa }, satu.refs, [satu.idOrang]));
    }
  }

  const kelompokHajb = new Map<string, { mahjub: IdOrang[]; hajib: IdOrang[]; refs: string[] }>();
  for (const hajb of konteks.daftarLangkah('HAJB_HIRMAN')) {
    const kunci = `${konteks.sebutan.peranDari(hajb.mahjub)?.kunci}|${hajb.hajib.join(',')}`;
    const entri = kelompokHajb.get(kunci) ?? { mahjub: [], hajib: hajb.hajib, refs: hajb.refs };
    entri.mahjub.push(hajb.mahjub);
    kelompokHajb.set(kunci, entri);
  }
  const daftarKhilaf = konteks.daftarLangkah('KHILAF_MADZHAB');
  if (kelompokHajb.size === 0 && daftarMani.length === 0 && daftarKhilaf.length === 0) {
    daftarBaris.push(denganHitungan(langkah(konteks, 'keluarga', [`ahli_waris.tidak_terhalang.${bentuk}.narasi`, 'ahli_waris.tidak_terhalang.papan'], {}, {}),
      labelHitung(konteks, 'mewarisi'), sebutSemua(konteks, idAhliWaris)), jembatan);
    return { judul: judulSkrip(konteks, 'ahli_waris.judul'), daftarBaris, kolom: 'ahliWaris' };
  }

  const [pertama] = [...kelompokHajb.values()];
  if (pertama) daftarBaris.push(langkah(konteks, 'dasar', 'ahli_waris.dasar_hajb', { hajb_hirman: istilahUmum(konteks, 'hajb-hirman') }, {}, pertama.refs));
  for (const { mahjub, hajib, refs } of kelompokHajb.values()) {
    const sebutMahjub = sebutSemua(konteks, mahjub);
    const sebutHajib = sebutSemua(konteks, hajib);
    daftarBaris.push(langkah(konteks, 'keluarga', 'ahli_waris.terhalang', { mahjub: sebutMahjub, hajib: sebutHajib }, { hajib: sebutHajib, mahjub: sebutMahjub }, refs, mahjub));
  }
  for (const khilaf of daftarKhilaf) {
    const sisipan = {
      madzhab: teksKamus(konteks.penyusun, `narasi.umum.madzhab.${khilaf.ruleset}`),
      isi: teksKamus(konteks.penyusun, `narasi.cerita.ahli_waris.isi_khilaf.${khilaf.kode.toLowerCase().replace('-', '_')}`),
    };
    const kalimatKhilaf = susun(konteks.penyusun, 'narasi.cerita.ahli_waris.khilaf', sisipan);
    daftarBaris.push({ ...buatBaris(kalimatKhilaf, khilaf.refs, khilaf.idOrang), jenis: 'keluarga', papan: kalimatKhilaf });
  }
  const daftar = sebutSemua(konteks, idAhliWaris);
  daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'ahli_waris.tinggal', { jumlah: idAhliWaris.length, daftar }, { daftar }), labelHitung(konteks, 'mewarisi'), daftar));
  for (const { mahjub, hajib } of kelompokHajb.values()) {
    const sebutMahjub = sebutSemua(konteks, mahjub);
    const sebutHajib = sebutSemua(konteks, hajib);
    daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'ahli_waris.hitung_terhalang', { mahjub: sebutMahjub, hajib: sebutHajib }, { mahjub: sebutMahjub }),
      labelHitung(konteks, 'terhalang'), susun(konteks.penyusun, kunciKamus('ahli_waris.isi_terhalang'), { mahjub: sebutMahjub, hajib: sebutHajib })));
  }
  daftarBaris.push(jembatan);
  return { judul: judulSkrip(konteks, 'ahli_waris.judul'), daftarBaris, kolom: 'ahliWaris' };
}

// ─── Bagian awal ──────────────────────────────────────────────────────────────

const ALASAN_FARDH_DIPETAKAN = new Set(['ADA_FARU_WARITS', 'TANPA_FARU_WARITS', 'KALALAH', 'TANPA_MUASHSHIB', 'UMARIYYATAIN', 'MUSYARRAKAH',
  'JAM_IKHWAH', 'TANPA_FARU_WARITS_DAN_IKHWAH', 'ADA_FARU_MUDZAKKAR', 'ADA_FARU_MUANNATS', 'AKDARIYYAH', 'JADD_WAL_IKHWAH', 'JADD_SISA_SEDIKIT', 'TAKMILAH', 'NENEK_TANPA_IBU']);
/** Kasus khusus yang dasarnya dibawa langkah fardh-nya sendiri (lihat `barisFardh`). */
const KASUS_KHUSUS_DIPETAKAN = new Set(['umariyyatain', 'musyarrakah', 'akdariyyah', 'muaddah']);
const PERAN_PASANGAN = new Set(['SUAMI', 'ISTRI']);

/** Semua langkah fardh/ashabah kasus ini sudah punya templat skrip (kasus khusus, kakek, ma'a al-ghair belum). */
export function bagianDipetakan(konteks: Konteks): boolean {
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(satu => satu.kelompok));
  return konteks.hasil.jejak.every(satu => {
    if (satu.jenis === 'FARDH') return ALASAN_FARDH_DIPETAKAN.has(satu.alasan.kode);
    if (satu.jenis === 'KASUS_KHUSUS') return KASUS_KHUSUS_DIPETAKAN.has(satu.nama);
    if (satu.jenis !== 'ASHABAH' || kelompokFardh.has(satu.kelompok)) return true;
    return true;
  });
}

export function babBagianSkrip(konteks: Konteks): HasilSkrip {
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(satu => satu.kelompok));
  const adaAshabah = konteks.hasil.jejak.some(satu => satu.jenis === 'ASHABAH' && !kelompokFardh.has(satu.kelompok));
  if (!bagianDipetakan(konteks)) return LAMA;

  const daftarBaris: BarisPenjelasan[] = [];
  const pewaris = konteks.sebutan.pewaris();
  // Arti fardh diperkenalkan sekali di awal tahap, juga bila tidak ada ashabah ("bagian pasti" tidak boleh muncul tanpa arti).
  if (kelompokFardh.size > 0) daftarBaris.push(langkah(konteks, 'dasar', 'bagian.dasar_fardh', {}, {}));
  for (const satu of konteks.hasil.jejak) {
    if (satu.jenis === 'FARDH') daftarBaris.push(...barisFardh(konteks, satu, pewaris));
    else if (satu.jenis === 'KASUS_KHUSUS' && satu.nama === 'muaddah') daftarBaris.push(...barisMuaddah(konteks, satu.refs));
    else if (satu.jenis === 'ASHABAH' && !kelompokFardh.has(satu.kelompok)) daftarBaris.push(...barisAshabah(konteks, satu));
  }
  daftarBaris.push(jembatanBagian(konteks, adaAshabah));
  return { judul: judulSkrip(konteks, 'bagian.judul'), daftarBaris, kolom: 'bagian' };
}

export function barisFardh(konteks: Konteks, satu: Langkah<'FARDH'>, pewaris: Potongan): BarisPenjelasan[] {
  const anggota = konteks.anggotaDari(satu.kelompok);
  const subjek = sebutKelompok(konteks, satu.kelompok);
  const pecahan = satu.fardh;
  const mendapat = susun(konteks.penyusun, kunciKamus(`bagian.mendapat.${anggota.length > 1 ? 'jamak' : 'mufrad'}`), { pecahan });
  const papanBiasa = { subjek, pecahan };
  const baris = (kunci: string | [string, string], narasi: Sisipanku, papan: Sisipanku, jenis: JenisLangkah = 'keluarga') =>
    langkah(konteks, jenis, kunci, narasi, papan, satu.refs, jenis === 'keluarga' ? anggota : undefined);
  const { alasan } = satu;
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS': {
      const nuqshan = konteks.daftarLangkah('HAJB_NUQSHAN').find(langkahIni => anggota.includes(langkahIni.terdampak));
      const oleh = sebutSemua(konteks, alasan.oleh);
      if (!nuqshan) return [baris(['bagian.ada_faru_tanpa_dari.narasi', 'bagian.fardh.papan'], { pewaris, oleh, subjek, mendapat }, papanBiasa)];
      const dari = nuqshan.dari;
      const dasar = PERAN_PASANGAN.has(konteks.sebutan.peranDari(anggota[0]!)?.kunci ?? '')
        ? [baris('bagian.dasar_faru', { subjek, dari, pewaris, pecahan }, { subjek, dari, pecahan }, 'dasar')] : [];
      return [...dasar, baris('bagian.ada_faru', { pewaris, oleh, subjek, mendapat, dari }, { subjek, dari, pecahan, hajb_nuqshan: istilahUmum(konteks, 'hajb-nuqshan') })];
    }
    case 'TANPA_FARU_WARITS':
      return [baris(['bagian.tanpa_faru.narasi', 'bagian.fardh.papan'], { pewaris, subjek, mendapat }, papanBiasa)];
    case 'KALALAH':
      return [baris('bagian.kalalah', { pewaris, subjek, mendapat }, { ...papanBiasa, kalalah: istilahUmum(konteks, 'kalalah') })];
    case 'TANPA_MUASHSHIB':
      return [baris([`bagian.tanpa_muashshib.${alasan.banyaknya > 1 ? 'jamak' : 'mufrad'}.narasi`, 'bagian.tanpa_muashshib.papan'],
        { subjek, mendapat }, { ...papanBiasa, muashshib: istilahUmum(konteks, 'muashshib') })];
    case 'JAM_IKHWAH': {
      const nuqshan = konteks.daftarLangkah('HAJB_NUQSHAN').find(langkahIni => anggota.includes(langkahIni.terdampak));
      const oleh = sebutSemua(konteks, alasan.oleh);
      const terhalang = alasan.oleh.some(id => konteks.hasil.statusOrang[id]?.jenis === 'mahjub')
        ? [baris('bagian.jam_ikhwah_terhalang', {}, {})] : [];
      if (!nuqshan) return [baris(['bagian.jam_ikhwah_tanpa_dari.narasi', 'bagian.fardh.papan'], { pewaris, oleh, subjek, mendapat }, papanBiasa), ...terhalang];
      const dari = nuqshan.dari;
      return [
        baris('bagian.jam_ikhwah.dasar', { subjek, dari, pecahan, pewaris }, { subjek, dari, pecahan }, 'dasar'),
        baris('bagian.jam_ikhwah', { pewaris, oleh, subjek, mendapat, dari }, { subjek, dari, pecahan, jam_min_al_ikhwah: istilahUmum(konteks, 'jam-min-al-ikhwah') }),
        ...terhalang,
      ];
    }
    case 'TANPA_FARU_WARITS_DAN_IKHWAH':
      return [baris(['bagian.tanpa_faru_ikhwah.narasi', 'bagian.fardh.papan'], { pewaris, subjek, pecahan }, papanBiasa)];
    case 'ADA_FARU_MUDZAKKAR':
      return [baris(['bagian.faru_mudzakkar.narasi', 'bagian.fardh.papan'], { pewaris, oleh: sebutSemua(konteks, alasan.oleh), subjek, pecahan }, papanBiasa)];
    case 'ADA_FARU_MUANNATS':
      return [baris('bagian.faru_muannats', { pewaris, oleh: sebutSemua(konteks, alasan.oleh), subjek, pecahan, ashabah: istilahUmum(konteks, 'ashabah') }, papanBiasa)];
    case 'JADD_WAL_IKHWAH':
      return barisPilihanKakek(konteks, alasan, subjek, anggota, satu.refs);
    case 'JADD_SISA_SEDIKIT':
      return [
        baris('bagian.sisa_sedikit.dasar', {}, {}, 'dasar'),
        baris(['bagian.sisa_sedikit.narasi', 'bagian.fardh.papan'], { sisa: alasan.sisa, subjek, pecahan }, papanBiasa),
      ];
    case 'AKDARIYYAH': {
      const adalahKakek = (id: IdOrang) => konteks.sebutan.peranDari(id)?.kunci === 'KAKEK';
      if (alasan.porsi === 'jadd') {
        const kakek = sebutSemua(konteks, anggota.filter(adalahKakek));
        return [
          baris('bagian.akdariyyah.dasar', { akdariyyah: istilahKasus(konteks, 'akdariyyah') }, {}, 'dasar'),
          baris('bagian.akdariyyah.kakek', { kakek, pecahan }, { kakek, pecahan }),
        ];
      }
      const saudari = sebutSemua(konteks, anggota.filter(id => !adalahKakek(id)));
      return [baris('bagian.akdariyyah.saudari', { saudari }, { saudari }), baris('bagian.akdariyyah.bagi_ulang', {}, {})];
    }
    case 'TAKMILAH':
      return [
        baris('bagian.takmilah.dasar', { takmilah_tsulutsain: istilahUmum(konteks, 'takmilah-tsulutsain') }, {}, 'dasar'),
        baris('bagian.takmilah', { bersama: sebutSemua(konteks, alasan.bersama), subjek, mendapat }, { subjek, pecahan }),
      ];
    case 'NENEK_TANPA_IBU':
      return [baris('bagian.nenek.dasar', {}, {}, 'dasar'), baris(['bagian.nenek.narasi', 'bagian.fardh.papan'], { subjek, mendapat }, papanBiasa)];
    case 'UMARIYYATAIN': {
      const pasangan = sebutKelompok(konteks, konteks.anggotaDari('SUAMI').length > 0 ? 'SUAMI' : 'ISTRI');
      return [
        baris('bagian.umariyyatain.dasar', { umariyyatain: istilahKasus(konteks, 'umariyyatain') }, {}, 'dasar'),
        baris('bagian.umariyyatain.ibu', { pasangan, fardh_pasangan: alasan.fardhPasangan, subjek, pecahan }, { subjek, pecahan }),
      ];
    }
    case 'MUSYARRAKAH':
      return [
        baris('bagian.musyarrakah.dasar', { musyarrakah: istilahKasus(konteks, 'musyarrakah') }, {}, 'dasar'),
        baris('bagian.musyarrakah.bagian', { subjek, pecahan }, { subjek, pecahan }),
      ];
  }
}

/** Kakek bersama saudara: dasar "pilihan terbaik", pilihan dengan nilainya, yang terbesar (dan arti muqasamah bila itu yang terpilih). */
function barisPilihanKakek(konteks: Konteks, alasan: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }>, kakek: Potongan[], anggotaKakek: IdOrang[], refs: string[]): BarisPenjelasan[] {
  const terpilih = alasan.opsi.find(opsi => opsi.nama === alasan.terpilih)!;
  const opsi = gabungAtau(konteks, alasan.opsi.map(satuOpsi => kalimat`${opsiKakek(konteks, satuOpsi.nama)} = ${satuOpsi.nilai}`));
  return [
    langkah(konteks, 'dasar', 'bagian.kakek.dasar', {}, {}, refs),
    langkah(konteks, 'hitung', 'bagian.kakek.pilihan', { kakek, opsi }, { opsi }, refs),
    langkah(konteks, 'keluarga', 'bagian.kakek.terpilih', { terpilih: opsiKakek(konteks, alasan.terpilih), nilai: terpilih.nilai, kakek }, { nilai: terpilih.nilai }, refs, anggotaKakek),
    ...(alasan.terpilih === 'muqasamah' ? [langkah(konteks, 'logika', 'bagian.kakek.muqasamah', {}, {}, refs)] : []),
  ];
}

/** Mu'addah [R08-4]: saudara kandung menghitungkan saudara sebapak terhadap kakek, lalu bagian sebapak kembali ke kandung. */
export function barisMuaddah(konteks: Konteks, refs: string[]): BarisPenjelasan[] {
  return [
    langkah(konteks, 'dasar', 'bagian.muaddah.dasar', { muaddah: istilahKasus(konteks, 'muaddah') }, {}, refs),
    langkah(konteks, 'logika', 'bagian.muaddah.logika', {}, {}, refs),
  ];
}

export function barisAshabah(konteks: Konteks, satu: Langkah<'ASHABAH'>): BarisPenjelasan[] {
  const anggota = konteks.anggotaDari(satu.kelompok);
  const ashabah = istilahUmum(konteks, 'ashabah');
  const adalahKakek = (id: IdOrang) => konteks.sebutan.peranDari(id)?.kunci === 'KAKEK';
  const kakek = anggota.filter(adalahKakek);
  const pilihan = satu.pilihanJadd && kakek.length ? barisPilihanKakek(konteks, satu.pilihanJadd, sebutSemua(konteks, kakek), kakek, satu.refs) : [];
  const perOrang = konteks.hasil.tabel.baris.find(barisTabel => barisTabel.kelompok === satu.kelompok)?.perOrang ?? {};
  const dapat = anggota.filter(id => (perOrang[id]?.saham ?? 0n) > 0n);
  const tidak = anggota.filter(id => !dapat.includes(id));
  // Sisa sudah habis (mis. kakek 1/6 mengambil sisa terakhir): kalimat "mengambil sisa" tidak boleh dipakai.
  if (dapat.length === 0) return [...pilihan, langkah(konteks, 'keluarga', 'bagian.ashabah_habis', { subjek: sebutKelompok(konteks, satu.kelompok) }, { subjek: sebutKelompok(konteks, satu.kelompok) }, satu.refs, anggota)];
  if (tidak.length > 0 && !pilihan.length) {
    // Mu'addah: saudara sebapak dihitung tetapi bagiannya kembali ke saudara kandung.
    const sebutDapat = sebutSemua(konteks, dapat);
    const sebutTidak = sebutSemua(konteks, tidak);
    return [langkah(konteks, 'keluarga', 'bagian.ashabah_sebagian', { dapat: sebutDapat, tidak: sebutTidak }, { dapat: sebutDapat, tidak: sebutTidak }, satu.refs, anggota)];
  }
  const subjek = sebutKelompok(konteks, satu.kelompok);
  if (satu.jenisAshabah === 'bilGhair') {
    return [langkah(konteks, 'keluarga', 'bagian.ashabah_bil_ghair', { subjek, ashabah }, { subjek, bil_ghair: istilahUmum(konteks, 'bil-ghair') }, satu.refs, anggota)];
  }
  if (satu.jenisAshabah === 'maalGhair') {
    return [
      langkah(konteks, 'dasar', 'bagian.maal_ghair.dasar', { maal_ghair: istilahUmum(konteks, 'maal-ghair') }, {}, satu.refs),
      langkah(konteks, 'keluarga', 'bagian.maal_ghair', { subjek }, { subjek }, satu.refs, anggota),
    ];
  }
  const baris = [...pilihan, langkah(konteks, 'keluarga', 'bagian.ashabah_bin_nafsi', { subjek, ashabah }, { subjek }, satu.refs, anggota)];
  const kunciPeran = konteks.sebutan.peranDari(anggota[0]!)?.kunci ?? '';
  if (PERAN_BERPENDAHULU.has(kunciPeran)) {
    // [R05-1] [R05-2] [R05-3]: sisa untuk kerabat laki-laki terdekat; yang disebut di sini justru yang TIDAK ada.
    const lebihDekat = teksKamus(konteks.penyusun, `narasi.cerita.bagian.lebih_dekat_dari.${kunciPeran.toLowerCase()}`);
    baris.push(langkah(konteks, 'keluarga', 'bagian.paling_dekat', { siapa: subjek, lebih_dekat: lebihDekat }, { lebih_dekat: lebihDekat }, ['R05-1', 'R05-2', 'R05-3'], anggota));
  }
  return baris;
}

const gabungAtau = (konteks: Konteks, daftar: Potongan[][]): Potongan[] => daftar.flatMap((unsur, urutan) =>
  urutan === 0 ? unsur : [teks(urutan === daftar.length - 1 ? teksKamus(konteks.penyusun, 'narasi.umum.penghubung.atau') : ', '), ...unsur]);

function jembatanBagian(konteks: Konteks, adaAshabah: boolean): BarisPenjelasan {
  const berpecahan = konteks.hasil.tabel.baris.filter(barisTabel => barisTabel.fardh);
  const bedaPenyebut = konteks.daftarLangkah('PERBANDINGAN_NISAB').some(satu => satu.tujuan === 'ashl');
  if (bedaPenyebut) {
    const pecahan = gabungDan(konteks.penyusun, berpecahan.map(barisTabel => [teks(tulisPecahan(barisTabel.fardh!))]));
    return langkah(konteks, 'jembatan', 'bagian.jembatan.beda_penyebut', { pecahan }, { jumlahan: gabungPlus(berpecahan.map(barisTabel => tulisPecahan(barisTabel.fardh!))) });
  }
  return langkah(konteks, 'jembatan', adaAshabah && berpecahan.length > 0 ? 'bagian.jembatan.ada_sisa' : 'bagian.jembatan.umum', {}, {});
}

// ─── Memotong harta (asal masalah) ────────────────────────────────────────────

export function babPenyebutSkrip(konteks: Konteks): HasilSkrip {
  const { baris, totalKolom } = konteks.hasil.tabel;
  const ashl = totalKolom.ashl!;
  if (baris.every(barisTabel => barisTabel.fardh === undefined)) return babPenyebutSemuaAshabah(konteks, ashl);
  if (persamaanKotakAshl(konteks).length === 0) return LAMA;
  const perbandingan = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(satu => satu.tujuan === 'ashl');
  const daftarBaris = [perbandingan.length === 0
    ? langkah(konteks, 'logika', 'ashl.potong_sama', { ashl }, { ashl })
    : langkah(konteks, 'logika', 'ashl.potong_beda', {}, {})];
  perbandingan.forEach((satu, urutan) => {
    const awalan = susun(konteks.penyusun, `narasi.cerita.penyebut.${urutan === 0 ? 'awalan_pertama' : 'awalan_lanjut'}`, { a: satu.a, b: satu.b });
    const kalimatNisab = ceritaArba(konteks, satu, awalan);
    daftarBaris.push({ ...buatBaris(kalimatNisab, satu.refs), jenis: 'logika', papan: kalimatNisab });
  });
  // Baris "8 ÷ 8 = 1 kotak untuk istri" per kelompok disisipkan `linimasa.ts` di sini, sebelum kalimat penutup.
  const rumus = perbandingan.length === 1 ? rumusNisab(perbandingan[0]!) : String(ashl);
  daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'ashl.jadi', { ashl }, { ashl, ashlul_masalah: istilahUmum(konteks, 'ashlul-masalah') }, ['R09-1']), labelHitung(konteks, 'asal_masalah'), rumus));
  return { judul: judulSkrip(konteks, 'ashl.judul'), daftarBaris, kolom: 'ashl' };
}

/** Rumus asal masalah dari satu perbandingan penyebut [R09-1]: tawafuq a × (b ÷ fpb), tabayun a × b, selain itu hasilnya saja. */
function rumusNisab(satu: Langkah<'PERBANDINGAN_NISAB'>): string {
  const { a, b, fpb, hasil } = satu;
  if (satu.hubungan === 'tawafuq') return `${a} × (${b} ÷ ${fpb}) = ${a} × ${b / fpb} = ${hasil}`;
  if (satu.hubungan === 'tabayun') return `${a} × ${b} = ${hasil}`;
  return String(hasil);
}

/** Semua ahli waris ashabah [R09-2]: tidak ada pecahan; harta langsung dibagi per jatah (ru'us) dan totalnya jadi asal masalah. */
function babPenyebutSemuaAshabah(konteks: Konteks, ashl: bigint): Bab {
  const { baris, totalKolom } = konteks.hasil.tabel;
  const daftarBaris = [langkah(konteks, 'logika', 'ashl.semua_ashabah', { ashabah: istilahUmum(konteks, 'ashabah') }, {}, ['R09-2'])];
  // Tanpa tashih/'aul/radd, saham tiap orang = jatahnya; selain itu rinciannya tidak lagi jatah murni.
  if (totalKolom.tashih === undefined && totalKolom.aul === undefined && totalKolom.radd === undefined) {
    const rincian = gabungDan(konteks.penyusun, baris.flatMap(barisTabel => Object.entries(barisTabel.perOrang)).map(([id, orang]) =>
      susun(konteks.penyusun, kunciKamus('ashl.jatah_orang'), { siapa: konteks.sebutan.sebut([id]), jatah: orang.saham })));
    daftarBaris.push(langkah(konteks, 'hitung', 'ashl.jatah_total', { rincian, ashl }, { rincian, ashl }, ['R09-2']));
  }
  daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'ashl.jadi', { ashl }, { ashl, ashlul_masalah: istilahUmum(konteks, 'ashlul-masalah') }, ['R09-2']), labelHitung(konteks, 'asal_masalah'), String(ashl)));
  return { judul: judulSkrip(konteks, 'ashl.judul'), daftarBaris, kolom: 'ashl' };
}

// ─── Memeriksa jumlah bagian: 'adilah, 'aul, radd ─────────────────────────────

export function babPenyesuaianSkrip(konteks: Konteks): HasilSkrip {
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) return barisSisaKeluar(konteks, sisaKeluar);
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  if (!kelas) return LAMA;
  const { baris } = konteks.hasil.tabel;
  const rincian = baris.length > 1 ? `${baris.map(barisTabel => barisTabel.sel['ashl']).join(' + ')} = ` : '';
  const tanya = langkah(konteks, 'tanya', 'cek.tanya', {}, { ashl: kelas.ashl });
  switch (kelas.kelas) {
    case 'adilah':
      return { judul: judulSkrip(konteks, 'cek.judul'), kolom: 'penyesuaian', daftarBaris: [tanya,
        denganHitungan(langkah(konteks, 'hitung', 'cek.pas', { rincian, jumlah: kelas.jumlahSaham }, { rincian, jumlah: kelas.jumlahSaham, adilah: istilahUmum(konteks, 'adilah') }, kelas.refs),
          labelHitung(konteks, 'jumlah'), `${rincian}${kelas.jumlahSaham}`)] };
    case 'ailah':
      return { judul: judulSkrip(konteks, 'aul.judul'), kolom: 'penyesuaian', daftarBaris: [tanya, ...barisAul(konteks, kelas, rincian)] };
    case 'raddA': case 'raddB':
      return barisRadd(konteks, kelas, rincian, tanya);
  }
}

/** Hanya pasangan yang mewarisi [R09-9] (atau kebijakan baitul mal [R09-8]): sisa keluar dari ahli waris, tidak di-radd. */
function barisSisaKeluar(konteks: Konteks, sisaKeluar: Langkah<'SISA_KELUAR'>): HasilSkrip {
  const { baris } = konteks.hasil.tabel;
  const { ashl, saham: sisa } = sisaKeluar;
  const jumlah = ashl - sisa;
  const rincian = baris.length > 1 ? `${baris.map(barisTabel => barisTabel.sel['ashl']).join(' + ')} = ` : '';
  const pasangan = sebutSemua(konteks, baris.flatMap(barisTabel => barisTabel.anggota));
  const radd_ = istilahUmum(konteks, 'radd');
  const refs = sisaKeluar.refs;
  const daftarBaris = [
    langkah(konteks, 'tanya', 'cek.tanya', {}, { ashl }),
    denganHitungan(langkah(konteks, 'hitung', 'radd.kurang', { rincian, jumlah, ashl, sisa }, { rincian, jumlah, ashl, sisa }, refs), labelHitung(konteks, 'jumlah'), `${rincian}${jumlah} < ${ashl}`),
    langkah(konteks, 'tanya', 'radd.tanya', { sisa }, { sisa }),
  ];
  if (sisaKeluar.tujuan === 'baitulMalTeratur') {
    daftarBaris.push(langkah(konteks, 'keluarga', 'radd.baitul_mal_teratur', { sisa }, { sisa }, refs));
  } else {
    daftarBaris.push(
      langkah(konteks, 'dasar', 'radd.dasar', { radd: radd_ }, { radd: radd_ }, refs),
      langkah(konteks, 'keluarga', 'radd.pasangan_saja', { pasangan, sisa }, { pasangan }, refs),
      langkah(konteks, 'hitung', [`radd.sisa_tujuan.${sisaKeluar.tujuan === 'dzawilArham' ? 'dzawil_arham' : 'baitul_mal'}.narasi`, 'radd.sisa_tujuan.papan'], { sisa }, { sisa }, refs),
    );
  }
  return { judul: judulSkrip(konteks, 'radd.judul'), kolom: 'penyesuaian', daftarBaris };
}

function barisAul(konteks: Konteks, kelas: Langkah<'KELAS_MASALAH'>, rincian: string): BarisPenjelasan[] {
  const { ashl, jumlahSaham: jumlah } = kelas;
  const refs = konteks.daftarLangkah('AUL')[0]?.refs ?? kelas.refs;
  const contoh = konteks.hasil.tabel.baris[0]!;
  const sisipanContoh = { siapa: sebutKelompok(konteks, contoh.kelompok), kotak: contoh.sel['ashl']!, ashl, jumlah };
  const rincianKelompok = gabungDan(konteks.penyusun, konteks.hasil.tabel.baris.map(barisTabel =>
    susun(konteks.penyusun, kunciKamus('aul.rincian_kelompok'), { siapa: sebutKelompok(konteks, barisTabel.kelompok), saham: barisTabel.sel['ashl']! })));
  const nilaiTiapKelompok = konteks.hasil.tabel.baris.map(barisTabel => {
    const sisipan = { kotak: barisTabel.sel['ashl']!, jumlah, ashl };
    return barisNilai(konteks, barisTabel.kelompok, susun(konteks.penyusun, kunciKamus('aul.isi_nilai'), sisipan), refs);
  });
  return [
    denganHitungan(langkah(konteks, 'hitung', 'aul.lebih', { rincian, jumlah, ashl, kelebihan: jumlah - ashl }, { rincian, jumlah, ashl, kelebihan: jumlah - ashl }, kelas.refs),
      labelHitung(konteks, 'jumlah'), `${rincian}${jumlah} > ${ashl}`),
    langkah(konteks, 'tanya', 'aul.tanya', {}, {}),
    langkah(konteks, 'logika', 'aul.bersama', {}, {}, refs),
    denganHitungan(langkah(konteks, 'logika', 'aul.potong_ulang', { jumlah, aul: istilahUmum(konteks, 'aul') }, { jumlah, aul: istilahUmum(konteks, 'aul') }, refs),
      labelHitung(konteks, 'asal_naik'), `${ashl} → ${jumlah}`),
    langkah(konteks, 'logika', 'aul.contoh', sisipanContoh, { siapa: sisipanContoh.siapa, kotak: sisipanContoh.kotak, ashl, jumlah }, refs),
    ...nilaiTiapKelompok,
    langkah(konteks, 'hitung', 'aul.hasil', { jumlah, rincian: rincianKelompok }, { jumlah }, refs),
  ];
}

/** Baris hitung "Maryam dan Hafsah: 4 dari 8": nilai satu kelompok pada penyebut baru ('aul/radd), berlabel nama kelompok. */
function barisNilai(konteks: Konteks, kelompok: string, isi: Potongan[], refs: string[]): BarisPenjelasan {
  const siapa = sebutKelompok(konteks, kelompok);
  const kalimatNilai = kalimat`${siapa}: ${isi}.`;
  return denganHitungan({ ...buatBaris(kalimatNilai, refs, konteks.anggotaDari(kelompok)), jenis: 'hitung', papan: kalimatNilai }, siapa, isi);
}

function barisRadd(konteks: Konteks, kelas: Langkah<'KELAS_MASALAH'>, rincian: string, tanya: BarisPenjelasan): HasilSkrip {
  const [radd] = konteks.daftarLangkah('RADD');
  if (!radd) return LAMA;
  const { ashl, jumlahSaham: jumlah } = kelas;
  const sisa = ashl - jumlah;
  const kelompokPenerima = Object.keys(radd.raddiyyah.saham);
  const penerima = sebutSemua(konteks, kelompokPenerima.flatMap(kelompok => konteks.anggotaDari(kelompok)));
  const perbandingan = Object.values(radd.raddiyyah.saham).join(' : ');
  const ashlRadd = radd.raddiyyah.ashl;
  const radd_ = istilahUmum(konteks, 'radd');
  const { baris } = konteks.hasil.tabel;
  const daftarBaris = [
    tanya,
    denganHitungan(langkah(konteks, 'hitung', 'radd.kurang', { rincian, jumlah, ashl, sisa }, { rincian, jumlah, ashl, sisa }, kelas.refs), labelHitung(konteks, 'jumlah'), `${rincian}${jumlah} < ${ashl}`),
    langkah(konteks, 'tanya', 'radd.tanya', { sisa }, { sisa }),
    langkah(konteks, 'dasar', 'radd.dasar', { radd: radd_ }, { radd: radd_ }, radd.refs),
    langkah(konteks, 'keluarga', 'radd.tanpa_ashabah', { sisa, penerima }, { sisa, penerima }, radd.refs),
  ];
  const rincianRadd = (hitungSaham: (kelompok: string) => bigint) => gabungDan(konteks.penyusun, kelompokPenerima.map(kelompok =>
    susun(konteks.penyusun, kunciKamus('radd.rincian_penerima'), { siapa: sebutKelompok(konteks, kelompok), saham: hitungSaham(kelompok) })));
  const { zawjiyyah } = radd;
  if (!zawjiyyah) {
    const rincianBagian = rincianRadd(kelompok => radd.raddiyyah.saham[kelompok]!);
    daftarBaris.push(
      langkah(konteks, 'logika', 'radd.perbandingan', { rincian: rincianBagian, ashl_radd: ashlRadd }, { perbandingan, ashl_radd: ashlRadd }, radd.refs),
      ...kelompokPenerima.map(kelompok => barisNilai(konteks, kelompok,
        susun(konteks.penyusun, kunciKamus('radd.isi_nilai'), { kotak: radd.raddiyyah.saham[kelompok]!, jumlah: ashlRadd }), radd.refs)),
      denganHitungan(langkah(konteks, 'hitung', 'radd.hasil', { rincian: rincianBagian, ashl_radd: ashlRadd }, { ashl_radd: ashlRadd }, radd.refs),
        labelHitung(konteks, 'asal_baru'), `${ashl} → ${ashlRadd}`),
    );
    return { judul: judulSkrip(konteks, 'radd.judul'), kolom: 'penyesuaian', daftarBaris };
  }

  const barisPasangan = baris.find(barisTabel => barisTabel.kelompok === zawjiyyah.kelompok)!;
  const pasangan = sebutKelompok(konteks, zawjiyyah.kelompok);
  const fardhPasangan = barisPasangan.fardh!;
  daftarBaris.push(
    langkah(konteks, 'keluarga', 'radd.pasangan_tidak_ikut', { pasangan, fardh: fardhPasangan }, { pasangan, fardh: fardhPasangan }, radd.refs, barisPasangan.anggota),
    langkah(konteks, 'hitung', 'radd.pasangan_dulu', { ashl: zawjiyyah.ashl, pasangan, saham: zawjiyyah.sahamPasangan, sisa: zawjiyyah.sisa, penerima },
      { ashl: zawjiyyah.ashl, saham: zawjiyyah.sahamPasangan, sisa: zawjiyyah.sisa, penerima }, radd.refs),
    kelompokPenerima.length > 1
      ? langkah(konteks, 'hitung', 'radd.sisa_bagi.jamak', { penerima, sisa: zawjiyyah.sisa, perbandingan, ashl_radd: ashlRadd }, { perbandingan, ashl_radd: ashlRadd }, radd.refs)
      : langkah(konteks, 'hitung', 'radd.sisa_bagi.mufrad', { penerima, sisa: zawjiyyah.sisa }, { penerima }, radd.refs),
  );
  const [bandingkan] = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(satu => satu.tujuan === 'raddVsSisa');
  if (bandingkan && kelompokPenerima.length > 1) daftarBaris.push(barisNisabRadd(konteks, bandingkan));
  const totalRadd = konteks.hasil.tabel.totalKolom.radd!;
  const rincianAkhir = gabungDan(konteks.penyusun, baris.map(barisTabel => barisTabel.kelompok === zawjiyyah.kelompok
    ? susun(konteks.penyusun, kunciKamus('radd.rincian_pasangan'), { siapa: sebutKelompok(konteks, barisTabel.kelompok), saham: barisTabel.sel['radd']!, fardh: fardhPasangan })
    : susun(konteks.penyusun, kunciKamus('radd.rincian_penerima'), { siapa: sebutKelompok(konteks, barisTabel.kelompok), saham: barisTabel.sel['radd']! })));
  daftarBaris.push(
    ...baris.map(barisTabel => barisNilai(konteks, barisTabel.kelompok, susun(konteks.penyusun, kunciKamus('radd.isi_nilai'), { kotak: barisTabel.sel['radd']!, jumlah: totalRadd }), radd.refs)),
    denganHitungan(langkah(konteks, 'hitung', 'radd.hasil', { rincian: rincianAkhir, ashl_radd: totalRadd }, { ashl_radd: totalRadd }, radd.refs),
      labelHitung(konteks, 'asal_baru'), `${ashl} → ${totalRadd}`),
  );
  return { judul: judulSkrip(konteks, 'radd.judul'), kolom: 'penyesuaian', daftarBaris };
}

/** Sisa pasangan vs penyebut radd [R09-9]: habis, tawafuq, atau tabayun. */
function barisNisabRadd(konteks: Konteks, satu: Langkah<'PERBANDINGAN_NISAB'>): BarisPenjelasan {
  const { a: sisa, b: ashlRadd, fpb, hasil } = satu;
  const kunci = (jenis: string) => `narasi.langkah.radd.nisab.${jenis}.narasi`;
  const kalimatNisab = satu.hubungan === 'habis'
    ? susun(konteks.penyusun, kunci('habis'), { sisa, ashl_radd: ashlRadd, hasil })
    : satu.hubungan === 'tawafuq'
      ? susun(konteks.penyusun, kunci('tawafuq'), { sisa, ashl_radd: ashlRadd, fpb, tawafuq: istilahUmum(konteks, 'tawafuq'), pengali: ashlRadd / fpb, hasil })
      : susun(konteks.penyusun, kunci('tabayun'), { sisa, ashl_radd: ashlRadd, tabayun: istilahUmum(konteks, 'tabayun'), hasil });
  return { ...buatBaris(kalimatNisab, satu.refs), jenis: 'logika', papan: kalimatNisab };
}

// ─── Supaya bagian jadi bulat (tashih) ────────────────────────────────────────

export function babPembulatanSkrip(konteks: Konteks): HasilSkrip {
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(satu => satu.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const [tashih] = konteks.daftarLangkah('TASHIH');
  const penutup = langkah(konteks, 'jembatan', `tashih.jembatan.${konteks.tampilkanNominal ? 'rupiah' : 'ringkas'}`, {}, {});
  const judul = judulSkrip(konteks, 'tashih.judul');
  if (!tashih) {
    if (inkisar.some(satu => satu.hubungan !== 'habis')) return LAMA;
    return { judul, kolom: 'tashih', daftarBaris: [...barisBagiRata(konteks, inkisar), penutup] };
  }
  return { judul, kolom: 'tashih', daftarBaris: [...barisTashih(konteks, inkisar, tashih), penutup] };
}

type Inkisar = Langkah<'PERBANDINGAN_NISAB'>;

const satuanPembagi = (konteks: Konteks, ruus: bigint, jumlahAnggota: number): string =>
  teksKamus(konteks.penyusun, kunciKamus(ruus > BigInt(jumlahAnggota) ? 'tashih.satuan.jatah' : 'tashih.satuan.orang'));

function barisBagiRata(konteks: Konteks, inkisar: Inkisar[]): BarisPenjelasan[] {
  const daftarBaris = [langkah(konteks, 'tanya', 'tashih.rata.tanya', {}, {})];
  for (const satu of inkisar) {
    const { a: saham, b: ruus } = satu;
    const satuan = satuanPembagi(konteks, ruus, konteks.anggotaDari(satu.kelompok!).length);
    const siapa = sebutKelompok(konteks, satu.kelompok!);
    daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'tashih.rata.pas', { siapa, saham, ruus, satuan }, { saham, ruus, hasil_bagi: saham / ruus }, satu.refs),
      siapa, `${saham} ÷ ${ruus} = ${saham / ruus}`));
  }
  daftarBaris.push(langkah(konteks, 'hitung', 'tashih.rata.semua', {}, {}, ['R10-2']));
  return daftarBaris;
}

/** Satu atau beberapa kelompok yang bagiannya tidak habis dibagi anggotanya: cek tiap kelompok, cari pengali, potong ulang, bagi. */
function barisTashih(konteks: Konteks, daftarInkisar: Inkisar[], tashih: Langkah<'TASHIH'>): BarisPenjelasan[] {
  const { penyusun } = konteks;
  const pengali = tashih.juzSahm;
  const banyak = daftarInkisar.length > 1;
  const kelompok = daftarInkisar.map(satu => {
    const anggota = konteks.anggotaDari(satu.kelompok!);
    return { satu, anggota, siapa: sebutKelompok(konteks, satu.kelompok!), satuan: satuanPembagi(konteks, satu.b, anggota.length) };
  });
  const daftarBaris: BarisPenjelasan[] = [];
  for (const { satu, anggota, siapa, satuan } of kelompok) {
    const { a: saham, b: ruus } = satu;
    if (ruus > BigInt(anggota.length)) daftarBaris.push(langkah(konteks, 'keluarga', 'tashih.jatah', { siapa, ruus }, { ruus, ruus_istilah: istilahUmum(konteks, 'ruus') }, ['R10-2']));
    if (satu.hubungan === 'habis') {
      daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'tashih.rata.pas', { siapa, saham, ruus, satuan }, { saham, ruus, hasil_bagi: saham / ruus }, satu.refs), siapa, `${saham} ÷ ${ruus} = ${saham / ruus}`));
      continue;
    }
    const sisipan = { saham, ruus, satuan, hasil_bagi: saham / ruus, sisa: saham % ruus };
    const papan = { saham, ruus, hasil_bagi: saham / ruus, sisa: saham % ruus, hubungan: istilahUmum(konteks, satu.hubungan === 'tawafuq' ? 'tawafuq' : 'tabayun') };
    daftarBaris.push(banyak
      ? langkah(konteks, 'keluarga', ['tashih.tidak_habis_kelompok.narasi', 'tashih.tidak_habis.papan'], { siapa, ...sisipan }, papan, satu.refs)
      : langkah(konteks, 'keluarga', 'tashih.tidak_habis', sisipan, papan, satu.refs));
  }

  const simpanan = daftarInkisar.filter(satu => satu.hubungan !== 'habis');
  if (simpanan.length > 1) {
    const angka = gabungDan(penyusun, simpanan.map(satu => [teks(String(satu.hasil))]));
    daftarBaris.push(langkah(konteks, 'logika', 'tashih.pengali_bersama', { angka }, { angka }, ['R10-3']));
    for (const gabung of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(satu => satu.tujuan === 'juzSahm')) {
      const awalan = susun(penyusun, 'narasi.cerita.tashih.awalan_juz_sahm', { a: gabung.a, b: gabung.b });
      const kalimatNisab = ceritaArba(konteks, gabung, awalan);
      daftarBaris.push({ ...buatBaris(kalimatNisab, gabung.refs), jenis: 'logika', papan: kalimatNisab });
    }
  }
  daftarBaris.push(denganHitungan(langkah(konteks, 'logika', 'tashih.potong', { pengali, dasar: tashih.dasar, hasil: tashih.hasil },
    { pengali, dasar: tashih.dasar, hasil: tashih.hasil, tashih: istilahUmum(konteks, 'tashih') }, tashih.refs), labelHitung(konteks, 'tashih'), `${tashih.dasar} × ${pengali} = ${tashih.hasil}`));
  for (const { satu, siapa } of kelompok) {
    const potongKelompok = satu.a * pengali;
    const sisipan = { saham: satu.a, potong_kelompok: potongKelompok, ruus: satu.b };
    daftarBaris.push(denganHitungan(langkah(konteks, 'logika', banyak ? ['tashih.habis_dibagi_kelompok.narasi', 'tashih.habis_dibagi.papan'] : 'tashih.habis_dibagi',
      banyak ? { siapa, ...sisipan } : sisipan, { saham: satu.a, pengali, potong_kelompok: potongKelompok, ruus: satu.b, per: potongKelompok / satu.b }, tashih.refs),
    siapa, `${satu.a} × ${pengali} = ${potongKelompok}, ${potongKelompok} ÷ ${satu.b} = ${potongKelompok / satu.b}`));
  }
  const kelompokInkisar = new Set(daftarInkisar.map(satu => satu.kelompok));
  const contoh = konteks.hasil.tabel.baris.find(barisTabel => !kelompokInkisar.has(barisTabel.kelompok) && barisTabel.fardh && !barisTabel.ashabah);
  if (contoh) {
    // Setelah 'aul/radd satuan kotak mengikuti penyebut barunya, jadi pecahan dihitung dari kotak ÷ penyebut itu.
    const { totalKolom } = konteks.hasil.tabel;
    const kolomDasar = totalKolom.aul !== undefined ? 'aul' : totalKolom.radd !== undefined ? 'radd' : 'ashl';
    const kotak = contoh.sel[kolomDasar]!;
    const pecahan = kolomDasar === 'ashl' ? contoh.fardh! : `${kotak}/${tashih.dasar}`;
    const sisipan = { siapa: sebutKelompok(konteks, contoh.kelompok), kotak, potong: kotak * pengali, pecahan, hasil: tashih.hasil };
    daftarBaris.push(langkah(konteks, 'logika', 'tashih.nilai_tetap', sisipan, sisipan, tashih.refs));
  }
  for (const { satu, anggota, siapa, satuan } of kelompok) {
    const barisKelompok = konteks.hasil.tabel.baris.find(barisTabel => barisTabel.kelompok === satu.kelompok)!;
    const total = satu.a * pengali;
    const rincian = gabungDan(penyusun, anggota.map(id =>
      susun(penyusun, kunciKamus('tashih.rincian_orang'), { siapa: konteks.sebutan.sebut([id]), saham: barisKelompok.perOrang[id]!.saham })));
    daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'tashih.dibagi', { kelompok: siapa, saham: satu.a, pengali, total, ruus: satu.b, satuan, per: total / satu.b, rincian },
      { total, ruus: satu.b, per: total / satu.b, satuan }, tashih.refs), siapa, `${total} ÷ ${satu.b} = ${total / satu.b}`));
  }
  const bagianAkhir = konteks.hasil.tabel.baris.flatMap(barisTabel => Object.values(barisTabel.perOrang).map(orang => orang.saham)).filter(angka => angka > 0n);
  daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'tashih.cek', { daftar: gabungDan(penyusun, bagianAkhir.map(angka => [teks(String(angka))])), hasil: tashih.hasil },
    { jumlahan: gabungPlus(bagianAkhir), hasil: tashih.hasil }, tashih.refs), labelHitung(konteks, 'cek'), `${bagianAkhir.join(' + ')} = ${tashih.hasil}`));
  return daftarBaris;
}

// ─── Hasil akhir dan ringkasan ────────────────────────────────────────────────

export function babHasilSkrip(konteks: Konteks): HasilSkrip {
  const { tabel, pembulatan, sisaKeluar } = konteks.hasil;
  const penyebut = konteks.penyebutAkhir;
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  const daftarBaris: BarisPenjelasan[] = [];
  const bersih = tirkah ? rupiah(tirkah.bersih) : '';
  if (konteks.tampilkanNominal && tirkah && pembulatan.satuan === 1n && tirkah.bersih % penyebut === 0n) {
    const sisipan = { bersih, penyebut, nilai: rupiah(tirkah.bersih / penyebut) };
    daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'hasil.satu_potong', sisipan, sisipan, ['R11-1']),
      labelHitung(konteks, 'satu_potong'), `${bersih} ÷ ${penyebut} = ${sisipan.nilai}`));
  }
  const ringkasan: Potongan[][] = [];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang)) {
      const siapa = konteks.sebutan.sebut([id]);
      ringkasan.push(susun(konteks.penyusun, kunciKamus('hasil.ringkas_orang'), { siapa, saham, penyebut }));
      if (saham === 0n) {
        const nol = susun(konteks.penyusun, 'narasi.cerita.hasil.orang_nol', { siapa });
        daftarBaris.push({ ...buatBaris(nol, ['R11-1'], [id]), jenis: 'hitung', papan: nol });
      } else if (konteks.tampilkanNominal) {
        const uang = rupiah(nominal);
        daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'hasil.orang_rupiah', { siapa, saham, nominal: uang }, { siapa, saham, penyebut, nominal: uang }, ['R11-1'], [id]),
          siapa, `${saham}/${penyebut} × ${bersih} = ${uang}`));
      } else {
        const sisipan = { siapa, saham, penyebut };
        daftarBaris.push(denganHitungan(langkah(konteks, 'hitung', 'hasil.orang_saham', sisipan, sisipan, ['R11-1'], [id]), siapa, `${saham}/${penyebut}`));
      }
    }
  }
  if (sisaKeluar) {
    const nominalBila = konteks.tampilkanNominal ? kalimat` = ${rupiah(sisaKeluar.nominal)}` : [];
    const kalimatSisa = susun(konteks.penyusun, 'narasi.cerita.hasil.sisa', {
      saham: sisaKeluar.saham, penyebut, nominal: nominalBila, tujuan: teksTujuanSisa(konteks.penyusun, sisaKeluar.tujuan),
    });
    daftarBaris.push(tekankan({ ...buatBaris(kalimatSisa, konteks.daftarLangkah('SISA_KELUAR')[0]?.refs ?? []), jenis: 'hitung', papan: kalimatSisa }, 'perhatian'));
  }
  if (konteks.tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    const perSatuan = pembulatan.satuan > 1n;
    const sisipan = { satuan: rupiah(pembulatan.satuan), selisih: rupiah(pembulatan.sisaPembulatan) };
    const selisih = perSatuan
      ? [...susun(konteks.penyusun, 'narasi.cerita.hasil.selisih.per_satuan', sisipan), teks(' '), ...susun(konteks.penyusun, 'narasi.cerita.hasil.saran_transfer')]
      : susun(konteks.penyusun, 'narasi.cerita.hasil.selisih.per_rupiah', { selisih: sisipan.selisih });
    daftarBaris.push(tekankan(denganHitungan({ ...buatBaris(selisih), jenis: 'hitung', papan: selisih }, labelHitung(konteks, 'selisih_pembulatan'), sisipan.selisih), 'perhatian'));
  } else if (konteks.tampilkanNominal && tirkah) {
    daftarBaris.push(langkah(konteks, 'hitung', 'hasil.cek_pas', { bersih }, { bersih }));
  }
  const rincian = gabungDan(konteks.penyusun, ringkasan);
  daftarBaris.push(langkah(konteks, 'ringkas', 'hasil.ringkas', { rincian }, { rincian }));
  return { judul: judulSkrip(konteks, konteks.tampilkanNominal ? 'hasil.judul_rupiah' : 'hasil.judul_saham'), daftarBaris, kolom: 'nominal' };
}
