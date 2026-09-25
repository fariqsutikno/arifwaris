// Header global: logo (ke beranda kalkulator), menu utama (Kalkulator · Glosarium · Rujukan), tur, dan "Ulangi dari awal" dengan konfirmasi di halaman.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { TAUTAN_KALKULATOR, tautanGlosarium, tautanRujukan, type Rute } from '../rute';

const MENU: Array<{ halaman: Rute['halaman']; label: string; tautan: string }> = [
  { halaman: 'kalkulator', label: 'Kalkulator', tautan: TAUTAN_KALKULATOR },
  { halaman: 'glosarium', label: 'Glosarium', tautan: tautanGlosarium() },
  { halaman: 'rujukan', label: 'Rujukan', tautan: tautanRujukan() },
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
            <a key={menu.halaman} href={menu.tautan} className="kepala-menu" aria-current={menu.halaman === halaman ? 'page' : undefined}>{menu.label}</a>
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
