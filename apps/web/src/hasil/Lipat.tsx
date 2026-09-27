// Kartu sidebar yang bisa dibuka-tutup: judul + ringkasan di kepala, isi hanya dirender saat terbuka.

import { useId, useState, type ReactNode } from 'react';

interface Props { judul: string; ringkas?: ReactNode; terbukaAwal?: boolean; children: ReactNode; className?: string; dataTur?: string }

export function Lipat({ judul, ringkas, terbukaAwal = false, children, className, dataTur }: Props) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);
  const idIsi = useId();
  return (
    <section className={['kartu-sisi', className].filter(Boolean).join(' ')} {...(dataTur ? { 'data-tur': dataTur } : {})}>
      <button type="button" className="kepala-lipat" aria-expanded={terbuka} aria-controls={idIsi} onClick={() => setTerbuka(!terbuka)}>
        <h2>{judul}</h2>
        {ringkas && <span className="ringkas-kepala">{ringkas}</span>}
        <span className="panah-lipat" aria-hidden="true" />
      </button>
      {terbuka && <div id={idIsi} className="isi-kartu-sisi">{children}</div>}
    </section>
  );
}
