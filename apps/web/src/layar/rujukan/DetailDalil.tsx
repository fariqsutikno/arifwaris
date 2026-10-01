// Halaman satu dalil (#/rujukan/<kode>): banner berisi klaim dan label status; di bawahnya sumber dan dalil, kutipan
// Arab, dan hukum yang bersandar padanya.

import { cariRujukan } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { t } from '../../terjemah';
import { judulBab } from '../../konten/judulBab';
import { penggunaanDalil } from './cari';
import { Dalil } from '../Penjelasan';
import { Kerangka } from './Kerangka';

export function DetailDalil({ kode }: { kode: string }) {
  const rujukan = cariRujukan(kode);
  if (!rujukan) {
    return <Kerangka judul={t('umum.rujukan')} kembali={tautanRujukan()}><p role="alert">{t('rujukan.rujukan_kode_tidak_ada_di_daftar', { kode })}</p></Kerangka>;
  }
  const { hukum } = penggunaanDalil(kode);
  const label = (
    (rujukan.status === 'perluVerifikasi' || rujukan.dhaif) && (
      <p className="baris-label">
        {rujukan.status === 'perluVerifikasi' && <span className="label-status">{t('rujukan.label_perlu_verifikasi')}</span>}
        {rujukan.dhaif && <span className="label-status">{t('rujukan.label_dhaif')}</span>}
      </p>
    )
  );
  return (
    <Kerangka label={judulBab(rujukan.bab)} judul={rujukan.klaim} kembali={tautanRujukan()} tambahan={label}>
      <section className="susunan-kartu">
        <div className="kartu-dalil"><Dalil daftarKode={[rujukan.kode]} diHalamanRujukan /></div>
        {rujukan.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab kartu-dalil">{teks}</blockquote>)}
        {rujukan.arab.length === 0 && rujukan.kutipan && <p className="kartu-dalil">{rujukan.kutipan}</p>}
        {hukum.length > 0 && (
          <div className="kartu-dalil kartu-bersandar">
            <h2>{t('rujukan.dipakai_di')}</h2>
            <p className="keterangan">{t('rujukan.hukum_bergantung')}</p>
            <ul className="daftar-polos daftar-hukum">{hukum.map(isi => <li key={isi}><span className="pil-hukum">{isi}</span></li>)}</ul>
          </div>
        )}
      </section>
    </Kerangka>
  );
}
