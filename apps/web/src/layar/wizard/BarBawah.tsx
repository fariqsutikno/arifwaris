// Bar bawah wizard (spec kanvas 5.9): Kembali (tautan) · status · aksi langkah besar. Menerima teks status dan satu aksi;
// tombol utama tidak pernah nonaktif. Bila isian belum lengkap, pemanggil menahan klik dan mengisi `status`, yang
// diumumkan lewat live region (selalu ada di DOM supaya perubahannya terbaca).

import { Tombol } from '../../ui/komponen';
import { t } from '../../terjemah';

export interface AksiBar { label: string; saatKlik: () => void; sebagai: 'tombol' | 'tautan' }
interface Props { saatKembali: () => void; status: string | null; aksi: AksiBar }

export function BarBawah({ saatKembali, status, aksi }: Props) {
  return (
    <div className="bar-bawah" data-tur="bar-bawah">
      <div className="bar-bawah-isi">
        <button type="button" className="tautan-teks" onClick={saatKembali}>{t('umum.kembali_2')}</button>
        <span className="pengisi" />
        <span className="alasan" role="status">{status}</span>
        {aksi.sebagai === 'tombol'
          ? <Tombol onClick={aksi.saatKlik}>{aksi.label}</Tombol>
          : <button type="button" className="tautan-teks" onClick={aksi.saatKlik}>{aksi.label}</button>}
      </div>
    </div>
  );
}
