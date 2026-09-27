// Mode cerita (default, untuk orang awam). Tiap bab = masalahnya apa → caranya → istilahnya → hasilnya.
// Urutan bab: harta → siapa mewarisi → bagian masing-masing → menyamakan penyebut
//             → 'adilah/'aul/radd → pembulatan (tashih) → hasil akhir.

import type { AlasanFardh, PilihanJadd, IdOrang } from '@waris/engine';
import { sebutKelompok, sebutSemua, type Konteks, type Langkah } from './context.js';
import { rupiah } from './format.js';
import { gabungDan, buatBaris, kalimat, tekankan, type BarisPenjelasan, type Potongan } from './segments.js';
import { istilah } from './terms.js';

/** Kolom tabel faraidh yang dibahas bab ini, untuk penyorotan di UI (tidak memengaruhi narasi). */
export type KolomBab = 'ahliWaris' | 'bagian' | 'ashl' | 'penyesuaian' | 'tashih' | 'nominal';
export interface Bab { judul: string; daftarBaris: BarisPenjelasan[]; kolom?: KolomBab }

export function babCerita(konteks: Konteks): Bab[] {
  return [babHarta, babAhliWaris, babBagian, babPenyebut, babPenyesuaian, babPembulatan, babHasil]
    .map(susun => susun(konteks))
    .filter((bab): bab is Bab => bab !== undefined);
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

const gabungAtau = (daftar: Potongan[][]) => daftar.flatMap((unsur, i) =>
  i === 0 ? unsur : [{ jenis: 'teks' as const, teks: i === daftar.length - 1 ? ', atau ' : ', ' }, ...unsur]);

// ─── Langkah: harta ───────────────────────────────────────────────────────────

function babHarta(konteks: Konteks): Bab | undefined {
  const [langkahTirkah] = konteks.daftarLangkah('TIRKAH');
  if (!langkahTirkah || langkahTirkah.kotor === 0n) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  const setelahHutang = langkahTirkah.bersih + langkahTirkah.wasiatDipakai;
  if (langkahTirkah.tajhiz > 0n || langkahTirkah.hutang > 0n) {
    daftarBaris.push(buatBaris([
      ...kalimat`Sebelum dibagi, harta peninggalan (${istilah('tirkah', 'tirkah')}) ${rupiah(langkahTirkah.kotor)} dipakai dulu untuk biaya pengurusan jenazah `,
      ...kalimat`${rupiah(langkahTirkah.tajhiz)} dan melunasi hutang ${rupiah(langkahTirkah.hutang)}, sehingga tersisa ${rupiah(setelahHutang)}.`,
      ...(setelahHutang === 0n ? kalimat` Hutang menghabiskan seluruh harta, sehingga tidak ada yang dibagi sebagai warisan.` : []),
    ], langkahTirkah.refs));
  }
  if (langkahTirkah.wasiatButuhIjazah > 0n) {
    daftarBaris.push(tekankan(buatBaris(kalimat`Wasiat ${konteks.sebutan.pewaris()} sebesar ${rupiah(langkahTirkah.wasiatDiminta)} melebihi batas sepertiga harta (${rupiah(langkahTirkah.wasiatBatas)}), `
      .concat(kalimat`jadi yang dijalankan hanya ${rupiah(langkahTirkah.wasiatDipakai)}. Kelebihan ${rupiah(langkahTirkah.wasiatButuhIjazah)} baru boleh dijalankan `,
        kalimat`jika semua ahli waris menyetujuinya (ijazah).`), ['R01-4']), 'perhatian'));
  } else if (langkahTirkah.wasiatDiminta > 0n) {
    daftarBaris.push(buatBaris(kalimat`Wasiat ${konteks.sebutan.pewaris()} sebesar ${rupiah(langkahTirkah.wasiatDipakai)} dijalankan karena tidak melebihi sepertiga harta (${rupiah(langkahTirkah.wasiatBatas)}).`, ['R01-4']));
  }
  daftarBaris.push(buatBaris(kalimat`Harta yang dibagi kepada ahli waris: ${rupiah(langkahTirkah.bersih)}.`, ['R11-1']));
  return { judul: 'Menghitung harta yang dibagi', daftarBaris, kolom: 'nominal' };
}

// ─── Langkah: ahli waris ──────────────────────────────────────────────────────

function babAhliWaris(konteks: Konteks): Bab {
  const daftarAhliWaris = Object.entries(konteks.hasil.statusOrang).filter(([, status]) => status.jenis === 'ahliWaris').map(([id]) => id);
  const daftarBaris = [buatBaris(kalimat`Ahli waris (${istilah('warits', 'warits')}) ${konteks.sebutan.pewaris()}: ${sebutSemua(konteks, daftarAhliWaris)}.`)];

  for (const langkah of konteks.daftarLangkah('MANI')) {
    const siapa = konteks.sebutan.sebut([langkah.idOrang]);
    daftarBaris.push(buatBaris(langkah.mani === 'qatl'
      ? kalimat`${siapa} tidak mendapat warisan karena membunuh ${konteks.sebutan.pewaris()}; pembunuh terhalang dari warisan (${istilah('mani', "mani'")}).`
      : kalimat`${siapa} tidak mendapat warisan karena berbeda agama dengan ${konteks.sebutan.pewaris()} (${istilah('mani', "mani'")}).`, langkah.refs, [langkah.idOrang]));
  }

  const dikelompokkan = new Map<string, { mahjub: IdOrang[]; langkah: Langkah<'HAJB_HIRMAN'> }>();
  for (const langkah of konteks.daftarLangkah('HAJB_HIRMAN')) {
    const kunci = `${konteks.sebutan.peranDari(langkah.mahjub)?.kunci}|${langkah.hajib.join(',')}`;
    const entri = dikelompokkan.get(kunci) ?? { mahjub: [], langkah };
    entri.mahjub.push(langkah.mahjub);
    dikelompokkan.set(kunci, entri);
  }
  for (const { mahjub, langkah } of dikelompokkan.values()) {
    daftarBaris.push(buatBaris(kalimat`${sebutSemua(konteks, mahjub)} tidak mendapat bagian karena terhalang oleh ${sebutSemua(konteks, langkah.hajib)} `
      .concat(kalimat`(${istilah('hajb-hirman', 'hajb hirman')}).`), langkah.refs, mahjub));
  }
  return { judul: 'Siapa yang mendapat warisan', daftarBaris, kolom: 'ahliWaris' };
}

// ─── Langkah: bagian masing-masing ────────────────────────────────────────────

const OPSI_KAKEK: Record<PilihanJadd, (konteks: Konteks) => Potongan[]> = {
  muqasamah: () => kalimat`dihitung sebagai saudara (${istilah('muqasamah', 'muqasamah')})`,
  tsuluts: () => kalimat`sepertiga harta`,
  tsulutsBaqi: () => kalimat`sepertiga sisa`,
  sudus: () => kalimat`seperenam harta`,
};

function babBagian(konteks: Konteks): Bab {
  const daftarBaris: BarisPenjelasan[] = [];
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(langkahIni => langkahIni.kelompok));
  let nuqshanDijelaskan = false;
  const catatanNuqshan = (): Potongan[] => {
    if (nuqshanDijelaskan) return [];
    nuqshanDijelaskan = true;
    return kalimat` Pengurangan seperti ini disebut ${istilah('hajb-nuqshan', 'hajb nuqshan')}.`;
  };

  for (const langkah of konteks.hasil.jejak) {
    if (langkah.jenis === 'FARDH') {
      const anggota = konteks.anggotaDari(langkah.kelompok);
      const nuqshan = konteks.daftarLangkah('HAJB_NUQSHAN').find(langkahNuqshan => anggota.includes(langkahNuqshan.terdampak));
      daftarBaris.push(buatBaris(ceritaFardh(konteks, langkah, nuqshan ? kalimat`, bukan ${nuqshan.dari},` : [], nuqshan ? catatanNuqshan : () => []), langkah.refs, anggota));
    } else if (langkah.jenis === 'KASUS_KHUSUS') {
      daftarBaris.push(buatBaris(ceritaKasusKhusus(langkah.nama), langkah.refs));
    } else if (langkah.jenis === 'ASHABAH' && !kelompokFardh.has(langkah.kelompok)) {
      if (langkah.pilihanJadd) {
        const kakek = konteks.anggotaDari(langkah.kelompok).filter(id => konteks.sebutan.peranDari(id)?.kunci === 'KAKEK');
        daftarBaris.push(buatBaris(ceritaPilihanKakek(konteks, sebutSemua(konteks, kakek), langkah.pilihanJadd), langkah.refs, kakek));
      }
      const anggota = konteks.anggotaDari(langkah.kelompok);
      daftarBaris.push(buatBaris(ceritaAshabah(konteks, langkah), langkah.refs, anggota));
      const lebihDekat = langkah.jenisAshabah === 'binNafsi' ? ASHABAH_LEBIH_DEKAT[konteks.sebutan.peranDari(anggota[0]!)?.kunci ?? ''] : undefined;
      if (lebihDekat) {
        daftarBaris.push(buatBaris(kalimat`Sisa harta diberikan kepada kerabat laki-laki yang paling dekat. ${sebutKelompok(konteks, langkah.kelompok)} yang mengambilnya `
          .concat(kalimat`karena tidak ada yang lebih dekat darinya: ${lebihDekat}.`), ['R05-1', 'R05-2', 'R05-3'], anggota));
      }
    }
  }
  return { judul: 'Bagian masing-masing', daftarBaris, kolom: 'bagian' };
}

