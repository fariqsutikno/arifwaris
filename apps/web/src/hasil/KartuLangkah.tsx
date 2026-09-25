// Pelajari langkah perhitungan: bab dari packages/explain, satu per satu (deret tahap horizontal + Sebelumnya/Berikutnya)
// atau semua sekaligus. Tiap baris jadi poin; "Kenapa begitu?" bisa dibuka-tutup berisi dalil. Saat terbuka,
// kanvas ikut menyorot orang yang disebut dan kolom tabel yang sedang dibahas.

import { useEffect, useRef, useState } from 'react';
import { Dalil, Baris, orangDisebut, type BabBerjudul } from '../layar/Penjelasan';
import { useSorot } from './sorot';

interface Props { daftarBab: BabBerjudul[]; terbukaAwal: boolean; saatSelesai: () => void }

export function KartuLangkah({ daftarBab, terbukaAwal, saatSelesai }: Props) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);
  const [mode, setMode] = useState<'satu' | 'semua'>('satu');
  const [indeks, setIndeks] = useState(0);
  const [dibaca, setDibaca] = useState<Set<number>>(new Set([0]));
  const { setLangkah } = useSorot();
  const babIni = daftarBab[indeks];
  const jalur = useRef<HTMLElement>(null);

  // Pill langkah aktif selalu terlihat di tengah deret, tanpa pengguna perlu menggeser.
  useEffect(() => {
    const wadah = jalur.current;
    const aktif = wadah?.querySelector<HTMLElement>('[aria-current="step"]');
    if (wadah && aktif) wadah.scrollLeft = aktif.offsetLeft - (wadah.clientWidth - aktif.offsetWidth) / 2;
  }, [indeks, terbuka, mode]);

  useEffect(() => { setTerbuka(terbukaAwal); }, [terbukaAwal]);
  useEffect(() => {
    setLangkah(terbuka && mode === 'satu' && babIni ? { orang: new Set(orangDisebut(babIni.bab.daftarBaris)), kolom: babIni.bab.kolom } : null);
  }, [terbuka, mode, babIni, setLangkah]);
  useEffect(() => () => setLangkah(null), [setLangkah]);

  const keLangkah = (tujuan: number) => {
    if (tujuan >= daftarBab.length) { setTerbuka(false); saatSelesai(); return; }
    setIndeks(tujuan);
    setDibaca(new Set([...dibaca, tujuan]));
  };

  return (
    <section className="kartu-sisi urut-langkah" data-tur="langkah">
      <button type="button" className="kepala-lipat" aria-expanded={terbuka} onClick={() => setTerbuka(!terbuka)}>
        <h2>Pelajari langkah perhitungan</h2>
        <span className="panah-lipat" aria-hidden="true">▾</span>
      </button>
      {terbuka && (
        <div className="isi-kartu-sisi">
          <div className="tab-kecil" role="group" aria-label="Cara tampil">
            <button type="button" aria-pressed={mode === 'satu'} onClick={() => setMode('satu')}>Langkah demi langkah</button>
            <button type="button" aria-pressed={mode === 'semua'} onClick={() => setMode('semua')}>Tampilkan semua</button>
          </div>
          {mode === 'semua' ? daftarBab.map((bab, nomor) => <KartuSatuLangkah key={nomor} nomor={nomor} total={daftarBab.length} babBerjudul={bab} />) : babIni && (
            <>
              <nav className="jalur-langkah" aria-label="Langkah" ref={jalur}>
                {daftarBab.map((bab, nomor) => (
                  <button key={nomor} type="button" aria-current={nomor === indeks ? 'step' : undefined}
                    className={dibaca.has(nomor) && nomor !== indeks ? 'kelar' : undefined} onClick={() => keLangkah(nomor)}>
                    <b aria-hidden="true">{dibaca.has(nomor) && nomor !== indeks ? '✓' : nomor + 1}</b>{bab.bab.judul}
                  </button>
                ))}
              </nav>
              <KartuSatuLangkah nomor={indeks} total={daftarBab.length} babBerjudul={babIni} />
              <div className="nav-langkah">
                <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" disabled={indeks === 0} onClick={() => keLangkah(indeks - 1)}>← Sebelumnya</button>
                <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => keLangkah(indeks + 1)}>
                  {indeks === daftarBab.length - 1 ? 'Selesai' : 'Berikutnya →'}
                </button>
              </div>
              {indeks > 0 && <p className="caption-isian">Mantap, {indeks} langkah kelar. Tinggal {daftarBab.length - indeks} lagi.</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function KartuSatuLangkah({ nomor, total, babBerjudul }: { nomor: number; total: number; babBerjudul: BabBerjudul }) {
  const [kenapaTerbuka, setKenapaTerbuka] = useState(false);
  const { bab, judulBagian } = babBerjudul;
  const refs = [...new Set(bab.daftarBaris.flatMap(baris => baris.refs))];
  return (
    <article className="kartu-langkah">
      <p className="ke-langkah">Langkah {nomor + 1} dari {total}{judulBagian ? ` · ${judulBagian}` : ''}</p>
      <h3>{bab.judul}</h3>
      <ul>{bab.daftarBaris.map((baris, i) => <li key={i}><Baris baris={baris} /></li>)}</ul>
      {refs.length > 0 && (
        <div className="kenapa">
          <button type="button" aria-expanded={kenapaTerbuka} onClick={() => setKenapaTerbuka(!kenapaTerbuka)}>Kenapa begitu?</button>
          {kenapaTerbuka && <div className="isi-kenapa"><Dalil daftarKode={refs} /></div>}
        </div>
      )}
    </article>
  );
}
