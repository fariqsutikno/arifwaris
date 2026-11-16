// Tes layar Penjelasan hasil: daftar templat narasi per tahap tanpa kunci teknis, sisipan berlabel manusiawi, dan
// suntingan yang merusak sisipan ditolak sebelum disimpan (jalur simpan = dialog sunting yang sama dengan Teks aplikasi).
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { KonteksRepo } from '../repo';
import { PenjelasanHasil } from '../layar/PenjelasanHasil';

const ADMIN = { userId: 'u-a', email: 'a@x.id' };
const TEMPLAT = 'Harta {pewaris} setelah {tirkah} dibagi untuk {siapa}.';

async function siapkan() {
  const m = buatMemori({ refs: [], sesi: ADMIN, peran: { 'u-a': 'admin' } });
  for (const [kunci, id] of [['narasi.cerita.harta.pembuka', TEMPLAT], ['narasi.taqdir.judul.apa_yang_terjadi', 'Apa yang terjadi'], ['narasi.arab.langkah', 'خطوة']] as const) {
    await m.diksi.buatKunci(kunci, 'narasi');
    await m.diksi.terbitkanLangsung(await m.diksi.buatDraf(kunci, id, null, null));
  }
  render(<KonteksRepo.Provider value={{ repo: m, sesi: ADMIN, peran: 'admin' }}><PenjelasanHasil /></KonteksRepo.Provider>);
  return m;
}

test('daftar per tahap berjudul manusiawi, Arab terpisah, tanpa kunci; sisipan jadi label', async () => {
  await siapkan();
  await screen.findByText('Harta (1)');
  for (const judul of ['Kemungkinan (janin/hilang/khuntsa) (1)', 'Bahasa Arab (1)']) expect(screen.getByText(judul)).toBeTruthy();
  expect(screen.queryByText(/narasi\./)).toBeNull();
  const butir = screen.getByRole('article', { name: TEMPLAT });
  expect(within(butir).getByText('nama almarhum')).toBeTruthy();
  expect(within(butir).getByText('nama orang')).toBeTruthy();
  expect(within(butir).getAllByText('rujukan')).toHaveLength(1);
  expect(butir.textContent).not.toMatch(/[{}]/);
});

test('sunting: sisipan yang hilang ditolak dengan nama manusiawi, "Sisipkan" memulihkan, lalu terbit', async () => {
  const m = await siapkan();
  fireEvent.click(within(await screen.findByRole('article', { name: TEMPLAT })).getByRole('button', { name: 'Sunting' }));
  const kolom = await screen.findByLabelText('Bahasa Indonesia');
  fireEvent.change(kolom, { target: { value: 'Harta {tirkah} dibagi untuk {siapa}.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & terbitkan' }));
  expect((await screen.findByRole('alert')).textContent).toMatch(/hilang: nama almarhum/);
  expect((await m.diksi.daftarKunci()).find(k => k.kunci === 'narasi.cerita.harta.pembuka')!.revisiTerakhir!.idTeks).toBe(TEMPLAT);
  fireEvent.click(screen.getByRole('button', { name: 'nama almarhum' }));
  expect((kolom as HTMLTextAreaElement).value).toBe('Harta {tirkah} dibagi untuk {siapa}. {pewaris}');
  expect(screen.getByText('Pratinjau:', { exact: false }).parentElement!.textContent).toContain('Budi');
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & terbitkan' }));
  await waitFor(async () => expect((await m.diksi.bacaTerbit()).find(t => t.kunci === 'narasi.cerita.harta.pembuka')?.id)
    .toBe('Harta {tirkah} dibagi untuk {siapa}. {pewaris}'));
});
