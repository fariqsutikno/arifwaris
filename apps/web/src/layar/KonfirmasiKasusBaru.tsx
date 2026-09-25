// Konfirmasi sebelum kasus yang sedang ada diganti (Ulangi dari awal, memilih tujuan saat ada kasus tersimpan,
// membuka kasus dari materi/latihan/riwayat). Kasus yang sudah sampai hasil otomatis tersimpan di riwayat, jadi
// cukup diberi tahu; isian yang belum sampai hasil tidak masuk riwayat, jadi diberi tahu bahwa ia akan hilang.

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
          : 'Isian yang sekarang belum sampai hasil, jadi belum masuk riwayat dan akan hilang.'}
      </p>
    </DialogKonfirmasi>
  );
}
