// Sidebar yang di HP (≤860px) menjadi laci dari kanan, dibuka lewat tombol berlabel di atas konten
// (bukan tab melayang di tepi layar: itu menutupi teks dan sulit ditemukan).
// Di layar lebar isinya tampil biasa sebagai sidebar; tombol dan tirainya disembunyikan CSS.
// Dipasang ulang (key) oleh pemanggil saat berpindah halaman supaya laci tertutup lagi.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Ikon } from './Ikon';

interface Props {
  id: string; label: string; judul: ReactNode; children: ReactNode;
  /** Posisi pembaca saat ini, tampil di tombol supaya tombolnya juga memberi tahu "sedang di mana". */
  ringkasan?: ReactNode;
}

export function Laci({ id, label, judul, children, ringkasan }: Props) {
  const [terbuka, setTerbuka] = useState(false);
  const tombolTutup = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!terbuka) return;
    tombolTutup.current?.focus();
    const saatTombol = (event: KeyboardEvent) => { if (event.key === 'Escape') setTerbuka(false); };
    document.addEventListener('keydown', saatTombol);
    return () => document.removeEventListener('keydown', saatTombol);
  }, [terbuka]);
  return (
    <>
      <button type="button" className="tombol-laci" aria-expanded={terbuka} aria-controls={id} onClick={() => setTerbuka(true)}>
        <span className="ikon-tombol-laci"><Ikon nama="daftar" ukuran={18} /></span>
        <span className="teks-tombol-laci"><small>{label}</small>{ringkasan && <b>{ringkasan}</b>}</span>
        <span className="panah-tombol-laci" aria-hidden="true">›</span>
      </button>
      {terbuka && <div className="tirai-laci" onClick={() => setTerbuka(false)} />}
      <aside id={id} className={terbuka ? 'sidebar-materi terbuka' : 'sidebar-materi'} aria-label={label}>
        <div className="kepala-sidebar-materi">
          <div className="judul-laci">{judul}</div>
          <button ref={tombolTutup} type="button" className="tombol-tutup-laci" onClick={() => setTerbuka(false)} aria-label={`Tutup ${label.toLowerCase()}`}>
            <Ikon nama="salah" ukuran={18} />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
