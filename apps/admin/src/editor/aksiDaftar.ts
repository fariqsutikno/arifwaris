// Aksi per entri di daftar konten (menu ⋯ tiap baris & aksi massal). Menerima ringkasan entri + pelaku; memutuskan
// aksi mana yang berlaku, dan bila tidak, alasannya dalam bahasa manusia ("3 sudah terbit"). Cerminan aturan editorial
// (transisiRevisi, caraBuangEntri, bolehPulihkanEntri) untuk UI saja; database tetap penjaga. Aturan Sampah butuh
// pembuat semua revisi, sedangkan daftar hanya membawa revisi terakhir; sisanya ditolak database dengan pesan galat.
import { bolehPulihkanEntri, caraBuangEntri, transisiRevisi, type KeadaanSampah, type Peran } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { diSampah, statusTampil, type StatusTampil } from '../ringkas';

export type AksiDaftar = 'terbitkan' | 'ajukan' | 'setujui' | 'kembalikan' | 'sampah' | 'pulihkan';
interface Pelaku { peran: Peran; userId: string }

export const LABEL_AKSI: Record<AksiDaftar, string> = {
  terbitkan: 'Terbitkan', ajukan: 'Kirim untuk review', setujui: 'Setujui', kembalikan: 'Kembalikan',
  sampah: 'Pindahkan ke Sampah', pulihkan: 'Pulihkan',
};
export const HASIL_AKSI: Record<AksiDaftar, string> = {
  terbitkan: 'diterbitkan', ajukan: 'dikirim untuk review', setujui: 'disetujui', kembalikan: 'dikembalikan',
  sampah: 'dipindahkan ke Sampah', pulihkan: 'dipulihkan',
};

/** Aksi yang ditawarkan ke satu peran (tombol tampil); boleh-tidaknya per entri diputuskan alasanTolak. */
export function aksiPeran(peran: Peran, tabSampah: boolean): AksiDaftar[] {
  if (tabSampah) return ['pulihkan'];
  if (peran === 'admin') return ['terbitkan', 'ajukan', 'setujui', 'kembalikan', 'sampah'];
  if (peran === 'penulis') return ['ajukan', 'sampah'];
  return ['setujui', 'kembalikan'];
}

const KETERANGAN_STATUS: Record<StatusTampil, string> = {
  terbit: 'sudah terbit', draf: 'masih draf', 'terbit + draf': 'masih draf', diajukan: 'menunggu review',
  dikembalikan: 'dikembalikan, perlu diperbaiki dulu', sampah: 'di Sampah',
};

/** null = aksi boleh dijalankan pada entri ini. */
export function alasanTolak(aksi: AksiDaftar, entri: RingkasanEntri, pelaku: Pelaku): string | null {
  const status = statusTampil(entri);
  if (aksi === 'pulihkan') {
    const boleh = bolehPulihkanEntri({ ...keadaanSampah(entri), peran: pelaku.peran, pelakuId: pelaku.userId });
    return boleh.ok ? null : diSampah(entri) ? 'perlu reviewer atau admin' : 'tidak di Sampah';
  }
  if (diSampah(entri)) return KETERANGAN_STATUS.sampah;
  if (aksi === 'sampah') {
    const cara = caraBuangEntri({ ...keadaanSampah(entri), peran: pelaku.peran, pelakuId: pelaku.userId });
    if (cara.ok) return null;
    return keadaanSampah(entri).buangSedangDiajukan ? 'sudah diajukan ke Sampah' : 'memuat suntingan orang lain';
  }
  const revisi = entri.revisiTerakhir;
  if (!revisi || revisi.hapus) return KETERANGAN_STATUS[status];
  const transisi = transisiRevisi({
    peran: pelaku.peran, pelakuId: pelaku.userId, pembuatId: revisi.dibuatOleh, status: revisi.status, aksi, catatan: 'ada',
  });
  if (transisi.ok) return null;
  const statusCocok = (aksi === 'terbitkan' || aksi === 'ajukan') ? revisi.status === 'draf' : revisi.status === 'diajukan';
  if (!statusCocok) return KETERANGAN_STATUS[status];
  return aksi === 'ajukan' ? 'draf milik orang lain' : 'revisi Anda sendiri';
}

/** "2 dari 5 bisa disetujui · 3 sudah terbit"; null bila semua yang dipilih bisa. */
export function ringkasAlasan(aksi: AksiDaftar, dipilih: RingkasanEntri[], pelaku: Pelaku): string | null {
  const alasan = dipilih.map(entri => alasanTolak(aksi, entri, pelaku)).filter((a): a is string => a !== null);
  if (alasan.length === 0) return null;
  const perAlasan = new Map<string, number>();
  for (const a of alasan) perAlasan.set(a, (perAlasan.get(a) ?? 0) + 1);
  const bisa = dipilih.length - alasan.length;
  return [`${bisa} dari ${dipilih.length} bisa ${HASIL_AKSI[aksi]}`, ...[...perAlasan].map(([a, n]) => `${n} ${a}`)].join(' · ');
}

function keadaanSampah(entri: RingkasanEntri): KeadaanSampah {
  const revisi = entri.revisiTerakhir;
  return {
    pernahTerbit: !!entri.revisiTerbitId, diSampah: diSampah(entri),
    buangSedangDiajukan: !!revisi?.hapus && revisi.status === 'diajukan',
    pembuatRevisi: revisi ? [revisi.dibuatOleh] : [],
  };
}
