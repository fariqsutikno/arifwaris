// Halaman Rujukan: daftar pustaka KB bab 17 dan semua dalil "Dasar dan Rujukan" bab 01–16, dikelompokkan per bab.
// `#/rujukan/<kode>` membuka satu dalil lengkap (dipakai tautan dari kotak "Dalilnya" di hasil).

import { DAFTAR_HADITS, DAFTAR_KITAB, JUDUL_BAB, RUJUKAN, TITIK_DIKAJI, cariRujukan, type EntriRujukan } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { Dalil } from '../Penjelasan';

export function Rujukan({ kode }: { kode?: string | undefined }) {
  if (kode) return <DetailRujukan kode={kode} />;
  const menurutBab = Object.keys(JUDUL_BAB).map(Number)
    .map(bab => [bab, RUJUKAN.filter(rujukan => rujukan.bab === bab)] as const).filter(([, daftar]) => daftar.length > 0);
  return (
    <main className="halaman tumpuk">
      <h1>Rujukan</h1>
      <p className="keterangan">Sumber yang dipakai kalkulator dan materi. Hukum mengikuti madzhab Syafi'i; kitab lain hanya pembanding.</p>

      <section className="tumpuk">
        <h2>Kitab</h2>
        {DAFTAR_KITAB.map(kitab => (
          <div key={kitab.judul} className="kartu">
            <h3><cite>{kitab.judul}</cite></h3>
            <p>{kitab.penulis}</p>
            <p className="keterangan">{kitab.keterangan.replace(/\*\*/g, '')}</p>
          </div>
        ))}
      </section>

      <section className="tumpuk">
        <h2>Hadits</h2>
        <p className="keterangan">Nomor bisa berbeda antar cetakan; cocokkan dengan lafaznya.</p>
        <ul className="daftar-polos tumpuk">
          {DAFTAR_HADITS.map(hadits => (
            <li key={hadits.hadits} className="kartu">
              <p lang={/[؀-ۿ]/.test(hadits.hadits) ? 'ar' : undefined} className="teks-arab-baris">{hadits.hadits.replace(/[«»]/g, '')}</p>
              <p className="keterangan">{hadits.takhrij} · {hadits.status.replace(/`/g, '')}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="tumpuk">
        <h2>Masih dikaji</h2>
        <p className="keterangan">Dasar poin-poin ini belum dicek ke teks aslinya. Hitungan kasus umum tidak terpengaruh.</p>
        <ul>
          {TITIK_DIKAJI.map(titik => <li key={titik.kode}><a href={tautanRujukan(titik.kode)}>{titik.topik}</a></li>)}
        </ul>
      </section>

      <section className="tumpuk">
        <h2>Dalil per bab</h2>
        {menurutBab.map(([bab, daftar]) => (
          <details key={bab} className="kartu-lipat">
            <summary><b>{JUDUL_BAB[bab]}</b><span className="keterangan">{daftar.length} dalil</span></summary>
            <ul className="isi-lipat">{daftar.map(rujukan => <li key={rujukan.kode}><TautanRujukan rujukan={rujukan} /></li>)}</ul>
          </details>
        ))}
      </section>
    </main>
  );
}

function DetailRujukan({ kode }: { kode: string }) {
  const rujukan = cariRujukan(kode);
  return (
    <main className="halaman tumpuk">
      <a href={tautanRujukan()}>← Semua rujukan</a>
      {rujukan ? (
        <>
          <p className="label-langkah">{JUDUL_BAB[rujukan.bab]}</p>
          <h1>{rujukan.klaim}</h1>
          <div className="kartu"><Dalil daftarKode={[rujukan.kode]} diHalamanRujukan /></div>
          {rujukan.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab">{teks}</blockquote>)}
          {rujukan.arab.length === 0 && rujukan.kutipan && <p className="keterangan">{rujukan.kutipan}</p>}
          <p className="keterangan">Kode {rujukan.kode}</p>
        </>
      ) : <p role="alert">Rujukan {kode} tidak ada di daftar.</p>}
    </main>
  );
}

const TautanRujukan = ({ rujukan }: { rujukan: EntriRujukan }) => (
  <a href={tautanRujukan(rujukan.kode)}>{rujukan.klaim}{rujukan.status === 'perluVerifikasi' ? ' (masih dikaji)' : ''}</a>
);
