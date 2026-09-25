// Konfirmasi sebelum kasus yang sedang ada diganti (Ulangi dari awal, memilih tujuan saat ada kasus tersimpan,
// membuka kasus dari materi/latihan/riwayat). Kasus yang sedang ada selalu tersimpan di riwayat (yang belum sampai
// hasil ditandai data belum lengkap), jadi cukup diberi tahu di mana melanjutkannya.

import type { Kasus } from '../kasus';
import { DialogKonfirmasi } from '../ui/Dialog';
import { LANGKAH_HASIL, langkahTerjauh } from './wizard/validasi';

interface Props {
  kasus: Kasus;
  saatLanjut: () => void;
  saatBatal: () => void;
  judul?: string;
  labelLanjut?: string;
}

export const kasusLengkap = (kasus: Kasus | null): boolean => !!kasus && langkahTerjauh(kasus) === LANGKAH_HASIL;

export function KonfirmasiKasusBaru({ kasus, saatLanjut, saatBatal, judul = 'Mulai kasus baru?', labelLanjut = 'Mulai baru' }: Props) {
  return (
    <DialogKonfirmasi judul={judul} labelLanjut={labelLanjut} saatLanjut={saatLanjut} saatBatal={saatBatal}>
      <p>
        {kasusLengkap(kasus)
          ? 'Kasus yang sekarang sudah tersimpan di Riwayat hitung, jadi bisa kamu buka lagi kapan saja.'
          : 'Isian yang sekarang tersimpan di Riwayat hitung sebagai data belum lengkap. Kamu bisa melanjutkannya kapan saja.'}
      </p>
    </DialogKonfirmasi>
  );
}
