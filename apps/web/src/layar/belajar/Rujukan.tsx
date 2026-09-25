// Halaman Rujukan, tersusun menurut hierarki dalil KB bab 17.1: Al-Qur'an → Sunnah → Atsar → Ijma' → Kitab
// madzhab → Kaidah hisab, ditambah "Masih dikaji" (17.4). Sidebar kategori di kiri (seperti materi), isi di kanan.
// Dalil yang bersandar pada lebih dari satu jenis (mis. Q + RDH) muncul di tiap kategorinya.
// `#/rujukan/<kategori>` membuka satu kategori, `#/rujukan/<kode>` satu dalil lengkap.

import {
  DAFTAR_AYAT, DAFTAR_HADITS, DAFTAR_KITAB, JUDUL_BAB, RUJUKAN, TITIK_DIKAJI, cariRujukan,
  type EntriRujukan, type JenisDalil,
} from '@waris/content';
import { tautanRujukan } from '../../rute';
import { Dalil } from '../Penjelasan';

interface Kategori { id: string; judul: string; ringkas: string; jenis?: JenisDalil }

const DAFTAR_KATEGORI: Kategori[] = [
  { id: 'quran', judul: "Al-Qur'an", ringkas: 'Ayat inti waris: An-Nisa\' 11, 12, 176.', jenis: 'Q' },
  { id: 'sunnah', judul: 'Sunnah', ringkas: "Hadits beserta takhrij; yang lemah ditandai dha'if.", jenis: 'H' },
  { id: 'atsar', judul: 'Atsar sahabat', ringkas: "Putusan 'Umar, 'Ali, Zaid bin Tsabit, dan sahabat lain.", jenis: 'A' },
  { id: 'ijma', judul: "Ijma'", ringkas: "Kesepakatan ulama yang dinukil oleh penukilnya.", jenis: 'IJ' },
  { id: 'kitab', judul: 'Kitab madzhab', ringkas: "Nash Syafi'iyyah dari Raudhah ath-Thalibin; kitab lain sebagai pembanding.", jenis: 'RDH' },
  { id: 'hisab', judul: 'Kaidah hisab', ringkas: "Cara menghitung (KPK, FPB). Bukan hukum syar'i.", jenis: 'KH' },
  { id: 'keterangan', judul: 'Keterangan', ringkas: 'Catatan tambahan dan keputusan desain, bukan dalil.' },
  { id: 'dikaji', judul: 'Masih dikaji', ringkas: 'Dasarnya belum dicek ke teks asli; hitungan kasus umum tidak terpengaruh.' },
];

/** Dalil satu kategori; kategori tanpa jenis ("Keterangan") menampung baris KB yang bukan dalil. */
const dalilKategori = (kategori: Kategori) => (kategori.jenis
  ? RUJUKAN.filter(rujukan => rujukan.daftarJenis.includes(kategori.jenis!))
  : RUJUKAN.filter(rujukan => rujukan.daftarJenis.length === 0));

export const KATEGORI_RUJUKAN = DAFTAR_KATEGORI.map(isi => isi.id);

