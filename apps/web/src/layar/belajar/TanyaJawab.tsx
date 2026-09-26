// Tanya jawab: kasus waris dan penyelesaiannya menurut ustadz atau fatwa, dibaca sebagai artikel. Beda dengan FAQ
// (pertanyaan konsep umum): tiap entri adalah satu cerita kasus.
// `#/tanya-jawab` = daftar (cari + chip kategori); `#/tanya-jawab/<slug>` = artikel, bisa dibagikan dan diatur ukuran hurufnya.

import { useState } from 'react';
import { DAFTAR_TANYA_JAWAB, JENIS_TANYA_JAWAB, semuaPotongan, type JenisTanyaJawab, type KasusTanyaJawab } from '@waris/content';
import type { Kasus } from '../../kasus';
import { UKURAN_BACA, bacaUkuranBaca, simpanUkuranBaca } from '../../preferensi';
import { tautanTanyaJawab } from '../../rute';
import { Bagikan } from '../../ui/Bagikan';
import { HeroMini } from '../../ui/Hero';
import { BlokMateri } from './Materi';
import { t, terjemahIsi } from '../../terjemah';

interface Props { slug?: string | undefined; kasusSekarang: Kasus | null; saatCoba: (kasus: Kasus) => void }

export function TanyaJawab({ slug, kasusSekarang, saatCoba }: Props) {
  if (!slug) return <DaftarTanyaJawab />;
  const entri = DAFTAR_TANYA_JAWAB.find(kasus => kasus.slug === slug);
  if (!entri) return <main className="halaman tumpuk"><p role="alert">{t('Kasus ini tidak ditemukan.')}</p><a href={tautanTanyaJawab()}>{t('Semua kasus')}</a></main>;
  return <ArtikelTanyaJawab entri={entri} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />;
}

function DaftarTanyaJawab() {
  const [kataKunci, setKataKunci] = useState('');
  const [jenis, setJenis] = useState<JenisTanyaJawab | null>(null);
  const cari = normal(kataKunci.trim());
  const cocok = DAFTAR_TANYA_JAWAB.filter(entri => (!jenis || entri.jenis === jenis) && normal(teksCari(entri)).includes(cari));
  return (
    <main className="halaman tumpuk halaman-faq">
      <HeroMini judul={t('Tanya jawab')} keterangan={t('Kasus waris sungguhan, seperti sengketa keluarga, beserta penyelesaiannya dari ustadz atau lembaga fatwa.')} ikon="tanya" />
      <label className="isian">
        {t('Cari kasus')}
        <input type="search" value={kataKunci} onChange={event => setKataKunci(event.target.value)} placeholder={t('mis. rumah, sengketa, anak tiri')} />
      </label>
      <div className="chip-deret" role="group" aria-label={t('Kategori')}>
        <button type="button" className="chip-kecil" aria-pressed={jenis === null} onClick={() => setJenis(null)}>{t('Semua')}</button>
        {JENIS_TANYA_JAWAB.map(pilihan => (
          <button key={pilihan} type="button" className="chip-kecil" aria-pressed={jenis === pilihan} onClick={() => setJenis(pilihan)}>{t(pilihan)}</button>
        ))}
      </div>
      {cocok.length === 0 && <p className="keterangan">{t('Belum ada kasus yang cocok. Coba kata atau kategori lain.')}</p>}
      <ul className="daftar-polos grid-artikel">
        {cocok.map(entri => (
          <li key={entri.slug}>
            <a className="kartu-artikel" href={tautanTanyaJawab(entri.slug)}>
              <span className="chip-jenis">{t(entri.jenis)}</span>
              <b>{terjemahIsi(entri.judul)}</b>
              <span className="keterangan">{terjemahIsi(entri.ringkasan)}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

function ArtikelTanyaJawab({ entri, kasusSekarang, saatCoba }: { entri: KasusTanyaJawab } & Omit<Props, 'slug'>) {
  const [ukuran, setUkuran] = useState(bacaUkuranBaca);
  const posisi = UKURAN_BACA.indexOf(ukuran as (typeof UKURAN_BACA)[number]);
  const ubahUkuran = (arah: -1 | 1) => {
    const baru = UKURAN_BACA[posisi + arah];
    if (baru) { setUkuran(baru); simpanUkuranBaca(baru); }
  };
  return (
    <main className="halaman artikel-tj">
      <span className="chip-jenis">{t(entri.jenis)}</span>
      <h1>{terjemahIsi(entri.judul)}</h1>
      <div className="meta-artikel">
        <span className="keterangan">{t('Sumber')}: {entri.sumber}</span>
        <span className="pengisi" />
        <div className="atur-huruf" role="group" aria-label={t('Ukuran huruf')}>
          <button type="button" className="chip-kecil" onClick={() => ubahUkuran(-1)} disabled={posisi <= 0} aria-label={t('Perkecil huruf')}>A−</button>
          <button type="button" className="chip-kecil" onClick={() => ubahUkuran(1)} disabled={posisi >= UKURAN_BACA.length - 1} aria-label={t('Perbesar huruf')}>A+</button>
        </div>
      </div>
      <article className="isi-materi isi-artikel" style={{ fontSize: ukuran }}>
        <h2>{t('Kasus')}</h2>
        {entri.kasus.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
        <h2>{t('Penyelesaian')}</h2>
        {entri.penyelesaian.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
      </article>
      <Bagikan judul={entri.judul} tautan={tautanTanyaJawab(entri.slug)} label="Bagikan kasus ini" />
    </main>
  );
}

const normal = (teks: string) => teks.toLowerCase().replace(/['’]/g, '');
const teksCari = (entri: KasusTanyaJawab) => [entri.judul, entri.ringkasan,
  ...semuaPotongan([...entri.kasus, ...entri.penyelesaian]).map(potongan => ('teks' in potongan ? potongan.teks : ''))].join(' ');
