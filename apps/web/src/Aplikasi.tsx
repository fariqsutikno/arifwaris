// Rangkaian aplikasi: reducer keadaan, autosave, header global, dan pemilihan layar.

import { useEffect, useReducer, useState } from 'react';
import type { SoalHitung } from '@waris/content';
import { muatLokal, simpanLokal, type Kasus } from './kasus';
import { keadaanAwal, pengurangKeadaan, type Aksi } from './keadaan';
import { TUR } from './konten/tur';
import { bacaTujuan, catatAktivitas, simpanCatatan, simpanTujuan, sudahLihatTur } from './preferensi';
import { Tur } from './tur/Tur';
import { Beranda } from './layar/Beranda';
import { Hasil } from './layar/Hasil';
import { Kepala } from './layar/Kepala';
import { Wizard } from './layar/Wizard';
import { Belajar } from './layar/belajar/Belajar';
import { Faq } from './layar/belajar/Faq';
import { Glosarium } from './layar/belajar/Glosarium';
import { Latihan } from './layar/belajar/Latihan';
import { Materi } from './layar/belajar/Materi';
import { kasusDariContoh } from './layar/belajar/contoh';
import { Rujukan } from './layar/belajar/Rujukan';
import { catatRiwayat, type EntriRiwayat } from './riwayat';
import { HalamanRiwayat } from './layar/Riwayat';
import { kasusLengkap } from './layar/KonfirmasiKasusBaru';
import { TAUTAN_KALKULATOR, bacaRute, useRute } from './rute';
import { usePenjaga } from './ui/Penjaga';

