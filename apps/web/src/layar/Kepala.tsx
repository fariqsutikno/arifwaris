// Header global: logo (ke beranda), menu utama, tur, dan "Ulangi dari awal" dengan konfirmasi di halaman.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';

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
        <div className="konfirmasi" role="alertdialog" aria-labelledby="judul-konfirmasi" aria-describedby="isi-konfirmasi">
          <div className="konfirmasi-isi">
            <h2 id="judul-konfirmasi">Mulai kasus baru?</h2>
            <p id="isi-konfirmasi">Kasus yang sedang diisi akan dihapus dari perangkat ini. Mau simpan file-nya dulu?</p>
            <div className="chip-deret">
              <Tombol varian="secondary" onClick={saatSimpan}>Simpan file dulu</Tombol>
              <Tombol onClick={() => { setSedangKonfirmasi(false); saatUlangi(); }}>Hapus dan mulai baru</Tombol>
              <Tombol varian="ghost" onClick={() => setSedangKonfirmasi(false)}>Batal</Tombol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
