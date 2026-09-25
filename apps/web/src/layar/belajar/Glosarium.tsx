// Halaman Glosarium: semua istilah KB bab 15, bisa dicari. `#/glosarium/<id>` menggulir ke istilah itu dan
// menyorotnya, supaya tautan dari materi/hasil mendarat tepat di entrinya.

import { useEffect, useState } from 'react';
import { GLOSARIUM, cariIstilah, type EntriGlosarium } from '@waris/content';
import { tautanGlosarium } from '../../rute';

const normal = (teks: string) => teks.toLowerCase().replace(/['’ʿ]/g, '');

/** Cocok bila kata kunci ada di istilah, sinonim, arti awam, atau makna teknis. */
export const cocokKataKunci = (entri: EntriGlosarium, kataKunci: string) =>
  [entri.istilah, entri.artiAwam ?? '', entri.makna, ...entri.sinonim].some(teks => normal(teks).includes(normal(kataKunci.trim())));

export function Glosarium({ id }: { id?: string | undefined }) {
  const [kataKunci, setKataKunci] = useState('');
  const idTerpilih = id ? cariIstilah(id)?.id : undefined;
  const daftar = GLOSARIUM.filter(entri => cocokKataKunci(entri, kataKunci))
    .sort((a, b) => a.istilah.localeCompare(b.istilah, 'id'));

  useEffect(() => {
    if (idTerpilih) document.getElementById(`istilah-${idTerpilih}`)?.scrollIntoView?.({ block: 'center' });
  }, [idTerpilih]);

  return (
    <main className="halaman tumpuk">
      <h1>Glosarium</h1>
      <label className="isian">
        Cari istilah
        <input type="search" value={kataKunci} onChange={event => setKataKunci(event.target.value)} placeholder="mis. sisa, ashabah, terhalang" />
      </label>
      <p className="keterangan" aria-live="polite">{daftar.length} istilah</p>
      <dl className="daftar-istilah">
        {daftar.map(entri => (
          <div key={entri.id} id={`istilah-${entri.id}`} className={entri.id === idTerpilih ? 'kartu entri-istilah terpilih' : 'kartu entri-istilah'}>
            <dt>
              <a href={tautanGlosarium(entri.id)}>{entri.istilah}</a>
              {entri.arab && <span lang="ar" dir="rtl" className="teks-arab">{entri.arab}</span>}
            </dt>
            <dd>
              {entri.artiAwam && <p>{entri.artiAwam}</p>}
              <p className="keterangan">{entri.artiAwam ? 'Makna teknis: ' : ''}{entri.makna}</p>
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
