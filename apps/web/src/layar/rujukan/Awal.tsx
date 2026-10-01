// Awal Rujukan: hero gelap dengan kolom cari, lalu ubin per jenis dalil. Tidak menerima props; memutuskan hasil cari
// dari kata yang diketik; menyerahkan pembaca ke #/rujukan/<kategori> atau #/rujukan/<kode>.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { angka, panah, t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { pisahKataAkhir, useCahayaIkutKursor } from '../../ui/sorotan';
import { tautanRujukan } from '../../rute';
import { cariRujukanTeks } from './cari';
import { DAFTAR_KATEGORI, jumlahDi } from './Kategori';

const JUMLAH_HASIL = 12;
const HURUF_MINIMAL = 2;

export function Awal() {
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  const hero = useRef<HTMLElement>(null);
  useCahayaIkutKursor(hero);
  const [kata, setKata] = useState('');
  const hasil = cariRujukanTeks(kata);
  const [judulAwal, kataTekanan] = pisahKataAkhir(t('umum.rujukan'));
  return (
    <main className="halaman-beranda halaman-rujukan">
      <header className="hero-beranda hero-pusat" ref={hero}>
        <div className="sapa-pusat">
          <h1>{judulAwal} <span className="tekanan">{kataTekanan}</span></h1>
          <p className="lead">{t('rujukan.al_qur_an_sunnah_atsar_ijma')}</p>
        </div>
        <div className="panel-cari-rujukan">
          <input type="search" className="kolom-cari-rujukan" aria-label={t('rujukan.cari_label')} placeholder={t('rujukan.cari_label')}
            value={kata} onChange={event => setKata(event.target.value)} />
          {kata.trim().length >= HURUF_MINIMAL && (
            <div role="status" className="hasil-cari-rujukan">
              {hasil.length === 0 ? <p>{t('rujukan.tidak_ada_hasil')}</p> : (
                <>
                  <p>{t('rujukan.hasil_cari', { jumlah: angka(String(hasil.length)) })}</p>
                  <ul className="daftar-polos">
                    {hasil.slice(0, JUMLAH_HASIL).map(isi => (
                      <li key={`${isi.tautan}-${isi.judul}`}><a href={isi.tautan}><b>{isi.judul}</b><span>{isi.keterangan}</span></a></li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <h2 className="judul-bagian">{t('rujukan.jelajah_kategori')}</h2>
      <ul className="daftar-polos deret-ubin-rujukan">
        {DAFTAR_KATEGORI.map((kategori, urutan) => (
          <li key={kategori.id}>
            <a className="ubin ubin-rujukan" style={{ '--i': urutan } as CSSProperties} href={tautanRujukan(kategori.id)}>
              <Ikon nama="rujukan" ukuran={28} />
              <b className="judul-ubin">{kategori.judul}</b>
              <span className="keterangan">{t('rujukan.jumlah_dalil', { jumlah: angka(String(jumlahDi(kategori))) })}</span>
              <span className="panah-bulat" aria-hidden="true">{panah()}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
