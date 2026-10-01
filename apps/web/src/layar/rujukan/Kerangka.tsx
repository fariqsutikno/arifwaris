// Kerangka semua layar Rujukan: banner gelap selebar layar (nav menyatu di atasnya) berisi Kembali, Bagikan, judul,
// dan satu kalimat penjelas, lalu isi di bawahnya. Kerangka yang sama dengan Materi, supaya Rujukan terasa satu keluarga.

import { useEffect, type ReactNode } from 'react';
import { t } from '../../terjemah';
import { Bagikan } from '../../ui/Bagikan';
import { Ikon } from '../../ui/Ikon';

interface Props { label?: string | undefined; judul: string; lead?: string | undefined; kembali: string; tambahan?: ReactNode; children: ReactNode }

export function Kerangka({ label, judul, lead, kembali, tambahan, children }: Props) {
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  return (
    <div className="halaman-beranda halaman-materi halaman-rujukan">
      <header className="hero-materi">
        <div className="baris-hero-materi">
          <a className="tombol-kembali" href={kembali}><Ikon nama="kembali" ukuran={18} />{t('umum.kembali_2')}</a>
          <Bagikan judul={t('umum.rujukan_faraidh')} tautan={window.location.hash} />
        </div>
        {label && <p className="label-langkah">{label}</p>}
        <h1>{judul}</h1>
        {lead && <p className="lead">{lead}</p>}
        {tambahan}
      </header>
      <div className="isi-rujukan">{children}</div>
    </div>
  );
}
