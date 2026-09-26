// Awal Hitung: tempat perjalanan kalkulator dimulai. Skenario baru (aksi utama), lanjut kasus terakhir, impor file,
// dan riwayat hitung dua pekan terakhir. Skenario baru langsung ke wizard dalam mode Hitung kasus;
// mode Belajar dipilih di layar hasil (toggle Hitung kasus / Belajar), jadi tidak ditanya dua kali.
// Pintasan belajar: beberapa soal latihan yang belum dikerjakan, langsung dibuka di mode Belajar tanpa menyusun skenario.

import { useRef, useState } from 'react';
import { DAFTAR_SOAL_HITUNG, type SoalHitung } from '@waris/content';
import { TEKS_HITUNG } from '../konten/umum';
import { dariJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { bacaCatatan } from '../preferensi';
import { ringkasKasus, type EntriRiwayat } from '../riwayat';
import { tautanLatihan } from '../rute';
import { HeroMini } from '../ui/Hero';
import { Ikon } from '../ui/Ikon';
import { DaftarRiwayat } from './Riwayat';
import { t } from '../terjemah';

interface Props {
  kasusTersimpan: Kasus | null;
  kirim: (aksi: Aksi) => void;
  saatLanjut: (kasus: Kasus) => void;
  saatBukaRiwayat: (entri: EntriRiwayat) => void;
  saatImpor: (kasus: Kasus) => void;
  saatKerjakanSoal: (soal: SoalHitung) => void;
}

const JUMLAH_SOAL_PINTASAN = 3;

export function AwalHitung({ kasusTersimpan, kirim, saatLanjut, saatBukaRiwayat, saatImpor, saatKerjakanSoal }: Props) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const saatPilihFile = async (file: File | undefined) => {
    if (!file) return;
    const hasil = dariJson(await file.text());
    if (hasil.berhasil) saatImpor(hasil.kasus);
    else setPesan(t('File-nya nggak bisa dibuka: {pesan}', { pesan: hasil.pesan }));
  };
  // Kasus yang sedang ada sudah tercatat di riwayat, jadi aman ditinggal tanpa dialog.
  const mulaiBaru = () => {
    if (kasusTersimpan) kirim({ jenis: 'ULANGI' });
    kirim({ jenis: 'PILIH_TUJUAN', tujuan: 'hitung' });
    kirim({ jenis: 'MULAI' });
  };
  const terakhir = kasusTersimpan ? ringkasKasus(kasusTersimpan) : null;
  return (
    <main className="halaman tumpuk awal-hitung">
      <HeroMini judul={TEKS_HITUNG.judul} keterangan={TEKS_HITUNG.janji} ikon="hitung" />

      <div className="kartu-pilihan-deret pilihan-mulai">
        <button type="button" className="kartu-pilihan kecil pilihan-utama" onClick={mulaiBaru}>
          <span className="judul-pilihan"><Ikon nama="tambah" ukuran={22} />{t('Skenario baru')}</span>
          <small>{TEKS_HITUNG.mulai.baru}{kasusTersimpan ? t(' Kasus sekarang tetap tersimpan di riwayat.') : ''}</small>
        </button>
        {kasusTersimpan && terakhir && (
          <button type="button" className="kartu-pilihan kecil" onClick={() => saatLanjut(kasusTersimpan)}>
            <span className="judul-pilihan"><Ikon nama="riwayat" ukuran={22} />{t('Lanjut kasus terakhir')}</span>
            <small>{terakhir.judul} · {terakhir.keterangan}</small>
          </button>
        )}
        <button type="button" className="kartu-pilihan kecil" onClick={() => inputFile.current?.click()}>
          <span className="judul-pilihan"><Ikon nama="berkas" ukuran={22} />{t('Impor file')}</span>
          <small>{TEKS_HITUNG.mulai.impor}</small>
        </button>
        <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={event => void saatPilihFile(event.target.files?.[0])} />
      </div>
      {pesan && <p className="isian-salah" role="alert">{pesan}</p>}

      <PintasanSoal saatKerjakan={saatKerjakanSoal} />

      <section className="tumpuk-rapat riwayat-beranda" aria-labelledby="judul-riwayat">
        <h2 id="judul-riwayat" className="tanya-tujuan">{t('Riwayat hitung')}</h2>
        <DaftarRiwayat kasusSekarang={kasusTersimpan} saatBuka={saatBukaRiwayat} ringkas />
      </section>
    </main>
  );
}

/** Soal latihan yang belum dikerjakan (urutan daftar latihan, dari yang dasar); kalau semua sudah, ulangi dari awal. */
function PintasanSoal({ saatKerjakan }: { saatKerjakan: (soal: SoalHitung) => void }) {
  const catatan = bacaCatatan('soal');
  const belum = DAFTAR_SOAL_HITUNG.filter(soal => !catatan[soal.kode]);
  const daftar = (belum.length > 0 ? belum : DAFTAR_SOAL_HITUNG).slice(0, JUMLAH_SOAL_PINTASAN);
  return (
    <section className="pintasan-soal tumpuk-rapat" aria-labelledby="judul-pintasan-soal">
      <div>
        <h2 id="judul-pintasan-soal" className="tanya-tujuan">{t('Mau belajar? Langsung kerjakan soal')}</h2>
        <p className="keterangan">{t('Kasusnya sudah disiapkan. Kamu tinggal menebak pembagiannya, lalu pelajari cara menghitungnya langkah demi langkah.')}</p>
      </div>
      <ul className="daftar-polos grid-pintasan-soal">
        {daftar.map(soal => (
          <li key={soal.kode}>
            <button type="button" className="kartu-pilihan kecil kartu-soal-pintas" onClick={() => saatKerjakan(soal)}>
              <span className={`tingkat tingkat-${soal.tingkat}`}>{t(soal.tingkat)}</span>
              <b>{soal.judul}</b>
              <span className="aksi-soal-pintas">{t('Kerjakan')} <Ikon nama="kembali" ukuran={14} /></span>
            </button>
          </li>
        ))}
      </ul>
      <a className="aw-btn aw-btn-secondary aw-btn-sm tombol-semua-soal" href={tautanLatihan('hitung')}>{t('Lihat semua soal latihan')}</a>
    </section>
  );
}
