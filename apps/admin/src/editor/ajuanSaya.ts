// Menu "Ajuan saya" (putaran 2 A5), murni: menerima revisi konten & teks aplikasi milik pengguna (repo.revisiSaya);
// memutuskan satu butir per entri/teks (revisi terbarunya saja, jadi ajuan yang sudah diperbaiki tidak muncul lagi di
// "Perlu diperbaiki"), tab tempatnya, dan jumlah kabar baru (dikembalikan/disetujui sejak menu terakhir dibuka).
// Terbitan langsung admin (pemeriksa = pembuat) bukan hasil review, jadi tidak ditampilkan.
import type { AjuanKonten, RingkasanRevisiDiksi } from '@waris/data';
import { LABEL_ISI } from '../navigasi';
import { judulEntri } from '../ringkas';

export type TabAjuan = 'perbaiki' | 'menunggu' | 'disetujui';
export const TAB_AJUAN: readonly TabAjuan[] = ['perbaiki', 'menunggu', 'disetujui'];
export const LABEL_TAB_AJUAN: Record<TabAjuan, string> = { perbaiki: 'Perlu diperbaiki', menunggu: 'Menunggu review', disetujui: 'Disetujui' };

export interface ButirAjuan {
  id: string; tab: TabAjuan; jenis: string; judul: string; catatan: string | null; pemeriksa: string | null;
  /** Waktu kabar: saat diperiksa, atau saat dikirim bila masih menunggu. */
  waktu: string;
  tujuan: { entriId: string } | { kunciTeks: string; id: string; ar: string | null };
}

const TAB_DARI_STATUS = { dikembalikan: 'perbaiki', diajukan: 'menunggu', disetujui: 'disetujui' } as const;

export function susunAjuan(konten: readonly AjuanKonten[], diksi: readonly RingkasanRevisiDiksi[]): ButirAjuan[] {
  const dariKonten = terbaruPer(konten, r => r.entriId).filter(r => !r.diabaikan).filter(bukanTerbitSendiri).flatMap((r): ButirAjuan[] => (r.status === 'draf' ? [] : [{
    id: r.id, tab: TAB_DARI_STATUS[r.status], jenis: r.hapus ? `${LABEL_ISI[r.jenis]} · ke Sampah` : LABEL_ISI[r.jenis],
    judul: judulEntri({ slug: r.slug, revisiTerakhir: r }), catatan: r.catatanReview, pemeriksa: r.diperiksaOleh,
    waktu: r.diperiksaPada ?? r.dibuatPada, tujuan: { entriId: r.entriId },
  }]));
  const dariDiksi = terbaruPer(diksi, r => r.kunci).filter(r => !r.diabaikan).filter(bukanTerbitSendiri).flatMap((r): ButirAjuan[] => (r.status === 'draf' ? [] : [{
    id: r.id, tab: TAB_DARI_STATUS[r.status], jenis: 'Teks aplikasi', judul: r.idTeks, catatan: r.catatanReview, pemeriksa: r.diperiksaOleh,
    waktu: r.diperiksaPada ?? r.dibuatPada, tujuan: { kunciTeks: r.kunci, id: r.idTeks, ar: r.arTeks },
  }]));
  return [...dariKonten, ...dariDiksi].sort((a, b) => b.waktu.localeCompare(a.waktu));
}

/** Kabar baru = dikembalikan/disetujui setelah `terakhirDibuka`. Belum pernah dibuka: hanya yang perlu diperbaiki. */
export function jumlahKabarBaru(daftar: readonly ButirAjuan[], terakhirDibuka: string | null): number {
  return daftar.filter(butir => (terakhirDibuka === null
    ? butir.tab === 'perbaiki'
    : butir.tab !== 'menunggu' && butir.waktu > terakhirDibuka)).length;
}

// Waktu menu terakhir dibuka disimpan per perangkat (tanpa tabel notifikasi). Penyimpanan bisa gagal (mode privat).
const KUNCI_DIBUKA = 'portal.ajuanSaya.dibuka';
export function bacaTerakhirDibuka(): string | null {
  try { return localStorage.getItem(KUNCI_DIBUKA); } catch { return null; }
}
export function catatDibuka(waktu: string): void {
  try { localStorage.setItem(KUNCI_DIBUKA, waktu); } catch { /* badge tetap tampil; tidak mengganggu */ }
}

const bukanTerbitSendiri = (r: { status: string; diperiksaOleh: string | null; dibuatOleh: string }) =>
  !(r.status === 'disetujui' && r.diperiksaOleh === r.dibuatOleh);

/** Input dari repo sudah urut terbaru dulu; yang pertama per kunci = revisi terbaru. */
function terbaruPer<T>(daftar: readonly T[], kunci: (butir: T) => string): T[] {
  const sudah = new Set<string>();
  return daftar.filter(butir => !sudah.has(kunci(butir)) && !!sudah.add(kunci(butir)));
}
