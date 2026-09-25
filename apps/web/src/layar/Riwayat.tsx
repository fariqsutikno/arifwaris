// Daftar riwayat hitung: dipakai ringkas di beranda (5 terbaru) dan penuh di halaman #/riwayat (dengan hapus).
// Membuka entri memuat kasusnya ke layar hasil; bila kalkulator sedang memuat kasus lain, tanya dulu.

import { useState } from 'react';
import { keJson, type Kasus } from '../kasus';
import { bacaRiwayat, hapusRiwayat, waktuRelatif, type EntriRiwayat } from '../riwayat';
import { tautanRiwayat } from '../rute';
import { TombolBukaKasus } from './belajar/TombolBukaKasus';

interface Props { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void; batas?: number }

export function DaftarRiwayat({ kasusSekarang, saatBuka, batas }: Props) {
  const [daftar, setDaftar] = useState(bacaRiwayat);
  const tampil = batas ? daftar.slice(0, batas) : daftar;
  const sekarang = Date.now();
  const hapus = (id?: string) => { hapusRiwayat(id); setDaftar(bacaRiwayat()); };
  if (daftar.length === 0) return <p className="keterangan">Belum ada. Kasus yang sudah sampai ke hasil akan muncul di sini.</p>;
  return (
    <>
      <ul className="daftar-polos daftar-soal">
        {tampil.map(entri => (
          <li key={entri.id} className="baris-soal">
            <div className="isi-soal">
              <b>{entri.judul}</b>
              <span className="keterangan">{entri.keterangan} · {waktuRelatif(entri.waktu, sekarang)}</span>
            </div>
            <TombolBukaKasus kasusSekarang={kasusSekarang && keJson(kasusSekarang) !== keJson(entri.kasus) ? kasusSekarang : null}
              saatBuka={() => saatBuka(entri)}>Buka</TombolBukaKasus>
            {!batas && <button type="button" className="tautan-tombol" onClick={() => hapus(entri.id)} aria-label={`Hapus ${entri.judul}`}>Hapus</button>}
          </li>
        ))}
      </ul>
      {batas && daftar.length > batas && <a href={tautanRiwayat()}>Lihat semua ({daftar.length})</a>}
      {!batas && <button type="button" className="tautan-tombol" onClick={() => hapus()}>Hapus semua riwayat</button>}
    </>
  );
}

export function HalamanRiwayat(props: Omit<Props, 'batas'>) {
  return (
    <main className="halaman tumpuk">
      <h1>Riwayat hitung</h1>
      <p className="keterangan">Tersimpan di perangkat ini saja.</p>
      <DaftarRiwayat {...props} />
    </main>
  );
}