function ceritaFardh(konteks: Konteks, langkah: Langkah<'FARDH'>, bukan: Potongan[], catatanTambahan: () => Potongan[]): Potongan[] {
  const subjek = sebutKelompok(konteks, langkah.kelompok);
  const pecahanIni = langkah.fardh;
  const almarhum = konteks.sebutan.pewaris();
  const alasan: AlasanFardh = langkah.alasan;
  const faruWarits = istilah('faru-warits', "far'u warits");
  // Furudh bersama (istri-istri, nenek-nenek) dibagi rata [R04-3] [R04-8].
  const mendapat = konteks.anggotaDari(langkah.kelompok).length > 1 ? kalimat`berbagi ${pecahanIni}${bukan} sama rata` : kalimat`mendapat ${pecahanIni}${bukan}`;
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS':
      return [...kalimat`${subjek} ${mendapat} karena ${almarhum} meninggalkan keturunan yang ikut mewarisi (${faruWarits}): `,
        ...kalimat`${sebutSemua(konteks, alasan.oleh)}.`, ...catatanTambahan()];
    case 'TANPA_FARU_WARITS':
      return kalimat`${subjek} ${mendapat} karena ${almarhum} tidak meninggalkan keturunan yang ikut mewarisi (${faruWarits}).`;
    case 'JAM_IKHWAH': {
      const adaYangTerhalang = alasan.oleh.some(id => konteks.hasil.statusOrang[id]?.jenis === 'mahjub');
      return [...kalimat`${subjek} mendapat ${pecahanIni}${bukan} karena ${almarhum} punya dua saudara atau lebih `,
        ...kalimat`(${istilah('jam-min-al-ikhwah', "jam' min al-ikhwah")}): ${sebutSemua(konteks, alasan.oleh)}.`,
        ...(adaYangTerhalang ? kalimat` Mereka tetap dihitung walaupun tidak mendapat bagian.` : []), ...catatanTambahan()];
    }
    case 'TANPA_FARU_WARITS_DAN_IKHWAH':
      return kalimat`${subjek} mendapat ${pecahanIni} karena ${almarhum} tidak meninggalkan keturunan yang ikut mewarisi dan tidak punya dua saudara atau lebih.`;
    case 'UMARIYYATAIN': {
      const pasangan = konteks.anggotaDari('SUAMI').length > 0 ? sebutKelompok(konteks, 'SUAMI') : sebutKelompok(konteks, 'ISTRI');
      return [...kalimat`${subjek} tidak mendapat 1/3 dari seluruh harta, melainkan 1/3 dari sisa setelah bagian ${pasangan} `,
        ...kalimat`(${alasan.fardhPasangan}), yaitu ${pecahanIni} dari seluruh harta. Dengan begitu bagian ayah tidak lebih kecil dari bagian ibu.`];
    }
    case 'NENEK_TANPA_IBU':
      return kalimat`${subjek} ${alasan.banyaknya > 1 ? 'berbagi' : 'mendapat'} ${pecahanIni}${alasan.banyaknya > 1 ? ' sama rata' : ''} karena tidak ada ibu.`;
    case 'TANPA_MUASHSHIB':
      return alasan.banyaknya === 1
        ? kalimat`${subjek} mendapat ${pecahanIni} karena ia sendirian dan tidak ada laki-laki sederajat yang membuatnya ikut mengambil sisa (${istilah('muashshib', "mu'ashshib")}).`
        : kalimat`${subjek} berbagi ${pecahanIni} sama rata karena jumlahnya lebih dari satu dan tidak ada laki-laki sederajat yang membuat mereka ikut mengambil sisa (${istilah('muashshib', "mu'ashshib")}).`;
    case 'TAKMILAH':
      return [...kalimat`${subjek} mendapat ${pecahanIni}${bukan} sebagai pelengkap agar bagiannya bersama ${sebutSemua(konteks, alasan.bersama)} genap 2/3 `,
        ...kalimat`(${istilah('takmilah-tsulutsain', 'takmilah ats-tsulutsain')}).`, ...catatanTambahan()];
    case 'KALALAH':
      return kalimat`${subjek} ${alasan.banyaknya > 1 ? 'berbagi' : 'mendapat'} ${pecahanIni}${alasan.banyaknya > 1 ? ' sama rata' : ''} karena ${almarhum} tidak meninggalkan anak/cucu maupun ayah/kakek (${istilah('kalalah', 'kalalah')}).`;
    case 'ADA_FARU_MUDZAKKAR':
      return kalimat`${subjek} mendapat ${pecahanIni} saja karena ada keturunan laki-laki: ${sebutSemua(konteks, alasan.oleh)}.`;
    case 'ADA_FARU_MUANNATS':
      return kalimat`${subjek} mendapat ${pecahanIni}, ditambah sisa harta nanti (${istilah('ashabah', 'ashabah')}), karena keturunan ${almarhum} hanya perempuan: ${sebutSemua(konteks, alasan.oleh)}.`;
    case 'MUSYARRAKAH':
      return kalimat`${subjek} berbagi ${pecahanIni} sama rata per orang: saudara kandung digabung dengan saudara seibu karena mereka sama-sama anak dari ibu yang sama.`;
    case 'AKDARIYYAH': {
      const anggota = konteks.anggotaDari(langkah.kelompok);
      const adalahKakek = (id: IdOrang) => konteks.sebutan.peranDari(id)?.kunci === 'KAKEK';
      return alasan.porsi === 'jadd'
        ? kalimat`${sebutSemua(konteks, anggota.filter(adalahKakek))} diberi 1/6.`
        : kalimat`${sebutSemua(konteks, anggota.filter(id => !adalahKakek(id)))} diberi 1/2. Bagian keduanya lalu digabung (1/6 + 1/2 = 2/3) dan dibagi ulang: kakek mendapat dua kali bagian saudari.`;
    }
    case 'JADD_SISA_SEDIKIT':
      return kalimat`Setelah bagian yang lain, sisa harta tinggal ${alasan.sisa}, tidak lebih dari 1/6. Karena itu ${subjek} mendapat 1/6 dan para saudara tidak mendapat bagian.`;
    case 'JADD_WAL_IKHWAH':
      return ceritaPilihanKakek(konteks, subjek, alasan);
  }
}

