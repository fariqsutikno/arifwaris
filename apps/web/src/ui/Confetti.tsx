// Confetti sekali jalan untuk momen jawaban benar (satu-satunya animasi perayaan di aplikasi). Kertas jatuh ±1,6 detik
// lalu komponen hilang sendiri. Pengguna yang memilih kurangi gerakan (prefers-reduced-motion) tidak melihatnya.

import { useEffect, useMemo, useState } from 'react';

const JUMLAH = 42;
const WARNA = ['var(--sun)', 'var(--pink)', 'var(--lime)', 'var(--primary)'];

export function Confetti() {
  const [tampil, setTampil] = useState(true);
  useEffect(() => { const waktu = setTimeout(() => setTampil(false), 1800); return () => clearTimeout(waktu); }, []);
  // Posisi acak hanya untuk tampilan; dibuat sekali per kemunculan.
  const kertas = useMemo(() => Array.from({ length: JUMLAH }, (_, indeks) => ({
    kiri: Math.random() * 100, tunda: Math.random() * 0.25, geser: (Math.random() - 0.5) * 240, putar: Math.random() * 720 - 360,
    warna: WARNA[indeks % WARNA.length],
  })), []);
  if (!tampil) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {kertas.map((isi, indeks) => (
        <span key={indeks} style={{ left: `${isi.kiri}%`, background: isi.warna, animationDelay: `${isi.tunda}s`,
          ['--geser' as string]: `${isi.geser}px`, ['--putar' as string]: `${isi.putar}deg` }} />
      ))}
    </div>
  );
}
