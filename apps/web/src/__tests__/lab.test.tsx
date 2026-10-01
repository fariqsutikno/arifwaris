import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { kasusBaru } from '../kasus';
import { SUSUNAN_CEPAT, kasusDariSusunan } from '../lab';
import { AwalHitung } from '../layar/AwalHitung';
import { DaftarKasus } from '../layar/lab/DaftarKasus';
import { DialogNama } from '../layar/lab/DialogNama';
import { HeroLab } from '../layar/lab/HeroLab';
import { HalamanRiwayat } from '../layar/Riwayat';
import { catatRiwayat, hapusRiwayat } from '../riwayat';
import { bacaTersimpan, simpanKasus } from '../tersimpan';

const sendiri = { jenis: 'sendiri' } as const;
const kasusKe = (i: number) => {
  const dasar = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: BigInt(1_000_000 * (i + 1)) } };
};
beforeEach(() => { localStorage.clear(); hapusRiwayat(); });

// ── dialog nama ──
test('dialog nama terisi judul awal, Simpan mengirim nama yang dipangkas', () => {
  const saatSimpan = vi.fn();
  render(<DialogNama judulAwal="Istri, Ayah" saatSimpan={saatSimpan} saatBatal={() => {}} />);
  const isian = screen.getByLabelText('Nama kasus') as HTMLInputElement;
  expect(isian.value).toBe('Istri, Ayah');
  fireEvent.change(isian, { target: { value: '  Keluarga Pak Budi ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  expect(saatSimpan).toHaveBeenCalledWith('Keluarga Pak Budi');
});

test('Esc membatalkan dialog nama', () => {
  const saatBatal = vi.fn();
  render(<DialogNama judulAwal="x" saatSimpan={() => {}} saatBatal={saatBatal} />);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(saatBatal).toHaveBeenCalled();
});

// ── hero ──
test('hero tanpa kasus terakhir: tidak dirender', () => {
  render(<HeroLab kasusTerakhir={null} saatLanjut={() => {}} />);
  expect(screen.queryByRole('button', { name: /Mulai skenario baru/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /Lanjutkan/ })).toBeNull();
});

test('hero kasus belum lengkap (tanpa harta): tidak memanggil engine, Lanjutkan jalan', () => {
  const saatLanjut = vi.fn();
  render(<HeroLab kasusTerakhir={kasusDariSusunan(SUSUNAN_CEPAT[0]!)} saatLanjut={saatLanjut} />);
  fireEvent.click(screen.getByRole('button', { name: /Lanjutkan/ }));
  expect(saatLanjut).toHaveBeenCalled();
});

test('hero kasus yang baru memilih jenis kelamin tetap bisa dilanjutkan', () => {
  render(<HeroLab kasusTerakhir={kasusBaru('L')} saatLanjut={() => {}} />);
  expect(screen.getByRole('button', { name: /Lanjutkan/ })).toBeTruthy();
});

test('hero kasus lengkap: pohon dengan hasil engine dan pita bagian', () => {
  const dasar = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  const { container } = render(<HeroLab kasusTerakhir={{ ...dasar, tirkah: { ...dasar.tirkah, kotor: 240_000_000n } }} saatLanjut={() => {}} />);
  expect(container.querySelector('.pita-bagian')).toBeTruthy();
});

// ── Kasusmu ──
test('Kasusmu tanpa kasus: ringkas tidak dirender, halaman penuh memberi petunjuk', () => {
  const { container, unmount } = render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} ringkas />);
  expect(container.innerHTML).toBe('');
  unmount();
  render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} />);
  expect(screen.getByText(/Belum ada kasus/)).toBeTruthy();
});

test('satu daftar: tersimpan (bernama) di depan, sementara sesudahnya, dengan status masing-masing', () => {
  catatRiwayat('s', kasusKe(0), Date.now(), sendiri);
  simpanKasus('t', kasusKe(1), 'Keluarga T');
  render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} ringkas />);
  expect(screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent)).toEqual(['Keluarga T', 'Istri, Anak laki-laki, Anak perempuan']);
  expect(screen.getByText('Tersimpan')).toBeTruthy();
  expect(screen.getByText(/Sementara · 30 hari lagi/)).toBeTruthy();
});

test('Simpan kasus sementara: beri nama lewat dialog, jadi tersimpan', () => {
  catatRiwayat('s', kasusKe(0), Date.now(), sendiri);
  render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} ringkas />);
  fireEvent.click(screen.getByRole('button', { name: /^Simpan Istri/ }));
  fireEvent.change(screen.getByLabelText('Nama kasus'), { target: { value: 'Keluarga Q' } });
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Simpan' }));
  expect(bacaTersimpan()[0]!.judul).toBe('Keluarga Q');
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Keluarga Q');
  expect(screen.getByText('Tersimpan')).toBeTruthy();
});

