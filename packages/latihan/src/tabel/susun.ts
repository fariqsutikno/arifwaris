// Pintu susun tabel soal: memilih fungsi susun menurut jenis hasil engine.
// Sekarang hanya soal biasa; jenis lain (munasakhat, taqdir, dzawil arham, gharqa) → TIDAK_DIDUKUNG sampai G2 (spec tabel B7).

import type { HasilEngine, HasilTaqdir, IdOrang } from '@waris/engine';
import type { SusunanTabel } from './model.js';
import { susunTabelBiasa } from './susunBiasa.js';

/** `namaDari`: web mengoper nama berlabel; server cukup `id => id` karena nama tidak dinilai. */
export const susunTabelSoal = (hasil: HasilEngine | HasilTaqdir, namaDari: (id: IdOrang) => string): SusunanTabel =>
  susunTabelBiasa(hasil, namaDari);
