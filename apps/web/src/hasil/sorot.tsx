// Sorot silang: satu orang yang sedang di-hover/fokus menyala di pohon, bar, daftar, dan tabel sekaligus.
// Langkah perhitungan yang terbuka juga menyorot orang dan kolom tabel yang sedang dibahas.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { IdOrang } from '@waris/engine';
import type { KolomBab } from '@waris/explain';

export interface SorotLangkah { orang: Set<IdOrang>; kolom: KolomBab | undefined }

interface NilaiSorot {
  aktif: IdOrang | null;
  setAktif: (id: IdOrang | null) => void;
  langkah: SorotLangkah | null;
  setLangkah: (langkah: SorotLangkah | null) => void;
}

const KonteksSorot = createContext<NilaiSorot>({ aktif: null, setAktif: () => {}, langkah: null, setLangkah: () => {} });

export function PenyediaSorot({ children }: { children: ReactNode }) {
  const [aktif, setAktif] = useState<IdOrang | null>(null);
  const [langkah, setLangkah] = useState<SorotLangkah | null>(null);
  const nilai = useMemo(() => ({ aktif, setAktif, langkah, setLangkah }), [aktif, langkah]);
  return <KonteksSorot.Provider value={nilai}>{children}</KonteksSorot.Provider>;
}

export const useSorot = () => useContext(KonteksSorot);

/** Atribut untuk elemen yang mewakili satu orang: class `terkait` saat orang itu disorot, dan pemicu hover/fokus. */
export function useAtributOrang() {
  const { aktif, setAktif, langkah } = useSorot();
  return (id: IdOrang) => ({
    'data-orang': id,
    className: [aktif === id ? 'terkait' : '', langkah?.orang.has(id) ? 'sorot-langkah' : ''].filter(Boolean).join(' '),
    onMouseEnter: () => setAktif(id),
    onMouseLeave: () => setAktif(null),
    onFocus: () => setAktif(id),
    onBlur: () => setAktif(null),
  });
}
