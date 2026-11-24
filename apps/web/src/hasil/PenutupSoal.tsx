// Penutup soal latihan yang selesai (spec tangga bantuan 5a, 6.1): kalimat tentang seberapa mandiri soal dikerjakan,
// lalu nama kasus/keadaan fikih yang baru boleh disebut sekarang (di petunjuk nama keadaan menyatakan hasilnya).

import type { NamaKasus } from '@waris/latihan';
import { Istilah } from '../ui/Tooltip';
import { t } from '../terjemah';
import type { PredikatSoal } from '../tanggaBantuan';
import { Tebal } from './Tebal';
import { NAMA_KASUS } from './kamusPetunjuk';

interface Props { predikat: PredikatSoal; kolomMandiri: number; kolomTotal: number; namaKasus: readonly NamaKasus[] }

const PENANDA_NAMA = '\u0000';

export function PenutupSoal({ predikat, kolomMandiri, kolomTotal, namaKasus }: Props) {
  const kalimat = predikat === 'mandiri' ? t('hitung.selesai.predikat_mandiri')
    : predikat === 'petunjuk' ? t('hitung.selesai.predikat_petunjuk')
    : t('hitung.selesai.predikat_dibuka', { mandiri: kolomMandiri, total: kolomTotal });
  return (
    <div className="penutup-soal" role="status">
      <p><Tebal teks={kalimat} /></p>
      {namaKasus.map(nama => {
        const istilah = NAMA_KASUS[nama]();
        const [awal = '', akhir = ''] = t('hitung.selesai.kasus_ini_disebut', { nama: PENANDA_NAMA }).replace(/\*\*/g, '').split(PENANDA_NAMA);
        return <p key={nama}>{awal}<b><Istilah id={istilah}>{istilah}</Istilah></b>{akhir}</p>;
      })}
    </div>
  );
}
