// Orkestrator gharqa (bab 13d): sekelompok orang yang saling mewarisi wafat dengan urutan samar.
//   Masuk : graf berisi semua anggota (wafat), keadaan 13d.2, dan tirkah tiap anggota.
//   Putus : serentak → tidak saling mewarisi (ijma'); keadaan 3–5 menurut madzhab (K13d-1):
//           jumhur tidak saling mewarisi, [SYF] keadaan 3 ditahan, [HNB] tilad–tharif.
//   Keluar: pembagian harta tiap anggota; atau MAUQUF dengan skenario tiap urutan wafat.
// Keadaan 2 (yang terakhir diketahui pasti) bukan urusan file ini: itu munasakhat biasa (bab 12).

import { gabungkan, periksaInvarian, sahamDari, totalSaham, type Saham } from './gabung.js';
import { hitungDzawilArham } from './dzawilArham.js';
import { hitungMunasakhat } from './munasakhat.js';
import { bagikanNominal } from './stages/pembagian.js';
import { hitungTirkah } from './stages/tirkah.js';
import type { GrafKeluarga, HartaGharqa, HasilGharqa, IdOrang, InputGharqa, InputTirkah, LangkahJejak } from './types.js';

type Gagal = Extract<HasilGharqa, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' }>;

// Urutan wafat anggota = n!; lebih dari ini → PERLU_INPUT (batas kombinatorik, CLAUDE.md).
const MAKS_ANGGOTA_SKENARIO = 4;
const TANPA_TIRKAH: InputTirkah = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

export function hitungGharqa(input: InputGharqa): HasilGharqa {
  const tidakSah = periksaAnggota(input);
  if (tidakSah) return tidakSah;
  const { ruleset } = input.dasar;

  if (input.keadaan === 'serentak') return terpisah(input, 'R13-10');
  // [K13d-1] [HNB] masyhur: saling mewarisi dari tilad.
  if (ruleset === 'hanbali') return tilad(input);
  // [R13-10] [SYF] keadaan 3: ditahan sampai ingat atau ishtilah.
  if (ruleset === 'syafii' && input.keadaan === 'terlupakan') return skenarioUrutan(input);
  return terpisah(input, ruleset === 'syafii' ? 'R13-10' : 'K13d-1');
}

function periksaAnggota(input: InputGharqa): Gagal | undefined {
  const pertanyaan = input.anggota
    .filter(id => input.dasar.graf.orang[id]?.statusHidup !== 'wafat')
    .map(id => ({ idOrang: id, isian: 'statusHidup' as const, alasan: 'Anggota gharqa harus berstatus wafat (13d.1).' }));
  if (input.anggota.length < 2) pertanyaan.push({ idOrang: input.anggota[0]!, isian: 'statusHidup', alasan: 'Gharqa butuh minimal dua orang yang wafat bersamaan.' });
  return pertanyaan.length > 0 ? { status: 'PERLU_INPUT', pertanyaan } : undefined;
}

// ─── Tidak saling mewarisi ────────────────────────────────────────────────────

/** Tiap anggota jadi pewaris; anggota lain wafat sehingga tidak mewarisi (mani' istibham, bab 02). */
function terpisah(input: InputGharqa, rujukan: string): HasilGharqa {
  const harta: HartaGharqa[] = [];
  for (const mayit of input.anggota) {
    const hasil = hitungDzawilArham({ ...input.dasar, graf: grafSebagaiPewaris(input.dasar.graf, mayit), tirkah: tirkahDari(input, mayit) });
    if (hasil.status !== 'OK') return { ...hasil, mayit };
    const istibham: LangkahJejak[] = input.anggota.filter(id => id !== mayit)
      .map(id => ({ tahap: 'mawani', refs: [rujukan], jenis: 'MANI', idOrang: id, mani: 'istibham' }));
    harta.push(susunHarta(input, mayit, sahamDari(mayit, hasil), [...istibham, ...hasil.jejak]));
  }
  return { status: 'OK', metode: 'terpisah', harta };
}

// ─── [HNB] tilad–tharif ───────────────────────────────────────────────────────

/**
 * [R13-19] Tiap anggota bergiliran dianggap wafat lebih dulu. Mas'alah tilad: ahli waris hidup + rekan musibah.
 * Bagian tiap rekan (tharif) hanya untuk ahli warisnya yang hidup (semua anggota wafat), digabung seperti munasakhat.
 */