export function Rujukan({ kode, kategori }: { kode?: string | undefined; kategori?: string | undefined }) {
  const aktif = kode ? undefined : DAFTAR_KATEGORI.find(isi => isi.id === kategori) ?? DAFTAR_KATEGORI[0]!;
  return (
    <div className="tata-materi">
      <aside className="sidebar-materi" aria-label="Kategori rujukan">
        <div className="lipat-sidebar">
          <p className="label-langkah kepala-sidebar">Urutan dalil</p>
          <ol className="daftar-polos modul-sidebar">
            {DAFTAR_KATEGORI.map((isi, urutan) => (
              <li key={isi.id}>
                <a href={tautanRujukan(isi.id)} className="pelajaran-sidebar" aria-current={isi === aktif ? 'page' : undefined}>
                  <span className="tanda-pelajaran">{isi.jenis ? urutan + 1 : '·'}</span>
                  <span className="isi-sidebar-rujukan">{isi.judul}<small>{jumlahDi(isi)}</small></span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </aside>
      <main className="konten-materi tumpuk">
        {kode ? <DetailRujukan kode={kode} /> : <IsiKategori kategori={aktif!} />}
      </main>
    </div>
  );
}

function jumlahDi(kategori: Kategori): number {
  if (kategori.id === 'dikaji') return TITIK_DIKAJI.length;
  return dalilKategori(kategori).length;
}

function IsiKategori({ kategori }: { kategori: Kategori }) {
  return (
    <>
      <h1>{kategori.judul}</h1>
      <p className="lead">{kategori.ringkas}</p>
      {kategori.id === 'quran' && (
        <section className="tumpuk-rapat">
          <h2>Ayat</h2>
          {DAFTAR_AYAT.map(ayat => (
            <figure key={`${ayat.surah}-${ayat.ayat}`} className="kartu kartu-ayat">
              <blockquote lang="ar" dir="rtl" className="kutipan-arab">{ayat.teks}</blockquote>
              <figcaption className="label-langkah">{ayat.surah} : {ayat.ayat}</figcaption>
            </figure>
          ))}
        </section>
      )}
      {kategori.id === 'sunnah' && (
        <section className="tumpuk-rapat">
          <h2>Hadits</h2>
          <p className="keterangan">Nomor bisa berbeda antar cetakan; cocokkan dengan lafaznya.</p>
          <ul className="daftar-polos tumpuk-rapat">
            {DAFTAR_HADITS.map(hadits => (
              <li key={hadits.hadits} className="kartu">
                <p lang={/[؀-ۿ]/.test(hadits.hadits) ? 'ar' : undefined} className="teks-arab-baris">{hadits.hadits.replace(/[«»]/g, '')}</p>
                <p className="keterangan">{hadits.takhrij} · <b>{hadits.status.replace(/`/g, '')}</b></p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {kategori.id === 'kitab' && (
        <section className="tumpuk-rapat">
          <h2>Kitab</h2>
          {DAFTAR_KITAB.map(kitab => (
            <div key={kitab.judul} className="kartu">
              <h3><cite>{kitab.judul}</cite></h3>
              <p>{kitab.penulis}</p>
              <p className="keterangan">{kitab.keterangan.replace(/\*\*/g, '')}</p>
            </div>
          ))}
        </section>
      )}
      {kategori.id === 'dikaji' ? (
        <ul className="daftar-polos daftar-soal">
          {TITIK_DIKAJI.map(titik => (
            <li key={titik.kode} className="baris-soal">
              <a className="isi-soal" href={tautanRujukan(titik.kode)}><b>{titik.topik}</b><span className="keterangan">Perlu: {titik.yangDibutuhkan}</span></a>
            </li>
          ))}
        </ul>
      ) : <DalilPerBab daftar={dalilKategori(kategori)} />}
    </>
  );
}

/** Dalil yang memakai jenis ini, dikelompokkan per bab KB. */
function DalilPerBab({ daftar }: { daftar: EntriRujukan[] }) {
  const daftarBab = [...new Set(daftar.map(rujukan => rujukan.bab))];
  if (daftar.length === 0) return null;
  return (
    <section className="tumpuk-rapat">
      <h2>Dipakai untuk</h2>
      {daftarBab.map(bab => (
        <details key={bab} className="kartu-lipat">
          <summary><b>{JUDUL_BAB[bab]}</b><span className="keterangan">{daftar.filter(rujukan => rujukan.bab === bab).length}</span></summary>
          <ul className="isi-lipat">
            {daftar.filter(rujukan => rujukan.bab === bab).map(rujukan => (
              <li key={rujukan.kode}><a href={tautanRujukan(rujukan.kode)}>{rujukan.klaim}{rujukan.status === 'perluVerifikasi' ? ' (masih dikaji)' : ''}</a></li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}

function DetailRujukan({ kode }: { kode: string }) {
  const rujukan = cariRujukan(kode);
  if (!rujukan) return <><a href={tautanRujukan()}>← Rujukan</a><p role="alert">Rujukan {kode} tidak ada di daftar.</p></>;
  return (
    <>
      <p className="label-langkah">{JUDUL_BAB[rujukan.bab]}</p>
      <h1>{rujukan.klaim}</h1>
      <div className="kartu"><Dalil daftarKode={[rujukan.kode]} diHalamanRujukan /></div>
      {rujukan.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab">{teks}</blockquote>)}
      {rujukan.arab.length === 0 && rujukan.kutipan && <p className="keterangan">{rujukan.kutipan}</p>}
      <p className="keterangan">Kode {rujukan.kode}</p>
    </>
  );
}
