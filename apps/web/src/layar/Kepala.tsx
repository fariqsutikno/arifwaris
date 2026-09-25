// Header global: logo (ke beranda kalkulator), menu utama (Hitung · Belajar · Latihan · Rujukan), tur, dan "Ulangi dari awal" dengan konfirmasi di halaman.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';
import type { Kasus } from '../kasus';
import { Ikon } from '../ui/Ikon';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanLatihan, tautanRujukan, type Rute } from '../rute';

const MENU: Array<{ label: string; tautan: string; aktifDi: Array<Rute['halaman']> }> = [
  { label: 'Hitung', tautan: TAUTAN_KALKULATOR, aktifDi: ['kalkulator', 'riwayat'] },
  { label: 'Belajar', tautan: tautanBelajar(), aktifDi: ['belajar', 'materi', 'glosarium', 'faq'] },
  { label: 'Latihan', tautan: tautanLatihan(), aktifDi: ['latihan'] },
  { label: 'Rujukan', tautan: tautanRujukan(), aktifDi: ['rujukan'] },
];

interface Props {
  halaman: Rute['halaman'];
  /** Kasus yang bisa diulang dari awal; null = tombol Ulangi tidak tampil. */
  kasus: Kasus | null;
  adaTur: boolean;
  saatKeBeranda: () => void;
  saatTur: () => void;
  saatUlangi: () => void;
}

export function Kepala({ halaman, kasus, adaTur, saatKeBeranda, saatTur, saatUlangi }: Props) {
  const [sedangKonfirmasi, setSedangKonfirmasi] = useState(false);
  return (
    <>
      <header className="kepala" role="banner">
        <Logo saatKlik={saatKeBeranda} />
        <nav aria-label="Menu utama" className="kepala-nav">
          {MENU.map(menu => (
            <a key={menu.label} href={menu.tautan} className="kepala-menu" aria-current={menu.aktifDi.includes(halaman) ? 'page' : undefined}>{menu.label}</a>
          ))}
        </nav>
        <span className="pengisi" />
        {/* Di layar sempit hanya ikon (label tetap dibaca pembaca layar lewat aria-label). */}
        {kasus && <Tombol varian="secondary" kecil className="tombol-kepala" aria-label="Beranda Hitung" onClick={saatKeBeranda}><Ikon nama="rumah" ukuran={18} /><span className="label-lebar">Beranda Hitung</span></Tombol>}
        {adaTur && <Tombol varian="secondary" kecil className="tombol-kepala" aria-label="Tur singkat" onClick={saatTur}><Ikon nama="tanya" ukuran={18} /><span className="label-lebar">Tur singkat</span></Tombol>}
        {kasus && <Tombol varian="secondary" kecil className="tombol-kepala" aria-label="Ulangi dari awal" onClick={() => setSedangKonfirmasi(true)}><Ikon nama="riwayat" ukuran={18} /><span className="label-lebar">Ulangi dari awal</span></Tombol>}
      </header>
      {sedangKonfirmasi && kasus && (
        <KonfirmasiKasusBaru kasus={kasus} saatBatal={() => setSedangKonfirmasi(false)}
          saatLanjut={() => { setSedangKonfirmasi(false); saatUlangi(); }} />
      )}
    </>
  );
}
