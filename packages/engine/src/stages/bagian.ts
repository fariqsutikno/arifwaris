import { tambah, bandingkan, pecahan, kali, kurang, type Pecahan } from '@waris/math';
import type { FardhReason, GroupId, HeirKey, PersonId, TraceStep } from '../types.js';
import { jaddWalIkhwah } from './jaddWalIkhwah.js';
import { isAkdariyyah, isMusyarrakah, isUmariyyatain } from './khusus.js';
import { equalWeights, makeGroup, unitOf, type Heir, type ShareGroup, type Unsupported } from './model.js';

const ZERO = pecahan(0n);
const ONE = pecahan(1n);
const NISF = pecahan(1n, 2n);
const RUBU = pecahan(1n, 4n);
const TSUMUN = pecahan(1n, 8n);
const TSULUTSAN = pecahan(2n, 3n);
const TSULUTS = pecahan(1n, 3n);
const SUDUS = pecahan(1n, 6n);

const SIBLING_KEYS: HeirKey[] = ['AKH_SYQ', 'UKHT_SYQ', 'AKH_AB', 'UKHT_AB', 'AKH_UMM', 'UKHT_UMM'];
const HAWASYI_ASHABAH: HeirKey[] = ['IBN_AKH_SYQ', 'IBN_AKH_AB', 'AMM_SYQ', 'AMM_AB', 'IBN_AMM_SYQ', 'IBN_AMM_AB'];

/**
 * Tahap 2: bagian tiap kelompok — furudh (bab 04), ashabah (bab 05), kasus khusus bab 07 & 08.
 * `effective` = ahli waris setelah hajb; `candidates` = sebelum hajb, dipakai untuk jam' min al-ikhwah
 * karena saudara yang mahjub tetap mengurangi bagian ibu [R06-6].
 */
