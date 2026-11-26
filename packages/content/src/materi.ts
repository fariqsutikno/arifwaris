// Tipe & parser Markdown terbatas materi (isinya konten jenis materi/modul di database). Portal menyunting blok sebagai
// Markdown lalu menyimpannya sebagai Blok[] lewat bacaBlok; tulisBlok adalah kebalikannya. Sintaks lengkapnya hanya
// ada di docs/materi-kit/format-materi.md (sumber tunggal); berkas ini mengikutinya:
//   bacaPelajaran → kepala berkas (---) + bacaBlok; bacaBlok → blok Markdown biasa dan blok berpagar (```nama),
//   tiap blok berpagar diurai satu fungsi baca<Nama>. Galat selalu "slug:baris: pesan".

export type Potongan =
  | { jenis: 'teks'; teks: string }
  | { jenis: 'tebal'; teks: string }
  | { jenis: 'miring'; teks: string }
  | { jenis: 'istilah'; id: string; teks: string }
  | { jenis: 'rujukan'; kode: string }
  /** [[>slug]], [[>slug#2b|teks]] */
  | { jenis: 'tautanPelajaran'; slug: string; bagian?: string; teks?: string }
  /** [[#2b]], [[#2b|teks]] */
  | { jenis: 'tautanBagian'; bagian: string; teks?: string };

export interface ContohKasus {
  pewaris: 'L' | 'P';
  /** Kunci ahli waris (ISTRI, ANAK_LK, ...), satu entri per orang. */
  ahliWaris: string[];
  harta: bigint;
  /** Jumlah saham per kunci dan ashl akhir; hanya untuk test, supaya angka di teks pelajaran tidak menyimpang dari engine. */
  harapan: { saham: Record<string, bigint>; ashlAkhir: bigint };
}

/** Tahap alur pembagian (pipeline engine bab 00.2); urutan array = urutan tampil. */
export const TAHAP_ALUR = ['harta', 'ahli-waris', 'penghalang', 'hajb', 'bagian', 'ashl', 'aul-radd', 'tashih', 'nominal', 'semua', 'lanjutan'] as const;
export type TahapAlur = typeof TAHAP_ALUR[number];

export const TAMPIL_PERAGA = ['kotak', 'kotak-tabel', 'aul'] as const;
export type TampilPeraga = typeof TAMPIL_PERAGA[number];

/** Isi satu sel blok bandingan: "1/6", "sisa", "1/6 + sisa", "1/3 sisa", "gugur". */
export interface NilaiBagian { pecahan?: [bigint, bigint]; sisa?: true; sepertigaSisa?: true; gugur?: true }

export interface SimpulPeta { judul: string; keterangan?: string; tujuan?: string; anak: SimpulPeta[] }

export interface KeadaanPeraga { label: string; pewaris: 'L' | 'P'; ahliWaris: string[]; penjelasan: Potongan[] }

/** Soal sebaris di pelajaran; bentuknya sama dengan soal kuis di bank supaya bisa diimpor apa adanya. */
export interface SoalMateri {
  kode: string;
  bab: number;
  tingkat: 'dasar' | 'menengah' | 'sulit';
  pertanyaan: Potongan[];
  pilihan: Potongan[][];
  indeksBenar: number;
  pembahasan: Potongan[];
  alasanPilihan: Potongan[][];
}

export type Blok =
  | { jenis: 'judul'; tingkat: 2 | 3; isi: Potongan[] }
  | { jenis: 'paragraf'; isi: Potongan[] }
  | { jenis: 'daftar'; berurut: boolean; butir: Potongan[][] }
  | { jenis: 'catatan'; isi: Potongan[] }
  | { jenis: 'tabel'; kepala: Potongan[][]; baris: Potongan[][][] }
  | { jenis: 'kasus'; kasus: ContohKasus; judul?: string; cerita?: Potongan[]; keterangan?: Record<string, Potongan[]> }
  | { jenis: 'kasusBerkas'; berkas: string; judul?: string; cerita?: Potongan[] }
  | { jenis: 'video'; idYoutube: string; judul: string }
  /** Video yang belum dibuat: tidak tampil di aplikasi, hanya di pratinjau portal. */
  | { jenis: 'videoMenyusul'; rencana: string }
  | { jenis: 'kuis'; daftarKode: string[] }
  | { jenis: 'alur'; tahap: TahapAlur; tanya: Potongan[]; bekal?: Potongan[]; hasil: Potongan[] }
  | { jenis: 'caraBerpikir'; judul?: string; langkah: { tanya: Potongan[]; akibat: Potongan[] }[] }
  | { jenis: 'peraga'; judul?: string; pengantar?: Potongan[]; tampil: TampilPeraga; keadaan: KeadaanPeraga[] }
  | { jenis: 'bandingan'; judul?: string; kolom: string[]; baris: { nama: string; nilai: NilaiBagian[] }[]; catatan?: Potongan[] }
  | { jenis: 'simulasi'; judul?: string; pewaris: 'L' | 'P'; pilihan: string[]; awal: string[]; tampil: 'status' | 'bagian' }
  | { jenis: 'peta'; akar: SimpulPeta }
  | { jenis: 'ingat'; judul?: string; butir: { kunci: string; penjelasan: Potongan[] }[]; penutup?: Potongan[] }
  | { jenis: 'dasar'; isi: Potongan[]; rujukan: string[] }
  | { jenis: 'tebak'; tanya: Potongan[]; jawab: Potongan[] }
  | { jenis: 'lipat'; judul: string; blok: Blok[] }
  | { jenis: 'matriks'; kolom: string[]; baris: { label: string; sel: Potongan[][] }[] }
  | { jenis: 'soal'; soal: SoalMateri; rujukan: string[] };

