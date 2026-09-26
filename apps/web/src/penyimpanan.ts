// Akses localStorage dengan cadangan memori: mode privat / penyimpanan penuh tidak mematikan aplikasi, nilai bertahan
// selama sesi. Dipakai semua modul data pengguna (preferensi, progres, tersimpan, antrean akun).
// cadangan hanya dipakai saat localStorage gagal, supaya nilai tidak "hidup lagi" dari memori setelah
// localStorage.clear() dari luar (mis. beforeEach tes) — bacaMentah selalu memercayai localStorage dulu.

const cadangan = new Map<string, string>();

export function bacaMentah(kunci: string): string | null {
  try {
    const nilai = localStorage.getItem(kunci);
    return nilai ?? cadangan.get(kunci) ?? null;
  } catch {
    return cadangan.get(kunci) ?? null;
  }
}

export function simpanMentah(kunci: string, nilai: string): void {
  try {
    localStorage.setItem(kunci, nilai);
    cadangan.delete(kunci);
  } catch {
    // Mode privat / penyimpanan penuh: cukup di memori.
    cadangan.set(kunci, nilai);
  }
}

export function hapusMentah(kunci: string): void {
  cadangan.delete(kunci);
  try {
    localStorage.removeItem(kunci);
  } catch {
    // Tidak bisa dihapus: cukup dari memori.
  }
}

/** Semua kunci berawalan `awalan`, di localStorage dan cadangan (dipakai saat keluar akun). */
export function hapusSemuaMentah(awalan: string): void {
  [...cadangan.keys()].filter(kunci => kunci.startsWith(awalan)).forEach(kunci => cadangan.delete(kunci));
  try {
    Object.keys(localStorage).filter(kunci => kunci.startsWith(awalan)).forEach(kunci => localStorage.removeItem(kunci));
  } catch {
    // localStorage tidak tersedia: cadangan sudah dibersihkan.
  }
}

/** Kunci berawalan `awalan` yang ada (localStorage + cadangan). */
export function daftarKunci(awalan: string): string[] {
  let tersimpan: string[] = [];
  try {
    tersimpan = Object.keys(localStorage);
  } catch {
    // hanya cadangan
  }
  return [...new Set([...tersimpan, ...cadangan.keys()])].filter(kunci => kunci.startsWith(awalan));
}
