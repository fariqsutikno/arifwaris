// packages/content/src/tulisBlok.ts
// Kebalikan bacaBlok/bacaPotongan: Blok[] → Markdown terbatas yang sama dengan bacaBlok. Dipakai ekspor lampiran
// dan editor portal (sunting sebagai Markdown, simpan sebagai Blok[]). Hukum: bacaBlok(tulisBlok(b)) = b.
import type { Blok, ContohKasus, Potongan } from './materi.js';

export function tulisBlok(daftar: Blok[]): string {
  return daftar.map(tulisSatuBlok).join('\n\n') + '\n';
}

export function tulisPotongan(daftar: Potongan[]): string {
  return daftar.map(potongan => {
    switch (potongan.jenis) {
      case 'teks': return potongan.teks;
      case 'tebal': return `**${potongan.teks}**`;
      case 'miring': return `*${potongan.teks}*`;
      case 'istilah': return potongan.teks === potongan.id ? `[[${potongan.id}]]` : `[[${potongan.id}|${potongan.teks}]]`;
      case 'rujukan': return `[${potongan.kode}]`;
    }
  }).join('');
}

function tulisSatuBlok(blok: Blok): string {
  switch (blok.jenis) {
    case 'judul': return `${'#'.repeat(blok.tingkat)} ${tulisPotongan(blok.isi)}`;
    case 'paragraf': return tulisPotongan(blok.isi);
    case 'catatan': return `> ${tulisPotongan(blok.isi)}`;
    case 'daftar': return blok.butir.map((butir, i) => `${blok.berurut ? `${i + 1}.` : '-'} ${tulisPotongan(butir)}`).join('\n');
    case 'tabel': return [
      barisTabel(blok.kepala), `|${blok.kepala.map(() => '---').join('|')}|`, ...blok.baris.map(barisTabel),
    ].join('\n');
    case 'kasus': return '```kasus\n' + tulisKasus(blok.kasus) + '\n```';
    case 'video': return '```video\n' + `https://www.youtube.com/watch?v=${blok.idYoutube}\njudul: ${blok.judul}` + '\n```';
    case 'kuis': return '```kuis\n' + blok.daftarKode.join(', ') + '\n```';
  }
}

const barisTabel = (sel: Potongan[][]) => `| ${sel.map(tulisPotongan).join(' | ')} |`;

function tulisKasus(kasus: ContohKasus): string {
  const saham = Object.entries(kasus.harapan.saham).map(([kunci, nilai]) => `${kunci} ${nilai}`).join(', ');
  return [`pewaris: ${kasus.pewaris}`, `ahli waris: ${ringkasAhliWaris(kasus.ahliWaris)}`, `harta: ${kasus.harta}`,
    `harapan: ${saham}; ashl ${kasus.harapan.ashlAkhir}`].join('\n');
}

/** Kebalikan bacaDaftarAhliWaris: ['ISTRI', 'ANAK_PR', 'ANAK_PR'] → "ISTRI, 2 ANAK_PR" (urutan dipertahankan). */
function ringkasAhliWaris(daftar: string[]): string {
  const kelompok: { kunci: string; jumlah: number }[] = [];
  for (const kunci of daftar) {
    const terakhir = kelompok.at(-1);
    if (terakhir?.kunci === kunci) terakhir.jumlah++;
    else kelompok.push({ kunci, jumlah: 1 });
  }
  return kelompok.map(({ kunci, jumlah }) => (jumlah === 1 ? kunci : `${jumlah} ${kunci}`)).join(', ');
}
