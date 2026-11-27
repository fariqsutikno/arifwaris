// Dari pilihan pelajar ke satu soal kuis mesin. Bank hanya menyimpan indeks soal kuis yang aturan pengecohnya sudah disetujui
// tim keilmuan; teks, pilihan, dan pembahasan dibangun ulang dari kode dengan kamus diksi web. Kode yang gagal dibangun
// (mis. diksi belum ada) dilewati, lalu dicari di jendela berikutnya.

import type { RepositoriBankSoal } from '@waris/data';
import { soalKuisDariKode, type SoalKuisMesin } from '@waris/latihan';
import { kamusNarasi } from '../konten/kamusNarasi';
import type { PilihanBank } from './cariSoalBank';

const JUMLAH_KANDIDAT = 10;
const PUTARAN_MAKS = 3;

/** Undefined bila tak ada soal yang cocok; galat jaringan/basis data dilempar ke pemanggil. */
export async function cariSoalKuisBank(bank: RepositoriBankSoal, pilihan: PilihanBank, benih: string): Promise<SoalKuisMesin | undefined> {
  for (let putaran = 0; putaran < PUTARAN_MAKS; putaran++) {
    const daftarKode = await bank.cariSoal({
      bentuk: 'kuis', ...(pilihan.tingkat ? { tingkat: pilihan.tingkat } : {}), ...(pilihan.modul ? { modul: pilihan.modul } : {}),
      jumlah: JUMLAH_KANDIDAT, benih: `${benih}#${putaran}`,
    });
    if (daftarKode.length === 0) return undefined;
    for (const kode of daftarKode) {
      const hasil = soalKuisDariKode(kode, { kamus: kamusNarasi, bahasa: 'id' });
      if (hasil.ok) return hasil.soal;
    }
  }
  return undefined;
}
