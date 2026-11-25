// Pemeriksa berkas materi kiriman (docs/materi-kit/format-materi.md), bagian yang tidak butuh engine: sintaks, kepala
// berkas, glosarium, rujukan KB, tautan antarbagian, soal, dan gaya bahasa. Angka contoh diperiksa terpisah oleh
// periksaAngkaMateri (@waris/latihan). Dipakai CLI `pnpm materi:cek` dan (nanti) pemeriksa sebaris di portal.
import { cariIstilah } from './glossary.js';
import { bacaPelajaranBerbaris, nomorBagian, semuaPotongan, type Blok, type Pelajaran, type Potongan, type SimpulPeta } from './materi.js';
import { cariRujukan } from './refs.js';

export interface Temuan { tingkat: 'galat' | 'peringatan'; baris: number; pesan: string }

export interface KonteksPeriksa {
  /** Slug yang sah untuk prasyarat, singgung, dan tautan (kerangka kurikulum + pelajaran yang sudah ada). */
  slugDikenal: ReadonlySet<string>;
  /** Nomor bagian pelajaran lain yang berkasnya tersedia; pelajaran yang belum ditulis tidak dicek bagiannya. */
  bagianPelajaran: ReadonlyMap<string, ReadonlySet<string>>;
}

export type HasilPeriksa =
  | { terbaca: true; pelajaran: Pelajaran; barisBlok: number[]; temuan: Temuan[] }
  | { terbaca: false; temuan: Temuan[] };

const JUDUL_PENUTUP = ['Cek pemahaman', 'Ringkasnya'] as const;
const KATA_TIDAK_BAKU = ['nggak', 'gak', 'banget', 'aja', 'kayak', 'karna', 'praktek', 'bro', 'udah', 'gimana'];
const PENGANTAR_DIBUAT_BUAT = ['coba bayangkan', 'pernahkah kamu', 'mari kita menyelami'];
const KATA_KALIMAT_MAKS = 35;
const KATA_PER_MENIT = 180;
// Blok interaktif menambah waktu di luar jumlah kata, jadi hanya selisih besar yang diperingatkan.
const SELISIH_DURASI_RASIO = 0.5;
const POLA_EMOJI = /\p{Extended_Pictographic}/u;

export function periksaMateri(teks: string, namaBerkas: string, konteks: KonteksPeriksa): HasilPeriksa {
  let dibaca: ReturnType<typeof bacaPelajaranBerbaris>;
  try {
    dibaca = bacaPelajaranBerbaris(teks, namaBerkas);
  } catch (galat) {
    const pesan = (galat as Error).message;
    const [, baris = '1', isi = pesan] = /^[^:]+:(\d+): (.*)$/s.exec(pesan) ?? [];
    return { terbaca: false, temuan: [{ tingkat: 'galat', baris: Number(baris), pesan: isi }] };
  }
  const { pelajaran, barisBlok } = dibaca;
  const temuan: Temuan[] = [];
  const galat = (baris: number, pesan: string) => temuan.push({ tingkat: 'galat', baris, pesan });
  const peringatan = (baris: number, pesan: string) => temuan.push({ tingkat: 'peringatan', baris, pesan });

  periksaKepala(pelajaran, namaBerkas, konteks, galat);
  periksaSusunan(pelajaran.blok, barisBlok, galat);
  periksaPotongan(pelajaran, barisBlok, konteks, galat);
  periksaRujukanBlok(pelajaran.blok, barisBlok, galat);
  periksaTeksMentah(teks, galat, peringatan);
  periksaGaya(pelajaran, barisBlok, peringatan);
  return { terbaca: true, pelajaran, barisBlok, temuan };
}

/** Kode soal yang dipakai lebih dari sekali di seluruh berkas yang diperiksa. */
export function kodeSoalGanda(daftar: { namaBerkas: string; pelajaran: Pelajaran }[]): { kode: string; berkas: string[] }[] {
  const pemakai = new Map<string, string[]>();
  for (const { namaBerkas, pelajaran } of daftar) {
    for (const blok of pelajaran.blok) if (blok.jenis === 'soal') pemakai.set(blok.soal.kode, [...(pemakai.get(blok.soal.kode) ?? []), namaBerkas]);
  }
  return [...pemakai].filter(([, berkas]) => berkas.length > 1).map(([kode, berkas]) => ({ kode, berkas }));
}

