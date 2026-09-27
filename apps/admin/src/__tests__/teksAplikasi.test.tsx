// Tes EditorTeksAplikasi lewat kotak "Cari teks" (jsdom tidak punya tata letak, jadi kotak di atas layar tidak diuji):
// cari → sunting → admin menerbitkan teks edukasi langsung.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { KonteksRepo } from '../repo';
import { EditorTeksAplikasi } from '../layar/EditorTeksAplikasi';

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
