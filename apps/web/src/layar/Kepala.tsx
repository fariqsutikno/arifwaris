// Header global: logo, menu utama (Beranda · ArifLab · Belajar · Latihan · Rujukan), tur, dan "Reset skenario"
// (hanya di wizard; layar hasil punya tombolnya sendiri di bar aksi). Di HP menu utama pindah ke nav bawah.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';
import type { Kasus } from '../kasus';
import { Ikon, type NamaIkon } from '../ui/Ikon';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { TAUTAN_BERANDA, TAUTAN_KALKULATOR, tautanBelajar, tautanLatihan, tautanRujukan, type Rute } from '../rute';

interface Props {
  halaman: Rute['halaman'];
  /** Kasus di wizard yang bisa diulang dari awal; null = tombol Ulangi tidak tampil. */
  kasusWizard: Kasus | null;
  adaTur: boolean;
  saatKeHitung: () => void;
  saatTur: () => void;
  saatUlangi: () => void;
}

export function Kepala({ halaman, kasusWizard, adaTur, saatKeHitung, saatTur, saatUlangi }: Props) {
  const [sedangKonfirmasi, setSedangKonfirmasi] = useState(false);
  const menu: Array<{ label: string; ikon: NamaIkon; tautan: string; aktif: boolean; saatKlik?: () => void }> = [
    { label: 'Beranda', ikon: 'rumah', tautan: TAUTAN_BERANDA, aktif: halaman === 'beranda' },
    { label: 'ArifLab', ikon: 'hitung', tautan: TAUTAN_KALKULATOR, aktif: halaman === 'kalkulator' || halaman === 'riwayat', saatKlik: saatKeHitung },
    { label: 'Belajar', ikon: 'pelajaran', tautan: tautanBelajar(), aktif: ['belajar', 'materi', 'glosarium', 'faq'].includes(halaman) },
    { label: 'Latihan', ikon: 'kuis', tautan: tautanLatihan(), aktif: halaman === 'latihan' },
    { label: 'Rujukan', ikon: 'rujukan', tautan: tautanRujukan(), aktif: halaman === 'rujukan' },
  ];
  const tautanMenu = (kelas: string, denganIkon: boolean) => menu.map(item => (
    <a key={item.label} href={item.tautan} className={kelas} aria-current={item.aktif ? 'page' : undefined}
      onClick={item.saatKlik}>
      {denganIkon && <Ikon nama={item.ikon} ukuran={22} />}{item.label}
    </a>
  ));
  return (
    <>
      <header className="kepala" role="banner">
        <Logo saatKlik={() => { window.location.hash = TAUTAN_BERANDA; }} />
        <nav aria-label="Menu utama" className="kepala-nav">{tautanMenu('kepala-menu', false)}</nav>
        <span className="pengisi" />
        {/* Di layar sempit hanya ikon (label tetap dibaca pembaca layar lewat aria-label). */}
        {adaTur && <Tombol varian="secondary" kecil className="tombol-kepala" aria-label="Tur singkat" title="Tur singkat" onClick={saatTur}><Ikon nama="tanya" ukuran={18} /><span className="label-lebar">Tur singkat</span></Tombol>}
        {kasusWizard && <Tombol varian="secondary" kecil className="tombol-kepala" aria-label="Reset skenario" title="Reset skenario" onClick={() => setSedangKonfirmasi(true)}><Ikon nama="riwayat" ukuran={18} /><span className="label-lebar">Reset skenario</span></Tombol>}
      </header>
      <nav aria-label="Menu utama" className="nav-bawah">{tautanMenu('nav-bawah-item', true)}</nav>
      {sedangKonfirmasi && kasusWizard && (
        <KonfirmasiKasusBaru kasus={kasusWizard} judul="Reset skenario?" labelLanjut="Reset" saatBatal={() => setSedangKonfirmasi(false)}
          saatLanjut={() => { setSedangKonfirmasi(false); saatUlangi(); }} />
      )}
    </>
  );
}
