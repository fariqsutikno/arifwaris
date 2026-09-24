// Beranda: mulai kasus baru, lanjutkan kasus tersimpan, atau import file JSON.

import { useRef, useState } from 'react';
import { dariJson, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { Motif, Stabilo, Tombol } from '../ui/komponen';

export function Beranda({ kasusTersimpan, kirim }: { kasusTersimpan: Kasus | null; kirim: (aksi: Aksi) => void }) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const saatPilihFile = async (file: File | undefined) => {
    if (!file) return;
    const hasil = dariJson(await file.text());
    if (hasil.berhasil) kirim({ jenis: 'MUAT', kasus: hasil.kasus });
    else setPesan(`File-nya nggak bisa dibuka: ${hasil.pesan}`);
  };
  return (
    <Motif>
      <main className="halaman tumpuk" style={{ paddingTop: 64 }}>
        <h1 className="judul-langkah" style={{ fontSize: 44, lineHeight: '48px' }}>Waris itu gampang, asal tahu <Stabilo>urutannya</Stabilo>.</h1>
        <p>Masukin kasusnya, ikutin langkahnya. Tiap angka dijelasin, lengkap sama dalilnya. Semua dihitung di perangkatmu, nggak dikirim ke mana-mana.</p>
        <div className="chip-deret">
          <Tombol onClick={() => kirim({ jenis: 'MULAI', jenisKelamin: 'L' })}>Mulai hitung</Tombol>
          {kasusTersimpan && <Tombol varian="sun" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 1 })}>Lanjutin kasus terakhir</Tombol>}
          <Tombol varian="secondary" onClick={() => inputFile.current?.click()}>Buka file kasus</Tombol>
          <input ref={inputFile} type="file" accept="application/json,.json" hidden onChange={event => void saatPilihFile(event.target.files?.[0])} />
        </div>
        {pesan && <p className="isian-salah" role="alert">{pesan}</p>}
        <p className="keterangan">Menurut madzhab Syafi'i. Hukum positif (KHI) belum termasuk.</p>
      </main>
    </Motif>
  );
}
