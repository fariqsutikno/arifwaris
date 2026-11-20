// Q-matriks: kolom (lewat idJudul) → tahapan → dimensi kecakapan. Satu sumber (spec 4A.11); bobot tahapan 40·30·30 bukan di sini
// (itu kebijakan tugas kelas). Kolom baru wajib didaftarkan di sini, kalau tidak susunTabel gagal keras.

export type Tahapan = 'keputusanFikih' | 'hisabDasar' | 'penyatuan';
export type Dimensi = 'kaidah' | 'hisab' | 'prosedur' | 'kelancaran' | 'penalaran';

const KEPUTUSAN: { tahapan: Tahapan; dimensi: Dimensi } = { tahapan: 'keputusanFikih', dimensi: 'kaidah' };
const HISAB: { tahapan: Tahapan; dimensi: Dimensi } = { tahapan: 'hisabDasar', dimensi: 'hisab' };
const PENYATUAN: { tahapan: Tahapan; dimensi: Dimensi } = { tahapan: 'penyatuan', dimensi: 'prosedur' };

const Q_MATRIKS: Record<string, { tahapan: Tahapan; dimensi: Dimensi }> = {
  bagian: KEPUTUSAN, didudukkanSebagai: KEPUTUSAN, bagianKemungkinan: KEPUTUSAN, keputusanGharqa: KEPUTUSAN,
  asalMasalah: HISAB, bagianPerantara: HISAB, asalMasalahAkhir: HISAB,
  sahamKemungkinan: PENYATUAN, masalahLanjutan: PENYATUAN, pengali: PENYATUAN, jamiah: PENYATUAN, mauquf: PENYATUAN,
};

export function qDari(idJudul: string): { tahapan: Tahapan; dimensi: Dimensi } {
  const q = Q_MATRIKS[idJudul];
  if (!q) throw new Error(`kolom "${idJudul}" belum didaftarkan di Q-matriks`);
  return q;
}