/** Versi Arab satu artikel. Tanpa `blok` = isi masih Indonesia. */
export interface VersiArab { judul: string; tujuan: string; blok?: Blok[] }

export interface Pelajaran {
  slug: string;
  judul: string;
  modul: number;
  urutan: number;
  tujuan: string;
  /** Kepala berkas format kiriman 2026-11; kosong pada materi lama. */
  durasi?: number;
  tahap?: TahapAlur;
  prasyarat?: string[];
  singgung?: string[];
  perluCek: boolean;
  blok: Blok[];
  ar?: VersiArab;
}

export interface Modul { nomor: number; judul: string; ringkas: string; ar?: { judul: string; ringkas: string } }

// ─── Kepala berkas ────────────────────────────────────────────────────────────

/** Satu berkas materi (kepala --- lalu isi) → Pelajaran. */
export function bacaPelajaran(teks: string, namaBerkas = 'materi'): Pelajaran {
  return bacaPelajaranBerbaris(teks, namaBerkas).pelajaran;
}

/** Seperti bacaPelajaran, ditambah nomor baris awal tiap blok (untuk pesan pemeriksa). */
export function bacaPelajaranBerbaris(teks: string, namaBerkas = 'materi'): { pelajaran: Pelajaran; barisBlok: number[] } {
  const daftarBaris = teks.replace(/\r\n/g, '\n').split('\n');
  const galat = (nomor: number, pesan: string) => new Error(`${namaBerkas}:${nomor}: ${pesan}`);
  if (daftarBaris[0]?.trim() !== '---') throw galat(1, 'berkas harus diawali kepala "---"');
  const akhir = daftarBaris.indexOf('---', 1);
  if (akhir < 0) throw galat(1, 'kepala berkas tidak ditutup "---"');
  const kepala = new Map<string, string>();
  daftarBaris.slice(1, akhir).forEach((baris, i) => {
    if (baris.trim() === '') return;
    const isian = pisahIsian(baris);
    if (!isian) throw galat(i + 2, `baris kepala "${baris}" bukan "kunci: nilai"`);
    kepala.set(isian.kunci, isian.nilai);
  });
  const wajib = (kunci: string) => {
    const nilai = kepala.get(kunci);
    if (!nilai) throw galat(1, `kepala berkas butuh "${kunci}"`);
    return nilai;
  };
  const angkaWajib = (kunci: string) => {
    const nilai = Number(wajib(kunci));
    if (!Number.isInteger(nilai) || nilai < 1) throw galat(1, `"${kunci}" harus angka bulat`);
    return nilai;
  };
  const slug = wajib('slug');
  const tahap = wajib('tahap');
  if (!adalahTahap(tahap)) throw galat(1, `tahap "${tahap}" tidak dikenal (pilihan: ${TAHAP_ALUR.join(', ')})`);
  const daftarSlug = (kunci: string) => (kepala.get(kunci) ?? '').split(',').map(isi => isi.trim()).filter(Boolean);
  const { blok, barisBlok } = bacaBlokBerbaris(slug, daftarBaris.slice(akhir + 1).join('\n'), akhir + 2);
  return {
    pelajaran: {
      slug, judul: wajib('judul'), modul: angkaWajib('modul'), urutan: angkaWajib('urutan'), tujuan: wajib('tujuan'),
      durasi: angkaWajib('durasi'), tahap, prasyarat: daftarSlug('prasyarat'), singgung: daftarSlug('singgung'),
      perluCek: false, blok,
    },
    barisBlok,
  };
}

const adalahTahap = (teks: string): teks is TahapAlur => (TAHAP_ALUR as readonly string[]).includes(teks);

// ─── Blok ─────────────────────────────────────────────────────────────────────

export function bacaBlok(slug: string, isi: string): Blok[] {
  return bacaBlokBerbaris(slug, isi).blok;
}

interface Baris { teks: string; nomor: number }
type Galat = (nomor: number, pesan: string) => Error;

