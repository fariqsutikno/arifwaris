import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { tambahJanin, terapkanKeadaan } from '../keadaanOrang';
import { HeroLab } from '../layar/lab/HeroLab';

const lengkap = (): Kasus => {
  const k = kasusBaru('L');
  const dengan = ['ISTRI', 'ANAK_LK'].reduce((kini, kunci) => ({ ...kini, graf: tambahAhliWaris(kini.graf, 'PEWARIS', kunci as 'ISTRI') }), k);
  return { ...dengan, tirkah: { ...dengan.tirkah, kotor: 600_000_000n } };
};
const idAnak = (k: Kasus) => Object.values(k.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
const idIstri = (k: Kasus) => Object.values(k.graf.orang).find(o => o.jenisKelamin === 'P' && !o.idAyah)!.id;

// Pintu masuk ArifLab tidak boleh runtuh karena kasus terakhir berupa kemungkinan (bukan satu pembagian pasti).
const kasusKemungkinan: Array<[string, () => Kasus]> = [
  ['janin belum lahir', () => { const k = lengkap(); return tambahJanin(k, idIstri(k), 'PEWARIS'); }],
  ['orang hilang', () => { const k = lengkap(); return terapkanKeadaan(k, idAnak(k), { jenis: 'hilang' }); }],
  ['kelamin belum jelas', () => { const k = lengkap(); return terapkanKeadaan(k, idAnak(k), { jenis: 'khuntsa', keadaan: 'diharapkanJelas' }); }],
  ['wafat bersamaan', () => {
    const k = lengkap();
    return terapkanKeadaan(k, idAnak(k), { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 100_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
  }],
];

it.each(kasusKemungkinan)('hero Awal Lab tetap tampil dengan kasus terakhir: %s', (_nama, buat) => {
  render(<HeroLab kasusTerakhir={buat()} saatLanjut={() => {}} />);
  expect(screen.getByRole('button', { name: /Istri/ })).toBeTruthy();
});

it('kasus biasa lengkap tetap memakai pita bagian', () => {
  const { container } = render(<HeroLab kasusTerakhir={lengkap()} saatLanjut={() => {}} />);
  expect(container.querySelector('.pita-bagian')).toBeTruthy();
});