function tilad(input: InputGharqa): HasilGharqa {
  const harta: HartaGharqa[] = [];
  for (const mayit of input.anggota) {
    const rekan = input.anggota.filter(id => id !== mayit);
    const grafTilad = hidupkan(grafSebagaiPewaris(input.dasar.graf, mayit), rekan);
    const hasilTilad = hitungDzawilArham({ ...input.dasar, graf: grafTilad, tirkah: tirkahDari(input, mayit) });
    if (hasilTilad.status !== 'OK') return { ...hasilTilad, mayit };

    let saham = sahamDari(mayit, hasilTilad);
    let jamiah = totalSaham(saham);
    const jejak: LangkahJejak[] = [...hasilTilad.jejak];
    for (const idRekan of rekan.filter(id => saham[id])) {
      const hasilTharif = hitungDzawilArham({ ...input.dasar, graf: grafSebagaiPewaris(input.dasar.graf, idRekan), tirkah: TANPA_TIRKAH });
      if (hasilTharif.status !== 'OK') return { ...hasilTharif, mayit: idRekan };
      const sahamTharif = sahamDari(idRekan, hasilTharif);
      const gabungan = gabungkan(saham, jamiah, idRekan, sahamTharif, totalSaham(sahamTharif));
      jejak.push({ tahap: 'munasakhat', refs: ['R13-19'], jenis: 'MUNASAKHAT', mayit: idRekan, saham: gabungan.sahamMayit, masalah: gabungan.masalah,
        hubungan: gabungan.hubungan, fpb: gabungan.fpb, wafqMasalah: gabungan.wafqMasalah, wafqSaham: gabungan.wafqSaham, jamiah: gabungan.jamiah, rincian: gabungan.rincian });
      saham = gabungan.saham;
      jamiah = gabungan.jamiah;
      periksaInvarian(saham, jamiah, 'gharqa tilad');
    }
    harta.push(susunHarta(input, mayit, saham, jejak));
  }
  return { status: 'OK', metode: 'tilad', harta };
}

// ─── [SYF] keadaan 3: skenario urutan ─────────────────────────────────────────

/** Tiap urutan yang mungkin: harta anggota ke-i dibagi dengan munasakhat, anggota sesudahnya mewarisi lalu wafat. */
function skenarioUrutan(input: InputGharqa): HasilGharqa {
  if (input.anggota.length > MAKS_ANGGOTA_SKENARIO) {
    return { status: 'PERLU_INPUT', pertanyaan: input.anggota.map(id => ({ idOrang: id, isian: 'statusHidup' as const,
      alasan: `Lebih dari ${MAKS_ANGGOTA_SKENARIO} anggota dengan urutan terlupakan; pastikan sebagian urutan dulu.` })) };
  }
  const skenario: Array<{ urutan: IdOrang[]; harta: HartaGharqa[] }> = [];
  for (const urutan of permutasi(input.anggota)) {
    const harta: HartaGharqa[] = [];
    for (const [posisi, mayit] of urutan.entries()) {
      const hasil = hitungMunasakhat({
        dasar: { ...input.dasar, graf: grafSebagaiPewaris(input.dasar.graf, mayit), tirkah: tirkahDari(input, mayit) },
        urutanWafat: urutan.slice(posisi + 1),
      });
      if (hasil.status !== 'OK') return { ...hasil, mayit };
      harta.push(susunHarta(input, mayit, hasil.saham, [{ tahap: 'mawani', refs: ['R13-10'], jenis: 'MANI', idOrang: mayit, mani: 'istibham' }, ...hasil.jejak]));
    }
    skenario.push({ urutan, harta });
  }
  return { status: 'MAUQUF', skenario };
}

// ─── Pembantu ─────────────────────────────────────────────────────────────────

function susunHarta(input: InputGharqa, mayit: IdOrang, saham: Saham, jejak: LangkahJejak[]): HartaGharqa {
  const jamiah = totalSaham(saham);
  const bersih = hitungTirkah(tirkahDari(input, mayit)).bersih;
  const nominal = bagikanNominal(saham, jamiah, bersih, input.dasar.pembulatan.satuan);
  return { mayit, jamiah, saham, nominal: nominal.nominal, jejak };
}

const tirkahDari = (input: InputGharqa, mayit: IdOrang): InputTirkah => input.tirkah?.[mayit] ?? TANPA_TIRKAH;
const grafSebagaiPewaris = (graf: GrafKeluarga, idPewaris: IdOrang): GrafKeluarga => ({ ...graf, idPewaris });

function hidupkan(graf: GrafKeluarga, daftarId: IdOrang[]): GrafKeluarga {
  const orang = { ...graf.orang };
  for (const id of daftarId) orang[id] = { ...orang[id]!, statusHidup: 'hidup' };
  return { ...graf, orang };
}

function permutasi(daftar: IdOrang[]): IdOrang[][] {
  if (daftar.length <= 1) return [daftar];
  return daftar.flatMap((id, indeks) => permutasi([...daftar.slice(0, indeks), ...daftar.slice(indeks + 1)]).map(sisa => [id, ...sisa]));
}