/** `barisAwal`: nomor baris pertama `isi` di berkas asal, supaya pesan galat menunjuk baris yang benar. */
export function bacaBlokBerbaris(slug: string, isi: string, barisAwal = 1): { blok: Blok[]; barisBlok: number[] } {
  const blok: Blok[] = [];
  const barisBlok: number[] = [];
  const daftarBaris = isi.split('\n');
  const galat: Galat = (nomor, pesan) => new Error(`${slug}:${nomor}: ${pesan}`);
  for (let indeks = 0; indeks < daftarBaris.length;) {
    const baris = daftarBaris[indeks]!;
    const nomor = indeks + barisAwal;
    const ambilSelama = (syarat: (teks: string) => boolean) => {
      const diambil: string[] = [];
      while (indeks < daftarBaris.length && syarat(daftarBaris[indeks]!)) diambil.push(daftarBaris[indeks++]!);
      return diambil;
    };
    if (baris.trim() === '') { indeks++; continue; }
    barisBlok.push(nomor);
    const pagar = /^```([a-z-]+)\s*$/.exec(baris);
    if (pagar) {
      indeks++;
      const awalIsi = indeks + barisAwal;
      const isiPagar = ambilSelama(teks => !teks.startsWith('```')).map((teks, i) => ({ teks, nomor: awalIsi + i }));
      if (indeks >= daftarBaris.length) throw galat(nomor, `blok ${pagar[1]} tidak ditutup \`\`\``);
      indeks++;
      blok.push(bacaBlokBerpagar(slug, pagar[1]!, isiPagar, nomor, galat));
    } else if (baris.startsWith('```')) {
      throw galat(nomor, 'pagar blok harus "```nama" tanpa teks lain');
    } else if (/^#{2,3} /.test(baris)) {
      const tingkat = baris.startsWith('### ') ? 3 : 2;
      blok.push({ jenis: 'judul', tingkat, isi: bacaPotongan(baris.slice(tingkat + 1)) });
      indeks++;
    } else if (baris.startsWith('> ')) {
      blok.push({ jenis: 'catatan', isi: bacaPotongan(ambilSelama(teks => teks.startsWith('> ')).map(teks => teks.slice(2)).join(' ')) });
    } else if (baris.startsWith('|')) {
      const [kepala = '', , ...sisa] = ambilSelama(teks => teks.startsWith('|'));
      blok.push({ jenis: 'tabel', kepala: selTabel(kepala).map(bacaPotongan), baris: sisa.map(teks => selTabel(teks).map(bacaPotongan)) });
    } else if (/^(- |\d+\. )/.test(baris)) {
      const berurut = !baris.startsWith('- ');
      // Butir boleh bersambung ke baris berikutnya yang menjorok.
      const butir = ambilSelama(teks => /^(- |\d+\. )/.test(teks) || /^\s+\S/.test(teks))
        .reduce<string[]>((kumpulan, teks) => (/^\s/.test(teks) ? [...kumpulan.slice(0, -1), `${kumpulan.at(-1)} ${teks.trim()}`] : [...kumpulan, teks]), [])
        .map(teks => bacaPotongan(teks.replace(/^(- |\d+\. )/, '')));
      blok.push({ jenis: 'daftar', berurut, butir });
    } else {
      const paragraf = ambilSelama(teks => teks.trim() !== '' && !/^(#{2,3} |> |\||- |\d+\. |```)/.test(teks));
      blok.push({ jenis: 'paragraf', isi: bacaPotongan(paragraf.join(' ')) });
    }
  }
  return { blok, barisBlok };
}

function bacaBlokBerpagar(slug: string, nama: string, isi: Baris[], nomorPagar: number, galat: Galat): Blok {
  const terisi = isi.filter(baris => baris.teks.trim() !== '');
  switch (nama) {
    case 'kasus': return bacaKasusBlok(terisi, nomorPagar, galat);
    case 'kasus-berkas': return bacaKasusBerkas(terisi, nomorPagar, galat);
    case 'video': return bacaVideo(terisi, nomorPagar, galat);
    case 'kuis': return { jenis: 'kuis', daftarKode: terisi.map(baris => baris.teks).join(',').split(',').map(kode => kode.trim()).filter(Boolean) };
    case 'alur': return bacaAlur(terisi, nomorPagar, galat);
    case 'cara-berpikir': return bacaCaraBerpikir(terisi, nomorPagar, galat);
    case 'peraga': return bacaPeraga(terisi, nomorPagar, galat);
    case 'bandingan': return bacaBandingan(terisi, nomorPagar, galat);
    case 'simulasi': return bacaSimulasi(terisi, nomorPagar, galat);
    case 'peta': return bacaPeta(terisi, nomorPagar, galat);
    case 'ingat': return bacaIngat(terisi, nomorPagar, galat);
    case 'dasar': return bacaDasar(terisi, nomorPagar, galat);
    case 'tebak': return bacaTebak(terisi, nomorPagar, galat);
    case 'lipat': return bacaLipat(slug, isi, nomorPagar, galat);
    case 'matriks': return bacaMatriks(terisi, nomorPagar, galat);
    case 'soal': return bacaSoal(terisi, nomorPagar, galat);
    default: throw galat(nomorPagar, `blok "${nama}" tidak dikenal`);
  }
}

// ─── Teks sebaris ─────────────────────────────────────────────────────────────

const POLA_SEBARIS = /\*\*(.+?)\*\*|\*(.+?)\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[(R\d{2}-\d+)\]/g;

export function bacaPotongan(teks: string): Potongan[] {
  const hasil: Potongan[] = [];
  let posisi = 0;
  for (const cocok of teks.matchAll(POLA_SEBARIS)) {
    if (cocok.index > posisi) hasil.push({ jenis: 'teks', teks: teks.slice(posisi, cocok.index) });
    const [, tebal, miring, sasaran, teksTautan, kode] = cocok;
    if (tebal !== undefined) hasil.push({ jenis: 'tebal', teks: tebal });
    else if (miring !== undefined) hasil.push({ jenis: 'miring', teks: miring });
    else if (sasaran !== undefined) hasil.push(bacaTautan(sasaran.trim(), teksTautan?.trim()));
    else hasil.push({ jenis: 'rujukan', kode: kode! });
    posisi = cocok.index + cocok[0].length;
  }
  if (posisi < teks.length) hasil.push({ jenis: 'teks', teks: teks.slice(posisi) });
  return hasil;
}

/** Isi [[...]]: ">slug#bagian" = pelajaran lain, "#bagian" = bagian sendiri, selain itu id istilah glosarium. */
function bacaTautan(sasaran: string, teks: string | undefined): Potongan {
  const tambahTeks = teks === undefined ? {} : { teks };
  if (sasaran.startsWith('#')) return { jenis: 'tautanBagian', bagian: sasaran.slice(1), ...tambahTeks };
  if (sasaran.startsWith('>')) {
    const [slug = '', bagian] = sasaran.slice(1).split('#');
    return { jenis: 'tautanPelajaran', slug, ...(bagian ? { bagian } : {}), ...tambahTeks };
  }
  return { jenis: 'istilah', id: sasaran, teks: teks ?? sasaran };
}

/** Semua potongan di daftar blok; dipakai test dan pemeriksa untuk mengecek rujukan, istilah, dan tautan. */
export function semuaPotongan(daftarBlok: Blok[]): Potongan[] {
  return daftarBlok.flatMap((blok): Potongan[] => {
    switch (blok.jenis) {
      case 'judul': case 'paragraf': case 'catatan': return blok.isi;
      case 'daftar': return blok.butir.flat();
      case 'tabel': return [...blok.kepala, ...blok.baris.flat()].flat();
      case 'kasus': return [...(blok.cerita ?? []), ...Object.values(blok.keterangan ?? {}).flat()];
      case 'kasusBerkas': return blok.cerita ?? [];
      case 'alur': return [...blok.tanya, ...(blok.bekal ?? []), ...blok.hasil];
      case 'caraBerpikir': return blok.langkah.flatMap(langkah => [...langkah.tanya, ...langkah.akibat]);
      case 'peraga': return [...(blok.pengantar ?? []), ...blok.keadaan.flatMap(keadaan => keadaan.penjelasan)];
      case 'bandingan': return blok.catatan ?? [];
      case 'ingat': return [...blok.butir.flatMap(butir => butir.penjelasan), ...(blok.penutup ?? [])];
      case 'dasar': return blok.isi;
      case 'tebak': return [...blok.tanya, ...blok.jawab];
      case 'lipat': return semuaPotongan(blok.blok);
      case 'matriks': return blok.baris.flatMap(baris => baris.sel.flat());
      case 'soal': return [...blok.soal.pertanyaan, ...blok.soal.pilihan.flat(), ...blok.soal.alasanPilihan.flat(), ...blok.soal.pembahasan];
      case 'video': case 'videoMenyusul': case 'kuis': case 'simulasi': case 'peta': return [];
    }
  });
}

// ─── Nomor bagian ─────────────────────────────────────────────────────────────

export interface NomorBagian { indeksBlok: number; tingkat: 2 | 3; nomor: string; judul: Potongan[] }

/** `##` ke-n bernomor "n", `###` ke-m di bawahnya "n" + huruf ke-m (1a, 1b). Nomor ini juga jangkar tautan [[#2b]].
 *  Satu-satunya tempat penomoran: dipakai renderer, rel "Di halaman ini", dan pemeriksa tautan. */
export function nomorBagian(daftarBlok: Blok[]): NomorBagian[] {
  let bagian = 0;
  let subBagian = 0;
  return daftarBlok.flatMap((blok, indeksBlok): NomorBagian[] => {
    if (blok.jenis !== 'judul') return [];
    if (blok.tingkat === 2) { bagian++; subBagian = 0; return [{ indeksBlok, tingkat: 2, nomor: String(bagian), judul: blok.isi }]; }
    subBagian++;
    return [{ indeksBlok, tingkat: 3, nomor: `${bagian}${String.fromCharCode(96 + subBagian)}`, judul: blok.isi }];
  });
}

// ─── Pembantu isian blok ─────────────────────────────────────────────────────

// Kunci isian selalu huruf kecil (bisa berspasi: "ahli waris"); baris data seperti "Suami | 1/2" atau
// "Apakah ...? -> ..." diawali huruf kapital sehingga tidak tertukar dengan isian.
function pisahIsian(teks: string): { kunci: string; nilai: string } | undefined {
  const cocok = /^([a-z][a-z ]*):\s?(.*)$/.exec(teks.trim());
  return cocok ? { kunci: cocok[1]!, nilai: cocok[2]!.trim() } : undefined;
}

/** Isian yang boleh muncul sekali; galat bila kunci tak dikenal atau berulang. Baris non-isian dikembalikan apa adanya. */
function kumpulkanIsian(daftar: Baris[], kunciDikenal: readonly string[], namaBlok: string, galat: Galat) {
  const isian = new Map<string, string>();
  const lain: Baris[] = [];
  for (const baris of daftar) {
    const terpisah = pisahIsian(baris.teks);
    if (!terpisah || !kunciDikenal.includes(terpisah.kunci)) { lain.push(baris); continue; }
    if (isian.has(terpisah.kunci)) throw galat(baris.nomor, `blok ${namaBlok}: "${terpisah.kunci}" ditulis dua kali`);
    isian.set(terpisah.kunci, terpisah.nilai);
  }
  return { isian, lain };
}

function tolakSisa(lain: Baris[], namaBlok: string, galat: Galat) {
  if (lain[0]) throw galat(lain[0].nomor, `blok ${namaBlok}: baris "${lain[0].teks.trim()}" tidak dikenal`);
}

function wajibIsi(isian: Map<string, string>, kunci: string, namaBlok: string, nomor: number, galat: Galat): string {
  const nilai = isian.get(kunci);
  if (!nilai) throw galat(nomor, `blok ${namaBlok} butuh "${kunci}"`);
  return nilai;
}

const potonganBila = (nilai: string | undefined) => (nilai ? bacaPotongan(nilai) : undefined);
const daftarKoma = (teks: string) => teks.split(',').map(isi => isi.trim()).filter(Boolean);

function bacaPewaris(nilai: string | undefined, namaBlok: string, nomor: number, galat: Galat): 'L' | 'P' {
  if (nilai !== 'L' && nilai !== 'P') throw galat(nomor, `blok ${namaBlok} butuh "pewaris: L" atau "pewaris: P"`);
  return nilai;
}

// `|` di dalam [[tautan|teks]] bukan pemisah.
const PEMISAH_PIPA = /\|(?![^[]*\]\])/;
const selTabel = (baris: string) => baris.split(new RegExp(PEMISAH_PIPA, 'g')).slice(1, -1).map(isi => isi.trim());
const pisahPipa = (baris: string) => baris.split(new RegExp(PEMISAH_PIPA, 'g')).map(isi => isi.trim());