export function Aplikasi() {
  const [keadaan, kirimAsli] = useReducer(pengurangKeadaan, null, () => keadaanAwal(muatLokal(), bacaTujuan()));
  // Kasus tersimpan hanya dihapus lewat ULANGI, dan langsung (sebelum render berikutnya) supaya beranda
  // tidak menawarkan kasus yang baru saja dihapus. MULAI (kasus null sementara) tidak menimpa simpanan lama.
  // Soal latihan yang sedang dikerjakan di kalkulator; ditandai selesai saat jawabannya dibuka.
  const [soalAktif, setSoalAktif] = useState<SoalHitung | null>(null);
  // Sesi riwayat: satu entri riwayat per kasus yang dimulai/dibuka; perubahan di layar hasil memperbarui entrinya.
  const [idSesi, setIdSesi] = useState(buatIdSesi);
  const kirim = (aksi: Aksi) => {
    if (aksi.jenis === 'ULANGI') simpanLokal(null);
    if (aksi.jenis === 'ULANGI' || aksi.jenis === 'MULAI' || aksi.jenis === 'MUAT') {
      // Kasus yang sudah sampai hasil dicatat dulu ke riwayat sebelum diganti, supaya tidak hilang.
      if (keadaan.kasus && kasusLengkap(keadaan.kasus) && !soalAktif) catatRiwayat(idSesi, keadaan.kasus, Date.now());
      setSoalAktif(null);
      setIdSesi(buatIdSesi());
    }
    kirimAsli(aksi);
  };

  useEffect(() => { if (keadaan.kasus) simpanLokal(keadaan.kasus); }, [keadaan.kasus]);
  useEffect(() => { if (keadaan.tujuan) simpanTujuan(keadaan.tujuan); }, [keadaan.tujuan]);
  // Soal latihan tidak masuk riwayat hitung; progresnya sudah tercatat di Latihan.
  useEffect(() => {
    if (keadaan.layar === 'hasil' && keadaan.kasus && !soalAktif) catatRiwayat(idSesi, keadaan.kasus, Date.now());
  }, [keadaan.layar, keadaan.kasus, idSesi, soalAktif]);

  const { kasus, layar } = keadaan;
  const rute = useRute();
  const diKalkulator = rute.halaman === 'kalkulator';
  const daftarTur = diKalkulator ? TUR[layar] ?? [] : [];
  // Keluar dari Hitung saat ada kasus di wizard/hasil: tanya dulu, dan beri tahu di mana kasusnya bisa dilanjutkan.
  usePenjaga(diKalkulator && !!kasus && layar !== 'beranda', {
    berlaku: href => !['kalkulator', 'riwayat'].includes(bacaRute(href).halaman),
    judul: 'Tinggalkan Hitung?',
    isi: <p>{soalAktif ? 'Soal ini bisa kamu buka lagi kapan saja dari Latihan.'
      : kasusLengkap(kasus) ? 'Kasusmu sudah tersimpan di Riwayat hitung. Buka menu Hitung kapan saja untuk melanjutkan.'
      : 'Isianmu tetap tersimpan di perangkat ini. Buka menu Hitung, lalu Lanjutkan kasus terakhir.'}</p>,
    labelTetap: 'Tetap di sini',
    labelPergi: 'Pindah',
  });
  const [turBerjalan, setTurBerjalan] = useState(false);
  // Contoh dari materi dibuka di layar hasil; konfirmasi menimpa kasus lama sudah ditanyakan di halaman materi.
  const cobaDiKalkulator = (kasusContoh: Kasus) => { kirim({ jenis: 'MUAT', kasus: kasusContoh }); window.location.hash = TAUTAN_KALKULATOR; };
  const bukaRiwayat = (entri: EntriRiwayat) => { cobaDiKalkulator(entri.kasus); setIdSesi(entri.id); };
  const kerjakanSoal = (soal: SoalHitung) => {
    kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'belajar' });
    cobaDiKalkulator(kasusDariContoh(soal.kasus));
    setSoalAktif(soal);
  };
  // Otomatis sekali di kunjungan pertama tiap layar yang punya tur.
  useEffect(() => {
    if (daftarTur.length > 0 && !sudahLihatTur(layar)) setTurBerjalan(true);
  }, [layar, diKalkulator]);
  return (
    <>
      <Kepala halaman={rute.halaman} kasus={diKalkulator && layar !== 'beranda' ? kasus : null} adaTur={daftarTur.length > 0}
        saatKeBeranda={() => { window.location.hash = TAUTAN_KALKULATOR; kirim({ jenis: 'KE_LAYAR', layar: 'beranda' }); }} saatTur={() => setTurBerjalan(true)}
        saatUlangi={() => kirim({ jenis: 'ULANGI' })} />
      {rute.halaman === 'belajar' ? <Belajar />
        : rute.halaman === 'materi' ? <Materi slug={rute.slug} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'latihan' ? <Latihan tab={rute.tab} paket={rute.paket} kasusSekarang={kasus} saatKerjakan={kerjakanSoal} />
        : rute.halaman === 'riwayat' ? <HalamanRiwayat kasusSekarang={kasus} saatBuka={bukaRiwayat} />
        : rute.halaman === 'faq' ? <Faq id={rute.id} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'glosarium' ? <Glosarium id={rute.id} />
        : rute.halaman === 'rujukan' ? <Rujukan kode={rute.kode} kategori={rute.kategori} kitab={rute.kitab} />
        : layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
        : layar === 'beranda' || !kasus ? <Beranda kasusTersimpan={muatLokalAtau(kasus)} kirim={kirim} saatBukaRiwayat={bukaRiwayat} />
        : <Hasil kasus={kasus} tujuan={keadaan.tujuan} kirim={kirim}
            saatDikerjakan={soalAktif ? () => tandaiSoalDikerjakan(soalAktif) : undefined} tersimpanDiRiwayat={!soalAktif} />}
      <Tur daftar={daftarTur} kunci={layar} sedangBerjalan={turBerjalan} saatSelesai={() => setTurBerjalan(false)} />
    </>
  );
}

/** Di beranda, tawarkan kasus yang sedang dikerjakan; bila belum ada, yang tersimpan di perangkat. */
const muatLokalAtau = (kasus: ReturnType<typeof muatLokal>) => kasus ?? muatLokal();

/** Id sesi riwayat; cukup unik di satu perangkat. */
const buatIdSesi = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function tandaiSoalDikerjakan(soal: SoalHitung): void {
  simpanCatatan('soal', soal.kode, 'selesai');
  catatAktivitas({ jenis: 'soal', kode: soal.kode, judul: soal.judul, waktu: Date.now() });
}
