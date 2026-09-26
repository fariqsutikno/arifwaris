// Halaman Glosarium: semua istilah KB bab 15, bisa dicari. `#/glosarium/<id>` menggulir ke istilah itu dan
// menyorotnya, supaya tautan dari materi/hasil mendarat tepat di entrinya. Tiap istilah juga menampilkan contoh dari
// kasus uji KB bab 16 (draf) dan pelajaran yang memakainya.

import { useEffect, useState } from 'react';
import { type Blok, type EntriGlosarium, type Pelajaran, type Potongan } from '@waris/content';
import { cariIstilah, daftarPelajaran, glosarium } from '../../konten/sumber';
import { tautanBelajar, tautanGlosarium } from '../../rute';
import { Bagikan } from '../../ui/Bagikan';
import { HeroMini } from '../../ui/Hero';
import { t } from '../../terjemah';

const normal = (teks: string) => teks.toLowerCase().replace(/['’ʿ]/g, '');

/** Cocok bila kata kunci ada di istilah, sinonim, arti awam, atau makna teknis. */
export const cocokKataKunci = (entri: EntriGlosarium, kataKunci: string) =>
  [entri.istilah, entri.artiAwam ?? '', entri.makna, ...entri.sinonim].some(teks => normal(teks).includes(normal(kataKunci.trim())));

export function Glosarium({ id }: { id?: string | undefined }) {
  const [kataKunci, setKataKunci] = useState('');
  const idTerpilih = id ? cariIstilah(id)?.id : undefined;
  const daftar = glosarium().filter(entri => cocokKataKunci(entri, kataKunci))
    .sort((a, b) => a.istilah.localeCompare(b.istilah, 'id'));

  useEffect(() => {
    if (idTerpilih) document.getElementById(`istilah-${idTerpilih}`)?.scrollIntoView?.({ block: 'center' });
  }, [idTerpilih]);

  return (
    <main className="halaman tumpuk">
      <HeroMini judul={t('umum.glosarium')} keterangan={t('glosarium.arti_istilah_faraidh_dalam_bahasa_sehari')} ikon="glosarium" />
      <label className="isian">
        {t('glosarium.cari_istilah')}
        <input type="search" value={kataKunci} onChange={event => setKataKunci(event.target.value)} placeholder={t('glosarium.mis_sisa_ashabah_terhalang')} />
      </label>
      <p className="keterangan" aria-live="polite">{t('glosarium.jumlah_istilah', { jumlah: daftar.length })}</p>
      <dl className="daftar-istilah">
        {daftar.map(entri => (
          <div key={entri.id} id={`istilah-${entri.id}`} className={entri.id === idTerpilih ? 'kartu entri-istilah terpilih' : 'kartu entri-istilah'}>
            <dt>
              <a href={tautanGlosarium(entri.id)}>{entri.istilah}</a>
              {entri.arab && <span lang="ar" dir="rtl" className="teks-arab">{entri.arab}</span>}
            </dt>
            <dd>
              {entri.artiAwam && <p>{entri.artiAwam}</p>}
              <p className="keterangan">{entri.artiAwam ? `${t('glosarium.makna_teknis')}: ` : ''}{entri.makna}</p>
              {entri.contoh && <p className="contoh-istilah"><b>{t('umum.contoh')}</b> {entri.contoh} <span className="keterangan">{t('glosarium.draf_belum_direview')}</span></p>}
              {(DIPAKAI_DI.get(entri.id) ?? []).length > 0 && (
                <p className="dipakai-di">
                  <span className="keterangan">{t('glosarium.dipakai_di')} </span>
                  {DIPAKAI_DI.get(entri.id)!.map(pelajaran => (
                    <a key={pelajaran.slug} className="chip-pelajaran" href={tautanBelajar(pelajaran.slug)}>{pelajaran.judul}</a>
                  ))}
                </p>
              )}
              <Bagikan judul={`${entri.istilah} ${t('glosarium.glosarium_faraidh')}`} tautan={tautanGlosarium(entri.id)} label={t('umum.bagikan')} kecil />
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

/** Istilah (id kanonik) → pelajaran yang menyebutnya lewat [[istilah]], urut sesuai jalur belajar. */
const DIPAKAI_DI: Map<string, Pelajaran[]> = (() => {
  const peta = new Map<string, Pelajaran[]>();
  for (const pelajaran of daftarPelajaran()) {
    for (const id of new Set(pelajaran.blok.flatMap(potonganBlok).flatMap(potongan => (potongan.jenis === 'istilah' ? [cariIstilah(potongan.id)?.id ?? potongan.id] : [])))) {
      peta.set(id, [...(peta.get(id) ?? []), pelajaran]);
    }
  }
  return peta;
})();

function potonganBlok(blok: Blok): Potongan[] {
  switch (blok.jenis) {
    case 'judul': case 'paragraf': case 'catatan': return blok.isi;
    case 'daftar': return blok.butir.flat();
    case 'tabel': return [...blok.kepala.flat(), ...blok.baris.flat(2)];
    default: return [];
  }
}
