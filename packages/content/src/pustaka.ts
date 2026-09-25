/// <reference path="./raw.d.ts" />
// Data pendamping halaman Rujukan dari `docs/rujukan/` (bukan KB fikih; hanya menunjuk ke teks KB):
//   syahid.md → hukum yang tercantum di tiap ayat inti beserta potongan ayatnya (untuk disorot),
//   kitab.md  → tautan situs resmi dan berkas PDF untuk tombol "Baca kitab".
import kitabMd from '../../../docs/rujukan/kitab.md?raw';
import syahidMd from '../../../docs/rujukan/syahid.md?raw';
import { barisTabelBagian } from './refs.js';

export interface Syahid { surah: string; ayat: number; hukum: string; syahid: string; rujukan: string }
export interface SumberKitab { judul: string; tautan?: string; pdf?: string }

export const bacaSyahid = (teksMarkdown: string): Syahid[] => barisTabelBagian(teksMarkdown, 'Daftar Syahid')
  .map(([surah = '', ayat = '', hukum = '', syahid = '', rujukan = '']) => ({ surah, ayat: Number(ayat), hukum, syahid, rujukan }));

export const bacaSumberKitab = (teksMarkdown: string): SumberKitab[] => barisTabelBagian(teksMarkdown, 'Daftar Sumber Kitab')
  .map(([judul = '', tautan = '', pdf = '']) => ({ judul, ...(tautan ? { tautan } : {}), ...(pdf ? { pdf } : {}) }));

export const DAFTAR_SYAHID: Syahid[] = bacaSyahid(syahidMd);
export const SUMBER_KITAB: SumberKitab[] = bacaSumberKitab(kitabMd);
