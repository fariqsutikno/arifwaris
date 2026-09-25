// Satu pelajaran: isi Markdown terbatas dari packages/content → elemen React (tanpa innerHTML).
// Istilah jadi tooltip glosarium, kode rujukan jadi tautan "dalil", blok kasus jadi tabel faraidh dari engine.
// Selesai dibaca → ditandai di perangkat ini, lalu lanjut ke pelajaran berikutnya.

import { Fragment, useMemo } from 'react';
import { DAFTAR_MODUL, DAFTAR_PELAJARAN, cariPelajaran, cariRujukan, type Blok, type ContohKasus, type Potongan } from '@waris/content';
import { TabelFaraidh } from '../../hasil/TabelFaraidh';
import { ringkas } from '../../hasil/ringkasan';
import { jalankan, type HasilOk } from '../../jalankan';
import type { Kasus } from '../../kasus';
import { tandaiPelajaranSelesai } from '../../preferensi';
import { tautanBelajar, tautanRujukan } from '../../rute';
import { Tombol } from '../../ui/komponen';
import { Istilah } from '../../ui/Tooltip';
import { kasusDariContoh } from './contoh';
import { TombolBukaKasus } from './TombolBukaKasus';

interface Props {
  slug: string;
  /** Kasus yang sedang ada di kalkulator; bila ada, "Coba di kalkulator" minta konfirmasi dulu. */
  kasusSekarang: Kasus | null;
  saatCoba: (kasus: Kasus) => void;
}

export function Materi({ slug, kasusSekarang, saatCoba }: Props) {
  const pelajaran = cariPelajaran(slug);
  if (!pelajaran) {
    return <main className="halaman tumpuk"><a href={tautanBelajar()}>← Belajar</a><p role="alert">Pelajaran ini tidak ditemukan.</p></main>;
  }
  const indeks = DAFTAR_PELAJARAN.indexOf(pelajaran);
  const sebelumnya = DAFTAR_PELAJARAN[indeks - 1];
  const berikutnya = DAFTAR_PELAJARAN[indeks + 1];
  const modul = DAFTAR_MODUL.find(modulIni => modulIni.nomor === pelajaran.modul);
  const selesaikan = () => {
    tandaiPelajaranSelesai(pelajaran.slug);
    window.location.hash = berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar();
  };
  return (
    <main className="halaman tumpuk materi">
      <nav aria-label="Posisi" className="keterangan"><a href={tautanBelajar()}>Belajar</a> / Modul {pelajaran.modul} · {modul?.judul}</nav>
      <h1>{pelajaran.judul}</h1>
      {pelajaran.perluCek && <p className="lencana-draf">Draf, belum direview tim keilmuan</p>}
      <p className="lead">{pelajaran.tujuan}</p>
      <article className="isi-materi">
        {pelajaran.blok.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
      </article>
      <div className="navigasi-materi">
        {sebelumnya ? <a href={tautanBelajar(sebelumnya.slug)}>← {sebelumnya.judul}</a> : <span />}
        <Tombol onClick={selesaikan}>{berikutnya ? `Selesai, lanjut: ${berikutnya.judul}` : 'Selesai'}</Tombol>
      </div>
    </main>
  );
}

export function BlokMateri({ blok, kasusSekarang, saatCoba }: { blok: Blok } & Omit<Props, 'slug'>) {
  switch (blok.jenis) {
    case 'judul': return blok.tingkat === 2 ? <h2><Sebaris isi={blok.isi} /></h2> : <h3><Sebaris isi={blok.isi} /></h3>;
    case 'paragraf': return <p><Sebaris isi={blok.isi} /></p>;
    case 'catatan': return <aside className="catatan-materi"><Sebaris isi={blok.isi} /></aside>;
    case 'daftar': {
      const Daftar = blok.berurut ? 'ol' : 'ul';
      return <Daftar>{blok.butir.map((butir, urutan) => <li key={urutan}><Sebaris isi={butir} /></li>)}</Daftar>;
    }
    case 'tabel':
      return (
        <div className="wadah-tabel-materi">
          <table className="tabel-materi">
            <thead><tr>{blok.kepala.map((sel, urutan) => <th key={urutan}><Sebaris isi={sel} /></th>)}</tr></thead>
            <tbody>{blok.baris.map((baris, urutan) => <tr key={urutan}>{baris.map((sel, kolom) => <td key={kolom}><Sebaris isi={sel} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'kasus': return <ContohDihitung contoh={blok.kasus} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />;
  }
}

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

function ContohDihitung({ contoh, kasusSekarang, saatCoba }: { contoh: ContohKasus } & Omit<Props, 'slug'>) {
  const kasus = useMemo(() => kasusDariContoh(contoh), [contoh]);
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') {
    return <p className="kartu kartu-galat" role="alert">Contoh ini tidak bisa dihitung. Laporkan ke pengembang.</p>;
  }
  return (
    <figure className="contoh-kasus">
      <figcaption className="label-langkah">Dihitung kalkulator</figcaption>
      <div className="wadah-tabel">
        <TabelFaraidh hasil={tampil.hasil as HasilOk} ringkasan={ringkas(kasus, tampil)} sembunyiNominal={false} saatPilih={() => {}} />
      </div>
      <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatCoba(kasus)}>Coba di kalkulator</TombolBukaKasus>
    </figure>
  );
}
