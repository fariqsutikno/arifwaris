// Rangkaian aplikasi: reducer keadaan, autosave, header global, dan pemilihan layar.

import { useEffect, useReducer, useState } from 'react';
import type { SoalHitung } from '@waris/content';
import type { Sesi } from '@waris/data';
import { muatRepoAkun, type RepoAkun } from './akun/klien';
import { keluarDanBersihkan, mulaiSinkron } from './akun/sinkron';
import { StreakKepala } from './akun/StreakKepala';
import { TombolAkun } from './akun/TombolAkun';
import { LonceNotifikasi } from './notifikasi/LonceNotifikasi';
import { SumberNotifikasi } from './notifikasi/SumberNotifikasi';
import { keJson, keJsonDibagikan, muatLokal, simpanLokal, type Kasus } from './kasus';
import { TOTAL_LANGKAH, keadaanAwal, pengurangKeadaan, type Aksi, type KeadaanAplikasi } from './keadaan';
import { TUR } from './konten/tur';
import { bacaTujuan, catatAktivitas, simpanTujuan, sudahLihatTur, bacaBahasa, type Tujuan } from './preferensi';
import { bacaProgresLatihan, catatLatihan } from './progres';
import { judulSoalTampil } from './layar/belajar/judulSoal';
import { t } from './terjemah';
import { Tur } from './tur/Tur';
import { AwalHitung } from './layar/AwalHitung';
import { PintuLab } from './layar/PintuLab';
import { Beranda } from './layar/Beranda';
import { Hasil } from './layar/Hasil';
import { Kepala } from './layar/Kepala';
import { PilihanMenunggu } from './layar/PeriksaCerita';
import { Wizard } from './layar/Wizard';
import { Belajar } from './layar/belajar/Belajar';
import { Faq } from './layar/belajar/Faq';
import { TanyaJawab } from './layar/belajar/TanyaJawab';
import { Glosarium } from './layar/belajar/Glosarium';
import { Latihan } from './layar/belajar/Latihan';
import { Materi } from './layar/belajar/Materi';
import { cariSoalHitung, daftarSoalHitung, revisiIdSoalHitung } from './konten/sumber';
import { judulTopik, urutanSoalHitung } from './layar/belajar/KuisKonsep';
import { Rujukan } from './layar/rujukan/Rujukan';
import { adalahKasusPengguna, bacaRiwayat, catatBilaBelumAda, catatRiwayat, type EntriRiwayat, type SumberRiwayat } from './riwayat';
import { bacaSemuaIsianSoal, naikkanPercobaanSoal } from './isianSoal';
import { soalSelesai, statusSoal } from './layar/belajar/statusSoal';
import { HalamanRiwayat } from './layar/Riwayat';
import { Peringkat } from './layar/Peringkat';
import { Privasi } from './layar/Privasi';
import { Syarat } from './layar/Syarat';
import { DialogPersetujuan } from './akun/DialogPersetujuan';
import { perluSetujuKebijakan } from './akun/persetujuan';
import { KasusDibagikan } from './layar/KasusDibagikan';
import { sudahDibagikan } from './bagikanLokal';
import { kasusLengkap } from './layar/KonfirmasiKasusBaru';
import { bolehDiHasil } from './layar/wizard/validasi';
import { TAUTAN_KALKULATOR, bacaRute, tautanKasus, tautanLatihan, tautanSoal, useRute } from './rute';
import { KepalaHalaman } from './ui/KepalaHalaman';
import { Dok } from './ui/Dok';
import { Toast, type IsiToast } from './ui/Toast';
import { hapusKasus, pulihkanKasus } from './kasusmu';
import { usePenjaga } from './ui/Penjaga';
import { PembaruanKonten } from './ui/PembaruanKonten';
import { kasusDariSoal } from '@waris/latihan';

const JEDA_PERBARUI_BAGIKAN_MS = 1500;

