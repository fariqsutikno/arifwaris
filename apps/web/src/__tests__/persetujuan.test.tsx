// UU PDP dasar (G3): dialog persetujuan sekali per versi, papan opt-in lewat tautan teks, halaman kebijakan, unduh dan hapus akun.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna, GALAT_AKUN_PENULIS } from '@waris/data';
import { DialogPersetujuan } from '../akun/DialogPersetujuan';
import { ModalProfil } from '../akun/ModalProfil';
import { perluSetujuKebijakan, VERSI_KEBIJAKAN_PRIVASI } from '../akun/persetujuan';
import { Peringkat } from '../layar/Peringkat';
import { Privasi } from '../layar/Privasi';
import { Syarat } from '../layar/Syarat';

const SESI = { userId: 'a', email: 'umar@tes.local', nama: 'Umar bin Khattab' };
const siapkan = () => buatMemoriPengguna(buatMemori({ sesi: SESI }));
const repoDari = (repo: ReturnType<typeof siapkan>) => ({ ...repo }) as never;

test('perluSetujuKebijakan: belum pernah, versi lama, atau ditarik → perlu; versi terkini → tidak', () => {
  expect(perluSetujuKebijakan([])).toBe(true);
  expect(perluSetujuKebijakan([{ jenis: 'kebijakan_privasi', versi: VERSI_KEBIJAKAN_PRIVASI - 1, setuju: true }])).toBe(true);
  expect(perluSetujuKebijakan([{ jenis: 'kebijakan_privasi', versi: VERSI_KEBIJAKAN_PRIVASI, setuju: false }])).toBe(true);
  expect(perluSetujuKebijakan([{ jenis: 'kebijakan_privasi', versi: VERSI_KEBIJAKAN_PRIVASI, setuju: true }])).toBe(false);
});

test('dialog persetujuan: Setuju merekam versi kebijakan; tolak = keluar', async () => {
  const repo = siapkan();
  const saatSetuju = vi.fn(), saatKeluar = vi.fn();
  render(<DialogPersetujuan repo={repoDari(repo)} saatSetuju={saatSetuju} saatKeluar={saatKeluar} />);
  expect(screen.getByRole('link', { name: /baca kebijakan lengkap/i }).getAttribute('href')).toBe('#/privasi');
  expect(screen.getByRole('link', { name: /baca syarat layanan/i }).getAttribute('href')).toBe('#/syarat');
  fireEvent.click(screen.getByRole('button', { name: /tidak setuju, keluar/i }));
  expect(saatKeluar).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /^setuju$/i }));
  await waitFor(() => expect(saatSetuju).toHaveBeenCalled());
  expect(await repo.pengguna.bacaPersetujuan()).toEqual([{ jenis: 'kebijakan_privasi', versi: VERSI_KEBIJAKAN_PRIVASI, setuju: true }]);
});

test('halaman kebijakan memuat semua butir dan dan kontak', () => {
  render(<Privasi />);
  for (const judul of [/data yang kami simpan/i, /untuk apa/i, /berapa lama/i, /di mana data disimpan/i, /pihak yang memproses/i, /hakmu/i, /kontak pengendali data/i]) {
    expect(screen.getByRole('heading', { name: judul })).toBeTruthy();
  }
});

test('halaman syarat layanan memuat semua butir', () => {
  render(<Syarat />);
  for (const judul of [/hasil hitung bukan fatwa/i, /pemakaian yang wajar/i, /masa beta/i, /hukum dan sengketa/i]) {
    expect(screen.getByRole('heading', { name: judul })).toBeTruthy();
  }
});

test('papan: tautan teks mengajak ikut, mencatat persetujuan; tautan sembunyikan menariknya', async () => {
  const repo = siapkan();
  repo.aturPeringkat({ ringkasan: { xpTotal: 0, xpMingguIni: 0, streakSekarang: 0, streakTerpanjang: 0, aktifHariIni: false }, papan: { minggu: [], semua: [] } });
  render(<Peringkat sesi={SESI} repo={repoDari(repo)} />);
  const ikut = await screen.findByRole('button', { name: /tampilkan namaku di papan/i });
  expect(ikut.className).toContain('tautan-teks');
  fireEvent.click(ikut);
  fireEvent.click(await screen.findByRole('button', { name: /sembunyikan namaku dari papan/i }));
  await waitFor(async () => expect((await repo.pengguna.bacaPersetujuan()).at(-1)).toMatchObject({ jenis: 'papan_peringkat', setuju: false }));
});

test('profil: unduh data berupa berkas JSON; hapus akun minta mengetik kalimat, lalu menghapus', async () => {
  const repo = siapkan();
  const unduh = vi.spyOn(repo.pengguna, 'unduhDataSaya');
  const hapus = vi.spyOn(repo.pengguna, 'hapusAkun');
  URL.createObjectURL = vi.fn(() => 'blob:uji');
  URL.revokeObjectURL = vi.fn();
  const klik = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  render(<ModalProfil sesi={SESI} repo={repoDari(repo)} saatTutup={() => undefined} saatTersimpan={() => undefined} />);
  fireEvent.click(await screen.findByRole('button', { name: /unduh dataku/i }));
  await waitFor(() => expect(klik).toHaveBeenCalled());
  expect(unduh).toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /^hapus akun$/i }));
  const lanjut = screen.getAllByRole('button', { name: /^hapus akun$/i }).at(-1) as HTMLButtonElement;
  expect(lanjut.disabled).toBe(true);
  fireEvent.change(screen.getByRole('textbox', { name: /ketik/i }), { target: { value: 'hapus akunku' } });
  expect(lanjut.disabled).toBe(false);
  hapus.mockRejectedValueOnce(new Error(GALAT_AKUN_PENULIS));
  fireEvent.click(lanjut);
  expect(await screen.findByText(/akun penulis tidak bisa dihapus sendiri/i)).toBeTruthy();
});

test('kebijakan v2 (S9): akun yang menyetujui v1 diminta setuju ulang; halaman menyebut simpan otomatis di perangkat, retensi 30 hari, dan Hapus kasus ini', () => {
  expect(VERSI_KEBIJAKAN_PRIVASI).toBe(6);
  expect(perluSetujuKebijakan([{ jenis: 'kebijakan_privasi', versi: 5, setuju: true }])).toBe(true);
  render(<Privasi />);
  const teks = document.body.textContent ?? '';
  expect(teks).toMatch(/tersimpan otomatis di perangkat ini/);
  expect(teks).toMatch(/tidak dikirim ke server kecuali kamu masuk/);
  expect(teks).toMatch(/tidak dibuka 30 hari dihapus otomatis/);
  expect(teks).toMatch(/Isian soal latihan yang belum selesai tetap tersimpan di perangkat ini/);
  expect(teks).toMatch(/Hapus kasus ini/);
});

test('ringkasan dialog persetujuan menyebut kasus ikut tersimpan di akun', () => {
  render(<DialogPersetujuan repo={repoDari(siapkan())} saatSetuju={() => undefined} saatKeluar={() => undefined} />);
  expect(document.body.textContent).toMatch(/Kasus hitunganmu ikut tersimpan di akun/);
});
