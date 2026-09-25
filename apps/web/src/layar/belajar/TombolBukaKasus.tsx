// Tombol yang membuka sebuah kasus (contoh materi, soal latihan) di kalkulator. Bila kalkulator sedang memuat
// kasus lain, tanya dulu supaya kasus itu tidak tertimpa diam-diam (sama seperti "Ulangi dari awal").

import { useState, type ReactNode } from 'react';
import type { Kasus } from '../../kasus';
import { Tombol } from '../../ui/komponen';
import { KonfirmasiKasusBaru } from '../KonfirmasiKasusBaru';

interface Props { kasusSekarang: Kasus | null; saatBuka: () => void; varian?: 'primary' | 'secondary'; children: ReactNode }

export function TombolBukaKasus({ kasusSekarang, saatBuka, varian = 'secondary', children }: Props) {
  const [sedangKonfirmasi, setSedangKonfirmasi] = useState(false);
  return (
    <>
      <Tombol varian={varian} kecil onClick={() => (kasusSekarang ? setSedangKonfirmasi(true) : saatBuka())}>{children}</Tombol>
      {sedangKonfirmasi && kasusSekarang && (
        <KonfirmasiKasusBaru kasus={kasusSekarang} judul="Buka kasus ini?" labelLanjut="Buka" saatBatal={() => setSedangKonfirmasi(false)}
          saatLanjut={() => { setSedangKonfirmasi(false); saatBuka(); }} />
      )}
    </>
  );
}
