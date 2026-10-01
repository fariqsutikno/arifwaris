// Kategori dalil Rujukan: daftar kategori (hierarki dalil KB bab 17.1), isi satu kategori, dan dalil per bab.
// Menerima satu Kategori; memutuskan dalil mana yang masuk (menurut jenis); menyerahkan kartu ke KartuDalil.

import { useState } from 'react';
import { DAFTAR_AYAT, DAFTAR_HADITS, DAFTAR_KITAB, RUJUKAN, TITIK_DIKAJI, type EntriRujukan, type JenisDalil } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { angka, t } from '../../terjemah';
import { judulBab } from '../../konten/judulBab';
import { daftarBabDi, saringBab } from './cari';
import { KartuAyat, KartuKitab } from './KartuDalil';

export interface Kategori { id: string; judul: string; jenis?: JenisDalil }

export const DAFTAR_KATEGORI: Kategori[] = [
  { id: 'quran', judul: t('rujukan.al_qur_an'), jenis: 'Q' },
  { id: 'sunnah', judul: t('rujukan.sunnah'), jenis: 'H' },
  { id: 'atsar', judul: t('rujukan.atsar_sahabat'), jenis: 'A' },
  { id: 'ijma', judul: t('rujukan.ijma'), jenis: 'IJ' },
  { id: 'kitab', judul: t('rujukan.kitab_madzhab'), jenis: 'RDH' },
  { id: 'hisab', judul: t('rujukan.kaidah_hisab'), jenis: 'KH' },
  { id: 'keterangan', judul: t('rujukan.keterangan') },
  { id: 'dikaji', judul: t('rujukan.masih_dikaji') },
];

/** Dalil satu kategori; kategori tanpa jenis ("Keterangan") menampung baris KB yang bukan dalil. */
export const dalilKategori = (kategori: Kategori) => (kategori.jenis
  ? RUJUKAN.filter(rujukan => rujukan.daftarJenis.includes(kategori.jenis!))
  : RUJUKAN.filter(rujukan => rujukan.daftarJenis.length === 0));

export const jumlahDi = (kategori: Kategori) => (kategori.id === 'dikaji' ? TITIK_DIKAJI.length : dalilKategori(kategori).length);

export function IsiKategori({ kategori }: { kategori: Kategori }) {
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

/** Dalil yang memakai jenis ini, dikelompokkan per bab KB; bab bisa disaring. */
function DalilPerBab({ daftar }: { daftar: EntriRujukan[] }) {
  const [bab, setBab] = useState<number | undefined>();
  if (daftar.length === 0) return null;
  const tampil = saringBab(daftar, bab);
  return (
    <section className="blok-rujukan">
      <h2>{t('rujukan.dipakai_untuk')}</h2>
      <div className="saring-bab" role="group" aria-label={t('rujukan.saring_bab')}>
        <button type="button" className="tautan-teks" aria-pressed={bab === undefined} onClick={() => setBab(undefined)}>{t('rujukan.semua_bab')}</button>
        {daftarBabDi(daftar).map(isi => (
          <button key={isi} type="button" className="tautan-teks" aria-pressed={bab === isi} onClick={() => setBab(isi)}>{`Bab ${angka(String(isi))}`}</button>
        ))}
      </div>
      {daftarBabDi(tampil).map(isi => (
        <details key={isi} className="kartu-lipat">
          <summary><b>{judulBab(isi)}</b><span className="keterangan">{angka(String(saringBab(tampil, isi).length))}</span></summary>
          <ul className="isi-lipat">
            {saringBab(tampil, isi).map(rujukan => (
              <li key={rujukan.kode}><a href={tautanRujukan(rujukan.kode)}>{rujukan.klaim}</a>{rujukan.status === 'perluVerifikasi' ? ` ${t('rujukan.masih_dikaji_2')}` : ''}</li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}
