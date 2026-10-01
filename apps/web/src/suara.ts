// Empat bunyi pendek (< 200 ms) yang disintesis di perangkat dengan Web Audio: tanpa berkas, tanpa internet,
// tanpa dependency. Pelan dan tanpa melodi berulang. Bunyi tidak pernah menjadi satu-satunya penanda sesuatu.
// Menerima nama bunyi + konteks halaman; diam bila pengaturan tampilan.ts tidak mengizinkan.
// "tiba" (aliran harta) belum ada: aliran itu CSS murni, sinkronnya menunggu tahap pohon.

import { suaraAktif, type KonteksSuara } from './tampilan';

export type Bunyi = 'ketuk' | 'benar' | 'salah' | 'selesai';

interface Nada { frekuensi: number; mulai: number; lama: number }
const NADA: Record<Bunyi, Nada[]> = {
  ketuk: [{ frekuensi: 660, mulai: 0, lama: 0.06 }],
  benar: [{ frekuensi: 523, mulai: 0, lama: 0.09 }, { frekuensi: 784, mulai: 0.07, lama: 0.1 }],
  salah: [{ frekuensi: 330, mulai: 0, lama: 0.1 }, { frekuensi: 247, mulai: 0.08, lama: 0.1 }],
  selesai: [{ frekuensi: 523, mulai: 0, lama: 0.07 }, { frekuensi: 659, mulai: 0.06, lama: 0.07 }, { frekuensi: 784, mulai: 0.12, lama: 0.07 }],
};
const VOLUME = 0.05;
const SERANGAN = 0.005;

let konteks: AudioContext | undefined;

export function putar(bunyi: Bunyi, halaman: KonteksSuara): void {
  if (!suaraAktif(halaman)) return;
  const Konteks = typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Konteks) return;
  try {
    konteks ??= new Konteks();
    if (konteks.state === 'suspended') void konteks.resume();
    const awal = konteks.currentTime;
    for (const { frekuensi, mulai, lama } of NADA[bunyi]) {
      const osilator = konteks.createOscillator();
      const penguat = konteks.createGain();
      osilator.type = 'sine';
      osilator.frequency.value = frekuensi;
      penguat.gain.setValueAtTime(0.0001, awal + mulai);
      penguat.gain.linearRampToValueAtTime(VOLUME, awal + mulai + SERANGAN);
      penguat.gain.exponentialRampToValueAtTime(0.0001, awal + mulai + lama);
      osilator.connect(penguat);
      penguat.connect(konteks.destination);
      osilator.start(awal + mulai);
      osilator.stop(awal + mulai + lama + 0.02);
    }
  } catch {
    // Suara hanya pelengkap: penyedia audio yang gagal tidak boleh mengganggu layar.
  }
}
