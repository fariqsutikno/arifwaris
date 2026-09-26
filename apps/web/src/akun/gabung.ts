// Penggabungan data perangkat dengan data akun saat akun pertama kali masuk di perangkat ini (spec akun pengguna
// "Penggabungan"). Fungsi murni: menerima dua sisi, mengembalikan hasil untuk ditulis ke lokal dan daftar baris yang
// harus dikirim karena berbeda dari server.

import type { Preferensi, ProgresBelajar, ProgresLatihan, RiwayatTersimpan } from '@waris/data';
import type { EntriAntrean } from './antrean';

export interface DataPengguna { tersimpan: RiwayatTersimpan[]; belajar: ProgresBelajar[]; latihan: ProgresLatihan[]; preferensi: Preferensi | null }

export function gabung(lokal: DataPengguna, server: DataPengguna): { hasil: DataPengguna; kirim: EntriAntrean[] } {
  const tersimpan = gabungPerKunci(lokal.tersimpan, server.tersimpan, baris => baris.id,
    (a, b) => (a.disimpanPada >= b.disimpanPada ? a : b));
  const belajar = gabungPerKunci(lokal.belajar, server.belajar, baris => baris.pelajaranSlug,
    (a, b) => ({ ...a, selesai: a.selesai || b.selesai, diubahPada: terbaru(a.diubahPada, b.diubahPada) }));
  const latihan = gabungPerKunci(lokal.latihan, server.latihan, baris => `${baris.jenis}:${baris.soalSlug}`,
    (a, b) => ({ ...(a.diubahPada >= b.diubahPada ? a : b), jumlahCoba: Math.max(a.jumlahCoba, b.jumlahCoba) }));
  const preferensi = !lokal.preferensi || !server.preferensi ? lokal.preferensi ?? server.preferensi
    : lokal.preferensi.diubahPada > server.preferensi.diubahPada ? lokal.preferensi : server.preferensi;

  const bedaDariServer = <T>(daftar: T[], dariServer: T[]) => {
    const ada = new Set(dariServer.map(baris => JSON.stringify(baris)));
    return daftar.filter(baris => !ada.has(JSON.stringify(baris)));
  };
  const kirim: EntriAntrean[] = [
    ...bedaDariServer(tersimpan, server.tersimpan).map(baris => ({ tabel: 'tersimpan' as const, baris })),
    ...bedaDariServer(belajar, server.belajar).map(baris => ({ tabel: 'belajar' as const, baris })),
    ...bedaDariServer(latihan, server.latihan).map(baris => ({ tabel: 'latihan' as const, baris })),
    ...(preferensi && JSON.stringify(preferensi) !== JSON.stringify(server.preferensi) ? [{ tabel: 'preferensi' as const, baris: preferensi }] : []),
  ];
  return { hasil: { tersimpan, belajar, latihan, preferensi }, kirim };
}

const terbaru = (a: string, b: string) => (a >= b ? a : b);

function gabungPerKunci<T>(lokal: T[], server: T[], kunci: (baris: T) => string, pilih: (lokal: T, server: T) => T): T[] {
  const hasil = new Map(server.map(baris => [kunci(baris), baris]));
  for (const baris of lokal) {
    const dariServer = hasil.get(kunci(baris));
    hasil.set(kunci(baris), dariServer ? pilih(baris, dariServer) : baris);
  }
  return [...hasil.values()];
}
