// Penjelasan: Bab dari packages/explain → baris poin. Istilah fikih jadi tooltip buatan sendiri (glosarium bab 15),
// rujukan jadi isi kotak "Kenapa begitu?" dari packages/content. Kode rujukan (R01-4, ...) tidak pernah tampil mentah.

import { t } from '../terjemah';
import { Fragment } from 'react';
import type { IdOrang } from '@waris/engine';
import { dalilUntuk } from '@waris/content';
import { jelaskan, jelaskanMunasakhat, type BabPenjelasan, type BarisPenjelasan } from '@waris/explain';
import type { HasilTampil } from '../jalankan';
import type { Kasus } from '../kasus';
import { tautanRujukan } from '../rute';
import { Istilah } from '../ui/Tooltip';
import type { Bahasa } from '../preferensi';

const HURUF_ARAB = /[\u0600-\u06FF]/;

export interface BabBerjudul { judulBagian?: string; bab: BabPenjelasan }

/** Bahasa 'ar' → penjelasan gaya kitab berbahasa Arab; munasakhat belum punya versi Arab, tetap Indonesia. */
export function daftarBabDari(kasus: Kasus, tampil: HasilTampil, bahasa: Bahasa = 'id'): BabBerjudul[] {
  if (tampil.jenis === 'biasa' && tampil.hasil.status === 'OK') {
    return jelaskan(tampil.hasil, kasus.graf, bahasa === 'ar' ? { mode: 'arab' } : {}).daftarBab.map(bab => ({ bab }));
  }
  if (tampil.jenis === 'munasakhat' && tampil.hasil.status === 'OK') {
    return jelaskanMunasakhat(tampil.hasil, kasus.graf).daftarBagian
      .flatMap(bagian => bagian.daftarBab.map(bab => ({ judulBagian: bagian.judul, bab })));
  }
  return [];
}

/** Orang yang disebut di satu baris/bab: dipakai untuk menyorot mereka di kanvas. */
export const orangDisebut = (daftarBaris: BarisPenjelasan[]): IdOrang[] =>
  [...new Set(daftarBaris.flatMap(baris => baris.daftarPotongan.flatMap(potongan => (potongan.jenis === 'orang' ? potongan.daftarIdOrang : []))))];

export function Baris({ baris }: { baris: BarisPenjelasan }) {
  const arab = baris.daftarPotongan.some(potongan => potongan.jenis === 'teks' && HURUF_ARAB.test(potongan.teks));
  return (
    <span {...(arab ? { lang: 'ar', dir: 'rtl', className: 'narasi-arab' } : {})}>
      {baris.daftarPotongan.map((potongan, indeks) => {
        if (potongan.jenis === 'istilah') {
          return <Istilah key={indeks} id={potongan.istilah}>{potongan.teks}</Istilah>;
        }
        if (potongan.jenis === 'orang') return <b key={indeks}>{potongan.teks}</b>;
        return <Fragment key={indeks}>{potongan.teks}</Fragment>;
      })}
    </span>
  );
}

/**
 * Dalil ditulis formal: klaim, sumber, teks ayat bila ada, dan peringatan status. Tanpa kode rujukan.
 * Di halaman Rujukan klaim sudah jadi judul dan tautan ke dirinya sendiri tidak perlu.
 */
export function Dalil({ daftarKode, diHalamanRujukan }: { daftarKode: string[]; diHalamanRujukan?: boolean }) {
  const { daftarEntri, catatan } = dalilUntuk(daftarKode);
  const isi = (entri: (typeof daftarEntri)[number]) => (
    <>
      {entri.sumber && <p className="sumber-dalil">{entri.sumber}</p>}
      {entri.ayat.filter(ayat => ayat.teks).map(ayat => <q key={ayat.label}>{ayat.teks} ({ayat.label})</q>)}
      {entri.peringatan.map(peringatan => <p key={peringatan} className="peringatan-dalil">{peringatan}</p>)}
    </>
  );
  return (
    <div className="dalil">
      {/* Di Hitung tiap dalil dilipat per klaim, supaya deretan dalil yang panjang tetap bisa dipindai. */}
      {daftarEntri.map(entri => diHalamanRujukan ? <div key={entri.kode}>{isi(entri)}</div> : (
        <details key={entri.kode} className="lipat-dalil">
          <summary>{entri.klaim}</summary>
          <div className="isi-dalil">
            {isi(entri)}
            <a className="tautan-kecil" href={tautanRujukan(entri.kode)}>{t('Lihat di halaman Rujukan')}</a>
          </div>
        </details>
      ))}
      {catatan.map(teks => <p key={teks} className="peringatan-dalil">{teks}</p>)}
    </div>
  );
}
