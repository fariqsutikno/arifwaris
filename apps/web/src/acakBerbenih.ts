// Pengacak deterministik dari string: dipakai supaya pilihan acak di layar (mis. sel jangkar soal latihan)
// sama setelah muat ulang selama idSesi sama; sesi baru = benih baru = pilihan baru.

/** Hash string (cyrb-style) → mulberry32. Bukan untuk keamanan. */
export function acakDariBenih(benih: string): () => number {
  let keadaan = 1779033703 ^ benih.length;
  for (let indeks = 0; indeks < benih.length; indeks++) {
    keadaan = Math.imul(keadaan ^ benih.charCodeAt(indeks), 3432918353);
    keadaan = (keadaan << 13) | (keadaan >>> 19);
  }
  return () => {
    keadaan = (keadaan + 0x6d2b79f5) | 0;
    let campur = Math.imul(keadaan ^ (keadaan >>> 15), 1 | keadaan);
    campur = (campur + Math.imul(campur ^ (campur >>> 7), 61 | campur)) ^ campur;
    return ((campur ^ (campur >>> 14)) >>> 0) / 4294967296;
  };
}
