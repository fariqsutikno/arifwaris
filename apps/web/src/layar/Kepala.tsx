// Header global: logo (ke beranda kalkulator), menu utama (Kalkulator · Belajar · Latihan · Rujukan), tur, dan "Ulangi dari awal" dengan konfirmasi di halaman.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanLatihan, tautanRujukan, type Rute } from '../rute';

const MENU: Array<{ label: string; tautan: string; aktifDi: Array<Rute['halaman']> }> = [
  { label: 'Kalkulator', tautan: TAUTAN_KALKULATOR, aktifDi: ['kalkulator'] },
  { label: 'Belajar', tautan: tautanBelajar(), aktifDi: ['belajar', 'materi', 'glosarium', 'faq'] },
  { label: 'Latihan', tautan: tautanLatihan(), aktifDi: ['latihan'] },
  { label: 'Rujukan', tautan: tautanRujukan(), aktifDi: ['rujukan'] },
];

interface Props {
  halaman: Rute['halaman'];
  adaKasus: boolean;
  adaTur: boolean;
  saatKeBeranda: () => void;
  saatTur: () => void;
  saatUlangi: () => void;
  saatSimpan: () => void;
}

export function Kepala({ halaman, adaKasus, adaTur, saatKeBeranda, saatTur, saatUlangi, saatSimpan }: Props) {
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
        {adaTur && <Tombol varian="secondary" kecil onClick={saatTur}>Tur singkat</Tombol>}
        {adaKasus && <Tombol varian="secondary" kecil onClick={() => setSedangKonfirmasi(true)}>Ulangi dari awal</Tombol>}
      </header>
      {sedangKonfirmasi && (
        <KonfirmasiKasusBaru saatSimpan={saatSimpan} saatBatal={() => setSedangKonfirmasi(false)}
          saatLanjut={() => { setSedangKonfirmasi(false); saatUlangi(); }} />
      )}
    </>
  );
}
