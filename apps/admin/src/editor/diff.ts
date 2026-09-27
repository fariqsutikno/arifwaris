// Diff murni lewat LCS (tabel panjang, jalan balik) atas dua daftar potongan. diffBaris membandingkan per baris,
// diffKata per kata (spasi ikut sebagai potongan supaya teks bisa disusun ulang apa adanya). Dipakai Perbandingan
// (riwayat & antrean review) untuk menyorot kata yang dihapus/ditambah di tiap bidang.
export type BarisDiff = { jenis: 'sama' | 'tambah' | 'hapus'; teks: string };

export const diffBaris = (lama: string, baru: string): BarisDiff[] =>
  diffDaftar(lama === '' ? [] : lama.split('\n'), baru === '' ? [] : baru.split('\n'));

/** Hasil dikelompokkan per frasa: spasi yang sama di tengah perubahan ikut ke perubahan itu, supaya "x y" tidak
 * terpecah jadi "x" + spasi + "y"; tiap kelompok perubahan = satu hapus lalu satu tambah. */
export function diffKata(lama: string, baru: string): BarisDiff[] {
  const potong = (teks: string) => teks.split(/(\s+)/).filter(Boolean);
  const mentah = diffDaftar(potong(lama), potong(baru));
  const hasil: BarisDiff[] = [];
  let hapus = '';
  let tambah = '';
  const tutupPerubahan = () => {
    if (hapus) hasil.push({ jenis: 'hapus', teks: hapus });
    if (tambah) hasil.push({ jenis: 'tambah', teks: tambah });
    hapus = tambah = '';
  };
  mentah.forEach((bagian, i) => {
    const spasiDiTengahPerubahan = bagian.jenis === 'sama' && /^\s+$/.test(bagian.teks) && (hapus || tambah) && mentah[i + 1]?.jenis !== 'sama' && i + 1 < mentah.length;
    if (bagian.jenis === 'hapus') hapus += bagian.teks;
    else if (bagian.jenis === 'tambah') tambah += bagian.teks;
    else if (spasiDiTengahPerubahan) { if (hapus) hapus += bagian.teks; if (tambah) tambah += bagian.teks; }
    else {
      tutupPerubahan();
      const akhir = hasil.at(-1);
      if (akhir?.jenis === 'sama') akhir.teks += bagian.teks;
      else hasil.push({ ...bagian });
    }
  });
  tutupPerubahan();
  return hasil;
}

function diffDaftar(a: string[], b: string[]): BarisDiff[] {
  // panjang[i][j] = panjang LCS a[i..] dan b[j..]
  const panjang = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      panjang[i]![j] = a[i] === b[j] ? panjang[i + 1]![j + 1]! + 1 : Math.max(panjang[i + 1]![j]!, panjang[i]![j + 1]!);
    }
  }
  const hasil: BarisDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { hasil.push({ jenis: 'sama', teks: a[i]! }); i++; j++; }
    else if (panjang[i + 1]![j]! >= panjang[i]![j + 1]!) hasil.push({ jenis: 'hapus', teks: a[i++]! });
    else hasil.push({ jenis: 'tambah', teks: b[j++]! });
  }
  while (i < a.length) hasil.push({ jenis: 'hapus', teks: a[i++]! });
  while (j < b.length) hasil.push({ jenis: 'tambah', teks: b[j++]! });
  return hasil;
}
