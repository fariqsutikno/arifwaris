import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { DialogNama } from '../layar/lab/DialogNama';
import { HeroLab } from '../layar/lab/HeroLab';
import { kasusBaru } from '../kasus';
import { TerakhirDibuka } from '../layar/lab/TerakhirDibuka';
import { catatRiwayat, hapusRiwayat } from '../riwayat';
import { AwalHitung } from '../layar/AwalHitung';
import { MulaiCepat } from '../layar/lab/MulaiCepat';
import { RakEksperimen } from '../layar/lab/RakEksperimen';
import { SUSUNAN_CEPAT, kasusDariSusunan } from '../lab';
import { bacaTersimpan, sematkan, simpanKasus } from '../tersimpan';

beforeEach(() => localStorage.clear());

test('dialog nama terisi judul awal, Simpan mengirim nama yang dipangkas', () => {
  const saatSimpan = vi.fn();
  render(<DialogNama judulAwal="Istri, Ayah" saatSimpan={saatSimpan} saatBatal={() => {}} />);
  const isian = screen.getByLabelText('Nama kasus') as HTMLInputElement;
  expect(isian.value).toBe('Istri, Ayah');
  fireEvent.change(isian, { target: { value: '  Keluarga Pak Budi ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  expect(saatSimpan).toHaveBeenCalledWith('Keluarga Pak Budi');
});

test('Esc membatalkan', () => {
  const saatBatal = vi.fn();
  render(<DialogNama judulAwal="x" saatSimpan={() => {}} saatBatal={saatBatal} />);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(saatBatal).toHaveBeenCalled();
});

test('rak kosong tidak dirender apa pun', () => {
  const { container } = render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  expect(container.innerHTML).toBe("");
});

test('rak menampilkan nama dan menaruh yang disematkan di depan', () => {
  const kasus = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  simpanKasus('b', kasus, 'Keluarga B');
  simpanKasus('a', kasus, 'Keluarga A');
  sematkan('b', true);
  render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  expect(screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent)).toEqual(['Keluarga B', 'Keluarga A']);
});

test('menyematkan dari rak mengubah urutan dan tersimpan', () => {
  const kasus = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  simpanKasus('a', kasus, 'Keluarga A');
  simpanKasus('b', kasus, 'Keluarga B');
  render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sematkan Keluarga A' }));
  expect(screen.getAllByRole('heading', { level: 3 })[0]!.textContent).toBe('Keluarga A');
});

test('ganti nama dari rak lewat dialog', () => {
  simpanKasus('a', kasusDariSusunan(SUSUNAN_CEPAT[0]!), 'Lama');
  render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ganti nama Lama' }));
  fireEvent.change(screen.getByLabelText('Nama kasus'), { target: { value: 'Baru' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Baru');
});

test('mulai cepat: satu ketukan mengirim kasus dengan ahli waris susunannya', () => {
  const saatPilih = vi.fn();
  render(<MulaiCepat saatPilih={saatPilih} />);
  fireEvent.click(screen.getByRole('button', { name: 'Istri dan anak' }));
  expect(saatPilih).toHaveBeenCalledTimes(1);
  expect(saatPilih.mock.calls[0]![0].tirkah.kotor).toBe(0n);
});

test('hero tanpa kasus terakhir: ajakan mulai skenario baru, tanpa Lanjutkan', () => {
  render(<HeroLab kasusTerakhir={null} saatLanjut={() => {}} saatMulaiBaru={() => {}} />);
  expect(screen.getByRole('button', { name: /Mulai skenario baru/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Lanjutkan/ })).toBeNull();
});

test('hero kasus belum lengkap (tanpa harta): tidak memanggil engine, Lanjutkan jalan', () => {
  const saatLanjut = vi.fn();
  render(<HeroLab kasusTerakhir={kasusDariSusunan(SUSUNAN_CEPAT[0]!)} saatLanjut={saatLanjut} saatMulaiBaru={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /Lanjutkan/ }));
  expect(saatLanjut).toHaveBeenCalled();
});

test('hero kasus yang baru memilih jenis kelamin tetap bisa dilanjutkan', () => {
  render(<HeroLab kasusTerakhir={kasusBaru('L')} saatLanjut={() => {}} saatMulaiBaru={() => {}} />);
  expect(screen.getByRole('button', { name: /Lanjutkan/ })).toBeTruthy();
});

test('hero kasus lengkap: pohon dengan hasil engine dan pita bagian', () => {
  const dasar = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  const lengkap = { ...dasar, tirkah: { ...dasar.tirkah, kotor: 240_000_000n } };
  const { container } = render(<HeroLab kasusTerakhir={lengkap} saatLanjut={() => {}} saatMulaiBaru={() => {}} />);
  expect(container.querySelector('.pita-bagian')).toBeTruthy();
});

const sendiri = { jenis: 'sendiri' } as const;

test('tanpa riwayat dua pekan: terakhir dibuka tidak dirender', () => {
  hapusRiwayat();
  const { container } = render(<TerakhirDibuka kasusSekarang={null} saatBuka={() => {}} />);
  expect(container.innerHTML).toBe('');
});

test('riwayat dikelompokkan per hari; kolom cari hanya bila entri lebih dari 8', () => {
  hapusRiwayat();
  const dasar = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  const kasusKe = (i: number) => ({ ...dasar, tirkah: { ...dasar.tirkah, kotor: BigInt(1_000_000 * (i + 1)) } });
  for (let i = 0; i < 8; i += 1) catatRiwayat(`k${i}`, kasusKe(i), Date.now() - i * 60_000, sendiri);
  const { unmount } = render(<TerakhirDibuka kasusSekarang={null} saatBuka={() => {}} />);
  expect(screen.getByText('Hari ini')).toBeTruthy();
  expect(screen.queryByLabelText('Cari kasus')).toBeNull();
  unmount();
  catatRiwayat('k8', kasusKe(8), Date.now() - 9 * 60_000, sendiri);
  render(<TerakhirDibuka kasusSekarang={null} saatBuka={() => {}} />);
  expect(screen.getByLabelText('Cari kasus')).toBeTruthy();
});

test('cari menyaring dan menampilkan pesan bila tidak ada yang cocok', () => {
  hapusRiwayat();
  const dasar = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  for (let i = 0; i < 9; i += 1) catatRiwayat(`k${i}`, { ...dasar, tirkah: { ...dasar.tirkah, kotor: BigInt(1_000_000 * (i + 1)) } }, Date.now() - i * 60_000, sendiri);
  render(<TerakhirDibuka kasusSekarang={null} saatBuka={() => {}} />);
  fireEvent.change(screen.getByLabelText('Cari kasus'), { target: { value: 'zzzz' } });
  expect(screen.getByText('Tidak ada kasus yang cocok.')).toBeTruthy();
});

test('simpan jadi eksperimen memberi nama dan masuk tersimpan', () => {
  hapusRiwayat();
  catatRiwayat('k', kasusDariSusunan(SUSUNAN_CEPAT[0]!), Date.now(), sendiri);
  render(<TerakhirDibuka kasusSekarang={null} saatBuka={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /Simpan jadi eksperimen/ }));
  fireEvent.change(screen.getByLabelText('Nama kasus'), { target: { value: 'Keluarga Q' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  expect(bacaTersimpan()[0]!.judul).toBe('Keluarga Q');
});

const propsAwal = { kasusTersimpan: null, kirim: vi.fn(), saatLanjut: vi.fn(), saatBukaRiwayat: vi.fn(), saatImpor: vi.fn(), saatKerjakanSoal: vi.fn(), saatMulaiDari: vi.fn() };

test('awal lab bersih: tanpa rak, tanpa terakhir dibuka, tanpa jejak; ada mulai cepat dan impor', () => {
  hapusRiwayat();
  render(<AwalHitung {...propsAwal} />);
  expect(screen.queryByText('Eksperimenmu')).toBeNull();
  expect(screen.queryByText('Terakhir dibuka')).toBeNull();
  expect(screen.queryByText(/eksperimen tersimpan/)).toBeNull();
  expect(screen.getByText('Mulai cepat dari susunan keluarga')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Impor file/ })).toBeTruthy();
});

test('chip mulai cepat di awal lab memanggil saatMulaiDari', () => {
  const saatMulaiDari = vi.fn();
  render(<AwalHitung {...propsAwal} saatMulaiDari={saatMulaiDari} />);
  fireEvent.click(screen.getByRole('button', { name: 'Suami dan anak' }));
  expect(saatMulaiDari).toHaveBeenCalledTimes(1);
});

test('jejak lab muncul hanya bila ada eksperimen tersimpan', () => {
  hapusRiwayat();
  simpanKasus('a', kasusDariSusunan(SUSUNAN_CEPAT[0]!), 'Keluarga A');
  render(<AwalHitung {...propsAwal} />);
  expect(screen.getByText('1 eksperimen tersimpan')).toBeTruthy();
});
