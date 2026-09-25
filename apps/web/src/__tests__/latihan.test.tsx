import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, type SoalHitung } from '@waris/content';
import { ringkas } from '../hasil/ringkasan';
import { jalankan } from '../jalankan';
import { kasusDariContoh } from '../layar/belajar/contoh';
import { Latihan } from '../layar/belajar/Latihan';
import { bacaCatatan, simpanCatatan } from '../preferensi';

describe('kunci soal hitung = hasil engine', () => {
  it.each(DAFTAR_SOAL_HITUNG.map(soal => [soal.kode, soal] as const))('%s', (_kode, soal) => {
    const kasus = kasusDariContoh(soal.kasus);
    const tampil = jalankan(kasus);
    if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') throw new Error(JSON.stringify(tampil));
    const { penerima, penyebut } = ringkas(kasus, tampil);
    const sahamPerKunci: Record<string, bigint> = {};
    for (const orang of penerima) if (orang.saham > 0n) sahamPerKunci[orang.kunci!] = (sahamPerKunci[orang.kunci!] ?? 0n) + orang.saham;
    expect(sahamPerKunci).toEqual(soal.kasus.harapan.saham);
    expect(penyebut).toBe(soal.kasus.harapan.ashlAkhir);
  });
});

describe('halaman latihan', () => {
  it('soal hitung per bab; Kerjakan membuka soalnya; yang sudah dikerjakan bertanda dan topiknya muncul', () => {
    const [pertama, kedua] = DAFTAR_SOAL_HITUNG as [SoalHitung, SoalHitung];
    simpanCatatan('soal', kedua.kode, 'selesai');
    const dikerjakan: SoalHitung[] = [];
    const { container } = render(<Latihan tab="hitung" kasusSekarang={null} saatKerjakan={soal => dikerjakan.push(soal)} />);
    expect(screen.getByRole('heading', { name: new RegExp(`^Bab ${pertama.bab} ·`) })).toBeTruthy();
    expect(container.textContent).not.toContain(pertama.topik);
    expect(container.textContent).toContain(kedua.topik);
    fireEvent.click(screen.getAllByRole('button', { name: 'Kerjakan' })[0]!);
    expect(dikerjakan).toEqual([pertama]);
  });

  it('kuis: pilih jawaban → benar/salah, pembahasan, dan catatan tersimpan', () => {
    const soal = DAFTAR_SOAL_KUIS[0]!;
    render(<Latihan tab="kuis" kasusSekarang={null} saatKerjakan={() => {}} />);
    const kartu = screen.getByText(soal.kode).closest('fieldset')!;
    const salah = soal.indeksBenar === 0 ? 1 : 0;
    fireEvent.click(kartu.querySelectorAll('button')[salah]!);
    expect(kartu.textContent).toMatch(/Belum tepat/);
    expect(bacaCatatan('kuis')[soal.kode]).toBe('salah');
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    fireEvent.click(kartu.querySelectorAll('button')[soal.indeksBenar]!);
    expect(kartu.textContent).toMatch(/Benar\./);
    expect(bacaCatatan('kuis')[soal.kode]).toBe('benar');
  });
});
