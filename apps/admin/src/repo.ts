// Konteks React yang menyimpan repo (@waris/data) + sesi + peran pengguna yang sedang masuk, dipasang oleh
// Portal.tsx setelah gerbang sesi/peran lolos. Layar-layar di bawah Portal memakai usePortal() untuk mengaksesnya.
import { createContext, useContext } from 'react';
import type { Peran } from '@waris/content';
import type { RepositoriAkun, RepositoriDiksi, RepositoriEditorial, RepositoriKonten, Sesi } from '@waris/data';

export type RepoPortal = { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi; akun: RepositoriAkun };

export const KonteksRepo = createContext<{ repo: RepoPortal; sesi: Sesi; peran: Peran } | null>(null);

export function usePortal() {
  const nilai = useContext(KonteksRepo);
  if (!nilai) throw new Error('usePortal dipanggil di luar KonteksRepo.Provider');
  return nilai;
}
