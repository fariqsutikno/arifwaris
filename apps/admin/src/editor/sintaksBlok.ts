// Ringkasan sintaks blok pelajaran untuk panel "Sintaks blok" di portal (data, bukan JSX). Isinya ringkasan
// docs/materi-kit/format-materi.md: tiap blok ditulis di pagar tiga kutip terbalik dengan nama blok, lalu baris
// "kunci: nilai". Sumber lengkapnya tetap dokumen itu; ubah di sana dulu bila sintaksnya berubah.
export interface SintaksBlok { nama: string; fungsi: string; contoh: string }

export const SINTAKS_TEKS: { tulis: string; hasil: string }[] = [
  { tulis: '## Judul', hasil: 'Bagian utama; nomornya otomatis (jangan menulis nomor).' },
  { tulis: '### Judul', hasil: 'Sub-bagian (1a, 1b, ...). Dua bagian penutup selalu "Cek pemahaman" lalu "Ringkasnya".' },
  { tulis: '**tebal**  *miring*', hasil: 'Kata kunci (hemat) dan istilah Arab tanpa tooltip.' },
  { tulis: '[[hajb]]  [[hajb|terhalang]]', hasil: 'Istilah bertooltip dari glosarium; pakai di kemunculan pertama.' },
  { tulis: '[[>5-1-hajb]]  [[>5-1-hajb#4b]]  [[#4b]]', hasil: 'Tautan ke pelajaran lain, ke bagiannya, atau ke bagian di pelajaran ini.' },
];

export const SINTAKS_BLOK: SintaksBlok[] = [
  { nama: 'alur', fungsi: 'Wajib, sekali, blok pertama: di mana pelajaran ini dalam alur pembagian.',
    contoh: '```alur\ntahap: hajb\ntanya: Siapa yang gugur?\nbekal: daftar ahli waris yang sah\nhasil: daftar yang benar-benar mendapat\n```' },
  { nama: 'cara-berpikir', fungsi: 'Urutan pertanyaan keputusan; "->" memisahkan pertanyaan dan akibatnya (minimal 2 baris).',
    contoh: '```cara-berpikir\njudul: Urutan memeriksa\nAda anak laki-laki? -> semua saudara gugur\nAda ayah? -> semua saudara gugur\n```' },
  { nama: 'kasus', fungsi: 'Studi kasus bertabel; angka "harapan" dicocokkan dengan hasil hitung aplikasi.',
    contoh: '```kasus\ncerita: Pak Rahmat wafat meninggalkan istri dan anak.\npewaris: L\nahli waris: ISTRI, ANAK_LK\nharta: 120.000.000\nharapan: ISTRI 1, ANAK_LK 7; ashl 8\n```' },
  { nama: 'peraga', fungsi: 'Kotak harta yang bisa diganti keadaannya (2 sampai 4 keadaan); semua angka dihitung aplikasi.',
    contoh: '```peraga\npewaris: L\ntampil: kotak\nkeadaan: Tanpa anak\nahli waris: ISTRI, SAUDARA_KANDUNG\npenjelasan: Istri mendapat 1/4.\nkeadaan: Ada anak laki-laki\nahli waris: ISTRI, ANAK_LK\npenjelasan: Istri turun ke 1/8.\n```' },
  { nama: 'bandingan', fungsi: 'Batang pecahan dengan nilai ditulis tangan, untuk ahli waris yang tidak hadir bersamaan.',
    contoh: '```bandingan\nkolom: Tanpa anak | Ada anak\nSuami | 1/2 | 1/4\nIstri | 1/4 | 1/8\n```' },
  { nama: 'simulasi', fungsi: 'Pelajar mencentang kerabat; aplikasi menentukan siapa gugur (maksimal 10 pilihan).',
    contoh: '```simulasi\npewaris: L\npilihan: AYAH, ANAK_LK, SAUDARA_KANDUNG\nawal: AYAH, SAUDARA_KANDUNG\ntampil: status\n```' },
  { nama: 'peta', fungsi: 'Pohon konsep; menjorok 2 spasi = anak. "Judul | keterangan -> #bagian". Satu akar, paling banyak 12 simpul.',
    contoh: '```peta\nHajb | terhalang dari bagian\n  Nuqshan | bagian mengecil -> #4\n  Hirman | gugur total -> #5\n```' },
  { nama: 'ingat', fungsi: 'Cara mengingat: 2 sampai 4 butir "- kata kunci | penjelasan", boleh diakhiri "penutup:".',
    contoh: '```ingat\n- Lewat | perantaramu menutup jalanmu (5a)\n- Dekat | yang lebih dekat didahulukan (5b)\n```' },
  { nama: 'dasar', fungsi: 'Sumber dalil: satu kalimat untuk pelajar, lalu baris "rujukan:" berisi kode dari tabel Dasar dan Rujukan.',
    contoh: '```dasar\nDisepakati empat madzhab.\nrujukan: R06-2\n```' },
  { nama: 'tebak', fungsi: 'Pertanyaan sebelum penjelasan; jawabannya dibuka pelajar.',
    contoh: '```tebak\ntanya: Apakah kedua saudara mendapat warisan?\njawab: Tidak, selama ayah ada ([[#5d]]).\n```' },
  { nama: 'lipat', fungsi: 'Isi yang dilipat; baris pertama "judul:", sisanya Markdown biasa (tanpa blok berpagar).',
    contoh: '```lipat\njudul: Tabel lengkap\n| Terhalang | Oleh |\n|---|---|\n| Cucu | Anak laki-laki |\n```' },
  { nama: 'matriks', fungsi: 'Kisi 2x2 atau 2x3 dengan label kolom.',
    contoh: '```matriks\nkolom: Bisa menggugurkan | Tidak menggugurkan\nTidak bisa gugur | **Ayah, ibu** | **Suami, istri**\nBisa gugur | **Cucu, kakek** | **Saudara seibu**\n```' },
  { nama: 'video', fungsi: 'Tautan YouTube dengan judul, atau "menyusul:" bila videonya belum ada.',
    contoh: '```video\nmenyusul: Video 5 menit tentang lima kaidah hajb.\n```' },
  { nama: 'soal', fungsi: 'Soal cek pemahaman (2 sampai 4 per pelajaran); "*" menandai satu-satunya pilihan benar.',
    contoh: '```soal\nkode: K-5.1-1\ntingkat: dasar\ntanya: Berapa bagian ibu?\n- 1/3 | Belum, dua saudara menurunkannya.\n* 1/6 | Benar.\n- Tidak dapat | Ibu tidak pernah gugur.\npembahasan: Saudara menurunkan ibu walau mereka gugur.\nrujukan: R06-6\n```' },
  { nama: 'kasus-berkas', fungsi: 'Studi kasus lanjutan (munasakhat, haml, dan sejenisnya) dari berkas kasus Lab.',
    contoh: '```kasus-berkas\njudul: Studi kasus munasakhat\nberkas: 11-1-munasakhat.waris.json\nharapan: lihat berkas\n```' },
];
