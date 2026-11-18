// Tampilan Teks mode Langkah demi langkah: kiri pohon dan tabel bertahap, kanan kartu tahap. Langkah dikelompokkan per bagian
// (keluarga / hitungan) dan muncul sampai langkah aktif; "Tampilkan semua" membuka seluruh tahap sekaligus. Saat langkah
// mengisi sel tabel, angkanya terbang dari keterangan kotak (atau rumus) ke sel itu.

import { useLayoutEffect, useMemo, useRef } from 'react';
import type { BagianLangkah, Langkah, Linimasa } from '@waris/explain';
import { Baris, Dalil } from '../layar/Penjelasan';
import { useGerakDikurangi } from '../tampilan';
import { HartaTabel, KotakHarta } from './KotakHarta';
import { MejaTaqdir } from './MejaTaqdir';
import { TabelLangkah } from './TabelLangkah';
import { terbangkanAngka } from './terbangAngka';
import { babakDi, selSampai, visualTerakhir, type PeragaBabak, type Posisi } from './urutanLinimasa';
import type { RingkasanHasil } from './ringkasan';
import { angka, t } from '../terjemah';
import type { ReactNode } from 'react';

interface Props {
  linimasa: Linimasa;
  urutan: Posisi[];
  indeks: number;
  semua: boolean;
  babak: PeragaBabak[];
  /** Untuk tahap tanpa tabel (munasakhat: penyambungan, hasil akhir): nama dan warna penerima akhir. */
  ringkasanAkhir: RingkasanHasil;
  sembunyiNominal: boolean;
  pohon: ReactNode;
}

