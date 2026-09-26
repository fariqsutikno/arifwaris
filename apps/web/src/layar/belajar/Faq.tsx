// FAQ: pertanyaan per kelompok (Fikih, Pakai aplikasi) sebagai daftar lipat, bisa dicari.
// `#/faq/<id>` membuka dan menggulir ke satu pertanyaan supaya bisa dibagikan.

import { useEffect, useState } from 'react';
import { semuaPotongan, type EntriFaq } from '@waris/content';
import { daftarFaq } from '../../konten/sumber';
import type { Kasus } from '../../kasus';
import { tautanFaq } from '../../rute';
import { Bagikan } from '../../ui/Bagikan';
import { HeroMini } from '../../ui/Hero';
import { BlokMateri } from './Materi';
import { t } from '../../terjemah';

const TEKS_KELOMPOK_FAQ = (): Record<string, string> => ({ Fikih: t('Fikih'), 'Pakai aplikasi': t('Pakai aplikasi') });

interface Props { id?: string | undefined; kasusSekarang: Kasus | null; saatCoba: (kasus: Kasus) => void }

const normal = (teks: string) => teks.toLowerCase().replace(/['’]/g, '');
const teksJawaban = (entri: EntriFaq) => semuaPotongan(entri.jawaban).map(potongan => ('teks' in potongan ? potongan.teks : '')).join(' ');

export function Faq({ id, kasusSekarang, saatCoba }: Props) {
  const [kataKunci, setKataKunci] = useState('');
  const cocok = daftarFaq().filter(entri => normal(`${entri.pertanyaan} ${teksJawaban(entri)}`).includes(normal(kataKunci.trim())));
  const daftarKelompok = [...new Set(cocok.map(entri => entri.kelompok))];

  useEffect(() => {
    if (id) document.getElementById(`faq-${id}`)?.scrollIntoView?.({ block: 'start' });
  }, [id]);

  return (
    <main className="halaman tumpuk halaman-faq">
      <HeroMini judul={t('FAQ')} keterangan={t('Pertanyaan yang sering muncul soal hukum waris dan cara memakai aplikasi ini.')} ikon="tanya" />
      <p className="lencana-draf">{t('Draf, belum direview tim keilmuan')}</p>
      <label className="isian">
        {t('Cari pertanyaan')}
        <input type="search" value={kataKunci} onChange={event => setKataKunci(event.target.value)} placeholder={t('mis. anak angkat, wasiat, hutang')} />
      </label>
      {cocok.length === 0 && <p className="keterangan">{t('Belum ada pertanyaan yang cocok. Coba kata lain, atau tanyakan ke ahli faraidh.')}</p>}
      {daftarKelompok.map(kelompok => (
        <section key={kelompok} className="tumpuk-rapat">
          <h2>{TEKS_KELOMPOK_FAQ()[kelompok] ?? kelompok}</h2>
          {cocok.filter(entri => entri.kelompok === kelompok).map(entri => (
            <details key={entri.id} id={`faq-${entri.id}`} className="kartu-lipat entri-faq" open={entri.id === id}>
              <summary><b>{entri.pertanyaan}</b></summary>
              <div className="isi-materi isi-lipat-faq">
                {entri.jawaban.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
                <Bagikan judul={entri.pertanyaan} tautan={tautanFaq(entri.id)} label={t('Bagikan pertanyaan ini')} kecil />
              </div>
            </details>
          ))}
        </section>
      ))}
    </main>
  );
}
