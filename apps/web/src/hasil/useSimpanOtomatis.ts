// Simpan otomatis kasus yang sampai di layar Hasil: segera saat pertama dibuka, lalu tiap kasus berubah (ditunda JEDA_SIMPAN_MS).
// Mengembalikan status untuk bilah hero: kapan terakhir tersimpan, atau gagal. `aktif` = false → tidak menyimpan apa pun.

import { useEffect, useRef, useState } from 'react';
import type { Kasus } from '../kasus';
import { bacaWaktuSimpan, simpanKasus } from '../tersimpan';

const JEDA_SIMPAN_MS = 800;

export type StatusSimpan = { jenis: 'tersimpan'; pada: Date } | { jenis: 'gagal' } | { jenis: 'tidak' };

export function useSimpanOtomatis(idSesi: string, kasus: Kasus, aktif: boolean): StatusSimpan {
  const [status, setStatus] = useState<StatusSimpan>({ jenis: 'tidak' });
  const sudahPertama = useRef(false);
  useEffect(() => {
    if (!aktif) { sudahPertama.current = false; setStatus({ jenis: 'tidak' }); return; }
    const simpan = () => {
      let berhasil = false;
      try { berhasil = simpanKasus(idSesi, kasus); } catch { /* penyimpanan terblokir: status "Tidak disimpan" */ }
      const waktu = bacaWaktuSimpan(idSesi);
      setStatus(berhasil && waktu ? { jenis: 'tersimpan', pada: new Date(waktu) } : { jenis: 'gagal' });
    };
    if (!sudahPertama.current) { sudahPertama.current = true; simpan(); return; }
    const tunda = window.setTimeout(simpan, JEDA_SIMPAN_MS);
    return () => window.clearTimeout(tunda);
  }, [idSesi, kasus, aktif]);
  return status;
}
