// Tombol Bagikan: menu bagikan bawaan perangkat (Web Share API) bila ada; bila tidak, tautan disalin ke clipboard.
// Hasilnya diumumkan lewat aria-live supaya pembaca layar ikut tahu tautannya sudah tersalin.

import { useEffect, useState } from 'react';
import { Ikon } from './Ikon';
import { t } from '../terjemah';

interface Props { judul: string; tautan: string; label?: string; kecil?: boolean }

export function Bagikan({ judul, tautan, label = 'Bagikan', kecil }: Props) {
  const [pesan, setPesan] = useState('');
  useEffect(() => {
    if (!pesan) return;
    const waktu = window.setTimeout(() => setPesan(''), 2500);
    return () => window.clearTimeout(waktu);
  }, [pesan]);
  const url = `${window.location.origin}${window.location.pathname}${tautan}`;
  const bagikan = async () => {
    if (navigator.share) {
      // Dibatalkan pengguna = bukan galat; tidak perlu pesan.
      await navigator.share({ title: judul, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setPesan(t('Tautan disalin'));
    } catch {
      setPesan(t('Gagal menyalin. Salin dari bilah alamat.'));
    }
  };
  return (
    <span className="wadah-bagikan">
      <button type="button" className={kecil ? 'tombol-bagikan kecil' : 'tombol-bagikan'} onClick={() => void bagikan()} aria-label={`${label}: ${judul}`}>
        <Ikon nama="bagikan" ukuran={kecil ? 16 : 18} />{label}
      </button>
      <span className="pesan-bagikan" role="status">{pesan}</span>
    </span>
  );
}
