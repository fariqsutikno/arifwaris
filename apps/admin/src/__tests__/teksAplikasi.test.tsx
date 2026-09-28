// Tes EditorTeksAplikasi lewat kotak "Cari teks" (jsdom tidak punya tata letak, jadi kotak di atas layar tidak diuji):
// cari → sunting → admin menerbitkan teks edukasi langsung.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { KonteksRepo } from '../repo';
import { EditorTeksAplikasi } from '../layar/EditorTeksAplikasi';
import { layarWeb } from './layarWeb';

test('cari teks → sunting → Simpan & terbitkan membuat revisi terbit', async () => {
  const m = buatMemori({ refs: [], sesi: { userId: 'u-a', email: 'a@x.id' }, peran: { 'u-a': 'admin' } });
  const entriId = await m.editorial.buatEntri('teks_edukasi', 'harta.kendaraan', 10);
  await m.editorial.terbitkanLangsung(await m.editorial.buatDraf(entriId, 'teks_edukasi', { id: 'Kendaraan' }, []));
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u-a', email: 'a@x.id' }, peran: 'admin' }}>
      <EditorTeksAplikasi />
    </KonteksRepo.Provider>,
  );
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'kendaraan' } });
  fireEvent.click((await screen.findAllByRole('button', { name: /^Kendaraan\s*Langkah harta$/ }))[0]!);
  fireEvent.change(await screen.findByLabelText('Bahasa Indonesia'), { target: { value: 'Kendaraan bermotor' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & terbitkan' }));
  await waitFor(async () => {
    const [entri] = await m.konten.daftarEntri('teks_edukasi');
    expect(entri!.revisiTerakhir).toMatchObject({ status: 'disetujui', isi: { id: 'Kendaraan bermotor' } });
  });
});

function pasang(m: ReturnType<typeof buatMemori>, sesi: { userId: string; email: string }, peran: 'admin' | 'penulis') {
  return render(
    <KonteksRepo.Provider value={{ repo: m, sesi, peran }}>
      <EditorTeksAplikasi />
    </KonteksRepo.Provider>,
  );
}

async function sunting(cari: string, pilihan: RegExp, teksBaru: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: cari } });
  fireEvent.click((await screen.findAllByRole('button', { name: pilihan }))[0]!);
  fireEvent.change(await screen.findByLabelText('Bahasa Indonesia'), { target: { value: teksBaru } });
}

test('admin: diksi langsung terbit; layar web dipasang ulang dengan teks baru dan teks baru bisa dicari', async () => {
  const ADMIN = { userId: 'u-a', email: 'a@x.id' };
  const m = buatMemori({ refs: [], sesi: ADMIN, peran: { 'u-a': 'admin' } });
  await m.diksi.buatKunci('beranda.mulai_hitung', 'beranda');
  await m.diksi.terbitkanLangsung(await m.diksi.buatDraf('beranda.mulai_hitung', 'Mulai hitung', null, null));
  pasang(m, ADMIN, 'admin');
  await sunting('mulai hitung', /^Mulai hitung\s*Beranda$/, 'Hitung sekarang');
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & terbitkan' }));
  await waitFor(async () => expect((await m.diksi.bacaTerbit()).find(d => d.kunci === 'beranda.mulai_hitung')?.id).toBe('Hitung sekarang'));
  expect(await layarWeb().findByText(/Hitung sekarang/, { selector: '.aksi-status' })).toBeTruthy();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'hitung sekarang' } });
  expect(await screen.findAllByRole('button', { name: /^Hitung sekarang\s*Beranda$/ })).not.toHaveLength(0);
});

test('penulis: ajuan yang menunggu bisa disunting di tempat dan tetap di antrean', async () => {
  const PENULIS = { userId: 'u-p', email: 'p@x.id' };
  const m = buatMemori({ refs: [], sesi: PENULIS, peran: { 'u-p': 'penulis' } });
  await m.diksi.buatKunci('beranda.mulai_hitung', 'beranda');
  const ajuan = await m.diksi.buatDraf('beranda.mulai_hitung', 'Mulai menghitung', null, null);
  await m.diksi.ajukan(ajuan);
  pasang(m, PENULIS, 'penulis');
  await sunting('mulai menghitung', /^Mulai menghitung\s*Beranda$/, 'Ayo hitung');
  fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan ajuan' }));
  await waitFor(async () => expect(await m.diksi.antreanReview()).toMatchObject([{ id: ajuan, idTeks: 'Ayo hitung', status: 'diajukan' }]));
});
