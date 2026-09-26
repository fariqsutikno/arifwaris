// Header global: logo, menu utama (Beranda · Belajar · ArifLab · Latihan · Rujukan), tur, dan "Reset skenario"
// (hanya di wizard; layar hasil punya tombolnya sendiri di bar aksi). Di HP menu utama pindah ke nav bawah.
// Tidak memuat tombol simpan (spec: Navigasi global).

import { useState } from 'react';
import { Logo, Tombol } from '../ui/komponen';
import type { Kasus } from '../kasus';
import { Ikon, type NamaIkon } from '../ui/Ikon';
import { KonfirmasiKasusBaru } from './KonfirmasiKasusBaru';
import { DAFTAR_BAHASA, simpanBahasa, useBahasa, type Bahasa } from '../preferensi';
import { TAUTAN_BERANDA, TAUTAN_KALKULATOR, tautanBelajar, tautanLatihan, tautanRujukan, type Rute } from '../rute';
import { t } from '../terjemah';

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
  const bahasa = useBahasa();
  const menu: Array<{ label: string; ikon: NamaIkon; tautan: string; aktif: boolean; saatKlik?: () => void }> = [
    { label: t('umum.beranda'), ikon: 'rumah', tautan: TAUTAN_BERANDA, aktif: halaman === 'beranda' },
    { label: t('umum.belajar'), ikon: 'pelajaran', tautan: tautanBelajar(), aktif: ['belajar', 'materi', 'glosarium', 'faq', 'tanya-jawab'].includes(halaman) },
    { label: 'ArifLab', ikon: 'hitung', tautan: TAUTAN_KALKULATOR, aktif: halaman === 'kalkulator' || halaman === 'riwayat', saatKlik: saatKeHitung },
    { label: t('umum.latihan'), ikon: 'kuis', tautan: tautanLatihan(), aktif: halaman === 'latihan' },
    { label: t('umum.rujukan'), ikon: 'rujukan', tautan: tautanRujukan(), aktif: halaman === 'rujukan' },
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
        <nav aria-label={t('umum.menu_utama')} className="kepala-nav">{tautanMenu('kepala-menu', false)}</nav>
        <span className="pengisi" />
        {/* Mode santri: padanan Arab untuk istilah, atau penjelasan berbahasa Arab. */}
        <select className="pilih-bahasa" aria-label={t('umum.bahasa')} value={bahasa} onChange={e => { simpanBahasa(e.target.value as Bahasa); window.location.reload(); }}>
          {DAFTAR_BAHASA.map(pilihan => <option key={pilihan.nilai} value={pilihan.nilai}>{pilihan.label}</option>)}
        </select>
        {/* Di layar sempit hanya ikon (label tetap dibaca pembaca layar lewat aria-label). */}
        {adaTur && <Tombol varian="secondary" kecil className="tombol-kepala" aria-label={t('umum.tur_singkat')} title={t('umum.tur_singkat')} onClick={saatTur}><Ikon nama="tanya" ukuran={18} /><span className="label-lebar">{t('umum.tur_singkat')}</span></Tombol>}
        {kasusWizard && <Tombol varian="secondary" kecil className="tombol-kepala" aria-label={t('umum.reset_skenario_2')} title={t('umum.reset_skenario_2')} onClick={() => setSedangKonfirmasi(true)}><Ikon nama="riwayat" ukuran={18} /><span className="label-lebar">{t('umum.reset_skenario_2')}</span></Tombol>}
      </header>
      <nav aria-label={t('umum.menu_utama')} className="nav-bawah">{tautanMenu('nav-bawah-item', true)}</nav>
      {sedangKonfirmasi && kasusWizard && (
        <KonfirmasiKasusBaru kasus={kasusWizard} judul={t('umum.reset_skenario')} labelLanjut={t('umum.reset')} saatBatal={() => setSedangKonfirmasi(false)}
          saatLanjut={() => { setSedangKonfirmasi(false); saatUlangi(); }} />
      )}
    </>
  );
}
