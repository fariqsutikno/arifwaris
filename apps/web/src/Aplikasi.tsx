// Rangkaian aplikasi: reducer keadaan, autosave, header global, dan pemilihan layar.

import { useEffect, useReducer, useState } from 'react';
import type { SoalHitung } from '@waris/content';
import { unduhKasus } from './berkas';
import { muatLokal, simpanLokal, type Kasus } from './kasus';
import { keadaanAwal, pengurangKeadaan, type Aksi } from './keadaan';
import { TUR } from './konten/tur';
import { bacaTujuan, simpanCatatan, simpanTujuan, sudahLihatTur } from './preferensi';
import { Tur } from './tur/Tur';
import { Beranda } from './layar/Beranda';
import { Hasil } from './layar/Hasil';
import { Kepala } from './layar/Kepala';
import { Wizard } from './layar/Wizard';
import { Belajar } from './layar/belajar/Belajar';
import { Glosarium } from './layar/belajar/Glosarium';
import { Latihan } from './layar/belajar/Latihan';
import { Materi } from './layar/belajar/Materi';
import { kasusDariContoh } from './layar/belajar/contoh';
import { Rujukan } from './layar/belajar/Rujukan';
import { TAUTAN_KALKULATOR, useRute } from './rute';

export function Aplikasi() {
  const [keadaan, kirimAsli] = useReducer(pengurangKeadaan, null, () => keadaanAwal(muatLokal(), bacaTujuan()));
  // Kasus tersimpan hanya dihapus lewat ULANGI, dan langsung (sebelum render berikutnya) supaya beranda
  // tidak menawarkan kasus yang baru saja dihapus. MULAI (kasus null sementara) tidak menimpa simpanan lama.
  // Soal latihan yang sedang dikerjakan di kalkulator; ditandai selesai saat jawabannya dibuka.
  const [soalAktif, setSoalAktif] = useState<string | null>(null);
  const kirim = (aksi: Aksi) => {
    if (aksi.jenis === 'ULANGI') simpanLokal(null);
    if (aksi.jenis === 'ULANGI' || aksi.jenis === 'MULAI' || aksi.jenis === 'MUAT') setSoalAktif(null);
    kirimAsli(aksi);
  };

  useEffect(() => { if (keadaan.kasus) simpanLokal(keadaan.kasus); }, [keadaan.kasus]);
  useEffect(() => { if (keadaan.tujuan) simpanTujuan(keadaan.tujuan); }, [keadaan.tujuan]);

  const { kasus, layar } = keadaan;
  const rute = useRute();
  const diKalkulator = rute.halaman === 'kalkulator';
  const daftarTur = diKalkulator ? TUR[layar] ?? [] : [];
  const [turBerjalan, setTurBerjalan] = useState(false);
  // Contoh dari materi dibuka di layar hasil; konfirmasi menimpa kasus lama sudah ditanyakan di halaman materi.
  const cobaDiKalkulator = (kasusContoh: Kasus) => { kirim({ jenis: 'MUAT', kasus: kasusContoh }); window.location.hash = TAUTAN_KALKULATOR; };
  const kerjakanSoal = (soal: SoalHitung) => {
    kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'belajar' });
    cobaDiKalkulator(kasusDariContoh(soal.kasus));
    setSoalAktif(soal.kode);
  };
  // Otomatis sekali di kunjungan pertama tiap layar yang punya tur.
  useEffect(() => {
    if (daftarTur.length > 0 && !sudahLihatTur(layar)) setTurBerjalan(true);
  }, [layar, diKalkulator]);
  return (
    <>
      <Kepala halaman={rute.halaman} adaKasus={diKalkulator && !!kasus && layar !== 'beranda'} adaTur={daftarTur.length > 0}
        saatKeBeranda={() => { window.location.hash = TAUTAN_KALKULATOR; kirim({ jenis: 'KE_LAYAR', layar: 'beranda' }); }} saatTur={() => setTurBerjalan(true)}
        saatUlangi={() => kirim({ jenis: 'ULANGI' })} saatSimpan={() => kasus && unduhKasus(kasus)} />
      {rute.halaman === 'belajar' ? <Belajar />
        : rute.halaman === 'materi' ? <Materi slug={rute.slug} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'latihan' ? <Latihan tab={rute.tab} kasusSekarang={kasus} saatKerjakan={kerjakanSoal} />
        : rute.halaman === 'glosarium' ? <Glosarium id={rute.id} />
        : rute.halaman === 'rujukan' ? <Rujukan kode={rute.kode} />
        : layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
        : layar === 'beranda' || !kasus ? <Beranda kasusTersimpan={muatLokalAtau(kasus)} kirim={kirim} />
        : <Hasil kasus={kasus} tujuan={keadaan.tujuan} kirim={kirim}
            saatJawabanDibuka={soalAktif ? () => simpanCatatan('soal', soalAktif, 'selesai') : undefined} />}
      <Tur daftar={daftarTur} kunci={layar} sedangBerjalan={turBerjalan} saatSelesai={() => setTurBerjalan(false)} />
    </>
  );
}

/** Di beranda, tawarkan kasus yang sedang dikerjakan; bila belum ada, yang tersimpan di perangkat. */
const muatLokalAtau = (kasus: ReturnType<typeof muatLokal>) => kasus ?? muatLokal();
