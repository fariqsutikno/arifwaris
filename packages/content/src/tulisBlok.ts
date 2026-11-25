// packages/content/src/tulisBlok.ts
// Kebalikan bacaBlok/bacaPotongan/bacaPelajaran: Blok[] → Markdown terbatas yang sama (docs/materi-kit/format-materi.md).
// Dipakai ekspor lampiran dan editor portal (sunting sebagai Markdown, simpan sebagai Blok[]).
// Hukum: bacaBlok(tulisBlok(b)) = b dan bacaPelajaran(tulisPelajaran(p)) = p.
import type { Blok, ContohKasus, NilaiBagian, Pelajaran, Potongan, SimpulPeta } from './materi.js';

export function tulisPelajaran(pelajaran: Pelajaran): string {
  const kepala = [
    `slug: ${pelajaran.slug}`, `modul: ${pelajaran.modul}`, `urutan: ${pelajaran.urutan}`, `judul: ${pelajaran.judul}`,
    `tujuan: ${pelajaran.tujuan}`, `durasi: ${pelajaran.durasi ?? ''}`, `tahap: ${pelajaran.tahap ?? ''}`,
    `prasyarat: ${(pelajaran.prasyarat ?? []).join(', ')}`, `singgung: ${(pelajaran.singgung ?? []).join(', ')}`,
  ];
  return `---\n${kepala.join('\n')}\n---\n\n${tulisBlok(pelajaran.blok)}`;
}

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
      case 'tautanPelajaran': return `[[>${potongan.slug}${potongan.bagian ? `#${potongan.bagian}` : ''}${potongan.teks === undefined ? '' : `|${potongan.teks}`}]]`;
      case 'tautanBagian': return `[[#${potongan.bagian}${potongan.teks === undefined ? '' : `|${potongan.teks}`}]]`;
    }
  }).join('');
}

const pagar = (nama: string, baris: (string | undefined)[]) => '```' + nama + '\n' + baris.filter(isi => isi !== undefined).join('\n') + '\n```';
const isianBila = (kunci: string, nilai: string | undefined) => (nilai === undefined ? undefined : `${kunci}: ${nilai}`);
const isianPotongan = (kunci: string, nilai: Potongan[] | undefined) => isianBila(kunci, nilai && tulisPotongan(nilai));

