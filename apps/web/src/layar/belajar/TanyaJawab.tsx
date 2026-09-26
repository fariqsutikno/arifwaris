// Tanya jawab: kasus waris dan penyelesaiannya menurut ustadz atau fatwa, dibaca sebagai artikel. Beda dengan FAQ
// (pertanyaan konsep umum): tiap entri adalah satu cerita kasus.
// `#/tanya-jawab` = daftar (cari + chip kategori); `#/tanya-jawab/<slug>` = artikel, bisa dibagikan dan diatur ukuran hurufnya.

import { useState } from 'react';
import { JENIS_TANYA_JAWAB, semuaPotongan, type JenisTanyaJawab, type KasusTanyaJawab } from '@waris/content';
import { daftarTanyaJawab } from '../../konten/sumber';
import type { Kasus } from '../../kasus';
import { UKURAN_BACA, bacaUkuranBaca, simpanUkuranBaca } from '../../preferensi';
import { tautanTanyaJawab } from '../../rute';
import { Bagikan } from '../../ui/Bagikan';
import { HeroMini } from '../../ui/Hero';
import { BlokMateri } from './Materi';
import { t } from '../../terjemah';

const TEKS_JENIS = (): Record<JenisTanyaJawab, string> => ({ 'Saran ustadz': t('tanya_jawab.saran_ustadz'), Fatwa: t('tanya_jawab.fatwa') });

interface Props { slug?: string | undefined; kasusSekarang: Kasus | null; saatCoba: (kasus: Kasus) => void }

export function TanyaJawab({ slug, kasusSekarang, saatCoba }: Props) {
  if (!slug) return <DaftarTanyaJawab />;
  const entri = daftarTanyaJawab().find(kasus => kasus.slug === slug);
  if (!entri) return <main className="halaman tumpuk"><p role="alert">{t('tanya_jawab.kasus_ini_tidak_ditemukan')}</p><a href={tautanTanyaJawab()}>{t('tanya_jawab.semua_kasus')}</a></main>;
  return <ArtikelTanyaJawab entri={entri} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />;
}

function DaftarTanyaJawab() {
  const [kataKunci, setKataKunci] = useState('');
  const [jenis, setJenis] = useState<JenisTanyaJawab | null>(null);
  const cari = normal(kataKunci.trim());
  const cocok = daftarTanyaJawab().filter(entri => (!jenis || entri.jenis === jenis) && normal(teksCari(entri)).includes(cari));
  return (
    <main className="halaman tumpuk halaman-faq">
      <HeroMini judul={t('umum.tanya_jawab')} keterangan={t('tanya_jawab.kasus_waris_sungguhan_seperti_sengketa_keluarga')} ikon="tanya" />
      <label className="isian">
        {t('tanya_jawab.cari_kasus')}
        <input type="search" value={kataKunci} onChange={event => setKataKunci(event.target.value)} placeholder={t('tanya_jawab.mis_rumah_sengketa_anak_tiri')} />
      </label>
      <div className="chip-deret" role="group" aria-label={t('tanya_jawab.kategori')}>
        <button type="button" className="chip-kecil" aria-pressed={jenis === null} onClick={() => setJenis(null)}>{t('tanya_jawab.semua')}</button>
        {JENIS_TANYA_JAWAB.map(pilihan => (
          <button key={pilihan} type="button" className="chip-kecil" aria-pressed={jenis === pilihan} onClick={() => setJenis(pilihan)}>{TEKS_JENIS()[pilihan]}</button>
        ))}
      </div>
      {cocok.length === 0 && <p className="keterangan">{t('tanya_jawab.belum_ada_kasus_yang_cocok_coba')}</p>}
      <ul className="daftar-polos grid-artikel">
        {cocok.map(entri => (
          <li key={entri.slug}>
            <a className="kartu-artikel" href={tautanTanyaJawab(entri.slug)}>
              <span className="chip-jenis">{TEKS_JENIS()[entri.jenis]}</span>
              <b>{entri.judul}</b>
              <span className="keterangan">{entri.ringkasan}</span>
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
      <span className="chip-jenis">{TEKS_JENIS()[entri.jenis]}</span>
      <h1>{entri.judul}</h1>
      <div className="meta-artikel">
        <span className="keterangan">{t('tanya_jawab.sumber')}: {entri.sumber}</span>
        <span className="pengisi" />
        <div className="atur-huruf" role="group" aria-label={t('tanya_jawab.ukuran_huruf')}>
          <button type="button" className="chip-kecil" onClick={() => ubahUkuran(-1)} disabled={posisi <= 0} aria-label={t('tanya_jawab.perkecil_huruf')}>A−</button>
          <button type="button" className="chip-kecil" onClick={() => ubahUkuran(1)} disabled={posisi >= UKURAN_BACA.length - 1} aria-label={t('tanya_jawab.perbesar_huruf')}>A+</button>
        </div>
      </div>
      <article className="isi-materi isi-artikel" style={{ fontSize: ukuran }}>
        <h2>{t('tanya_jawab.kasus')}</h2>
        {entri.kasus.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
        <h2>{t('tanya_jawab.penyelesaian')}</h2>
        {entri.penyelesaian.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
      </article>
      <Bagikan judul={entri.judul} tautan={tautanTanyaJawab(entri.slug)} label={t('umum.bagikan_kasus_ini')} />
    </main>
  );
}

const normal = (teks: string) => teks.toLowerCase().replace(/['’]/g, '');
const teksCari = (entri: KasusTanyaJawab) => [entri.judul, entri.ringkasan,
  ...semuaPotongan([...entri.kasus, ...entri.penyelesaian]).map(potongan => ('teks' in potongan ? potongan.teks : ''))].join(' ');
