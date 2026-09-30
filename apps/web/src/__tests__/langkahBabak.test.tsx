import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { aturDikandung, calonPasangan, kerabatDari, nikahkan, terapkanKeadaan } from '../keadaanOrang';
import { LangkahBabak } from '../layar/LangkahBabak';

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <LangkahBabak kasus={kasus} babak={1} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
function kasusBudi() {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const namai = (id: string, nama: string) => { kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [id]: { ...kasus.graf.orang[id]!, nama } } } }; };
  const siti = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && !o.idAyah)!.id;
  const budi = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'L' && o.idAyah)!.id;
  const rina = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && o.idAyah)!.id;
  namai('PEWARIS', 'Pak Ahmad'); namai(siti, 'Siti'); namai(budi, 'Budi'); namai(rina, 'Rina');
  return { kasus: terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false }), budi, siti };
}

describe('LangkahBabak', () => {
  it('membuka dengan sudut pandang Budi dan menyebut Siti sebagai ibu', () => {
    render(<Uji awal={kasusBudi().kasus} />);
    expect(screen.getByText(/Sekarang kita lihat dari sisi Budi/)).toBeTruthy();
    // Siti juga tampil sebagai node pohon; yang diperiksa baris daftar "dari orang yang sudah ada".
    expect(screen.getAllByText(/Siti/).map(e => e.closest('li')).find(Boolean)!.textContent).toMatch(/[Ii]bu/);
  });
  it('menambah istri Budi lewat daftar yang sama', () => {
    render(<Uji awal={kasusBudi().kasus} />);
    fireEvent.click(screen.getByRole('button', { name: /Tambah Istri/ }));
    expect(Object.values(terakhir.graf.pernikahan).some(n => n.idSuami === kasusBudi().budi && n.idIstri !== kasusBudi().siti)).toBe(true);
  });
});

it('aturDikandung: anak Budi dikandung sesudah Pak Ahmad wafat (S13)', () => {
  const { kasus, budi } = kasusBudi();
  const k = { ...kasus, graf: tambahAhliWaris(kasus.graf, budi, 'ANAK_LK') };
  const anak = Object.values(k.graf.orang).find(o => o.idAyah === budi)!.id;
  expect(aturDikandung(k, anak, 'PEWARIS').dikandungSetelahWafat).toEqual({ [anak]: 'PEWARIS' });
  expect(aturDikandung(aturDikandung(k, anak, 'PEWARIS'), anak, null).dikandungSetelahWafat).toBeUndefined();
});

it('S11: saudari wafat setelah dinikahi suami pewaris (contoh kitab)', () => {
  let kasus = kasusBaru('P');
  for (const kunci of ['SUAMI', 'SAUDARI_KANDUNG'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const suami = kasus.graf.pernikahan[0]!.idSuami;
  const saudari = Object.values(kasus.graf.orang).find(o => o.jenisKelamin === 'P' && o.id !== 'PEWARIS' && !o.penghubung)!.id;
  kasus = terapkanKeadaan(kasus, saudari, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
  expect(calonPasangan(kasus, saudari)).toContain(suami);
  const nikah = nikahkan(kasus, saudari, suami);
  expect(nikah.graf.pernikahan).toContainEqual({ idSuami: suami, idIstri: saudari, status: 'utuh' });
  expect(kerabatDari(nikah, saudari)).toContain(suami);
});