// ─── Blok berpagar, satu fungsi per blok ─────────────────────────────────────

/** ```kasus: pewaris, ahli waris, harta, harapan; opsional judul, cerita, keterangan (berulang: "KUNCI teks"). */
function bacaKasusBlok(daftar: Baris[], nomor: number, galat: Galat): Extract<Blok, { jenis: 'kasus' }> {
  const { isian, lain } = kumpulkanIsian(daftar, ['judul', 'cerita', 'pewaris', 'ahli waris', 'harta', 'harapan'], 'kasus', galat);
  const keterangan: Record<string, Potongan[]> = {};
  for (const baris of lain) {
    const terpisah = pisahIsian(baris.teks);
    if (terpisah?.kunci !== 'keterangan') throw galat(baris.nomor, `blok kasus: baris "${baris.teks.trim()}" tidak dikenal`);
    const [, kunci, teks] = /^([A-Z_]+)\s+(.+)$/.exec(terpisah.nilai) ?? [];
    if (!kunci) throw galat(baris.nomor, 'blok kasus: keterangan harus "KUNCI teks"');
    if (keterangan[kunci]) throw galat(baris.nomor, `blok kasus: keterangan ${kunci} ditulis dua kali`);
    keterangan[kunci] = bacaPotongan(teks!);
  }
  const galatKasus = (pesan: string) => galat(nomor, `blok kasus ${pesan}`);
  const pewaris = bacaPewaris(isian.get('pewaris'), 'kasus', nomor, galat);
  if (!isian.get('ahli waris') || !isian.get('harta') || !isian.get('harapan')) throw galatKasus('butuh "ahli waris", "harta", dan "harapan"');
  const judul = isian.get('judul');
  const cerita = potonganBila(isian.get('cerita'));
  return {
    jenis: 'kasus',
    kasus: {
      pewaris, ahliWaris: bacaDaftarAhliWaris(isian.get('ahli waris')!, galatKasus),
      harta: BigInt(isian.get('harta')!.replace(/\D/g, '')), harapan: bacaHarapan(isian.get('harapan')!, galatKasus),
    },
    ...(judul ? { judul } : {}), ...(cerita ? { cerita } : {}),
    ...(Object.keys(keterangan).length ? { keterangan } : {}),
  };
}

