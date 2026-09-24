import { hitungAshl } from './stages/ashl.js';
import { tetapkanBagian } from './stages/bagian.js';
import { turunkanPeran } from './stages/derivasi.js';
import { terapkanHajb } from './stages/hajb.js';
import { klasifikasikanMasalah } from './stages/klasifikasi.js';
import { terapkanMawani } from './stages/mawani.js';
import type { AhliWaris, KelompokBagian } from './stages/model.js';
import { susunTabel, bagikanNominal } from './stages/pembagian.js';
import { terapkanTashih } from './stages/tashih.js';
import { hitungTirkah } from './stages/tirkah.js';
import { validasiInput } from './stages/validasi.js';
import type { InputEngine, HasilEngine, PeranAhliWaris, IdOrang, StatusOrang, LangkahJejak } from './types.js';

type KeluarAwal = Extract<HasilEngine, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' }>;

export interface HasilTahapAhliWaris {
  status: 'AHLI_WARIS';
  statusOrang: Record<IdOrang, StatusOrang>;
  kelompokKelompok: KelompokBagian[];
  jejak: LangkahJejak[];
  /** Ada dzawil arham yang hidup → sisa tanpa ahli radd jatuh ke fase 3, bukan baitul mal. */
  adaDzawilArham: boolean;
}

const punyaKunciAhliWaris = (peran: PeranAhliWaris): peran is AhliWaris => peran.kunci !== 'BUKAN_AHLI_WARIS' && peran.kunci !== 'DZAWIL_ARHAM';

/** Tahap 1–2: derivasi peran → validasi → mawani' → hajb → furudh/ashabah (+ bab 07/08). */
export function jalankanTahapAhliWaris(input: InputEngine): HasilTahapAhliWaris | KeluarAwal {
  const { graf, konfigurasi } = input;
  const pewaris = graf.orang[graf.idPewaris];
  if (!pewaris) throw new Error(`idPewaris ${graf.idPewaris} tidak ada di graf`);
  if (pewaris.agama === 'nonIslam') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Pewaris non-muslim di luar cakupan platform.', refs: ['R02-4'] };
  }

  const { daftarPeran, duaJihah } = turunkanPeran(graf, konfigurasi);
  const pertanyaan = validasiInput(input, daftarPeran);
  if (pertanyaan.length > 0) return { status: 'PERLU_INPUT', pertanyaan };
  if (duaJihah.length > 0) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Ahli waris dengan dua jihah (pasangan sekaligus kerabat): ${duaJihah.join(', ')}.`, refs: [] };
  }

  const mawani = terapkanMawani(graf, daftarPeran);
  const kandidat = Object.values(mawani.statusOrang)
    .flatMap(s => (s.jenis === 'ahliWaris' && punyaKunciAhliWaris(s.peran) ? [s.peran] : []));
  const adaDzawilArham = Object.values(daftarPeran)
    .some(r => r.kunci === 'DZAWIL_ARHAM' && graf.orang[r.idOrang]!.statusHidup === 'hidup');
  if (kandidat.length === 0) {
    return adaDzawilArham
      ? { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ashabul furudh/ashabah; pewarisan dzawil arham (fase 3).', refs: ['R14-4'] }
      : { status: 'TIDAK_DIDUKUNG', alasan: 'Tidak ada ahli waris; harta ke baitul mal.', refs: ['R02-1'] };
  }

  const hajb = terapkanHajb(kandidat);
  const statusOrang = { ...mawani.statusOrang };
  for (const ahliWaris of kandidat) {
    const terhalang = hajb.mahjub[ahliWaris.idOrang];
    if (terhalang) statusOrang[ahliWaris.idOrang] = { jenis: 'mahjub', peran: ahliWaris, oleh: terhalang.oleh, rujukanAturan: terhalang.rujukanAturan };
  }

  const hasilBagian = tetapkanBagian(hajb.efektif, kandidat);
  if ('status' in hasilBagian) return hasilBagian;

  return {
    status: 'AHLI_WARIS', statusOrang, kelompokKelompok: hasilBagian.kelompokKelompok, adaDzawilArham,
    jejak: [...mawani.jejak, ...hajb.jejak, ...hasilBagian.jejak],
  };
}

/** Pipeline lengkap (bab 00.2): tirkah → ahli waris & bagian → ashl → 'aul/radd → tashih → nominal. */
export function hitung(input: InputEngine): HasilEngine {
  const daftarAhliWaris = jalankanTahapAhliWaris(input);
  if (daftarAhliWaris.status !== 'AHLI_WARIS') return daftarAhliWaris;

  const tirkah = hitungTirkah(input.tirkah);
  const masalah = hitungAshl(daftarAhliWaris.kelompokKelompok);
  const classified = klasifikasikanMasalah(masalah, input.konfigurasi, daftarAhliWaris.adaDzawilArham);
  if ('status' in classified) return classified;
  const tashih = terapkanTashih(daftarAhliWaris.kelompokKelompok, classified.saham, classified.dasar);
  const nominal = bagikanNominal(tashih.perOrang, tashih.tashih, tirkah.bersih, input.pembulatan.satuan);

  return {
    status: 'OK',
    statusOrang: daftarAhliWaris.statusOrang,
    tabel: susunTabel(masalah, classified, tashih, nominal.nominal, daftarAhliWaris.statusOrang),
    jejak: [tirkah.jejak, ...daftarAhliWaris.jejak, ...masalah.jejak, ...classified.jejak, ...tashih.jejak, ...nominal.jejak],
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    ruleset: input.ruleset,
    konfigurasi: input.konfigurasi,
    versiKb: input.versiKb,
  };
}
