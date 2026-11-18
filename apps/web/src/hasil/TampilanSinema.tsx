// Tampilan Sinema: satu langkah = satu adegan. Panggung memuat visual terakhir tahap itu (harta, pohon, kotak) dan, bila langkah
// mengisi sel, tabel bertahap di bawahnya; papan memuat kalimat langkah. Takarir hanya tampil bila berbeda dari papan.
// Angka terbang dari papan (atau keterangan kotak) ke sel yang terisi.

import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { keTeksBiasa, type Linimasa } from '@waris/explain';
import { Baris } from '../layar/Penjelasan';
import { useGerakDikurangi } from '../tampilan';
import type { HasilOk } from '../jalankan';
import { HartaTabel, KotakHarta } from './KotakHarta';
import { TabelLangkah } from './TabelLangkah';
import { terbangkanAngka } from './terbangAngka';
import { selSampai, visualTerakhir, type Posisi } from './urutanLinimasa';
import type { RingkasanHasil } from './ringkasan';

interface Props {
  linimasa: Linimasa;
  urutan: Posisi[];
  indeks: number;
  hasil: HasilOk;
  ringkasan: RingkasanHasil;
  sembunyiNominal: boolean;
  pohon: ReactNode;
}

export function TampilanSinema({ linimasa, urutan, indeks, hasil, ringkasan, sembunyiNominal, pohon }: Props) {
  const panggung = useRef<HTMLElement>(null);
  const gerakKurang = useGerakDikurangi();
  const posisi = urutan[indeks]!;
  const langkah = linimasa.tahap[posisi.tahap]!.langkah[posisi.langkah]!;
  const { terbuka, kini } = useMemo(() => selSampai(linimasa, urutan, indeks), [linimasa, urutan, indeks]);
  const harta = visualTerakhir(linimasa, urutan, indeks, 'harta', true);
  const kotak = visualTerakhir(linimasa, urutan, indeks, 'kotak', true);
  const pohonAktif = !harta && !kotak && !langkah.sel && visualTerakhir(linimasa, urutan, indeks, 'pohon', true);
  const adaTabel = !!langkah.sel;
  const papan = keTeksBiasa(langkah.papan), takarir = keTeksBiasa(langkah.narasi);

  useLayoutEffect(() => {
    const akar = panggung.current;
    if (!akar) return;
    const sel = [...akar.querySelectorAll<HTMLElement>('td.kini > span:not(.rahasia)')];
    const keteranganKotak = [...akar.querySelectorAll<HTMLElement>('.ket-kotak span[data-orang]')];
    const papanEl = akar.querySelector<HTMLElement>('.papan-sinema');
    return terbangkanAngka(sel.map(sasaran => {
      const id = sasaran.closest('td')?.dataset.orang ?? '';
      return { sumber: keteranganKotak.find(span => span.dataset.orang!.split(' ').includes(id)) ?? papanEl, sasaran };
    }), gerakKurang);
  }, [indeks, gerakKurang]);

  return (
    <div className="sinema-isi">
      <main className="panggung" ref={panggung}>
        <div className="visual-sinema" key={`${posisi.tahap}`}>
          {harta && <HartaTabel baris={harta.baris} sembunyiNominal={sembunyiNominal} />}
          {kotak && <div className={adaTabel ? 'kotak-mini' : undefined}><KotakHarta visual={kotak} ringkasan={ringkasan} /></div>}
          {pohonAktif && <div className="pohon-sinema">{pohon}</div>}
          {adaTabel && (
            <div className="wadah-tabel">
              <TabelLangkah kolom={linimasa.tabel} hasil={hasil} ringkasan={ringkasan} sembunyiNominal={sembunyiNominal} terbuka={terbuka} kini={kini} />
            </div>
          )}
        </div>
        <p className="papan-sinema" key={indeks} aria-live="polite"><Baris baris={langkah.papan} /></p>
      </main>
      {takarir !== papan && <p className="takarir">{takarir}</p>}
    </div>
  );
}
