// Kode `K1-…` → objek SoalKuis lengkap (pertanyaan, pilihan beralasan, pembahasan, rujukan). Tidak disimpan: dibangun
// ulang dari kode. Kalimat tetap berasal dari diksi (`soal_kuis.*`, kamus lewat `penyusun`); alasan pilihan benar dan
// pembahasan memakai narasi engine (`jelaskanOrang`) bila kasusnya terpetakan, selain itu templat dari data jejak.

import type { Potongan, SoalKuis } from '@waris/content';
import { jelaskanOrang, teksKamus, type Penyusun } from '@waris/explain';
import type { KunciAhliWaris } from '@waris/engine';
import { URUTAN_KUNCI } from '../kodeBiasa.js';
import type { KodeGalatSoal } from '../kodeBiasa.js';
import { ATURAN_PENGECOH, type AturanPengecoh, type BahanAlasan } from './aturanPengecoh.js';
import { analisisKasus, tingkatKuis, type AnalisisKasus } from './analisis.js';
import { daftarPertanyaan, kunciAshabah, type FaktaKasus, type Jawaban } from './fakta.js';
import { uraiKodeKuis, type JenisPertanyaan, type PertanyaanKuis } from './kodeKuis.js';
import { rakitPilihan } from './rakitPilihan.js';

/** Soal mesin tak punya bab KB tunggal; modul kurikulum dibawa terpisah. */
const BAB_SOAL_MESIN = 0;
export const SUMBER_SOAL_MESIN = 'mesin';

export type SoalKuisMesin = SoalKuis & { modul: number[]; jenisPertanyaan: JenisPertanyaan; aturan: AturanPengecoh[]; label: string[] };
export type AlasanBuangKuis = 'PERTANYAAN_TIDAK_SAH' | 'PENGECOH_KURANG' | Extract<AnalisisKasus, { ok: false }>['galat'];
export type HasilSoalKuis = { ok: true; soal: SoalKuisMesin } | { ok: false; galat: KodeGalatSoal | AlasanBuangKuis };

/** Kunci diksi alasan tiap pengecoh, ditulis literal supaya tes cakupan diksi bisa memeriksanya. */
const KUNCI_ALASAN_PENGECOH = {
  lupaAul: 'soal_kuis.pengecoh.lupa_aul',
  lupaRaddKosong: 'soal_kuis.pengecoh.lupa_radd',
  lupaHajbGugur: 'soal_kuis.pengecoh.lupa_hajb.gugur',
  lupaHajbAshabah: 'soal_kuis.pengecoh.lupa_hajb.ashabah',
  ibuFaruWarits: 'soal_kuis.pengecoh.ibu_tetap_sepertiga.faru_warits',
  ibuJamIkhwah: 'soal_kuis.pengecoh.ibu_tetap_sepertiga.jam_ikhwah',
  pasanganAdaKeturunan: 'soal_kuis.pengecoh.pasangan_tertukar.ada_keturunan',
  pasanganTanpaKeturunan: 'soal_kuis.pengecoh.pasangan_tertukar.tanpa_keturunan',
  ashabahSamaRata: 'soal_kuis.pengecoh.ashabah_sama_rata',
  ashabahTerbalikGugur: 'soal_kuis.pengecoh.ashabah_terbalik.gugur',
  ashabahTerbalikAshabah: 'soal_kuis.pengecoh.ashabah_terbalik.ashabah',
} as const;

export function soalKuisDariKode(kode: string, penyusun: Penyusun): HasilSoalKuis {
  const urai = uraiKodeKuis(kode);
  if (!urai.ok) return urai;
  const analisis = analisisKasus(urai.kasus);
  if (!analisis.ok) return analisis;
  const { fakta, tingkat } = analisis;
  if (!daftarPertanyaan(fakta).some(isi => isi.jenis === urai.tanya.jenis && (isi.jenis !== 'bagian' || isi.kunci === (urai.tanya as { kunci?: string }).kunci))) {
    return { ok: false, galat: 'PERTANYAAN_TIDAK_SAH' };
  }
  const pilihan = rakitPilihan(kode, fakta, urai.tanya);
  if (!pilihan) return { ok: false, galat: 'PENGECOH_KURANG' };

  const teks = (kunci: string, sisipan: Record<string, string> = {}) => teksKamus(penyusun, kunci, sisipan);
  const tepat = teks('soal_kuis.alasan.tepat');
  const belumTepat = teks('soal_kuis.alasan.belum_tepat');
  const benar = narasiBenar(penyusun, analisis, urai.tanya);
  const alasan = pilihan.urutan.map(isi => {
    if (!isi.pengecoh) return [teksPotongan(`${tepat} ${benar.alasan}`), ...rujukan(benar.refs)];
    const aturan = ATURAN_PENGECOH.find(satu => satu.id === isi.pengecoh!.aturan)!;
    return [teksPotongan(`${belumTepat} ${kapital(kalimatPengecoh(penyusun, isi.pengecoh!.bahan))}`), ...rujukan(aturan.dasar)];
  });
  const refsPembahasan = [...new Set([...benar.refs])];
  return {
    ok: true,
    soal: {
      kode, bab: BAB_SOAL_MESIN, tingkat: tingkatKuis(tingkat, urai.tanya.jenis), sumber: SUMBER_SOAL_MESIN,
      pertanyaan: [teksPotongan(kalimatPertanyaan(penyusun, analisis, urai.tanya))],
      pilihan: pilihan.urutan.map(isi => [teksPotongan(teksJawaban(penyusun, isi.jawaban))]),
      indeksBenar: pilihan.urutan.findIndex(isi => !isi.pengecoh),
      pembahasan: [teksPotongan(benar.pembahasan), ...rujukan(refsPembahasan)],
      alasanPilihan: alasan,
      modul: analisis.modul, jenisPertanyaan: urai.tanya.jenis, aturan: pilihan.pengecoh.map(isi => isi.aturan), label: analisis.label,
    },
  };
}

