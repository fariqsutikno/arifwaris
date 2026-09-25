// Angka yang "berjalan" dari 0 ke nilainya setiap `pemicu` berubah, untuk menarik mata ke angka yang baru dihitung.
// Hanya tampilan: nilai akhir selalu bigint asli dari engine; Number dipakai untuk bingkai perantara saja.

import { useEffect, useState } from 'react';

const DURASI = 1600;

export function AngkaJalan({ nilai, format = String, pemicu }: { nilai: bigint; format?: (nilai: bigint) => string; pemicu: unknown }) {
  const [perantara, setPerantara] = useState<bigint | null>(null);
  useEffect(() => {
    if (pemicu === undefined || pemicu === null || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let bingkai = 0;
    const mulai = performance.now();
    const jalan = (sekarang: number) => {
      const t = Math.min(1, (sekarang - mulai) / DURASI);
      const lembut = 1 - (1 - t) ** 3;
      if (t < 1) { setPerantara(BigInt(Math.round(Number(nilai) * lembut))); bingkai = requestAnimationFrame(jalan); } else setPerantara(null);
    };
    bingkai = requestAnimationFrame(jalan);
    return () => { cancelAnimationFrame(bingkai); setPerantara(null); };
  }, [pemicu, nilai]);
  return perantara === null ? <>{format(nilai)}</> : <span className="angka-berjalan">{format(perantara)}</span>;
}
