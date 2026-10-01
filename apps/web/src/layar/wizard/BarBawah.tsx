// Bar bawah wizard, satu-satunya bar di layar: "Kembali" (tautan teks, aksi sekunder) dan tombol utama di kanan.
// Bila isian wajib belum lengkap, tombol utama nonaktif dan alasannya tertulis di sampingnya.

import { Tombol } from '../../ui/komponen';
import { panahMundur, t } from '../../terjemah';

interface Props { labelLanjut: string; alasan: string | null; saatKembali: () => void; saatLanjut: () => void }

export function BarBawah({ labelLanjut, alasan, saatKembali, saatLanjut }: Props) {
  return (
    <div className="bar-bawah" data-tur="bar-bawah">
      <div className="bar-bawah-isi">
        <button type="button" className="tautan-kembali" onClick={saatKembali}><span aria-hidden="true">{panahMundur()}</span> {t('umum.kembali_2')}</button>
        <span className="pengisi" />
        {alasan && <span className="alasan" id="alasan-lanjut">{alasan}</span>}
        <Tombol onClick={saatLanjut} disabled={!!alasan} {...(alasan ? { 'aria-describedby': 'alasan-lanjut' } : {})}>{labelLanjut}</Tombol>
      </div>
    </div>
  );
}
