// Kartu dalil Rujukan: ayat (teks Arab + hukum yang bisa disorot) dan kitab (baca di aplikasi / situs sumber).

import { useState } from 'react';
import { DAFTAR_KITAB, type Ayat } from '@waris/content';
import { daftarSyahid, sumberKitab } from '../../konten/sumber';
import { angka, t } from '../../terjemah';
import { namaSurah } from '../../konten/judulBab';
import { Ikon } from '../../ui/Ikon';

const TEKS_TAB = (): Record<'hukum' | 'arti' | 'tafsir', string> => ({ hukum: t('belajar.hukum'), arti: t('belajar.arti'), tafsir: t('belajar.tafsir') });

/** Satu ayat: teks Arab, lalu tab Hukum (pilih untuk menyorot syahid) · Arti · Tafsir. */
export function KartuAyat({ ayat }: { ayat: Ayat }) {
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
      {/* TODO: arti dan tafsir ayat belum punya tempat di konten; ditambahkan lewat portal (tahap 3). */}
      {tab !== 'hukum' && <p className="keterangan" role="tabpanel">{tab === 'arti' ? t('rujukan.arti_ayat_ini_belum_diisi_akan') : t('rujukan.tafsir_ayat_ini_belum_diisi_akan')}</p>}
    </article>
  );
}

export function KartuKitab({ nomor }: { nomor: number }) {
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
