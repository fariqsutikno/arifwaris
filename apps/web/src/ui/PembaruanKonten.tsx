// Alert mengambang setelah sinkron latar menemukan konten/teks baru (sudah tersimpan di cache): pesan + tautan muat ulang
// + tutup. Muncul hanya setelah peristiwa PERISTIWA_KONTEN_BARU dari main.tsx; teks tidak pernah diganti diam-diam.
import { useEffect, useState } from 'react';
import { PERISTIWA_KONTEN_BARU } from '../konten/sinkron';
import { t } from '../terjemah';
import { Ikon } from './Ikon';

export function PembaruanKonten() {
  const [ada, setAda] = useState(false);
  useEffect(() => {
    const tandai = () => setAda(true);
    window.addEventListener(PERISTIWA_KONTEN_BARU, tandai);
    return () => window.removeEventListener(PERISTIWA_KONTEN_BARU, tandai);
  }, []);
  if (!ada) return null;
  return (
    <div className="pembaruan-konten" role="alert">
      <Ikon nama="segarkan" />
      <p>
        {t('umum.pembaruan_konten')}{' '}
        <button type="button" className="tautan-teks" onClick={() => window.location.reload()}>{t('umum.muat_ulang')}</button>
      </p>
      <button type="button" className="pembaruan-tutup" aria-label={t('umum.tutup')} onClick={() => setAda(false)}><Ikon nama="salah" ukuran={16} /></button>
    </div>
  );
}