const kapital = (teks: string) => teks.charAt(0).toUpperCase() + teks.slice(1);
const teksPotongan = (teks: string): Potongan => ({ jenis: 'teks', teks });
const rujukan = (kode: readonly string[]): Potongan[] => kode.flatMap(isi => [teksPotongan(' '), { jenis: 'rujukan' as const, kode: isi }]);

const namaKunci = (penyusun: Penyusun, kunci: KunciAhliWaris) => teksKamus(penyusun, `narasi.umum.ahli_waris.${kunci.toLowerCase()}`);

function gabungNama(penyusun: Penyusun, nama: string[]): string {
  if (nama.length <= 1) return nama.join('');
  const penghubung = teksKamus(penyusun, nama.length > 2 ? 'narasi.umum.penghubung.dan_terakhir' : 'narasi.umum.penghubung.dan');
  return `${nama.slice(0, -1).join(', ')}${penghubung}${nama.at(-1)}`;
}

function kalimatPertanyaan(penyusun: Penyusun, { fakta }: { fakta: FaktaKasus }, tanya: PertanyaanKuis): string {
  const { kasus } = fakta;
  const daftar = URUTAN_KUNCI.filter(kunci => kasus.ahliWaris[kunci]).map(kunci => {
    const jumlah = kasus.ahliWaris[kunci]!;
    return jumlah > 1 ? teksKamus(penyusun, 'soal_kuis.daftar.jumlah', { jumlah: String(jumlah), nama: namaKunci(penyusun, kunci) }) : namaKunci(penyusun, kunci);
  });
  const kasusTeks = teksKamus(penyusun, 'soal_kuis.pertanyaan.kasus', { pewaris: teksKamus(penyusun, kasus.pewaris === 'L' ? 'soal_kuis.pewaris.l' : 'soal_kuis.pewaris.p'), daftar: gabungNama(penyusun, daftar) });
  const tanyaTeks = {
    bagian: () => {
      const banyak = (kasus.ahliWaris[(tanya as { kunci: KunciAhliWaris }).kunci] ?? 0) > 1;
      return teksKamus(penyusun, banyak ? 'soal_kuis.tanya.bagian_banyak' : 'soal_kuis.tanya.bagian', { siapa: namaKunci(penyusun, (tanya as { kunci: KunciAhliWaris }).kunci) });
    },
    gugur: () => teksKamus(penyusun, 'soal_kuis.tanya.gugur'),
    ashlAkhir: () => teksKamus(penyusun, 'soal_kuis.tanya.ashl_akhir'),
    ashabah: () => teksKamus(penyusun, 'soal_kuis.tanya.ashabah'),
  }[tanya.jenis]();
  return `${kasusTeks} ${tanyaTeks}`;
}

function teksJawaban(penyusun: Penyusun, jawaban: Jawaban): string {
  if (jawaban.tipe === 'pecahan') return `${jawaban.nilai.n}/${jawaban.nilai.d}`;
  if (jawaban.tipe === 'penyebut') return String(jawaban.nilai);
  return jawaban.nilai.length === 0 ? teksKamus(penyusun, 'soal_kuis.pilihan.tidak_ada_gugur') : gabungNama(penyusun, jawaban.nilai.map(kunci => namaKunci(penyusun, kunci)));
}

