import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { Kasus } from '../kasus';
import { rapikanKeadaan } from '../kasus';
import { pengurangKeadaan, type KeadaanAplikasi } from '../keadaan';
import { KisahHarta } from '../layar/periksa/KisahHarta';
import { keluargaKarto } from './fixtures/kanvas';

let terbaru: Kasus;
function Papan({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terbaru = kasus;
  return <KisahHarta kasus={kasus} ubah={f => setKasus(f)} kirim={() => {}} />;
}
const buka = () => fireEvent.click(screen.getByRole('button', { name: /Ada kejadian lain/ }));
const pilih = (label: string | RegExp) => fireEvent.click(screen.getByRole('radio', { name: label }));
const pilihanTeks = () => screen.getAllByRole('radio').map(r => r.textContent);
const langkahKe = () => screen.getByRole('img', { name: /Langkah/ }).getAttribute('aria-label');
const simpan = () => fireEvent.click(screen.getByRole('button', { name: 'Simpan kejadian' }));

describe('Tambah kejadian (dialog bertahap)', () => {
  it('tiga langkah: apa, siapa, kapan; Simpan menambah peristiwa yang sama dengan form lama, baris tampil di bawah babak', () => {
    const { kasus, andi, sumi } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka();
    expect(screen.getByText('Apa yang terjadi?')).toBeTruthy();
    expect(langkahKe()).toBe('Langkah 1 dari 3');
    pilih('Ada yang lahir');
    expect(screen.getByText('Siapa?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Simpan kejadian' })).toBeNull();
    pilih('Andi');
    expect(screen.getByText('Kapan, dibanding almarhum?')).toBeTruthy();
    expect(langkahKe()).toBe('Langkah 3 dari 3');
    pilih('Sesudah Mbah Sumi meninggal');
    simpan();
    expect(terbaru.peristiwa).toEqual([{ jenis: 'lahir', idOrang: andi, sesudahWafat: sumi }]);
    const babakSumi = screen.getByRole('article', { name: /Mbah Sumi meninggal/ });
    expect(within(babakSumi).queryByText(/Andi lahir/)).toBeNull();
    expect(screen.getByText('Andi lahir.')).toBeTruthy();
    expect(screen.getByText('Sesudah Mbah Sumi meninggal', { selector: 'small' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Simpan kejadian' })).toBeNull();
  });

  it('pewaris disebut "Sesudah almarhum meninggal, sebelum harta dibagi"', () => {
    const { kasus, andi } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka(); pilih('Ada yang lahir'); pilih('Andi');
    expect(pilihanTeks()).toContain('Sesudah almarhum meninggal, sebelum harta dibagi');
    pilih(/sebelum harta dibagi/); simpan();
    expect(terbaru.peristiwa).toEqual([{ jenis: 'lahir', idOrang: andi, sesudahWafat: 'PEWARIS' }]);
  });

  it('Kembali mundur satu langkah dan pilihan sebelumnya tetap; Simpan tanpa pilihan waktu meminta memilih', () => {
    const { kasus } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka(); pilih('Ada yang lahir'); pilih('Andi');
    simpan();
    expect(screen.getByText('Pilih salah satu dulu.')).toBeTruthy();
    expect(terbaru.peristiwa).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    expect(screen.getByText('Siapa?')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Andi' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    expect(screen.getByRole('radio', { name: 'Ada yang lahir' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Kembali' })).toBeNull();
  });

  it('nikah/cerai menanyakan pasangan (empat langkah); pilihan pasangan tidak memuat orang itu sendiri', () => {
    const { kasus, andi } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka(); pilih('Ada yang menikah'); pilih('Andi');
    expect(screen.getByText('Dengan siapa?')).toBeTruthy();
    expect(langkahKe()).toBe('Langkah 3 dari 4');
    expect(screen.queryByRole('radio', { name: 'Andi' })).toBeNull();
    expect(andi).toBeTruthy();
  });

  it('nikah menyimpan idPasangan; waktu tidak memuat salah satu dari pasangan itu', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka(); pilih('Ada yang menikah'); pilih('Budi'); pilih('Mbah Sumi');
    expect(pilihanTeks()).toEqual(['Sesudah almarhum meninggal, sebelum harta dibagi']);
    pilih(/sebelum harta dibagi/); simpan();
    expect(terbaru.peristiwa).toEqual([{ jenis: 'nikah', idOrang: budi, idPasangan: sumi, sesudahWafat: 'PEWARIS' }]);
  });

  it('peristiwa lahir mengisi dikandungSetelahWafat lewat reducer', () => {
    const { kasus, andi, sumi } = keluargaKarto();
    const awal: KeadaanAplikasi = { layar: 'wizard', langkah: 4, kasus, tujuan: null, jenisKasus: 'nyata' };
    const sesudah = pengurangKeadaan(awal, { jenis: 'UBAH_KASUS', ubah: k => ({ ...k, peristiwa: [{ jenis: 'lahir', idOrang: andi, sesudahWafat: sumi }] }) });
    expect(sesudah.kasus!.dikandungSetelahWafat).toEqual({ [andi]: sumi });
  });

  it('peristiwa orang terhapus hilang', () => {
    const { kasus, andi, sumi } = keluargaKarto();
    const denganPeristiwa: Kasus = { ...kasus, peristiwa: [{ jenis: 'lahir', idOrang: andi, sesudahWafat: sumi }] };
    const { [andi]: _hapus, ...sisa } = denganPeristiwa.graf.orang;
    const rapi = rapikanKeadaan({ ...denganPeristiwa, graf: { ...denganPeristiwa.graf, orang: sisa } });
    render(<Papan awal={rapi} />);
    expect(screen.queryByText(/ lahir\./)).toBeNull();
  });

  it('Batal menutup di langkah mana pun tanpa perubahan', () => {
    const { kasus } = keluargaKarto();
    render(<Papan awal={kasus} />);
    buka(); pilih('Ada yang lahir');
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.queryByText('Siapa?')).toBeNull();
    expect(terbaru.peristiwa).toBeUndefined();
  });
});
