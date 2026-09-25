// Daftar riwayat hitung: di beranda Hitung (dua pekan terakhir) dan penuh di #/riwayat; tiap entri bisa dihapus.
// Tiap entri: daftar ahli waris, sumbernya, harta (atau "Data belum lengkap"), dan kapan terakhir dibuka. Membuka entri
// memuat kasusnya ke layar hasil, atau ke langkah wizard yang belum lengkap; bila kalkulator sedang memuat kasus lain, tanya dulu.

import { useState } from 'react';
import { keJson, type Kasus } from '../kasus';
import { MASA_BERANDA, bacaRiwayat, hapusRiwayat, labelSumber, waktuRelatif, type EntriRiwayat } from '../riwayat';
import { tautanRiwayat } from '../rute';
import { DialogKonfirmasi } from '../ui/Dialog';
import { Ikon } from '../ui/Ikon';
import { TombolBukaKasus } from './belajar/TombolBukaKasus';

interface Props { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void; ringkas?: boolean }

export function DaftarRiwayat({ kasusSekarang, saatBuka, ringkas }: Props) {
  const [daftar, setDaftar] = useState(bacaRiwayat);
  const sekarang = Date.now();
  const tampil = ringkas ? daftar.filter(entri => sekarang - entri.waktu <= MASA_BERANDA) : daftar;
  // Hapus satu entri atau semua selalu ditanya dulu; riwayat tidak bisa dikembalikan.
  const [akanDihapus, setAkanDihapus] = useState<EntriRiwayat | 'semua' | null>(null);
  const hapus = (id?: string) => { hapusRiwayat(id); setDaftar(bacaRiwayat()); };
  if (tampil.length === 0) {
    if (ringkas && daftar.length > 0) {
      return <p className="keterangan">Tidak ada yang dibuka dua pekan terakhir. <a href={tautanRiwayat()}>Lihat semua riwayat</a></p>;
    }
    return (
      <div className="kartu-kosong">
        <Ikon nama="riwayat" ukuran={32} />
        <b>Riwayat hitung masih kosong</b>
        <p className="keterangan">Tiap kasus yang kamu mulai, dari skenario sendiri, latihan, atau materi, otomatis tersimpan di sini selama 30 hari.</p>
      </div>
    );
  }
  return (
    <>
      <ul className="daftar-polos daftar-soal daftar-riwayat">
        {tampil.map(entri => (
          <li key={entri.id} className="baris-soal">
            <div className="isi-soal">
              <b>{entri.judul}</b>
              <span className="keterangan">
                <span className="sumber-riwayat">{labelSumber(entri.sumber)}</span> · {entri.keterangan} · dibuka {waktuRelatif(entri.waktu, sekarang)}
              </span>
            </div>
            <TombolBukaKasus kasusSekarang={kasusSekarang && keJson(kasusSekarang) !== keJson(entri.kasus) ? kasusSekarang : null}
              saatBuka={() => saatBuka(entri)}>{entri.lengkap ? 'Buka' : 'Lanjut'}</TombolBukaKasus>
            <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setAkanDihapus(entri)} aria-label={`Hapus ${entri.judul}`} title="Hapus"><Ikon nama="sampah" ukuran={18} /></button>
          </li>
        ))}
      </ul>
      {ringkas ? <a href={tautanRiwayat()}>Lihat semua riwayat ({daftar.length})</a>
        : <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm tombol-hapus-semua" onClick={() => setAkanDihapus('semua')}><Ikon nama="sampah" ukuran={18} />Hapus semua riwayat</button>}
      {akanDihapus && (
        <DialogKonfirmasi judul={akanDihapus === 'semua' ? 'Hapus semua riwayat?' : 'Hapus kasus ini?'}
          labelLanjut={akanDihapus === 'semua' ? 'Hapus semua' : 'Hapus'} saatBatal={() => setAkanDihapus(null)}
          saatLanjut={() => { setAkanDihapus(null); hapus(akanDihapus === 'semua' ? undefined : akanDihapus.id); }}>
          <p>{akanDihapus === 'semua' ? `${daftar.length} kasus` : `"${akanDihapus.judul}"`} akan dihapus dari perangkat ini dan tidak bisa dikembalikan.</p>
        </DialogKonfirmasi>
      )}
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