function ceritaPilihanKakek(konteks: Konteks, kakek: Potongan[], pilihan: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }>): Potongan[] {
  const opsi = gabungAtau(pilihan.opsi.map(opsiIni => kalimat`${OPSI_KAKEK[opsiIni.nama](konteks)} = ${opsiIni.nilai}`));
  const terpilih = pilihan.opsi.find(opsiIni => opsiIni.nama === pilihan.terpilih)!;
  return kalimat`Bersama saudara, ${kakek} mendapat pilihan yang paling menguntungkan baginya: ${opsi}. Yang terbesar ${OPSI_KAKEK[pilihan.terpilih](konteks)}, yaitu ${terpilih.nilai}.`;
}

function ceritaKasusKhusus(nama: Langkah<'KASUS_KHUSUS'>['nama']): Potongan[] {
  switch (nama) {
    case 'umariyyatain': return kalimat`Ini termasuk kasus khusus ${istilah('umariyyatain', "al-'Umariyyatain")}.`;
    case 'musyarrakah': return kalimat`Ini termasuk kasus khusus ${istilah('musyarrakah', 'al-Musyarrakah')}.`;
    case 'akdariyyah': return kalimat`Ini termasuk kasus khusus ${istilah('akdariyyah', 'al-Akdariyyah')}.`;
    case 'muaddah':
      return kalimat`Ini termasuk kasus khusus ${istilah('muaddah', "al-Mu'addah")}: saudara sebapak ikut dihitung saat menentukan bagian kakek, lalu bagiannya diserahkan kepada saudara kandung.`;
  }
}

