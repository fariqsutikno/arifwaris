// scripts/soal-impor/tulis.ts
// Menerima paket soal yang sudah lolos soal:cek, menulis tiap soal sebagai revisi 'diajukan' (masuk antrean review dua tahap):
//   tiap butir → konten 'soal_kuis'/<kode P-NN-NNN> bertanda sumber 'paket:<nama paket>'.
// Isi+rujukan yang sama dengan revisi terakhir dilewati; entri yang sedang direview dengan isi beda dilaporkan, tidak ditimpa.
import { ambilRefs, keJson, type IsiKonten, type PaketSoal, type SoalKuis } from '@waris/content';
import type { RepositoriEditorial, RepositoriKonten } from '@waris/data';

export interface RepoImpor { konten: RepositoriKonten; editorial: RepositoriEditorial }
export interface Rencana { slug: string; urutan: number; isi: unknown; refs: string[] }
export type Keputusan = 'baru' | 'ubah' | 'sama' | 'dilewati';
export interface HasilImpor { baru: Rencana[]; ubah: Rencana[]; sama: Rencana[]; dilewati: { rencana: Rencana; status: string }[] }

const JENIS = 'soal_kuis';
const SKALA_MODUL = 1000;
/** Status revisi yang sedang berada di tangan reviewer: isinya tidak boleh ditimpa impor. */
const STATUS_SEDANG_REVIEW = ['diajukan', 'diperiksa'];

export function susunRencana(daftarPaket: PaketSoal[]): Rencana[] {
  return daftarPaket.flatMap(paket => paket.butir.map((butir, indeks): Rencana => {
    const isi: SoalKuis = { ...butir.soal, sumber: `paket:${paket.paket}` };
    const json = keJson(JENIS, isi);
    // Urutan = modul, lalu nomor di kode (P-NN-NNN); indeks bila kode tak bernomor.
    const nomor = Number(/-(\d+)$/.exec(butir.soal.kode)?.[1] ?? indeks);
    return { slug: butir.soal.kode, urutan: paket.modul * SKALA_MODUL + nomor, isi: json, refs: [...new Set([...butir.rujukan, ...ambilRefs(json)])].sort() };
  }));
}

export interface RevisiTerakhir { status: string; diabaikan: boolean; isi: unknown; refs: string[] }

/** Keputusan murni untuk satu soal terhadap revisi terakhir entrinya (undefined = entri belum ada). */
export function putuskan(rencana: Rencana, terakhir: RevisiTerakhir | null | undefined): Keputusan {
  if (!terakhir) return 'baru';
  if (!terakhir.diabaikan && stabil({ isi: terakhir.isi, refs: [...terakhir.refs].sort() }) === stabil({ isi: rencana.isi, refs: rencana.refs })) return 'sama';
  if (!terakhir.diabaikan && STATUS_SEDANG_REVIEW.includes(terakhir.status)) return 'dilewati';
  return 'ubah';
}

export async function imporSoal(repo: RepoImpor, daftarPaket: PaketSoal[], kering: boolean): Promise<HasilImpor> {
  const entriAda = new Map((await repo.konten.daftarEntri(JENIS)).map(entri => [entri.slug, entri]));
  const hasil: HasilImpor = { baru: [], ubah: [], sama: [], dilewati: [] };
  for (const rencana of susunRencana(daftarPaket)) {
    const entri = entriAda.get(rencana.slug);
    const keputusan = putuskan(rencana, entri?.revisiTerakhir);
    if (keputusan === 'dilewati') { hasil.dilewati.push({ rencana, status: entri!.revisiTerakhir!.status }); continue; }
    hasil[keputusan].push(rencana);
    if (keputusan === 'sama' || kering) continue;
    const entriId = entri?.entriId ?? await repo.editorial.buatEntri(JENIS, rencana.slug, rencana.urutan);
    const revisiId = await repo.editorial.buatDraf(entriId, JENIS, rencana.isi as IsiKonten[typeof JENIS], rencana.refs);
    await repo.editorial.ajukan(revisiId);
  }
  return hasil;
}

/** JSON dengan kunci terurut: jsonb di Postgres tidak menjaga urutan kunci. */
function stabil(nilai: unknown): string {
  return JSON.stringify(nilai, (_kunci, isi) => (isi && typeof isi === 'object' && !Array.isArray(isi)
    ? Object.fromEntries(Object.entries(isi).sort(([a], [b]) => a.localeCompare(b))) : isi));
}