export function Aplikasi() {
  // Muat ulang / tautan `#/hitung/<id>/...`: kembali ke kasus dan halaman yang sama, bukan awal Hitung.
  const [pulih] = useState(() => pulihDariUrl(window.location.hash, bacaTujuan()));
  // Muat ulang di `#/latihan/soal/<kode>`: soal dibuka lagi dari bank soal (soal tidak masuk riwayat).
  const [pulihSoal] = useState(() => pulihDariSoal(window.location.hash, bacaTujuan()));
  const [keadaan, kirimAsli] = useReducer(pengurangKeadaan, null, () => pulih?.keadaan ?? pulihSoal?.keadaan ?? keadaanAwal(muatLokal(), bacaTujuan()));
  // Kasus tersimpan hanya dihapus lewat ULANGI, dan langsung (sebelum render berikutnya) supaya beranda
  // tidak menawarkan kasus yang baru saja dihapus. MULAI (kasus null sementara) tidak menimpa simpanan lama.
  // Soal latihan yang sedang dikerjakan di kalkulator; ditandai selesai saat jawabannya dibuka.
  const [soalAktif, setSoalAktif] = useState<SoalHitung | null>(() => (pulihSoal && !pulihSoal.pembahasan ? pulihSoal.soal : null));
  // Sesi riwayat: satu entri riwayat per kasus yang dimulai/dibuka; perubahan di layar hasil memperbarui entrinya.
  const [idSesi, setIdSesi] = useState(() => pulih?.id ?? buatIdSesi());
  const [sumberSesi, setSumberSesi] = useState<SumberRiwayat>(pulih?.sumber ?? (pulihSoal ? { jenis: 'latihan', kode: pulihSoal.soal.kode } : { jenis: 'sendiri' }));
  // URL kasus yang entrinya tidak ada: pesan umum, sama untuk semua sebab, tanpa id dari URL (P8, P16).
  const [toast, setToast] = useState<IsiToast | null>(() => (!pulih && adalahUrlKasus(window.location.hash) ? { teks: t('hitung.kasus_tidak_ditemukan') } : null));
  // Akun pengguna (opsional, spec akun pengguna "Login"): tanpa env Supabase, repoAkun tetap null dan tombolnya tidak tampil.
  const [repoAkun, setRepoAkun] = useState<RepoAkun | null>(null);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [akunSiap, setAkunSiap] = useState(false);
  const [perluSetuju, setPerluSetuju] = useState(false);
  // ponytail: layar yang menyimpan data di useState awal (mis. DaftarRiwayat) baru segar setelah pindah halaman.
  const [, segarkanData] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    void muatRepoAkun().then(async repo => {
      if (repo) setRepoAkun(repo);
      setAkunSiap(true);
      if (!repo) return;
      setSesi(await mulaiSinkron(repo, segarkanData));
      if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + location.hash);
    });
  }, []);
  // Persetujuan kebijakan privasi: ditanyakan sekali per versi; galat baca tidak memblokir pemakaian.
  useEffect(() => {
    if (!sesi || !repoAkun) return;
    repoAkun.pengguna.bacaPersetujuan().then(daftar => setPerluSetuju(perluSetujuKebijakan(daftar))).catch(() => undefined);
  }, [sesi?.userId, repoAkun]);
  // Hanya tersedia bila masuk akun: tautan bagikan baru bisa dihentikan/diubah lewat sini.
  const bagikanAkun = sesi ? repoAkun?.bagikan : undefined;
  const kirim = (aksi: Aksi) => {
    if (aksi.jenis === 'ULANGI') simpanLokal(null);
    if (aksi.jenis === 'ULANGI' || aksi.jenis === 'MULAI' || aksi.jenis === 'MUAT') {
      // Kasus tersimpan yang belum pernah masuk riwayat (dari versi lama) dicatat dulu sebelum diganti, supaya tidak hilang.
      if (keadaan.kasus && adalahKasusPengguna(sumberSesi)) catatBilaBelumAda(idSesi, keadaan.kasus, Date.now());
      mulaiSesiBaru();
    }
    kirimAsli(aksi);
  };
  const mulaiSesiBaru = () => {
    setSoalAktif(null);
    setIdSesi(buatIdSesi());
    setSumberSesi({ jenis: 'sendiri' });
  };
  // Hapus tuntas lalu kembali ke Awal Hitung. Tidak lewat kirim(ULANGI): itu mencatat kasus yang baru dihapus kembali ke riwayat.
  const hapusKasusIni = () => {
    const cadangan = hapusKasus(idSesi, bagikanAkun);
    simpanLokal(null);
    mulaiSesiBaru();
    kirimAsli({ jenis: 'ULANGI' });
    setToast({ teks: t('hasil.hapus_kasus.toast'), aksi: { label: t('hasil.simpan.urungkan'), saat: () => {
      setToast(null);
      pulihkanKasus(cadangan);
      const entri = cadangan.entriRiwayat;
      if (!entri) return;
      // Hapus hanya dari Hasil, jadi kembali ke Hasil (bukan lewat bukaRiwayat, yang melempar kasus belum lengkap ke wizard).
      kirimAsli({ jenis: 'MUAT', kasus: entri.kasus });
      setIdSesi(entri.id);
      setSumberSesi(entri.sumber);
      catatRiwayat(entri.id, entri.kasus, Date.now(), entri.sumber);
    } } });
  };

  // Soal dan contoh materi bukan "kasus terakhir": Lab Hitung tidak menawarkannya lagi lewat Lanjutkan.
  useEffect(() => { if (keadaan.kasus && adalahKasusPengguna(sumberSesi)) simpanLokal(keadaan.kasus); }, [keadaan.kasus, sumberSesi]);
  // Kasus yang sedang dibagikan: isi di server mengikuti perubahan pemilik (ditunda supaya tidak tiap ketikan).
  useEffect(() => {
    if (!keadaan.kasus || !sesi || !repoAkun || !sudahDibagikan(idSesi)) return;
    const kasusTerbaru = keadaan.kasus;
    const tunda = setTimeout(() => void repoAkun.bagikan.perbaruiKasus(idSesi, JSON.parse(keJsonDibagikan(kasusTerbaru))).catch(() => undefined), JEDA_PERBARUI_BAGIKAN_MS);
    return () => clearTimeout(tunda);
  }, [keadaan.kasus, idSesi, sesi, repoAkun]);
  // Tujuan 'belajar' milik mode soal saja; tidak dijadikan preferensi permanen Lab Hitung.
  useEffect(() => { if (keadaan.tujuan && sumberSesi.jenis !== 'latihan' && keadaan.tujuan !== bacaTujuan()) simpanTujuan(keadaan.tujuan); }, [keadaan.tujuan, sumberSesi.jenis]);
  // Setiap kasus yang sedang diisi atau dilihat hasilnya masuk riwayat, lengkap atau belum.
  useEffect(() => {
    if (keadaan.layar !== 'awal' && keadaan.kasus && adalahKasusPengguna(sumberSesi)) catatRiwayat(idSesi, keadaan.kasus, Date.now(), sumberSesi);
  }, [keadaan.layar, keadaan.kasus, idSesi, sumberSesi]);

  // Bahasa 'ar': seluruh halaman kanan-ke-kiri. Ganti bahasa memuat ulang halaman (Kepala), jadi cukup dipasang sekali.
  useEffect(() => {
    const arab = bacaBahasa() === 'ar';
    document.documentElement.lang = arab ? 'ar' : 'id';
    document.documentElement.dir = arab ? 'rtl' : 'ltr';
  }, []);

  const { kasus, layar } = keadaan;
  const kasusTerakhir = adalahKasusPengguna(sumberSesi) ? muatLokalAtau(kasus) : muatLokal();
  const rute = useRute();
  const diKalkulator = rute.halaman === 'kalkulator';
  // URL mengikuti posisi kasus; replaceState tidak memicu hashchange dan tidak menambah riwayat browser.
  useEffect(() => {
    if (!diKalkulator) return;
    // Soal punya alamat sendiri (bukan id sesi): sesinya tidak masuk riwayat, jadi muat ulang harus membuka soalnya lagi.
    const tautan = sumberSesi.jenis === 'latihan' && kasus && layar !== 'awal'
      ? tautanSoal(sumberSesi.kode) : tautanKasus(idSesi, { layar, langkah: keadaan.langkah, ada: !!kasus });
    if (window.location.hash !== tautan) history.replaceState(null, '', tautan);
  }, [diKalkulator, idSesi, sumberSesi, layar, keadaan.langkah, !!kasus]);
  // Alamat soal di tab yang sama (muat ulang, tautan, tombol mundur): buka soalnya; kode tak dikenal → pesan umum + daftar Latihan.
  const kodeSoalDiUrl = rute.halaman === 'kalkulator' ? rute.soal : undefined;
  useEffect(() => {
    if (!kodeSoalDiUrl || (sumberSesi.jenis === 'latihan' && sumberSesi.kode === kodeSoalDiUrl)) return;
    const soal = cariSoalHitung(kodeSoalDiUrl);
    if (soal) { kerjakanSoal(soal); return; }
    setToast({ teks: t('latihan.soal_tidak_ditemukan') });
    window.location.hash = tautanLatihan('hitung');
  }, [kodeSoalDiUrl]);
  // Tautan/hash ke kasus lain di tab yang sama: URL jadi sumber, sama seperti muat ulang.
  const idKasusDiUrl = rute.halaman === 'kalkulator' ? rute.kasus?.id : undefined;
  useEffect(() => {
    if (!idKasusDiUrl || idKasusDiUrl === idSesi) return;
    const dariUrl = pulihDariUrl(window.location.hash, bacaTujuan());
    if (!dariUrl) { setToast({ teks: t('hitung.kasus_tidak_ditemukan') }); return; }
    if (keadaan.kasus && adalahKasusPengguna(sumberSesi)) catatBilaBelumAda(idSesi, keadaan.kasus, Date.now());
    setSoalAktif(null);
    setIdSesi(dariUrl.id);
    setSumberSesi(dariUrl.sumber);
    kirimAsli({ jenis: 'PULIHKAN', keadaan: dariUrl.keadaan });
  }, [idKasusDiUrl]);
  const daftarTur = diKalkulator ? TUR[layar] ?? [] : [];
  // Keluar dari Hitung saat ada kasus di wizard/hasil: tanya dulu, dan beri tahu di mana kasusnya bisa dilanjutkan.
  const belumSelesai = !!kasus && layar !== 'awal' && layar !== 'hasil' && !kasusLengkap(kasus);
  // Soal yang sedang ditebak punya isian tersimpan; kasus sendiri ada di riwayat. Pembahasan dan contoh materi tidak menyimpan apa-apa.
  usePenjaga(diKalkulator && !!kasus && layar !== 'awal' && (!!soalAktif || adalahKasusPengguna(sumberSesi)), {
    berlaku: href => !['kalkulator', 'riwayat'].includes(bacaRute(href).halaman),
    judul: belumSelesai ? t('umum.tinggalkan_isian') : t('umum.tinggalkan_ariflab'),
    isi: <p>{belumSelesai ? t('umum.isian_belum_selesai_tersimpan') : soalAktif ? t('umum.tebakanmu_tersimpan_lanjutkan_dari_latihan')
      : t('umum.kasusmu_tersimpan_di_riwayat_hitung_buka')}</p>,
    labelTetap: belumSelesai ? t('umum.lanjut_mengisi') : t('umum.tetap_di_sini'),
    labelPergi: belumSelesai ? t('umum.tinggalkan_saja') : t('umum.pindah'),
  });
  // Tutup tab / muat ulang / alamat lain saat isian belum selesai: konfirmasi bawaan browser.
  useEffect(() => {
    if (!diKalkulator || !belumSelesai) return;
    const cegah = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', cegah);
    return () => window.removeEventListener('beforeunload', cegah);
  }, [diKalkulator, belumSelesai]);
  // Setelah masuk, kembali ke alamat yang sama (termasuk #/k/<slug> atau #/hitung/<id>).
  const masukGoogle = repoAkun ? () => void repoAkun.akun.masukGoogle(window.location.href).catch(() => undefined) : undefined;
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
  // Soal/contoh materi menjadi kasus hanya lewat salinan: id sesi baru, soal aslinya tidak berubah.
  const jadikanKasusSendiri = () => { if (kasus) bukaDiHitung(kasus, { jenis: 'sendiri' }); };
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
  // Susunan cepat hanya mengisi ahli waris: langsung ke Hasil (saham); harta diisi lewat "Ubah harta" di sana.
  const mulaiDari = (kasusBaru: Kasus) => {
    kirim({ jenis: 'MUAT', kasus: kasusBaru });
    setSumberSesi({ jenis: 'sendiri' });
    window.location.hash = TAUTAN_KALKULATOR;
  };
  // Menu Hitung selalu membuka awal Hitung (skenario baru / lanjut / impor); kasus yang ada tetap dimuat.
  const keAwalHitung = () => kirim({ jenis: 'KE_LAYAR', layar: 'awal' });
  // Soal selesai dibuka sebagai pembahasan (hasil terbuka, tanpa tebak); `ulang` menghapus isian lalu membuka tebakan baru.
  const kerjakanSoal = (soal: SoalHitung, ulang = false) => {
    if (ulang) naikkanPercobaanSoal(soal.kode);
    const pembahasan = sudahSelesai(soal) && !ulang;
    kirim({ jenis: 'PILIH_TUJUAN', tujuan: pembahasan ? 'hitung' : 'belajar' });
    bukaDiHitung(kasusDariSoal(soal.kasus), { jenis: 'latihan', kode: soal.kode });
    setSoalAktif(pembahasan ? null : soal);
  };
  const kerjakanUlangSoal = () => {
    const soal = sumberSesi.jenis === 'latihan' ? daftarSoalHitung().find(isi => isi.kode === sumberSesi.kode) : undefined;
    if (soal) kerjakanSoal(soal, true);
  };
  // Otomatis sekali di kunjungan pertama tiap layar yang punya tur.
  useEffect(() => {
    if (daftarTur.length > 0 && !sudahLihatTur(layar)) setTurBerjalan(true);
  }, [layar, diKalkulator]);
  return (
    <>
      <Kepala halaman={rute.halaman}
        adaTur={daftarTur.length > 0} saatKeHitung={keAwalHitung} saatTur={() => setTurBerjalan(true)} akun={<><StreakKepala sesi={sesi} repo={repoAkun} /><LonceNotifikasi sesi={sesi} repo={repoAkun} /><TombolAkun sesi={sesi} repo={repoAkun} /></>} />
      {perluSetuju && repoAkun && rute.halaman !== 'privasi' && rute.halaman !== 'syarat' && (
        <DialogPersetujuan repo={repoAkun} saatSetuju={() => setPerluSetuju(false)}
          saatKeluar={() => void keluarDanBersihkan(repoAkun).finally(() => window.location.reload())} />
      )}
      <PembaruanKonten />
      <SumberNotifikasi sesi={sesi} repo={repoAkun} />
      {!['beranda', 'kalkulator', 'belajar', 'materi', 'riwayat', 'latihan', 'rujukan', 'dibagikan', 'privasi', 'syarat'].includes(rute.halaman) && <KepalaHalaman rute={rute} />}
      {rute.halaman === 'beranda' ? <Beranda kasusTerakhir={kasusTerakhir} saatKeHitung={keAwalHitung} saatCoba={cobaDiKalkulator} saatKerjakanSoal={soal => kerjakanSoal(soal)} sesi={sesi}
          saatMasuk={masukGoogle} />
        : rute.halaman === 'belajar' ? <Belajar />
        : rute.halaman === 'materi' ? <Materi slug={rute.slug} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'latihan' ? <Latihan tab={rute.tab} paket={rute.paket} kasusSekarang={kasus} saatKerjakan={soal => kerjakanSoal(soal)} />
        : rute.halaman === 'peringkat' ? <Peringkat sesi={sesi} repo={repoAkun} />
        : rute.halaman === 'privasi' ? <Privasi />
        : rute.halaman === 'syarat' ? <Syarat />
        : rute.halaman === 'dibagikan' ? <KasusDibagikan slug={rute.slug} repo={repoAkun} menunggu={!akunSiap} saatMasuk={masukGoogle} saatSalin={mulaiDari} />
        : rute.halaman === 'riwayat' ? <HalamanRiwayat kasusSekarang={kasus} saatBuka={bukaRiwayat} bagikan={bagikanAkun} />
        : rute.halaman === 'faq' ? <Faq id={rute.id} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'tanya-jawab' ? <TanyaJawab slug={rute.slug} kasusSekarang={kasus} saatCoba={cobaDiKalkulator} />
        : rute.halaman === 'glosarium' ? <Glosarium id={rute.id} />
        : rute.halaman === 'rujukan' ? <Rujukan kode={rute.kode} kategori={rute.kategori} kitab={rute.kitab} />
        : layar === 'pintu' ? <PintuLab saatPilih={jenisKasus => kirim({ jenis: 'PILIH_JENIS_KASUS', jenisKasus })} />
        : layar === 'wizard' ? <Wizard keadaan={keadaan} kirim={kirim} />
        : layar === 'awal' || !kasus ? <AwalHitung kasusTersimpan={kasusTerakhir} kirim={kirim} saatLanjut={lanjutkan} saatBukaRiwayat={bukaRiwayat} saatImpor={kasusImpor => bukaDiHitung(kasusImpor, { jenis: 'impor' })} saatKerjakanSoal={soal => kerjakanSoal(soal)} saatMulaiDari={mulaiDari} bagikan={bagikanAkun} />
        : layar === 'cerita' ? <PilihanMenunggu kirim={kirim} />
        : <Hasil kasus={kasus} idSesi={idSesi} bagikan={bagikanAkun} tujuan={soalAktif ? keadaan.tujuan : 'hitung'} kirim={kirim}
            tanpaSimpan={sumberSesi.jenis === 'latihan'} terkunci={sumberSesi.jenis === 'latihan' || sumberSesi.jenis === 'materi'}
            saatHapusKasus={adalahKasusPengguna(sumberSesi) ? hapusKasusIni : undefined}
            saatDikerjakan={soalAktif ? benar => tandaiSoalDikerjakan(soalAktif, benar) : undefined}
            soal={soalAktif ? { id: soalAktif.kode, revisiId: revisiIdSoalHitung(soalAktif.kode) ?? '' } : undefined}
            urutanLatihan={soalAktif ? urutanLatihanDari(soalAktif, kerjakanSoal) : undefined}
            salinan={adalahKasusPengguna(sumberSesi) || soalAktif ? undefined : { saatJadikanKasus: jadikanKasusSendiri, saatKerjakanUlang: sumberSesi.jenis === 'latihan' ? kerjakanUlangSoal : undefined, soal: sumberSesi.jenis === 'latihan' }} />}
      <Toast isi={toast} saatHilang={() => setToast(null)} />
      <Dok />
      <Tur daftar={daftarTur} kunci={layar} sedangBerjalan={turBerjalan} saatSelesai={() => setTurBerjalan(false)} />
    </>
  );
}

