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
  const deceasedPaths = upwardPaths(graf, graf.idPewaris);
  const daftarPeran: Record<IdOrang, PeranAhliWaris> = {};
  const duaJihah: IdOrang[] = [];

  for (const idOrang of Object.keys(graf.orang)) {
    if (idOrang === graf.idPewaris) continue;
    const kin = kinshipRole(graf, idOrang, deceasedPaths);
    const pasangan = spouseRole(graf, idOrang, konfigurasi);
    if (pasangan && kin.kunci !== 'BUKAN_AHLI_WARIS' && kin.kunci !== 'DZAWIL_ARHAM') duaJihah.push(idOrang);
    daftarPeran[idOrang] = pasangan ?? kin;
  }
  return { daftarPeran, duaJihah };
}

// ─── Pasangan ─────────────────────────────────────────────────────────────────

function spouseRole(graf: GrafKeluarga, idOrang: IdOrang, konfigurasi: KonfigurasiMadzhab): PeranAhliWaris | undefined {
  const idPewaris = graf.idPewaris;
  const marriage = graf.pernikahan.find(m =>
    (m.idSuami === idPewaris && m.idIstri === idOrang) || (m.idIstri === idPewaris && m.idSuami === idOrang));
  if (!marriage) return undefined;

  const lintasan = [idPewaris, idOrang];
  const kekerabatan: PosisiKekerabatan = { generasiLeluhur: 0, kedalamanKeturunan: 0, jalur: 'kandung', lewatPerempuan: false };
  // [R02-3] talak ba'in memutus sebab nikah; pengecualian talak di maradh al-maut hanya menurut qaul qadim.
  const inheritsDespiteBain = marriage.talakSaatMaradh === true && marriage.idSuami === idPewaris
    && konfigurasi.talakBainSaatMaradh === 'qaulQadim';
  if (marriage.status === 'talakBain' && !inheritsDespiteBain) return { idOrang, kunci: 'BUKAN_AHLI_WARIS', kekerabatan, lintasan };

  return { idOrang, kunci: marriage.idSuami === idOrang ? 'SUAMI' : 'ISTRI', kekerabatan, lintasan };
}

// ─── Kekerabatan ──────────────────────────────────────────────────────────────

/** Semua leluhur `startId` beserta jalur terpendek [start, ..., leluhur]. */
function upwardPaths(graf: GrafKeluarga, startId: IdOrang): Map<IdOrang, IdOrang[]> {
  const paths = new Map<IdOrang, IdOrang[]>([[startId, [startId]]]);
  const queue: IdOrang[][] = [[startId]];
  while (queue.length > 0) {
    const lintasan = queue.shift()!;
    const person = graf.orang[lintasan[lintasan.length - 1]!];
    for (const parentId of [person?.idAyah, person?.idIbu]) {
      if (parentId === undefined || paths.has(parentId) || !graf.orang[parentId]) continue;
      const next = [...lintasan, parentId];
      paths.set(parentId, next);
      queue.push(next);
    }
  }
  return paths;
}

function kinshipRole(graf: GrafKeluarga, idOrang: IdOrang, deceasedPaths: Map<IdOrang, IdOrang[]>): PeranAhliWaris {
  const ancestorPath = deceasedPaths.get(idOrang);
  if (ancestorPath) return ascendantRole(graf, idOrang, ancestorPath);

  const personPaths = upwardPaths(graf, idOrang);
  const descentPath = personPaths.get(graf.idPewaris);
  if (descentPath) return descendantRole(graf, idOrang, [...descentPath].reverse());

  return collateralRole(graf, idOrang, personPaths, deceasedPaths);
}

const sexOf = (graf: GrafKeluarga, id: IdOrang): Orang['jenisKelamin'] => graf.orang[id]!.jenisKelamin;
const hasFemale = (graf: GrafKeluarga, ids: IdOrang[]) => ids.some(id => sexOf(graf, id) === 'P');

/** `lintasan` = [pewaris, ayah/ibu, ..., orang ini]. */
function ascendantRole(graf: GrafKeluarga, idOrang: IdOrang, lintasan: IdOrang[]): PeranAhliWaris {
  const generasi = lintasan.length - 1;
  const links = lintasan.slice(1);
  const intermediates = lintasan.slice(1, -1);
  const kekerabatan: PosisiKekerabatan = {
    generasiLeluhur: generasi,
    kedalamanKeturunan: 0,
    // Pihak ditentukan dari jalur (idAyah/idIbu), bukan dari jenis kelamin yang diinput.
    jalur: graf.orang[lintasan[0]!]!.idAyah === links[0] ? 'sebapak' : 'seibu',
    lewatPerempuan: hasFemale(graf, intermediates),
  };

  let kunci: KunciPeran;
  if (sexOf(graf, idOrang) === 'L') {
    // [R03-1] jadd shahih: ke atas melalui laki-laki saja; selain itu jadd fasid (dzawil arham).
    kunci = hasFemale(graf, links) ? 'DZAWIL_ARHAM' : generasi === 1 ? 'AYAH' : 'KAKEK';
  } else if (generasi === 1) {
    kunci = 'IBU';
  } else {
    // [R03-4] [R03-5] nenek shahihah: tidak ada laki-laki diapit dua perempuan → pola jalur L* P*.
    const sexes = intermediates.map(id => sexOf(graf, id));
    const fasidah = sexes.some((jenisKelamin, i) => jenisKelamin === 'L' && sexes.slice(0, i).includes('P'));
    kunci = fasidah ? 'DZAWIL_ARHAM' : kekerabatan.jalur === 'sebapak' ? 'NENEK_DARI_AYAH' : 'NENEK_DARI_IBU';
  }
  return { idOrang, kunci, kekerabatan, lintasan };
}

