// Rangkaian aplikasi: reducer keadaan, autosave, header global, dan pemilihan layar.

import { useEffect, useReducer, useState } from 'react';
import type { SoalHitung } from '@waris/content';
import { keJson, muatLokal, simpanLokal, type Kasus } from './kasus';
import { TOTAL_LANGKAH, keadaanAwal, pengurangKeadaan, type Aksi } from './keadaan';
import { TUR } from './konten/tur';
import { bacaTujuan, catatAktivitas, simpanCatatan, simpanTujuan, sudahLihatTur } from './preferensi';
import { Tur } from './tur/Tur';
import { AwalHitung } from './layar/AwalHitung';
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
import { bacaRiwayat, catatBilaBelumAda, catatRiwayat, type EntriRiwayat, type SumberRiwayat } from './riwayat';
import { HalamanRiwayat } from './layar/Riwayat';
import { kasusLengkap } from './layar/KonfirmasiKasusBaru';
import { TAUTAN_KALKULATOR, bacaRute, useRute } from './rute';
import { KepalaHalaman } from './ui/KepalaHalaman';
import { usePenjaga } from './ui/Penjaga';

export function Aplikasi() {
  const [keadaan, kirimAsli] = useReducer(pengurangKeadaan, null, () => keadaanAwal(muatLokal(), bacaTujuan()));
  // Kasus tersimpan hanya dihapus lewat ULANGI, dan langsung (sebelum render berikutnya) supaya beranda
  // tidak menawarkan kasus yang baru saja dihapus. MULAI (kasus null sementara) tidak menimpa simpanan lama.
  // Soal latihan yang sedang dikerjakan di kalkulator; ditandai selesai saat jawabannya dibuka.
  const [soalAktif, setSoalAktif] = useState<SoalHitung | null>(null);
  // Sesi riwayat: satu entri riwayat per kasus yang dimulai/dibuka; perubahan di layar hasil memperbarui entrinya.
  const [idSesi, setIdSesi] = useState(buatIdSesi);
  const [sumberSesi, setSumberSesi] = useState<SumberRiwayat>({ jenis: 'sendiri' });
  const kirim = (aksi: Aksi) => {
    if (aksi.jenis === 'ULANGI') simpanLokal(null);
    if (aksi.jenis === 'ULANGI' || aksi.jenis === 'MULAI' || aksi.jenis === 'MUAT') {
      // Kasus tersimpan yang belum pernah masuk riwayat (dari versi lama) dicatat dulu sebelum diganti, supaya tidak hilang.
      if (keadaan.kasus) catatBilaBelumAda(idSesi, keadaan.kasus, Date.now());
      setSoalAktif(null);
      setIdSesi(buatIdSesi());
      setSumberSesi({ jenis: 'sendiri' });
    }
    kirimAsli(aksi);
  };

  useEffect(() => { if (keadaan.kasus) simpanLokal(keadaan.kasus); }, [keadaan.kasus]);
  useEffect(() => { if (keadaan.tujuan) simpanTujuan(keadaan.tujuan); }, [keadaan.tujuan]);
  // Setiap kasus yang sedang diisi atau dilihat hasilnya masuk riwayat, lengkap atau belum.
  useEffect(() => {
    if (keadaan.layar !== 'awal' && keadaan.kasus) catatRiwayat(idSesi, keadaan.kasus, Date.now(), sumberSesi);
  }, [keadaan.layar, keadaan.kasus, idSesi, sumberSesi]);

  const { kasus, layar } = keadaan;
  const rute = useRute();
  const diKalkulator = rute.halaman === 'kalkulator';
  const daftarTur = diKalkulator ? TUR[layar] ?? [] : [];
  // Keluar dari Hitung saat ada kasus di wizard/hasil: tanya dulu, dan beri tahu di mana kasusnya bisa dilanjutkan.
  usePenjaga(diKalkulator && !!kasus && layar !== 'awal', {
    berlaku: href => !['kalkulator', 'riwayat'].includes(bacaRute(href).halaman),
    judul: 'Tinggalkan ArifLab?',
    isi: <p>{soalAktif ? 'Soal ini bisa kamu buka lagi kapan saja dari Latihan.'
      : 'Kasusmu tersimpan di Riwayat hitung. Buka menu ArifLab kapan saja untuk melanjutkan.'}</p>,
    labelTetap: 'Tetap di sini',
    labelPergi: 'Pindah',
  });
  const [turBerjalan, setTurBerjalan] = useState(false);
  // Kasus lengkap dibuka di layar hasil, yang belum lengkap di langkah wizard pertama yang belum terisi.
  // Konfirmasi menimpa kasus lama sudah ditanyakan di halaman asalnya.
  const bukaDiHitung = (kasusBaru: Kasus, sumber: SumberRiwayat) => {
    kirim({ jenis: 'MUAT', kasus: kasusBaru });
    if (!kasusLengkap(kasusBaru)) kirim({ jenis: 'KE_LANGKAH', langkah: TOTAL_LANGKAH });
    setSumberSesi(sumber);
    window.location.hash = TAUTAN_KALKULATOR;
  };
  const cobaDiKalkulator = (kasusContoh: Kasus) => bukaDiHitung(kasusContoh, { jenis: 'materi' });
  const bukaRiwayat = (entri: EntriRiwayat) => {
    bukaDiHitung(entri.kasus, entri.sumber);
    setIdSesi(entri.id);
    catatRiwayat(entri.id, entri.kasus, Date.now(), entri.sumber);
  };
  // Lanjut kasus terakhir. Kasus yang masih dimuat cukup ditampilkan lagi (sesi & mode belajar tetap);
  // selain itu pakai entri riwayatnya bila ada, supaya sumbernya tidak berubah.
  const lanjutkan = (kasusLama: Kasus) => {
    if (kasusLama === kasus) {
      kirim(kasusLengkap(kasus) ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: TOTAL_LANGKAH });
      return;
    }
    const entri = bacaRiwayat().find(isi => keJson(isi.kasus) === keJson(kasusLama));
    if (entri) bukaRiwayat(entri);
    else bukaDiHitung(kasusLama, { jenis: 'sendiri' });
  };
  // Menu Hitung selalu membuka awal Hitung (skenario baru / lanjut / impor); kasus yang ada tetap dimuat.
  const keAwalHitung = () => kirim({ jenis: 'KE_LAYAR', layar: 'awal' });
  const kerjakanSoal = (soal: SoalHitung) => {
    kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'belajar' });
    bukaDiHitung(kasusDariContoh(soal.kasus), { jenis: 'latihan', kode: soal.kode });
    setSoalAktif(soal);
  };
  // Otomatis sekali di kunjungan pertama tiap layar yang punya tur.
  useEffect(() => {
    if (daftarTur.length > 0 && !sudahLihatTur(layar)) setTurBerjalan(true);
  }, [layar, diKalkulator]);
  return (
    <>
      <Kepala halaman={rute.halaman} kasusWizard={diKalkulator && layar === 'wizard' ? kasus : null}
        adaTur={daftarTur.length > 0} saatKeHitung={keAwalHitung} saatTur={() => setTurBerjalan(true)}
        saatUlangi={() => kirim({ jenis: 'ULANGI' })} />
      {!['beranda', 'kalkulator', 'belajar'].includes(rute.halaman) && !(rute.halaman === 'latihan' && rute.paket) && <KepalaHalaman rute={rute} />}
      {rute.halaman === 'beranda' ? <Beranda kasusTerakhir={muatLokalAtau(kasus)} saatKeHitung={keAwalHitung} />
        : rute.halaman === 'belajar' ? <Belajar />
        : rute.halaman === 'materi' ? <Materi slug={rute.slug} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'latihan' ? <Latihan tab={rute.tab} paket={rute.paket} kasusSekarang={kasus} saatKerjakan={kerjakanSoal} />
        : rute.halaman === 'riwayat' ? <HalamanRiwayat kasusSekarang={kasus} saatBuka={bukaRiwayat} />
        : rute.halaman === 'faq' ? <Faq id={rute.id} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'glosarium' ? <Glosarium id={rute.id} />
        : rute.halaman === 'rujukan' ? <Rujukan kode={rute.kode} kategori={rute.kategori} kitab={rute.kitab} />
        : layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
        : layar === 'awal' || !kasus ? <AwalHitung kasusTersimpan={muatLokalAtau(kasus)} kirim={kirim} saatLanjut={lanjutkan} saatBukaRiwayat={bukaRiwayat} saatImpor={kasusImpor => bukaDiHitung(kasusImpor, { jenis: 'impor' })} saatKerjakanSoal={kerjakanSoal} />
        : <Hasil kasus={kasus} tujuan={keadaan.tujuan} kirim={kirim} terkunci={sumberSesi.jenis === 'latihan' || sumberSesi.jenis === 'materi'}
            saatDikerjakan={soalAktif ? () => tandaiSoalDikerjakan(soalAktif) : undefined}  />}
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
