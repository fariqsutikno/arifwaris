// Penampil PDF kitab berlisensi (public/kitab) di dalam aplikasi.

import { DAFTAR_KITAB } from '@waris/content';
import { sumberKitab } from '../../konten/sumber';
import { tautanRujukan } from '../../rute';
import { t } from '../../terjemah';

export function PenampilKitab({ nomor }: { nomor: number }) {
  const kitab = DAFTAR_KITAB[nomor];
  const pdf = kitab && sumberKitab().find(isi => isi.judul === kitab.judul)?.pdf;
  return (
    <>
      <a href={tautanRujukan('kitab')}>{t('rujukan.kembali_ke_daftar_kitab')}</a>
      {kitab && pdf ? (
        <>
          <h1><cite>{kitab.judul}</cite></h1>
          <iframe className="penampil-kitab" src={`/kitab/${encodeURIComponent(pdf)}`} title={kitab.judul} />
        </>
      ) : <p role="alert">{t('rujukan.berkas_kitab_ini_belum_tersedia')}</p>}
    </>
  );
}
