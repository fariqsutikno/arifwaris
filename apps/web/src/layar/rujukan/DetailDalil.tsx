// Halaman satu dalil (#/rujukan/<kode>): klaim, label status, dalil, kutipan Arab, dan hukum yang bersandar padanya.

import { cariRujukan } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { t } from '../../terjemah';
import { judulBab } from '../../konten/judulBab';
import { penggunaanDalil } from './cari';
import { Dalil } from '../Penjelasan';

export function DetailDalil({ kode }: { kode: string }) {
  const rujukan = cariRujukan(kode);
  if (!rujukan) return <><a href={tautanRujukan()}>{t('rujukan.kembali_ke_rujukan')}</a><p role="alert">{t('rujukan.rujukan_kode_tidak_ada_di_daftar', { kode })}</p></>;
  const { hukum } = penggunaanDalil(kode);
  return (
    <>
      <p className="label-langkah">{judulBab(rujukan.bab)}</p>
      <h1>{rujukan.klaim}</h1>
      {(rujukan.status === 'perluVerifikasi' || rujukan.dhaif) && (
        <p className="baris-label">
          {rujukan.status === 'perluVerifikasi' && <span className="label-status">{t('rujukan.label_perlu_verifikasi')}</span>}
          {rujukan.dhaif && <span className="label-status">{t('rujukan.label_dhaif')}</span>}
        </p>
      )}
      <div className="kartu kartu-rujukan"><Dalil daftarKode={[rujukan.kode]} diHalamanRujukan /></div>
      {rujukan.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab">{teks}</blockquote>)}
      {rujukan.arab.length === 0 && rujukan.kutipan && <p>{rujukan.kutipan}</p>}
      {hukum.length > 0 && (
        <section className="blok-rujukan">
          <h2>{t('rujukan.dipakai_di')}</h2>
          <p className="keterangan">{t('rujukan.hukum_bergantung')}</p>
          <ul>{hukum.map(isi => <li key={isi}>{isi}</li>)}</ul>
        </section>
      )}
    </>
  );
}
