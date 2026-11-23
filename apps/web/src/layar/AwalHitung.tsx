// Awal Lab: tempat perjalanan kalkulator dimulai, tiga bagian dengan tujuan berbeda: Mulai kasus baru (dari nol, susunan
// keluarga, impor), Kasusmu (semua kasus, tersimpan dan sementara), dan Berlatih dengan soal. Hero: Lanjutkan kasus berjalan
// atau mulai baru.
// Skenario baru langsung ke wizard dalam mode Hitung kasus.
// Pintasan soal: beberapa soal latihan yang belum selesai (yang terputus lebih dulu), dibuka sebagai soal, bukan kasus;
// soal tinggal di Latihan, kasus di Kasusmu.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { type SoalHitung, type Tingkat } from '@waris/content';
import { daftarSoalHitung } from '../konten/sumber';
import { TEKS_HITUNG } from '../konten/umum';
import { dariJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { bacaSemuaIsianSoal } from '../isianSoal';
import { bacaProgresLatihan } from '../progres';
import type { EntriRiwayat } from '../riwayat';
import { tautanLatihan } from '../rute';
import { Ikon } from '../ui/Ikon';
import { pisahKataAkhir, sorotUbin, useCahayaIkutKursor } from '../ui/sorotan';
import { DaftarKasus } from './lab/DaftarKasus';
import { HeroLab } from './lab/HeroLab';
import { MulaiCepat } from './lab/MulaiCepat';
import { panah, t } from '../terjemah';
import { judulSoalTampil } from './belajar/judulSoal';
import { porsiIsian, soalTerputus, statusSoal } from './belajar/statusSoal';

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
  // Penanda halaman: latar krem dan nav menyatu dengan hero gelap (CSS body.layar-beranda), sama dengan Beranda dan Belajar.
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  const hero = useRef<HTMLElement>(null);
  useCahayaIkutKursor(hero);
  const [judulAwal, kataTekanan] = pisahKataAkhir(TEKS_HITUNG.judul);
  return (
    <main className="halaman-beranda halaman-lab">
      <header className="hero-beranda hero-pusat hero-lab" ref={hero}>
        <div className="sapa-pusat">
          <h1>{judulAwal} <span className="tekanan">{kataTekanan}</span></h1>
          <p className="lead">{TEKS_HITUNG.janji}</p>
        </div>
        <HeroLab kasusTerakhir={kasusTersimpan} saatLanjut={() => kasusTersimpan && saatLanjut(kasusTersimpan)} />
      </header>

      <div className="tata-beranda" onPointerMove={sorotUbin}>
        <MulaiCepat saatPilih={mulaiDariSusunan} saatDariNol={mulaiBaru} adaKasusBerjalan={!!kasusTersimpan} saatImpor={() => inputFile.current?.click()} />
        <DaftarKasus kasusSekarang={kasusTersimpan} saatBuka={saatBukaRiwayat} ringkas />
        <PintasanSoal saatKerjakan={saatKerjakanSoal} />
        <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={event => void saatPilihFile(event.target.files?.[0])} />
        {pesan && <p className="isian-salah" role="alert">{pesan}</p>}
      </div>
    </main>
  );
}

/** Soal latihan yang belum dikerjakan (urutan daftar latihan, dari yang dasar); kalau semua sudah, ulangi dari awal. */
function PintasanSoal({ saatKerjakan }: { saatKerjakan: (soal: SoalHitung) => void }) {
  const catatan = bacaProgresLatihan('hitung');
  const isian = bacaSemuaIsianSoal();
  const terputus = soalTerputus(daftarSoalHitung(), catatan, isian);
  const belum = [...terputus, ...daftarSoalHitung().filter(soal => !catatan[soal.kode] && !terputus.includes(soal))];
  const daftar = (belum.length > 0 ? belum : daftarSoalHitung()).slice(0, JUMLAH_SOAL_PINTASAN);
  return (
    <section className="bagian-lab" aria-labelledby="judul-pintasan-soal">
      <h2 id="judul-pintasan-soal" className="judul-bagian">{t('hitung.lab_latihan_judul')}</h2>
      <p className="keterangan">{t('hitung.lab_latihan_ket')}</p>
      <ul className="daftar-polos lab-ubin-soal">
        {daftar.map((soal, urutan) => (
          <li key={soal.kode}>
            <button type="button" className="ubin ubin-lab ubin-lab-soal" style={{ '--i': urutan } as CSSProperties} onClick={() => saatKerjakan(soal)}>
              <span className="panah-bulat" aria-hidden="true">{panah()}</span>
              <span className={`tingkat tingkat-${soal.tingkat}`}>{TEKS_TINGKAT()[soal.tingkat]}</span>
              <b className="judul-ubin">{judulSoalTampil(soal, !!catatan[soal.kode])}</b>
              {statusSoal(catatan[soal.kode], isian[soal.kode]) === 'terputus'
                ? <span className="keterangan"><span className="status-soal-baru status-terputus" role="img" aria-label={t('hitung.lab_lanjutkan')} style={{ '--isi': `${porsiIsian(isian[soal.kode]!)}%` } as CSSProperties} /> {t('hitung.lab_lanjutkan')}</span>
                : <span className="keterangan">{t('hitung.kerjakan')}</span>}
            </button>
          </li>
        ))}
      </ul>
      <a className="tautan-cari" href={tautanLatihan('hitung')}><Ikon nama="hitung" ukuran={20} />{t('hitung.lihat_semua_soal_latihan')}</a>
    </section>
  );
}