function bacaKasusBerkas(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['judul', 'cerita', 'berkas', 'harapan'], 'kasus-berkas', galat);
  tolakSisa(lain, 'kasus-berkas', galat);
  const berkas = wajibIsi(isian, 'berkas', 'kasus-berkas', nomor, galat);
  if (!/^[\w.-]+\.waris\.json$/.test(berkas)) throw galat(nomor, 'blok kasus-berkas: berkas harus bernama "<nama>.waris.json"');
  const judul = isian.get('judul');
  const cerita = potonganBila(isian.get('cerita'));
  return { jenis: 'kasusBerkas', berkas, ...(judul ? { judul } : {}), ...(cerita ? { cerita } : {}) };
}

/** ```video: tautan YouTube + "judul:", atau "menyusul: rencana" bila videonya belum ada. */
function bacaVideo(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const menyusul = daftar.map(baris => pisahIsian(baris.teks)).find(isian => isian?.kunci === 'menyusul');
  if (menyusul) return { jenis: 'videoMenyusul', rencana: menyusul.nilai };
  const tautan = daftar.find(baris => /^https?:\/\//.test(baris.teks.trim()))?.teks.trim() ?? '';
  const idYoutube = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(tautan)?.[1];
  if (!idYoutube) throw galat(nomor, 'blok video butuh tautan YouTube atau "menyusul:"');
  const judul = daftar.find(baris => baris.teks.startsWith('judul:'))?.teks.slice('judul:'.length).trim() ?? 'Video';
  return { jenis: 'video', idYoutube, judul };
}

function bacaAlur(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['tahap', 'tanya', 'bekal', 'hasil'], 'alur', galat);
  tolakSisa(lain, 'alur', galat);
  const tahap = wajibIsi(isian, 'tahap', 'alur', nomor, galat);
  if (!adalahTahap(tahap)) throw galat(nomor, `blok alur: tahap "${tahap}" tidak dikenal`);
  const bekal = potonganBila(isian.get('bekal'));
  return {
    jenis: 'alur', tahap, tanya: bacaPotongan(wajibIsi(isian, 'tanya', 'alur', nomor, galat)),
    ...(bekal ? { bekal } : {}), hasil: bacaPotongan(wajibIsi(isian, 'hasil', 'alur', nomor, galat)),
  };
}

function bacaCaraBerpikir(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['judul'], 'cara-berpikir', galat);
  const langkah = lain.map(baris => {
    const [tanya, akibat, lebih] = baris.teks.split(' -> ');
    if (!tanya?.trim() || !akibat?.trim() || lebih !== undefined) throw galat(baris.nomor, 'blok cara-berpikir: tiap baris harus "pertanyaan -> akibat"');
    return { tanya: bacaPotongan(tanya.trim()), akibat: bacaPotongan(akibat.trim()) };
  });
  if (langkah.length < 2) throw galat(nomor, 'blok cara-berpikir butuh minimal 2 baris');
  const judul = isian.get('judul');
  return { jenis: 'caraBerpikir', ...(judul ? { judul } : {}), langkah };
}

const KEADAAN_PERAGA = { min: 1, maks: 4, minBanding: 2 } as const;

