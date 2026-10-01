// Dialog "Hitung menurut madzhab apa?": empat pilihan, tiap pilihan menyebut status sumbernya dengan jujur (hanya Syafi'i yang
// diperiksa sampai teks primer). Pengguna awam tidak perlu menyentuhnya: dibuka dari tautan kecil "ganti" di Periksa.

import { useEffect, useRef, useState } from 'react';
import { DAFTAR_RULESET, type Ruleset } from '@waris/engine';
import { namaMadzhab, sumberMadzhab } from '../../madzhab';
import { t } from '../../terjemah';

interface Props { sekarang: Ruleset; saatPakai: (ruleset: Ruleset) => void; saatBatal: () => void }

export function DialogMadzhab({ sekarang, saatPakai, saatBatal }: Props) {
  const [pilihan, setPilihan] = useState<Ruleset>(sekarang);
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLElement>('[role=radio][aria-checked=true]')?.focus(); }, []);
  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby="judul-madzhab" ref={wadah}
      onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <div className="konfirmasi-isi dialog-langkah">
        <h2 id="judul-madzhab">{t('hitung.madzhab.pilih_judul')}</h2>
        <p className="keterangan">{t('hitung.madzhab.pilih_ket')}</p>
        <div className="pilihan-dialog pilihan-madzhab" role="radiogroup" aria-labelledby="judul-madzhab">
          {DAFTAR_RULESET.map(ruleset => (
            <button key={ruleset} type="button" role="radio" aria-checked={pilihan === ruleset} className="opsi-dialog" onClick={() => setPilihan(ruleset)}>
              <span>{namaMadzhab(ruleset)}{ruleset === 'syafii' && <> <small>({t('hitung.madzhab.bawaan')})</small></>}</span>
              <small>{sumberMadzhab(ruleset)}</small>
            </button>
          ))}
        </div>
        <div className="aksi-konfirmasi">
          <button type="button" className="tautan" onClick={saatBatal}>{t('umum.batal')}</button>
          <button type="button" className="aw-btn aw-btn-primary" onClick={() => saatPakai(pilihan)}>{t('hitung.madzhab.pakai')}</button>
        </div>
      </div>
    </div>
  );
}
