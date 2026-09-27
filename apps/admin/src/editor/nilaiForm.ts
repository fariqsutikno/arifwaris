// Konversi murni isi konten ↔ NilaiForm (nilai tiap bidang FORM_KONTEN). Menerima isi yang sudah sah (bacaIsi) atau
// nilai form dari layar; memutuskan bentuk tiap bidang (Markdown lewat tulisBlok/bacaBlok & tulisPotongan/bacaPotongan,
// angka dari teks, kosong → hapus/null). Isi asal dipakai sebagai dasar supaya field tanpa bidang (mis. urutan materi)
// tidak hilang. Hasil akhir SELALU lewat bacaIsi (Zod); galat dikembalikan per jalur bidang, tidak dilempar.
import {
  bacaBlok, bacaIsi, bacaPotongan, keJson, tulisBlok, tulisPotongan,
  type BarisAhwal, type Blok, type ContohKasus, type IsiKonten, type JenisKonten, type Potongan,
} from '@waris/content';
import { FORM_KONTEN, ISI_AWAL, type Bidang } from './formulir';

export interface NilaiPilihanKuis { daftar: string[]; benar: number }
export type NilaiBidang = string | boolean | NilaiPilihanKuis | ContohKasus | BarisAhwal[];

export interface NilaiForm {
  /** Isi asal dalam bentuk JSON (bigint = string digit); field tanpa bidang diambil dari sini. */
  dasar: Record<string, unknown>;
  nilai: Record<string, NilaiBidang>;
  /** Sakelar bagian objek opsional, kunci = `objekOpsional` (mis. `ar`). */
  aktif: Record<string, boolean>;
}

export type HasilForm<J extends JenisKonten> =
  | { ok: true; isi: IsiKonten[J] }
  | { ok: false; galat: string; galatBidang: Record<string, string> };

type Objek = Record<string, unknown>;

export function keNilaiForm<J extends JenisKonten>(jenis: J, isi: IsiKonten[J]): NilaiForm {
  const dasar = keJson(jenis, isi) as Objek;
  const nilai: Record<string, NilaiBidang> = {};
  const aktif: Record<string, boolean> = {};
  for (const bagian of FORM_KONTEN[jenis]) {
    if (bagian.objekOpsional) aktif[bagian.objekOpsional] = ambil(isi, bagian.objekOpsional) !== undefined;
    for (const bidang of bagian.bidang) {
      nilai[bidang.jalur] = bidang.jenis === 'pilihanKuis'
        ? { daftar: (ambil(isi, bidang.jalur) as Potongan[][]).map(tulisPotongan), benar: ambil(isi, 'indeksBenar') as number }
        : keNilaiBidang(bidang, ambil(isi, bidang.jalur));
    }
  }
  return { dasar, nilai, aktif };
}

export function nilaiFormKosong(jenis: JenisKonten): NilaiForm {
  const dasar = structuredClone(ISI_AWAL[jenis] ?? {});
  const nilai: Record<string, NilaiBidang> = {};
  const aktif: Record<string, boolean> = {};
  for (const bagian of FORM_KONTEN[jenis]) {
    if (bagian.objekOpsional) aktif[bagian.objekOpsional] = false;
    for (const bidang of bagian.bidang) nilai[bidang.jalur] = nilaiAwal(bidang, dasar);
  }
  return { dasar, nilai, aktif };
}

export function dariNilaiForm<J extends JenisKonten>(jenis: J, slug: string, form: NilaiForm): HasilForm<J> {
  const hasil = structuredClone(form.dasar);
  const galatBidang: Record<string, string> = {};
  for (const bagian of FORM_KONTEN[jenis]) {
    if (bagian.objekOpsional) {
      if (!form.aktif[bagian.objekOpsional]) { delete hasil[bagian.objekOpsional]; continue; }
      if (typeof hasil[bagian.objekOpsional] !== 'object' || hasil[bagian.objekOpsional] === null) hasil[bagian.objekOpsional] = {};
    }
    for (const bidang of bagian.bidang) {
      try {
        tulisBidang(hasil, bidang, form.nilai[bidang.jalur], slug);
      } catch (e) {
        galatBidang[bidang.jalur] = pesanGalat(e);
      }
    }
  }
  if (Object.keys(galatBidang).length > 0) {
    return { ok: false, galat: 'Ada bidang yang belum benar.', galatBidang };
  }
  // keJson mengubah bigint (bacaBlok kasus, editor kasus) jadi string digit seperti di database.
  const sah = bacaIsi(jenis, keJson(jenis, hasil as unknown as IsiKonten[J]));
  if (sah.ok) return sah;
  return { ok: false, ...petakanGalat(jenis, sah.galat) };
}

