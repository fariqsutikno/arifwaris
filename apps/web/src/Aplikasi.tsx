// Rangkaian aplikasi: reducer keadaan, autosave, header global, dan pemilihan layar.

import { useEffect, useReducer, useRef, useState } from 'react';
import { unduhKasus } from './berkas';
import { muatLokal, simpanLokal } from './kasus';
import { keadaanAwal, pengurangKeadaan, type Aksi } from './keadaan';
import { TUR } from './konten/tur';
import { bacaTujuan, simpanTujuan, sudahLihatTur } from './preferensi';
import { Tur } from './tur/Tur';
import { Beranda } from './layar/Beranda';
import { Hasil } from './layar/Hasil';
import { Kepala } from './layar/Kepala';
import { ModeBelajar } from './layar/ModeBelajar';
import { Wizard } from './layar/Wizard';

export function Aplikasi() {
  const [keadaan, kirimAsli] = useReducer(pengurangKeadaan, null, () => keadaanAwal(muatLokal(), bacaTujuan()));
  // Kasus tersimpan hanya dihapus lewat ULANGI; MULAI (kasus null sementara) tidak menimpa simpanan lama.
  const hapusSimpanan = useRef(false);
  const kirim = (aksi: Aksi) => { if (aksi.jenis === 'ULANGI') hapusSimpanan.current = true; kirimAsli(aksi); };

  useEffect(() => {
    if (keadaan.kasus || hapusSimpanan.current) simpanLokal(keadaan.kasus);
    hapusSimpanan.current = false;
  }, [keadaan.kasus]);
  useEffect(() => { if (keadaan.tujuan) simpanTujuan(keadaan.tujuan); }, [keadaan.tujuan]);

  const { kasus, layar } = keadaan;
  const daftarTur = TUR[layar] ?? [];
  const [turBerjalan, setTurBerjalan] = useState(false);
  // Otomatis sekali di kunjungan pertama tiap layar yang punya tur.
  useEffect(() => {
    if (daftarTur.length > 0 && !sudahLihatTur(layar)) setTurBerjalan(true);
  }, [layar]);
  return (
    <>
      <Kepala adaKasus={!!kasus && layar !== 'beranda'} adaTur={daftarTur.length > 0}
        saatKeBeranda={() => kirim({ jenis: 'KE_LAYAR', layar: 'beranda' })} saatTur={() => setTurBerjalan(true)}
        saatUlangi={() => kirim({ jenis: 'ULANGI' })} saatSimpan={() => kasus && unduhKasus(kasus)} />
      {layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
        : layar === 'beranda' || !kasus ? <Beranda kasusTersimpan={muatLokalAtau(kasus)} kirim={kirim} />
        : layar === 'hasil' ? <Hasil kasus={kasus} kirim={kirim} />
        : <ModeBelajar kasus={kasus} kirim={kirim} />}
      <Tur daftar={daftarTur} kunci={layar} sedangBerjalan={turBerjalan} saatSelesai={() => setTurBerjalan(false)} />
    </>
  );
}

/** Di beranda, tawarkan kasus yang sedang dikerjakan; bila belum ada, yang tersimpan di perangkat. */
const muatLokalAtau = (kasus: ReturnType<typeof muatLokal>) => kasus ?? muatLokal();
