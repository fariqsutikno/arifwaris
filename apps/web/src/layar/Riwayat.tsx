// Halaman Kasusmu (#/riwayat): semua kasus pengguna, tersimpan dan sementara, dengan tampilan yang sama dengan Awal Lab
// (hero gelap, berkas berwarna). Daftarnya komponen yang sama dengan Awal Lab, hanya penuh dan bisa disaring dan dicari.

import { useEffect } from 'react';
import type { Kasus } from '../kasus';
import type { EntriRiwayat } from '../riwayat';
import { tautanInduk } from '../rute';
import { Ikon } from '../ui/Ikon';
import { DaftarKasus } from './lab/DaftarKasus';
import { t } from '../terjemah';

interface Props { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void }

export function HalamanRiwayat({ kasusSekarang, saatBuka }: Props) {
  // Penanda halaman: latar krem dan nav menyatu dengan hero gelap, sama dengan Beranda, Belajar, dan Awal Lab.
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  return (
    <main className="halaman-beranda halaman-lab">
      <header className="hero-beranda hero-kasusmu">
        <div className="sapa-pusat">
          <h1>{t('hitung.lab_kasusmu')}</h1>
          <p className="lead">{t('hitung.lab_halaman_ket')}</p>
          <a className="tautan-lanjut" href={tautanInduk({ halaman: 'riwayat' })}><span className="panah-kecil" aria-hidden="true"><Ikon nama="kembali" ukuran={16} /></span>{t('hitung.lab_kembali')}</a>
        </div>
      </header>
      <div className="tata-beranda">
        <DaftarKasus kasusSekarang={kasusSekarang} saatBuka={saatBuka} />
      </div>
    </main>
  );
}
