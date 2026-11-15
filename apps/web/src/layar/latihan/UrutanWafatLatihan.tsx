// Daftar urutan wafat (munasakhat) di bawah kartu mayit; tampil bila ada ≥ 2 mayit lanjutan. Naik/turun lewat geserUrutan.

import type { Kasus } from '../../kasus';
import { geserUrutan, labelMayit } from '../../latihan';
import { TombolIkon } from '../../ui/Tooltip';
import { t } from '../../terjemah';

const PANAH = { naik: 'M6 15l6-6 6 6', turun: 'M6 9l6 6 6-6' } as const;
const Panah = ({ arah }: { arah: keyof typeof PANAH }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PANAH[arah]} /></svg>
);

export function UrutanWafatLatihan({ kasus, ubah }: { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void }) {
  if (kasus.urutanWafat.length < 2) return null;
  return (
    <section className="kartu tumpuk">
      <h2 id="judul-urutan-latihan" className="judul-bagian-kecil">{t('hitung.latihan.urutan_judul')}</h2>
      <p className="keterangan">{t('hitung.latihan.urutan_keterangan')}</p>
      <ol className="urutan-wafat" aria-labelledby="judul-urutan-latihan">
        {kasus.urutanWafat.map(id => (
          <li key={id}>
            <span>{labelMayit(kasus, id)}</span>
            <TombolIkon label={t('hitung.latihan.naikkan', { nama: labelMayit(kasus, id) })} onClick={() => ubah(k => geserUrutan(k, id, -1))}><Panah arah="naik" /></TombolIkon>
            <TombolIkon label={t('hitung.latihan.turunkan', { nama: labelMayit(kasus, id) })} onClick={() => ubah(k => geserUrutan(k, id, 1))}><Panah arah="turun" /></TombolIkon>
          </li>
        ))}
      </ol>
    </section>
  );
}