/** Galat bacaIsi ("jalur: pesan; ...") → galat per bidang (awalan jalur terpanjang) + sisanya di galat umum. */
export function petakanGalat(jenis: JenisKonten, galat: string): { galat: string; galatBidang: Record<string, string> } {
  const daftarJalur = FORM_KONTEN[jenis].flatMap(bagian => bagian.bidang.map(bidang => bidang.jalur))
    .sort((a, b) => b.length - a.length);
  const galatBidang: Record<string, string> = {};
  const sisa: string[] = [];
  for (const isu of galat.split('; ')) {
    const [jalurIsu = '', ...pesan] = isu.split(': ');
    const cocok = daftarJalur.find(jalur => jalurIsu === jalur || jalurIsu.startsWith(`${jalur}.`));
    if (cocok) galatBidang[cocok] = galatBidang[cocok] ? `${galatBidang[cocok]}; ${pesan.join(': ')}` : pesan.join(': ');
    else sisa.push(isu);
  }
  return { galat: sisa.length > 0 ? sisa.join('; ') : 'Ada bidang yang belum benar.', galatBidang };
}

// --- helper ---

/** Semua jenis bidang kecuali pilihanKuis (butuh indeksBenar dari induk, ditangani keNilaiForm). */
function keNilaiBidang(bidang: Bidang, nilai: unknown): NilaiBidang {
  switch (bidang.jenis) {
    case 'centang': return nilai === true;
    case 'angka': return typeof nilai === 'number' ? String(nilai) : '';
    case 'markdownBlok': return Array.isArray(nilai) ? tulisBlok(nilai as Blok[]) : '';
    case 'markdownPotongan': return Array.isArray(nilai) ? tulisPotongan(nilai as Potongan[]) : '';
    case 'kasus': return nilai as ContohKasus;
    case 'barisAhwal': return (nilai as BarisAhwal[] | undefined) ?? [];
    default: return typeof nilai === 'string' ? nilai : '';
  }
}

function nilaiAwal(bidang: Bidang, dasar: Objek): NilaiBidang {
  const dariDasar = ambil(dasar, bidang.jalur);
  switch (bidang.jenis) {
    case 'centang': return dariDasar === true;
    case 'pilihanKuis': return { daftar: ['', ''], benar: 0 };
    case 'kasus': {
      const hasil = bacaIsi('soal_hitung', { kode: 'x', bab: 0, tingkat: 'dasar', judul: '', topik: '', sumber: '', kasus: dariDasar });
      if (!hasil.ok) throw new Error(`ISI_AWAL kasus tidak sah: ${hasil.galat}`);
      return hasil.isi.kasus;
    }
    case 'barisAhwal': return [];
    default: return typeof dariDasar === 'string' ? dariDasar : '';
  }
}

function tulisBidang(hasil: Objek, bidang: Bidang, nilai: NilaiBidang | undefined, slug: string): void {
  switch (bidang.jenis) {
    case 'centang': return pasang(hasil, bidang.jalur, nilai === true);
    case 'angka': {
      const teks = String(nilai ?? '').trim();
      if (!/^-?\d+$/.test(teks)) throw new Error('harus bilangan bulat');
      return pasang(hasil, bidang.jalur, Number(teks));
    }
    case 'markdownBlok': {
      const teks = String(nilai ?? '');
      if (bidang.opsional && teks.trim() === '') return hapus(hasil, bidang.jalur);
      return pasang(hasil, bidang.jalur, bacaBlok(slug, teks));
    }
    case 'markdownPotongan': return pasang(hasil, bidang.jalur, bacaPotongan(String(nilai ?? '').trim()));
    case 'pilihanKuis': {
      const { daftar, benar } = nilai as NilaiPilihanKuis;
      pasang(hasil, bidang.jalur, daftar.map(teks => bacaPotongan(teks.trim())));
      return pasang(hasil, 'indeksBenar', benar);
    }
    case 'kasus': case 'barisAhwal': return pasang(hasil, bidang.jalur, nilai);
    default: {
      const teks = String(nilai ?? '');
      if (teks.trim() === '' && bidang.kosongJadiNull) return pasang(hasil, bidang.jalur, null);
      if (teks.trim() === '' && bidang.opsional) return hapus(hasil, bidang.jalur);
      return pasang(hasil, bidang.jalur, bidang.jenis === 'tautan' ? teks.trim() : teks);
    }
  }
}

function ambil(objek: unknown, jalur: string): unknown {
  return jalur.split('.').reduce<unknown>((kini, kunci) => (kini as Objek | undefined)?.[kunci], objek);
}

function pasang(objek: Objek, jalur: string, nilai: unknown): void {
  const kunci = jalur.split('.');
  const induk = kunci.slice(0, -1).reduce<Objek>((kini, k) => (kini[k] ??= {}) as Objek, objek);
  induk[kunci.at(-1)!] = nilai;
}

function hapus(objek: Objek, jalur: string): void {
  const kunci = jalur.split('.');
  const induk = ambil(objek, kunci.slice(0, -1).join('.')) ?? objek;
  if (kunci.length === 1) delete objek[kunci[0]!];
  else if (typeof induk === 'object' && induk !== null) delete (induk as Objek)[kunci.at(-1)!];
}

const pesanGalat = (e: unknown) => (e instanceof Error ? e.message : String(e));
