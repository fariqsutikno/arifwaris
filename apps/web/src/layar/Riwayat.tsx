// Daftar riwayat hitung: di beranda Hitung (dua pekan terakhir) dan penuh di #/riwayat (dengan hapus).
// Tiap entri: daftar ahli waris, sumbernya, harta, dan kapan terakhir dibuka. Membuka entri memuat kasusnya ke
// layar hasil; bila kalkulator sedang memuat kasus lain, tanya dulu.

import { useState } from 'react';
import { keJson, type Kasus } from '../kasus';
import { MASA_BERANDA, bacaRiwayat, hapusRiwayat, labelSumber, waktuRelatif, type EntriRiwayat } from '../riwayat';
import { tautanRiwayat } from '../rute';
import { TombolBukaKasus } from './belajar/TombolBukaKasus';

interface Props { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void; ringkas?: boolean }

export function DaftarRiwayat({ kasusSekarang, saatBuka, ringkas }: Props) {
  const [daftar, setDaftar] = useState(bacaRiwayat);
  const sekarang = Date.now();
  const tampil = ringkas ? daftar.filter(entri => sekarang - entri.waktu <= MASA_BERANDA) : daftar;
  const hapus = (id?: string) => { hapusRiwayat(id); setDaftar(bacaRiwayat()); };
  if (tampil.length === 0) {
    return (
      <p className="keterangan">
        {ringkas && daftar.length > 0 ? <>Tidak ada yang dibuka dua pekan terakhir. <a href={tautanRiwayat()}>Lihat semua riwayat</a></>
          : 'Belum ada. Kasus yang sudah sampai hasil akan muncul di sini.'}
      </p>
    );
  }
  return (
    <>
      <ul className="daftar-polos daftar-soal">
        {tampil.map(entri => (
          <li key={entri.id} className="baris-soal">
            <div className="isi-soal">
              <b>{entri.judul}</b>
              <span className="meta-riwayat">
                <span className={`sumber-riwayat sumber-${entri.sumber.jenis}`}>{labelSumber(entri.sumber)}</span>
                <span className="keterangan">{entri.keterangan} · dibuka {waktuRelatif(entri.waktu, sekarang)}</span>
              </span>
            </div>
            <TombolBukaKasus kasusSekarang={kasusSekarang && keJson(kasusSekarang) !== keJson(entri.kasus) ? kasusSekarang : null}
              saatBuka={() => saatBuka(entri)}>Buka</TombolBukaKasus>
            {!ringkas && <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => hapus(entri.id)} aria-label={`Hapus ${entri.judul}`}>Hapus</button>}
          </li>
        ))}
      </ul>
      {ringkas ? <a href={tautanRiwayat()}>Lihat semua riwayat ({daftar.length})</a>
        : <button type="button" className="tautan-tombol" onClick={() => hapus()}>Hapus semua riwayat</button>}
    </>
  );
}

export function HalamanRiwayat(props: Omit<Props, 'ringkas'>) {
  return (
    <main className="halaman tumpuk">
      <h1>Riwayat hitung</h1>
      <p className="keterangan">Tersimpan di perangkat ini selama 30 hari sejak terakhir dibuka.</p>
      <DaftarRiwayat {...props} />
    </main>
  );
}
