// Satu kontrol gerak dan suara untuk seluruh aplikasi, di header (spec rencana pengalaman 1.1 dan 1.2).
// Ikon membuka panel kecil: sakelar Animasi (mati bila sistem sudah meminta kurangi gerak) dan tiga pilihan Suara.
// Menyerahkan pilihan ke tampilan.ts, yang menyimpannya per perangkat.

import { useRef, useState } from 'react';
import { simpanGerakKurang, simpanSuara, sistemMengurangiGerak, useGerakDikurangi, useSuara, type PilihanSuara } from '../tampilan';
import { t } from '../terjemah';
import { Ikon } from './Ikon';
import { useTutupDiLuar } from './tutupDiLuar';

export function KontrolTampilan() {
  const [terbuka, setTerbuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  const dikurangi = useGerakDikurangi();
  const suara = useSuara();
  useTutupDiLuar(akar, terbuka, () => setTerbuka(false));
  const dikunciSistem = sistemMengurangiGerak();
  const pilihanSuara: Array<{ nilai: PilihanSuara; label: string }> = [
    { nilai: 'ikut', label: t('tampilan.suara_ikut') },
    { nilai: 'nyala', label: t('tampilan.suara_nyala') },
    { nilai: 'mati', label: t('tampilan.suara_mati') },
  ];
  return (
    <div className="kontrol-tampilan" ref={akar}>
      <button type="button" className="tombol-lonceng" aria-label={t('tampilan.buka')} title={t('tampilan.buka')} aria-expanded={terbuka} onClick={() => setTerbuka(!terbuka)}>
        <Ikon nama="suara" ukuran={18} />
      </button>
      {terbuka && (
        <div className="panel-tampilan">
          <button type="button" role="switch" aria-checked={!dikurangi} disabled={dikunciSistem} className="saklar-animasi"
            title={dikunciSistem ? t('tampilan.animasi_sistem') : undefined} onClick={() => simpanGerakKurang(!dikurangi)}>
            <span className="rel-saklar" aria-hidden="true" />{t('tampilan.animasi')}
          </button>
          {dikunciSistem && <small>{t('tampilan.animasi_sistem')}</small>}
          <div role="radiogroup" aria-label={t('tampilan.suara')} className="pilihan-dialog">
            <span className="label-pilihan">{t('tampilan.suara')}</span>
            {pilihanSuara.map(({ nilai, label }) => (
              <button key={nilai} type="button" role="radio" aria-checked={suara === nilai} className={suara === nilai ? 'pilih-dialog terpilih' : 'pilih-dialog'} onClick={() => simpanSuara(nilai)}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
