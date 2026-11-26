// Pintu susun tabel soal: memilih fungsi susun menurut jenis hasil engine.
// Biasa, munasakhat, dzawil arham tanzil, mafqud/khuntsa/haml (satu sumber); gharqa lewat susunGharqa.ts. Yang belum punya desain tabel → TIDAK_DIDUKUNG.

import type { HasilEngine, HasilMunasakhat, HasilTaqdir, IdOrang } from '@waris/engine';
import type { SusunanTabel, TabelSoal } from './model.js';
import { susunTabelBiasa } from './susunBiasa.js';
import { susunTabelDzawilArham } from './susunDzawilArham.js';
import { susunTabelMafqud } from './susunMafqud.js';
import { susunTabelMunasakhat } from './susunMunasakhat.js';

/** `namaDari`: web mengoper nama berlabel; server cukup `id => id` karena nama tidak dinilai. */
export function susunTabelSoal(hasil: HasilEngine | HasilTaqdir | HasilMunasakhat, namaDari: (id: IdOrang) => string): SusunanTabel {
  const susunan = 'daftarLangkah' in hasil ? susunTabelMunasakhat(hasil, namaDari)
    : 'daftarDunia' in hasil ? susunTabelMafqud(hasil, namaDari)
    : adalahDzawilArham(hasil) ? susunTabelDzawilArham(hasil, namaDari)
    : susunTabelBiasa(hasil, namaDari);
  return 'status' in susunan || semuaKunciBisaDipilih(susunan) ? susunan : { status: 'TIDAK_DIDUKUNG' };
}

/** Kunci kolom pilihan yang tidak ada di daftar pilihan (mis. bagian 3/8) tak bisa diisi pelajar, jadi soalnya tak bisa dinilai. */
const semuaKunciBisaDipilih = (tabel: TabelSoal): boolean => tabel.kolom.every(kolom =>
  kolom.jenis !== 'pilih' || tabel.baris.every(baris => baris.kunci[kolom.id] === undefined || !!kolom.pilihan?.includes(baris.kunci[kolom.id]!)));

/** Ada kerabat dzawil arham di hasil; tanpa `tanzil` (mis. qarabah [HNF]) tabelnya belum ada → susunTabelDzawilArham menolak. */
const adalahDzawilArham = (hasil: HasilEngine | HasilTaqdir): hasil is HasilEngine =>
  hasil.status === 'OK' && 'statusOrang' in hasil && Object.values(hasil.statusOrang).some(status => status.jenis === 'ahliWaris' && status.peran.kunci === 'DZAWIL_ARHAM');
