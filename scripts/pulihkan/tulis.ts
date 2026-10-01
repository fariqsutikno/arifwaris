// scripts/pulihkan/tulis.ts
// Memulihkan database dari apps/web/src/snapshot.json: tiap baris konten & diksi terbit ditulis ulang lewat repository
// (sebagai admin) dan langsung disetujui, supaya database kosong (mis. proyek Supabase produksi yang belum pernah
// diimpor) berisi sama dengan yang tampil di web. Idempoten: jenis/slug dan kunci diksi yang sudah terbit dilewati.
// Antrean review lama (revisi kedua "perlu dicek") tidak ada di snapshot, jadi tidak ikut pulih.
import type { JenisKonten } from '@waris/content';
import type { RepositoriDiksi, RepositoriEditorial, RepositoriKonten } from '@waris/data';

export interface BarisSnapshot { jenis: string; slug: string; urutan: number; isi: unknown; refs: string[] }
export interface DiksiSnapshot { kunci: string; halaman: string; id: string; ar: string | null }
interface Repo { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi }

export async function pulihkanDariSnapshot(repo: Repo, snapshot: { konten: BarisSnapshot[]; diksi: DiksiSnapshot[] }) {
  const sudahKonten = new Set((await repo.konten.bacaTerbit()).map(b => `${b.jenis}/${b.slug}`));
  const semuaKunci = await repo.diksi.daftarKunci();
  const sudahDiksi = new Set(semuaKunci.filter(k => k.terbit).map(k => k.kunci));
  // Kunci yang sudah dibuat tapi belum terbit (jalan sebelumnya terputus sesudah buatKunci) dipakai ulang, bukan dibuat lagi.
  const kunciAda = new Set(semuaKunci.map(k => k.kunci));
  // Entri yang sudah dibuat tapi belum terbit (jalan sebelumnya gagal di buatDraf) dipakai ulang, bukan dibuat lagi.
  const entriAda = new Map((await repo.konten.daftarEntri()).map(e => [`${e.jenis}/${e.slug}`, e.entriId]));
  let dibuat = 0;
  for (const b of snapshot.konten) {
    if (sudahKonten.has(`${b.jenis}/${b.slug}`)) continue;
    const jenis = b.jenis as JenisKonten;
    const entriId = entriAda.get(`${b.jenis}/${b.slug}`) ?? await repo.editorial.buatEntri(jenis, b.slug, b.urutan);
    const revisi = await repo.editorial.buatDraf(entriId, jenis, b.isi as never, b.refs);
    await repo.editorial.ajukan(revisi);
    await repo.editorial.setujui(revisi);
    dibuat++;
  }
  for (const d of snapshot.diksi) {
    if (sudahDiksi.has(d.kunci)) continue;
    if (!kunciAda.has(d.kunci)) await repo.diksi.buatKunci(d.kunci, d.halaman);
    const revisi = await repo.diksi.buatDraf(d.kunci, d.id, d.ar, null);
    await repo.diksi.ajukan(revisi);
    await repo.diksi.setujui(revisi);
    dibuat++;
  }
  return { dibuat, dilewati: snapshot.konten.length + snapshot.diksi.length - dibuat };
}
