// Pesan singkat di dasar layar (role=status): hilang sendiri sesudah TOAST_MS (TOAST_BERAKSI_MS bila beraksi); aksi opsional berupa tautan teks (mis. Urungkan).
// Wadahnya selalu ada supaya pembaca layar mengumumkan isi yang muncul belakangan.

import { useEffect, useRef, useState } from 'react';

const TOAST_MS = 4000;
// Toast beraksi (Urungkan) harus sempat dibaca lalu diklik; ia juga tidak hilang selagi kursor atau fokus ada di atasnya.
const TOAST_BERAKSI_MS = 10000;

export interface IsiToast { teks: string; aksi?: { label: string; saat: () => void } }

export function Toast({ isi, saatHilang }: { isi: IsiToast | null; saatHilang: () => void }) {
  const [tertahan, setTertahan] = useState(false);
  const beraksi = !!isi?.aksi;
  // Induk mengirim fungsi baru tiap render; lewat ref supaya hitungan mundur tidak diulang.
  const hilang = useRef(saatHilang);
  hilang.current = saatHilang;
  useEffect(() => {
    if (!isi || (beraksi && tertahan)) return;
    const waktu = window.setTimeout(() => hilang.current(), beraksi ? TOAST_BERAKSI_MS : TOAST_MS);
    return () => window.clearTimeout(waktu);
  }, [isi, beraksi, tertahan]);
  const tahan = () => setTertahan(true), lepas = () => setTertahan(false);
  return (
    <div className={isi ? 'toast aktif' : 'toast'} role="status" onMouseEnter={tahan} onMouseLeave={lepas} onFocus={tahan} onBlur={lepas}>
      {isi && <><span>{isi.teks}</span>{isi.aksi && <button type="button" className="tautan" onClick={isi.aksi.saat}>{isi.aksi.label}</button>}</>}
    </div>
  );
}
