// Penjelasan: Bab dari packages/explain → baris poin. Istilah fikih jadi tooltip buatan sendiri (glosarium bab 15),
// rujukan jadi isi kotak "Kenapa begitu?" dari packages/content. Kode rujukan (R01-4, ...) tidak pernah tampil mentah.

import { Fragment } from 'react';
import type { IdOrang } from '@waris/engine';
import { cariIstilah, dalilUntuk } from '@waris/content';
import { jelaskan, jelaskanMunasakhat, type BabPenjelasan, type BarisPenjelasan } from '@waris/explain';
import type { HasilTampil } from '../jalankan';
import type { Kasus } from '../kasus';

export interface BabBerjudul { judulBagian?: string; bab: BabPenjelasan }

export function daftarBabDari(kasus: Kasus, tampil: HasilTampil): BabBerjudul[] {
  if (tampil.jenis === 'biasa' && tampil.hasil.status === 'OK') {
    return jelaskan(tampil.hasil, kasus.graf).daftarBab.map(bab => ({ bab }));
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
  return (
    <>
      {baris.daftarPotongan.map((potongan, indeks) => {
        if (potongan.jenis === 'istilah') {
          const entri = cariIstilah(potongan.istilah);
          const arti = entri?.artiAwam ?? entri?.makna;
          return arti
            ? <span key={indeks} className="istilah" tabIndex={0} data-arti={arti}>{potongan.teks}</span>
            : <Fragment key={indeks}>{potongan.teks}</Fragment>;
        }
        if (potongan.jenis === 'orang') return <b key={indeks}>{potongan.teks}</b>;
        return <Fragment key={indeks}>{potongan.teks}</Fragment>;
      })}
    </>
  );
}

/** Dalil ditulis formal: klaim, sumber, teks ayat bila ada, dan peringatan status. Tanpa kode rujukan. */
export function Dalil({ daftarKode }: { daftarKode: string[] }) {
  const { daftarEntri, catatan } = dalilUntuk(daftarKode);
  return (
    <div className="dalil">
      {daftarEntri.map(entri => (
        <div key={entri.kode}>
          <p>{entri.klaim}</p>
          {entri.sumber && <p className="sumber-dalil">{entri.sumber}</p>}
          {entri.ayat.filter(ayat => ayat.teks).map(ayat => <q key={ayat.label}>{ayat.teks} ({ayat.label})</q>)}
          {entri.peringatan.map(peringatan => <p key={peringatan} className="peringatan-dalil">{peringatan}</p>)}
        </div>
      ))}
      {catatan.map(teks => <p key={teks} className="peringatan-dalil">{teks}</p>)}
    </div>
  );
}
