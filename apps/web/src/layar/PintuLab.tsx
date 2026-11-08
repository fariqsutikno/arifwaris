// Pintu Lab (spec kanvas 3): layar pertama sebelum stepper. Menerima callback pilihan; menyerahkan jenis kasus
// ('latihan' atau 'nyata') tanpa pilihan bawaan, karena jenis kasus menentukan seluruh isian sesudahnya.

import { useEffect } from 'react';
import type { JenisKasus } from '../kasus';
import { t } from '../terjemah';

/** Kunci t() ditulis literal supaya tes cakupan diksi menangkapnya. */
const daftarPilihan = (): Array<{ jenis: JenisKasus; judul: string; ket: string; butir: string[] }> => [
  { jenis: 'latihan', judul: t('hitung.kanvas.pintu_latihan'), ket: t('hitung.kanvas.pintu_latihan_ket'),
    butir: [t('hitung.kanvas.pintu_latihan_1'), t('hitung.kanvas.pintu_latihan_2'), t('hitung.kanvas.pintu_latihan_3')] },
  { jenis: 'nyata', judul: t('hitung.kanvas.pintu_nyata'), ket: t('hitung.kanvas.pintu_nyata_ket'),
    butir: [t('hitung.kanvas.pintu_nyata_1'), t('hitung.kanvas.pintu_nyata_2'), t('hitung.kanvas.pintu_nyata_3')] },
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
        <div className="kartu-pilihan-deret" role="radiogroup" aria-labelledby="pertanyaan-utama">
          {daftarPilihan().map(({ jenis, judul, ket, butir }) => (
            <button key={jenis} type="button" role="radio" aria-checked={false} className="kartu-pilihan" onClick={() => saatPilih(jenis)}>
              <span>{judul}</span>
              <small>{ket}</small>
              <ul className="daftar-polos">{butir.map(teks => <li key={teks}>{teks}</li>)}</ul>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
