// Potongan sebaris materi → elemen React: istilah jadi tooltip glosarium, kode rujukan jadi chip Dalil (buka lembar dalil).

import { Fragment } from 'react';
import type { Potongan } from '@waris/content';
import { Istilah } from '../../ui/Tooltip';
import { ChipDalil } from './ChipDalil';
import { terjemahIsi } from '../../terjemah';

export function Sebaris({ isi }: { isi: Potongan[] }) {
  return (
    <>
      {isi.map((potongan, urutan) => {
        switch (potongan.jenis) {
          case 'teks': return <Fragment key={urutan}>{terjemahIsi(potongan.teks)}</Fragment>;
          case 'tebal': return <b key={urutan}>{terjemahIsi(potongan.teks)}</b>;
          case 'miring': return <em key={urutan}>{terjemahIsi(potongan.teks)}</em>;
          case 'istilah': return <Istilah key={urutan} id={potongan.id}>{potongan.teks}</Istilah>;
          case 'rujukan': return <ChipDalil key={urutan} kode={potongan.kode} />;
        }
      })}
    </>
  );
}