/** Keadaan dari URL `#/hitung/<id>/...` + entri riwayat berid itu; null bila bukan URL kasus atau entrinya sudah tidak ada. */
export function pulihDariUrl(hash: string, tujuan: Tujuan | null): { id: string; sumber: SumberRiwayat; keadaan: KeadaanAplikasi } | null {
  const rute = bacaRute(hash);
  if (rute.halaman !== 'kalkulator' || !rute.kasus) return null;
  const { id, layar, langkah } = rute.kasus;
  const entri = bacaRiwayat().find(isi => isi.id === id);
  if (!entri) return null;
  // Lewat reducer yang sama dengan penggunaan biasa, jadi langkah/layar yang belum boleh dibuka otomatis dibatasi.
  const aksi: Aksi[] = [{ jenis: 'MUAT', kasus: entri.kasus }];
  if (layar === 'wizard') aksi.push({ jenis: 'KE_LANGKAH', langkah: langkah ?? 1 });
  else if (layar === 'cerita') aksi.push({ jenis: 'KE_LAYAR', layar });
  let keadaan = aksi.reduce(pengurangKeadaan, keadaanAwal(null, tujuan));
  // Kasus yang belum boleh ke Hasil (harta 0 dari susunan cepat boleh): jatuh ke langkah wizard pertama yang belum terisi.
  if (keadaan.layar !== 'wizard' && !bolehDiHasil(entri.kasus)) keadaan = pengurangKeadaan(keadaan, { jenis: 'KE_LANGKAH', langkah: TOTAL_LANGKAH });
  return { id, sumber: entri.sumber, keadaan };
}

