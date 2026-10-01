// Wizard 4 langkah (Almarhum, Harta, Keluarga, Periksa), satu pertanyaan per layar. Langkah Keluarga punya dua layar per babak:
// daftar orang, lalu keadaan khusus (wafat/hilang, hamil, beda agama) sebagai SATU keputusan. Periksa hanya konfirmasi.
// Urutan layar ada di wizard/navigasi.ts. Menerima keadaan + kirim(aksi); menyerahkan Kasus yang sudah lengkap ke layar hasil lewat
// KE_LAYAR 'hasil' (atau pilihan menunggu bila ada janin).

import { useEffect, useState } from 'react';
import { kasusBaru, type Kasus } from '../kasus';
import { daftarAlmarhum, namaSingkat } from '../keadaanOrang';
import { t } from '../terjemah';
import type { Aksi, KeadaanAplikasi } from '../keadaan';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { LangkahAhliWaris } from './LangkahAhliWaris';
import { LangkahBabak } from './LangkahBabak';
import { KeadaanKeluarga } from './keadaan/KeadaanKeluarga';
import { CeritaKasus } from './PeriksaCerita';
import { LangkahHarta } from './wizard/LangkahHarta';
import { KewajibanOpsional } from './wizard/KewajibanOpsional';
import { BarBawah } from './wizard/BarBawah';
import { KerangkaLangkah } from './wizard/KerangkaLangkah';
import { NamaKasus } from './wizard/NamaKasus';
import { LANGKAH_WIZARD } from '../konten/wizard';
import { LangkahPewaris } from './wizard/LangkahPewaris';
import { posisiBerikut, posisiSebelum, type Posisi } from './wizard/navigasi';
import { PanggungPohon } from './wizard/PanggungPohon';
import { Stepper } from './wizard/Stepper';
import { adaAhliWaris, alasanBabak, alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from './wizard/validasi';


export function Wizard({ keadaan, kirim }: { keadaan: KeadaanAplikasi; kirim: (aksi: Aksi) => void }) {
  const { kasus, langkah, babak, bagian } = keadaan;
  const [sedangReset, setSedangReset] = useState(false);
  const almarhum = kasus ? daftarAlmarhum(kasus) : [];
  const ubah = (fungsiUbah: (kasus: Kasus) => Kasus) => kirim({ jenis: 'UBAH_KASUS', ubah: fungsiUbah });
  const posisi: Posisi = { langkah, babak, bagian };
  const idMayit = kasus ? almarhum[babak] ?? kasus.graf.idPewaris : '';
  const namaMayit = kasus ? namaSingkat(kasus, idMayit) : '';
  const diDaftar = langkah === 3 && bagian === 'daftar';
  const diKeadaan = langkah === 3 && bagian === 'keadaan';
  // Layar keadaan tidak punya syarat lanjut: tidak mencentang apa pun berarti kasus biasa.
  const alasan = diKeadaan ? null : diDaftar && kasus
    ? (babak === 0 && !adaAhliWaris(kasus) ? t('hitung.tambahkan_minimal_satu_ahli_waris') : alasanBabak(kasus, babak))
    : alasanBelumLengkap(kasus, langkah);
  const subjudul = langkah === 3 && almarhum.length > 1 && kasus
    ? t('hitung.babak.subjudul', { nomor: babak + 1, total: almarhum.length, nama: namaMayit })
    : undefined;
  // Pertanyaan dan caption layar Keluarga menyebut nama almarhum babak itu dan berjangkar waktu ("waktu beliau wafat").
  const pertanyaan = !kasus || langkah !== 3 ? undefined
    : diDaftar ? t('hitung.keluarga.tanya_daftar', { nama: namaMayit }) : t('hitung.keadaan_khusus.tanya', { nama: namaMayit });
  const caption = !kasus || langkah !== 3 ? undefined
    : diKeadaan ? t('hitung.keadaan_khusus.caption') : babak === 0 ? t('hitung.keluarga.caption_daftar') : '';
  const labelLanjut = langkah === 3 && kasus
    ? (diDaftar ? t('hitung.lanjut_keadaan_keluarga')
      : babak < almarhum.length - 1 ? t('hitung.lanjut_keluarga_nama', { nama: namaSingkat(kasus, almarhum[babak + 1]!) })
      : t('hitung.lanjut_nama', { nama: LANGKAH_WIZARD[3]!.nama }))
    : LANGKAH_WIZARD[langkah] ? t('hitung.lanjut_nama', { nama: LANGKAH_WIZARD[langkah]!.nama }) : t('hitung.lihat_hasil');
  const saatLanjut = () => {
    const berikut = posisiBerikut(posisi, almarhum.length);
    if (berikut !== 'hasil') return kirim({ jenis: 'KE_POSISI', ...berikut });
    // Janin belum lahir: pilihan menunggu dulu ([R13-17]), kecuali sudah dipilih.
    kirim({ jenis: 'KE_LAYAR', layar: kasus && adaJaninBelumLahir(kasus) && !kasus.pilihanJanin ? 'cerita' : 'hasil' });
  };
  const saatKembali = () => {
    const sebelum = posisiSebelum(posisi, almarhum.length);
    kirim(sebelum === 'awal' ? { jenis: 'KE_LAYAR', layar: 'awal' } : { jenis: 'KE_POSISI', ...sebelum });
  };
  // Pindah layar (langkah, babak, atau bagian) selalu mulai dari atas: pertanyaan barunya harus terlihat, bukan tertinggal di bawah.
  useEffect(() => { window.scrollTo(0, 0); }, [langkah, babak, bagian]);
  // Penanda halaman: latar krem dan navbar menyatu dengan hero gelap (CSS body.layar-beranda), sama dengan Awal Lab.
  // layar-wizard menyembunyikan navigasi bawah HP: di wizard hanya ada satu bar bawah (aksi langkah).
  useEffect(() => {
    document.body.classList.add('layar-beranda', 'layar-wizard');
    return () => document.body.classList.remove('layar-beranda', 'layar-wizard');
  }, []);
  const stepper = (
    <Stepper langkahAktif={langkah} terjauh={langkahTerjauh(kasus)}
      saatPilih={tujuan => kirim(tujuan === LANGKAH_HASIL ? { jenis: 'KE_LAYAR', layar: 'hasil' } : { jenis: 'KE_LANGKAH', langkah: tujuan })} />
  );
  return (
    <main className="halaman-beranda halaman-wizard">
      <KerangkaLangkah langkah={langkah} subjudul={subjudul} stepper={stepper} saatReset={() => setSedangReset(true)} pertanyaan={pertanyaan} caption={caption} ringkasan={<PanggungPohon kasus={kasus} {...(langkah === 3 ? { ubah } : {})} maksPerBaris={3} />}>
        {langkah === 1 && <LangkahPewaris kasus={kasus} saatPilih={jenisKelamin => kirim({ jenis: 'PILIH_PEWARIS', jenisKelamin })}
          saatGantiDanKosongkan={jenisKelamin => ubah(k => gantiPewarisDanKosongkan(k, jenisKelamin))}
          saatUbahNama={nama => ubah(k => ubahNamaPewaris(k, nama))} />}
        {kasus && langkah === 2 && <><LangkahHarta kasus={kasus} ubah={ubah} /><KewajibanOpsional kasus={kasus} ubah={ubah} /></>}
        {kasus && diDaftar && babak === 0 && (
          <LangkahAhliWaris graf={kasus.graf} idMayit={kasus.graf.idPewaris} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
        )}
        {kasus && diDaftar && babak > 0 && <LangkahBabak kasus={kasus} babak={babak} ubah={ubah} />}
        {kasus && diKeadaan && <KeadaanKeluarga key={idMayit} kasus={kasus} idMayit={idMayit} akhir={babak >= almarhum.length - 1} ubah={ubah} />}
        {kasus && langkah === 4 && <>
          <CeritaKasus kasus={kasus} kirim={kirim} />
          <NamaKasus kasus={kasus} ubah={ubah} />
        </>}
      </KerangkaLangkah>
      {sedangReset && kasus && (
        <KonfirmasiKasusBaru kasus={kasus} saatBatal={() => setSedangReset(false)}
          saatLanjut={() => { setSedangReset(false); kirim({ jenis: 'ULANGI' }); }} />
      )}
      <BarBawah labelLanjut={labelLanjut} alasan={alasan} saatKembali={saatKembali} saatLanjut={saatLanjut} />
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