export function TampilanTeks({ linimasa, urutan, indeks, semua, babak, ringkasanAkhir, sembunyiNominal, pohon }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const gerakKurang = useGerakDikurangi();
  const akhir = semua ? urutan.length - 1 : indeks;
  const babakTampil = semua ? babak.map((_, nomor) => nomor) : [babakDi(linimasa, urutan, akhir)];
  const selPerBabak = useMemo(() => babakTampil.map(nomor => selSampai(linimasa, urutan, akhir, nomor)), [linimasa, urutan, akhir, semua, babak.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const kiniDiTabel = !semua;

  useLayoutEffect(() => {
    const akar = wadah.current;
    if (!akar || !kiniDiTabel) return;
    akar.querySelector('li.kini')?.scrollIntoView?.({ block: 'nearest', behavior: gerakKurang ? 'auto' : 'smooth' });
    const sel = [...akar.querySelectorAll<HTMLElement>('td.kini > span:not(.rahasia)')];
    const keteranganKotak = [...akar.querySelectorAll<HTMLElement>('.ket-kotak span[data-orang]')];
    const sumberKotak = (id: string) => keteranganKotak.find(span => span.dataset.orang!.split(' ').includes(id));
    const sumberRumus = akar.querySelector<HTMLElement>('li.kini') ?? akar.querySelector<HTMLElement>('.kartu-tahap');
    return terbangkanAngka(sel.map(sasaran => ({ sumber: sumberKotak(sasaran.closest('td')?.dataset.orang ?? '') ?? sumberRumus, sasaran })), gerakKurang);
  }, [indeks, kiniDiTabel, gerakKurang]);

  const tahapTampil = semua ? linimasa.tahap.map((_, nomor) => nomor) : [urutan[indeks]!.tahap];
  return (
    <div className="teks-isi" ref={wadah}>
      <div className="teks-kiri">
        <section className="panel-langkah"><h2>{t('langkah.pohon_keluarga')}</h2><div className="isi-pohon wadah-pohon">{pohon}</div></section>
        {babak.length > 0 && (semua || linimasa.tahap[urutan[indeks]!.tahap]!.babak !== undefined) && <section className="panel-langkah"><h2>{t('langkah.tabel_faraidh')}</h2>
          {babakTampil.map((nomor, urut) => (
            <div className="wadah-tabel" key={nomor}>
              <TabelLangkah kolom={linimasa.tabel[nomor]!} hasil={babak[nomor]!.hasil} ringkasan={babak[nomor]!.ringkasan} sembunyiNominal={sembunyiNominal}
                terbuka={selPerBabak[urut]!.terbuka} kini={kiniDiTabel ? selPerBabak[urut]!.kini : new Set()} />
            </div>
          ))}
        </section>}
      </div>
      <section className="panel-langkah" aria-live="polite">
        {tahapTampil.map(nomorTahap => {
          const tahap = linimasa.tahap[nomorTahap]!;
          const sampaiLangkah = semua || nomorTahap !== urutan[indeks]!.tahap ? tahap.langkah.length - 1 : urutan[indeks]!.langkah;
          const posisiAkhir = urutan.findIndex(posisi => posisi.tahap === nomorTahap && posisi.langkah === sampaiLangkah);
          const harta = visualTerakhir(linimasa, urutan, posisiAkhir, 'harta', true);
          const kotak = visualTerakhir(linimasa, urutan, posisiAkhir, 'kotak', true);
          const meja = visualTerakhir(linimasa, urutan, posisiAkhir, 'meja', true);
          const refs = [...new Set(tahap.langkah.slice(0, sampaiLangkah + 1).flatMap(langkah => langkah.refs))];
          return (
            <article key={tahap.id} className="kartu-tahap">
              {semua && <p className="ke-tahap">{t('langkah.tahap_dari', { nomor: angka(String(nomorTahap + 1)), total: angka(String(linimasa.tahap.length)) })}</p>}
              {semua && <h3>{tahap.judul}</h3>}
              {meja && <MejaTaqdir visual={meja} ringkasan={ringkasanAkhir} sebutan={linimasa.nama} />}
              {harta && <HartaTabel baris={harta.baris} sembunyiNominal={sembunyiNominal} />}
              {kotak && <KotakHarta visual={kotak} ringkasan={tahap.babak === undefined ? ringkasanAkhir : babak[tahap.babak]!.ringkasan} sebutan={tahap.babak === undefined ? linimasa.nama : undefined} />}
              {kelompokkan(tahap.langkah.map((langkah, nomor) => ({ langkah, nomor })).filter(({ nomor }) => nomor <= sampaiLangkah))
                .map(kelompok => (
                  <div key={kelompok.isi[0]!.nomor} className={`bagian-langkah bagian-${kelompok.bagian}`}>
                    <p className="label-bagian">{JUDUL_BAGIAN[kelompok.bagian]()}</p>
                    <ul>
                      {kelompok.isi.map(({ langkah, nomor }) => (
                        <li key={nomor} className={!semua && nomorTahap === urutan[indeks]!.tahap && nomor === sampaiLangkah ? 'kini' : undefined}><Baris baris={langkah.narasi} /></li>
                      ))}
                    </ul>
                  </div>
                ))}
              {refs.length > 0 && (
                <details className="kenapa-langkah"><summary>{t('umum.kenapa_begitu')}</summary><Dalil daftarKode={refs} /></details>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

const JUDUL_BAGIAN: Record<BagianLangkah, () => string> = { keluarga: () => t('langkah.bagian_keluarga'), hitung: () => t('langkah.bagian_hitung') };

interface Kelompok { bagian: BagianLangkah; isi: Array<{ langkah: Langkah; nomor: number }> }

/** Langkah berurutan dengan bagian sama jadi satu blok berlabel. */
function kelompokkan(isi: Kelompok['isi']): Kelompok[] {
  const hasil: Kelompok[] = [];
  for (const butir of isi) {
    const terakhir = hasil.at(-1);
    if (terakhir?.bagian === butir.langkah.bagian) terakhir.isi.push(butir);
    else hasil.push({ bagian: butir.langkah.bagian, isi: [butir] });
  }
  return hasil;
}
