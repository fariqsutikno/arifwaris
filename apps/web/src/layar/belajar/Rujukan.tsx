// Halaman Rujukan, tersusun menurut hierarki dalil KB bab 17.1: Al-Qur'an → Sunnah → Atsar → Ijma' → Kitab
// madzhab → Kaidah hisab, ditambah Keterangan dan Masih dikaji (17.4). Sidebar kategori di kiri, isi di kanan.
// Ayat: hukum yang tercantum (docs/rujukan/syahid.md) bisa dipilih untuk menyorot potongan ayatnya.
// Kitab: baca di aplikasi (PDF berlisensi di public/kitab) atau buka situs sumber; keduanya dari docs/rujukan/kitab.md.
// `#/rujukan/<kategori>`, `#/rujukan/<kode>` (satu dalil), `#/rujukan/kitab/<nomor>` (penampil PDF).

import { HeroMini } from '../../ui/Hero';
import { useState } from 'react';
import { DAFTAR_AYAT, DAFTAR_HADITS, DAFTAR_KITAB, RUJUKAN, TITIK_DIKAJI, cariRujukan, type Ayat, type EntriRujukan, type JenisDalil } from '@waris/content';
import { daftarSyahid, sumberKitab } from '../../konten/sumber';
import { tautanRujukan } from '../../rute';
import { angka, t } from '../../terjemah';
import { judulBab, namaSurah } from '../../konten/judulBab';
import { Ikon } from '../../ui/Ikon';
import { Laci } from '../../ui/Laci';
import { Dalil } from '../Penjelasan';

interface Kategori { id: string; judul: string; jenis?: JenisDalil }

const DAFTAR_KATEGORI: Kategori[] = [
  { id: 'quran', judul: t('rujukan.al_qur_an'), jenis: 'Q' },
  { id: 'sunnah', judul: t('rujukan.sunnah'), jenis: 'H' },
  { id: 'atsar', judul: t('rujukan.atsar_sahabat'), jenis: 'A' },
  { id: 'ijma', judul: t('rujukan.ijma'), jenis: 'IJ' },
  { id: 'kitab', judul: t('rujukan.kitab_madzhab'), jenis: 'RDH' },
  { id: 'hisab', judul: t('rujukan.kaidah_hisab'), jenis: 'KH' },
  { id: 'keterangan', judul: t('rujukan.keterangan') },
  { id: 'dikaji', judul: t('rujukan.masih_dikaji') },
];

const TEKS_TAB = (): Record<'hukum' | 'arti' | 'tafsir', string> => ({ hukum: t('belajar.hukum'), arti: t('belajar.arti'), tafsir: t('belajar.tafsir') });

export const KATEGORI_RUJUKAN = DAFTAR_KATEGORI.map(isi => isi.id);

/** Dalil satu kategori; kategori tanpa jenis ("Keterangan") menampung baris KB yang bukan dalil. */
const dalilKategori = (kategori: Kategori) => (kategori.jenis
  ? RUJUKAN.filter(rujukan => rujukan.daftarJenis.includes(kategori.jenis!))
  : RUJUKAN.filter(rujukan => rujukan.daftarJenis.length === 0));

const jumlahDi = (kategori: Kategori) => (kategori.id === 'dikaji' ? TITIK_DIKAJI.length : dalilKategori(kategori).length);

interface Props { kode?: string | undefined; kategori?: string | undefined; kitab?: string | undefined }

export function Rujukan({ kode, kategori, kitab }: Props) {
  const aktif = kode ? undefined : DAFTAR_KATEGORI.find(isi => isi.id === kategori) ?? DAFTAR_KATEGORI[0]!;
  return (
    <div className="tata-materi">
      {!kode && kitab === undefined && (
        <HeroMini judul={t('umum.rujukan')} keterangan={t('rujukan.al_qur_an_sunnah_atsar_ijma')} ikon="rujukan" />
      )}
      <Laci key={kode ?? kategori ?? ''} id="kategori-rujukan" label={t('rujukan.kategori_dalil')}
        ringkasan={aktif ? <>{aktif.judul} <span className="jumlah-laci">{angka(String(jumlahDi(aktif)))}</span></> : t('rujukan.dalil_terpilih')} judul={<span className="label-langkah">{t('rujukan.kategori_dalil')}</span>}>
        <ol className="daftar-polos modul-sidebar">
          {DAFTAR_KATEGORI.map((isi, urutan) => (
            <li key={isi.id}>
              <a href={tautanRujukan(isi.id)} className="pelajaran-sidebar" aria-current={isi === aktif ? 'page' : undefined}>
                <span className="tanda-pelajaran">{isi.jenis ? urutan + 1 : ''}</span>
                <span className="isi-sidebar-rujukan">{isi.judul}<small>{angka(String(jumlahDi(isi)))}</small></span>
              </a>
            </li>
          ))}
        </ol>
      </Laci>
      <main className="konten-materi konten-rujukan">
        {kode ? <DetailRujukan kode={kode} />
          : aktif!.id === 'kitab' && kitab !== undefined ? <PenampilKitab nomor={Number(kitab)} />
          : <IsiKategori kategori={aktif!} />}
      </main>
    </div>
  );
}

