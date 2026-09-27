// Pencocok teks layar: menerima semua teks aplikasi (teks edukasi & diksi, versi yang dipakai layar web) dan
// memutuskan teks mana yang sedang tampil di satu simpul teks layar. Cocok persis (spasi dirapikan) didahulukan;
// teks bersisipan ("{jumlah} jt") dicocokkan sebagai pola. Dipakai EditorTeksAplikasi untuk menjadikan teks di layar
// web asli bisa diklik & disunting di tempat.
export interface SumberTeks { sumber: 'teks' | 'diksi'; kunci: string; id: string; ar: string | null }
export interface PencocokTeks { cari: (teks: string) => SumberTeks[] }

// Pola yang bagian tetapnya terlalu pendek ("{nama}", "{a} · {b}") akan cocok dengan hampir apa saja.
const PANJANG_TETAP_MINIMAL = 2;

export function buatPencocok(daftar: readonly SumberTeks[]): PencocokTeks {
  const persis = new Map<string, SumberTeks[]>();
  const pola: { regex: RegExp; sumber: SumberTeks }[] = [];
  for (const sumber of daftar) {
    const teks = rapikan(sumber.id);
    if (teks.length < 2) continue;
    const bagianTetap = teks.split(/\{\w+\}/);
    if (bagianTetap.length > 1) {
      if (bagianTetap.join('').trim().length >= PANJANG_TETAP_MINIMAL) pola.push({ regex: new RegExp(`^${bagianTetap.map(lolos).join('.+?')}$`), sumber });
    } else {
      persis.set(teks, [...(persis.get(teks) ?? []), sumber]);
    }
  }
  return {
    cari(teks) {
      const rapi = rapikan(teks);
      if (rapi.length < 2) return [];
      return persis.get(rapi) ?? pola.filter(({ regex }) => regex.test(rapi)).map(({ sumber }) => sumber);
    },
  };
}

export const rapikan = (teks: string): string => teks.replace(/\s+/g, ' ').trim();
const lolos = (teks: string) => teks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
