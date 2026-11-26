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

const POLA_MAYIT = /^(?:munasakhat|mayit):(\d+)$/;

export async function buatBankSampel(): Promise<RepositoriBankSoal> {
  const bank = buatMemoriBank();
  const baris = KODE_SAMPEL_DEV.flatMap((kode): BarisBankSoal[] => {
    const soal = soalDariKode(kode);
    if (!soal.ok) return [];
    const mayit = soal.label.map(token => POLA_MAYIT.exec(token)?.[1]).find(angka => angka !== undefined);
    return [{ kode, versiGenerator: 1, keluarga: keluargaDariLabel(soal.label) ?? 'biasa', tingkat: soal.tingkat, modul: soal.modul, label: soal.label, jumlahMayit: Number(mayit ?? 1), jumlahAhliWaris: 0 }];
  });
  await bank.simpan(baris);
  return bank;
}