function IsiKategori({ kategori }: { kategori: Kategori }) {
  return (
    <>
      <h2 className="judul-kategori">{kategori.judul}</h2>
      {kategori.id === 'quran' && <section className="blok-rujukan">{DAFTAR_AYAT.map(ayat => <KartuAyat key={`${ayat.surah}-${ayat.ayat}`} ayat={ayat} />)}</section>}
      {kategori.id === 'sunnah' && (
        <section className="blok-rujukan">
          <ul className="daftar-polos blok-rujukan">
            {DAFTAR_HADITS.map(hadits => (
              <li key={hadits.hadits} className="kartu kartu-rujukan">
                <p lang={/[؀-ۿ]/.test(hadits.hadits) ? 'ar' : undefined} dir="auto" className="teks-hadits">{hadits.hadits.replace(/[«»]/g, '')}</p>
                <p className="sumber-rujukan">{hadits.takhrij} · <b>{hadits.status.replace(/`/g, '')}</b></p>
              </li>
            ))}
          </ul>
          <p className="keterangan">{t('rujukan.nomor_hadits_bisa_berbeda_antar_cetakan')}</p>
        </section>
      )}
      {kategori.id === 'kitab' && <section className="blok-rujukan">{DAFTAR_KITAB.map((kitab, nomor) => <KartuKitab key={kitab.judul} nomor={nomor} />)}</section>}
      {kategori.id === 'dikaji' ? (
        <ul className="daftar-polos daftar-soal">
          {TITIK_DIKAJI.map(titik => (
            <li key={titik.kode} className="baris-soal">
              <a className="isi-soal" href={tautanRujukan(titik.kode)}><b>{titik.topik}</b><span className="keterangan">{t('rujukan.perlu_dicek')}: {titik.yangDibutuhkan}</span></a>
            </li>
          ))}
        </ul>
      ) : <DalilPerBab daftar={dalilKategori(kategori)} />}
    </>
  );
}

/** Satu ayat: teks Arab, lalu tab Hukum (pilih untuk menyorot syahid) · Arti · Tafsir. */
function KartuAyat({ ayat }: { ayat: Ayat }) {
  const daftarHukum = daftarSyahid().filter(isi => isi.surah === ayat.surah && isi.ayat === ayat.ayat);
  const [tab, setTab] = useState<'hukum' | 'arti' | 'tafsir'>('hukum');
  const [disorot, setDisorot] = useState<number | null>(null);
  const syahid = disorot === null ? undefined : daftarHukum[disorot]?.syahid;
  const posisi = syahid ? ayat.teks.indexOf(syahid) : -1;
  return (
    <article className="kartu kartu-ayat">
      <h2 className="judul-ayat">{namaSurah(ayat.surah)} : {angka(String(ayat.ayat))}</h2>
      <blockquote lang="ar" dir="rtl" className="kutipan-arab">
        {posisi < 0 ? ayat.teks : <>{ayat.teks.slice(0, posisi)}<mark className="syahid">{syahid}</mark>{ayat.teks.slice(posisi + syahid!.length)}</>}
      </blockquote>
      <div className="tab-kecil" role="tablist" aria-label={t('rujukan.keterangan_surah_ayat', { surah: namaSurah(ayat.surah), ayat: ayat.ayat })}>
        {(['hukum', 'arti', 'tafsir'] as const).map(isi => (
          <button key={isi} type="button" role="tab" aria-selected={tab === isi} onClick={() => setTab(isi)}>{TEKS_TAB()[isi]}</button>
        ))}
      </div>
      {tab === 'hukum' && (
        daftarHukum.length === 0 ? <p className="keterangan">{t('rujukan.belum_ada_rincian_hukum_untuk_ayat')}</p> : (
          <ul className="daftar-polos daftar-hukum" role="tabpanel">
            {daftarHukum.map((isi, urutan) => (
              <li key={isi.hukum}>
                <button type="button" className="tombol-hukum" aria-pressed={disorot === urutan} onClick={() => setDisorot(disorot === urutan ? null : urutan)}>
                  {isi.hukum}
                </button>
              </li>
            ))}
          </ul>
        )
      )}
      {/* TODO: arti dan tafsir diisi tim keilmuan di docs/rujukan/syahid.md bagian "Arti dan Tafsir". */}
      {tab !== 'hukum' && <p className="keterangan" role="tabpanel">{tab === 'arti' ? t('rujukan.arti_ayat_ini_belum_diisi_akan') : t('rujukan.tafsir_ayat_ini_belum_diisi_akan')}</p>}
    </article>
  );
}

function KartuKitab({ nomor }: { nomor: number }) {
  const kitab = DAFTAR_KITAB[nomor]!;
  const sumber = sumberKitab().find(isi => isi.judul === kitab.judul);
  return (
    <article className="kartu kartu-rujukan kartu-kitab">
      <h2><cite>{kitab.judul}</cite></h2>
      <p className="sumber-rujukan">{kitab.penulis}</p>
      <p>{kitab.keterangan.replace(/\*\*/g, '')}</p>
      <div className="aksi-kitab">
        {sumber?.pdf
          ? <a className="aw-btn aw-btn-primary aw-btn-sm" href={`#/rujukan/kitab/${nomor}`}><Ikon nama="pelajaran" ukuran={18} /> {t('rujukan.baca_di_sini')}</a>
          : <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" disabled>{t('rujukan.baca_di_sini_belum_tersedia')}</button>}
        {sumber?.tautan
          ? <a className="aw-btn aw-btn-secondary aw-btn-sm" href={sumber.tautan} target="_blank" rel="noopener noreferrer"><Ikon nama="buka" ukuran={18} /> {t('rujukan.situs_sumber')}</a>
          : <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" disabled>{t('rujukan.situs_sumber_belum_tersedia')}</button>}
      </div>
    </article>
  );
}

function PenampilKitab({ nomor }: { nomor: number }) {
  const kitab = DAFTAR_KITAB[nomor];
  const pdf = kitab && sumberKitab().find(isi => isi.judul === kitab.judul)?.pdf;
  return (
    <>
      <a href={tautanRujukan('kitab')}>{t('rujukan.kembali_ke_daftar_kitab')}</a>
      {kitab && pdf ? (
        <>
          <h1><cite>{kitab.judul}</cite></h1>
          <iframe className="penampil-kitab" src={`/kitab/${encodeURIComponent(pdf)}`} title={kitab.judul} />
        </>
      ) : <p role="alert">{t('rujukan.berkas_kitab_ini_belum_tersedia')}</p>}
    </>
  );
}

/** Dalil yang memakai jenis ini, dikelompokkan per bab KB. */
function DalilPerBab({ daftar }: { daftar: EntriRujukan[] }) {
  const daftarBab = [...new Set(daftar.map(rujukan => rujukan.bab))];
  if (daftar.length === 0) return null;
  return (
    <section className="blok-rujukan">
      <h2>{t('rujukan.dipakai_untuk')}</h2>
      {daftarBab.map(bab => (
        <details key={bab} className="kartu-lipat">
          <summary><b>{judulBab(bab)}</b><span className="keterangan">{angka(String(daftar.filter(rujukan => rujukan.bab === bab).length))}</span></summary>
          <ul className="isi-lipat">
            {daftar.filter(rujukan => rujukan.bab === bab).map(rujukan => (
              <li key={rujukan.kode}><a href={tautanRujukan(rujukan.kode)}>{rujukan.klaim}</a>{rujukan.status === 'perluVerifikasi' ? ` ${t('rujukan.masih_dikaji_2')}` : ''}</li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}

function DetailRujukan({ kode }: { kode: string }) {
  const rujukan = cariRujukan(kode);
  if (!rujukan) return <><a href={tautanRujukan()}>{t('rujukan.kembali_ke_rujukan')}</a><p role="alert">{t('rujukan.rujukan_kode_tidak_ada_di_daftar', { kode })}</p></>;
  return (
    <>
      <p className="label-langkah">{judulBab(rujukan.bab)}</p>
      <h1>{rujukan.klaim}</h1>
      <div className="kartu kartu-rujukan"><Dalil daftarKode={[rujukan.kode]} diHalamanRujukan /></div>
      {rujukan.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab">{teks}</blockquote>)}
      {rujukan.arab.length === 0 && rujukan.kutipan && <p>{rujukan.kutipan}</p>}
    </>
  );
}
