// Penanda orang di daftar hasil: lingkaran berwarna kelompok dengan huruf awal nama.
// Satu tempat untuk nanti diganti foto lokal; saat ini selalu inisial.

import type { Kelompok } from '../checklist';

export function AvatarOrang({ nama, kelompok, ukuran = 40 }: { nama: string; kelompok: Kelompok; ukuran?: number }) {
  return (
    <span className={`avatar-orang g-${kelompok}`} aria-hidden="true" style={{ width: ukuran, height: ukuran, fontSize: Math.round(ukuran * 0.42) }}>
      {[...nama.trim()][0]?.toUpperCase() ?? '?'}
    </span>
  );
}
