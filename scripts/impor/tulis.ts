// scripts/impor/tulis.ts
// Menulis baris impor & diksi lewat repository (sebagai admin). Keputusan 2026-09-26 "terbit + antrean": revisi 1
// disetujui apa adanya supaya web tidak berubah; bila draf, revisi 2 identik (materi: perluCek false) diajukan sebagai
// antrean review. Idempoten: entri/kunci yang sudah punya revisi terbit dilewati.
import type { RepositoriDiksi, RepositoriEditorial, RepositoriKonten } from '@waris/data';
import type { ButirDiksi } from '../diksi/rencana';
import type { BarisImpor } from './kumpul';
export type { BarisImpor } from './kumpul';

interface Repo { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi }

export async function tulisKeRepositori(repo: Repo, baris: BarisImpor[], diksi: ButirDiksi[]) {
  const sudahKonten = new Set((await repo.konten.bacaTerbit()).map(b => `${b.jenis}/${b.slug}`));
  const sudahDiksi = new Set((await repo.diksi.bacaTerbit()).map(d => d.kunci));
  let dibuat = 0;
  for (const b of baris) {
    if (sudahKonten.has(`${b.jenis}/${b.slug}`)) continue;
    await imporKonten(repo.editorial, b);
    dibuat++;
  }
  for (const butir of diksi) {
    if (sudahDiksi.has(butir.kunci)) continue;
    await imporDiksi(repo.diksi, butir);
    dibuat++;
  }
  return { dibuat, dilewati: baris.length + diksi.length - dibuat };
}

async function imporKonten(editorial: RepositoriEditorial, b: BarisImpor) {
  const entriId = await editorial.buatEntri(b.jenis, b.slug, b.urutan);
  const terbit = await editorial.buatDraf(entriId, b.jenis, b.isi, b.refs);
  await editorial.ajukan(terbit);
  await editorial.setujui(terbit);
  if (!b.perluCek) return;
  const isiReview = b.jenis === 'materi' ? { ...b.isi, perluCek: false } : b.isi;
  await editorial.ajukan(await editorial.buatDraf(entriId, b.jenis, isiReview, b.refs));
}

async function imporDiksi(diksi: RepositoriDiksi, butir: ButirDiksi) {
  await diksi.buatKunci(butir.kunci, butir.halaman);
  const terbit = await diksi.buatDraf(butir.kunci, butir.id, butir.ar, null);
  await diksi.ajukan(terbit);
  await diksi.setujui(terbit);
  // Terjemahan Arab kamus masih draf (PERLU_CEK_KAMUS): diajukan ulang untuk dicek tim keilmuan.
  if (butir.ar) await diksi.ajukan(await diksi.buatDraf(butir.kunci, butir.id, butir.ar, 'impor: terjemahan Arab perlu dicek'));
}
