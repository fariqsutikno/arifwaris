// Angka yang "masuk ke kotaknya" setiap `pemicu` berubah: jatuh dari atas lalu mendarat, setelah jeda `tunda`.
// Bukan hitungan berjalan 0 → nilai; angkanya sudah final dari engine, yang dianimasikan hanya kedatangannya.

import type { CSSProperties } from 'react';

export function AngkaMasuk({ teks, pemicu, tunda = 0 }: { teks: string; pemicu: unknown; tunda?: number }) {
  if (pemicu === undefined || pemicu === null) return <>{teks}</>;
  return <span key={String(pemicu)} className="angka-masuk" style={{ '--tunda': `${tunda}ms` } as CSSProperties}>{teks}</span>;
}
