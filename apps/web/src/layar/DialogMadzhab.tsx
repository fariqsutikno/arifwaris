// Dialog "Pilih madzhab" di layar Hasil: empat pilihan radio; Pakai mengirim pilihan, Batal menutup tanpa mengubah.
// Syafi'i = bawaan (satu-satunya yang terverifikasi ke teks primer); tiga lainnya bersumber nukilan Lahim dan Ithraa.

import { useId, useState } from 'react';
import type { Ruleset } from '@waris/engine';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

const DAFTAR_MADZHAB: Ruleset[] = ['syafii', 'hanbali', 'hanafi', 'maliki'];

export const namaMadzhab = (ruleset: Ruleset): string => t(`hitung.madzhab_${ruleset}`);

interface Props { awal: Ruleset; saatPakai: (ruleset: Ruleset) => void; saatBatal: () => void }

export function DialogMadzhab({ awal, saatPakai, saatBatal }: Props) {
  const id = useId();
  const [pilihan, setPilihan] = useState<Ruleset>(awal);
  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`}
      onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <form className="konfirmasi-isi" onSubmit={event => { event.preventDefault(); saatPakai(pilihan); }}>
        <h2 id={`${id}-judul`}>{t('hitung.pilih_madzhab')}</h2>
        {DAFTAR_MADZHAB.map(ruleset => (
          <label key={ruleset} className="pilihan-madzhab">
            <input type="radio" name={`${id}-madzhab`} checked={pilihan === ruleset} onChange={() => setPilihan(ruleset)} />
            <span><b>{namaMadzhab(ruleset)}</b>
              <small>{ruleset === 'syafii' ? t('hitung.madzhab_bawaan') : t('hitung.madzhab_nukilan_lahim')}</small></span>
          </label>
        ))}
        <div className="aksi-konfirmasi">
          <Tombol type="button" varian="secondary" onClick={saatBatal}>{t('umum.batal')}</Tombol>
          <Tombol type="submit">{t('hitung.madzhab_pakai')}</Tombol>
        </div>
      </form>
    </div>
  );
}
