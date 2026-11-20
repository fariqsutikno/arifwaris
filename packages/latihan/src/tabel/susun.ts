// Pintu susun tabel soal: memilih fungsi susun menurut jenis hasil engine.
// Biasa, munasakhat biasa, dzawil arham tanzil; jenis lain (taqdir, gharqa) → TIDAK_DIDUKUNG sampai G2 menambahkannya (spec tabel B7).

import type { HasilEngine, HasilMunasakhat, HasilTaqdir, IdOrang } from '@waris/engine';
import type { SusunanTabel } from './model.js';
import { susunTabelBiasa } from './susunBiasa.js';
import { susunTabelDzawilArham } from './susunDzawilArham.js';
import { susunTabelMunasakhat } from './susunMunasakhat.js';

/** `namaDari`: web mengoper nama berlabel; server cukup `id => id` karena nama tidak dinilai. */
export const susunTabelSoal = (hasil: HasilEngine | HasilTaqdir | HasilMunasakhat, namaDari: (id: IdOrang) => string): SusunanTabel =>
  'daftarLangkah' in hasil ? susunTabelMunasakhat(hasil, namaDari)
    : adalahDzawilArham(hasil) ? susunTabelDzawilArham(hasil, namaDari)
    : susunTabelBiasa(hasil, namaDari);

/** Ada kerabat dzawil arham di hasil; tanpa `tanzil` (mis. qarabah [HNF]) tabelnya belum ada → susunTabelDzawilArham menolak. */
const adalahDzawilArham = (hasil: HasilEngine | HasilTaqdir): hasil is HasilEngine =>
  hasil.status === 'OK' && 'statusOrang' in hasil && Object.values(hasil.statusOrang).some(status => status.jenis === 'ahliWaris' && status.peran.kunci === 'DZAWIL_ARHAM');
