// Penampil PDF kitab berlisensi (public/kitab) di dalam aplikasi, dalam kerangka Rujukan.

import { DAFTAR_KITAB } from '@waris/content';
import { sumberKitab } from '../../konten/sumber';
import { tautanRujukan } from '../../rute';
import { t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { Kerangka } from './Kerangka';

export function PenampilKitab({ nomor }: { nomor: number }) {
  const kitab = DAFTAR_KITAB[nomor];
  const sumber = kitab && sumberKitab().find(isi => isi.judul === kitab.judul);
  const kembali = tautanRujukan('kitab');
  if (!kitab || !sumber?.pdf) {
    return <Kerangka judul={t('rujukan.kitab_madzhab')} kembali={kembali}><p role="alert">{t('rujukan.berkas_kitab_ini_belum_tersedia')}</p></Kerangka>;
  }
  return (
    <Kerangka label={t('rujukan.kitab_madzhab')} judul={kitab.judul} lead={kitab.penulis} kembali={kembali}>
      <div className="penampil-penuh">
        {sumber.tautan && <a className="tautan-teks" href={sumber.tautan} target="_blank" rel="noopener noreferrer"><Ikon nama="buka" ukuran={18} /> {t('rujukan.situs_sumber')}</a>}
        <iframe className="penampil-kitab" src={`/kitab/${encodeURIComponent(sumber.pdf)}`} title={kitab.judul} />
      </div>
    </Kerangka>
  );
}
