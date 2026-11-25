// Potongan sebaris materi → elemen React: istilah jadi tooltip glosarium, kode rujukan jadi chip Dalil (buka lembar dalil),
// tautan antarpelajaran jadi chip bernomor + judul tujuan, tautan bagian jadi chip nomor yang menggeser ke bagian itu.

import { Fragment } from 'react';
import type { Potongan } from '@waris/content';
import { cariPelajaran } from '../../konten/sumber';
import { tautanBelajar } from '../../rute';
import { angka } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { Istilah } from '../../ui/Tooltip';
import { ChipDalil } from './ChipDalil';
import { idBagian, keBagian, nomorTampil } from './DaftarIsi';

export function Sebaris({ isi }: { isi: Potongan[] }) {
  return (
    <>
      {isi.map((potongan, urutan) => {
        switch (potongan.jenis) {
          case 'teks': return <Fragment key={urutan}>{potongan.teks}</Fragment>;
          case 'tebal': return <b key={urutan}>{potongan.teks}</b>;
          case 'miring': return <em key={urutan}>{potongan.teks}</em>;
          case 'istilah': return <Istilah key={urutan} id={potongan.id}>{potongan.teks}</Istilah>;
          case 'rujukan': return <ChipDalil key={urutan} kode={potongan.kode} />;
          case 'tautanPelajaran': return <TautanPelajaran key={urutan} slug={potongan.slug} teks={potongan.teks} />;
          case 'tautanBagian': return (
            <a key={urutan} className="tautan-bab tautan-bagian-sebaris" href={`#${idBagian(potongan.bagian)}`}
              onClick={kejadian => { kejadian.preventDefault(); keBagian(idBagian(potongan.bagian)); }}>
              {potongan.teks ?? angka(nomorTampil(potongan.bagian))}
            </a>
          );
        }
      })}
    </>
  );
}

/** Pelajaran yang belum terbit tetap ditampilkan sebagai teks biasa (judul dari slug), bukan tautan mati. */
function TautanPelajaran({ slug, teks }: { slug: string; teks: string | undefined }) {
  const tujuan = cariPelajaran(slug);
  const nomor = slug.split('-').slice(0, 2).join('.');
  const label = teks ?? tujuan?.judul ?? slug.split('-').slice(2).join(' ');
  if (!tujuan) return <span className="tautan-bab menyusul">{angka(nomor)} {label}</span>;
  return (
    <a className="tautan-bab" href={tautanBelajar(slug)}>
      {teks === undefined && <span className="nomor-bab">{angka(nomor)}</span>}{label}<Ikon nama="kanan" ukuran={13} />
    </a>
  );
}
