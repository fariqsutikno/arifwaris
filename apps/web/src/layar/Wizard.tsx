// Wizard 4 langkah (Almarhum, Harta, Keluarga, Periksa), satu pertanyaan per layar. Menerima keadaan + kirim(aksi);
// menyerahkan Kasus yang sudah lengkap ke layar hasil lewat KE_LAYAR 'hasil' (atau pilihan menunggu bila ada janin).

import { useEffect, useState } from 'react';
import { kasusBaru, type Kasus } from '../kasus';
import { daftarAlmarhum, namaSingkat } from '../keadaanOrang';
import { t } from '../terjemah';
import { TOTAL_LANGKAH, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { Pilihan } from '../ui/komponen';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { LangkahAhliWaris } from './LangkahAhliWaris';
import { LangkahBabak } from './LangkahBabak';
import { PertanyaanHamil } from './keadaan/PertanyaanHamil';
import { PertanyaanPenutup } from './keadaan/PertanyaanPenutup';
import { CeritaKasus } from './PeriksaCerita';
import { LangkahKondisi } from './LangkahKondisi';
import { LangkahHarta } from './wizard/LangkahHarta';
import { KewajibanOpsional } from './wizard/KewajibanOpsional';
import { BarBawah } from './wizard/BarBawah';
import { KerangkaLangkah } from './wizard/KerangkaLangkah';
import { NamaKasus } from './wizard/NamaKasus';
import { IsianNamaAlmarhum, LangkahPewaris } from './wizard/LangkahPewaris';
import { PanggungPohon } from './wizard/PanggungPohon';
import { Stepper } from './wizard/Stepper';
import { adaAhliWaris, alasanBabak, alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from './wizard/validasi';


export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  const { kasus, langkah, babak } = keadaan;
  const [sedangReset, setSedangReset] = useState(false);
  const almarhum = kasus ? daftarAlmarhum(kasus) : [];
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const alasan = langkah === 3 && kasus
    ? (babak === 0 && !adaAhliWaris(kasus) ? t('hitung.tambahkan_minimal_satu_ahli_waris') : alasanBabak(kasus, babak))
    : alasanBelumLengkap(kasus, langkah);
  const subjudul = langkah === 3 && babak > 0 && kasus
    ? t('hitung.babak.subjudul', { nomor: babak + 1, total: almarhum.length, nama: namaSingkat(kasus, almarhum[babak]!) })
    : undefined;
  const saatLanjut = () => {
    if (langkah === 3 && babak < almarhum.length - 1) return kirim({ jenis: 'KE_BABAK', babak: babak + 1 });
    // Janin belum lahir: pilihan menunggu dulu ([R13-17]), kecuali sudah dipilih.
    if (langkah === TOTAL_LANGKAH) return kirim({ jenis: 'KE_LAYAR', layar: kasus && adaJaninBelumLahir(kasus) && !kasus.pilihanJanin ? 'cerita' : 'hasil' });
    kirim({ jenis: 'KE_LANGKAH', langkah: langkah + 1 });
  };
  const saatKembali = () => {
    if (langkah === 3 && babak > 0) return kirim({ jenis: 'KE_BABAK', babak: babak - 1 });
    kirim(langkah === 1 ? { jenis: 'KE_LAYAR', layar: 'awal' } : { jenis: 'KE_LANGKAH', langkah: langkah - 1 });
  };
  // Penanda halaman: latar krem dan navbar menyatu dengan hero gelap (CSS body.layar-beranda), sama dengan Awal Lab.
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  const stepper = (
    <Stepper langkahAktif={langkah} terjauh={langkahTerjauh(kasus)}
      saatPilih={tujuan => kirim(tujuan === LANGKAH_HASIL ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: tujuan })} />
  );
  return (
    <main className="halaman-beranda halaman-wizard">
      <KerangkaLangkah langkah={langkah} subjudul={subjudul} stepper={stepper} saatReset={() => setSedangReset(true)} ringkasan={<PanggungPohon kasus={kasus} />}>
        {langkah === 1 && <LangkahPewaris kasus={kasus} saatPilih={jenisKelamin => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin })}
          saatGantiDanKosongkan={jenisKelamin => ubah(k => gantiPewarisDanKosongkan(k, jenisKelamin))}
          saatUbahNama={nama => ubah(k => ubahNamaPewaris(k, nama))} />}
        {kasus && langkah === 2 && <><LangkahHarta kasus={kasus} ubah={ubah} /><KewajibanOpsional kasus={kasus} ubah={ubah} /></>}
        {kasus && langkah === 3 && babak === 0 && <>
          <IsianNamaAlmarhum nama={kasus.graf.orang[kasus.graf.idPewaris]?.nama ?? ''} saatUbah={nama => ubah(k => ubahNamaPewaris(k, nama))} />
          <p className="keterangan">{t('hitung.penutup.masukkan_yang_wafat', { mayit: namaSingkat(kasus, kasus.graf.idPewaris) })}</p>
          <p className="catatan">{t('hitung.keluarga_beri_nama')}</p>
          <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
          <PertanyaanPenutup kasus={kasus} idMayit={kasus.graf.idPewaris} ubah={ubah} />
          <PertanyaanHamil kasus={kasus} idMayit={kasus.graf.idPewaris} ubah={ubah} />
        </>}
        {kasus && langkah === 3 && babak > 0 && <LangkahBabak kasus={kasus} babak={babak} ubah={ubah} />}
        {kasus && langkah === 4 && <>
          <CeritaKasus kasus={kasus} kirim={kirim} />
          <h2 id="tanya-kondisi" className="judul-bagian-kecil">{t('hitung.kondisi_tanya_baru')}</h2>
          <LangkahKondisi kasus={kasus} ubah={ubah} labelId="tanya-kondisi" />
          <NamaKasus kasus={kasus} ubah={ubah} />
        </>}
      </KerangkaLangkah>
      {sedangReset && kasus && (
        <KonfirmasiKasusBaru kasus={kasus} judul={t('umum.reset_skenario')} labelLanjut={t('umum.reset')} saatBatal={() => setSedangReset(false)}
          saatLanjut={() => { setSedangReset(false); kirim({ jenis: 'ULANGI' }); }} />
      )}
      <BarBawah langkah={langkah} alasan={alasan}
        saatKembali={saatKembali} saatLanjut={saatLanjut} />
    </main>
  );
}

