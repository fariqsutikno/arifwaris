import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { terapkanKeadaan } from '../keadaanOrang';
import { kalimatBabak, PeriksaCerita } from '../layar/PeriksaCerita';

function kasusBudiDenganDewi() {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const namai = (id: string, nama: string) => { kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [id]: { ...kasus.graf.orang[id]!, nama } } } }; };
  const siti = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && !o.idAyah)!.id;
  const budi = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'L' && o.idAyah)!.id;
  const rina = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && o.idAyah)!.id;
  namai('PEWARIS', 'Pak Ahmad'); namai(siti, 'Siti'); namai(budi, 'Budi'); namai(rina, 'Rina');
  kasus = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, budi, 'ISTRI') };
  const dewi = Object.keys(kasus.graf.orang).find(id => !kasus.graf.orang[id]!.nama && kasus.graf.orang[id]!.jenisKelamin === 'P' && !kasus.graf.orang[id]!.idAyah && id !== siti)!;
  namai(dewi, 'Dewi');
  return { kasus, budi };
}

it('kalimat babak memakai nama dan sebutan dari sisi almarhum', () => {
  const { kasus, budi } = kasusBudiDenganDewi();
  expect(kalimatBabak(kasus, 'PEWARIS')).toMatch(/Pak Ahmad wafat\. Ia meninggalkan .*Siti.*Budi.*Rina/);
  expect(kalimatBabak(kasus, budi)).toMatch(/Lalu Budi wafat\. Ia meninggalkan .*ibu \(Siti\).*istri \(Dewi\)/);
});

it('tautan ubah membawa ke babak itu; tanpa janin langsung ke hasil', () => {
  const kirim = vi.fn();
  const { kasus } = kasusBudiDenganDewi();
  render(<PeriksaCerita kasus={kasus} kirim={kirim} />);
  fireEvent.click(screen.getAllByRole('button', { name: /ubah/ })[1]!);
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_LANGKAH', langkah: 4 });
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_BABAK', babak: 1 });
  fireEvent.click(screen.getByRole('button', { name: /Lihat hasil/ }));
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_LAYAR', layar: 'hasil' });
});

it('ada janin belum lahir: layar pilihan menunggu sebelum hasil', () => {
  const kirim = vi.fn();
  const { kasus } = kasusBudiDenganDewi();
  const denganJanin = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang,
    J: { id: 'J', jenisKelamin: 'L' as const, idAyah: 'PEWARIS', statusHidup: 'dalamKandungan' as const, agama: 'islam' as const } } } };
  render(<PeriksaCerita kasus={denganJanin} kirim={kirim} />);
  fireEvent.click(screen.getByRole('button', { name: /Lihat hasil/ }));
  expect(screen.getByText(/Mau menunggu dulu/)).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Tunggu lahir dulu/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  const ubah = kirim.mock.calls.find(([a]) => a.jenis === 'UBAH_KASUS')![0].ubah;
  expect(ubah(denganJanin).pilihanJanin).toBe('tunggu');
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_LAYAR', layar: 'hasil' });
});
