// Keadaan layar sunting satu entri, dihitung murni dari peran, pelaku, entri, dan revisinya. Menerima data yang dimuat
// EditorEntri; memutuskan apakah form bisa disunting (dan salinan kerja mana yang diperbarui), menunggu review, terkunci
// (beserta alasannya dalam bahasa manusia), atau ada di Sampah; serta teks "tayang di web". EditorEntri hanya
// menampilkan hasilnya. Pengguna tidak pernah melihat istilah "draf baru": suntingan pertama membuat salinan kerja,
// suntingan berikutnya memperbaruinya.
import { bolehPerbaruiAjuan, bolehPulihkanEntri, bolehSuntingDraf, caraBuangEntri, transisiRevisi, type KeadaanSampah, type Peran } from '@waris/content';
import type { RingkasanRevisi } from '@waris/data';

export interface EntriSunting {
  revisiTerbitId: string | null; dihapus: boolean; dibuang: boolean; diarsipkan: boolean; semuaRevisi: RingkasanRevisi[];
}
interface Pelaku { peran: Peran; userId: string; namaDari: (userId: string) => string }

export type KeadaanSunting =
  /** ajuan: salinan kerja adalah ajuan milik pelaku yang masih menunggu review; menyimpan = memperbarui ajuan itu. */
  | { jenis: 'sunting'; salinanKerjaId: string | null; ajuan?: boolean }
  | { jenis: 'menungguReview'; revisi: RingkasanRevisi; bolehTarik: boolean }
  | { jenis: 'terkunci'; alasan: string }
  | { jenis: 'sampah'; bolehPulihkan: boolean; alasan: string | null };

export function keadaanSunting(entri: EntriSunting, pelaku: Pelaku): KeadaanSunting {
  const keadaan = keadaanSampah(entri);
  if (keadaan.diSampah) {
    const boleh = bolehPulihkanEntri({ ...keadaan, peran: pelaku.peran, pelakuId: pelaku.userId });
    return { jenis: 'sampah', bolehPulihkan: boleh.ok, alasan: boleh.ok ? null : boleh.galat };
  }
  const terakhir = revisiTerakhir(entri.semuaRevisi);
  if (terakhir?.status === 'diajukan') {
    // [K2] pembuat menyunting ajuannya langsung (tetap di antrean). Admin yang memeriksa ajuan orang lain tetap melihat
    // kartu review, bukan form.
    if (!terakhir.hapus && terakhir.dibuatOleh === pelaku.userId
        && bolehPerbaruiAjuan({ peran: pelaku.peran, pelakuId: pelaku.userId, pembuatId: terakhir.dibuatOleh, status: 'diajukan' })) {
      return { jenis: 'sunting', salinanKerjaId: terakhir.id, ajuan: true };
    }
    const bolehTarik = transisiRevisi({ peran: pelaku.peran, pelakuId: pelaku.userId, pembuatId: terakhir.dibuatOleh, status: 'diajukan', aksi: 'tarik' }).ok;
    return { jenis: 'menungguReview', revisi: terakhir, bolehTarik };
  }
  if (pelaku.peran === 'reviewer') return { jenis: 'terkunci', alasan: 'Reviewer hanya membaca; periksa perubahan lewat Antrean review.' };
  if (terakhir?.status === 'draf') {
    const milikSaya = bolehSuntingDraf({ peran: pelaku.peran, pelakuId: pelaku.userId, pembuatId: terakhir.dibuatOleh, status: 'draf' });
    return milikSaya
      ? { jenis: 'sunting', salinanKerjaId: terakhir.id }
      : { jenis: 'terkunci', alasan: `Sedang disunting oleh ${pelaku.namaDari(terakhir.dibuatOleh)} (belum dikirim).` };
  }
  return { jenis: 'sunting', salinanKerjaId: null };
}

export function keadaanSampah(entri: EntriSunting): KeadaanSampah {
  return {
    pernahTerbit: !!entri.revisiTerbitId, diSampah: entri.dibuang || entri.dihapus,
    buangSedangDiajukan: entri.semuaRevisi.some(r => r.hapus && r.status === 'diajukan'),
    pembuatRevisi: entri.semuaRevisi.map(r => r.dibuatOleh),
  };
}

export function caraBuang(entri: EntriSunting, pelaku: Pelaku) {
  return caraBuangEntri({ ...keadaanSampah(entri), peran: pelaku.peran, pelakuId: pelaku.userId });
}

/** Revisi yang isinya dimuat ke form: salinan kerja/pengajuan terakhir bila ada, selain itu versi yang tayang
 * (bisa berbeda dari revisi terakhir sesudah rollback), atau revisi terakhir (dikembalikan). */
export function revisiBasis(entri: EntriSunting): RingkasanRevisi | null {
  const terakhir = revisiTerakhir(entri.semuaRevisi);
  // Revisi dikembalikan yang dibuang: mulai dari versi tayang (atau isi terakhir bila belum pernah tayang).
  if (terakhir?.diabaikan) return entri.semuaRevisi.find(r => r.id === entri.revisiTerbitId) ?? terakhir;
  if (terakhir?.status === 'disetujui') return entri.semuaRevisi.find(r => r.id === entri.revisiTerbitId) ?? terakhir;
  if (terakhir?.hapus && terakhir.status === 'dikembalikan') {
    // Pengajuan ke Sampah yang ditolak/ditarik: isinya salinan versi tayang, jadi mulai dari versi tayang.
    return entri.semuaRevisi.find(r => r.id === entri.revisiTerbitId) ?? terakhir;
  }
  return terakhir;
}

export function teksTayang(entri: EntriSunting, sekarangRelatif: (iso: string) => string): string {
  if (entri.dibuang) return 'Di Sampah · belum pernah tayang di web';
  if (entri.dihapus) return 'Di Sampah · tidak tampil di web';
  if (entri.diarsipkan) return 'Diarsipkan · tidak tampil di web';
  const terbit = entri.semuaRevisi.find(r => r.id === entri.revisiTerbitId);
  if (!terbit) return 'Belum pernah tayang di web';
  const sejak = terbit.diperiksaPada ?? terbit.dibuatPada;
  return `Tayang di web · disetujui ${sekarangRelatif(sejak)}`;
}

/** Revisi terbaru. Urutan dari daftarRevisi (urut dibuat_pada) dipakai apa adanya. */
export const revisiTerakhir = (daftar: RingkasanRevisi[]): RingkasanRevisi | null => daftar.at(-1) ?? null;
