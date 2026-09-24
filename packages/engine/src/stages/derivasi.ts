// Tahap 1a — Derivasi peran: dari graf keluarga, tentukan siapa tiap orang bagi pewaris.
//   Masuk : graf (orang + idAyah/idIbu + pernikahan).
//   Keluar: peran tiap orang (ANAK_LK, SAUDARI_SEBAPAK, DZAWIL_ARHAM, ...) + posisi kekerabatannya.
// Jenis saudara/paman tidak pernah diinput; selalu diturunkan dari kesamaan ayah/ibu.
// Urutan cek per orang: pasangan? → leluhur? → keturunan? → hawasyi (saudara, keponakan, paman, sepupu).

import type { GrafKeluarga, KunciAhliWaris, PeranAhliWaris, PosisiKekerabatan, KonfigurasiMadzhab, Orang, IdOrang } from '../types.js';

type Jalur = PosisiKekerabatan['jalur'];
type KunciPeran = PeranAhliWaris['kunci'];

const KUNCI_SAUDARA_LK: Record<Jalur, KunciAhliWaris> = { kandung: 'SAUDARA_KANDUNG', sebapak: 'SAUDARA_SEBAPAK', seibu: 'SAUDARA_SEIBU' };
const KUNCI_SAUDARI: Record<Jalur, KunciAhliWaris> = { kandung: 'SAUDARI_KANDUNG', sebapak: 'SAUDARI_SEBAPAK', seibu: 'SAUDARI_SEIBU' };

export interface HasilDerivasi {
  daftarPeran: Record<IdOrang, PeranAhliWaris>;
  /** Orang yang sekaligus pasangan dan kerabat pewaris — tidak diatur KB, orkestrator menolak. */
  duaJihah: IdOrang[];
}

/**
 * Tahap 1a: turunkan peran tiap orang dari graf (bab 3.1–3.2). Jenis saudara/paman ditentukan dari
 * kesamaan idAyah/idIbu, tidak pernah diinput langsung.
 */
export function turunkanPeran(graf: GrafKeluarga, konfigurasi: KonfigurasiMadzhab): HasilDerivasi {
  const jalurPewaris = jalurKeAtas(graf, graf.idPewaris);
  const daftarPeran: Record<IdOrang, PeranAhliWaris> = {};
  const duaJihah: IdOrang[] = [];

  for (const idOrang of Object.keys(graf.orang)) {
    if (idOrang === graf.idPewaris) continue;
    const kerabat = peranKekerabatan(graf, idOrang, jalurPewaris);
    const pasangan = peranPasangan(graf, idOrang, konfigurasi);
    if (pasangan && kerabat.kunci !== 'BUKAN_AHLI_WARIS' && kerabat.kunci !== 'DZAWIL_ARHAM') duaJihah.push(idOrang);
    daftarPeran[idOrang] = pasangan ?? kerabat;
  }
  return { daftarPeran, duaJihah };
}

// ─── Pasangan ─────────────────────────────────────────────────────────────────

function peranPasangan(graf: GrafKeluarga, idOrang: IdOrang, konfigurasi: KonfigurasiMadzhab): PeranAhliWaris | undefined {
  const idPewaris = graf.idPewaris;
  const nikah = graf.pernikahan.find(nikahIni =>
    (nikahIni.idSuami === idPewaris && nikahIni.idIstri === idOrang) || (nikahIni.idIstri === idPewaris && nikahIni.idSuami === idOrang));
  if (!nikah) return undefined;

  const lintasan = [idPewaris, idOrang];
  const kekerabatan: PosisiKekerabatan = { generasiLeluhur: 0, kedalamanKeturunan: 0, jalur: 'kandung', lewatPerempuan: false };
  // [R02-3] talak ba'in memutus sebab nikah; pengecualian talak di maradh al-maut hanya menurut qaul qadim.
  const mewarisiMeskiBain = nikah.talakSaatMaradh === true && nikah.idSuami === idPewaris
    && konfigurasi.talakBainSaatMaradh === 'qaulQadim';
  if (nikah.status === 'talakBain' && !mewarisiMeskiBain) return { idOrang, kunci: 'BUKAN_AHLI_WARIS', kekerabatan, lintasan };

  return { idOrang, kunci: nikah.idSuami === idOrang ? 'SUAMI' : 'ISTRI', kekerabatan, lintasan };
}

// ─── Kekerabatan ──────────────────────────────────────────────────────────────

