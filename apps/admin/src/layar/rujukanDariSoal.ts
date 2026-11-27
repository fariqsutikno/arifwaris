// Kode rujukan KB yang disebut di pembahasan dan alasan pilihan sebuah soal kuis mesin (tanpa duplikat, urutan kemunculan),
// supaya bagian "Rujukan" kartu soal terisi walau soal tidak berasal dari entri konten.
import type { Potongan, SoalKuis } from '@waris/content';

export function rujukanDariSoal(soal: SoalKuis): string[] {
  const potongan: Potongan[] = [...soal.pembahasan, ...(soal.alasanPilihan ?? []).flat()];
  return [...new Set(potongan.flatMap(isi => (isi.jenis === 'rujukan' ? [isi.kode] : [])))];
}
