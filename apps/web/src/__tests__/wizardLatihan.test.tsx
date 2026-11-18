import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { keadaanAwal, pengurangKeadaan, type Aksi, type KeadaanAplikasi } from '../keadaan';
import { Wizard } from '../layar/Wizard';
import { terapkanKeadaan } from '../keadaanOrang';
import { tandaiWafatSebelumDibagi } from '../latihan';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); Element.prototype.scrollIntoView = vi.fn(); });

const tambah = (kasus: Kasus, idMayit: string, kunci: Parameters<typeof tambahAhliWaris>[2]): Kasus => ({ ...kasus, graf: tambahAhliWaris(kasus.graf, idMayit, kunci) });
function soal(): { kasus: Kasus; anak: string } {
  let kasus = tambah({ ...kasusBaru('L', 'latihan'), tirkah: { ...kasusBaru('L').tirkah, kotor: 1_000_000n } }, 'PEWARIS', 'ANAK_LK');
  const anak = hitungIsian(kasus.graf, 'PEWARIS').ANAK_LK![0]!;
  kasus = tandaiWafatSebelumDibagi(kasus, anak, true);
  return { kasus, anak };
}
function Papan({ kasus, langkah }: { kasus: Kasus; langkah: number }) {
  const [keadaan, setKeadaan] = useState<KeadaanAplikasi>(() => pengurangKeadaan(keadaanAwal(kasus, null), { jenis: 'KE_LANGKAH', langkah }));
  return <Wizard keadaan={keadaan} kirim={(aksi: Aksi) => setKeadaan(k => pengurangKeadaan(k, aksi))} />;
}
const status = () => document.querySelector('.bar-bawah [role=status]')!.textContent;

describe('Wizard latihan (rencana 3)', () => {
  it('langkah 3 merender kartu "Mayit pertama", bukan kanvas', () => {
    render(<Papan kasus={soal().kasus} langkah={3} />);
    expect(screen.getByRole('heading', { name: /Mayit pertama/ })).toBeTruthy();
    expect(screen.queryByText(/Pasangan/)).toBeNull();
  });

  it('kartu tanpa ahli waris menahan lanjut: status menyebut kartunya, kartu digulir', () => {
    render(<Papan kasus={soal().kasus} langkah={3} />);
    fireEvent.click(screen.getByRole('button', { name: /^Lanjut/ }));
    expect(status()).toMatch(/^Isi ahli waris .* dulu\.$/);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('Periksa: satu baris per mayit; "ubah" membuka langkah 3 dengan fokus ke kartu itu', () => {
    const { kasus: tanpaKeluarga, anak } = soal();
    const kasus = tambah(tanpaKeluarga, anak, 'ISTRI');
    render(<Papan kasus={kasus} langkah={4} />);
    expect(screen.getAllByRole('heading', { level: 2, name: /^Keluarga / }).length).toBe(2);
    const baris = screen.getAllByRole('button', { name: 'ubah' });
    fireEvent.click(baris[1]!);
    expect(screen.getByRole('heading', { name: /Mayit ke-2/ })).toBeTruthy();
    expect(document.activeElement?.id).toBe(`mayit-${anak}`);
  });

  it('Periksa latihan menampilkan daftar kondisi (mawani\')', () => {
    const { kasus: tanpaKeluarga, anak } = soal();
    render(<Papan kasus={tambah(tanpaKeluarga, anak, 'ISTRI')} langkah={4} />);
    expect(screen.getByRole('heading', { level: 2, name: /beda agama/ })).toBeTruthy();
  });

  it('Periksa latihan memuat lagi baris harta dan keadaan khusus (hilang, belum tahu)', () => {
    const { kasus: tanpaKeluarga, anak } = soal();
    let kasus = tambah(tambah(tambah(tanpaKeluarga, anak, 'ISTRI'), 'PEWARIS', 'ANAK_PR'), 'PEWARIS', 'ISTRI');
    const [anakPr, istri] = [hitungIsian(kasus.graf, 'PEWARIS').ANAK_PR![0]!, hitungIsian(kasus.graf, 'PEWARIS').ISTRI![0]!];
    kasus = terapkanKeadaan(terapkanKeadaan(kasus, anakPr, { jenis: 'hilang' }), istri, { jenis: 'belumTahu' });
    render(<Papan kasus={kasus} langkah={4} />);
    expect(screen.getByText(/Harta yang dibagi: harta .*1\.000\.000/)).toBeTruthy();
    expect(screen.getByText(/sendiri tidak ikut dihitung/)).toBeTruthy();
    expect(screen.getByText(/hilang dan belum ada kabar/)).toBeTruthy();
    expect(screen.getAllByText(/: Belum tahu$/).length).toBeGreaterThan(0);   // istri juga muncul sebagai ibu di kartu anak
  });

  it('nama pewaris masih bisa diisi di langkah 1 latihan', () => {
    render(<Papan kasus={soal().kasus} langkah={1} />);
    expect(screen.getByRole('textbox', { name: /Siapa nama almarhum/ })).toBeTruthy();
  });
});
