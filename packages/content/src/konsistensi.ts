// packages/content/src/konsistensi.ts
// Pemeriksa konten ↔ KB yang tidak bisa dijaga Zod: ref ada di KB, istilah ada di glosarium bab 15, kuis yang disisipkan
// di materi ada di bank kuis, syahid persis ada di teks ayat, kitab ada di bab 17.2, dan terjemahan glosarium menunjuk
// istilah KB. Dipakai skrip impor, tes snapshot web, dan portal sebelum menyimpan. Mengembalikan daftar pesan, tidak melempar.
import { cariIstilah, GLOSARIUM } from './glossary.js';
import type { Pelajaran } from './materi.js';
import { cariRujukan, DAFTAR_AYAT, DAFTAR_KITAB, JUDUL_BAB } from './refs.js';
import type { JenisKonten } from './skema.js';
import type { Syahid, SumberKitab } from './pustaka.js';

export interface BarisKonten { jenis: JenisKonten; slug: string; isi: unknown }

const POLA_REF = /\bR\d{2}-\d+\b/g;

export function ambilRefs(isi: unknown): string[] {
  const kode = new Set<string>();
  jelajahi(isi, nilai => {
    if (typeof nilai === 'string') for (const cocok of nilai.matchAll(POLA_REF)) kode.add(cocok[0]);
    else if (adalahObjek(nilai) && nilai.jenis === 'rujukan' && typeof nilai.kode === 'string') kode.add(nilai.kode);
  });
  return [...kode].sort();
}

export function periksaKonsistensi(daftar: BarisKonten[]): string[] {
  const kodeKuis = new Set(daftar.filter(baris => baris.jenis === 'soal_kuis').map(baris => (baris.isi as { kode: string }).kode));
  return daftar.flatMap(baris => periksaSatu(baris, kodeKuis).map(pesan => `${baris.jenis}/${baris.slug}: ${pesan}`));
}

function periksaSatu({ jenis, isi }: BarisKonten, kodeKuis: Set<string>): string[] {
  const galat = periksaPotongan(isi);
  if (jenis === 'materi') galat.push(...periksaKuisDiMateri(isi as Pelajaran, kodeKuis));
  if ((jenis === 'soal_kuis' || jenis === 'soal_hitung') && !JUDUL_BAB[(isi as { bab: number }).bab]) galat.push(`bab ${(isi as { bab: number }).bab} tidak ada di KB`);
  if (jenis === 'syahid') galat.push(...periksaSyahid(isi as Syahid));
  if (jenis === 'kitab' && !DAFTAR_KITAB.some(kitab => kitab.judul === (isi as SumberKitab).judul)) galat.push(`kitab "${(isi as SumberKitab).judul}" tidak ada di bab 17.2`);
  if (jenis === 'glosarium_ar' && !GLOSARIUM.some(entri => entri.istilah === (isi as { istilahId: string }).istilahId)) {
    galat.push(`istilah "${(isi as { istilahId: string }).istilahId}" tidak ada di KB bab 15`);
  }
  return galat;
}

/** [R..] di teks dan potongan rujukan harus ada di KB; potongan istilah harus ada di glosarium. */
function periksaPotongan(isi: unknown): string[] {
  const galat = ambilRefs(isi).filter(kode => !cariRujukan(kode)).map(kode => `ref ${kode} tidak ada di KB`);
  jelajahi(isi, nilai => {
    if (adalahObjek(nilai) && nilai.jenis === 'istilah' && typeof nilai.id === 'string' && !cariIstilah(nilai.id)) {
      galat.push(`istilah ${nilai.id} tidak ada di glosarium`);
    }
  });
  return galat;
}

function periksaKuisDiMateri(pelajaran: Pelajaran, kodeKuis: Set<string>): string[] {
  return pelajaran.blok.flatMap(blok => (blok.jenis === 'kuis' ? blok.daftarKode : []))
    .filter(kode => !kodeKuis.has(kode)).map(kode => `kuis ${kode} tidak ada di bank kuis`);
}

function periksaSyahid(syahid: Syahid): string[] {
  const ayat = DAFTAR_AYAT.find(ayatIni => ayatIni.surah === syahid.surah && ayatIni.ayat === syahid.ayat);
  return ayat?.teks.includes(syahid.syahid) ? [] : [`syahid tidak ada persis di ${syahid.surah} ${syahid.ayat} (KB bab 1.2)`];
}

const adalahObjek = (nilai: unknown): nilai is Record<string, unknown> => typeof nilai === 'object' && nilai !== null;

function jelajahi(nilai: unknown, kunjungi: (nilai: unknown) => void): void {
  kunjungi(nilai);
  if (Array.isArray(nilai)) nilai.forEach(anak => jelajahi(anak, kunjungi));
  else if (adalahObjek(nilai)) Object.values(nilai).forEach(anak => jelajahi(anak, kunjungi));
}
