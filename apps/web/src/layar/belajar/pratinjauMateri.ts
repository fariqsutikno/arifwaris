// Pratinjau berkas materi kiriman di aplikasi lokal (hanya mode dev): #/belajar/pratinjau-<slug> membaca
// docs/materi-kit/contoh/*.md dan konten/materi/**/*.md lewat bacaPelajaran, tanpa lewat database.
// Di build produksi daftar berkasnya kosong, jadi tidak ada materi draf yang ikut terkirim.
import { bacaPelajaran, type Pelajaran } from '@waris/content';

const AWALAN = 'pratinjau-';

const berkas: Record<string, string> = import.meta.env.DEV
  ? import.meta.glob(['../../../../../docs/materi-kit/contoh/*.md', '../../../../../konten/materi/**/*.md'], { query: '?raw', import: 'default', eager: true })
  : {};

export function pelajaranPratinjau(slug: string): Pelajaran | undefined {
  if (!slug.startsWith(AWALAN)) return undefined;
  const dicari = slug.slice(AWALAN.length);
  const jalur = Object.keys(berkas).find(nama => nama.endsWith(`/${dicari}.md`));
  return jalur ? bacaPelajaran(berkas[jalur]!, dicari) : undefined;
}
