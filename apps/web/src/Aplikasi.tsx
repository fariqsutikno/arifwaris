// Rangkaian aplikasi: reducer keadaan, autosave ke localStorage, dan pemilihan layar.

import { useEffect, useReducer } from 'react';
import { keJson, muatLokal, simpanLokal } from './kasus';
import { keadaanAwal, pengurangKeadaan } from './keadaan';
import { BilahNavigasi, Tombol } from './ui/komponen';
import { Beranda } from './layar/Beranda';
import { Hasil } from './layar/Hasil';
import { ModeBelajar } from './layar/ModeBelajar';
import { Wizard } from './layar/Wizard';

export function Aplikasi() {
  const [keadaan, kirim] = useReducer(pengurangKeadaan, null, () => keadaanAwal(muatLokal()));
  useEffect(() => simpanLokal(keadaan.kasus), [keadaan.kasus]);

  const kasus = keadaan.kasus;
  const tombolSimpan = kasus && keadaan.layar !== 'beranda'
    ? <Tombol varian="secondary" kecil onClick={() => unduhJson(keJson(kasus))}>Simpan file</Tombol>
    : undefined;

  return (
    <>
      <BilahNavigasi saatKeBeranda={() => kirim({ jenis: 'KE_LAYAR', layar: 'beranda' })} aksi={tombolSimpan} />
      {keadaan.layar === 'beranda' || !kasus
        ? <Beranda kasusTersimpan={kasus} kirim={kirim} />
        : keadaan.layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
        : keadaan.layar === 'hasil' ? <Hasil kasus={kasus} kirim={kirim} />
        : <ModeBelajar kasus={kasus} kirim={kirim} />}
    </>
  );
}

function unduhJson(teks: string) {
  const tautan = document.createElement('a');
  tautan.href = URL.createObjectURL(new Blob([teks], { type: 'application/json' }));
  tautan.download = 'kasus-waris.json';
  tautan.click();
  URL.revokeObjectURL(tautan.href);
}