// [R05-2] urutan ashabah bi nafsihi [SYF]: bunuwwah → ubuwwah → juduwwah & ukhuwwah (sejajar) → bani al-ikhwah
// (gugur oleh kakek) → 'umumah & anaknya; [R05-3] dalam satu jihah yang kandung didahulukan dari yang sebapak.
// Isinya: siapa saja yang, bila ada, lebih berhak atas sisa daripada peran ini.
const ASHABAH_LEBIH_DEKAT: Partial<Record<string, string>> = {
  CUCU_LK: 'anak laki-laki',
  AYAH: 'anak laki-laki atau cucu laki-laki dari anak laki-laki',
  KAKEK: 'anak laki-laki, cucu laki-laki dari anak laki-laki, atau ayah',
  SAUDARA_KANDUNG: 'anak laki-laki, cucu laki-laki dari anak laki-laki, atau ayah',
  SAUDARA_SEBAPAK: 'anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, atau saudara laki-laki kandung',
  KEPONAKAN_KANDUNG: 'anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, kakek, atau saudara laki-laki',
  KEPONAKAN_SEBAPAK: 'anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, kakek, saudara laki-laki, atau keponakan laki-laki kandung',
  PAMAN_KANDUNG: 'anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, kakek, saudara laki-laki, atau keponakan laki-laki',
  PAMAN_SEBAPAK: 'anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, kakek, saudara laki-laki, keponakan laki-laki, atau paman kandung',
  SEPUPU_KANDUNG: 'anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, kakek, saudara laki-laki, keponakan laki-laki, atau paman',
  SEPUPU_SEBAPAK: 'anak laki-laki, cucu laki-laki dari anak laki-laki, ayah, kakek, saudara laki-laki, keponakan laki-laki, paman, atau sepupu laki-laki kandung',
};

