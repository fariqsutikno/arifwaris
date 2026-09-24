import { tambah, bandingkan, pecahan, kali, kurang, type Pecahan } from '@waris/math';
import type { AlasanFardh, IdKelompok, KunciAhliWaris, IdOrang, LangkahJejak } from '../types.js';
import { jaddWalIkhwah } from './jaddWalIkhwah.js';
import { isAkdariyyah, isMusyarrakah, isUmariyyatain } from './khusus.js';
import { equalWeights, makeGroup, unitOf, type AhliWaris, type KelompokBagian, type Unsupported } from './model.js';

const ZERO = pecahan(0n);
const ONE = pecahan(1n);
const NISF = pecahan(1n, 2n);
const RUBU = pecahan(1n, 4n);
const TSUMUN = pecahan(1n, 8n);
const TSULUTSAN = pecahan(2n, 3n);
const TSULUTS = pecahan(1n, 3n);
const SUDUS = pecahan(1n, 6n);

const SIBLING_KEYS: KunciAhliWaris[] = ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'];
const HAWASYI_ASHABAH: KunciAhliWaris[] = ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'];

/**
 * Tahap 2: bagian tiap kelompok — furudh (bab 04), ashabah (bab 05), kasus khusus bab 07 & 08.
 * `efektif` = ahli waris setelah hajb; `kandidat` = sebelum hajb, dipakai untuk jam' min al-ikhwah
 * karena saudara yang mahjub tetap mengurangi bagian ibu [R06-6].
 */
