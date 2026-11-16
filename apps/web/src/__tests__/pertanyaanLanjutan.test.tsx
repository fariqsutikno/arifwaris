import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { jawabLanjutan, pilihKeadaan } from '../keadaanBaris';
import { PertanyaanHamil } from '../layar/keadaan/PertanyaanHamil';
import { BarisOrang } from '../layar/keluarga/BarisOrang';
import { PertanyaanLanjutan } from '../layar/keluarga/PertanyaanLanjutan';
import { tambah } from './fixtures/kanvas';

let terakhir: Kasus;
function Uji({ awal, anak }: { awal: Kasus; anak?: React.ReactNode }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <>{anak}<PertanyaanLanjutan kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} /></>;
}
function istriDanAnak() {
  const istri = tambah(kasusBaru('L'), 'PEWARIS', 'ISTRI');
  const anak = tambah(istri.kasus, 'PEWARIS', 'ANAK_LK');
  return { kasus: anak.kasus, istri: istri.id, anak: anak.id };
}
const pertanyaan = (teks: RegExp) => screen.getByRole('heading', { name: teks });
const pil = (teks: RegExp) => within(screen.getByRole('radiogroup', { name: teks }));
const centang = (teks: RegExp) => within(screen.getByRole('group', { name: teks }));

describe('PertanyaanLanjutan (C4-1)', () => {
  it('tidak dirender bila tidak ada orang yang bisa dipilih', () => {
    const { container } = render(<Uji awal={kasusBaru('L')} />);
    expect(container.textContent).toBe('');
  });

  it('tanpa pasangan hanya pertanyaan hilang yang tampil; bawaan Tidak dan daftar tertutup', () => {
    const anak = tambah(kasusBaru('L'), 'PEWARIS', 'ANAK_LK');
    render(<Uji awal={anak.kasus} />);
    expect(pertanyaan(/hilang tanpa kabar/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /dicerai/ })).toBeNull();
    expect(pil(/hilang tanpa kabar/).getByRole('radio', { name: 'Tidak' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('Ya + centang menulis status yang sama dengan pil lama (mafqud dan talakRajiIddah)', () => {
    const { kasus, istri, anak } = istriDanAnak();
    render(<Uji awal={kasus} />);
    fireEvent.click(pil(/hilang tanpa kabar/).getByRole('radio', { name: 'Ya' }));
    fireEvent.click(centang(/hilang tanpa kabar/).getByRole('checkbox', { name: /Anak laki-laki/ }));
    expect(terakhir.graf.orang[anak]!.statusHidup).toBe('mafqud');
    fireEvent.click(pil(/dicerai/).getByRole('radio', { name: 'Ya' }));
    expect(pertanyaan(/Ada istri yang sudah dicerai almarhum/)).toBeTruthy();
    fireEvent.click(centang(/dicerai/).getByRole('checkbox', { name: /Istri/ }));
    expect(terakhir.graf.pernikahan.find(n => n.idIstri === istri)!.status).toBe('talakRajiIddah');
    expect(terakhir.belumDiisi).toEqual(expect.arrayContaining([anak, istri]));   // putusan dan iddah tetap ditanya
    expect(screen.getByText(/masa iddahnya sudah selesai/)).toBeTruthy();
  });

  it('memilih Tidak mengembalikan semua yang tercentang menjadi masih hidup', () => {
    const { kasus, istri } = istriDanAnak();
    const cerai = jawabLanjutan(pilihKeadaan(kasus, istri, 'bercerai', 'PEWARIS'), istri, 'PEWARIS', { jenis: 'iddah', selesai: false });
    render(<Uji awal={cerai} />);
    fireEvent.click(pil(/dicerai/).getByRole('radio', { name: 'Tidak' }));
    expect(terakhir.graf.pernikahan.every(n => n.status === 'utuh')).toBe(true);
    expect(screen.queryByRole('checkbox', { name: /Istri/ })).toBeNull();
  });

  it('kasus lama dengan orang mafqud dan istri bercerai langsung tampil Ya dengan centang yang benar', () => {
    const { kasus, istri, anak } = istriDanAnak();
    const lama = jawabLanjutan(pilihKeadaan(pilihKeadaan(kasus, anak, 'hilang', 'PEWARIS'), istri, 'bercerai', 'PEWARIS'), istri, 'PEWARIS', { jenis: 'iddah', selesai: true });
    render(<Uji awal={lama} />);
    expect(pil(/hilang tanpa kabar/).getByRole('radio', { name: 'Ya' }).getAttribute('aria-checked')).toBe('true');
    expect(pil(/dicerai/).getByRole('radio', { name: 'Ya' }).getAttribute('aria-checked')).toBe('true');
    expect((centang(/hilang tanpa kabar/).getByRole('checkbox', { name: /Anak laki-laki/ }) as HTMLInputElement).checked).toBe(true);
    expect((centang(/dicerai/).getByRole('checkbox', { name: /Istri/ }) as HTMLInputElement).checked).toBe(true);
    expect(terakhir.graf.pernikahan.find(n => n.idIstri === istri)!.status).toBe('talakBain');
  });
});

describe('hamil per kartu (C4-3)', () => {
  const istriHidup = () => {
    const { kasus, id } = tambah(kasusBaru('L'), 'PEWARIS', 'ISTRI');
    return { kasus: pilihKeadaan(kasus, id, 'hidup', 'PEWARIS'), istri: id };
  };
  function KartuIstri({ awal, id }: { awal: Kasus; id: string }) {
    const [kasus, setKasus] = useState(awal);
    terakhir = kasus;
    return <BarisOrang kasus={kasus} id={id} kunci="ISTRI" milik="PEWARIS" ubah={f => setKasus(k => rapikanKeadaan(f(k)))} tandaiKurang={false} disorot={false} />;
  }

  it('kartu istri menanyakan hamil dengan menyebut orangnya; Ya langsung ke dialog "dari siapa" tanpa menanyakan siapa', () => {
    const { kasus, istri } = istriHidup();
    render(<KartuIstri awal={kasus} id={istri} />);
    expect(screen.getByText('Waktu almarhum meninggal, apakah Istri sedang hamil?')).toBeTruthy();
    expect(screen.getByText('Ditanya karena anak yang dikandung ikut mendapat warisan.')).toBeTruthy();
    expect(screen.getAllByRole('radio', { name: 'Tidak' }).at(-1)!.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getAllByRole('radio', { name: 'Ya' }).at(-1)!);
    expect(screen.queryByText('Siapa yang sedang hamil?')).toBeNull();
    expect(screen.getByRole('dialog').textContent).toContain('dari siapa');
    fireEvent.click(screen.getAllByRole('radio').find(r => r.closest('[role=dialog]'))!);
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Belum lahir/ }));
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
    expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'dalamKandungan' && o.idIbu === istri)).toBe(true);
  });

  it('perempuan yang bukan calon ibu janin atau sudah meninggal tidak ditanya hamil', () => {
    const { kasus, id } = tambah(kasusBaru('L'), 'PEWARIS', 'ISTRI');
    render(<KartuIstri awal={pilihKeadaan(kasus, id, 'wafat', 'PEWARIS')} id={id} />);
    expect(screen.queryByText(/hamil/)).toBeNull();
  });

  it('pertanyaan umum: tidak dirender bila semua calon sudah berkartu, tetap tampil untuk calon tanpa kartu', () => {
    const { kasus, istri } = istriHidup();
    const ubah = () => undefined;
    const { container, rerender } = render(<PertanyaanHamil kasus={kasus} idMayit="PEWARIS" ubah={ubah} kecuali={[istri]} />);
    expect(container.textContent).toBe('');
    rerender(<PertanyaanHamil kasus={kasus} idMayit="PEWARIS" ubah={ubah} kecuali={[]} />);
    expect(container.textContent).toContain('apakah ada yang sedang hamil');
  });
});