/** ```peraga: isian blok, lalu kelompok berulang "keadaan:" + "ahli waris:" + "penjelasan:" (+ "pewaris:" penimpa). */
function bacaPeraga(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const indeksKeadaanPertama = daftar.findIndex(baris => pisahIsian(baris.teks)?.kunci === 'keadaan');
  const kepala = indeksKeadaanPertama < 0 ? daftar : daftar.slice(0, indeksKeadaanPertama);
  const { isian, lain } = kumpulkanIsian(kepala, ['judul', 'pengantar', 'pewaris', 'tampil'], 'peraga', galat);
  tolakSisa(lain, 'peraga', galat);
  const tampil = wajibIsi(isian, 'tampil', 'peraga', nomor, galat);
  if (!(TAMPIL_PERAGA as readonly string[]).includes(tampil)) throw galat(nomor, `blok peraga: tampil "${tampil}" tidak dikenal (pilihan: ${TAMPIL_PERAGA.join(', ')})`);
  const pewarisBlok = isian.get('pewaris');
  const keadaan: KeadaanPeraga[] = [];
  let terbuka: { baris: Baris; isian: Map<string, string> } | undefined;
  const tutup = () => {
    if (!terbuka) return;
    const { baris, isian: isianKeadaan } = terbuka;
    const galatKeadaan = (pesan: string) => galat(baris.nomor, `blok peraga ${pesan}`);
    keadaan.push({
      label: isianKeadaan.get('keadaan')!,
      pewaris: bacaPewaris(isianKeadaan.get('pewaris') ?? pewarisBlok, 'peraga', baris.nomor, galat),
      ahliWaris: bacaDaftarAhliWaris(wajibIsi(isianKeadaan, 'ahli waris', 'peraga', baris.nomor, galat), galatKeadaan),
      penjelasan: bacaPotongan(wajibIsi(isianKeadaan, 'penjelasan', 'peraga', baris.nomor, galat)),
    });
  };
  for (const baris of indeksKeadaanPertama < 0 ? [] : daftar.slice(indeksKeadaanPertama)) {
    const terpisah = pisahIsian(baris.teks);
    if (!terpisah || !['keadaan', 'ahli waris', 'penjelasan', 'pewaris'].includes(terpisah.kunci)) throw galat(baris.nomor, `blok peraga: baris "${baris.teks.trim()}" tidak dikenal`);
    if (terpisah.kunci === 'keadaan') { tutup(); terbuka = { baris, isian: new Map([['keadaan', terpisah.nilai]]) }; continue; }
    if (terbuka!.isian.has(terpisah.kunci)) throw galat(baris.nomor, `blok peraga: "${terpisah.kunci}" ditulis dua kali dalam satu keadaan`);
    terbuka!.isian.set(terpisah.kunci, terpisah.nilai);
  }
  tutup();
  const minimal = tampil === 'aul' ? KEADAAN_PERAGA.min : KEADAAN_PERAGA.minBanding;
  if (keadaan.length < minimal || keadaan.length > KEADAAN_PERAGA.maks) throw galat(nomor, `blok peraga butuh ${minimal}–${KEADAAN_PERAGA.maks} keadaan`);
  const judul = isian.get('judul');
  const pengantar = potonganBila(isian.get('pengantar'));
  return { jenis: 'peraga', ...(judul ? { judul } : {}), ...(pengantar ? { pengantar } : {}), tampil: tampil as TampilPeraga, keadaan };
}

function bacaBandingan(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['judul', 'kolom', 'catatan'], 'bandingan', galat);
  const kolom = pisahPipa(wajibIsi(isian, 'kolom', 'bandingan', nomor, galat));
  const baris = lain.map(barisIni => {
    const [nama = '', ...sel] = pisahPipa(barisIni.teks);
    if (sel.length !== kolom.length) throw galat(barisIni.nomor, `blok bandingan: baris "${nama}" butuh ${kolom.length} nilai`);
    return { nama, nilai: sel.map(teks => bacaNilaiBagian(teks, barisIni.nomor, galat)) };
  });
  if (!baris.length) throw galat(nomor, 'blok bandingan butuh minimal satu baris');
  const judul = isian.get('judul');
  const catatan = potonganBila(isian.get('catatan'));
  return { jenis: 'bandingan', ...(judul ? { judul } : {}), kolom, baris, ...(catatan ? { catatan } : {}) };
}

function bacaNilaiBagian(teks: string, nomor: number, galat: Galat): NilaiBagian {
  if (teks === 'sisa') return { sisa: true };
  if (teks === 'gugur') return { gugur: true };
  if (teks === '1/3 sisa') return { sepertigaSisa: true };
  const [, pembilang, penyebut, tambahSisa] = /^(\d+)\/(\d+)( \+ sisa)?$/.exec(teks) ?? [];
  if (!pembilang || BigInt(penyebut!) === 0n) throw galat(nomor, `blok bandingan: nilai "${teks}" bukan pecahan, sisa, "a/b + sisa", "1/3 sisa", atau gugur`);
  return { pecahan: [BigInt(pembilang), BigInt(penyebut!)], ...(tambahSisa ? { sisa: true as const } : {}) };
}

const PILIHAN_SIMULASI_MAKS = 10;

function bacaSimulasi(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['judul', 'pewaris', 'pilihan', 'awal', 'tampil'], 'simulasi', galat);
  tolakSisa(lain, 'simulasi', galat);
  const pilihan = daftarKoma(wajibIsi(isian, 'pilihan', 'simulasi', nomor, galat));
  if (pilihan.length > PILIHAN_SIMULASI_MAKS) throw galat(nomor, `blok simulasi: paling banyak ${PILIHAN_SIMULASI_MAKS} pilihan`);
  const awal = daftarKoma(isian.get('awal') ?? '');
  const diLuar = awal.find(kunci => !pilihan.includes(kunci));
  if (diLuar) throw galat(nomor, `blok simulasi: "${diLuar}" di awal tidak ada di pilihan`);
  const tampil = wajibIsi(isian, 'tampil', 'simulasi', nomor, galat);
  if (tampil !== 'status' && tampil !== 'bagian') throw galat(nomor, 'blok simulasi: tampil harus "status" atau "bagian"');
  const judul = isian.get('judul');
  return { jenis: 'simulasi', ...(judul ? { judul } : {}), pewaris: bacaPewaris(isian.get('pewaris'), 'simulasi', nomor, galat), pilihan, awal, tampil };
}

