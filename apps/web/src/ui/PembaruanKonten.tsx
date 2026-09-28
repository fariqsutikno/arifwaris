// Tawaran muat ulang setelah sinkron latar menemukan konten/teks baru (sudah tersimpan di cache). Tautan, bukan tombol
// berbingkai (keputusan UI 2026-09-28); tidak muncul sampai ada peristiwa PERISTIWA_KONTEN_BARU dari main.tsx.
import { useEffect, useState } from 'react';
import { PERISTIWA_KONTEN_BARU } from '../konten/sinkron';
import { t } from '../terjemah';

export function PembaruanKonten() {
  const [ada, setAda] = useState(false);
  useEffect(() => {
    const tandai = () => setAda(true);
    window.addEventListener(PERISTIWA_KONTEN_BARU, tandai);
    return () => window.removeEventListener(PERISTIWA_KONTEN_BARU, tandai);
  }, []);
  if (!ada) return null;
  return (
    <p className="pembaruan-konten" role="status">
      {t('umum.pembaruan_konten')}{' '}
      <button type="button" className="tautan-teks" onClick={() => window.location.reload()}>{t('umum.muat_ulang')}</button>
    </p>
  );
}
