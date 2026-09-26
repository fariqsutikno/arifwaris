// Konfirmasi sebelum kasus yang sedang ada diganti (Ulangi dari awal, memilih tujuan saat ada kasus tersimpan,
// membuka kasus dari materi/latihan/riwayat). Kasus yang sedang ada selalu tersimpan di riwayat (yang belum sampai
// hasil ditandai data belum lengkap), jadi cukup diberi tahu di mana melanjutkannya.

import type { Kasus } from '../kasus';
import { DialogKonfirmasi } from '../ui/Dialog';
import { LANGKAH_HASIL, langkahTerjauh } from './wizard/validasi';
import { t } from '../terjemah';

interface Props {
  kasus: Kasus;
  saatLanjut: () => void;
  saatBatal: () => void;
  judul?: string;
  labelLanjut?: string;
}

export const kasusLengkap = (kasus: Kasus | null): boolean => !!kasus && langkahTerjauh(kasus) === LANGKAH_HASIL;

export function KonfirmasiKasusBaru({ kasus, saatLanjut, saatBatal, judul = t('hitung.mulai_kasus_baru'), labelLanjut = t('hitung.mulai_baru') }: Props) {
  return (
    <DialogKonfirmasi judul={judul} labelLanjut={labelLanjut} saatLanjut={saatLanjut} saatBatal={saatBatal}>
      <p>
        {kasusLengkap(kasus)
          ? t('hitung.kasus_yang_sekarang_sudah_tersimpan_di')
          : t('hitung.isian_yang_sekarang_tersimpan_di_riwayat')}
      </p>
    </DialogKonfirmasi>
  );
}
