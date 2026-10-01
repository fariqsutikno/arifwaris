// Kartu dalil Rujukan: ayat (teks Arab + hukum yang bisa ditandai), hadits (teks + takhrij + status), dan kitab
// (baca di aplikasi / situs sumber).

import { useState } from 'react';
import { DAFTAR_KITAB, type Ayat, type Hadits } from '@waris/content';
import { daftarSyahid, sumberKitab } from '../../konten/sumber';
import { angka, t } from '../../terjemah';
import { namaSurah } from '../../konten/judulBab';
import { Ikon } from '../../ui/Ikon';

/** Satu ayat: teks Arab, lalu hukum yang bersandar padanya; memilih hukum menandai bagian ayat yang jadi dasarnya. */
// Arti dan tafsir ayat belum punya sumber di konten; baru dirender bila sumbernya ada (diisi lewat MCP Qur'an terverifikasi).
export function KartuAyat({ ayat }: { ayat: Ayat }) {
  const daftarHukum = daftarSyahid().filter(isi => isi.surah === ayat.surah && isi.ayat === ayat.ayat);
  const [disorot, setDisorot] = useState<number | null>(null);
  const syahid = disorot === null ? undefined : daftarHukum[disorot]?.syahid;
  const posisi = syahid ? ayat.teks.indexOf(syahid) : -1;
  return (
    <article className="kartu-dalil kartu-ayat">
      <header className="kepala-kartu">
        <h2 className="judul-ayat">{namaSurah(ayat.surah)} : {angka(String(ayat.ayat))}</h2>
        {daftarHukum.length > 0 && <span className="label-status">{t('rujukan.jumlah_hukum', { jumlah: angka(String(daftarHukum.length)) })}</span>}
      </header>
      <blockquote lang="ar" dir="rtl" className={`kutipan-arab${posisi >= 0 ? ' ada-sorot' : ''}`}>
        {posisi < 0 ? ayat.teks : <>{ayat.teks.slice(0, posisi)}<mark className="syahid">{syahid}</mark>{ayat.teks.slice(posisi + syahid!.length)}</>}
      </blockquote>
      {daftarHukum.length === 0 ? <p className="keterangan">{t('rujukan.belum_ada_rincian_hukum_untuk_ayat')}</p> : (
        <div className="bagian-hukum">
          <p className="petunjuk-hukum">{t('rujukan.petunjuk_hukum')}</p>
          <ul className="daftar-polos daftar-hukum">
            {daftarHukum.map((isi, urutan) => (
              <li key={isi.hukum}>
                <button type="button" className="pil-hukum" aria-pressed={disorot === urutan} onClick={() => setDisorot(disorot === urutan ? null : urutan)}>
                  {disorot === urutan && <Ikon nama="benar" ukuran={16} />}{isi.hukum}
                </button>
              </li>
            ))}
          </ul>
          {disorot !== null && <p className="catatan-sorot" role="status">{posisi >= 0 ? t('rujukan.bagian_ditandai') : t('rujukan.syahid_belum_ada')}</p>}
        </div>
      )}
    </article>
  );
}

/** Takhrij di KB memuat token tautan (hadits:bukhari:6732) yang bukan untuk dibaca; sisakan teks takhrijnya. */
const bersihkanTakhrij = (takhrij: string) => takhrij.replace(/\bhadits:[a-z]+:\d+/g, '').replace(/\s*[·;,]?\s*$/, '').trim();

export function KartuHadits({ hadits }: { hadits: Hadits }) {
  return (
    <li className="kartu-dalil kartu-hadits">
      <p lang={/[؀-ۿ]/.test(hadits.hadits) ? 'ar' : undefined} dir="auto" className="teks-hadits">{hadits.hadits.replace(/[«»]/g, '')}</p>
      <p className="sumber-hadits"><span>{bersihkanTakhrij(hadits.takhrij)}</span><span className="label-status">{hadits.status.replace(/`/g, '')}</span></p>
    </li>
  );
}

export function KartuKitab({ nomor }: { nomor: number }) {
  const kitab = DAFTAR_KITAB[nomor]!;
  const sumber = sumberKitab().find(isi => isi.judul === kitab.judul);
  return (
    <article className="kartu-dalil kartu-kitab">
      <h2><cite>{kitab.judul}</cite></h2>
      <p className="penulis-kitab">{kitab.penulis}</p>
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
