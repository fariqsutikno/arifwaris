// Bar bawah wizard: Kembali (kiri) dan "Lanjut: {langkah berikut}" (kanan). Bila isian wajib belum lengkap,
// tombol lanjut nonaktif dan alasannya tertulis di sampingnya.

import { LANGKAH_WIZARD } from '../../konten/wizard';
import { Tombol } from '../../ui/komponen';
import { t } from '../../terjemah';

interface Props { langkah: number; alasan: string | null; saatKembali: () => void; saatLanjut: () => void }

export function BarBawah({ langkah, alasan, saatKembali, saatLanjut }: Props) {
  const berikut = LANGKAH_WIZARD[langkah];   // indeks = langkah berikutnya
  return (
    <div className="bar-bawah" data-tur="bar-bawah">
      <div className="bar-bawah-isi">
        <Tombol varian="secondary" onClick={saatKembali}>{t('Kembali')}</Tombol>
        <span className="pengisi" />
        {alasan && <span className="alasan" id="alasan-lanjut">{alasan}</span>}
        <Tombol onClick={saatLanjut} disabled={!!alasan} {...(alasan ? { 'aria-describedby': 'alasan-lanjut' } : {})}>
          {berikut ? t('Lanjut: {nama}', { nama: berikut.nama }) : t('Lihat hasil')}
        </Tombol>
      </div>
    </div>
  );
}