export function assignShares(effective: Heir[], candidates: Heir[]): { groups: ShareGroup[]; trace: TraceStep[] } | Unsupported {
  const groups: ShareGroup[] = [];
  const trace: TraceStep[] = [];
  const of = (...keys: HeirKey[]) => effective.filter(h => keys.includes(h.key));
  const ids = (heirs: Heir[]) => heirs.map(h => h.personId);

  const addFardh = (id: GroupId, heirs: Heir[], fardh: Pecahan, reason: FardhReason, refs: string[],
    weights: Record<PersonId, bigint> = equalWeights(heirs)) => {
    groups.push(makeGroup(id, weights, { kind: 'fardh', fardh }));
    trace.push({ stage: 'furudh', refs, kind: 'FARDH', group: id, fardh, reason });
  };
  const addAshabah = (id: GroupId, heirs: Heir[], type: 'binNafsi' | 'bilGhair' | 'maalGhair', refs: string[]) => {
    const weights = type === 'bilGhair' ? Object.fromEntries(heirs.map(h => [h.personId, unitOf(h)])) : equalWeights(heirs);
    groups.push(makeGroup(id, weights, { kind: 'ashabah', type }));
    trace.push({ stage: 'ashabah', refs, kind: 'ASHABAH', group: id, type });
  };
  const nuqshan = (affected: Heir[], from: Pecahan, to: Pecahan, cause: Heir[], refs: string[]) => {
    for (const heir of affected) {
      trace.push({ stage: 'furudh', refs, kind: 'HAJB_NUQSHAN', affected: heir.personId, from, to, cause: ids(cause) });
    }
  };

  const faruWarits = of('IBN', 'BINT', 'IBN_IBN', 'BINT_IBN');
  const faruMudzakkar = of('IBN', 'IBN_IBN');
  const hasFaruMuannats = faruWarits.length > 0 && faruMudzakkar.length === 0;
  const ikhwah = candidates.filter(h => SIBLING_KEYS.includes(h.key));
  const umariyyatain = isUmariyyatain(effective, ikhwah.length);

  // ─── Pasangan [R04-2] [R04-3] ───
  const zawj = of('ZAWJ');
  const zawjah = of('ZAWJAH');
  let spouseFardh = ZERO;
  const spouseReason: FardhReason = faruWarits.length > 0 ? { code: 'ADA_FARU_WARITS', by: ids(faruWarits) } : { code: 'TANPA_FARU_WARITS' };
  if (zawj.length > 0) {
    spouseFardh = faruWarits.length > 0 ? RUBU : NISF;
    addFardh('ZAWJ', zawj, spouseFardh, spouseReason, ['R04-2']);
    if (faruWarits.length > 0) nuqshan(zawj, NISF, RUBU, faruWarits, ['R04-2']);
  }
  if (zawjah.length > 0) {
    spouseFardh = faruWarits.length > 0 ? TSUMUN : RUBU;
    addFardh('ZAWJAH', zawjah, spouseFardh, spouseReason, ['R04-2', 'R04-3']);
    if (faruWarits.length > 0) nuqshan(zawjah, RUBU, TSUMUN, faruWarits, ['R04-2']);
  }

  // ─── Ibu [R04-4] ───
  const umm = of('UMM');
  if (umm.length > 0) {
    if (umariyyatain) {
      // [R07-1] ibu 1/3 dari sisa setelah pasangan, supaya ayah tidak kurang dari ibu.
      trace.push({ stage: 'furudh', refs: ['R07-1'], kind: 'SPECIAL_CASE', name: 'umariyyatain' });
      addFardh('UMM', umm, kali(TSULUTS, kurang(ONE, spouseFardh)), { code: 'UMARIYYATAIN', spouseFardh }, ['R07-1', 'R04-4']);
    } else {
      const sebab = faruWarits.length > 0 ? faruWarits : ikhwah.length >= 2 ? ikhwah : [];
      const reason: FardhReason = faruWarits.length > 0 ? { code: 'ADA_FARU_WARITS', by: ids(faruWarits) }
        : sebab.length > 0 ? { code: 'JAM_IKHWAH', by: ids(ikhwah) }
        : { code: 'TANPA_FARU_WARITS_DAN_IKHWAH' };
      addFardh('UMM', umm, sebab.length > 0 ? SUDUS : TSULUTS, reason, ['R04-4']);
      if (sebab.length > 0) nuqshan(umm, TSULUTS, SUDUS, sebab, ['R04-4', 'R06-6']);
    }
  }

  // ─── Nenek [R04-7] [R04-8] ───
  const jaddah = of('JADDAH_UMM', 'JADDAH_AB');
  if (jaddah.length > 0) addFardh('JADDAH', jaddah, SUDUS, { code: 'NENEK_TANPA_IBU', count: jaddah.length }, ['R04-7', 'R04-8']);

  // ─── Keturunan [R04-11] [R04-12] [R04-13] ───
  const joinedFemales: Heir[] = [];
  const maleDepth = faruMudzakkar[0]?.kinship.descentDepth ?? Number.POSITIVE_INFINITY;
  let tsulutsanTerpakai = ZERO;
  let levelAbove: Heir[] = [];
  for (const depth of [...new Set(of('BINT', 'BINT_IBN').map(h => h.kinship.descentDepth))].sort((a, b) => a - b)) {
    const females = of('BINT', 'BINT_IBN').filter(h => h.kinship.descentDepth === depth);
    const id = depth === 1 ? 'BINT' : `BINT_IBN_${depth}`;
    if (depth >= maleDepth || bandingkan(tsulutsanTerpakai, TSULUTSAN) === 0) {
      // Diashabahkan laki-laki sederajat, atau qarib mubarak ketika 2/3 sudah habis.
      joinedFemales.push(...females);
    } else if (tsulutsanTerpakai.n === 0n) {
      tsulutsanTerpakai = females.length === 1 ? NISF : TSULUTSAN;
      addFardh(id, females, tsulutsanTerpakai, { code: 'TANPA_MUASHSHIB', count: females.length },
        [depth === 1 ? 'R04-11' : 'R04-12']);
    } else {
      addFardh(id, females, SUDUS, { code: 'TAKMILAH', with: ids(levelAbove) }, ['R04-12']);
      nuqshan(females, females.length === 1 ? NISF : TSULUTSAN, SUDUS, levelAbove, ['R04-12']);
      tsulutsanTerpakai = TSULUTSAN;
    }
    levelAbove = females;
  }
  if (faruMudzakkar.length > 0) {
    addAshabah('ASHABAH', [...faruMudzakkar, ...joinedFemales], joinedFemales.length > 0 ? 'bilGhair' : 'binNafsi',
      joinedFemales.some(h => h.kinship.descentDepth < maleDepth) ? ['R05-4', 'R04-13'] : ['R05-4']);
  } else if (joinedFemales.length > 0) {
    throw new Error("invariant: cucu pr tanpa fardh dan tanpa mu'ashshib seharusnya terhijab [R04-13]");
  }

  // ─── Ayah [R04-5] ───
  const addUshulMudzakkar = (id: GroupId, heir: Heir, refs: string[]) => {
    if (faruMudzakkar.length > 0) {
      addFardh(id, [heir], SUDUS, { code: 'ADA_FARU_MUDZAKKAR', by: ids(faruMudzakkar) }, refs);
    } else if (faruWarits.length > 0) {
      groups.push(makeGroup(id, { [heir.personId]: 1n }, { kind: 'fardhAshabah', fardh: SUDUS }));
      trace.push({ stage: 'furudh', refs, kind: 'FARDH', group: id, fardh: SUDUS, reason: { code: 'ADA_FARU_MUANNATS', by: ids(faruWarits) } });
      trace.push({ stage: 'ashabah', refs, kind: 'ASHABAH', group: id, type: 'binNafsi' });
    } else {
      addAshabah(id, [heir], 'binNafsi', refs);
    }
  };
  const [ab] = of('AB');
  if (ab) addUshulMudzakkar('AB', ab, ['R04-5']);

  // ─── Saudara seibu [R04-16], musyarrakah [R07-2] ───
  const awladUmm = of('AKH_UMM', 'UKHT_UMM');
  const musyarrakah = isMusyarrakah(effective);
  if (musyarrakah) {
    trace.push({ stage: 'furudh', refs: ['R07-2'], kind: 'SPECIAL_CASE', name: 'musyarrakah' });
    addFardh('MUSYARRAKAH', [...awladUmm, ...of('AKH_SYQ', 'UKHT_SYQ')], TSULUTS, { code: 'MUSYARRAKAH' }, ['R07-2']);
  } else if (awladUmm.length > 0) {
    addFardh('AWLAD_UMM', awladUmm, awladUmm.length === 1 ? SUDUS : TSULUTS,
      { code: 'KALALAH', count: awladUmm.length }, ['R04-16']);
  }

  // ─── Kakek [R04-6] dan bab 08 ───
  const siblingsWithJadd = of('AKH_SYQ', 'UKHT_SYQ', 'AKH_AB', 'UKHT_AB');
  const [jadd] = of('JADD');
  if (jadd && isAkdariyyah(effective)) {
    // [R08-5] kakek 1/6 dan saudari 1/2 → 'aul, lalu keduanya dibagi 2:1 dari gabungan saham (tashih).
    const [ukht] = siblingsWithJadd;
    trace.push({ stage: 'furudh', refs: ['R08-5'], kind: 'SPECIAL_CASE', name: 'akdariyyah' });
    trace.push({ stage: 'furudh', refs: ['R08-5'], kind: 'FARDH', group: 'AKDARIYYAH', fardh: SUDUS, reason: { code: 'AKDARIYYAH', part: 'jadd' } });
    addFardh('AKDARIYYAH', [jadd, ukht!], tambah(SUDUS, NISF), { code: 'AKDARIYYAH', part: 'ukht' },
      ['R08-5'], { [jadd.personId]: 2n, [ukht!.personId]: 1n });
  } else if (jadd && siblingsWithJadd.length > 0) {
    const furudhSum = groups.reduce((sum, g) => (g.share.kind === 'fardh' ? tambah(sum, g.share.fardh) : sum), ZERO);
    const result = jaddWalIkhwah(jadd, siblingsWithJadd, furudhSum, hasFaruMuannats);
    if ('status' in result) return result;
    groups.push(...result.groups);
    trace.push(...result.trace);
  } else if (jadd) {
    addUshulMudzakkar('JADD', jadd, ['R04-6']);
  }

  // ─── Saudara kandung / sebapak tanpa kakek [R04-14] [R05-5] ───
  if (!jadd && !musyarrakah) {
    const kandung = addSiblingLine(of('AKH_SYQ'), of('UKHT_SYQ'), 'SYQ', undefined);
    addSiblingLine(of('AKH_AB'), of('UKHT_AB'), 'AB', kandung);
  }

  // ─── Hawasyi lain: bani al-ikhwah, 'umumah [R05-3] ───
  const hawasyi = of(...HAWASYI_ASHABAH);
  if (hawasyi.length > 0) addAshabah('ASHABAH', hawasyi, 'binNafsi', ['R05-3']);

  const residueGroups = groups.filter(g => g.share.kind === 'ashabah' || g.share.kind === 'fardhAshabah');
  if (residueGroups.length > 1) throw new Error(`invariant: lebih dari satu kelompok ashabah (${residueGroups.map(g => g.id)})`);
  return { groups, trace };

  /** Satu garis saudara (kandung atau sebapak). Mengembalikan saudari yang mendapat fardh, untuk takmilah. */
  function addSiblingLine(brothers: Heir[], sisters: Heir[], line: 'SYQ' | 'AB', kandungSisters: Heir[] | undefined): Heir[] {
    if (brothers.length > 0) {
      addAshabah('ASHABAH', [...brothers, ...sisters], sisters.length > 0 ? 'bilGhair' : 'binNafsi', ['R05-4']);
      return [];
    }
    if (sisters.length === 0) return [];
    if (hasFaruMuannats) {
      addAshabah('ASHABAH', sisters, 'maalGhair', ['R05-5']);
      return [];
    }
    if (line === 'AB' && kandungSisters?.length === 1) {
      // [R04-14] saudari sebapak bersama satu saudari kandung: 1/6 takmilah.
      addFardh('UKHT_AB', sisters, SUDUS, { code: 'TAKMILAH', with: ids(kandungSisters) }, ['R04-14']);
      nuqshan(sisters, sisters.length === 1 ? NISF : TSULUTSAN, SUDUS, kandungSisters, ['R04-14']);
      return [];
    }
    addFardh(`UKHT_${line}`, sisters, sisters.length === 1 ? NISF : TSULUTSAN,
      { code: 'KALALAH', count: sisters.length }, ['R04-14']);
    return sisters;
  }
}
