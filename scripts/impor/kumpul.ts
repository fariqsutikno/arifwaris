// scripts/impor/kumpul.ts
// Sekali jalan: berkas konten lama (docs/*.md lewat parser packages/content, konten/*.ts web, kamus Arab) → baris impor
// per (jenis, slug). Memutuskan slug, urutan, refs (dari isi + refs-manual.json; tidak pernah dikarang), dan status draf.
// Menyerahkan baris + daftar galat (Zod, ref kosong/tak dikenal, konsistensi KB) ke main.ts; ada galat = tidak menulis apa pun.
import {
  DAFTAR_FAQ, DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, DAFTAR_SYAHID, DAFTAR_TANYA_JAWAB,
  GLOSARIUM, JENIS_FIKIH, SUMBER_KITAB, ambilRefs, bacaIsi, cariRujukan, keJson, periksaKonsistensi, slug,
  type IsiKonten, type JenisKonten,
} from '@waris/content';
import { AHWAL, LANGKAH_SELANJUTNYA } from '../../apps/web/src/konten/ahwal';
import { KAMUS_ARAB } from '../../apps/web/src/konten/kamusArab';
import type { PetaDiksi } from '../diksi/rencana';

export interface BarisImpor { jenis: JenisKonten; slug: string; urutan: number; isi: IsiKonten[JenisKonten]; refs: string[]; perluCek: boolean }

/** Bukan klaim fikih dan tidak ditandai draf di berkas asalnya. */
const BUKAN_DRAF: JenisKonten[] = ['modul', 'kitab', 'cheatsheet'];
const URUTAN_PER_MODUL = 100;
/** Dari Belajar.tsx (DAFTAR_CHEATSHEET); tautan Google Drive diisi lewat portal. */
const CHEATSHEET = ['Tabel furudh & ahli waris', 'Peta hajb', "Ashl, 'aul & radd", 'Langkah menghitung'];

export const kunciRefsManual = (jenis: JenisKonten, slugEntri: string) => `${jenis}/${slugEntri}`;

export function kumpulkanKontenLama(peta: PetaDiksi, refsManual: Record<string, string[]>) {
  const mentah = barisMentah(peta);
  const baris = mentah.map(({ jenis, slug: slugEntri, urutan, isi }): BarisImpor => ({
    jenis, slug: slugEntri, urutan, isi,
    refs: [...new Set([...ambilRefs(isi), ...(refsManual[kunciRefsManual(jenis, slugEntri)] ?? [])])].sort(),
    perluCek: !BUKAN_DRAF.includes(jenis),
  }));
  return { baris, galat: periksa(baris) };
}

function periksa(baris: BarisImpor[]): string[] {
  const galat = baris.flatMap(b => {
    const kunci = kunciRefsManual(b.jenis, b.slug);
    const zod = bacaIsi(b.jenis, keJson(b.jenis, b.isi));
    return [
      ...(zod.ok ? [] : [`${kunci}: ${zod.galat}`]),
      ...(JENIS_FIKIH.includes(b.jenis) && b.refs.length === 0 ? [`${kunci}: jenis fikih tanpa ref, isi di refs-manual.json`] : []),
      ...b.refs.filter(kode => !cariRujukan(kode)).map(kode => `${kunci}: ref ${kode} tidak ada di KB`),
    ];
  });
  const kunci = baris.map(b => kunciRefsManual(b.jenis, b.slug));
  const ganda = kunci.filter((k, i) => kunci.indexOf(k) !== i).map(k => `${k}: slug ganda`);
  return [...galat, ...ganda, ...periksaKonsistensi(baris)];
}

type Mentah = Omit<BarisImpor, 'refs' | 'perluCek'>;

function barisMentah(peta: PetaDiksi): Mentah[] {
  const ar = (teks: string) => KAMUS_ARAB[teks];
  return [
    ...DAFTAR_MODUL.map(isi => ({ jenis: 'modul' as const, slug: String(isi.nomor), urutan: isi.nomor, isi })),
    ...DAFTAR_PELAJARAN.map(isi => ({ jenis: 'materi' as const, slug: isi.slug, urutan: isi.modul * URUTAN_PER_MODUL + isi.urutan, isi })),
    ...DAFTAR_SOAL_KUIS.map((isi, i) => ({ jenis: 'soal_kuis' as const, slug: isi.kode, urutan: i, isi })),
    ...DAFTAR_SOAL_HITUNG.map((isi, i) => ({ jenis: 'soal_hitung' as const, slug: isi.kode, urutan: i, isi })),
    ...DAFTAR_TANYA_JAWAB.map((isi, i) => ({ jenis: 'tanya_jawab' as const, slug: isi.slug, urutan: i, isi })),
    ...DAFTAR_FAQ.map((isi, i) => ({ jenis: 'faq' as const, slug: isi.id, urutan: i, isi })),
    ...SUMBER_KITAB.map((isi, i) => ({ jenis: 'kitab' as const, slug: slug(isi.judul), urutan: i, isi })),
    ...DAFTAR_SYAHID.map((isi, i) => ({ jenis: 'syahid' as const, slug: slug(`${isi.surah} ${isi.ayat} ${isi.hukum}`), urutan: i, isi })),
    ...GLOSARIUM.filter(entri => entri.ar).map((entri, i) => ({
      jenis: 'glosarium_ar' as const, slug: entri.id, urutan: i, isi: { istilahId: entri.istilah, ...entri.ar! },
    })),
    ...Object.entries(AHWAL).map(([kunci, daftar], i) => ({
      jenis: 'ahwal' as const, slug: kunci, urutan: i,
      isi: { kunci, baris: daftar!.map(b => ({ ...b, ...(ar(b.syarat) || ar(b.bagian) ? { ar: { bagian: ar(b.bagian) ?? b.bagian, syarat: ar(b.syarat) ?? b.syarat } } : {}) })) },
    })),
    ...peta.edukasi.map((butir, i) => ({
      jenis: 'teks_edukasi' as const, slug: butir.slug, urutan: i, isi: { id: butir.id, ...(butir.ar ? { ar: butir.ar } : {}) },
    })),
    ...LANGKAH_SELANJUTNYA.flatMap((langkah, i) => (['judul', 'isi'] as const).map(bagian => ({
      jenis: 'teks_edukasi' as const, slug: `selanjutnya.langkah_${i + 1}_${bagian}`, urutan: peta.edukasi.length + i * 2,
      isi: { id: langkah[bagian], ...(ar(langkah[bagian]) ? { ar: ar(langkah[bagian])! } : {}) },
    }))),
    ...CHEATSHEET.map((judul, i) => ({
      jenis: 'cheatsheet' as const, slug: slug(judul), urutan: i, isi: { judul, ...(ar(judul) ? { judulAr: ar(judul)! } : {}), deskripsi: '', tautan: null },
    })),
  ];
}
