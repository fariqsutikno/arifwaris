// Alur utama perhitungan waris (bab 00.2). Baca dari atas:
//   hitung()                    → cerita lengkap: harta → ahli waris → ashl → 'aul/radd → tashih → rupiah
//   jalankanTahapAhliWaris()    → bagian "siapa mewarisi dan dapat berapa" (tahap 1–2)
// Tiap tahap ada di stages/*.ts, menerima data dari tahap sebelumnya, dan menambah jejak (bukan kalimat).

import { periksaKeberlakuan, periksaKonfigurasi } from './rulesets/gerbang.js';
import { ATURAN } from './rulesets/madzhab.js';
import { hitungAshl } from './stages/ashl.js';
import { tetapkanBagian } from './stages/bagian.js';
import { turunkanPeran } from './stages/derivasi.js';
import { terapkanHajb } from './stages/hajb.js';
import { klasifikasikanMasalah } from './stages/klasifikasi.js';
import { maniDari, terapkanMawani } from './stages/mawani.js';
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
  return hitungDenganTercakup(input, new Set());
}

/** Seperti `hitung`, tetapi gerbang 18.4 menganggap token `tercakup` sah (dipakai orkestrator dzawil arham). */
export function hitungDenganTercakup(input: InputEngine, tercakup: ReadonlySet<string>): HasilEngine {
  // 0. Harta bersih: tirkah dikurangi tajhiz, hutang, dan wasiat (maks. 1/3).
  const konfigurasiTidakSah = periksaKonfigurasi(input);
  if (konfigurasiTidakSah) return konfigurasiTidakSah;
  const tirkah = hitungTirkah(input.tirkah);

  // Janin, mafqud, dan khuntsa belum pasti: pipeline hanya menghitung dunia yang pasti (13.0b butir 2).
  const belumPasti = Object.values(input.graf.orang)
    .filter(orangIni => orangIni.statusHidup === 'dalamKandungan' || orangIni.statusHidup === 'mafqud' || orangIni.khuntsa);
  if (belumPasti.length > 0) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Status belum pasti (${belumPasti.map(orangIni => orangIni.id).join(', ')}); hitung lewat taqdir.`, refs: ['R13-4'], kode: 'PERLU_TAQDIR' };
  }

  // 1–2. Siapa ahli warisnya dan apa bagiannya (fardh/ashabah).
  const ahliWaris = jalankanTahapAhliWaris(input);
  if (ahliWaris.status !== 'AHLI_WARIS') return ahliWaris;

  // 3. Ashl masalah: penyebut bersama semua fardh.
  const masalah = hitungAshl(ahliWaris.daftarKelompok);

  // 4. Cocokkan jumlah saham dengan ashl: pas ('adilah), lebih ('aul), atau kurang (radd).
  const klasifikasi = klasifikasikanMasalah(masalah, input.konfigurasi, ahliWaris.adaDzawilArham);

  // 5. Tashih: perbesar ashl supaya saham tiap orang bulat.
  const tashih = terapkanTashih(ahliWaris.daftarKelompok, klasifikasi.saham, klasifikasi.dasar, klasifikasi.sisaKeluar?.saham);

  // 6. Ubah saham jadi rupiah, dibulatkan ke bawah; sisa pembulatan dilaporkan terpisah.
  const nominal = bagikanNominal(tashih.perOrang, tashih.tashih, tirkah.bersih, input.pembulatan.satuan);
  // Sisa yang keluar (hanya pasangan mewarisi): harta bersih × sisa ÷ tashih, dibulatkan ke bawah ke rupiah.
  const nominalSisaKeluar = klasifikasi.sisaKeluar ? tirkah.bersih * tashih.sisaKeluar / tashih.tashih : 0n;

  const hasil: Extract<HasilEngine, { status: 'OK' }> = {
    status: 'OK',
    statusOrang: ahliWaris.statusOrang,
    tabel: susunTabel(masalah, klasifikasi, tashih, nominal.nominal, ahliWaris.statusOrang),
    jejak: [tirkah.jejak, ...ahliWaris.jejak, ...masalah.jejak, ...klasifikasi.jejak, ...tashih.jejak, ...nominal.jejak],
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan - nominalSisaKeluar },
    ...(klasifikasi.sisaKeluar
      ? { sisaKeluar: { tujuan: klasifikasi.sisaKeluar.tujuan, saham: tashih.sisaKeluar, nominal: nominalSisaKeluar } }
      : {}),
    ruleset: input.ruleset,
    konfigurasi: input.konfigurasi,
    versiKb: input.versiKb,
  };
  // Gerbang 18.4: mode non-[SYF] menolak hasil yang menyentuh aturan yang belum dikaji.
  return periksaKeberlakuan(input.ruleset, hasil, tercakup) ?? hasil;
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
  const aturan = ATURAN[input.ruleset];
  const { daftarPeran, duaJihah, nenekDuaQarabah } = turunkanPeran(graf, konfigurasi, aturan);

  // Data kurang → tanya dulu, jangan menebak.
  const pertanyaan = validasiInput(input, daftarPeran);
  if (pertanyaan.length > 0) return { status: 'PERLU_INPUT', pertanyaan };
  if (duaJihah.length > 0) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Ahli waris dengan dua jihah (pasangan sekaligus kerabat): ${duaJihah.join(', ')}.`, refs: [] };
  }
  // [K04-3] [HNB]/[HNF] nenek dua qarabah mewarisi dengan tiap qarabah; [MLK] baru nukilan sekunder. Belum dimodelkan.
  if (input.ruleset !== 'syafii' && nenekDuaQarabah.length > 0) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Nenek dengan dua qarabah (${nenekDuaQarabah.join(', ')}) belum didukung untuk madzhab ini.`, refs: ['K04-3'] };
  }

  // 1b. Mawani': keluarkan pembunuh, beda agama, dst.
  const mawani = terapkanMawani(graf, daftarPeran, input.ruleset);
  const kandidat = Object.values(mawani.statusOrang)
    .flatMap(status => (status.jenis === 'ahliWaris' && punyaKunciAhliWaris(status.peran) ? [status.peran] : []));
  // Dzawil arham yang terhalang mawani' dianggap tidak ada (bab 02): sisa pasangan tidak ditahan untuknya.
  const adaDzawilArham = Object.values(daftarPeran)
    .some(peran => peran.kunci === 'DZAWIL_ARHAM' && graf.orang[peran.idOrang]!.statusHidup === 'hidup' && !maniDari(graf.orang[peran.idOrang]!));
  if (kandidat.length === 0) {
    return adaDzawilArham
      ? { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ashabul furudh/ashabah; pewarisan dzawil arham.', refs: ['R14-4'], kode: 'FASE_DZAWIL_ARHAM' }
      : { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ahli waris; harta ke baitul mal.', refs: ['R02-1'] };
  }

  // 1c. Hajb hirman: yang lebih dekat menghalangi yang lebih jauh.
  const hajb = terapkanHajb(kandidat, aturan);
  const statusOrang = { ...mawani.statusOrang };
  for (const ahliWaris of kandidat) {
    const penghalang = hajb.mahjub[ahliWaris.idOrang];
    if (penghalang) statusOrang[ahliWaris.idOrang] = { jenis: 'mahjub', peran: ahliWaris, oleh: penghalang.oleh, rujukanAturan: penghalang.rujukanAturan };
  }

  // 2. Bagian tiap kelompok: fardh, ashabah, dan kasus khusus (bab 07/08).
  // Semua kandidat ikut dikirim karena yang mahjub tetap bisa mengurangi bagian orang lain [R06-6].
  const hasilBagian = tetapkanBagian(hajb.efektif, kandidat, aturan);
  if ('status' in hasilBagian) return hasilBagian;

  return {
    status: 'AHLI_WARIS', statusOrang, daftarKelompok: hasilBagian.daftarKelompok, adaDzawilArham,
    jejak: [...mawani.jejak, ...hajb.jejak, ...hasilBagian.jejak],
  };
}

const punyaKunciAhliWaris = (peran: PeranAhliWaris): peran is AhliWaris =>
  peran.kunci !== 'BUKAN_AHLI_WARIS' && peran.kunci !== 'DZAWIL_ARHAM';
