// Kartu dalil Rujukan: ayat (teks Arab + hukum yang bisa disorot), hadits (teks + takhrij + status), dan kitab (baca di aplikasi / situs sumber).

import { useState } from 'react';
import { DAFTAR_KITAB, type Ayat, type Hadits } from '@waris/content';
import { daftarSyahid, sumberKitab } from '../../konten/sumber';
import { angka, t } from '../../terjemah';
import { namaSurah } from '../../konten/judulBab';
import { Ikon } from '../../ui/Ikon';

/** Satu ayat: teks Arab, lalu hukum yang bisa dipilih untuk menyorot syahidnya. */
// Arti dan tafsir ayat belum punya sumber di konten; baru dirender bila sumbernya ada (diisi lewat MCP Qur'an terverifikasi).
export function KartuAyat({ ayat }: { ayat: Ayat }) {
  const daftarHukum = daftarSyahid().filter(isi => isi.surah === ayat.surah && isi.ayat === ayat.ayat);
  const [disorot, setDisorot] = useState<number | null>(null);
  const syahid = disorot === null ? undefined : daftarHukum[disorot]?.syahid;
  const posisi = syahid ? ayat.teks.indexOf(syahid) : -1;
  return (
    <article className="kartu kartu-ayat">
      <h2 className="judul-ayat">{namaSurah(ayat.surah)} : {angka(String(ayat.ayat))}</h2>
      <blockquote lang="ar" dir="rtl" className="kutipan-arab">
        {posisi < 0 ? ayat.teks : <>{ayat.teks.slice(0, posisi)}<mark className="syahid">{syahid}</mark>{ayat.teks.slice(posisi + syahid!.length)}</>}
      </blockquote>
      {daftarHukum.length === 0 ? <p className="keterangan">{t('rujukan.belum_ada_rincian_hukum_untuk_ayat')}</p> : (
        <ul className="daftar-polos daftar-hukum">
          {daftarHukum.map((isi, urutan) => (
            <li key={isi.hukum}>
              <button type="button" className="tombol-hukum" aria-pressed={disorot === urutan} onClick={() => setDisorot(disorot === urutan ? null : urutan)}>
                {isi.hukum}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function KartuHadits({ hadits }: { hadits: Hadits }) {
  return (
    <li className="kartu kartu-rujukan">
      <p lang={/[؀-ۿ]/.test(hadits.hadits) ? 'ar' : undefined} dir="auto" className="teks-hadits">{hadits.hadits.replace(/[«»]/g, '')}</p>
      <p className="sumber-rujukan">{hadits.takhrij} <span className="label-status">{hadits.status.replace(/`/g, '')}</span></p>
    </li>
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
          ? <a className="tautan-teks" href={sumber.tautan} target="_blank" rel="noopener noreferrer"><Ikon nama="buka" ukuran={18} /> {t('rujukan.situs_sumber')}</a>
          : <span className="keterangan">{t('rujukan.situs_sumber_belum_tersedia')}</span>}
      </div>
    </article>
  );
}
