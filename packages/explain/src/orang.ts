// Penjelasan satu orang untuk modal (mockup-hasil-per-kasus: Dasar → Di keluarga ini → Hitungan), memakai kalimat skrip
// yang sama dengan Langkah demi langkah. Menerima hasil engine + graf + id orang; menyerahkan blok teks
// berjenis (pertanyaan judul, dasar, keluarga, hitungan berlabel). Kasus yang belum dipetakan → undefined, UI memakai cara lama.
// Dalil Arab dan tabel "kapan dapat berapa" tetap dari konten web; modul ini hanya kalimatnya.

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { persamaanKotakAshl } from './cerita.js';
import { buatKonteks, type HasilOk, type Konteks } from './context.js';
import { rupiah } from './format.js';
import { barisAshabah, barisFardh, bagianDipetakan } from './skrip.js';
import { barisSkrip, susun, teksKamus, type BarisPenjelasan, type Kamus, type Potongan } from './segments.js';
import { istilahNarasi } from './terms.js';

export interface BarisHitungan { label: string; isi: Potongan[] }
export interface PenjelasanOrang {
  /** Judul blok "Kenapa …?". */
  pertanyaan: Potongan[];
  dasar: BarisPenjelasan[];
  keluarga: BarisPenjelasan[];
  hitungan: BarisHitungan[];
}

const kunci = (nama: string) => `narasi.langkah.orang.${nama}`;

export function jelaskanOrang(hasil: HasilOk, graf: GrafKeluarga, idOrang: IdOrang, opsi: { kamus: Kamus }): PenjelasanOrang | undefined {
  const konteks = buatKonteks(hasil, graf, { kamus: opsi.kamus, bahasa: 'id' });
  if (!bagianDipetakan(konteks)) return undefined;
  const barisTabel = hasil.tabel.baris.find(baris => baris.anggota.includes(idOrang));
  if (barisTabel) return orangMenerima(konteks, idOrang, barisTabel.kelompok);
  return orangTerhalang(konteks, idOrang);
}

function orangMenerima(konteks: Konteks, idOrang: IdOrang, kelompok: string): PenjelasanOrang | undefined {
  const { penyusun } = konteks;
  const pewaris = konteks.sebutan.pewaris();
  // Akdariyyah: satu kelompok punya dua langkah fardh (kakek, saudari); pilih menurut peran orang ini.
  const kandidat = konteks.daftarLangkah('FARDH').filter(satu => satu.kelompok === kelompok);
  const adalahKakek = konteks.sebutan.peranDari(idOrang)?.kunci === 'KAKEK';
  const fardh = kandidat.length > 1 ? kandidat.find(satu => satu.alasan.kode === 'AKDARIYYAH' && (satu.alasan.porsi === 'jadd') === adalahKakek) : kandidat[0];
  const ashabah = konteks.daftarLangkah('ASHABAH').find(satu => satu.kelompok === kelompok);
  const baris = fardh
    ? barisFardh(konteks, fardh, pewaris)
    : ashabah ? [...barisAshabah(konteks, ashabah), barisSkrip(penyusun, 'dasar', 'bagian.dasar_fardh', {}, {})] : undefined;
  if (!baris) return undefined;
  const nuqshan = fardh && konteks.daftarLangkah('HAJB_NUQSHAN').find(satu => konteks.anggotaDari(kelompok).includes(satu.terdampak));
  const pertanyaan = fardh?.alasan.kode === 'AKDARIYYAH'
    ? susun(penyusun, kunci('pertanyaan.khusus'))
    : fardh
    ? susun(penyusun, kunci(nuqshan ? 'pertanyaan.nuqshan' : 'pertanyaan.fardh'), nuqshan ? { pecahan: fardh.fardh, dari: nuqshan.dari } : { pecahan: fardh.fardh })
    : susun(penyusun, kunci('pertanyaan.ashabah'));
  return {
    pertanyaan,
    dasar: baris.filter(satu => satu.jenis === 'dasar'),
    keluarga: baris.filter(satu => satu.jenis === 'keluarga'),
    hitungan: hitunganOrang(konteks, idOrang, kelompok),
  };
}