/** `lintasan` = [pewaris, anak, ..., orang ini]. */
function descendantRole(graf: GrafKeluarga, idOrang: IdOrang, lintasan: IdOrang[]): PeranAhliWaris {
  const kedalaman = lintasan.length - 1;
  const lewatPerempuan = hasFemale(graf, lintasan.slice(1, -1));
  const kekerabatan: PosisiKekerabatan = { generasiLeluhur: 0, kedalamanKeturunan: kedalaman, jalur: 'kandung', lewatPerempuan };
  const male = sexOf(graf, idOrang) === 'L';
  // [R14-4] cucu melalui anak perempuan = dzawil arham.
  const kunci: KunciPeran = lewatPerempuan ? 'DZAWIL_ARHAM'
    : kedalaman === 1 ? (male ? 'ANAK_LK' : 'ANAK_PR')
    : (male ? 'CUCU_LK' : 'CUCU_PR');
  return { idOrang, kunci, kekerabatan, lintasan };
}

function siblingLineage(a: Orang, b: Orang): Jalur | undefined {
  const sameFather = a.idAyah !== undefined && a.idAyah === b.idAyah;
  const sameMother = a.idIbu !== undefined && a.idIbu === b.idIbu;
  if (sameFather && sameMother) return 'kandung';
  if (sameFather) return 'sebapak';
  if (sameMother) return 'seibu';
  return undefined;
}

/**
 * Hawasyi: orang ini (atau leluhurnya, X) bersaudara dengan pewaris atau leluhur pewaris (Y).
 * generasiLeluhur = generasi Y + 1; kedalamanKeturunan = jarak X → orang ini + 1 (bab 3 / tabel PosisiKekerabatan).
 */
function collateralRole(
  graf: GrafKeluarga,
  idOrang: IdOrang,
  personPaths: Map<IdOrang, IdOrang[]>,
  deceasedPaths: Map<IdOrang, IdOrang[]>,
): PeranAhliWaris {
  let best: { generasi: number; kedalaman: number; jalur: Jalur; xPath: IdOrang[]; yPath: IdOrang[] } | undefined;
  for (const [xId, xPath] of personPaths) {
    for (const [yId, yPath] of deceasedPaths) {
      if (xId === yId) continue;
      const jalur = siblingLineage(graf.orang[xId]!, graf.orang[yId]!);
      if (!jalur) continue;
      const generasi = yPath.length;
      const kedalaman = xPath.length;
      if (!best || generasi < best.generasi || (generasi === best.generasi && kedalaman < best.kedalaman)) {
        best = { generasi, kedalaman, jalur, xPath, yPath };
      }
    }
  }

  if (!best) {
    const kekerabatan: PosisiKekerabatan = { generasiLeluhur: 0, kedalamanKeturunan: 0, jalur: 'kandung', lewatPerempuan: false };
    return { idOrang, kunci: 'BUKAN_AHLI_WARIS', kekerabatan, lintasan: [graf.idPewaris, idOrang] };
  }

  const { generasi, kedalaman, jalur, xPath, yPath } = best;
  const downFromSibling = [...xPath].reverse();          // [X, ..., orang ini]
  const lintasan = [...yPath, ...downFromSibling];
  const lewatPerempuan = hasFemale(graf, [...yPath.slice(1), ...downFromSibling.slice(0, -1)]);
  const kekerabatan: PosisiKekerabatan = { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman, jalur, lewatPerempuan };
  const male = sexOf(graf, idOrang) === 'L';
  const maleLineDown = !hasFemale(graf, downFromSibling);
  const kandung = jalur === 'kandung';

  let kunci: KunciPeran = 'DZAWIL_ARHAM';
  if (generasi === 1 && kedalaman === 1) {
    kunci = (male ? KUNCI_SAUDARA_LK : KUNCI_SAUDARI)[jalur];
  } else if (generasi === 1 && jalur !== 'seibu' && maleLineDown) {
    // [R14-4] anak saudari, anak saudara seibu, anak pr saudara → dzawil arham.
    kunci = kandung ? 'KEPONAKAN_KANDUNG' : 'KEPONAKAN_SEBAPAK';
  } else if (generasi >= 2 && jalur !== 'seibu' && maleLineDown && !hasFemale(graf, yPath.slice(1))) {
    // [R03-2] paman mencakup paman ayah/kakek, asal jalurnya lewat laki-laki; 'ammah & khal = dzawil arham.
    if (kedalaman === 1) kunci = kandung ? 'PAMAN_KANDUNG' : 'PAMAN_SEBAPAK';
    else kunci = kandung ? 'SEPUPU_KANDUNG' : 'SEPUPU_SEBAPAK';
  }
  return { idOrang, kunci, kekerabatan, lintasan };
}
