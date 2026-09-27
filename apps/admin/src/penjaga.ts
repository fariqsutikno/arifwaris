// Penjaga perubahan belum disimpan: layar yang punya isi belum tersimpan (EditorEntri) memasang penjaga lewat
// usePenjagaPerubahan. Selama ada penjaga aktif, menutup/memuat ulang tab memunculkan peringatan bawaan peramban
// (beforeunload), dan pindah rute di portal (LayarRute) bertanya dulu lewat bolehTinggalkan(). Pesan kilat
// meneruskan satu pesan (sukses/galat) melewati pindah rute (mis. entri baru tersimpan → editor entri yang baru dipasang).
import { useEffect } from 'react';

const PESAN_TINGGALKAN = 'Ada perubahan yang belum disimpan. Tinggalkan halaman ini?';
const penjagaAktif = new Set<symbol>();
export type Kilat = { jenis: 'sukses' | 'galat'; teks: string };
let pesanKilat: Kilat | null = null;

export function usePenjagaPerubahan(berubah: boolean) {
  useEffect(() => {
    if (!berubah) return;
    const kunci = Symbol('penjaga');
    penjagaAktif.add(kunci);
    const saatTutup = (event: BeforeUnloadEvent) => {
      if (!penjagaAktif.has(kunci)) return; // sudah dilepas (lepasPenjaga) walau efek belum dibersihkan
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', saatTutup);
    return () => {
      penjagaAktif.delete(kunci);
      window.removeEventListener('beforeunload', saatTutup);
    };
  }, [berubah]);
}

/** true bila tidak ada perubahan tertunda, atau pengguna setuju meninggalkannya. */
export function bolehTinggalkan(): boolean {
  if (penjagaAktif.size === 0) return true;
  if (!window.confirm(PESAN_TINGGALKAN)) return false;
  lepasPenjaga();
  return true;
}

/** Dipanggil setelah simpan berhasil, sebelum pindah rute: penjaga dilepas tanpa menunggu render berikutnya. */
export function lepasPenjaga() { penjagaAktif.clear(); }

export function setelKilat(kilat: Kilat) { pesanKilat = kilat; }

export function ambilKilat(): Kilat | null {
  const kilat = pesanKilat;
  pesanKilat = null;
  return kilat;
}
