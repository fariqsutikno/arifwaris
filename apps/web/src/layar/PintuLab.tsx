// Pintu Lab (spec kanvas 3): layar pertama sebelum stepper. Menerima callback pilihan; menyerahkan jenis kasus
// ('latihan' atau 'nyata') tanpa pilihan bawaan, karena jenis kasus menentukan seluruh isian sesudahnya.

import { useEffect } from 'react';
import type { JenisKasus } from '../kasus';
import { panah, t } from '../terjemah';
import { Ikon, type NamaIkon } from '../ui/Ikon';

/** Kunci t() ditulis literal supaya tes cakupan diksi menangkapnya. */
const daftarPilihan = (): Array<{ jenis: JenisKasus; ikon: NamaIkon; judul: string; ket: string }> => [
  { jenis: 'latihan', ikon: 'pelajaran', judul: t('hitung.kanvas.pintu_latihan'), ket: t('hitung.kanvas.pintu_latihan_ket') },
  { jenis: 'nyata', ikon: 'rumah', judul: t('hitung.kanvas.pintu_nyata'), ket: t('hitung.kanvas.pintu_nyata_ket') },
];

export function PintuLab({ saatPilih }: { saatPilih: (jenisKasus: JenisKasus) => void }) {
  // Penanda halaman: latar krem dan navbar menyatu dengan hero gelap, sama dengan Awal Lab.
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  return (
    <main className="halaman-beranda halaman-lab">
      <header className="hero-beranda hero-pusat hero-lab">
        <div className="sapa-pusat">
          <h1 id="pertanyaan-utama">{t('hitung.kanvas.pintu_judul')}</h1>
          <p className="lead">{t('hitung.kanvas.pintu_ket')}</p>
        </div>
      </header>
      <div className="tata-beranda">
        <ul className="daftar-polos lab-ubin-pintu" role="radiogroup" aria-labelledby="pertanyaan-utama">
          {daftarPilihan().map(({ jenis, ikon, judul, ket }) => (
            <li key={jenis} role="none">
              <button type="button" role="radio" aria-checked={false} className="ubin ubin-lab" onClick={() => saatPilih(jenis)}>
                <span className="panah-bulat" aria-hidden="true">{panah()}</span>
                <Ikon nama={ikon} ukuran={40} />
                <b className="judul-ubin">{judul}</b>
                <span className="keterangan">{ket}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
