// Pintu susun tabel soal: memilih fungsi susun menurut jenis hasil engine.
// Biasa dan munasakhat biasa; jenis lain (taqdir, dzawil arham, gharqa) → TIDAK_DIDUKUNG sampai G2 menambahkannya (spec tabel B7).

import type { HasilEngine, HasilMunasakhat, HasilTaqdir, IdOrang } from '@waris/engine';
import type { SusunanTabel } from './model.js';
import { susunTabelBiasa } from './susunBiasa.js';
import { susunTabelMunasakhat } from './susunMunasakhat.js';

/** `namaDari`: web mengoper nama berlabel; server cukup `id => id` karena nama tidak dinilai. */
export const susunTabelSoal = (hasil: HasilEngine | HasilTaqdir | HasilMunasakhat, namaDari: (id: IdOrang) => string): SusunanTabel =>
  'daftarLangkah' in hasil ? susunTabelMunasakhat(hasil, namaDari) : susunTabelBiasa(hasil, namaDari);