export function tetapkanBagian(efektif: AhliWaris[], kandidat: AhliWaris[]): { kelompokKelompok: KelompokBagian[]; jejak: LangkahJejak[] } | Unsupported {
  const kelompokKelompok: KelompokBagian[] = [];
  const jejak: LangkahJejak[] = [];
  const of = (...keys: KunciAhliWaris[]) => efektif.filter(h => keys.includes(h.kunci));
  const ids = (daftarAhliWaris: AhliWaris[]) => daftarAhliWaris.map(h => h.idOrang);

  const addFardh = (id: IdKelompok, daftarAhliWaris: AhliWaris[], fardh: Pecahan, alasan: AlasanFardh, refs: string[],
    bobot: Record<IdOrang, bigint> = equalWeights(daftarAhliWaris)) => {
    kelompokKelompok.push(makeGroup(id, bobot, { jenis: 'fardh', fardh }));
    jejak.push({ tahap: 'furudh', refs, jenis: 'FARDH', kelompok: id, fardh, alasan });
  };
  const addAshabah = (id: IdKelompok, daftarAhliWaris: AhliWaris[], type: 'binNafsi' | 'bilGhair' | 'maalGhair', refs: string[]) => {
    const bobot = type === 'bilGhair' ? Object.fromEntries(daftarAhliWaris.map(h => [h.idOrang, unitOf(h)])) : equalWeights(daftarAhliWaris);
    kelompokKelompok.push(makeGroup(id, bobot, { jenis: 'ashabah', type }));
    jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: id, type });
  };
  const nuqshan = (terdampak: AhliWaris[], from: Pecahan, to: Pecahan, penyebab: AhliWaris[], refs: string[]) => {
    for (const ahliWaris of terdampak) {
      jejak.push({ tahap: 'furudh', refs, jenis: 'HAJB_NUQSHAN', terdampak: ahliWaris.idOrang, from, to, penyebab: ids(penyebab) });
    }
  };

  const faruWarits = of('ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR');
  const faruMudzakkar = of('ANAK_LK', 'CUCU_LK');
  const hasFaruMuannats = faruWarits.length > 0 && faruMudzakkar.length === 0;
  const ikhwah = kandidat.filter(h => SIBLING_KEYS.includes(h.kunci));
  const umariyyatain = isUmariyyatain(efektif, ikhwah.length);

  // ─── Pasangan [R04-2] [R04-3] ───
  const zawj = of('SUAMI');
  const zawjah = of('ISTRI');
  let fardhPasangan = ZERO;
  const spouseReason: AlasanFardh = faruWarits.length > 0 ? { code: 'ADA_FARU_WARITS', oleh: ids(faruWarits) } : { code: 'TANPA_FARU_WARITS' };
  if (zawj.length > 0) {
    fardhPasangan = faruWarits.length > 0 ? RUBU : NISF;
    addFardh('SUAMI', zawj, fardhPasangan, spouseReason, ['R04-2']);
    if (faruWarits.length > 0) nuqshan(zawj, NISF, RUBU, faruWarits, ['R04-2']);
  }
  if (zawjah.length > 0) {
    fardhPasangan = faruWarits.length > 0 ? TSUMUN : RUBU;
    addFardh('ISTRI', zawjah, fardhPasangan, spouseReason, ['R04-2', 'R04-3']);
    if (faruWarits.length > 0) nuqshan(zawjah, RUBU, TSUMUN, faruWarits, ['R04-2']);
  }

  // ─── Ibu [R04-4] ───
  const umm = of('IBU');
  if (umm.length > 0) {
    if (umariyyatain) {
      // [R07-1] ibu 1/3 dari sisa setelah pasangan, supaya ayah tidak kurang dari ibu.
      jejak.push({ tahap: 'furudh', refs: ['R07-1'], jenis: 'KASUS_KHUSUS', nama: 'umariyyatain' });
      addFardh('IBU', umm, kali(TSULUTS, kurang(ONE, fardhPasangan)), { code: 'UMARIYYATAIN', fardhPasangan }, ['R07-1', 'R04-4']);
    } else {
      const sebab = faruWarits.length > 0 ? faruWarits : ikhwah.length >= 2 ? ikhwah : [];
      const alasan: AlasanFardh = faruWarits.length > 0 ? { code: 'ADA_FARU_WARITS', oleh: ids(faruWarits) }
        : sebab.length > 0 ? { code: 'JAM_IKHWAH', oleh: ids(ikhwah) }
        : { code: 'TANPA_FARU_WARITS_DAN_IKHWAH' };
      addFardh('IBU', umm, sebab.length > 0 ? SUDUS : TSULUTS, alasan, ['R04-4']);
      if (sebab.length > 0) nuqshan(umm, TSULUTS, SUDUS, sebab, ['R04-4', 'R06-6']);
    }
  }

  // ─── Nenek [R04-7] [R04-8] ───
  const jaddah = of('NENEK_DARI_IBU', 'NENEK_DARI_AYAH');
  if (jaddah.length > 0) addFardh('JADDAH', jaddah, SUDUS, { code: 'NENEK_TANPA_IBU', banyaknya: jaddah.length }, ['R04-7', 'R04-8']);

  // ─── Keturunan [R04-11] [R04-12] [R04-13] ───
  const joinedFemales: AhliWaris[] = [];
  const maleDepth = faruMudzakkar[0]?.kekerabatan.kedalamanKeturunan ?? Number.POSITIVE_INFINITY;
  let tsulutsanTerpakai = ZERO;
  let levelAbove: AhliWaris[] = [];
  for (const kedalaman of [...new Set(of('ANAK_PR', 'CUCU_PR').map(h => h.kekerabatan.kedalamanKeturunan))].sort((a, b) => a - b)) {
    const females = of('ANAK_PR', 'CUCU_PR').filter(h => h.kekerabatan.kedalamanKeturunan === kedalaman);
    const id = kedalaman === 1 ? 'ANAK_PR' : `CUCU_PR_${kedalaman}`;
    if (kedalaman >= maleDepth || bandingkan(tsulutsanTerpakai, TSULUTSAN) === 0) {
      // Diashabahkan laki-laki sederajat, atau qarib mubarak ketika 2/3 sudah habis.
      joinedFemales.push(...females);
    } else if (tsulutsanTerpakai.n === 0n) {
      tsulutsanTerpakai = females.length === 1 ? NISF : TSULUTSAN;
      addFardh(id, females, tsulutsanTerpakai, { code: 'TANPA_MUASHSHIB', banyaknya: females.length },
        [kedalaman === 1 ? 'R04-11' : 'R04-12']);
    } else {
      addFardh(id, females, SUDUS, { code: 'TAKMILAH', with: ids(levelAbove) }, ['R04-12']);
      nuqshan(females, females.length === 1 ? NISF : TSULUTSAN, SUDUS, levelAbove, ['R04-12']);
      tsulutsanTerpakai = TSULUTSAN;
    }
    levelAbove = females;
  }
  if (faruMudzakkar.length > 0) {
    addAshabah('ASHABAH', [...faruMudzakkar, ...joinedFemales], joinedFemales.length > 0 ? 'bilGhair' : 'binNafsi',
      joinedFemales.some(h => h.kekerabatan.kedalamanKeturunan < maleDepth) ? ['R05-4', 'R04-13'] : ['R05-4']);
  } else if (joinedFemales.length > 0) {
    throw new Error("invariant: cucu pr tanpa fardh dan tanpa mu'ashshib seharusnya terhijab [R04-13]");
  }

  // ─── Ayah [R04-5] ───
  const addUshulMudzakkar = (id: IdKelompok, ahliWaris: AhliWaris, refs: string[]) => {
    if (faruMudzakkar.length > 0) {
      addFardh(id, [ahliWaris], SUDUS, { code: 'ADA_FARU_MUDZAKKAR', oleh: ids(faruMudzakkar) }, refs);
    } else if (faruWarits.length > 0) {
      kelompokKelompok.push(makeGroup(id, { [ahliWaris.idOrang]: 1n }, { jenis: 'fardhAshabah', fardh: SUDUS }));
      jejak.push({ tahap: 'furudh', refs, jenis: 'FARDH', kelompok: id, fardh: SUDUS, alasan: { code: 'ADA_FARU_MUANNATS', oleh: ids(faruWarits) } });
      jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: id, type: 'binNafsi' });
    } else {
      addAshabah(id, [ahliWaris], 'binNafsi', refs);
    }
  };
  const [ab] = of('AYAH');
  if (ab) addUshulMudzakkar('AYAH', ab, ['R04-5']);

  // ─── Saudara seibu [R04-16], musyarrakah [R07-2] ───
  const awladUmm = of('SAUDARA_SEIBU', 'SAUDARI_SEIBU');
  const musyarrakah = isMusyarrakah(efektif);
  if (musyarrakah) {
    jejak.push({ tahap: 'furudh', refs: ['R07-2'], jenis: 'KASUS_KHUSUS', nama: 'musyarrakah' });
    addFardh('MUSYARRAKAH', [...awladUmm, ...of('SAUDARA_KANDUNG', 'SAUDARI_KANDUNG')], TSULUTS, { code: 'MUSYARRAKAH' }, ['R07-2']);
  } else if (awladUmm.length > 0) {
    addFardh('AWLAD_UMM', awladUmm, awladUmm.length === 1 ? SUDUS : TSULUTS,
      { code: 'KALALAH', banyaknya: awladUmm.length }, ['R04-16']);
  }

  // ─── Kakek [R04-6] dan bab 08 ───
  const siblingsWithJadd = of('SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK');
  const [jadd] = of('KAKEK');
  if (jadd && isAkdariyyah(efektif)) {
    // [R08-5] kakek 1/6 dan saudari 1/2 → 'aul, lalu keduanya dibagi 2:1 dari gabungan saham (tashih).
    const [ukht] = siblingsWithJadd;
    jejak.push({ tahap: 'furudh', refs: ['R08-5'], jenis: 'KASUS_KHUSUS', nama: 'akdariyyah' });
    jejak.push({ tahap: 'furudh', refs: ['R08-5'], jenis: 'FARDH', kelompok: 'AKDARIYYAH', fardh: SUDUS, alasan: { code: 'AKDARIYYAH', porsi: 'jadd' } });
    addFardh('AKDARIYYAH', [jadd, ukht!], tambah(SUDUS, NISF), { code: 'AKDARIYYAH', porsi: 'ukht' },
      ['R08-5'], { [jadd.idOrang]: 2n, [ukht!.idOrang]: 1n });
  } else if (jadd && siblingsWithJadd.length > 0) {
    const furudhSum = kelompokKelompok.reduce((sum, g) => (g.bagian.jenis === 'fardh' ? tambah(sum, g.bagian.fardh) : sum), ZERO);
    const hasil = jaddWalIkhwah(jadd, siblingsWithJadd, furudhSum, hasFaruMuannats);
    if ('status' in hasil) return hasil;
    kelompokKelompok.push(...hasil.kelompokKelompok);
    jejak.push(...hasil.jejak);
  } else if (jadd) {
    addUshulMudzakkar('KAKEK', jadd, ['R04-6']);
  }

  // ─── Saudara kandung / sebapak tanpa kakek [R04-14] [R05-5] ───
  if (!jadd && !musyarrakah) {
    const kandung = addSiblingLine(of('SAUDARA_KANDUNG'), of('SAUDARI_KANDUNG'), 'kandung', undefined);
    addSiblingLine(of('SAUDARA_SEBAPAK'), of('SAUDARI_SEBAPAK'), 'sebapak', kandung);
  }

  // ─── Hawasyi lain: bani al-ikhwah, 'umumah [R05-3] ───
  const hawasyi = of(...HAWASYI_ASHABAH);
  if (hawasyi.length > 0) addAshabah('ASHABAH', hawasyi, 'binNafsi', ['R05-3']);

  const residueGroups = kelompokKelompok.filter(g => g.bagian.jenis === 'ashabah' || g.bagian.jenis === 'fardhAshabah');
  if (residueGroups.length > 1) throw new Error(`invariant: lebih dari satu kelompok ashabah (${residueGroups.map(g => g.id)})`);
  return { kelompokKelompok, jejak };

  /** Satu garis saudara (kandung atau sebapak). Mengembalikan saudari yang mendapat fardh, untuk takmilah. */
  function addSiblingLine(saudaraLk: AhliWaris[], saudari: AhliWaris[], garis: 'kandung' | 'sebapak', kandungSisters: AhliWaris[] | undefined): AhliWaris[] {
    if (saudaraLk.length > 0) {
      addAshabah('ASHABAH', [...saudaraLk, ...saudari], saudari.length > 0 ? 'bilGhair' : 'binNafsi', ['R05-4']);
      return [];
    }
    if (saudari.length === 0) return [];
    if (hasFaruMuannats) {
      addAshabah('ASHABAH', saudari, 'maalGhair', ['R05-5']);
      return [];
    }
    if (garis === 'sebapak' && kandungSisters?.length === 1) {
      // [R04-14] saudari sebapak bersama satu saudari kandung: 1/6 takmilah.
      addFardh('SAUDARI_SEBAPAK', saudari, SUDUS, { code: 'TAKMILAH', with: ids(kandungSisters) }, ['R04-14']);
      nuqshan(saudari, saudari.length === 1 ? NISF : TSULUTSAN, SUDUS, kandungSisters, ['R04-14']);
      return [];
    }
    addFardh(garis === 'kandung' ? 'SAUDARI_KANDUNG' : 'SAUDARI_SEBAPAK', saudari, saudari.length === 1 ? NISF : TSULUTSAN,
      { code: 'KALALAH', banyaknya: saudari.length }, ['R04-14']);
    return saudari;
  }
}