type Lapor = (baris: number, pesan: string) => void;

function periksaKepala(pelajaran: Pelajaran, namaBerkas: string, konteks: KonteksPeriksa, galat: Lapor) {
  const namaDasar = namaBerkas.split('/').at(-1)!.replace(/\.md$/, '');
  if (namaDasar !== pelajaran.slug) galat(1, `slug "${pelajaran.slug}" tidak sama dengan nama berkas "${namaDasar}"`);
  if (!pelajaran.slug.startsWith(`${pelajaran.modul}-${pelajaran.urutan}-`)) galat(1, `slug harus diawali "${pelajaran.modul}-${pelajaran.urutan}-" sesuai modul dan urutan`);
  for (const slug of [...pelajaran.prasyarat ?? [], ...pelajaran.singgung ?? []]) {
    if (!konteks.slugDikenal.has(slug)) galat(1, `pelajaran "${slug}" tidak ada di kerangka kurikulum`);
  }
}

function periksaSusunan(blok: Blok[], barisBlok: number[], galat: Lapor) {
  if (blok[0]?.jenis !== 'alur') galat(barisBlok[0] ?? 1, 'blok alur wajib menjadi blok pertama');
  blok.forEach((isi, i) => { if (i > 0 && isi.jenis === 'alur') galat(barisBlok[i]!, 'blok alur hanya boleh sekali'); });
  const bagianUtama = nomorBagian(blok).filter(bagian => bagian.tingkat === 2);
  const duaTerakhir = bagianUtama.slice(-2).map(bagian => teksPolos(bagian.judul));
  if (duaTerakhir[0] !== JUDUL_PENUTUP[0] || duaTerakhir[1] !== JUDUL_PENUTUP[1]) {
    galat(barisBlok.at(-1) ?? 1, `dua bagian terakhir harus "## ${JUDUL_PENUTUP[0]}" lalu "## ${JUDUL_PENUTUP[1]}"`);
  }
}

function periksaPotongan(pelajaran: Pelajaran, barisBlok: number[], konteks: KonteksPeriksa, galat: Lapor) {
  const bagianSendiri = new Set(nomorBagian(pelajaran.blok).map(bagian => bagian.nomor));
  pelajaran.blok.forEach((blok, i) => {
    const baris = barisBlok[i]!;
    for (const potongan of semuaPotongan([blok])) periksaSatuPotongan(potongan, baris, bagianSendiri, konteks, galat);
    if (blok.jenis === 'peta') periksaTujuanPeta(blok.akar, baris, bagianSendiri, galat);
  });
}

function periksaSatuPotongan(potongan: Potongan, baris: number, bagianSendiri: ReadonlySet<string>, konteks: KonteksPeriksa, galat: Lapor) {
  switch (potongan.jenis) {
    case 'istilah':
      if (!cariIstilah(potongan.id)) galat(baris, `istilah [[${potongan.id}]] tidak ada di glosarium; tulis *miring* dan catat di LAPORAN.md`);
      return;
    case 'rujukan':
      galat(baris, `kode rujukan [${potongan.kode}] tidak boleh di teks; pakai blok dasar`);
      return;
    case 'tautanBagian':
      if (!bagianSendiri.has(potongan.bagian)) galat(baris, `bagian #${potongan.bagian} tidak ada di pelajaran ini`);
      return;
    case 'tautanPelajaran': {
      if (!konteks.slugDikenal.has(potongan.slug)) { galat(baris, `pelajaran "${potongan.slug}" tidak ada di kerangka kurikulum`); return; }
      const bagianLain = konteks.bagianPelajaran.get(potongan.slug);
      if (potongan.bagian && bagianLain && !bagianLain.has(potongan.bagian)) galat(baris, `bagian #${potongan.bagian} tidak ada di pelajaran ${potongan.slug}`);
      return;
    }
    default:
  }
}