const BATAS_PETA = { kedalaman: 4, simpul: 12, jorok: 2 } as const;

function bacaPeta(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const tumpukan: { tingkat: number; simpul: SimpulPeta }[] = [];
  let akar: SimpulPeta | undefined;
  for (const baris of daftar) {
    const spasi = /^ */.exec(baris.teks)![0].length;
    if (spasi % BATAS_PETA.jorok) throw galat(baris.nomor, `blok peta: jorok harus kelipatan ${BATAS_PETA.jorok} spasi`);
    const tingkat = spasi / BATAS_PETA.jorok;
    const [isiSimpul = '', tujuan] = baris.teks.trim().split(' -> ');
    const [judul = '', keterangan] = pisahPipa(isiSimpul);
    const simpul: SimpulPeta = {
      judul, ...(keterangan ? { keterangan } : {}),
      ...(tujuan ? { tujuan: tujuan.trim().replace(/^#/, '') } : {}), anak: [],
    };
    if (tingkat >= BATAS_PETA.kedalaman) throw galat(baris.nomor, `blok peta: paling dalam ${BATAS_PETA.kedalaman} tingkat`);
    if (tingkat === 0) {
      if (akar) throw galat(baris.nomor, 'blok peta hanya boleh punya satu akar');
      akar = simpul;
    } else {
      while (tumpukan.length && tumpukan.at(-1)!.tingkat >= tingkat) tumpukan.pop();
      const induk = tumpukan.at(-1);
      if (!induk || induk.tingkat !== tingkat - 1) throw galat(baris.nomor, 'blok peta: jorok melompat lebih dari satu tingkat');
      induk.simpul.anak.push(simpul);
    }
    tumpukan.push({ tingkat, simpul });
  }
  if (!akar) throw galat(nomor, 'blok peta kosong');
  if (daftar.length > BATAS_PETA.simpul) throw galat(nomor, `blok peta: paling banyak ${BATAS_PETA.simpul} simpul`);
  return { jenis: 'peta', akar };
}

const BUTIR_INGAT = { min: 2, maks: 4 } as const;

function bacaIngat(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['judul', 'penutup'], 'ingat', galat);
  const butir = lain.map(baris => {
    if (!baris.teks.startsWith('- ')) throw galat(baris.nomor, 'blok ingat: butir harus "- kata kunci | penjelasan"');
    const [kunci = '', penjelasan] = pisahPipa(baris.teks.slice(2));
    if (!kunci || !penjelasan) throw galat(baris.nomor, 'blok ingat: butir harus "- kata kunci | penjelasan"');
    return { kunci, penjelasan: bacaPotongan(penjelasan) };
  });
  if (butir.length < BUTIR_INGAT.min || butir.length > BUTIR_INGAT.maks) throw galat(nomor, `blok ingat butuh ${BUTIR_INGAT.min}–${BUTIR_INGAT.maks} butir`);
  const judul = isian.get('judul');
  const penutup = potonganBila(isian.get('penutup'));
  return { jenis: 'ingat', ...(judul ? { judul } : {}), butir, ...(penutup ? { penutup } : {}) };
}

function bacaDasar(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const barisRujukan = daftar.filter(baris => baris.teks.startsWith('rujukan:'));
  if (barisRujukan.length !== 1) throw galat(nomor, 'blok dasar butuh tepat satu baris "rujukan:"');
  const isi = daftar.filter(baris => !baris.teks.startsWith('rujukan:')).map(baris => baris.teks.trim()).join(' ');
  if (!isi) throw galat(nomor, 'blok dasar butuh kalimat sumber');
  return { jenis: 'dasar', isi: bacaPotongan(isi), rujukan: bacaKodeRujukan(barisRujukan[0]!, galat) };
}

function bacaKodeRujukan(baris: Baris, galat: Galat): string[] {
  const kode = daftarKoma(baris.teks.slice('rujukan:'.length));
  const salah = kode.find(isi => !/^R\d{2}-\d+$/.test(isi));
  if (!kode.length || salah) throw galat(baris.nomor, `rujukan "${salah ?? ''}" bukan kode Rxx-y`);
  return kode;
}

function bacaTebak(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['tanya', 'jawab'], 'tebak', galat);
  tolakSisa(lain, 'tebak', galat);
  return {
    jenis: 'tebak', tanya: bacaPotongan(wajibIsi(isian, 'tanya', 'tebak', nomor, galat)),
    jawab: bacaPotongan(wajibIsi(isian, 'jawab', 'tebak', nomor, galat)),
  };
}

/** ```lipat: baris pertama "judul:", sisanya Markdown biasa (tanpa blok berpagar). Baris kosong dipertahankan. */
function bacaLipat(slug: string, isi: Baris[], nomor: number, galat: Galat): Blok {
  const indeksJudul = isi.findIndex(baris => baris.teks.trim() !== '');
  const judul = indeksJudul < 0 ? undefined : pisahIsian(isi[indeksJudul]!.teks);
  if (judul?.kunci !== 'judul' || !judul.nilai) throw galat(nomor, 'blok lipat: baris pertama harus "judul: ..."');
  const sisa = isi.slice(indeksJudul + 1);
  const pagar = sisa.find(baris => baris.teks.startsWith('```'));
  if (pagar) throw galat(pagar.nomor, 'blok lipat tidak boleh berisi blok berpagar');
  return { jenis: 'lipat', judul: judul.nilai, blok: sisa.length ? bacaBlokBerbaris(slug, sisa.map(baris => baris.teks).join('\n'), sisa[0]!.nomor).blok : [] };
}

function bacaMatriks(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['kolom'], 'matriks', galat);
  const kolom = pisahPipa(wajibIsi(isian, 'kolom', 'matriks', nomor, galat));
  const baris = lain.map(barisIni => {
    const [label = '', ...sel] = pisahPipa(barisIni.teks);
    if (sel.length !== kolom.length) throw galat(barisIni.nomor, `blok matriks: baris "${label}" butuh ${kolom.length} sel`);
    return { label, sel: sel.map(bacaPotongan) };
  });
  if (!baris.length) throw galat(nomor, 'blok matriks butuh minimal satu baris');
  return { jenis: 'matriks', kolom, baris };
}

