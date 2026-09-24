// Beranda: janji singkat, pertanyaan pembuka (Hitung kasus / Belajar), lanjutkan kasus tersimpan, buka file.

import { useRef, useState } from 'react';
import { TEKS_BERANDA } from '../konten/umum';
import { dariJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import type { Tujuan } from '../preferensi';
import { Motif, Tombol } from '../ui/komponen';

export function Beranda({ kasusTersimpan, kirim }: { kasusTersimpan: Kasus | null; kirim: (aksi: Aksi) => void }) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const saatPilihFile = async (file: File | undefined) => {
    if (!file) return;
    const hasil = dariJson(await file.text());
    if (hasil.berhasil) kirim({ jenis: 'MUAT', kasus: hasil.kasus });
    else setPesan(`File-nya nggak bisa dibuka: ${hasil.pesan}`);
  };
  const saatPilihTujuan = (tujuan: Tujuan) => { kirim({ jenis: 'PILIH_TUJUAN', tujuan }); kirim({ jenis: 'MULAI' }); };
  return (
    <Motif>
      <main className="halaman tumpuk beranda">
        <h1 className="judul-beranda">{TEKS_BERANDA.judul}</h1>
        <p className="lead">{TEKS_BERANDA.janji}</p>
        <ul className="fakta-beranda">{TEKS_BERANDA.fakta.map(fakta => <li key={fakta}>{fakta}</li>)}</ul>
        <h2 className="tanya-tujuan">{TEKS_BERANDA.tanyaTujuan}</h2>
        <div className="kartu-pilihan-deret">
          {(['hitung', 'belajar'] as const).map(tujuan => (
            <button key={tujuan} type="button" className="kartu-pilihan kartu-tujuan" onClick={() => saatPilihTujuan(tujuan)}>
              <span>{TEKS_BERANDA.tujuan[tujuan].judul}</span>
              <small>{TEKS_BERANDA.tujuan[tujuan].keterangan}</small>
            </button>
          ))}
        </div>
        <div className="chip-deret">
          {kasusTersimpan && <Tombol varian="sun" onClick={() => { kirim({ jenis: 'MUAT', kasus: kasusTersimpan }); kirim({ jenis: 'KE_LANGKAH', langkah: 1 }); }}>Lanjutkan kasus terakhir</Tombol>}
          <Tombol varian="secondary" onClick={() => inputFile.current?.click()}>Buka file</Tombol>
          <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={event => void saatPilihFile(event.target.files?.[0])} />
        </div>
        {pesan && <p className="isian-salah" role="alert">{pesan}</p>}
      </main>
    </Motif>
  );
}
