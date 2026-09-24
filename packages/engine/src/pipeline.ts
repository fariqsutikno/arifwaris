// Alur utama perhitungan waris (bab 00.2). Baca dari atas:
//   hitung()                    → cerita lengkap: harta → ahli waris → ashl → 'aul/radd → tashih → rupiah
//   jalankanTahapAhliWaris()    → bagian "siapa mewarisi dan dapat berapa" (tahap 1–2)
// Tiap tahap ada di stages/*.ts, menerima data dari tahap sebelumnya, dan menambah jejak (bukan kalimat).

import { hitungAshl } from './stages/ashl.js';
import { tetapkanBagian } from './stages/bagian.js';
import { turunkanPeran } from './stages/derivasi.js';
import { terapkanHajb } from './stages/hajb.js';
import { klasifikasikanMasalah } from './stages/klasifikasi.js';
import { terapkanMawani } from './stages/mawani.js';
import type { AhliWaris, KelompokBagian } from './stages/model.js';
import { bagikanNominal, susunTabel } from './stages/pembagian.js';
import { terapkanTashih } from './stages/tashih.js';
import { hitungTirkah } from './stages/tirkah.js';
import { validasiInput } from './stages/validasi.js';
import type { HasilEngine, IdOrang, InputEngine, LangkahJejak, PeranAhliWaris, StatusOrang } from './types.js';

type KeluarAwal = Extract<HasilEngine, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' }>;

export interface HasilTahapAhliWaris {
  status: 'AHLI_WARIS';
  statusOrang: Record<IdOrang, StatusOrang>;
  daftarKelompok: KelompokBagian[];
  jejak: LangkahJejak[];
  /** Ada dzawil arham yang hidup → sisa tanpa ahli radd jatuh ke fase 3, bukan baitul mal. */
  adaDzawilArham: boolean;
}

/** Pipeline lengkap (bab 00.2). */
export function hitung(input: InputEngine): HasilEngine {
  // 0. Harta bersih: tirkah dikurangi tajhiz, hutang, dan wasiat (maks. 1/3).
  const tirkah = hitungTirkah(input.tirkah);

  // 1–2. Siapa ahli warisnya dan apa bagiannya (fardh/ashabah).
  const ahliWaris = jalankanTahapAhliWaris(input);
  if (ahliWaris.status !== 'AHLI_WARIS') return ahliWaris;

  // 3. Ashl masalah: penyebut bersama semua fardh.
  const masalah = hitungAshl(ahliWaris.daftarKelompok);

  // 4. Cocokkan jumlah saham dengan ashl: pas ('adilah), lebih ('aul), atau kurang (radd).
  const klasifikasi = klasifikasikanMasalah(masalah, input.konfigurasi, ahliWaris.adaDzawilArham);
  if ('status' in klasifikasi) return klasifikasi;

  // 5. Tashih: perbesar ashl supaya saham tiap orang bulat.
  const tashih = terapkanTashih(ahliWaris.daftarKelompok, klasifikasi.saham, klasifikasi.dasar);

  // 6. Ubah saham jadi rupiah, dibulatkan ke bawah; sisa pembulatan dilaporkan terpisah.
  const nominal = bagikanNominal(tashih.perOrang, tashih.tashih, tirkah.bersih, input.pembulatan.satuan);

  return {
    status: 'OK',
    statusOrang: ahliWaris.statusOrang,
    tabel: susunTabel(masalah, klasifikasi, tashih, nominal.nominal, ahliWaris.statusOrang),
    jejak: [tirkah.jejak, ...ahliWaris.jejak, ...masalah.jejak, ...klasifikasi.jejak, ...tashih.jejak, ...nominal.jejak],
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    ruleset: input.ruleset,
    konfigurasi: input.konfigurasi,
    versiKb: input.versiKb,
  };
}

/** Tahap 1–2: peran → validasi → mawani' → hajb → furudh/ashabah (+ bab 07/08). */
export function jalankanTahapAhliWaris(input: InputEngine): HasilTahapAhliWaris | KeluarAwal {
  const { graf, konfigurasi } = input;
  const pewaris = graf.orang[graf.idPewaris];
  if (!pewaris) throw new Error(`idPewaris ${graf.idPewaris} tidak ada di graf`);
  if (pewaris.agama === 'nonIslam') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Pewaris non-muslim di luar cakupan platform.', refs: ['R02-4'] };
  }

  // 1a. Dari graf keluarga, tentukan peran tiap orang terhadap pewaris (anak, saudara, paman, ...).
  const { daftarPeran, duaJihah } = turunkanPeran(graf, konfigurasi);

  // Data kurang → tanya dulu, jangan menebak.
  const pertanyaan = validasiInput(input, daftarPeran);
  if (pertanyaan.length > 0) return { status: 'PERLU_INPUT', pertanyaan };
  if (duaJihah.length > 0) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Ahli waris dengan dua jihah (pasangan sekaligus kerabat): ${duaJihah.join(', ')}.`, refs: [] };
  }

  // 1b. Mawani': keluarkan pembunuh, beda agama, dst.
  const mawani = terapkanMawani(graf, daftarPeran);
  const kandidat = Object.values(mawani.statusOrang)
    .flatMap(status => (status.jenis === 'ahliWaris' && punyaKunciAhliWaris(status.peran) ? [status.peran] : []));
  const adaDzawilArham = Object.values(daftarPeran)
    .some(peran => peran.kunci === 'DZAWIL_ARHAM' && graf.orang[peran.idOrang]!.statusHidup === 'hidup');
  if (kandidat.length === 0) {
    return adaDzawilArham
      ? { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ashabul furudh/ashabah; pewarisan dzawil arham (fase 3).', refs: ['R14-4'] }
      : { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ahli waris; harta ke baitul mal.', refs: ['R02-1'] };
  }

  // 1c. Hajb hirman: yang lebih dekat menghalangi yang lebih jauh.
  const hajb = terapkanHajb(kandidat);
  const statusOrang = { ...mawani.statusOrang };
  for (const ahliWaris of kandidat) {
    const penghalang = hajb.mahjub[ahliWaris.idOrang];
    if (penghalang) statusOrang[ahliWaris.idOrang] = { jenis: 'mahjub', peran: ahliWaris, oleh: penghalang.oleh, rujukanAturan: penghalang.rujukanAturan };
  }

  // 2. Bagian tiap kelompok: fardh, ashabah, dan kasus khusus (bab 07/08).
  // Semua kandidat ikut dikirim karena yang mahjub tetap bisa mengurangi bagian orang lain [R06-6].
  const hasilBagian = tetapkanBagian(hajb.efektif, kandidat);
  if ('status' in hasilBagian) return hasilBagian;

  return {
    status: 'AHLI_WARIS', statusOrang, daftarKelompok: hasilBagian.daftarKelompok, adaDzawilArham,
    jejak: [...mawani.jejak, ...hajb.jejak, ...hasilBagian.jejak],
  };
}

const punyaKunciAhliWaris = (peran: PeranAhliWaris): peran is AhliWaris =>
  peran.kunci !== 'BUKAN_AHLI_WARIS' && peran.kunci !== 'DZAWIL_ARHAM';
