// Penjaga navigasi: halaman yang sedang berisi pekerjaan (kasus di Hitung, sesi kuis) bisa meminta konfirmasi
// sebelum pengguna pindah lewat tautan hash (menu, tautan di halaman). Klik ditangkap di fase capture sehingga
// tautan mana pun ikut terjaga tanpa diubah satu per satu. Tombol Kembali browser tidak dijaga.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DialogKonfirmasi } from './Dialog';

export interface Penjaga {
  /** true bila pindah ke href ini perlu ditanyakan dulu. */
  berlaku: (hrefTujuan: string) => boolean;
  judul: string;
  isi: ReactNode;
  labelTetap: string;
  labelPergi: string;
}

const KonteksPenjaga = createContext<(penjaga: Penjaga | null) => void>(() => {});

export function PenyediaPenjaga({ children }: { children: ReactNode }) {
  const [penjaga, setPenjaga] = useState<Penjaga | null>(null);
  const [tujuan, setTujuan] = useState<string | null>(null);
  useEffect(() => {
    if (!penjaga) return;
    const tangkap = (event: MouseEvent) => {
      const tautan = (event.target as Element | null)?.closest?.('a[href^="#"]');
      const href = tautan?.getAttribute('href');
      if (!href || !penjaga.berlaku(href)) return;
      event.preventDefault();
      event.stopPropagation();
      setTujuan(href);
    };
    document.addEventListener('click', tangkap, true);
    return () => document.removeEventListener('click', tangkap, true);
  }, [penjaga]);
  return (
    <KonteksPenjaga.Provider value={setPenjaga}>
      {children}
      {penjaga && tujuan !== null && (
        <DialogKonfirmasi judul={penjaga.judul} labelBatal={penjaga.labelTetap} labelLanjut={penjaga.labelPergi}
          saatBatal={() => setTujuan(null)}
          saatLanjut={() => { setPenjaga(null); setTujuan(null); window.location.hash = tujuan; }}>
          {penjaga.isi}
        </DialogKonfirmasi>
      )}
    </KonteksPenjaga.Provider>
  );
}

/** Pasang penjaga selama `aktif`; nilai terbaru `penjaga` selalu dipakai tanpa memasang ulang listener tiap render. */
export function usePenjaga(aktif: boolean, penjaga: Penjaga): void {
  const pasang = useContext(KonteksPenjaga);
  const terbaru = useRef(penjaga);
  terbaru.current = penjaga;
  useEffect(() => {
    if (!aktif) return;
    pasang({
      berlaku: href => terbaru.current.berlaku(href),
      get judul() { return terbaru.current.judul; }, get isi() { return terbaru.current.isi; },
      get labelTetap() { return terbaru.current.labelTetap; }, get labelPergi() { return terbaru.current.labelPergi; },
    });
    return () => pasang(null);
  }, [aktif, pasang]);
}