/** Semua leluhur `idAwal` beserta jalur terpendek [idAwal, ..., leluhur]. */
function jalurKeAtas(graf: GrafKeluarga, idAwal: IdOrang): Map<IdOrang, IdOrang[]> {
  const daftarJalur = new Map<IdOrang, IdOrang[]>([[idAwal, [idAwal]]]);
  const antrean: IdOrang[][] = [[idAwal]];
  while (antrean.length > 0) {
    const lintasan = antrean.shift()!;
    const orangIni = graf.orang[lintasan[lintasan.length - 1]!];
    for (const idOrangTua of [orangIni?.idAyah, orangIni?.idIbu]) {
      if (idOrangTua === undefined || daftarJalur.has(idOrangTua) || !graf.orang[idOrangTua]) continue;
      const jalurBaru = [...lintasan, idOrangTua];
      daftarJalur.set(idOrangTua, jalurBaru);
      antrean.push(jalurBaru);
    }
  }
  return daftarJalur;
}

function peranKekerabatan(graf: GrafKeluarga, idOrang: IdOrang, jalurPewaris: Map<IdOrang, IdOrang[]>): PeranAhliWaris {
  const jalurLeluhur = jalurPewaris.get(idOrang);
  if (jalurLeluhur) return peranLeluhur(graf, idOrang, jalurLeluhur);

  const jalurOrang = jalurKeAtas(graf, idOrang);
  const jalurKeturunan = jalurOrang.get(graf.idPewaris);
  if (jalurKeturunan) return peranKeturunan(graf, idOrang, [...jalurKeturunan].reverse());

  return peranHawasyi(graf, idOrang, jalurOrang, jalurPewaris);
}

const jenisKelaminDari = (graf: GrafKeluarga, id: IdOrang): Orang['jenisKelamin'] => graf.orang[id]!.jenisKelamin;
const adaPerempuan = (graf: GrafKeluarga, ids: IdOrang[]) => ids.some(id => jenisKelaminDari(graf, id) === 'P');

/** `lintasan` = [pewaris, ayah/ibu, ..., orang ini]. */
function peranLeluhur(graf: GrafKeluarga, idOrang: IdOrang, lintasan: IdOrang[]): PeranAhliWaris {
  const generasi = lintasan.length - 1;
  const tautan = lintasan.slice(1);
  const perantara = lintasan.slice(1, -1);
  const kekerabatan: PosisiKekerabatan = {
    generasiLeluhur: generasi,
    kedalamanKeturunan: 0,
    // Pihak ditentukan dari jalur (idAyah/idIbu), bukan dari jenis kelamin yang diinput.
    jalur: graf.orang[lintasan[0]!]!.idAyah === tautan[0] ? 'sebapak' : 'seibu',
    lewatPerempuan: adaPerempuan(graf, perantara),
  };

  let kunci: KunciPeran;
  if (jenisKelaminDari(graf, idOrang) === 'L') {
    // [R03-1] jadd shahih: ke atas melalui laki-laki saja; selain itu jadd fasid (dzawil arham).
    kunci = adaPerempuan(graf, tautan) ? 'DZAWIL_ARHAM' : generasi === 1 ? 'AYAH' : 'KAKEK';
  } else if (generasi === 1) {
    kunci = 'IBU';
  } else {
    // [R03-4] [R03-5] nenek shahihah: tidak ada laki-laki diapit dua perempuan → pola jalur L* P*.
    const daftarJenisKelamin = perantara.map(id => jenisKelaminDari(graf, id));
    const fasidah = daftarJenisKelamin.some((jenisKelamin, i) => jenisKelamin === 'L' && daftarJenisKelamin.slice(0, i).includes('P'));
    kunci = fasidah ? 'DZAWIL_ARHAM' : kekerabatan.jalur === 'sebapak' ? 'NENEK_DARI_AYAH' : 'NENEK_DARI_IBU';
  }
  return { idOrang, kunci, kekerabatan, lintasan };
}

/** `lintasan` = [pewaris, anak, ..., orang ini]. */
function peranKeturunan(graf: GrafKeluarga, idOrang: IdOrang, lintasan: IdOrang[]): PeranAhliWaris {
  const kedalaman = lintasan.length - 1;
  const lewatPerempuan = adaPerempuan(graf, lintasan.slice(1, -1));
  const kekerabatan: PosisiKekerabatan = { generasiLeluhur: 0, kedalamanKeturunan: kedalaman, jalur: 'kandung', lewatPerempuan };
  const lakiLaki = jenisKelaminDari(graf, idOrang) === 'L';
  // [R14-4] cucu melalui anak perempuan = dzawil arham.
  const kunci: KunciPeran = lewatPerempuan ? 'DZAWIL_ARHAM'
    : kedalaman === 1 ? (lakiLaki ? 'ANAK_LK' : 'ANAK_PR')
    : (lakiLaki ? 'CUCU_LK' : 'CUCU_PR');
  return { idOrang, kunci, kekerabatan, lintasan };
}

