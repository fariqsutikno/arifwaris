// Sorot silang: satu orang yang sedang di-hover/fokus menyala di pohon, bar, daftar, dan tabel sekaligus.
// Langkah perhitungan yang terbuka juga menyorot orang yang sedang dibahas, masing-masing dengan warna perannya
// (pewaris, ahli waris, penyebab, terhalang, bukan ahli waris, fardh, ashabah), panah sebab-akibat, dan kolom tabelnya.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { IdOrang } from '@waris/engine';
import type { KolomBab } from '@waris/explain';
import { t } from '../terjemah';

export type PeranSorot = 'pewaris' | 'ahliWaris' | 'penyebab' | 'mahjub' | 'bukan' | 'fardh' | 'ashabah';

export const LABEL_PERAN_SOROT: Record<PeranSorot, string> = {
  pewaris: 'Pewaris', ahliWaris: t('hitung.ahli_waris'), penyebab: 'Penyebab', mahjub: 'Terhalang',
  bukan: t('hitung.bukan_ahli_waris'), fardh: t('hitung.fardh_bagian_tertentu'), ashabah: t('hitung.ashabah_sisa'),
};

/** Hajb sebagai perubahan: bagian semula dicoret, diganti bagian baru (mis. 1/3 → 1/6, ahli waris → terhalang). */
export interface UbahBagian { dari: string; menjadi: string }

export interface SorotLangkah {
  peran: Map<IdOrang, PeranSorot>;
  kolom: KolomBab | undefined;
  /** Panah dari penyebab ke orang yang terdampak (mis. penghalang → terhalang), dengan keterangan pengaruhnya. */
  panah: Array<[IdOrang, IdOrang, string]>;
  ubah?: Map<IdOrang, UbahBagian>;
  /** Sel kolom yang sedang dibahas yang sudah boleh tampil; undefined = semua. */
  terungkap?: Set<IdOrang> | undefined;
  /** Jeda (ms) sebelum angka orang ini "masuk" ke selnya, supaya sejalan dengan hitungan di panel. */
  tundaSel?: Map<IdOrang, number>;
  /** Kolom tabel yang angkanya sudah boleh tampil saat tutorial membangun tabel; undefined = semua tampil. */
  kolomTerbuka?: Set<KolomBab | 'perOrang'>;
  /** Berubah tiap ketukan animasi, supaya animasi yang sama bisa diputar ulang. */
  ketukan: number;
}

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
  return (id: IdOrang) => {
    const peran = langkah?.peran.get(id);
    return {
      'data-orang': id,
      className: [aktif === id ? 'terkait' : '', peran ? `sorot-langkah sorot-${peran}` : ''].filter(Boolean).join(' '),
      onMouseEnter: () => setAktif(id),
      onMouseLeave: () => setAktif(null),
      onFocus: () => setAktif(id),
      onBlur: () => setAktif(null),
    };
  };
}

/** Keterangan warna sorot: hanya peran yang sedang tampil di langkah ini. */
export function LegendaSorot() {
  const { langkah } = useSorot();
  const daftarPeran = [...new Set(langkah?.peran.values() ?? [])];
  if (daftarPeran.length === 0) return null;
  return (
    <div className="legenda-sorot" aria-label={t('hitung.arti_warna_sorotan')}>
      {daftarPeran.map(peran => <span key={peran}><i className={`titik-sorot sorot-${peran}`} />{LABEL_PERAN_SOROT[peran]}</span>)}
    </div>
  );
}