test('Ganti nama kasus tersimpan', () => {
  simpanKasus('t', kasusKe(0), 'Lama');
  render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} ringkas />);
  fireEvent.click(screen.getByRole('button', { name: 'Ganti nama Lama' }));
  fireEvent.change(screen.getByLabelText('Nama kasus'), { target: { value: 'Baru' } });
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Simpan' }));
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Baru');
});

test('Hapus kasus sementara dan tersimpan: ditanya dulu, lalu hilang dari semua penyimpanan', () => {
  catatRiwayat('s', kasusKe(0), Date.now(), sendiri);
  simpanKasus('t', kasusKe(1), 'Keluarga T');
  render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} ringkas />);
  fireEvent.click(screen.getByRole('button', { name: /^Hapus Keluarga T/ }));
  expect(screen.getByRole('alertdialog').textContent).toMatch(/akunmu/);
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Hapus' }));
  expect(bacaTersimpan()).toEqual([]);
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: /^Hapus Istri/ }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Hapus' }));
  expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
});

test('ringkas menampilkan 6 terbaru dan tautan ke semua bila lebih banyak', () => {
  for (let i = 0; i < 8; i += 1) catatRiwayat(`k${i}`, kasusKe(i), Date.now() - i * 60_000, sendiri);
  render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} ringkas />);
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
  expect(screen.getByRole('link', { name: /Lihat semua kasus \(8\)/ })).toBeTruthy();
});

test('halaman penuh: penyaring hanya bila dua jenis ada; cari hanya bila banyak; hapus semua sementara menyisakan tersimpan', () => {
  catatRiwayat('s', kasusKe(0), Date.now(), sendiri);
  const { unmount } = render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} />);
  expect(screen.queryByRole('group', { name: 'Kasusmu' })).toBeNull();
  unmount();
  simpanKasus('t', kasusKe(1), 'Keluarga T');
  render(<DaftarKasus kasusSekarang={null} saatBuka={() => {}} />);
  expect(screen.queryByLabelText('Cari kasus')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Tersimpan' }));
  expect(screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent)).toEqual(['Keluarga T']);
  fireEvent.click(screen.getByRole('button', { name: 'Hapus semua yang sementara' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Hapus semua' }));
  expect(screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent)).toEqual(['Keluarga T']);
  expect(screen.queryByRole('button', { name: 'Hapus semua yang sementara' })).toBeNull();
});

test('halaman penuh: cari muncul bila lebih dari 8 kasus dan menyaring', () => {
  for (let i = 0; i < 9; i += 1) catatRiwayat(`k${i}`, kasusKe(i), Date.now() - i * 60_000, sendiri);
  render(<HalamanRiwayat kasusSekarang={null} saatBuka={() => {}} />);
  fireEvent.change(screen.getByLabelText('Cari kasus'), { target: { value: 'zzzz' } });
  expect(screen.getByText('Tidak ada kasus yang cocok.')).toBeTruthy();
});

// ── Awal Lab ──
const propsAwal = { kasusTersimpan: null, kirim: vi.fn(), saatLanjut: vi.fn(), saatBukaRiwayat: vi.fn(), saatImpor: vi.fn(), saatKerjakanSoal: vi.fn(), saatMulaiDari: vi.fn() };

test('awal lab bersih: tiga bagian berbeda tujuan, tanpa Kasusmu, "Mulai dari nol" selalu ada', () => {
  render(<AwalHitung {...propsAwal} />);
  expect(screen.getByRole('heading', { name: 'Mulai kasus baru' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Berlatih dengan soal' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Kasusmu' })).toBeNull();
  expect(screen.getByRole('button', { name: /Mulai dari nol/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Impor file/ })).toBeTruthy();
});

test('ada kasus berjalan: muncul "Mulai dari nol" yang menegaskan kasusnya tetap ada', () => {
  const kirim = vi.fn();
  render(<AwalHitung {...propsAwal} kasusTersimpan={kasusKe(0)} kirim={kirim} />);
  const tombol = screen.getByRole('button', { name: /Mulai dari nol/ });
  expect(tombol.textContent).toMatch(/tetap ada di Kasusmu/);
  fireEvent.click(tombol);
  expect(kirim).toHaveBeenCalledWith({ jenis: 'ULANGI' });
});

test('chip susunan di awal lab memanggil saatMulaiDari', () => {
  const saatMulaiDari = vi.fn();
  render(<AwalHitung {...propsAwal} saatMulaiDari={saatMulaiDari} />);
  fireEvent.click(screen.getByRole('button', { name: /^Suami dan anak/ }));
  expect(saatMulaiDari).toHaveBeenCalledTimes(1);
});

test('Kasusmu muncul di awal lab hanya bila ada kasus', () => {
  simpanKasus('a', kasusKe(0), 'Keluarga A');
  render(<AwalHitung {...propsAwal} />);
  expect(screen.getByRole('heading', { name: 'Kasusmu' })).toBeTruthy();
});