/** Keadaan dari `#/latihan/soal/<kode>`: soal selesai = pembahasan (hasil terbuka), selain itu tebak. Null bila bukan alamat soal atau kodenya tak dikenal. */
export function pulihDariSoal(hash: string, tujuan: Tujuan | null): { soal: SoalHitung; pembahasan: boolean; keadaan: KeadaanAplikasi } | null {
  const rute = bacaRute(hash);
  const soal = rute.halaman === 'kalkulator' && rute.soal ? cariSoalHitung(rute.soal) : undefined;
  if (!soal) return null;
  const kasus = kasusDariSoal(soal.kasus);
  const pembahasan = sudahSelesai(soal);
  const aksi: Aksi[] = [{ jenis: 'PILIH_TUJUAN', tujuan: pembahasan ? 'hitung' : 'belajar' }, { jenis: 'MUAT', kasus }];
  if (!kasusLengkap(kasus)) aksi.push({ jenis: 'KE_LANGKAH', langkah: TOTAL_LANGKAH });
  return { soal, pembahasan, keadaan: aksi.reduce(pengurangKeadaan, keadaanAwal(null, tujuan)) };
}

const sudahSelesai = (soal: SoalHitung): boolean =>
  soalSelesai(statusSoal(bacaProgresLatihan('hitung')[soal.kode], bacaSemuaIsianSoal()[soal.kode]));

