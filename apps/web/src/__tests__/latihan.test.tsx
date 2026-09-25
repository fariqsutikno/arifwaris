import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, type SoalHitung } from '@waris/content';
import { ringkas } from '../hasil/ringkasan';
import { jalankan } from '../jalankan';
import { kasusDariContoh } from '../layar/belajar/contoh';
import { Latihan, PAKET_ACAK, soalPaket } from '../layar/belajar/Latihan';
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

  it('kuis: daftar paket per bab + acak; paket acak berisi soal unik', () => {
    render(<Latihan tab="kuis" kasusSekarang={null} saatKerjakan={() => {}} />);
    expect(screen.getByRole('link', { name: /Kuis acak/ }).getAttribute('href')).toBe('#/latihan/kuis/acak');
    for (const bab of new Set(DAFTAR_SOAL_KUIS.map(soal => soal.bab))) expect(screen.getByRole('link', { name: new RegExp(`^Bab ${bab} `) })).toBeTruthy();
    const acak = soalPaket(PAKET_ACAK);
    expect(new Set(acak.map(soal => soal.kode)).size).toBe(acak.length);
    expect(acak.length).toBe(Math.min(10, DAFTAR_SOAL_KUIS.length));
  });

  it('sesi kuis: soal satu per satu, pilihan berhuruf, skor di akhir tersimpan', () => {
    const daftar = soalPaket('bab-1');
    render(<Latihan tab="kuis" paket="bab-1" kasusSekarang={null} saatKerjakan={() => {}} />);
    daftar.forEach((soal, indeks) => {
      expect(screen.getByText(`Soal ${indeks + 1} dari ${daftar.length}`)).toBeTruthy();
      expect(document.querySelectorAll('fieldset.kartu-kuis').length).toBe(1);
      const huruf = 'ABCD'[indeks === 0 ? soal.indeksBenar : (soal.indeksBenar + 1) % soal.pilihan.length]!;
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${huruf}\\. `) }));
      fireEvent.click(screen.getByRole('button', { name: indeks + 1 < daftar.length ? 'Soal berikutnya →' : 'Lihat skor' }));
    });
    expect(document.querySelector('.skor-besar')?.textContent).toBe(`1/${daftar.length}`);
    expect(bacaCatatan('kuis')['bab-1']).toBe(`1/${daftar.length}`);
  });
});
