import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, type SoalHitung } from '@waris/content';
import { ringkas } from '../hasil/ringkasan';
import { jalankan } from '../jalankan';
import { kasusDariContoh } from '../layar/belajar/contoh';
import { Latihan } from '../layar/belajar/Latihan';
import { PAKET_ACAK, durasiUjian, judulTopik, soalPaket } from '../layar/belajar/KuisKonsep';
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
    expect(screen.getByRole('heading', { name: new RegExp(`^${judulTopik(pertama.bab)}`) })).toBeTruthy();
    expect(container.textContent).not.toContain(pertama.topik);
    expect(container.textContent).toContain(kedua.topik);
    fireEvent.click(screen.getAllByRole('button', { name: 'Kerjakan' })[0]!);
    expect(dikerjakan).toEqual([pertama]);
  });

  it('kuis: daftar paket per bab + acak; paket acak berisi soal unik', () => {
    render(<Latihan tab="kuis" kasusSekarang={null} saatKerjakan={() => {}} />);
    expect(screen.getByRole('link', { name: /Kuis acak/ }).getAttribute('href')).toBe('#/latihan/kuis/acak');
    for (const bab of new Set(DAFTAR_SOAL_KUIS.map(soal => soal.bab))) expect(screen.getByRole('link', { name: new RegExp(`^${judulTopik(bab)}`) })).toBeTruthy();
    const acak = soalPaket(PAKET_ACAK);
    expect(new Set(acak.map(soal => soal.kode)).size).toBe(acak.length);
    expect(acak.length).toBe(Math.min(10, DAFTAR_SOAL_KUIS.length));
  });

  it('sesi kuis mode latihan: fokus (tanpa tab), soal satu per satu, pembahasan langsung, skor + pembahasan di akhir', () => {
    const daftar = soalPaket('bab-1');
    render(<Latihan tab="kuis" paket="bab-1" kasusSekarang={null} saatKerjakan={() => {}} />);
    expect(screen.queryByRole('link', { name: 'Soal hitung' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Mode latihan/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mulai kuis' }));
    daftar.forEach((soal, indeks) => {
      expect(screen.getByText(`Soal ${indeks + 1} dari ${daftar.length}`)).toBeTruthy();
      const huruf = 'ABCD'[indeks === 0 ? soal.indeksBenar : (soal.indeksBenar + 1) % soal.pilihan.length]!;
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${huruf}\\. `) }));
      expect(screen.getByRole('status').textContent).toMatch(indeks === 0 ? /^\s*Benar/ : /Belum tepat/);
      fireEvent.click(screen.getByRole('button', { name: indeks + 1 < daftar.length ? 'Soal berikutnya' : 'Lihat hasil' }));
    });
    expect(document.querySelector('.skor-besar')?.textContent).toBe(`1/${daftar.length}`);
    expect(screen.getByRole('heading', { name: 'Pembahasan' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Pilih kuis lain' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kerjakan lagi' })).toBeTruthy();
    expect(bacaCatatan('kuis')['bab-1']).toBe(`1/${daftar.length}`);
  });

  it('sesi kuis mode ujian: jawaban bisa diganti dan soal sebelumnya dibuka lagi; penilaian baru saat diselesaikan', () => {
    const daftar = soalPaket('bab-2');
    render(<Latihan tab="kuis" paket="bab-2" kasusSekarang={null} saatKerjakan={() => {}} />);
    fireEvent.click(screen.getByRole('radio', { name: /Mode ujian/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mulai kuis' }));
    expect(screen.getByRole('button', { name: daftar.length > 1 ? 'Soal berikutnya' : 'Selesaikan' }).hasAttribute('disabled')).toBe(true);
    daftar.forEach((soal, indeks) => {
      if (indeks === 1) {
        fireEvent.click(screen.getByRole('button', { name: 'Soal sebelumnya' }));
        const pilihanTadi = screen.getByRole('button', { name: new RegExp(`^${'ABCD'[daftar[0]!.indeksBenar]}\\. `) });
        expect(pilihanTadi.getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(screen.getByRole('button', { name: 'Soal berikutnya' }));
      }
      const salah = 'ABCD'[(soal.indeksBenar + 1) % soal.pilihan.length]!;
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${salah}\\. `) }));
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${'ABCD'[soal.indeksBenar]}\\. `) }));
      expect(screen.queryByRole('status')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: indeks + 1 < daftar.length ? 'Soal berikutnya' : 'Selesaikan' }));
    });
    expect(document.querySelector('.skor-besar')?.textContent).toBe(`${daftar.length}/${daftar.length}`);
  });

  it('mode ujian: 5 soal = 3 menit, dibulatkan ke 30 detik; waktu habis = dikumpulkan otomatis, yang kosong salah', () => {
    expect([durasiUjian(5), durasiUjian(10), durasiUjian(3), durasiUjian(1)]).toEqual([180, 360, 120, 30]);
    const daftar = soalPaket('bab-2');
    vi.useFakeTimers();
    render(<Latihan tab="kuis" paket="bab-2" kasusSekarang={null} saatKerjakan={() => {}} />);
    fireEvent.click(screen.getByRole('radio', { name: /Mode ujian/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mulai kuis' }));
    expect(screen.getByRole('timer')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(durasiUjian(daftar.length) * 1000 + 500); });
    vi.useRealTimers();
    expect(document.querySelector('.skor-besar')?.textContent).toBe(`0/${daftar.length}`);
    expect(screen.getAllByText('Tidak dijawab (waktu habis)')).toHaveLength(daftar.length);
  });
});
