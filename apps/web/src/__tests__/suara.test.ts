import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { putar } from '../suara';
import { simpanSuara } from '../tampilan';

let osilator = 0;
let konteksDibuat = 0;
class AudioContextPalsu {
  currentTime = 0; destination = {}; state = 'running';
  constructor() { konteksDibuat++; }
  resume() { return Promise.resolve(); }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { osilator++; return { type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; }
}

beforeEach(() => { localStorage.clear(); osilator = 0; konteksDibuat = 0; vi.stubGlobal('AudioContext', AudioContextPalsu); });
afterEach(() => vi.unstubAllGlobals());

describe('putar', () => {
  it('di Belajar dengan pengaturan bawaan: benar = dua nada, salah = dua nada, ketuk = satu, selesai = tiga', () => {
    putar('benar', 'belajar'); expect(osilator).toBe(2);
    putar('salah', 'belajar'); expect(osilator).toBe(4);
    putar('ketuk', 'belajar'); expect(osilator).toBe(5);
    putar('selesai', 'belajar'); expect(osilator).toBe(8);
  });
  it('di Hitung dengan pengaturan bawaan: diam, dan AudioContext tidak dibuat', () => {
    putar('benar', 'hitung');
    expect(osilator).toBe(0);
    expect(konteksDibuat).toBe(0);
  });
  it('dimatikan pengguna: diam di Belajar', () => {
    simpanSuara('mati');
    putar('benar', 'belajar');
    expect(osilator).toBe(0);
  });
  it('tanpa dukungan Web Audio: tidak melempar galat', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => putar('benar', 'belajar')).not.toThrow();
  });
});
