// Rute portal admin ↔ location.hash. bacaRute mem-parse hash menjadi Rute (tak dikenal/tak sah → beranda);
// tulisRute kebalikannya, dipakai untuk href navigasi. Menu & tab divalidasi terhadap MENU_PORTAL. Kueri setelah '?'
// dibawa apa adanya: saring daftar pada menu (dibaca ringkas.bacaSaring), isian awal pada entri baru (mis. modul).
import { JENIS_KONTEN, type JenisKonten } from '@waris/content';
import { menuDari, type IsiMenu, type KunciMenu } from './navigasi';

export type Rute =
  | { layar: 'beranda' }
  | { layar: 'menu'; menu: KunciMenu; tab: IsiMenu; kueri?: Kueri }
  | { layar: 'entri'; entriId: string }
  | { layar: 'entriBaru'; jenis: JenisKonten; kueri?: Kueri }
  | { layar: 'review' }
  | { layar: 'ajuan' }
  | { layar: 'peran' };

const BERANDA: Rute = { layar: 'beranda' };
const jenisSah = (teks: string | undefined): teks is JenisKonten => !!teks && (JENIS_KONTEN as readonly string[]).includes(teks);

export type Kueri = Readonly<Record<string, string>>;

export function bacaRute(hash: string): Rute {
  const [jalur = '', teksKueri = ''] = hash.replace(/^#\/?/, '').split('?');
  const [segmenA, segmenB, segmenC] = jalur.split('/').filter(Boolean);
  const kueri = Object.fromEntries(new URLSearchParams(teksKueri));
  const denganKueri = Object.keys(kueri).length > 0 ? { kueri } : {};
  switch (segmenA) {
    case 'menu': {
      const menu = segmenB ? menuDari(segmenB) : undefined;
      if (!menu) return BERANDA;
      const tab = menu.isi.find(isi => isi === segmenC) ?? menu.isi[0]!;
      return { layar: 'menu', menu: menu.kunci, tab, ...denganKueri };
    }
    case 'entri': return segmenB ? { layar: 'entri', entriId: segmenB } : BERANDA;
    case 'baru': return jenisSah(segmenB) ? { layar: 'entriBaru', jenis: segmenB, ...denganKueri } : BERANDA;
    case 'review': return { layar: 'review' };
    case 'ajuan': return { layar: 'ajuan' };
    case 'peran': return { layar: 'peran' };
    default: return BERANDA;
  }
}

export function tulisRute(rute: Rute): string {
  switch (rute.layar) {
    case 'beranda': return '#/';
    case 'menu': return `#/menu/${rute.menu}/${rute.tab}${tulisKueri(rute.kueri)}`;
    case 'entri': return `#/entri/${rute.entriId}`;
    case 'entriBaru': return `#/baru/${rute.jenis}${tulisKueri(rute.kueri)}`;
    case 'review': return '#/review';
    case 'ajuan': return '#/ajuan';
    case 'peran': return '#/peran';
  }
}

function tulisKueri(kueri: Kueri | undefined): string {
  const teks = new URLSearchParams(kueri ?? {}).toString();
  return teks ? `?${teks}` : '';
}
