import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { daftarSoalKuis } from '../konten/sumber';
import { KartuSoalKuis } from '../layar/belajar/KartuSoalKuis';
import { KontrolTampilan } from '../ui/KontrolTampilan';
import { bacaSuara, penggunaMengurangiGerak, simpanSuara } from '../tampilan';

let osilator = 0;
class AudioContextPalsu {
  currentTime = 0; destination = {}; state = 'running';
  resume() { return Promise.resolve(); }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { osilator++; return { type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; }
}
const matchMedia = (reduce: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));

beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute('data-gerak'); osilator = 0; matchMedia(false); vi.stubGlobal('AudioContext', AudioContextPalsu); });
afterEach(() => vi.unstubAllGlobals());

describe('KontrolTampilan', () => {
  it('ikon di header membuka panel dengan sakelar Animasi dan pilihan Suara', () => {
    render(<KontrolTampilan />);
    expect(screen.queryByRole('switch', { name: 'Animasi' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Gerak dan suara' }));
    expect((screen.getByRole('switch', { name: 'Animasi' }) as HTMLElement).getAttribute('aria-checked')).toBe('true');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });
  it('mematikan Animasi: diingat dan data-gerak terpasang', () => {
    render(<KontrolTampilan />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerak dan suara' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Animasi' }));
    expect(penggunaMengurangiGerak()).toBe(true);
    expect(document.documentElement.getAttribute('data-gerak')).toBe('kurang');
    expect(screen.getByRole('switch', { name: 'Animasi' }).getAttribute('aria-checked')).toBe('false');
  });
  it('sistem sudah meminta kurangi gerak: sakelar tampil mati dan tidak bisa dinyalakan', () => {
    matchMedia(true);
    render(<KontrolTampilan />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerak dan suara' }));
    const sakelar = screen.getByRole('switch', { name: 'Animasi' }) as HTMLButtonElement;
    expect(sakelar.getAttribute('aria-checked')).toBe('false');
    expect(sakelar.disabled).toBe(true);
  });
  it('memilih Mati pada Suara disimpan', () => {
    render(<KontrolTampilan />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerak dan suara' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Mati' }));
    expect(bacaSuara()).toBe('mati');
  });
  it('Esc menutup panel', () => {
    render(<KontrolTampilan />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerak dan suara' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('switch', { name: 'Animasi' })).toBeNull();
  });
});

describe('KartuSoalKuis: suara di Belajar', () => {
  it('menjawab benar berbunyi dua nada; menjawab salah berbunyi dua nada', () => {
    const soal = daftarSoalKuis()[0]!;
    const { unmount } = render(<KartuSoalKuis soal={soal} />);
    fireEvent.click(screen.getAllByRole('button')[soal.indeksBenar]!);
    expect(osilator).toBe(2);
    unmount();
    osilator = 0;
    render(<KartuSoalKuis soal={soal} />);
    fireEvent.click(screen.getAllByRole('button')[soal.indeksBenar === 0 ? 1 : 0]!);
    expect(osilator).toBe(2);
  });
  it('suara dimatikan pengguna: diam', () => {
    simpanSuara('mati');
    const soal = daftarSoalKuis()[0]!;
    render(<KartuSoalKuis soal={soal} />);
    fireEvent.click(screen.getAllByRole('button')[soal.indeksBenar]!);
    expect(osilator).toBe(0);
  });
});
