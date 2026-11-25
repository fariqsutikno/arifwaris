// scripts/materi-impor/tulis.ts
// Menerima Pelajaran hasil pemeriksaan, menulisnya sebagai REVISI DRAF (tidak terbit; terbit lewat portal):
//   tiap pelajaran → konten 'materi'/<slug>, tiap blok `soal` → konten 'soal_kuis'/<kode> bertanda sumber 'materi:<slug>'.
// Isi yang sama dengan revisi terakhir dilewati, jadi impor ulang tidak menumpuk draf. Mode kering hanya menghitung.
import { ambilRefs, keJson, type IsiKonten, type JenisKonten, type Pelajaran, type SoalKuis } from '@waris/content';
import type { RepositoriEditorial, RepositoriKonten } from '@waris/data';

export interface RepoImpor { konten: RepositoriKonten; editorial: RepositoriEditorial }
export interface Rencana { jenis: JenisKonten; slug: string; urutan: number; isi: unknown; refs: string[] }
export interface HasilImpor { ditulis: Rencana[]; dilewati: Rencana[] }

// Urutan pelajaran mengikuti snapshot (modul*100 + urutan); soal ditaruh dekat pelajarannya.
const SKALA_MODUL = 100;
const SKALA_SOAL = 100;

export function susunRencana(daftarPelajaran: Pelajaran[]): Rencana[] {
  return daftarPelajaran.flatMap(pelajaran => {
    const urutan = pelajaran.modul * SKALA_MODUL + pelajaran.urutan;
    const materi: Rencana = { jenis: 'materi', slug: pelajaran.slug, urutan, isi: keJson('materi', pelajaran), refs: ambilRefs(keJson('materi', pelajaran)) };
    const soal = pelajaran.blok.flatMap(blok => (blok.jenis === 'soal' ? [blok] : [])).map((blok, indeks): Rencana => {
      const isi: SoalKuis = { ...blok.soal, sumber: `materi:${pelajaran.slug}` };
      const json = keJson('soal_kuis', isi);
      return { jenis: 'soal_kuis', slug: blok.soal.kode, urutan: urutan * SKALA_SOAL + indeks, isi: json, refs: [...new Set([...blok.rujukan, ...ambilRefs(json)])].sort() };
    });
    return [materi, ...soal];
  });
}

export async function imporMateri(repo: RepoImpor, daftarPelajaran: Pelajaran[], kering: boolean): Promise<HasilImpor> {
  const entriAda = new Map((await repo.konten.daftarEntri()).map(entri => [`${entri.jenis}/${entri.slug}`, entri]));
  const hasil: HasilImpor = { ditulis: [], dilewati: [] };
  for (const rencana of susunRencana(daftarPelajaran)) {
    const entri = entriAda.get(`${rencana.jenis}/${rencana.slug}`);
    const sama = entri?.revisiTerakhir && !entri.revisiTerakhir.diabaikan && stabil(entri.revisiTerakhir.isi) === stabil(rencana.isi);
    if (sama) { hasil.dilewati.push(rencana); continue; }
    hasil.ditulis.push(rencana);
    if (kering) continue;
    const entriId = entri?.entriId ?? await repo.editorial.buatEntri(rencana.jenis, rencana.slug, rencana.urutan);
    await repo.editorial.buatDraf(entriId, rencana.jenis, rencana.isi as IsiKonten[JenisKonten], rencana.refs);
  }
  return hasil;
}

/** JSON dengan kunci terurut: jsonb di Postgres tidak menjaga urutan kunci. */
function stabil(nilai: unknown): string {
  return JSON.stringify(nilai, (_kunci, isi) => (isi && typeof isi === 'object' && !Array.isArray(isi)
    ? Object.fromEntries(Object.entries(isi).sort(([a], [b]) => a.localeCompare(b))) : isi));
}
