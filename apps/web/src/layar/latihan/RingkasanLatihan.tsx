// Periksa latihan: satu baris per mayit berisi ahli warisnya, dengan "ubah" ke kartu mayit itu di langkah Ahli waris,
// lalu keadaan khusus (hilang, belum tahu, khuntsa, wafat sebelum mayit) dan baris harta yang dibagi.

import type { Kasus } from '../../kasus';
import type { Aksi } from '../../keadaan';
import { labelMayit, labelOrangDiKartu, mayitLatihan } from '../../latihan';
import { keadaanOrang } from '../../keadaanOrang';
import { t } from '../../terjemah';
import { BarisKhususCerita } from '../PeriksaCerita';
import { statusKeadaan } from './HalLainKartu';

// Keadaan yang belum punya kalimat di BarisKhususCerita; sisanya (hilang, bersamaan, sesudah dibagi, janin) sudah tertulis di sana.
const KEADAAN_DITULIS_DI_SINI = ['wafatSebelum', 'belumTahu', 'khuntsa'];

export function RingkasanLatihan({ kasus, kirim }: { kasus: Kasus; kirim: (aksi: Aksi) => void }) {
  return (
    <div className="kartu tumpuk">
      {mayitLatihan(kasus).map(idMayit => (
        <section key={idMayit} className="tumpuk-rapat">
          <h2 className="judul-bagian-kecil">{t('hitung.cerita.label_babak', { nama: labelMayit(kasus, idMayit) })}</h2>
          <p>
            {labelOrangDiKartu(kasus, idMayit).map(({ id, label }) => {
              return kasus.urutanWafat.includes(id) ? `${label} (${t('hitung.latihan.wafat_sebelum_dibagi')})` : label;
            }).join(', ')}{' '}
            <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3, fokus: idMayit })}>{t('hitung.cerita.ubah')}</button>
          </p>
          {labelOrangDiKartu(kasus, idMayit).filter(({ id }) => KEADAAN_DITULIS_DI_SINI.includes(keadaanOrang(kasus, id))).map(({ id, label }) => (
            <p key={id}>{label}: {statusKeadaan(kasus, id, idMayit)}</p>
          ))}
        </section>
      ))}
      <BarisKhususCerita kasus={kasus} />
    </div>
  );
}
