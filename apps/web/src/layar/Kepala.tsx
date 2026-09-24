// Header global: logo (ke beranda), menu utama, tur, dan "Ulangi dari awal" dengan konfirmasi di halaman.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';

interface Props {
  adaKasus: boolean;
  adaTur: boolean;
  saatKeBeranda: () => void;
  saatTur: () => void;
  saatUlangi: () => void;
  saatSimpan: () => void;
}

export function Kepala({ adaKasus, adaTur, saatKeBeranda, saatTur, saatUlangi, saatSimpan }: Props) {
  const [sedangKonfirmasi, setSedangKonfirmasi] = useState(false);
  return (
    <>
      <header className="kepala" role="banner">
        <Logo saatKlik={saatKeBeranda} />
        <nav aria-label="Menu utama"><a href="#" aria-current="page" className="kepala-menu">Kalkulator</a></nav>
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
