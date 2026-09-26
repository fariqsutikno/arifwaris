// scripts/ekspor/susun.ts
// Konten terbit → (1) snapshot JSON yang dibawa web saat build dan jadi cadangan, (2) Markdown per jenis untuk lampiran TA.
// Urutan stabil supaya diff snapshot di git hanya menunjukkan yang benar-benar berubah.
import { tulisBlok, type Blok, type JenisKonten } from '@waris/content';
import { keMentah, type DiksiTerbit, type KontenTerbit, type Snapshot } from '@waris/data';

const urutStabil = (a: KontenTerbit, b: KontenTerbit) => a.jenis.localeCompare(b.jenis) || a.urutan - b.urutan || a.slug.localeCompare(b.slug);

export function susunSnapshot(versi: number, konten: KontenTerbit[], diksi: DiksiTerbit[]): Snapshot {
  return { versi, konten: [...konten].sort(urutStabil).map(keMentah), diksi: [...diksi].sort((a, b) => a.kunci.localeCompare(b.kunci)) };
}

export function keMarkdown(konten: KontenTerbit[]): Record<string, string> {
  const perJenis = new Map<JenisKonten, KontenTerbit[]>();
  for (const baris of [...konten].sort(urutStabil)) perJenis.set(baris.jenis, [...(perJenis.get(baris.jenis) ?? []), baris]);
  return Object.fromEntries([...perJenis].map(([jenis, daftar]) =>
    [`${jenis}.md`, `# ${jenis}\n\n${daftar.map(tulisEntri).join('\n')}`]));
}

/** Entri berblok (materi, faq, tanya jawab) ditulis sebagai Markdown terbatas; jenis lain sebagai JSON berpagar. */
function tulisEntri(baris: KontenTerbit): string {
  const isi = baris.isi as unknown as Record<string, unknown>;
  const judul = String(isi.judul ?? isi.pertanyaan ?? baris.slug);
  const refs = baris.refs.length ? `Rujukan: ${baris.refs.join(', ')}\n\n` : '';
  const blok = (['blok', 'jawaban', 'kasus', 'penyelesaian'] as const).filter(kunci => Array.isArray(isi[kunci]) && baris.jenis !== 'soal_hitung');
  const badan = blok.length
    ? blok.map(kunci => tulisBlok(isi[kunci] as Blok[])).join('\n')
    : '```json\n' + JSON.stringify(keMentah(baris).isi, null, 2) + '\n```\n';
  return `## ${judul}\n\n${refs}${badan}`;
}
