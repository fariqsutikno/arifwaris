// Langkah-langkah gharqa (bab 13d) yang dipakai orkestrator gharqa dan munasakhat.
//   Masuk : ruleset + keadaan 13d.2 (untuk memilih metode), satu mayit + rekannya (tilad–tharif),
//           atau satu kelompok gharqa di tengah rantai munasakhat beserta saham rantai sejauh ini.
//   Putus : metode tiap kelompok (terpisah / tilad / skenario) dan urutan wafat yang mungkin.
//   Keluar: MetodeGharqa, daftar urutan (ekspansi skenario), saham tilad–tharif satu mayit,
//           atau saham/jami'ah rantai setelah kelompok itu diteruskan ke ahli waris tiap anggotanya.

import { gabungkan, periksaInvarian, sahamDari, totalSaham, type HasilGabung, type Saham } from './gabung.js';
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
    jejak.push(jejakGabung(idRekan, gabungan, ['R13-19']));
    saham = gabungan.saham;
    jamiah = gabungan.jamiah;
    periksaInvarian(saham, jamiah, 'gharqa tilad');
  }
  return { saham, jejak, daftarHasil, urutanTharif };
}

export type JejakGabungan = Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }>;
/**
 * Satu anggota kelompok yang diteruskan ke rantai: `langkah` = mas'alahnya (tilad: mayit lalu tharif), `dalam` = penggabungan
 * tharif ke mas'alah tilad (kosong bila terpisah), `utama` = penggabungannya ke rantai munasakhat. Untuk pengali [R12-2] bertingkat.
 */
export interface BagianKelompok { langkah: Array<{ mayit: IdOrang; hasil: HasilOk }>; dalam: JejakGabungan[]; utama: JejakGabungan }
export interface HasilLangkahKelompok { saham: Saham; jamiah: bigint; jejak: LangkahJejak[]; daftarLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }>; bagian: BagianKelompok[] }

/**
 * Satu kelompok gharqa di rantai: tiap anggota yang punya saham diteruskan ke ahli warisnya [R12-6].
 * `inputAnggota(mayit)` = input dengan graf "saat kelompok itu wafat" (semua anggota wafat, kejadian sesudahnya hidup),
 * `idPewaris = mayit`, tirkah nol.
 */
export function terapkanKelompok(saham: Saham, jamiah: bigint, kelompok: KejadianGharqa,
  inputAnggota: (mayit: IdOrang) => InputEngine): HasilLangkahKelompok | Gagal {
  const metode = metodeGharqa(inputAnggota(kelompok.anggota[0]!).ruleset, kelompok.keadaan);
  if (metode.metode === 'skenario') throw new Error('terapkanKelompok: kelompok bermetode skenario harus diekspansi lebih dulu');

  let sahamRantai = saham;
  let jamiahRantai = jamiah;
  const jejak: LangkahJejak[] = [];
  const daftarLangkah: HasilLangkahKelompok['daftarLangkah'] = [];
  const bagian: BagianKelompok[] = [];
  for (const mayit of kelompok.anggota) {
    // Bagian dinilai dari rantai sebelum kelompok: anggota wafat bersamaan tidak saling mewarisi, jadi tak ada bagian dari rekan [R12-1].
    if (!saham[mayit]) {
      jejak.push({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit });
      continue;
    }
    const rekan = kelompok.anggota.filter(id => id !== mayit);
    const masukan = inputAnggota(mayit);
    let sahamMasalah: Saham;
    const langkahAnggota: BagianKelompok['langkah'] = [];
    let dalam: JejakGabungan[] = [];
    if (metode.metode === 'tilad') {
      const hasilTilad = tiladSatuMayit(masukan, mayit, rekan);
      if ('status' in hasilTilad) return hasilTilad;
      sahamMasalah = hasilTilad.saham;
      jejak.push(...hasilTilad.jejak);
      dalam = hasilTilad.jejak.filter((langkah): langkah is JejakGabungan => langkah.jenis === 'MUNASAKHAT');
      for (const [indeks, idMayitLangkah] of [mayit, ...hasilTilad.urutanTharif].entries()) {
        langkahAnggota.push({ mayit: idMayitLangkah, hasil: hasilTilad.daftarHasil[indeks]! });
      }
    } else {
      const hasil = hitungDzawilArham(masukan);
      if (hasil.status !== 'OK') return { ...hasil, mayit };
      sahamMasalah = sahamDari(mayit, hasil);
      jejak.push(...rekan.map((idRekan): LangkahJejak => ({ tahap: 'mawani', refs: [metode.rujukan], jenis: 'MANI', idOrang: idRekan, mani: 'istibham' })));
      langkahAnggota.push({ mayit, hasil });
    }
    daftarLangkah.push(...langkahAnggota);
    const gabungan = gabungkan(sahamRantai, jamiahRantai, mayit, sahamMasalah, totalSaham(sahamMasalah));
    const utama = jejakGabung(mayit, gabungan, ['R12-6']);
    jejak.push(utama);
    bagian.push({ langkah: langkahAnggota, dalam, utama });
    sahamRantai = gabungan.saham;
    jamiahRantai = gabungan.jamiah;
    periksaInvarian(sahamRantai, jamiahRantai, 'munasakhat gharqa');
  }
  return { saham: sahamRantai, jamiah: jamiahRantai, jejak, daftarLangkah, bagian };
}

/** Jejak satu penggabungan mas'alah mayit ke jami'ah; `refs` menyebut asal aturannya. */
export function jejakGabung(mayit: IdOrang, gabungan: HasilGabung, refs: string[]): JejakGabungan {
  return { tahap: 'munasakhat', refs, jenis: 'MUNASAKHAT', mayit, saham: gabungan.sahamMayit, masalah: gabungan.masalah, hubungan: gabungan.hubungan,
    fpb: gabungan.fpb, wafqMasalah: gabungan.wafqMasalah, wafqSaham: gabungan.wafqSaham, jamiah: gabungan.jamiah, rincian: gabungan.rincian };
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
