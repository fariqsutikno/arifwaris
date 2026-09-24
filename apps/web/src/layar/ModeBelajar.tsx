// Mode belajar: bab penjelasan yang sama dengan layar hasil, satu per layar.
// Bab yang sudah dilewati ditandai "Kelar". Menerima Kasus; kembali ke hasil lewat kirim.

import { useMemo, useState } from 'react';
import { jalankan } from '../jalankan';
import type { Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { Stiker, Tombol } from '../ui/komponen';
import { BabSebagaiLangkah, daftarBabDari } from './Penjelasan';

export function ModeBelajar({ kasus, kirim }: { kasus: Kasus; kirim: (aksi: Aksi) => void }) {
  const daftarBab = useMemo(() => daftarBabDari(kasus, jalankan(kasus)), [kasus]);
  const [indeks, setIndeks] = useState(0);
  const keHasil = () => kirim({ jenis: 'KE_LAYAR', layar: 'hasil' });
  const babIni = daftarBab[indeks];
  if (!babIni) return <main className="halaman"><Tombol onClick={keHasil}>Balik ke hasil</Tombol></main>;
  const adalahTerakhir = indeks === daftarBab.length - 1;
  return (
    <main className="halaman tumpuk">
      <Stiker>Langkah {indeks + 1}/{daftarBab.length}</Stiker>
      {daftarBab.slice(0, indeks).map((bab, nomor) => <BabSebagaiLangkah key={nomor} nomor={nomor + 1} babBerjudul={bab} sudahDibaca />)}
      <BabSebagaiLangkah nomor={indeks + 1} babBerjudul={babIni} />
      {indeks > 0 && <p className="keterangan">Mantap, {indeks} langkah kelar. Tinggal {daftarBab.length - indeks} lagi.</p>}
      <div className="baris-tombol">
        <Tombol varian="secondary" onClick={() => (indeks === 0 ? keHasil() : setIndeks(indeks - 1))}>Kembali</Tombol>
        <Tombol onClick={() => (adalahTerakhir ? keHasil() : setIndeks(indeks + 1))}>{adalahTerakhir ? 'Selesai, lihat hasil' : 'Gas, lanjut'}</Tombol>
      </div>
    </main>
  );
}
