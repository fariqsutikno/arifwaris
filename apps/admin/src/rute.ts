// Rute portal admin ↔ location.hash. bacaRute mem-parse hash menjadi Rute (tak dikenal/tak sah → 'review',
// layar aman default); tulisRute kebalikannya, dipakai untuk href navigasi.
import { JENIS_KONTEN, type JenisKonten } from '@waris/content';

export type Rute =
  | { layar: 'konten'; jenis: JenisKonten }
  | { layar: 'entri'; entriId: string }
  | { layar: 'entriBaru'; jenis: JenisKonten }
  | { layar: 'review' }
  | { layar: 'diksi' }
  | { layar: 'peran' };

const RUTE_DEFAULT: Rute = { layar: 'review' };

export function bacaRute(hash: string): Rute {
  const bagian = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [segmenA, segmenB] = bagian;
  switch (segmenA) {
    case 'konten':
      return segmenB && (JENIS_KONTEN as readonly string[]).includes(segmenB) ? { layar: 'konten', jenis: segmenB as JenisKonten } : RUTE_DEFAULT;
    case 'entri':
      return segmenB ? { layar: 'entri', entriId: segmenB } : RUTE_DEFAULT;
    case 'baru':
      return segmenB && (JENIS_KONTEN as readonly string[]).includes(segmenB) ? { layar: 'entriBaru', jenis: segmenB as JenisKonten } : RUTE_DEFAULT;
    case 'review':
      return { layar: 'review' };
    case 'diksi':
      return { layar: 'diksi' };
    case 'peran':
      return { layar: 'peran' };
    default:
      return RUTE_DEFAULT;
  }
}

export function tulisRute(rute: Rute): string {
  switch (rute.layar) {
    case 'konten': return `#/konten/${rute.jenis}`;
    case 'entri': return `#/entri/${rute.entriId}`;
    case 'entriBaru': return `#/baru/${rute.jenis}`;
    case 'review': return '#/review';
    case 'diksi': return '#/diksi';
    case 'peran': return '#/peran';
  }
}
