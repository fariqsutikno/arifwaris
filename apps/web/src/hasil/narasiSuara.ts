// Suara dan waktu baca untuk tampilan Sinema: narasi dibacakan lewat speechSynthesis (id-ID). Tanpa suara Indonesia di
// perangkat, adegan berjalan memakai lama baca teks, jadi sinema tetap utuh dengan takarir saja.

import { useEffect, useState } from 'react';

const BAHASA_SUARA = 'id-ID';
const MS_PER_HURUF = 55;
const MIN_BACA_MS = 2200;

export const lamaBacaMs = (teks: string, kecepatan: number): number => Math.max(MIN_BACA_MS, teks.length * MS_PER_HURUF) / kecepatan;

/** Rupiah dan pecahan diucapkan sebagai kata ("Rp37.500.000" → "37.500.000 rupiah", "9/72" → "9 per 72"). */
export const teksUcapan = (teks: string): string =>
  teks.replace(/Rp\s?(\d(?:[\d.]*\d)?)/g, '$1 rupiah').replace(/(\d+)\/(\d+)/g, '$1 per $2');

const mesin = (): SpeechSynthesis | undefined => (typeof window === 'undefined' ? undefined : window.speechSynthesis);
const suaraIndonesia = (): SpeechSynthesisVoice | undefined => mesin()?.getVoices().find(suara => suara.lang.toLowerCase().startsWith('id'));

/** Suara berhenti kalau yang diucapkan terpotong: `saatSelesai` hanya dipanggil bila ucapan tuntas. Mengembalikan pembatal. */
export function ucapkan(teks: string, kecepatan: number, saatSelesai: () => void): () => void {
  const suara = suaraIndonesia();
  const ucapan = new SpeechSynthesisUtterance(teksUcapan(teks));
  ucapan.lang = BAHASA_SUARA;
  ucapan.rate = kecepatan;
  if (suara) ucapan.voice = suara;
  let batal = false;
  ucapan.onend = () => { if (!batal) saatSelesai(); };
  mesin()!.cancel();
  mesin()!.speak(ucapan);
  return () => { batal = true; mesin()?.cancel(); };
}

export function useAdaSuaraIndonesia(): boolean {
  const [ada, setAda] = useState(() => !!suaraIndonesia());
  useEffect(() => {
    // Daftar suara dimuat tidak serentak di sebagian peramban.
    const perbarui = () => setAda(!!suaraIndonesia());
    mesin()?.addEventListener?.('voiceschanged', perbarui);
    return () => mesin()?.removeEventListener?.('voiceschanged', perbarui);
  }, []);
  return ada;
}
