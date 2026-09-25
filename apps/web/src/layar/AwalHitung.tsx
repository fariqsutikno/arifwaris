// Awal Hitung: tempat perjalanan kalkulator dimulai. Skenario baru (aksi utama), lanjut kasus terakhir, impor file,
// dan riwayat hitung dua pekan terakhir. Skenario baru langsung ke wizard dalam mode Hitung kasus;
// mode Belajar dipilih di layar hasil (toggle Hitung kasus / Belajar), jadi tidak ditanya dua kali.

import { useRef, useState } from 'react';
import { TEKS_HITUNG } from '../konten/umum';
import { dariJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { ringkasKasus, type EntriRiwayat } from '../riwayat';
import { HeroMini } from '../ui/Hero';
import { Ikon } from '../ui/Ikon';
import { DaftarRiwayat } from './Riwayat';

interface Props {
  kasusTersimpan: Kasus | null;
  kirim: (aksi: Aksi) => void;
  saatLanjut: (kasus: Kasus) => void;
  saatBukaRiwayat: (entri: EntriRiwayat) => void;
  saatImpor: (kasus: Kasus) => void;
}

export function AwalHitung({ kasusTersimpan, kirim, saatLanjut, saatBukaRiwayat, saatImpor }: Props) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const saatPilihFile = async (file: File | undefined) => {
    if (!file) return;
    const hasil = dariJson(await file.text());
    if (hasil.berhasil) saatImpor(hasil.kasus);
    else setPesan(`File-nya nggak bisa dibuka: ${hasil.pesan}`);
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
          <span className="judul-pilihan"><Ikon nama="tambah" ukuran={22} />Skenario baru</span>
          <small>{TEKS_HITUNG.mulai.baru}{kasusTersimpan ? ' Kasus sekarang tetap tersimpan di riwayat.' : ''}</small>
        </button>
        {kasusTersimpan && terakhir && (
          <button type="button" className="kartu-pilihan kecil" onClick={() => saatLanjut(kasusTersimpan)}>
            <span className="judul-pilihan"><Ikon nama="riwayat" ukuran={22} />Lanjut kasus terakhir</span>
            <small>{terakhir.judul} · {terakhir.keterangan}</small>
          </button>
        )}
        <button type="button" className="kartu-pilihan kecil" onClick={() => inputFile.current?.click()}>
          <span className="judul-pilihan"><Ikon nama="berkas" ukuran={22} />Impor file</span>
          <small>{TEKS_HITUNG.mulai.impor}</small>
        </button>
        <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={event => void saatPilihFile(event.target.files?.[0])} />
      </div>
      {pesan && <p className="isian-salah" role="alert">{pesan}</p>}

      <section className="tumpuk-rapat riwayat-beranda" aria-labelledby="judul-riwayat">
        <h2 id="judul-riwayat" className="tanya-tujuan">Riwayat hitung</h2>
        <DaftarRiwayat kasusSekarang={kasusTersimpan} saatBuka={saatBukaRiwayat} ringkas />
      </section>
    </main>
  );
}
