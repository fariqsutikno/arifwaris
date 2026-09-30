// Papan status Beranda sebagai peta jalur: tiap kegiatan (hitung, belajar, latihan) satu lintas berstasiun.
// Stasiun yang sudah dilewati terisi, stasiun berikutnya bercincin, sisanya kosong. Data diterima dari Beranda;
// papan ini hanya menggambar dan menaut, tanpa membaca penyimpanan sendiri.

import type { CSSProperties, ReactNode } from 'react';
import { Ikon, type NamaIkon } from '../ui/Ikon';

export interface LintasPeta {
  id: 'hitung' | 'belajar' | 'latihan';
  ikon: NamaIkon;
  judul: string;
  /** Nama tiap stasiun; kosong = stasiun tanpa label (jumlahnya tetap `jumlah`). */
  stasiun: string[];
  jumlah: number;
  /** Banyaknya stasiun yang sudah dilewati (0..jumlah). */
  dilewati: number;
  keterangan: ReactNode;
  tautan: string;
  aksi: string;
  saatKlik?: () => void;
}

export function PetaJalur({ judul, lintas }: { judul: string; lintas: LintasPeta[] }) {
  return (
    <section className="peta" aria-labelledby="judul-peta">
      <h2 id="judul-peta" className="judul-peta">{judul}</h2>
      <div className="peta-lintas">
        {lintas.map(jalur => <Lintas key={jalur.id} jalur={jalur} />)}
      </div>
    </section>
  );
}

function Lintas({ jalur }: { jalur: LintasPeta }) {
  const berlabel = jalur.stasiun.length > 0;
  return (
    <article className={`lintas lintas-${jalur.id}`}>
      <header className="kepala-lintas">
        <span className="tanda-lintas"><Ikon nama={jalur.ikon} ukuran={18} /></span>
        <h3>{jalur.judul}</h3>
      </header>
      <ol className={berlabel ? 'rel rel-berlabel' : 'rel'} aria-hidden="true">
        {Array.from({ length: jalur.jumlah }, (_, i) => (
          <li key={i} style={{ '--i': i } as CSSProperties} className={i < jalur.dilewati ? 'sudah' : i === jalur.dilewati ? 'kini' : undefined}>
            {berlabel && <span className="nama-stasiun">{jalur.stasiun[i]}</span>}
          </li>
        ))}
      </ol>
      <div className="isi-lintas">
        <p className="keterangan-lintas">{jalur.keterangan}</p>
        <a className="aksi-lintas" href={jalur.tautan} onClick={jalur.saatKlik}>{jalur.aksi}</a>
      </div>
    </article>
  );
}
