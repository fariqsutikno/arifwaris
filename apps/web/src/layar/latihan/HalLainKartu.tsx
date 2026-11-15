// "Hal lain" di kartu mayit latihan: keadaan khusus orang di kartu itu (hilang, wafat bersamaan, belum tahu, khuntsa, wafat
// sebelum mayit). Menerima Kasus + mayit; menyerahkan Kasus baru dari DialogKeadaan, yang memakai terapkanKeadaan dan menolak
// kombinasi yang belum didukung engine, jadi tidak ada aturan fikih di sini.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { keadaanOrang, namaSingkat } from '../../keadaanOrang';
import { labelOrangChecklist } from '../../checklist';
import { orangDiKartu } from '../../latihan';
import { t } from '../../terjemah';
import { DialogKeadaan } from '../keadaan/DialogKeadaan';

interface Props { kasus: Kasus; idMayit: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void }

export function HalLainKartu({ kasus, idMayit, ubah }: Props) {
  const [buka, setBuka] = useState(false);
  const [dialog, setDialog] = useState<IdOrang | null>(null);
  const orang = orangDiKartu(kasus, idMayit).filter(id => kasus.graf.orang[id]!.statusHidup !== 'dalamKandungan')
    .map(id => ({ id, label: labelOrangChecklist(kasus.graf, idMayit, id) }));
  return (
    <details open={buka} className="hal-lain-kartu">
      <summary onClick={event => { event.preventDefault(); setBuka(!buka); }}>{t('hitung.kanvas.pendek_hal_lain')}</summary>
      {buka && (
        <>
          <p className="keterangan">{t('hitung.penutup.ketuk_orangnya')}</p>
          <ul className="daftar-keadaan">
            {orang.map(({ id, label }) => (
              <li key={id}>
                <button type="button" className="baris-keadaan" onClick={() => setDialog(id)}>
                  <b>{label}</b><span className={`lencana-keadaan ${keadaanOrang(kasus, id)}`}>{statusKeadaan(kasus, id, idMayit)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {dialog && <DialogKeadaan kasus={kasus} idOrang={dialog} saatBatal={() => setDialog(null)}
        saatSelesai={kasusBaru => { setDialog(null); ubah(() => kasusBaru); }} />}
    </details>
  );
}

/** Teks keadaan satu orang; `idMayit` = mayit yang dijadikan pembanding "sebelum/sesudah". */
export function statusKeadaan(kasus: Kasus, id: IdOrang, idMayit: IdOrang): string {
  const mayit = namaSingkat(kasus, idMayit);
  // Tiap keadaan memanggil t dengan kunci literal supaya tes diksi menangkapnya.
  switch (keadaanOrang(kasus, id)) {
    case 'hidup': return t('hitung.penutup.status_hidup');
    case 'belumTahu': return t('hitung.penutup.status_belum_tahu');
    case 'wafatSebelum': return t('hitung.penutup.status_wafat_sebelum', { mayit });
    case 'wafatSesudah': return t('hitung.penutup.status_wafat_sesudah', { mayit });
    case 'wafatSesudahDibagi': return t('hitung.penutup.status_wafat_sesudah_dibagi');
    case 'bersamaan': return t('hitung.penutup.status_bersamaan');
    case 'hilang': return t('hitung.penutup.status_hilang');
    case 'dalamKandungan': return t('hitung.penutup.status_dalam_kandungan');
    case 'khuntsa': return t('hitung.penutup.status_khuntsa');
  }
}