function tulisSatuBlok(blok: Blok): string {
  switch (blok.jenis) {
    case 'judul': return `${'#'.repeat(blok.tingkat)} ${tulisPotongan(blok.isi)}`;
    case 'paragraf': return tulisPotongan(blok.isi);
    case 'catatan': return `> ${tulisPotongan(blok.isi)}`;
    case 'daftar': return blok.butir.map((butir, i) => `${blok.berurut ? `${i + 1}.` : '-'} ${tulisPotongan(butir)}`).join('\n');
    case 'tabel': return [
      barisTabel(blok.kepala), `|${blok.kepala.map(() => '---').join('|')}|`, ...blok.baris.map(barisTabel),
    ].join('\n');
    case 'kasus': return pagar('kasus', [
      isianBila('judul', blok.judul), isianPotongan('cerita', blok.cerita), ...tulisKasus(blok.kasus),
      ...Object.entries(blok.keterangan ?? {}).map(([kunci, isi]) => `keterangan: ${kunci} ${tulisPotongan(isi)}`),
    ]);
    case 'kasusBerkas': return pagar('kasus-berkas', [isianBila('judul', blok.judul), isianPotongan('cerita', blok.cerita), `berkas: ${blok.berkas}`]);
    case 'video': return pagar('video', [`https://www.youtube.com/watch?v=${blok.idYoutube}`, `judul: ${blok.judul}`]);
    case 'videoMenyusul': return pagar('video', [`menyusul: ${blok.rencana}`]);
    case 'kuis': return pagar('kuis', [blok.daftarKode.join(', ')]);
    case 'alur': return pagar('alur', [`tahap: ${blok.tahap}`, isianPotongan('tanya', blok.tanya), isianPotongan('bekal', blok.bekal), isianPotongan('hasil', blok.hasil)]);
    case 'caraBerpikir': return pagar('cara-berpikir', [isianBila('judul', blok.judul), ...blok.langkah.map(langkah => `${tulisPotongan(langkah.tanya)} -> ${tulisPotongan(langkah.akibat)}`)]);
    case 'peraga': {
      const pewarisBlok = blok.keadaan[0]!.pewaris;
      return pagar('peraga', [
        isianBila('judul', blok.judul), isianPotongan('pengantar', blok.pengantar), `pewaris: ${pewarisBlok}`, `tampil: ${blok.tampil}`,
        ...blok.keadaan.flatMap(keadaan => [
          `keadaan: ${keadaan.label}`, keadaan.pewaris === pewarisBlok ? undefined : `pewaris: ${keadaan.pewaris}`,
          `ahli waris: ${ringkasAhliWaris(keadaan.ahliWaris)}`, `penjelasan: ${tulisPotongan(keadaan.penjelasan)}`,
        ]),
      ]);
    }
    case 'bandingan': return pagar('bandingan', [
      isianBila('judul', blok.judul), `kolom: ${blok.kolom.join(' | ')}`,
      ...blok.baris.map(baris => [baris.nama, ...baris.nilai.map(tulisNilaiBagian)].join(' | ')), isianPotongan('catatan', blok.catatan),
    ]);
    case 'simulasi': return pagar('simulasi', [
      isianBila('judul', blok.judul), `pewaris: ${blok.pewaris}`, `pilihan: ${blok.pilihan.join(', ')}`,
      `awal: ${blok.awal.join(', ')}`, `tampil: ${blok.tampil}`,
    ]);
    case 'peta': return pagar('peta', tulisSimpulPeta(blok.akar, 0));
    case 'ingat': return pagar('ingat', [
      isianBila('judul', blok.judul), ...blok.butir.map(butir => `- ${butir.kunci} | ${tulisPotongan(butir.penjelasan)}`), isianPotongan('penutup', blok.penutup),
    ]);
    case 'dasar': return pagar('dasar', [tulisPotongan(blok.isi), `rujukan: ${blok.rujukan.join(', ')}`]);
    case 'tebak': return pagar('tebak', [`tanya: ${tulisPotongan(blok.tanya)}`, `jawab: ${tulisPotongan(blok.jawab)}`]);
    case 'lipat': return pagar('lipat', [`judul: ${blok.judul}`, tulisBlok(blok.blok).trimEnd()]);
    case 'matriks': return pagar('matriks', [`kolom: ${blok.kolom.join(' | ')}`, ...blok.baris.map(baris => [baris.label, ...baris.sel.map(tulisPotongan)].join(' | '))]);
    case 'soal': return pagar('soal', [
      `kode: ${blok.soal.kode}`, `tingkat: ${blok.soal.tingkat}`, `tanya: ${tulisPotongan(blok.soal.pertanyaan)}`,
      ...blok.soal.pilihan.map((pilihan, i) => `${i === blok.soal.indeksBenar ? '*' : '-'} ${tulisPotongan(pilihan)} | ${tulisPotongan(blok.soal.alasanPilihan[i]!)}`),
      `pembahasan: ${tulisPotongan(blok.soal.pembahasan)}`, `rujukan: ${blok.rujukan.join(', ')}`,
    ]);
  }
}

const barisTabel = (sel: Potongan[][]) => `| ${sel.map(tulisPotongan).join(' | ')} |`;

function tulisKasus(kasus: ContohKasus): string[] {
  const saham = Object.entries(kasus.harapan.saham).map(([kunci, nilai]) => `${kunci} ${nilai}`).join(', ');
  return [`pewaris: ${kasus.pewaris}`, `ahli waris: ${ringkasAhliWaris(kasus.ahliWaris)}`, `harta: ${kasus.harta}`,
    `harapan: ${saham}; ashl ${kasus.harapan.ashlAkhir}`];
}

function tulisNilaiBagian(nilai: NilaiBagian): string {
  if (nilai.gugur) return 'gugur';
  if (nilai.sepertigaSisa) return '1/3 sisa';
  if (!nilai.pecahan) return 'sisa';
  return `${nilai.pecahan[0]}/${nilai.pecahan[1]}${nilai.sisa ? ' + sisa' : ''}`;
}

const JOROK_PETA = '  ';

function tulisSimpulPeta(simpul: SimpulPeta, tingkat: number): string[] {
  const isi = `${simpul.judul}${simpul.keterangan ? ` | ${simpul.keterangan}` : ''}${simpul.tujuan ? ` -> #${simpul.tujuan}` : ''}`;
  return [JOROK_PETA.repeat(tingkat) + isi, ...simpul.anak.flatMap(anak => tulisSimpulPeta(anak, tingkat + 1))];
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
