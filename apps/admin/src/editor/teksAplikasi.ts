// Satu daftar "Teks aplikasi" dari dua tempat simpan (teks edukasi & diksi) yang bagi admin tidak perlu dibedakan.
// Menerima isi database + lokasi tampil (modul virtual lokasi-teks); memutuskan teks, status, lokasi, dan apakah teks
// layak ditampilkan di daftar bawaan (kurasi). Tempat simpannya tetap dibawa (`sumber`) supaya dialog sunting tahu
// harus menulis ke mana, tapi tidak pernah ditampilkan.
import type { IsiTeksEdukasi } from '@waris/content';
import type { DiksiTerbit, RingkasanEntri, RingkasanKunciDiksi } from '@waris/data';
import type { SumberTeks } from './teksLayar';

export type StatusTeks = 'terbit' | 'draf' | 'diajukan' | 'dikembalikan';
export interface ButirTeks extends SumberTeks {
  status: StatusTeks;
  lokasi: string[];
  /** Teks edukasi: entri di editor konten (riwayat lengkap ada di sana). */
  entriId?: string;
  /** Diksi: teks yang sedang tayang, untuk menandai revisi tayang di riwayat. */
  terbit?: DiksiTerbit | null;
}

// [C6] Label pendek generik ("Kembali", "Simpan") disembunyikan dari daftar bawaan; admin bisa menampilkan semua.
const BATAS_KATA_LABEL = 2;
export const LOKASI_TAK_DIKETAHUI = 'Belum diketahui';

export function susunButir(
  entri: readonly RingkasanEntri[], diksi: readonly RingkasanKunciDiksi[], lokasi: Readonly<Record<string, string[]>>,
): ButirTeks[] {
  const dariTeks = entri.filter(e => !e.dihapus && !e.dibuang && e.revisiTerakhir).map((e): ButirTeks => {
    const revisi = e.revisiTerakhir!;
    const isi = revisi.isi as IsiTeksEdukasi;
    return {
      sumber: 'teks', kunci: e.slug, id: isi.id, ar: isi.ar ?? null, entriId: e.entriId,
      status: revisi.status === 'disetujui' ? 'terbit' : revisi.status, lokasi: lokasi[e.slug] ?? [],
    };
  });
  const dariDiksi = diksi.map((k): ButirTeks => {
    const revisi = k.revisiTerakhir;
    const baru = revisi && revisi.status !== 'disetujui' ? revisi : null;
    return {
      sumber: 'diksi', kunci: k.kunci, id: baru?.idTeks ?? k.terbit?.id ?? revisi?.idTeks ?? '', ar: baru ? baru.arTeks : k.terbit?.ar ?? null,
      status: baru ? baru.status as Exclude<typeof baru.status, 'disetujui'> : 'terbit', terbit: k.terbit, lokasi: lokasi[k.kunci] ?? [],
    };
  });
  return [...dariTeks, ...dariDiksi];
}

/** Kalimat/judul/petunjuk (lebih dari dua kata, sisipan {x} tidak dihitung) = layak di daftar bawaan. */
export function layakDisunting(teks: string): boolean {
  const kata = teks.replace(/\{\w+\}/g, ' ').split(/\s+/).filter(k => /\p{L}/u.test(k));
  return kata.length > BATAS_KATA_LABEL;
}

/** Dikelompokkan per layar pertama tempatnya tampil; urutan layar alfabetis, "Belum diketahui" paling akhir. */
export function kelompokkanPerLayar(daftar: readonly ButirTeks[]): [string, ButirTeks[]][] {
  const grup = new Map<string, ButirTeks[]>();
  for (const butir of daftar) {
    const layar = butir.lokasi[0] ?? LOKASI_TAK_DIKETAHUI;
    grup.set(layar, [...(grup.get(layar) ?? []), butir]);
  }
  return [...grup].sort(([a], [b]) => (a === LOKASI_TAK_DIKETAHUI ? 1 : b === LOKASI_TAK_DIKETAHUI ? -1 : a.localeCompare(b, 'id')));
}
