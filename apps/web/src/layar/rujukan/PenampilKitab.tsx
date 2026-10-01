// Penampil PDF kitab berlisensi (public/kitab) di dalam aplikasi.

import { DAFTAR_KITAB } from '@waris/content';
import { sumberKitab } from '../../konten/sumber';
import { tautanRujukan } from '../../rute';
import { t } from '../../terjemah';

export function PenampilKitab({ nomor }: { nomor: number }) {
  const kitab = DAFTAR_KITAB[nomor];
  const sumber = kitab && sumberKitab().find(isi => isi.judul === kitab.judul);
  if (!kitab || !sumber?.pdf) return <><a href={tautanRujukan('kitab')}>{t('rujukan.kembali_ke_daftar_kitab')}</a><p role="alert">{t('rujukan.berkas_kitab_ini_belum_tersedia')}</p></>;
  return (
    <div className="penampil-penuh">
      <header className="bilah-penampil">
        <a href={tautanRujukan('kitab')}>{t('rujukan.kembali_ke_daftar_kitab')}</a>
        <cite>{kitab.judul}</cite>
        {sumber.tautan && <a href={sumber.tautan} target="_blank" rel="noopener noreferrer">{t('rujukan.situs_sumber')}</a>}
      </header>
      <iframe className="penampil-kitab" src={`/kitab/${encodeURIComponent(sumber.pdf)}`} title={kitab.judul} />
    </div>
  );
}