const adaJaninBelumLahir = (kasus: Kasus): boolean => Object.values(kasus.graf.orang).some(orang => orang.statusHidup === 'dalamKandungan');

/** Kasus baru dengan jenis kelamin lain; harta, kewajiban, pembulatan, dan nama pewaris dibawa, keluarga dikosongkan. */
function gantiPewarisDanKosongkan(kasus: Kasus, jenisKelamin: 'L' | 'P'): Kasus {
  const baru = kasusBaru(jenisKelamin);
  const nama = kasus.graf.orang[kasus.graf.idPewaris]?.nama;
  const pewaris = { ...baru.graf.orang[baru.graf.idPewaris]!, ...(nama ? { nama } : {}) };
  return {
    ...baru, tirkah: kasus.tirkah, satuanPembulatan: kasus.satuanPembulatan,
    ...(kasus.rincianHarta ? { rincianHarta: kasus.rincianHarta } : {}),
    graf: { ...baru.graf, orang: { [baru.graf.idPewaris]: pewaris } },
  };
}

function ubahNamaPewaris(kasus: Kasus, nama: string): Kasus {
  const { nama: _lama, ...tanpaNama } = kasus.graf.orang[kasus.graf.idPewaris]!;
  const pewaris = nama ? { ...tanpaNama, nama } : tanpaNama;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [kasus.graf.idPewaris]: pewaris } } };
}
