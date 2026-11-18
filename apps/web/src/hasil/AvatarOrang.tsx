// Penanda orang di daftar hasil dan di kotak pohon: kotak bulat berwarna dengan huruf awal nama.
// Warna dari warnaOrang.ts (di layar hasil per orang; di luar itu per nama). Satu tempat untuk nanti diganti foto lokal.

import { warnaDariNama } from './warnaOrang';

export function AvatarOrang({ nama, warna, ukuran = 40 }: { nama: string; warna?: string | undefined; ukuran?: number }) {
  const bersih = nama.trim();
  return (
    <span className="avatar-orang" aria-hidden="true" style={{ width: ukuran, height: ukuran, fontSize: Math.round(ukuran * 0.42), background: warna ?? warnaDariNama(bersih) }}>
      {[...bersih][0]?.toUpperCase() ?? '?'}
    </span>
  );
}
