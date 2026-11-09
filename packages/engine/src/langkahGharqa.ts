// Langkah-langkah gharqa (bab 13d) yang dipakai orkestrator gharqa dan munasakhat.
//   Masuk : ruleset + keadaan 13d.2 (untuk memilih metode), atau satu mayit + rekannya (tilad–tharif).
//   Putus : metode tiap kelompok (terpisah / tilad / skenario) dan urutan wafat yang mungkin.
//   Keluar: MetodeGharqa, daftar urutan (ekspansi skenario), atau saham tilad–tharif satu mayit.

import { gabungkan, periksaInvarian, sahamDari, totalSaham, type Saham } from './gabung.js';
import { hitungDzawilArham } from './dzawilArham.js';
import type { GrafKeluarga, HasilEngine, HasilGharqa, IdOrang, InputEngine, InputTirkah, KeadaanGharqa, KejadianGharqa, KejadianWafat, LangkahJejak, Ruleset } from './types.js';

export type Gagal = Extract<HasilGharqa, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' }>;
export type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

// Banyak urutan wafat (n!) di atas ini → PERLU_INPUT (batas kombinatorik, CLAUDE.md); setara batas lama 4 anggota.
export const MAKS_SKENARIO_URUTAN = 24;
export const TANPA_TIRKAH: InputTirkah = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

export type MetodeGharqa =
  | { metode: 'terpisah'; rujukan: 'R13-10' | 'K13d-1' }
  | { metode: 'tilad' }
  | { metode: 'skenario' };

export const adalahKelompok = (kejadian: KejadianWafat): kejadian is KejadianGharqa => typeof kejadian !== 'string';

export function metodeGharqa(ruleset: Ruleset, keadaan: KeadaanGharqa): MetodeGharqa {
  if (keadaan === 'serentak') return { metode: 'terpisah', rujukan: 'R13-10' };
  // [K13d-1] [HNB] masyhur: saling mewarisi dari tilad.
  if (ruleset === 'hanbali') return { metode: 'tilad' };
  // [R13-10] [SYF] keadaan 3: ditahan sampai ingat atau ishtilah.
  if (ruleset === 'syafii' && keadaan === 'terlupakan') return { metode: 'skenario' };
  return { metode: 'terpisah', rujukan: ruleset === 'syafii' ? 'R13-10' : 'K13d-1' };
}

/** Kelompok bermetode 'skenario' diganti tiap permutasi anggotanya sebagai orang tunggal; kelompok lain tetap. */
export function ekspansiSkenario(daftarKejadian: KejadianWafat[], ruleset: Ruleset): KejadianWafat[][] {
  return daftarKejadian.reduce<KejadianWafat[][]>((urutanSejauhIni, kejadian) => {
    const pilihan: KejadianWafat[][] = adalahKelompok(kejadian) && metodeGharqa(ruleset, kejadian.keadaan).metode === 'skenario'
      ? permutasi(kejadian.anggota)
      : [[kejadian]];
    return urutanSejauhIni.flatMap(awal => pilihan.map(ganti => [...awal, ...ganti]));
  }, [[]]);
}

export function jumlahUrutan(banyakAnggota: number): bigint {
  let hasil = 1n;
  for (let pengali = 2n; pengali <= BigInt(banyakAnggota); pengali++) hasil *= pengali;
  return hasil;
}

/** Mas'alah tilad satu mayit (rekan dihidupkan) lalu tharif tiap rekan yang mendapat bagian, digabung seperti munasakhat. */
export function tiladSatuMayit(inputMayit: InputEngine, mayit: IdOrang, rekan: IdOrang[]):
  { saham: Saham; jejak: LangkahJejak[]; daftarHasil: HasilOk[]; urutanTharif: IdOrang[] } | Gagal {
  const hasilTilad = hitungDzawilArham({ ...inputMayit, graf: hidupkan(inputMayit.graf, rekan) });
  if (hasilTilad.status !== 'OK') return { ...hasilTilad, mayit };

  let saham = sahamDari(mayit, hasilTilad);
  let jamiah = totalSaham(saham);
  const jejak: LangkahJejak[] = [...hasilTilad.jejak];
  const daftarHasil: HasilOk[] = [hasilTilad];
  const urutanTharif = rekan.filter(id => saham[id]);
  for (const idRekan of urutanTharif) {
    const hasilTharif = hitungDzawilArham({ ...inputMayit, graf: grafSebagaiPewaris(inputMayit.graf, idRekan), tirkah: TANPA_TIRKAH });
    if (hasilTharif.status !== 'OK') return { ...hasilTharif, mayit: idRekan };
    const sahamTharif = sahamDari(idRekan, hasilTharif);
    daftarHasil.push(hasilTharif);
    const gabungan = gabungkan(saham, jamiah, idRekan, sahamTharif, totalSaham(sahamTharif));
    jejak.push({ tahap: 'munasakhat', refs: ['R13-19'], jenis: 'MUNASAKHAT', mayit: idRekan, saham: gabungan.sahamMayit, masalah: gabungan.masalah,
      hubungan: gabungan.hubungan, fpb: gabungan.fpb, wafqMasalah: gabungan.wafqMasalah, wafqSaham: gabungan.wafqSaham, jamiah: gabungan.jamiah, rincian: gabungan.rincian });
    saham = gabungan.saham;
    jamiah = gabungan.jamiah;
    periksaInvarian(saham, jamiah, 'gharqa tilad');
  }
  return { saham, jejak, daftarHasil, urutanTharif };
}

// ─── Pembantu ─────────────────────────────────────────────────────────────────

export const grafSebagaiPewaris = (graf: GrafKeluarga, idPewaris: IdOrang): GrafKeluarga => ({ ...graf, idPewaris });

function hidupkan(graf: GrafKeluarga, daftarId: IdOrang[]): GrafKeluarga {
  const orang = { ...graf.orang };
  for (const id of daftarId) orang[id] = { ...orang[id]!, statusHidup: 'hidup' };
  return { ...graf, orang };
}

export function permutasi(daftar: IdOrang[]): IdOrang[][] {
  if (daftar.length <= 1) return [daftar];
  return daftar.flatMap((id, indeks) => permutasi([...daftar.slice(0, indeks), ...daftar.slice(indeks + 1)]).map(sisa => [id, ...sisa]));
}
