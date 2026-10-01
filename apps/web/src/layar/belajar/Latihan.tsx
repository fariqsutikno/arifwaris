// Latihan: hero gelap berisi akses cepat (Soal acak di tab Soal hitung, rekomendasi paket di tab Kuis), dua tab.
//   Soal hitung — daftar kasus per bab (DaftarSoalHitung); Kerjakan membuka kasusnya di kalkulator mode Belajar.
//   Kuis konsep — papan kuis (PapanKuis.tsx); sesi kuisnya ada di KuisKonsep.tsx.

import { useEffect, useRef } from 'react';
import { type SoalHitung } from '@waris/content';
import type { Kasus } from '../../kasus';
import { tautanLatihan, tautanPeringkat } from '../../rute';
import { useCahayaIkutKursor } from '../../ui/sorotan';
import { panah, t } from '../../terjemah';
import { DaftarSoalHitung } from './DaftarSoalHitung';
import { SesiKuis } from './KuisKonsep';
import { PapanKuis, RekomendasiKuis } from './PapanKuis';
import { SoalAcak } from './SoalAcak';

interface Props {
  tab: 'hitung' | 'kuis';
  paket?: string | undefined;
  kasusSekarang: Kasus | null;
  saatKerjakan: (soal: SoalHitung) => void;
}

export function Latihan({ tab, paket, kasusSekarang, saatKerjakan }: Props) {
  // Saat mengerjakan satu paket kuis, halaman fokus ke soal: tanpa hero Latihan dan tab.
  if (tab === 'kuis' && paket) return <HalamanSesi paket={paket} />;
  return <HalamanLatihan tab={tab} kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} />;
}

function HalamanSesi({ paket }: { paket: string }) {
  // Header transparan seperti halaman Latihan; pita gelap hero di belakang kartu sesi.
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  return (
    <main className="halaman-beranda halaman-sesi">
      <div className="hero-beranda hero-sesi" aria-hidden="true" />
      <div className="isi-sesi"><SesiKuis key={paket} paket={paket} /></div>
    </main>
  );
}

function HalamanLatihan({ tab, kasusSekarang, saatKerjakan }: Omit<Props, 'paket'>) {
  const hero = useRef<HTMLElement>(null);
  useCahayaIkutKursor(hero);
  // Header transparan melayang di atas hero gelap (sama seperti Belajar).
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  return (
    <main className="halaman-beranda halaman-latihan">
      <header className="hero-beranda hero-latihan" ref={hero}>
        <div className="sapa-pusat">
          <h1>{t('umum.latihan')}</h1>
          <p className="lead">{t('latihan.kerjakan_soal_hitung_dari_kasus_nyata')}</p>
          {/* Pintu papan peringkat untuk semua orang, termasuk yang belum login (tahap 5). */}
          <a className="tautan-lanjut" href={tautanPeringkat()}>{t('akun.kumpulkan_xp_lihat_papan_peringkat')}<span className="panah-kecil" aria-hidden="true">{panah()}</span></a>
        </div>
        {tab === 'hitung' ? <SoalAcak kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} /> : <RekomendasiKuis />}
      </header>
      <div className="isi-latihan">
        <nav className="tab-latihan" aria-label={t('latihan.jenis_latihan')}>
          <a className="tab-tautan" href={tautanLatihan('hitung')} aria-current={tab === 'hitung' ? 'page' : undefined}>{t('umum.soal_hitung')}</a>
          <a className="tab-tautan" href={tautanLatihan('kuis')} aria-current={tab === 'kuis' ? 'page' : undefined}>{t('latihan.kuis_konsep')}</a>
        </nav>
        {tab === 'hitung' ? <DaftarSoalHitung kasusSekarang={kasusSekarang} saatKerjakan={saatKerjakan} /> : <PapanKuis />}
      </div>
    </main>
  );
}
