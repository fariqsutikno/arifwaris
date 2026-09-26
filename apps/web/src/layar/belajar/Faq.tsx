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

const TEKS_KELOMPOK_FAQ = (): Record<string, string> => ({ Fikih: t('faq.fikih'), 'Pakai aplikasi': t('faq.pakai_aplikasi') });

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
      <HeroMini judul={t('umum.faq')} keterangan={t('faq.pertanyaan_yang_sering_muncul_soal_hukum')} ikon="tanya" />
      <p className="lencana-draf">{t('umum.draf_belum_direview_tim_keilmuan')}</p>
      <label className="isian">
        {t('faq.cari_pertanyaan')}
        <input type="search" value={kataKunci} onChange={event => setKataKunci(event.target.value)} placeholder={t('faq.mis_anak_angkat_wasiat_hutang')} />
      </label>
      {cocok.length === 0 && <p className="keterangan">{t('faq.belum_ada_pertanyaan_yang_cocok_coba')}</p>}
      {daftarKelompok.map(kelompok => (
        <section key={kelompok} className="tumpuk-rapat">
          <h2>{TEKS_KELOMPOK_FAQ()[kelompok] ?? kelompok}</h2>
          {cocok.filter(entri => entri.kelompok === kelompok).map(entri => (
            <details key={entri.id} id={`faq-${entri.id}`} className="kartu-lipat entri-faq" open={entri.id === id}>
              <summary><b>{entri.pertanyaan}</b></summary>
              <div className="isi-materi isi-lipat-faq">
                {entri.jawaban.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
                <Bagikan judul={entri.pertanyaan} tautan={tautanFaq(entri.id)} label={t('umum.bagikan_pertanyaan_ini')} kecil />
              </div>
            </details>
          ))}
        </section>
      ))}
    </main>
  );
}