function kalimatPengecoh(penyusun: Penyusun, bahan: BahanAlasan): string {
  const nama = (daftar: KunciAhliWaris[]) => gabungNama(penyusun, daftar.map(kunci => namaKunci(penyusun, kunci)));
  const teks = (kunci: string, sisipan: Record<string, string> = {}) => teksKamus(penyusun, kunci, sisipan);
  switch (bahan.aturan) {
    case 'lupaAul': return teks(KUNCI_ALASAN_PENGECOH.lupaAul, { ashl: String(bahan.ashl), aul: String(bahan.aul) });
    case 'lupaRadd': return teks(KUNCI_ALASAN_PENGECOH.lupaRaddKosong, { ashl: String(bahan.ashl), radd: String(bahan.radd) });
    case 'lupaHajb': return teks(bahan.tanya === 'gugur' ? KUNCI_ALASAN_PENGECOH.lupaHajbGugur : KUNCI_ALASAN_PENGECOH.lupaHajbAshabah, { mahjub: nama([bahan.mahjub]), hajib: nama(bahan.hajib) });
    case 'ibuTetapSepertiga': return teks(bahan.sebab === 'jamIkhwah' ? KUNCI_ALASAN_PENGECOH.ibuJamIkhwah : KUNCI_ALASAN_PENGECOH.ibuFaruWarits);
    case 'pasanganTertukar': return teks(bahan.sebab === 'adaKeturunan' ? KUNCI_ALASAN_PENGECOH.pasanganAdaKeturunan : KUNCI_ALASAN_PENGECOH.pasanganTanpaKeturunan,
      { pasangan: nama([bahan.pasangan]), benar: `${bahan.benar.n}/${bahan.benar.d}`, keliru: `${bahan.keliru.n}/${bahan.keliru.d}` });
    case 'ashabahSamaRata': return teks(KUNCI_ALASAN_PENGECOH.ashabahSamaRata);
    case 'ashabahTerbalik': return teks(bahan.tanya === 'gugur' ? KUNCI_ALASAN_PENGECOH.ashabahTerbalikGugur : KUNCI_ALASAN_PENGECOH.ashabahTerbalikAshabah,
      { kalah: nama([bahan.kalah]), kuat: nama(bahan.kuat) });
  }
}

// ─── Alasan pilihan benar dan pembahasan ──────────────────────────────────────

type Narasi = { alasan: string; pembahasan: string; refs: string[] };

function narasiBenar(penyusun: Penyusun, analisis: Extract<AnalisisKasus, { ok: true }>, tanya: PertanyaanKuis): Narasi {
  const { fakta, hasil, kasus } = analisis;
  if (tanya.jenis === 'ashlAkhir') return narasiPenyebut(penyusun, fakta);
  const kunciSasaran = tanya.jenis === 'bagian' ? tanya.kunci : tanya.jenis === 'gugur' ? fakta.mahjub[0]!.kunci : kunciAshabah(fakta)[0]!;
  const idOrang = fakta.idPerKunci[kunciSasaran]![0]!;
  const orang = jelaskanOrang(hasil, kasus.graf, idOrang, { kamus: penyusun.kamus });
  const siapa = namaKunci(penyusun, kunciSasaran);
  if (!orang) {
    const kunciTemplat = { bagian: 'soal_kuis.benar.bagian', gugur: 'soal_kuis.benar.gugur', ashabah: 'soal_kuis.benar.ashabah' }[tanya.jenis];
    const sisipan = tanya.jenis === 'gugur' ? { mahjub: siapa, hajib: gabungNama(penyusun, fakta.mahjub[0]!.hajib.map(kunci => namaKunci(penyusun, kunci))) } : { siapa };
    const kalimat = teksKamus(penyusun, kunciTemplat, sisipan);
    return { alasan: kalimat, pembahasan: kalimat, refs: [] };
  }
  const baris = [...orang.dasar, ...orang.keluarga];
  const teksBaris = (daftar: typeof baris) => daftar.map(isi => isi.daftarPotongan.map(potongan => potongan.teks).join('')).join(' ');
  // Soal tidak menyebut jumlah harta, jadi baris rupiah dari narasi engine tidak ikut.
  const labelRupiah = teksKamus(penyusun, 'narasi.langkah.orang.label.rupiah');
  const hitungan = orang.hitungan.filter(isi => isi.label !== labelRupiah).map(isi => `${isi.label}: ${isi.isi.map(potongan => potongan.teks).join('')}`).join(' ');
  return {
    alasan: teksBaris(orang.keluarga.length > 0 ? orang.keluarga : orang.dasar),
    pembahasan: [teksBaris(baris), hitungan].filter(Boolean).join(' '),
    refs: [...new Set(baris.flatMap(isi => isi.refs))],
  };
}

/** Penyebut akhir bukan keputusan fikih tunggal: diceritakan dari tahap yang terjadi (ashl, 'aul, radd, tashih) [R09-1] [R09-3] [R09-4] [R09-7] [R10-2]. */
function narasiPenyebut(penyusun: Penyusun, fakta: FaktaKasus): Narasi {
  const sisipan = { ashl: String(fakta.ashl), akhir: String(fakta.penyebutAkhir) };
  const sebelumTashih = String(fakta.radd ?? fakta.aul ?? fakta.ashl);
  const [kunci, isian, refs] = fakta.tashih !== undefined ? ['soal_kuis.benar.penyebut.tashih', { dasar: sebelumTashih, akhir: sisipan.akhir }, ['R10-2']] as const
    : fakta.aul !== undefined ? ['soal_kuis.benar.penyebut.aul', sisipan, ['R09-3', 'R09-4']] as const
    : fakta.radd !== undefined ? ['soal_kuis.benar.penyebut.radd', sisipan, ['R09-7']] as const
    : ['soal_kuis.benar.penyebut.tetap', { akhir: sisipan.akhir }, ['R09-1']] as const;
  const kalimat = teksKamus(penyusun, kunci, isian);
  return { alasan: kalimat, pembahasan: kalimat, refs: [...refs] };
}