function jalurSaudara(a: Orang, b: Orang): Jalur | undefined {
  const samaAyah = a.idAyah !== undefined && a.idAyah === b.idAyah;
  const samaIbu = a.idIbu !== undefined && a.idIbu === b.idIbu;
  if (samaAyah && samaIbu) return 'kandung';
  if (samaAyah) return 'sebapak';
  if (samaIbu) return 'seibu';
  return undefined;
}

/**
 * Hawasyi: orang ini (atau leluhurnya, X) bersaudara dengan pewaris atau leluhur pewaris (Y).
 * generasiLeluhur = generasi Y + 1; kedalamanKeturunan = jarak X → orang ini + 1 (bab 3 / tabel PosisiKekerabatan).
 */
function peranHawasyi(
  graf: GrafKeluarga,
  idOrang: IdOrang,
  jalurOrang: Map<IdOrang, IdOrang[]>,
  jalurPewaris: Map<IdOrang, IdOrang[]>,
): PeranAhliWaris {
  let terbaik: { generasi: number; kedalaman: number; jalur: Jalur; jalurX: IdOrang[]; jalurY: IdOrang[] } | undefined;
  for (const [idX, jalurX] of jalurOrang) {
    for (const [idY, jalurY] of jalurPewaris) {
      if (idX === idY) continue;
      const jalur = jalurSaudara(graf.orang[idX]!, graf.orang[idY]!);
      if (!jalur) continue;
      const generasi = jalurY.length;
      const kedalaman = jalurX.length;
      if (!terbaik || generasi < terbaik.generasi || (generasi === terbaik.generasi && kedalaman < terbaik.kedalaman)) {
        terbaik = { generasi, kedalaman, jalur, jalurX, jalurY };
      }
    }
  }

  if (!terbaik) {
    const kekerabatan: PosisiKekerabatan = { generasiLeluhur: 0, kedalamanKeturunan: 0, jalur: 'kandung', lewatPerempuan: false };
    return { idOrang, kunci: 'BUKAN_AHLI_WARIS', kekerabatan, lintasan: [graf.idPewaris, idOrang] };
  }

  const { generasi, kedalaman, jalur, jalurX, jalurY } = terbaik;
  const turunDariSaudara = [...jalurX].reverse();          // [X, ..., orang ini]
  const lintasan = [...jalurY, ...turunDariSaudara];
  const lewatPerempuan = adaPerempuan(graf, [...jalurY.slice(1), ...turunDariSaudara.slice(0, -1)]);
  const kekerabatan: PosisiKekerabatan = { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman, jalur, lewatPerempuan };
  const lakiLaki = jenisKelaminDari(graf, idOrang) === 'L';
  const garisLakiLakiKeBawah = !adaPerempuan(graf, turunDariSaudara);
  const kandung = jalur === 'kandung';

  let kunci: KunciPeran = 'DZAWIL_ARHAM';
  if (generasi === 1 && kedalaman === 1) {
    kunci = (lakiLaki ? KUNCI_SAUDARA_LK : KUNCI_SAUDARI)[jalur];
  } else if (generasi === 1 && jalur !== 'seibu' && garisLakiLakiKeBawah) {
    // [R14-4] anak saudari, anak saudara seibu, anak pr saudara → dzawil arham.
    kunci = kandung ? 'KEPONAKAN_KANDUNG' : 'KEPONAKAN_SEBAPAK';
  } else if (generasi >= 2 && jalur !== 'seibu' && garisLakiLakiKeBawah && !adaPerempuan(graf, jalurY.slice(1))) {
    // [R03-2] paman mencakup paman ayah/kakek, asal jalurnya lewat laki-laki; 'ammah & khal = dzawil arham.
    if (kedalaman === 1) kunci = kandung ? 'PAMAN_KANDUNG' : 'PAMAN_SEBAPAK';
    else kunci = kandung ? 'SEPUPU_KANDUNG' : 'SEPUPU_SEBAPAK';
  }
  return { idOrang, kunci, kekerabatan, lintasan };
}
