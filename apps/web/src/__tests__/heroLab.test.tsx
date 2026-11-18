import kartoTaqdir from './fixtures/kartoTaqdir.json?raw';
import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { jalankan } from '../jalankan';
import { dariJson } from '../kasus';
import { HeroLab } from '../layar/lab/HeroLab';
import { ringkasKasus } from '../riwayat';

it('kasus lengkap dengan orang hilang (hasil taqdir) tidak membuat Awal Hitung crash', () => {
  const baca = dariJson(kartoTaqdir);
  if (!baca.berhasil) throw new Error(baca.pesan);
  expect(jalankan(baca.kasus).jenis).toBe('taqdir');
  expect(ringkasKasus(baca.kasus).lengkap).toBe(true);
  const { container } = render(<HeroLab kasusTerakhir={baca.kasus} saatLanjut={() => {}} />);
  expect(container.querySelector('.panel-lab')).toBeTruthy();
});