function ceritaAshabah(konteks: Konteks, langkah: Langkah<'ASHABAH'>): Potongan[] {
  const subjek = sebutKelompok(konteks, langkah.kelompok);
  switch (langkah.jenisAshabah) {
    case 'binNafsi':
      return kalimat`${subjek} mengambil seluruh sisa harta setelah bagian tertentu (fardh) dibagikan (${istilah('ashabah', 'ashabah')}).`;
    case 'bilGhair':
      return kalimat`${subjek} mengambil sisa harta bersama-sama (${istilah('bil-ghair', 'ashabah bil ghair')}): laki-laki mendapat dua kali bagian perempuan.`;
    case 'maalGhair':
      return kalimat`${subjek} mengambil sisa harta (${istilah('maal-ghair', "ashabah ma'al ghair")}) karena ${konteks.sebutan.pewaris()} meninggalkan anak/cucu perempuan.`;
  }
}

// ─── Langkah: menyamakan penyebut ─────────────────────────────────────────────

/** Identifikasi dua bilangan dengan nisab arba' (bab 10.2) dalam kalimat sehari-hari. */
export function ceritaArba(langkah: Langkah<'PERBANDINGAN_NISAB'>, awalan: Potongan[]): Potongan[] {
  const { a, b, fpb, hasil } = langkah;
  const [kecil, besar] = a < b ? [a, b] : [b, a];
  const contoh = `Di kasus ini: ${a} dan ${b} → ${hasil}.`;
  switch (langkah.hubungan) {
    case 'tamatsul':
      return kalimat`${awalan}: keduanya sama (${istilah('tamatsul', 'tamatsul', contoh)}), jadi cukup pakai ${hasil}.`;
    case 'tadakhul':
      return kalimat`${awalan}: ${besar} sudah habis dibagi ${kecil} (${istilah('tadakhul', 'tadakhul', contoh)}), jadi cukup pakai ${besar}.`;
    case 'tawafuq':
      return kalimat`${awalan}: tidak ada yang habis membagi yang lain, tetapi keduanya sama-sama bisa dibagi ${fpb} (${istilah('tawafuq', 'tawafuq', contoh)}). Caranya: ${a} × (${b} ÷ ${fpb}) = ${hasil}.`;
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return kecil === 1n
        ? kalimat`${awalan}: angka 1 selalu dianggap tidak punya faktor bersama (${istilah('tabayun', 'tabayun', contoh)}), jadi dikalikan: ${a} × ${b} = ${hasil}.`
        : kalimat`${awalan}: keduanya tidak punya faktor bersama selain 1 (${istilah('tabayun', 'tabayun', contoh)}), jadi dikalikan langsung: ${a} × ${b} = ${hasil}.`;
    default:
      throw new Error(`relasi ${langkah.hubungan} tidak berlaku untuk nisab arba'`);
  }
}