const TINGKAT_SOAL = ['dasar', 'menengah', 'sulit'] as const;
const PILIHAN_SOAL = { min: 3, maks: 4 } as const;
export const POLA_KODE_SOAL_MATERI = /^K-\d+\.\d+-\d+$/;
/** Kode soal paket kiriman (docs/soal-kit): P-<modul>-<nomor>; bacaSoal menerima keduanya, paket memeriksa bentuk ketatnya. */
export const POLA_KODE_SOAL_PAKET = /^P-\d{2}-\d{3}$/;

function bacaSoal(daftar: Baris[], nomor: number, galat: Galat): Blok {
  const { isian, lain } = kumpulkanIsian(daftar, ['kode', 'tingkat', 'tanya', 'pembahasan', 'rujukan'], 'soal', galat);
  const kode = wajibIsi(isian, 'kode', 'soal', nomor, galat);
  if (!POLA_KODE_SOAL_MATERI.test(kode) && !POLA_KODE_SOAL_PAKET.test(kode)) throw galat(nomor, `blok soal: kode "${kode}" harus K-<modul>.<urutan>-<nomor> (materi) atau P-<modul>-<nomor> (paket soal)`);
  const tingkat = wajibIsi(isian, 'tingkat', 'soal', nomor, galat);
  if (!(TINGKAT_SOAL as readonly string[]).includes(tingkat)) throw galat(nomor, 'blok soal: tingkat harus dasar, menengah, atau sulit');
  const pilihan: Potongan[][] = [];
  const alasanPilihan: Potongan[][] = [];
  const indeksBenar: number[] = [];
  for (const baris of lain) {
    const tanda = baris.teks.slice(0, 2);
    if (tanda !== '- ' && tanda !== '* ') throw galat(baris.nomor, `blok soal: baris "${baris.teks.trim()}" tidak dikenal`);
    const [teksPilihan, alasan, lebih] = pisahPipa(baris.teks.slice(2));
    if (!teksPilihan || !alasan || lebih !== undefined) throw galat(baris.nomor, 'blok soal: pilihan harus "- pilihan | alasan"');
    if (tanda === '* ') indeksBenar.push(pilihan.length);
    pilihan.push(bacaPotongan(teksPilihan));
    alasanPilihan.push(bacaPotongan(alasan));
  }
  if (pilihan.length < PILIHAN_SOAL.min || pilihan.length > PILIHAN_SOAL.maks) throw galat(nomor, `blok soal ${kode} butuh ${PILIHAN_SOAL.min}–${PILIHAN_SOAL.maks} pilihan`);
  if (indeksBenar.length !== 1) throw galat(nomor, `blok soal ${kode} butuh tepat satu pilihan benar (*)`);
  const barisRujukan = daftar.find(baris => baris.teks.startsWith('rujukan:'));
  if (!barisRujukan) throw galat(nomor, `blok soal ${kode} butuh "rujukan"`);
  const rujukan = bacaKodeRujukan(barisRujukan, galat);
  return {
    jenis: 'soal', rujukan,
    soal: {
      kode, bab: Number(rujukan[0]!.slice(1, 3)), tingkat: tingkat as SoalMateri['tingkat'],
      pertanyaan: bacaPotongan(wajibIsi(isian, 'tanya', 'soal', nomor, galat)), pilihan, indeksBenar: indeksBenar[0]!,
      pembahasan: bacaPotongan(wajibIsi(isian, 'pembahasan', 'soal', nomor, galat)), alasanPilihan,
    },
  };
}

// ─── Dipakai juga oleh bank soal ─────────────────────────────────────────────

/** "ISTRI, 2 ANAK_PR" → ['ISTRI', 'ANAK_PR', 'ANAK_PR']. */
export function bacaDaftarAhliWaris(teks: string, galat: (pesan: string) => Error): string[] {
  return teks.split(',').flatMap(butir => {
    const [, jumlah = '1', kunci] = /^\s*(?:(\d+)\s+)?([A-Z_]+)\s*$/.exec(butir) ?? [];
    if (!kunci) throw galat(`ahli waris "${butir.trim()}" tidak terbaca`);
    return Array.from({ length: Number(jumlah) }, () => kunci);
  });
}

/** "ISTRI 3, ANAK_PR 16; ashl 24" → saham per kunci (hanya yang > 0) dan ashl akhir. */
export function bacaHarapan(teks: string, galat: (pesan: string) => Error): ContohKasus['harapan'] {
  const [bagianSaham = '', bagianAshl = ''] = teks.split(';');
  const saham = Object.fromEntries(bagianSaham.split(',').map(butir => {
    const [, kunci, nilai] = /^\s*([A-Z_]+)\s+(\d+)\s*$/.exec(butir) ?? [];
    if (!kunci) throw galat(`harapan "${butir.trim()}" tidak terbaca`);
    return [kunci, BigInt(nilai!)];
  }));
  const ashl = /^\s*ashl\s+(\d+)\s*$/.exec(bagianAshl);
  if (!ashl) throw galat('harapan harus diakhiri "; ashl N"');
  return { saham, ashlAkhir: BigInt(ashl[1]!) };
}
