// Jalur pengembangan tanpa basis data: bank memori berisi beberapa kode nyata dari sapuan bank (satu atau lebih per
// keluarga). Hanya dimuat dinamis saat `import.meta.env.DEV` dan tanpa env Supabase (klienBank.ts).

import { buatMemoriBank, type BarisBankSoal, type RepositoriBankSoal } from '@waris/data';
import { keluargaDariLabel, soalDariKode } from '@waris/latihan';

export const KODE_SAMPEL_DEV = [
  'G1-B-000000000004J180', 'G1-B-000000000000PV80',
  'G1-M-0000000000000146R8G00000', 'G1-M-0000000000004G0AG8A32000', 'G1-M-000000000080280E02A13A10',
  'G1-G-000000000410000EF25WTG', 'G1-G-0000002000000802A02M20', 'G1-G-290000000000000500G000',
  'G1-Q-000000000000088BG', 'G1-K-0000000000000H0AG', 'G1-H-000000000010010B0',
];

/** Soal kuis mesin sampel (kode, tingkat, modul, aturan): dari .bank/indeks-kuis.jsonl, mencakup ketujuh aturan pengecoh. */
const SAMPEL_KUIS: ReadonlyArray<readonly [string, 'dasar' | 'menengah' | 'sulit', number[], string[]]> = [
  ['K1-0000000000000KG02W', 'sulit', [6, 7], ['pasanganTertukar', 'lupaAul']],
  ['K1-0000000000002J4080', 'menengah', [6], ['lupaAul', 'pasanganTertukar']],
  ['K1-0000000000004J402G', 'menengah', [5, 6], ['lupaAul', 'pasanganTertukar']],
  ['K1-000000000010090024', 'menengah', [6], ['ibuTetapSepertiga', 'lupaRadd']],
  ['K1-00000001001002401G', 'dasar', [3, 4], ['ibuTetapSepertiga', 'pasanganTertukar']],
  ['K1-000000010080G84040', 'dasar', [4, 5], ['ashabahTerbalik', 'lupaHajb']],
  ['K1-00000001008420C0C0', 'dasar', [4, 5], ['ashabahTerbalik', 'lupaHajb']],
  ['K1-0000000100H0004080', 'dasar', [3, 4], ['ibuTetapSepertiga', 'pasanganTertukar']],
  ['K1-000000010600GRG040', 'menengah', [4, 5, 7], ['lupaHajb', 'ashabahTerbalik']],
  ['K1-0002000000000BG00M', 'sulit', [4, 7], ['ashabahSamaRata', 'pasanganTertukar']],
];

const POLA_MAYIT = /^(?:munasakhat|mayit):(\d+)$/;

export async function buatBankSampel(): Promise<RepositoriBankSoal> {
  const bank = buatMemoriBank();
  const baris = KODE_SAMPEL_DEV.flatMap((kode): BarisBankSoal[] => {
    const soal = soalDariKode(kode);
    if (!soal.ok) return [];
    const mayit = soal.label.map(token => POLA_MAYIT.exec(token)?.[1]).find(angka => angka !== undefined);
    return [{ kode, versiGenerator: 1, keluarga: keluargaDariLabel(soal.label) ?? 'biasa', tingkat: soal.tingkat, modul: soal.modul, label: soal.label, jumlahMayit: Number(mayit ?? 1), jumlahAhliWaris: 0 }];
  });
  await bank.simpan([
    ...baris,
    ...SAMPEL_KUIS.map(([kode, tingkat, modul, aturan]): BarisBankSoal => ({
      kode, versiGenerator: 1, keluarga: 'biasa', tingkat, modul, label: [], jumlahMayit: 1, jumlahAhliWaris: 0, bentuk: 'kuis', aturan,
    })),
  ]);
  // Hanya pengembangan lokal: di produksi persetujuan datang dari tim keilmuan lewat portal admin.
  for (const aturan of new Set(SAMPEL_KUIS.flatMap(([, , , daftar]) => daftar))) await bank.setujui(aturan);
  return bank;
}
