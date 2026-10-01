// Awal Lab: tempat perjalanan kalkulator dimulai. Hero pohon kasus terakhir (Lanjutkan) atau ajakan skenario baru,
// mulai cepat dari susunan keluarga, rak eksperimen bernama, riwayat dua pekan per hari, dan pintasan soal.
// Skenario baru langsung ke wizard dalam mode Hitung kasus;
// mode Belajar dipilih di layar hasil (toggle Hitung kasus / Belajar), jadi tidak ditanya dua kali.
// Pintasan belajar: beberapa soal latihan yang belum dikerjakan, langsung dibuka di mode Belajar tanpa menyusun skenario.

import { useRef, useState } from 'react';
import { type SoalHitung, type Tingkat } from '@waris/content';
import { daftarSoalHitung } from '../konten/sumber';
import { TEKS_HITUNG } from '../konten/umum';
import { dariJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { bacaProgresLatihan } from '../progres';
import type { EntriRiwayat } from '../riwayat';
import { tautanLatihan } from '../rute';
import { HeroMini } from '../ui/Hero';
import { Ikon } from '../ui/Ikon';
import { bacaTersimpan } from '../tersimpan';
import { HeroLab } from './lab/HeroLab';
import { MulaiCepat } from './lab/MulaiCepat';
import { RakEksperimen } from './lab/RakEksperimen';
import { TerakhirDibuka } from './lab/TerakhirDibuka';
import { angka, t } from '../terjemah';

export const TEKS_TINGKAT = (): Record<Tingkat, string> => ({ dasar: t('hitung.dasar'), menengah: t('hitung.menengah'), sulit: t('hitung.sulit') });

interface Props {
  kasusTersimpan: Kasus | null;
  kirim: (aksi: Aksi) => void;
  saatLanjut: (kasus: Kasus) => void;
  saatBukaRiwayat: (entri: EntriRiwayat) => void;
  saatImpor: (kasus: Kasus) => void;
  saatKerjakanSoal: (soal: SoalHitung) => void;
  /** Buka wizard dengan kasus yang ahli warisnya sudah terisi (mulai cepat). */
  saatMulaiDari: (kasus: Kasus) => void;
}

const JUMLAH_SOAL_PINTASAN = 3;

export function AwalHitung({ kasusTersimpan, kirim, saatLanjut, saatBukaRiwayat, saatImpor, saatKerjakanSoal, saatMulaiDari }: Props) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const saatPilihFile = async (file: File | undefined) => {
    if (!file) return;
    const hasil = dariJson(await file.text());
    if (hasil.berhasil) saatImpor(hasil.kasus);
    else setPesan(t('hitung.file_nya_nggak_bisa_dibuka_pesan', { pesan: hasil.pesan }));
  };
  // Kasus yang sedang ada sudah tercatat di riwayat, jadi aman ditinggal tanpa dialog.
  const mulaiBaru = () => {
    if (kasusTersimpan) kirim({ jenis: 'ULANGI' });
    kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' });
    kirim({ jenis: 'MULAI' });
  };
  // Sama seperti mulaiBaru, tetapi wizard dibuka dengan ahli waris susunan terisi (belum lengkap → langkah pertama yang kosong).
  const mulaiDariSusunan = (kasus: Kasus) => {
    if (kasusTersimpan) kirim({ jenis: 'ULANGI' });
    kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' });
    saatMulaiDari(kasus);
  };
  const jumlahEksperimen = bacaTersimpan().length;
  return (
    <main className="halaman tumpuk awal-hitung awal-lab">
      <HeroMini judul={TEKS_HITUNG.judul} keterangan={TEKS_HITUNG.janji} ikon="hitung" />
      <HeroLab kasusTerakhir={kasusTersimpan} saatLanjut={() => kasusTersimpan && saatLanjut(kasusTersimpan)} saatMulaiBaru={mulaiBaru} />
      <MulaiCepat saatPilih={mulaiDariSusunan} />
      <RakEksperimen kasusSekarang={kasusTersimpan} saatBuka={saatBukaRiwayat} />
      <TerakhirDibuka kasusSekarang={kasusTersimpan} saatBuka={saatBukaRiwayat} />
      <PintasanSoal saatKerjakan={saatKerjakanSoal} />
      <div className="lab-aksi-teks">
        {kasusTersimpan && <button type="button" className="tautan-aksi" onClick={mulaiBaru}><Ikon nama="tambah" ukuran={16} />{t('hitung.skenario_baru')}<small className="lab-catatan-aksi">{t('hitung.kasus_sekarang_tetap_tersimpan_di_riwayat')}</small></button>}
        <button type="button" className="tautan-aksi" onClick={() => inputFile.current?.click()}><Ikon nama="berkas" ukuran={16} />{t('hitung.impor_file')}</button>
      </div>
      <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={event => void saatPilihFile(event.target.files?.[0])} />
      {pesan && <p className="isian-salah" role="alert">{pesan}</p>}
      {jumlahEksperimen > 0 && <p className="keterangan lab-jejak">{t('hitung.lab_jejak', { jumlah: angka(String(jumlahEksperimen)) })}</p>}
    </main>
  );
}

/** Soal latihan yang belum dikerjakan (urutan daftar latihan, dari yang dasar); kalau semua sudah, ulangi dari awal. */
function PintasanSoal({ saatKerjakan }: { saatKerjakan: (soal: SoalHitung) => void }) {
  const catatan = bacaProgresLatihan('hitung');
  const belum = daftarSoalHitung().filter(soal => !catatan[soal.kode]);
  const daftar = (belum.length > 0 ? belum : daftarSoalHitung()).slice(0, JUMLAH_SOAL_PINTASAN);
  return (
    <section className="pintasan-soal tumpuk-rapat" aria-labelledby="judul-pintasan-soal">
      <div>
        <h2 id="judul-pintasan-soal" className="tanya-tujuan">{t('hitung.mau_belajar_langsung_kerjakan_soal')}</h2>
        <p className="keterangan">{t('hitung.kasusnya_sudah_disiapkan_kamu_tinggal_menebak')}</p>
      </div>
      <ul className="daftar-polos grid-pintasan-soal">
        {daftar.map(soal => (
          <li key={soal.kode}>
            <button type="button" className="kartu-pilihan kecil kartu-soal-pintas" onClick={() => saatKerjakan(soal)}>
              <span className={`tingkat tingkat-${soal.tingkat}`}>{TEKS_TINGKAT()[soal.tingkat]}</span>
              <b>{soal.judul}</b>
              <span className="aksi-soal-pintas">{t('hitung.kerjakan')} <Ikon nama="kembali" ukuran={14} /></span>
            </button>
          </li>
        ))}
      </ul>
      <a className="aw-btn aw-btn-secondary aw-btn-sm tombol-semua-soal" href={tautanLatihan('hitung')}>{t('hitung.lihat_semua_soal_latihan')}</a>
    </section>
  );
}