function orangTerhalang(konteks: Konteks, idOrang: IdOrang): PenjelasanOrang | undefined {
  const hajb = konteks.daftarLangkah('HAJB_HIRMAN').find(satu => satu.mahjub === idOrang);
  if (!hajb) return undefined;
  const { penyusun } = konteks;
  const sebutMahjub = konteks.sebutan.sebut([idOrang]);
  const sebutHajib = konteks.sebutan.sebut(hajb.hajib);
  return {
    pertanyaan: susun(penyusun, kunci('pertanyaan.terhalang')),
    dasar: [barisSkrip(penyusun, 'dasar', 'ahli_waris.dasar_hajb', { hajb_hirman: istilahNarasi(penyusun, 'hajb-hirman') }, {}, hajb.refs)],
    keluarga: [barisSkrip(penyusun, 'keluarga', 'ahli_waris.terhalang', { mahjub: sebutMahjub, hajib: sebutHajib }, { hajib: sebutHajib, mahjub: sebutMahjub }, hajb.refs, [idOrang])],
    hitungan: [],
  };
}

/** Rantai angka orang ini: potongan asal masalah → ('aul/radd) → tashih → bagian akhir → rupiah. Hanya hisab; tidak ada aturan baru. */
function hitunganOrang(konteks: Konteks, idOrang: IdOrang, kelompok: string): BarisHitungan[] {
  const { penyusun } = konteks;
  const { tabel, pembulatan } = konteks.hasil;
  const barisTabel = tabel.baris.find(baris => baris.kelompok === kelompok)!;
  const orang = barisTabel.perOrang[idOrang]!;
  const label = (nama: string) => teksKamus(penyusun, kunci(`label.${nama}`));
  const daftar: BarisHitungan[] = [];
  const persamaan = persamaanKotakAshl(konteks).find(satu => satu.kelompok === kelompok);
  if (persamaan?.baris.papan) daftar.push({ label: label('asal'), isi: persamaan.baris.papan });
  const ashl = tabel.totalKolom.ashl!;
  if (tabel.totalKolom.aul !== undefined) {
    daftar.push({ label: label('aul'), isi: susun(penyusun, kunci('aul'), { kotak: barisTabel.sel['ashl']!, ashl, aul: tabel.totalKolom.aul }) });
  }
  if (tabel.totalKolom.radd !== undefined) {
    daftar.push({ label: label('radd'), isi: susun(penyusun, kunci('radd'), { kotak: barisTabel.sel['ashl']!, ashl, saham: barisTabel.sel['radd']!, radd: tabel.totalKolom.radd }) });
  }
  const [tashih] = konteks.daftarLangkah('TASHIH');
  if (tashih && tabel.totalKolom.tashih !== undefined) {
    const kolomSebelum = tabel.totalKolom.aul !== undefined ? 'aul' : tabel.totalKolom.radd !== undefined ? 'radd' : 'ashl';
    daftar.push({ label: label('tashih'), isi: susun(penyusun, kunci('tashih'),
      { dasar: barisTabel.sel[kolomSebelum]!, pengali: tashih.juzSahm, total: barisTabel.sel['tashih']!, saham: orang.saham }) });
  }
  daftar.push({ label: label('bagian'), isi: susun(penyusun, kunci('bagian'), { saham: orang.saham, penyebut: konteks.penyebutAkhir }) });
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  if (konteks.tampilkanNominal && tirkah && pembulatan) {
    daftar.push({ label: label('rupiah'), isi: susun(penyusun, kunci('rupiah'),
      { saham: orang.saham, penyebut: konteks.penyebutAkhir, bersih: rupiah(tirkah.bersih), nominal: rupiah(orang.nominal) }) });
  }
  return daftar;
}
