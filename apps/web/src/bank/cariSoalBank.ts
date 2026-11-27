// Dari pilihan pelajar ke satu soal bank yang bisa dikerjakan. Bank hanya menyimpan indeks (kode, label, tingkat, modul);
// kode diurai di klien, dan yang tak bisa dinilai layar (tak ada tabel isiannya) dilewati, lalu dicari di jendela berikutnya.

import type { SoalHitung, Tingkat } from '@waris/content';
import type { RepositoriBankSoal } from '@waris/data';
import { cariSoal } from './soalBank';

const JUMLAH_KANDIDAT = 10;
const PUTARAN_MAKS = 3;
/** Dzawil arham tanzil hampir semuanya tanpa tabel isian (jalur ganda), jadi tak ditawarkan di Latihan. */
const LABEL_TANPA_TABEL = ['dzawilArham'];

export interface PilihanBank { tingkat?: Tingkat | undefined; modul?: number | undefined }

/** Undefined bila tak ada soal yang cocok; galat jaringan/basis data dilempar ke pemanggil. */
export async function cariSoalBank(bank: RepositoriBankSoal, pilihan: PilihanBank, benih: string): Promise<SoalHitung | undefined> {
  for (let putaran = 0; putaran < PUTARAN_MAKS; putaran++) {
    const daftarKode = await bank.cariSoal({
      ...(pilihan.tingkat ? { tingkat: pilihan.tingkat } : {}), ...(pilihan.modul ? { modul: pilihan.modul } : {}),
      label: { tanpa: LABEL_TANPA_TABEL }, jumlah: JUMLAH_KANDIDAT, benih: `${benih}#${putaran}`,
    });
    if (daftarKode.length === 0) return undefined;
    for (const kode of daftarKode) {
      const soal = cariSoal(kode);
      if (soal) return soal;
    }
  }
  return undefined;
}
