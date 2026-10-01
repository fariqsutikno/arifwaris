// Halaman satu dalil (#/rujukan/<kode>): klaim, dalil, kutipan Arab.

import { cariRujukan } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { t } from '../../terjemah';
import { judulBab } from '../../konten/judulBab';
import { Dalil } from '../Penjelasan';

export function DetailDalil({ kode }: { kode: string }) {
  const rujukan = cariRujukan(kode);
  if (!rujukan) return <><a href={tautanRujukan()}>{t('rujukan.kembali_ke_rujukan')}</a><p role="alert">{t('rujukan.rujukan_kode_tidak_ada_di_daftar', { kode })}</p></>;
  return (
    <>
      <p className="label-langkah">{judulBab(rujukan.bab)}</p>
      <h1>{rujukan.klaim}</h1>
      <div className="kartu kartu-rujukan"><Dalil daftarKode={[rujukan.kode]} diHalamanRujukan /></div>
      {rujukan.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab">{teks}</blockquote>)}
      {rujukan.arab.length === 0 && rujukan.kutipan && <p>{rujukan.kutipan}</p>}
    </>
  );
}
