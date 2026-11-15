// Langkah Ahli waris untuk latihan soal: satu kartu per mayit (spec kanvas 6). Menerima Kasus latihan + ubah;
// menyerahkan perubahan graf dan urutan wafat lewat ubah. Fokus: kartu yang digulir dan difokus (dari "Ubah" di Periksa).

import { useEffect } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { mayitLatihan } from '../../latihan';
import { geraknyaDikurangi } from '../../tampilan';
import { t } from '../../terjemah';
import { KartuMayit } from './KartuMayit';
import { UrutanWafatLatihan } from './UrutanWafatLatihan';
import '../../gaya/latihanIsian.css';

interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; fokus?: IdOrang }

export function LatihanAhliWaris({ kasus, ubah, fokus }: Props) {
  useEffect(() => {
    const kartu = fokus ? document.getElementById(`mayit-${fokus}`) : null;
    kartu?.scrollIntoView({ block: 'center', behavior: geraknyaDikurangi() ? 'auto' : 'smooth' });
    kartu?.focus({ preventScroll: true });
  }, [fokus]);
  return (
    <div className="tumpuk latihan-isian">
      <p className="keterangan">{t('hitung.latihan.ketuk_tandai')}</p>
      {mayitLatihan(kasus).map((idMayit, indeks) => <KartuMayit key={idMayit} kasus={kasus} idMayit={idMayit} nomor={indeks + 1} ubah={ubah} />)}
      <UrutanWafatLatihan kasus={kasus} ubah={ubah} />
    </div>
  );
}
