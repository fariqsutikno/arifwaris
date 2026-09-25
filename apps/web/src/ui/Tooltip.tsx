// Tooltip buatan sendiri (bukan title bawaan browser): muncul saat hover, fokus, atau ketuk; posisinya menyesuaikan
// supaya tidak keluar layar (geser ke kiri bila di tepi kanan, pindah ke atas bila bawah penuh).
// Dipakai untuk istilah asing (arti dari glosarium KB bab 15) dan ikon ⓘ penjelasan di wizard.

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cariIstilah } from '@waris/content';

const JARAK = 8;

interface Kotak { left: number; right: number; top: number; bottom: number }

/** Posisi (fixed) tooltip di dekat pemicu: bawah bila muat, atas bila tidak; selalu di dalam layar. */
export function hitungPosisi(pemicu: Kotak, ukuran: { lebar: number; tinggi: number }, layar: { lebar: number; tinggi: number }) {
  const muatDiBawah = pemicu.bottom + JARAK + ukuran.tinggi <= layar.tinggi - JARAK;
  const top = muatDiBawah ? pemicu.bottom + JARAK : Math.max(JARAK, pemicu.top - JARAK - ukuran.tinggi);
  const left = Math.min(Math.max(JARAK, pemicu.left), Math.max(JARAK, layar.lebar - ukuran.lebar - JARAK));
  return { top, left };
}

function useTooltip() {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState({ top: 0, left: 0 });
  const pemicu = useRef<HTMLElement>(null);
  const kotak = useRef<HTMLSpanElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!terbuka || !pemicu.current || !kotak.current) return;
    const r = pemicu.current.getBoundingClientRect();
    setPosisi(hitungPosisi(r, { lebar: kotak.current.offsetWidth, tinggi: kotak.current.offsetHeight }, { lebar: window.innerWidth, tinggi: window.innerHeight }));
  }, [terbuka]);

  const pemicuProps = {
    ref: pemicu as React.RefObject<never>,
    'aria-describedby': terbuka ? id : undefined,
    onMouseEnter: () => setTerbuka(true), onMouseLeave: () => setTerbuka(false),
    onFocus: () => setTerbuka(true), onBlur: () => setTerbuka(false),
    // Di HP satu ketukan memicu mouseenter + focus + click berurutan; kalau click membalik keadaan, tooltip
    // langsung tertutup lagi. Jadi ketukan selalu membuka; menutup lewat ketuk di luar (blur) atau Esc.
    onClick: () => setTerbuka(true),
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Escape') setTerbuka(false); },
  };
  const isi = (konten: ReactNode) => terbuka && (
    <span ref={kotak} id={id} role="tooltip" className="tooltip" style={{ top: posisi.top, left: posisi.left }}>{konten}</span>
  );
  return { pemicuProps, isi };
}

/** Istilah fikih bergaris titik-titik; artinya dari glosarium, atau `arti` bila istilahnya belum ada di glosarium. */
export function Istilah({ id, arti, children }: { id?: string; arti?: string; children: ReactNode }) {
  const entri = id ? cariIstilah(id) : undefined;
  const teks = arti ?? entri?.artiAwam ?? entri?.makna;
  const { pemicuProps, isi } = useTooltip();
  if (!teks) return <>{children}</>;
  return <span className="istilah" tabIndex={0} {...pemicuProps}>{children}{isi(teks)}</span>;
}

/** Ikon ⓘ kecil di samping label; penjelasan muncul di tooltip, bukan paragraf panjang yang menempel. */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const { pemicuProps, isi } = useTooltip();
  return (
    <span className="info-tip">
      <button type="button" className="tombol-info" aria-label={label} {...pemicuProps}>i</button>
      {isi(children)}
    </span>
  );
}

/** Tombol ikon dengan label di tooltip kita (bukan title browser). Klik menjalankan aksi, bukan membuka tooltip. */
export function TombolIkon({ label, className = 'tombol-ikon', onClick, children, ...lain }: {
  label: string; className?: string; onClick: () => void; children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'className' | 'children'>) {
  const { pemicuProps, isi } = useTooltip();
  return (
    <span className="info-tip">
      <button type="button" className={className} aria-label={label} {...lain} {...pemicuProps} onClick={onClick}>{children}</button>
      {isi(label)}
    </span>
  );
}