function babPenyebut(konteks: Konteks): Bab {
  const { baris, totalKolom } = konteks.hasil.tabel;
  const ashl = totalKolom.ashl!;
  const daftarBaris: BarisPenjelasan[] = [];
  const istilahAshl = istilah('ashlul-masalah', "ashlul mas'alah", `Di kasus ini: ${ashl}.`);

  if (baris.every(barisTabel => barisTabel.fardh === undefined)) {
    daftarBaris.push(buatBaris(kalimat`Semua ahli waris mengambil sisa (${istilah('ashabah', 'ashabah')}), jadi harta langsung dibagi per kepala (${istilah('ruus', "ru'us")}): `
      .concat(kalimat`laki-laki dihitung 2, perempuan 1. Totalnya ${ashl} bagian (${istilahAshl}).`), ['R09-2']));
    return { judul: 'Menyamakan penyebut', daftarBaris, kolom: 'ashl' };
  }

  const pecahan = baris.filter(barisTabel => barisTabel.fardh).map(barisTabel => kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${barisTabel.fardh!}`);
  const perbandinganAshl = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'ashl');
  if (perbandinganAshl.length === 0) {
    daftarBaris.push(buatBaris(kalimat`Bagian yang sudah pasti: ${gabungDan(pecahan)}. ${pecahan.length > 1 ? 'Semua penyebutnya sama, yaitu' : 'Penyebutnya'} ${ashl}, `
      .concat(kalimat`jadi angka itu langsung dipakai sebagai penyebut bersama (${istilahAshl}).`), ['R09-1']));
  } else {
    daftarBaris.push(buatBaris(kalimat`Bagian-bagian di atas masih berupa pecahan: ${gabungDan(pecahan)}. Supaya bisa dijumlah, kita cari satu angka yang bisa dibagi `
      .concat(kalimat`oleh semua penyebutnya. Angka ini disebut ${istilahAshl}.`), ['R09-1']));
    perbandinganAshl.forEach((langkah, i) => {
      const awalan = i === 0 ? kalimat`Mulai dari ${langkah.a} dan ${langkah.b}` : kalimat`Lalu ${langkah.a} dengan ${langkah.b}`;
      daftarBaris.push(buatBaris(ceritaArba(langkah, awalan), langkah.refs));
    });
  }

  const bagianBagian = baris.map(barisTabel => {
    const sahamAshl = barisTabel.sel['ashl']!;
    if (!barisTabel.fardh) return kalimat`sisanya ${sahamAshl} untuk ${sebutKelompok(konteks, barisTabel.kelompok)}`;
    const porsiFardh = barisTabel.fardh.n * ashl / barisTabel.fardh.d;
    return barisTabel.ashabah ? kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${porsiFardh} + sisa ${sahamAshl - porsiFardh}` : kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${sahamAshl}`;
  });
  daftarBaris.push(buatBaris(kalimat`Jadi harta kita bayangkan dipotong menjadi ${ashl} bagian yang sama (${istilah('saham', 'saham')}): ${gabungDan(bagianBagian)}.`));
  return { judul: 'Menyamakan penyebut', daftarBaris, kolom: 'ashl' };
}

// ─── Langkah: 'adilah / 'aul / radd ───────────────────────────────────────────

function babPenyesuaian(konteks: Konteks): Bab {
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) return { judul: 'Masih ada sisa, untuk siapa?', kolom: 'penyesuaian', daftarBaris: [ceritaSisaKeluar(konteks, sisaKeluar)] };
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const baris = konteks.hasil.tabel.baris;
  const rincian = baris.length > 1 ? `${baris.map(barisTabel => barisTabel.sel['ashl']).join(' + ')} = ` : '';
  const { jumlahSaham, ashl } = kelas;

  switch (kelas.kelas) {
    case 'adilah':
      return { judul: 'Memeriksa jumlah bagian', kolom: 'penyesuaian', daftarBaris: [buatBaris(
        kalimat`Jumlah semua bagian ${rincian}${jumlahSaham}, pas sama dengan ${ashl} (${istilah('adilah', "'adilah")}). Tidak perlu penyesuaian.`, kelas.refs)] };
    case 'ailah': {
      const aul = istilah('aul', "'aul", `Di kasus ini: ${ashl} menjadi ${jumlahSaham}.`);
      return { judul: 'Bagiannya melebihi harta', kolom: 'penyesuaian', daftarBaris: [buatBaris(
        kalimat`Jumlah semua bagian ${rincian}${jumlahSaham}, lebih besar dari ${ashl}. Supaya adil, penyebutnya dinaikkan menjadi ${jumlahSaham} (${aul}): `
          .concat(kalimat`setiap orang tetap mendapat jumlah bagian yang sama, tetapi karena harta sekarang dibagi ${jumlahSaham}, semua bagian berkurang secara sebanding.`),
        konteks.daftarLangkah('AUL')[0]?.refs ?? kelas.refs)] };
    }
    case 'raddA': case 'raddB':
      return { judul: 'Masih ada sisa, untuk siapa?', kolom: 'penyesuaian', daftarBaris: ceritaRadd(konteks, kelas, rincian) };
  }
}

/** Hanya pasangan yang mewarisi [R09-9]: fardh penuh, sisanya keluar dari ahli waris [R14-3] [R02-1]. */
export function ceritaSisaKeluar(konteks: Konteks, langkah: Langkah<'SISA_KELUAR'>): BarisPenjelasan {
  const pasangan = konteks.hasil.tabel.baris.flatMap(barisTabel => barisTabel.anggota);
  const tujuan = langkah.tujuan === 'dzawilArham'
    ? kalimat`diberikan kepada kerabat dzawil arham (kerabat yang bukan ahli waris utama, misalnya ayahnya ibu atau anak dari anak perempuan).`
    : kalimat`diberikan kepada kerabat dzawil arham bila ada (misalnya ayahnya ibu atau anak dari anak perempuan); bila tidak ada, diserahkan ke baitul mal (kas umum umat Islam).`;
  return buatBaris([
    ...kalimat`Dari ${langkah.ashl} bagian, ${sebutSemua(konteks, pasangan)} mendapat ${langkah.ashl - langkah.saham}. `,
    ...kalimat`Masih tersisa ${langkah.saham} bagian, tetapi suami/istri tidak menerima tambahan dari sisa (${istilah('radd', 'radd')}). Sisa itu `, ...tujuan,
  ], langkah.refs, pasangan);
}

function ceritaRadd(konteks: Konteks, kelas: Langkah<'KELAS_MASALAH'>, rincian: string): BarisPenjelasan[] {
  const [radd] = konteks.daftarLangkah('RADD');
  if (!radd) throw new Error('jejak radd tanpa langkah RADD');
  const kelompokPenerima = Object.keys(radd.raddiyyah.saham);
  const penerima = sebutSemua(konteks, kelompokPenerima.flatMap(idKelompok => konteks.anggotaDari(idKelompok)));
  const zawjiyyah = radd.zawjiyyah;
  const daftarBaris = [buatBaris([
    ...kalimat`Jumlah semua bagian ${rincian}${kelas.jumlahSaham}, padahal ada ${kelas.ashl}. Masih tersisa ${kelas.ashl - kelas.jumlahSaham} bagian, dan tidak ada `,
    ...kalimat`ahli waris yang berhak atas sisa (${istilah('ashabah', 'ashabah')}). Sisa itu dikembalikan kepada ${penerima} sesuai besar bagian mereka (${istilah('radd', 'radd')}).`,
    ...(zawjiyyah ? kalimat` ${sebutKelompok(konteks, zawjiyyah.kelompok)} tidak ikut, karena suami/istri tidak menerima radd.` : []),
  ], kelas.refs)];

  const perbandingan = Object.values(radd.raddiyyah.saham).join(' : ');
  if (!zawjiyyah) {
    const rincianRadd = kelompokPenerima.map(idKelompok => kalimat`${sebutKelompok(konteks, idKelompok)} ${radd.raddiyyah.saham[idKelompok]!}`);
    daftarBaris.push(buatBaris(kalimat`Karena tidak ada suami/istri, harta cukup dibagi menurut perbandingan bagian mereka: ${gabungDan(rincianRadd)}, `
      .concat(kalimat`jumlahnya ${radd.raddiyyah.ashl} bagian.`), radd.refs));
    return daftarBaris;
  }

  const barisPasangan = konteks.hasil.tabel.baris.find(barisTabel => barisTabel.kelompok === zawjiyyah.kelompok)!;
  daftarBaris.push(buatBaris(kalimat`Pertama, bagian ${sebutKelompok(konteks, zawjiyyah.kelompok)} diselesaikan dulu: ${barisPasangan.fardh!} berarti dari ${zawjiyyah.ashl} bagian ia mendapat ${zawjiyyah.sahamPasangan}, `
    .concat(kalimat`dan sisanya ${zawjiyyah.sisa} bagian.`), radd.refs));
  daftarBaris.push(buatBaris(kelompokPenerima.length > 1
    ? kalimat`Kedua, ${penerima} berbagi sisa itu dengan perbandingan ${perbandingan}, totalnya ${radd.raddiyyah.ashl} bagian.`
    : kalimat`Kedua, sisa ${zawjiyyah.sisa} bagian itu seluruhnya untuk ${penerima}.`, radd.refs));

  const [bandingkanNisab] = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'raddVsSisa');
  if (bandingkanNisab && kelompokPenerima.length > 1) {
    const { a: sisa, b: ashlRadd, fpb, hasil } = bandingkanNisab;
    daftarBaris.push(buatBaris(bandingkanNisab.hubungan === 'habis'
      ? kalimat`Ketiga, ${sisa} bagian bisa dibagi rata dengan perbandingan tadi (total ${ashlRadd}), jadi penyebutnya tetap ${hasil}.`
      : bandingkanNisab.hubungan === 'tawafuq'
        ? kalimat`Ketiga, ${sisa} bagian tidak bisa dibagi rata menjadi ${ashlRadd}, tetapi keduanya sama-sama bisa dibagi ${fpb} (${istilah('tawafuq', 'tawafuq')}). `
          .concat(kalimat`Maka semuanya dikalikan ${ashlRadd / fpb}: harta dibagi menjadi ${hasil} bagian.`)
        : kalimat`Ketiga, ${sisa} bagian tidak bisa dibagi rata menjadi ${ashlRadd}, dan keduanya tidak punya faktor bersama (${istilah('tabayun', 'tabayun')}). `
          .concat(kalimat`Maka semuanya dikalikan ${ashlRadd}: harta dibagi menjadi ${hasil} bagian.`), bandingkanNisab.refs));
  }

  const hasilRadd = konteks.hasil.tabel.baris.map(barisTabel => barisTabel.kelompok === zawjiyyah.kelompok
    ? kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${barisTabel.sel['radd']!} bagian (tetap ${barisTabel.fardh!})`
    : kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${barisTabel.sel['radd']!} bagian`);
  daftarBaris.push(buatBaris(kalimat`Hasilnya: ${gabungDan(hasilRadd)}.`, radd.refs));
  return daftarBaris;
}

// ─── Langkah: tashih ──────────────────────────────────────────────────────────

function babPembulatan(konteks: Konteks): Bab | undefined {
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  if (inkisar.some(langkahIni => langkahIni.hubungan !== 'habis')) {
    daftarBaris.push(buatBaris(kalimat`Bagian sebuah kelompok kadang tidak bisa dibagi rata ke anggotanya (${istilah('inkisar', 'inkisar')}). Kalau begitu, jumlah bagian `
      .concat(kalimat`diperbesar supaya setiap orang mendapat bilangan bulat (${istilah('tashih', 'tashih')}).`), ['R10-2']));
  }
  for (const langkah of inkisar) {
    const anggota = konteks.anggotaDari(langkah.kelompok!);
    const { a: saham, b: ruus, fpb, hasil } = langkah;
    const untuk = ruus > BigInt(anggota.length)
      ? kalimat`${ruus} kepala (${istilah('ruus', "ru'us")}, laki-laki dihitung 2)`
      : kalimat`${ruus} orang`;
    const siapa = sebutKelompok(konteks, langkah.kelompok!);
    daftarBaris.push(buatBaris(langkah.hubungan === 'habis'
      ? kalimat`${siapa} mendapat ${saham} bagian untuk ${untuk}, pas dibagi rata.`
      : langkah.hubungan === 'tawafuq'
        ? kalimat`${siapa} mendapat ${saham} bagian untuk ${untuk}. ${saham} tidak bisa dibagi ${ruus}, tetapi keduanya sama-sama bisa dibagi ${fpb} `
          .concat(kalimat`(${istilah('tawafuq', 'tawafuq')}), jadi yang disimpan ${ruus} ÷ ${fpb} = ${hasil}.`)
        : kalimat`${siapa} mendapat ${saham} bagian untuk ${untuk}. ${saham} tidak bisa dibagi ${ruus} dan keduanya tidak punya faktor bersama `
          .concat(kalimat`(${istilah('tabayun', 'tabayun')}), jadi angka ${ruus} disimpan.`), langkah.refs));
  }
  for (const langkah of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'juzSahm')) {
    daftarBaris.push(buatBaris(ceritaArba(langkah, kalimat`Angka yang disimpan, ${langkah.a} dan ${langkah.b}, digabung`), langkah.refs));
  }
  const [tashih] = konteks.daftarLangkah('TASHIH');
  daftarBaris.push(tashih
    ? buatBaris(kalimat`Semua bagian dikalikan ${tashih.juzSahm} (${istilah('juz-as-sahm', "juz' as-sahm")}): ${tashih.dasar} × ${tashih.juzSahm} = ${tashih.hasil} bagian.`, tashih.refs)
    : buatBaris(kalimat`Semua kelompok bisa dibagi rata, jadi tidak perlu pembulatan.`, ['R10-2']));
  return { judul: 'Membulatkan bagian per orang', daftarBaris, kolom: 'tashih' };
}

// ─── Langkah: hasil ───────────────────────────────────────────────────────────

function babHasil(konteks: Konteks): Bab {
  const { tabel, pembulatan } = konteks.hasil;
  const penyebut = konteks.penyebutAkhir;
  const daftarBaris = [tekankan(buatBaris(kalimat`Harta dibagi menjadi ${penyebut} bagian:`), 'subjudul')];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang)) {
      const siapa = konteks.sebutan.sebut([id]);
      daftarBaris.push(buatBaris(saham === 0n
        ? kalimat`${siapa}: tidak mendapat bagian karena sisa harta sudah habis.`
        : kalimat`${siapa}: ${saham} bagian (${saham}/${penyebut})${konteks.tampilkanNominal ? ` = ${rupiah(nominal)}` : ''}.`, ['R11-1'], [id]));
    }
  }
  const { sisaKeluar } = konteks.hasil;
  if (sisaKeluar) {
    daftarBaris.push(tekankan(buatBaris(kalimat`Sisa: ${sisaKeluar.saham} bagian (${sisaKeluar.saham}/${penyebut})${konteks.tampilkanNominal ? ` = ${rupiah(sisaKeluar.nominal)}` : ''}, `
      .concat(kalimat`${sisaKeluar.tujuan === 'dzawilArham' ? 'untuk dzawil arham' : 'untuk dzawil arham bila ada, bila tidak ke baitul mal'}.`), konteks.daftarLangkah('SISA_KELUAR')[0]?.refs ?? []), 'perhatian'));
  }
  if (konteks.tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    const perSatuan = pembulatan.satuan > 1n;
    daftarBaris.push(tekankan(buatBaris([
      ...kalimat`Karena setiap bagian dibulatkan ke bawah${perSatuan ? ` per ${rupiah(pembulatan.satuan)}` : ' ke rupiah'}, ada selisih ${rupiah(pembulatan.sisaPembulatan)} yang belum dibagikan. `,
      ...kalimat`Uang ini tetap milik para ahli waris dan perlu disepakati bersama penyalurannya.`,
      ...(perSatuan ? kalimat` Jika dibagikan lewat transfer bank, pembulatan bisa per rupiah sehingga selisihnya lebih kecil.` : []),
    ]), 'perhatian'));
  }
  return { judul: 'Hasil akhir', daftarBaris, kolom: 'nominal' };
}

