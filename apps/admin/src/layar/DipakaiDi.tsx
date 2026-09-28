// Panel Info editor dasar hukum: konten mana saja yang merujuknya (dari database) dan berapa tempat aturan kalkulator
// memakainya (anotasi [Rxx-y] di engine, dipindai saat build). Supaya penyunting tahu dampak koreksinya.
import { useEffect, useState } from 'react';
import refsEngine from 'virtual:refs-engine';
import type { RingkasanEntri } from '@waris/data';
import { usePortal } from '../repo';
import { LABEL_ISI } from '../navigasi';
import { diSampah, judulEntri } from '../ringkas';
import { tulisRute } from '../rute';

export function DipakaiDi({ kode }: { kode: string }) {
  const { repo } = usePortal();
  const [pemakai, setPemakai] = useState<RingkasanEntri[] | null>(null);
  useEffect(() => {
    let dibatalkan = false;
    repo.konten.daftarEntri().then(daftar => {
      if (!dibatalkan) setPemakai(daftar.filter(entri => !diSampah(entri) && entri.revisiTerakhir?.refs.includes(kode)));
    }).catch(() => { if (!dibatalkan) setPemakai([]); });
    return () => { dibatalkan = true; };
  }, [repo, kode]);
  const diKalkulator = refsEngine[kode] ?? 0;
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-medium">Dipakai di</h3>
      {diKalkulator > 0 ? (
        <p className="rounded-md border bg-muted/40 px-2 py-1.5 text-sm">
          Aturan kalkulator ({diKalkulator} tempat). Bila klaimnya dikoreksi, developer perlu memeriksa aturan itu.
        </p>
      ) : null}
      {pemakai === null ? <p className="text-sm text-muted-foreground">Memuat…</p> : pemakai.length > 0 ? (
        <ul className="grid gap-1.5">
          {pemakai.map(entri => (
            <li key={entri.entriId} className="text-sm">
              <span className="text-muted-foreground">{LABEL_ISI[entri.jenis]} · </span>
              <a className="underline-offset-2 hover:underline" href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judulEntri(entri)}</a>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Belum dirujuk materi, soal, atau FAQ.</p>}
    </section>
  );
}
