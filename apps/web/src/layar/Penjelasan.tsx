// Penjelasan: Bab dari packages/explain → LangkahHitung. Istilah fikih jadi tooltip glosarium (bab 15),
// refs jadi kotak "Kenapa?" berisi dalil dari packages/content. Dipakai layar hasil dan mode belajar.

import { Fragment } from 'react';
import { cariIstilah, dalilUntuk } from '@waris/content';
import { jelaskan, jelaskanMunasakhat, type BabPenjelasan, type BarisPenjelasan } from '@waris/explain';
import type { HasilTampil } from '../jalankan';
import type { Kasus } from '../kasus';
import { LangkahHitung } from '../ui/komponen';

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

export function BabSebagaiLangkah({ nomor, babBerjudul, sudahDibaca }: { nomor: number; babBerjudul: BabBerjudul; sudahDibaca?: boolean }) {
  const { bab, judulBagian } = babBerjudul;
  const semuaRefs = [...new Set(bab.daftarBaris.flatMap(baris => baris.refs))];
  return (
    <LangkahHitung nomor={nomor} judul={bab.judul} {...(judulBagian ? { pengantar: judulBagian } : {})}
      {...(sudahDibaca ? { sudahDibaca } : {})} kenapa={semuaRefs.length ? <Dalil daftarKode={semuaRefs} /> : undefined}>
      {bab.daftarBaris.map((baris, indeks) => <p key={indeks}><Baris baris={baris} /></p>)}
    </LangkahHitung>
  );
}

function Baris({ baris }: { baris: BarisPenjelasan }) {
  return (
    <>
      {baris.daftarPotongan.map((potongan, indeks) => {
        if (potongan.jenis === 'istilah') {
          const entri = cariIstilah(potongan.istilah);
          return <abbr key={indeks} className="istilah" title={entri?.artiAwam ?? entri?.makna ?? ''}>{potongan.teks}</abbr>;
        }
        if (potongan.jenis === 'orang') return <b key={indeks}>{potongan.teks}</b>;
        return <Fragment key={indeks}>{potongan.teks}</Fragment>;
      })}
      {baris.refs.map(kode => <span key={kode} className="rujukan">[{kode}]</span>)}
    </>
  );
}

/** Dalil ditulis formal: klaim, sumber, teks ayat bila ada, dan peringatan status (bab 17.4). */
function Dalil({ daftarKode }: { daftarKode: string[] }) {
  const { daftarEntri, catatan } = dalilUntuk(daftarKode);
  return (
    <div className="tumpuk" style={{ gap: 8 }}>
      {daftarEntri.map(entri => (
        <div key={entri.kode}>
          <div><b style={{ display: 'inline' }}>[{entri.kode}]</b> {entri.klaim}</div>
          {entri.sumber && <div>{entri.sumber}</div>}
          {entri.ayat.filter(ayat => ayat.teks).map(ayat => <q key={ayat.label}>{ayat.teks} ({ayat.label})</q>)}
          {entri.peringatan.map(peringatan => <div key={peringatan}><i>{peringatan}</i></div>)}
        </div>
      ))}
      {catatan.map(teks => <div key={teks}><i>{teks}</i></div>)}
    </div>
  );
}
