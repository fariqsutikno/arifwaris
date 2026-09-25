// Potongan sebaris materi → elemen React: istilah jadi tooltip glosarium, kode rujukan jadi tautan kecil "dalil".

import { Fragment } from 'react';
import { cariRujukan, type Potongan } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { Istilah } from '../../ui/Tooltip';

export function Sebaris({ isi }: { isi: Potongan[] }) {
  return (
    <>
      {isi.map((potongan, urutan) => {
        switch (potongan.jenis) {
          case 'teks': return <Fragment key={urutan}>{potongan.teks}</Fragment>;
          case 'tebal': return <b key={urutan}>{potongan.teks}</b>;
          case 'miring': return <em key={urutan}>{potongan.teks}</em>;
          case 'istilah': return <Istilah key={urutan} id={potongan.id}>{potongan.teks}</Istilah>;
          case 'rujukan': return (
            <a key={urutan} className="tautan-dalil" href={tautanRujukan(potongan.kode)} aria-label={`Dalil: ${cariRujukan(potongan.kode)?.klaim ?? potongan.kode}`}>dalil</a>
          );
        }
      })}
    </>
  );
}
