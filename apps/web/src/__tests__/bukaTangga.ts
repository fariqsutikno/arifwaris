// Bantuan tes: menaiki tangga bantuan sampai semua kolom terbuka (pengganti "Lihat jawaban" yang lama).
// Tangga baru muncul setelah usaha, jadi isi dulu semua pilihan dengan 'Terhalang' (salah) dan Periksa dua kali.

import { fireEvent, screen, within } from '@testing-library/react';

const klik = (nama: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nama }));

/** Dari tabel kosong sampai semua kolom terbuka; menyetujui dialog "hangus" bila muncul (soal dengan XP yang masih bisa hangus). */
export function bukaSemuaKolomLewatTangga(): void {
  for (const pilihan of screen.getAllByRole('combobox')) fireEvent.change(pilihan, { target: { value: 'Terhalang' } });
  klik('Periksa'); klik('Periksa');
  naikiTanggaSampaiBukaKolom();
  klik('Buka semua kolom');
}

/** Dari tautan "Butuh petunjuk?" sampai jawaban satu kolom dibuka. */
export function naikiTanggaSampaiBukaKolom(): void {
  klik('Butuh petunjuk?');
  klik(/Petunjuk berikutnya/);
  klik(/Tunjukkan jawaban kolom/);
  const dialog = screen.queryByRole('alertdialog');
  if (!dialog) return;
  fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'hangus' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Buka jawaban' }));
}
