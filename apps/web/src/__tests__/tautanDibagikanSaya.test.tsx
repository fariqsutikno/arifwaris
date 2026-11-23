import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { DaftarTautanDibagikan } from '../akun/TautanDibagikanSaya';
import { sudahDibagikan, tandaiDibagikan } from '../bagikanLokal';

const siapkan = () => buatMemoriPengguna(buatMemori({ sesi: { userId: 'a', email: 'a@tes.local' } })).bagikan;
beforeEach(() => localStorage.clear());

test('tanpa tautan aktif (atau hanya privat) bagian tidak dirender', async () => {
  const repo = siapkan();
  await repo.simpan('r1', { slug: 'privat0a1b2c3d4e', akses: 'privat', email: [] }, {});
  const { container } = render(<DaftarTautanDibagikan repo={repo} />);
  await waitFor(() => expect(container.innerHTML).toBe(''));
});

test('menampilkan tautan aktif dengan Buka; Hentikan menghapus di server dan penanda lokal', async () => {
  const repo = siapkan();
  await repo.simpan('r1', { slug: 'umum0a1b2c3d4e5f', akses: 'tautan', email: [] }, {});
  tandaiDibagikan('r1', true);
  render(<DaftarTautanDibagikan repo={repo} />);
  expect((await screen.findByRole('link', { name: 'Buka' })).getAttribute('href')).toBe('#/k/umum0a1b2c3d4e5f');
  fireEvent.click(screen.getByRole('button', { name: 'Hentikan' }));
  await waitFor(() => expect(screen.queryByText('umum0a1b2c3d4e5f')).toBeNull());
  expect(await repo.bacaPengaturan('r1')).toBeNull();
  expect(sudahDibagikan('r1')).toBe(false);
});