const adalahUrlKasus = (hash: string): boolean => {
  const rute = bacaRute(hash);
  return rute.halaman === 'kalkulator' && !!rute.kasus;
};

/** Di beranda, tawarkan kasus yang sedang dikerjakan; bila belum ada, yang tersimpan di perangkat. */
const muatLokalAtau = (kasus: ReturnType<typeof muatLokal>) => kasus ?? muatLokal();

/** Id sesi riwayat; cukup unik di satu perangkat. */
const buatIdSesi = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Posisi soal di urutan daftar Latihan (satu sumber: urutanSoalHitung) dan aksi ke soal sesudahnya. */
function urutanLatihanDari(soal: SoalHitung, kerjakan: (soal: SoalHitung) => void) {
  const urutan = urutanSoalHitung(daftarSoalHitung());
  const indeks = urutan.findIndex(isi => isi.kode === soal.kode);
  const berikutnya = urutan[indeks + 1];
  return { nomor: indeks + 1, jumlah: urutan.length, bab: judulTopik(soal.bab), judul: judulSoalTampil(soal, !!bacaProgresLatihan('hitung')[soal.kode]), saatBerikutnya: berikutnya ? () => kerjakan(berikutnya) : undefined };
}

/** `benar` = tebakan tepat sebelum jawaban dibuka; hanya itu yang memberi XP soal hitung (spec tahap 5). */
function tandaiSoalDikerjakan(soal: SoalHitung, benar: boolean): void {
  catatLatihan('hitung', soal.kode, benar, null);
  catatAktivitas({ jenis: 'soal', kode: soal.kode, judul: judulSoalTampil(soal, true), waktu: Date.now() });
}
