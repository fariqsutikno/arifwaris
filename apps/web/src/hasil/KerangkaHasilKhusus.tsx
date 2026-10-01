// Kerangka layar hasil bab 13 (janin, hilang, kelamin ganda, wafat bersamaan, menunggu, perlu input): memakai hero dan lembar yang sama
// dengan Hasil biasa (gaya Logivo) supaya kasus yang paling rumit tidak terasa seperti aplikasi lain. Hero = judul tenang, aksi
// (Ekspor, Ubah data), angka ringkas, dan pohon susunan (graf saja: bagian orang belum pasti jadi tidak digambar sebagai angka).
// Isi jawaban (kartu) diberikan pemanggil lewat children; kaki memuat catatan dan "Mulai kasus baru".

import { useEffect, useState, type ReactNode } from 'react';
import { TAUTAN_LAPORAN } from '../konten/umum';
import { formatRupiahRingkas } from '../format';
import type { Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { KonfirmasiKasusBaru } from '../layar/KonfirmasiKasusBaru';
import { PohonSusunan } from '../layar/lab/PohonSusunan';
import { Ikon } from '../ui/Ikon';
import { ModalEkspor } from './ModalEkspor';
import { t } from '../terjemah';

const SKALA_MAKS = 1.3;

interface Props {
  kasus: Kasus;
  kirim: (aksi: Aksi) => void;
  judul: string;
  keterangan?: string | undefined;
  /** Angka ringkas di hero selain total harta dan jumlah orang. */
  statistik?: Array<{ nilai: string; label: string }>;
  /** Hasil yang belum berupa pembagian (menunggu, perlu input, pesan) tidak bisa diekspor. */
  bolehEkspor?: boolean;
  children: ReactNode;
}

export function KerangkaHasilKhusus({ kasus, kirim, judul, keterangan, statistik = [], bolehEkspor = true, children }: Props) {
  const [eksporTerbuka, setEksporTerbuka] = useState(false);
  const [konfirmasiUlangi, setKonfirmasiUlangi] = useState(false);
  // Penanda halaman yang sama dengan Hasil biasa: latar krem dan navbar menyatu dengan hero.
  useEffect(() => { document.body.classList.add('layar-hasil'); return () => document.body.classList.remove('layar-hasil'); }, []);
  const jumlahOrang = Object.values(kasus.graf.orang).filter(orang => !orang.penghubung).length;
  const semuaStatistik = [{ nilai: formatRupiahRingkas(kasus.tirkah.kotor), label: t('hitung.total_harta') }, ...statistik, { nilai: String(jumlahOrang), label: t('hitung.orang_di_pohon') }];
  return (
    <main className="halaman-hasil halaman-hasil-khusus">
      <header className="hero-hasil">
        <div className="judul-hasil">
          <div className="judul-soal">
            <p className="lok-hero">{t('hitung.menurut_madzhab_syafii')}</p>
            <h1>{judul}</h1>
            {keterangan && <p>{keterangan}</p>}
          </div>
          <div className="aksi-hero">
            {bolehEkspor && <button type="button" className="pil-hero" onClick={() => setEksporTerbuka(true)}><Ikon nama="unduh" /> {t('hitung.ekspor')}</button>}
            <button type="button" className="tautan-hero" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3 })}>{t('hitung.ubah_data_2')}</button>
          </div>
          <dl className="statistik-hero">
            {semuaStatistik.map(({ nilai, label }) => <div key={label}><dd>{nilai}</dd><dt>{label}</dt></div>)}
          </dl>
        </div>
        <div className="hero-pohon hero-pohon-khusus" aria-label={t('hitung.pohon_keluarga')}>
          <PohonSusunan kasus={kasus} skalaMaks={SKALA_MAKS} />
        </div>
      </header>

      <div className="tata-hasil"><div className="kolom-khusus">{children}</div></div>

      <footer className="kaki-hasil">
        <p>{t('hitung.hasil_ini_menurut_madzhab_syafi_i')} {t('hitung.nemu_yang_janggal')} <a href={TAUTAN_LAPORAN} target="_blank" rel="noopener">{t('umum.laporkan_ke_pengembang')}</a>.</p>
        <div className="aksi-kaki">
          <button type="button" className="tautan-aksi" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 3 })}>{t('hitung.ubah_data_2')}</button>
          <button type="button" className="tautan-aksi" onClick={() => setKonfirmasiUlangi(true)}>{t('hitung.mulai_dari_awal')}</button>
        </div>
      </footer>

      {konfirmasiUlangi && (
        <KonfirmasiKasusBaru kasus={kasus} saatBatal={() => setKonfirmasiUlangi(false)} saatLanjut={() => { setKonfirmasiUlangi(false); kirim({ jenis: 'ULANGI' }); }} />
      )}
      {eksporTerbuka && <ModalEkspor kasus={kasus} saatTutup={() => setEksporTerbuka(false)} />}
    </main>
  );
}
