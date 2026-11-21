// Pesan singkat di dasar layar (role=status): hilang sendiri sesudah TOAST_MS; aksi opsional berupa tautan teks (mis. Urungkan).
// Wadahnya selalu ada supaya pembaca layar mengumumkan isi yang muncul belakangan.

import { useEffect } from 'react';

const TOAST_MS = 4000;

export interface IsiToast { teks: string; aksi?: { label: string; saat: () => void } }

export function Toast({ isi, saatHilang }: { isi: IsiToast | null; saatHilang: () => void }) {
  useEffect(() => {
    if (!isi) return;
    const waktu = window.setTimeout(saatHilang, TOAST_MS);
    return () => window.clearTimeout(waktu);
  }, [isi, saatHilang]);
  return (
    <div className={isi ? 'toast aktif' : 'toast'} role="status">
      {isi && <><span>{isi.teks}</span>{isi.aksi && <button type="button" className="tautan" onClick={isi.aksi.saat}>{isi.aksi.label}</button>}</>}
    </div>
  );
}