function periksaTujuanPeta(simpul: SimpulPeta, baris: number, bagianSendiri: ReadonlySet<string>, galat: Lapor) {
  if (simpul.tujuan && !bagianSendiri.has(simpul.tujuan)) galat(baris, `peta menunjuk bagian #${simpul.tujuan} yang tidak ada`);
  for (const anak of simpul.anak) periksaTujuanPeta(anak, baris, bagianSendiri, galat);
}

function periksaRujukanBlok(blok: Blok[], barisBlok: number[], galat: Lapor) {
  blok.forEach((isi, i) => {
    const daftarKode = isi.jenis === 'dasar' || isi.jenis === 'soal' ? isi.rujukan : [];
    for (const kode of daftarKode) if (!cariRujukan(kode)) galat(barisBlok[i]!, `kode rujukan ${kode} tidak ada di tabel "Dasar dan Rujukan" KB`);
    if (isi.jenis === 'lipat') periksaRujukanBlok(isi.blok, isi.blok.map(() => barisBlok[i]!), galat);
  });
}

/** Hal yang paling mudah dilihat di teks mentah: HTML, tautan web, emoji, tanda pisah panjang. */
function periksaTeksMentah(teks: string, galat: Lapor, peringatan: Lapor) {
  let dalamVideo = false;
  teks.split('\n').forEach((baris, i) => {
    const nomor = i + 1;
    if (baris.startsWith('```')) { dalamVideo = baris.trim() === '```video'; return; }
    if (dalamVideo) return;
    if (/<\/?[a-z][^>]*>/i.test(baris)) galat(nomor, 'HTML tidak boleh dipakai');
    if (/\]\(|https?:\/\//.test(baris)) galat(nomor, 'tautan web tidak boleh dipakai (kecuali di blok video)');
    if (POLA_EMOJI.test(baris)) galat(nomor, 'emoji tidak boleh dipakai');
    if (baris.includes('—')) peringatan(nomor, 'tanda pisah panjang (—) tidak dipakai; ganti dengan koma atau pecah kalimatnya');
  });
}

function periksaGaya(pelajaran: Pelajaran, barisBlok: number[], peringatan: Lapor) {
  let jumlahKata = 0;
  pelajaran.blok.forEach((blok, i) => {
    const teks = teksPolos(semuaPotongan([blok]));
    jumlahKata += hitungKata(teks);
    const baris = barisBlok[i]!;
    const kecil = teks.toLowerCase();
    for (const kata of KATA_TIDAK_BAKU) if (new RegExp(`\\b${kata}\\b`).test(kecil)) peringatan(baris, `kata tidak baku "${kata}"`);
    for (const frasa of PENGANTAR_DIBUAT_BUAT) if (kecil.includes(frasa)) peringatan(baris, `pengantar terasa dibuat-buat: "${frasa}"`);
    if (blok.jenis !== 'paragraf') return;
    for (const kalimat of teks.split(/(?<=[.?!])\s+/)) {
      if (hitungKata(kalimat) > KATA_KALIMAT_MAKS) peringatan(baris, `kalimat lebih dari ${KATA_KALIMAT_MAKS} kata: "${kalimat.slice(0, 50)}..."`);
    }
  });
  const perkiraan = Math.round(jumlahKata / KATA_PER_MENIT);
  if (pelajaran.durasi && Math.abs(pelajaran.durasi - perkiraan) > perkiraan * SELISIH_DURASI_RASIO) {
    peringatan(1, `durasi ${pelajaran.durasi} menit jauh dari perkiraan ${perkiraan} menit (${jumlahKata} kata)`);
  }
}

const hitungKata = (teks: string) => teks.split(/\s+/).filter(Boolean).length;

function teksPolos(daftar: Potongan[]): string {
  return daftar.map(potongan => {
    switch (potongan.jenis) {
      case 'teks': case 'tebal': case 'miring': case 'istilah': return potongan.teks;
      case 'tautanPelajaran': case 'tautanBagian': return potongan.teks ?? '';
      case 'rujukan': return '';
    }
  }).join('');
}
