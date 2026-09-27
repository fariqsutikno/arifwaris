// Rute portal admin ↔ location.hash. bacaRute mem-parse hash menjadi Rute (tak dikenal/tak sah → beranda);
// tulisRute kebalikannya, dipakai untuk href navigasi. Menu & tab divalidasi terhadap MENU_PORTAL.
import { JENIS_KONTEN, type JenisKonten } from '@waris/content';
import { menuDari, type IsiMenu, type KunciMenu } from './navigasi';

export type Rute =
  | { layar: 'beranda' }
  | { layar: 'menu'; menu: KunciMenu; tab: IsiMenu }
  | { layar: 'entri'; entriId: string }
  | { layar: 'entriBaru'; jenis: JenisKonten }
  | { layar: 'review' }
  | { layar: 'peran' };

const BERANDA: Rute = { layar: 'beranda' };
const jenisSah = (teks: string | undefined): teks is JenisKonten => !!teks && (JENIS_KONTEN as readonly string[]).includes(teks);

export function bacaRute(hash: string): Rute {
  const [segmenA, segmenB, segmenC] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (segmenA) {
    case 'menu': {
      const menu = segmenB ? menuDari(segmenB) : undefined;
      if (!menu) return BERANDA;
      const tab = menu.isi.find(isi => isi === segmenC) ?? menu.isi[0]!;
      return { layar: 'menu', menu: menu.kunci, tab };
    }
    case 'entri': return segmenB ? { layar: 'entri', entriId: segmenB } : BERANDA;
    case 'baru': return jenisSah(segmenB) ? { layar: 'entriBaru', jenis: segmenB } : BERANDA;
    case 'review': return { layar: 'review' };
    case 'peran': return { layar: 'peran' };
    default: return BERANDA;
  }
}

export function tulisRute(rute: Rute): string {
  switch (rute.layar) {
    case 'beranda': return '#/';
    case 'menu': return `#/menu/${rute.menu}/${rute.tab}`;
    case 'entri': return `#/entri/${rute.entriId}`;
    case 'entriBaru': return `#/baru/${rute.jenis}`;
    case 'review': return '#/review';
    case 'peran': return '#/peran';
  }
}
