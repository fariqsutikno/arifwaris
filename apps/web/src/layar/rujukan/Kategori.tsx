// Kategori dalil Rujukan: daftar kategori (hierarki dalil KB bab 17.1), isi satu kategori, dan dalil per bab.
// Menerima satu Kategori; memutuskan dalil mana yang masuk (menurut jenis); menyerahkan kartu ke KartuDalil.

import { useState } from 'react';
import { DAFTAR_AYAT, DAFTAR_HADITS, DAFTAR_KITAB, RUJUKAN, TITIK_DIKAJI, type EntriRujukan, type JenisDalil } from '@waris/content';
import { tautanRujukan } from '../../rute';
import { angka, t } from '../../terjemah';
import { judulBab } from '../../konten/judulBab';
import { Ikon } from '../../ui/Ikon';
import { daftarBabDi, saringBab } from './cari';
import { KartuAyat, KartuHadits, KartuKitab } from './KartuDalil';

export interface Kategori { id: string; judul: string; lead: string; jenis?: JenisDalil }

export const DAFTAR_KATEGORI: Kategori[] = [
  { id: 'quran', lead: t('rujukan.lead_quran'), judul: t('rujukan.al_qur_an'), jenis: 'Q' },
  { id: 'sunnah', lead: t('rujukan.lead_sunnah'), judul: t('rujukan.sunnah'), jenis: 'H' },
  { id: 'atsar', lead: t('rujukan.lead_atsar'), judul: t('rujukan.atsar_sahabat'), jenis: 'A' },
  { id: 'ijma', lead: t('rujukan.lead_ijma'), judul: t('rujukan.ijma'), jenis: 'IJ' },
  { id: 'kitab', lead: t('rujukan.lead_kitab'), judul: t('rujukan.kitab_madzhab'), jenis: 'RDH' },
  { id: 'hisab', lead: t('rujukan.lead_hisab'), judul: t('rujukan.kaidah_hisab'), jenis: 'KH' },
  { id: 'keterangan', lead: t('rujukan.lead_keterangan'), judul: t('rujukan.keterangan') },
  { id: 'dikaji', lead: t('rujukan.lead_dikaji'), judul: t('rujukan.masih_dikaji') },
];

/** Dalil satu kategori; kategori tanpa jenis ("Keterangan") menampung baris KB yang bukan dalil. */
export const dalilKategori = (kategori: Kategori) => (kategori.jenis
  ? RUJUKAN.filter(rujukan => rujukan.daftarJenis.includes(kategori.jenis!))
  : RUJUKAN.filter(rujukan => rujukan.daftarJenis.length === 0));

export const jumlahDi = (kategori: Kategori) => (kategori.id === 'dikaji' ? TITIK_DIKAJI.length : dalilKategori(kategori).length);

export function IsiKategori({ kategori }: { kategori: Kategori }) {
  return (
    <>
      {kategori.id === 'quran' && <section className="susunan-kartu">{DAFTAR_AYAT.map(ayat => <KartuAyat key={`${ayat.surah}-${ayat.ayat}`} ayat={ayat} />)}</section>}
      {kategori.id === 'sunnah' && (
        <section className="susunan-kartu">
          <ul className="daftar-polos susunan-kartu">
            {DAFTAR_HADITS.map(hadits => <KartuHadits key={hadits.hadits} hadits={hadits} />)}
          </ul>
          <p className="keterangan">{t('rujukan.nomor_hadits_bisa_berbeda_antar_cetakan')}</p>
        </section>
      )}
      {kategori.id === 'kitab' && <section className="deret-kitab">{DAFTAR_KITAB.map((_kitab, nomor) => <KartuKitab key={nomor} nomor={nomor} />)}</section>}
      {kategori.id === 'dikaji' ? (
        <ul className="daftar-polos daftar-dikaji">
          {TITIK_DIKAJI.map(titik => (
            <li key={titik.kode}>
              <a className="baris-dikaji" href={tautanRujukan(titik.kode)}><b>{titik.topik}</b><span>{t('rujukan.perlu_dicek')}: {titik.yangDibutuhkan}</span></a>
            </li>
          ))}
        </ul>
      ) : <DalilPerBab daftar={dalilKategori(kategori)} />}
    </>
  );
}

const BARIS_RINGKAS = 6;

/** Dalil yang memakai jenis ini, satu kartu per bab KB; bab bisa disaring. */
function DalilPerBab({ daftar }: { daftar: EntriRujukan[] }) {
  const [bab, setBab] = useState<number | undefined>();
  if (daftar.length === 0) return null;
  const tampil = saringBab(daftar, bab);
  return (
    <section className="bagian-bab">
      <div className="kepala-bagian-bab">
        <h2>{t('rujukan.dipakai_untuk')}</h2>
        <p className="keterangan">{t('rujukan.dipakai_untuk_ket')}</p>
      </div>
      <div className="saring-bab" role="group" aria-label={t('rujukan.saring_bab')}>
        <span className="label-saring">{t('rujukan.saring_menurut_bab')}</span>
        <button type="button" className="pil-saring" aria-pressed={bab === undefined} onClick={() => setBab(undefined)}>{t('rujukan.semua_bab')}</button>
        {daftarBabDi(daftar).map(isi => (
          <button key={isi} type="button" className="pil-saring" aria-pressed={bab === isi} onClick={() => setBab(isi)}>{`Bab ${angka(String(isi))}`}</button>
        ))}
      </div>
      <div className="deret-bab">
        {daftarBabDi(tampil).map(isi => <KartuBab key={isi} bab={isi} daftar={saringBab(tampil, isi)} />)}
      </div>
    </section>
  );
}

function KartuBab({ bab, daftar }: { bab: number; daftar: EntriRujukan[] }) {
  const [semua, setSemua] = useState(false);
  return (
    <article className="kartu-bab">
      <header><h3>{judulBab(bab)}</h3><span className="label-status">{angka(String(daftar.length))}</span></header>
      <ul className="daftar-polos">
        {daftar.map((rujukan, urutan) => (
          <li key={rujukan.kode} hidden={!semua && urutan >= BARIS_RINGKAS}>
            <a href={tautanRujukan(rujukan.kode)}>
              <span>{rujukan.klaim}{rujukan.status === 'perluVerifikasi' ? ` ${t('rujukan.masih_dikaji_2')}` : ''}</span>
              <Ikon nama="buka" ukuran={16} />
            </a>
          </li>
        ))}
      </ul>
      {daftar.length > BARIS_RINGKAS && (
        <button type="button" className="tautan-teks" aria-expanded={semua} onClick={() => setSemua(!semua)}>
          {semua ? t('rujukan.lihat_ringkas') : t('rujukan.lihat_semua', { jumlah: angka(String(daftar.length)) })}
        </button>
      )}
    </article>
  );
}
