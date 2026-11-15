// Periksa latihan: satu baris per mayit berisi ahli warisnya, dengan "ubah" ke kartu mayit itu di langkah Ahli waris.

import type { Kasus } from '../../kasus';
import type { Aksi } from '../../keadaan';
import { labelOrangChecklist } from '../../checklist';
import { labelMayit, mayitLatihan, orangDiKartu } from '../../latihan';
import { t } from '../../terjemah';

export function RingkasanLatihan({ kasus, kirim }: { kasus: Kasus; kirim: (aksi: Aksi) => void }) {
  return (
    <div className="kartu tumpuk">
      {mayitLatihan(kasus).map(idMayit => (
        <section key={idMayit} className="tumpuk-rapat">
          <h2 className="judul-bagian-kecil">{t('hitung.cerita.label_babak', { nama: labelMayit(kasus, idMayit) })}</h2>
          <p>
            {orangDiKartu(kasus, idMayit).map(id => {
              const label = labelOrangChecklist(kasus.graf, idMayit, id);
              return kasus.urutanWafat.includes(id) ? `${label} (${t('hitung.latihan.wafat_sebelum_dibagi')})` : label;
            }).join(', ')}{' '}
            <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3, fokus: idMayit })}>{t('hitung.cerita.ubah')}</button>
          </p>
        </section>
      ))}
    </div>
  );
}
