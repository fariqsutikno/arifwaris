import type { EngineResult, FamilyGraph, FardhReason, JaddOption, TraceStep } from '@waris/engine';
import { capitalize, fr, lowerFirst, rupiah } from './format.js';
import { groupLabel, hasRole, listLabel, makeCtx, type Ctx } from './labels.js';
import { narrateNisab } from './nisab.js';

export interface ExplainLine { text: string; refs: string[] }
export interface ExplainSection { title: string; lines: ExplainLine[] }
export interface Explanation { sections: ExplainSection[] }

type Ok = Extract<EngineResult, { status: 'OK' }>;
type Step<K extends TraceStep['kind']> = Extract<TraceStep, { kind: K }>;

const stepsOf = <K extends TraceStep['kind']>(ctx: Ctx, kind: K): Array<Step<K>> =>
  ctx.result.trace.filter((s): s is Step<K> => s.kind === kind);
const line = (text: string, refs: string[] = []): ExplainLine => ({ text, refs });

/**
 * Lapis 2 engine-contract: langkah perhitungan dalam bahasa Indonesia, dibangun hanya dari trace
 * dan tabel. Tiap baris membawa `refs` untuk lapis 3 (dalil, packages/content).
 */
export function explain(result: Ok, graph: FamilyGraph): Explanation {
  const ctx = makeCtx(result, graph);
  const sections = [
    tirkahSection(ctx), heirsSection(ctx), sharesSection(ctx), ashlSection(ctx),
    classSection(ctx), tashihSection(ctx), resultSection(ctx),
  ];
  return { sections: sections.filter((s): s is ExplainSection => s !== undefined) };
}

// ─── Tahap 0 ──────────────────────────────────────────────────────────────────

function tirkahSection(ctx: Ctx): ExplainSection | undefined {
  const [t] = stepsOf(ctx, 'TIRKAH');
  if (!t || t.gross === 0n) return undefined;
  const lines: ExplainLine[] = [];
  const setelahHutang = t.bersih + t.wasiatDipakai;
  if (t.tajhiz > 0n || t.hutang > 0n) {
    lines.push(line(`Tirkah ${rupiah(t.gross)} dikurangi biaya pengurusan jenazah ${rupiah(t.tajhiz)} dan hutang ${rupiah(t.hutang)} → sisa ${rupiah(setelahHutang)}.`
      + (setelahHutang === 0n ? ' Hutang menghabiskan tirkah, tidak ada pembagian waris.' : ''), t.refs));
  }
  if (t.wasiatButuhIjazah > 0n) {
    lines.push(line(`Wasiat ${rupiah(t.wasiatDiminta)} melebihi batas 1/3 (${rupiah(t.wasiatBatas)}); yang dijalankan ${rupiah(t.wasiatDipakai)}. `
      + `Kelebihan ${rupiah(t.wasiatButuhIjazah)} hanya berlaku dengan persetujuan (ijazah) ahli waris.`, ['R01-4']));
  } else if (t.wasiatDiminta > 0n) {
    lines.push(line(`Wasiat ${rupiah(t.wasiatDipakai)} dijalankan karena tidak melebihi 1/3 sisa (${rupiah(t.wasiatBatas)}).`, ['R01-4']));
  }
  lines.push(line(`Harta yang dibagi kepada ahli waris: ${rupiah(t.bersih)}.`, ['R11-1']));
  return { title: 'Harta yang dibagi', lines };
}

// ─── Tahap 1: ahli waris, mawani', hajb hirman ────────────────────────────────

function heirsSection(ctx: Ctx): ExplainSection {
  const heirs = Object.entries(ctx.result.statuses).filter(([, s]) => s.kind === 'heir').map(([id]) => id);
  const lines = [line(`Yang mewarisi: ${listLabel(ctx, heirs)}.`)];

  for (const step of stepsOf(ctx, 'MANI')) {
    const sebab = step.mani === 'qatl' ? "membunuh pewaris (mani' qatl)" : "berbeda agama dengan pewaris (mani' ikhtilaf ad-din)";
    lines.push(line(`${capitalize(listLabel(ctx, [step.personId]))} tidak mewarisi karena ${sebab}.`, step.refs));
  }

  // Orang berperan sama yang terhalang oleh hajib yang sama digabung dalam satu kalimat.
  const grouped = new Map<string, { mahjub: string[]; step: Step<'HAJB_HIRMAN'> }>();
  for (const step of stepsOf(ctx, 'HAJB_HIRMAN')) {
    const key = `${ctx.roleOf(step.mahjub)?.key}|${step.hajib.join(',')}`;
    const entry = grouped.get(key) ?? { mahjub: [], step };
    entry.mahjub.push(step.mahjub);
    grouped.set(key, entry);
  }
  for (const { mahjub, step } of grouped.values()) {
    lines.push(line(`${capitalize(listLabel(ctx, mahjub))} terhalang seluruhnya (hajb hirman) oleh ${listLabel(ctx, step.hajib)}.`, step.refs));
  }
  return { title: 'Ahli waris', lines };
}

// ─── Tahap 2: furudh dan ashabah ──────────────────────────────────────────────

const SPECIAL_NAME = { umariyyatain: "al-'Umariyyatain", musyarrakah: 'al-Musyarrakah', akdariyyah: 'al-Akdariyyah', muaddah: "al-Mu'addah" };
const JADD_OPTION: Record<JaddOption, string> = {
  muqasamah: 'muqasamah (dihitung sebagai saudara)', tsuluts: '1/3 harta', tsulutsBaqi: '1/3 sisa', sudus: '1/6 harta',
};

function sharesSection(ctx: Ctx): ExplainSection {
  const lines: ExplainLine[] = [];
  const fardhGroups = new Set(stepsOf(ctx, 'FARDH').map(s => s.group));
  for (const step of ctx.result.trace) {
    if (step.kind === 'FARDH') lines.push(line(fardhText(ctx, step), step.refs));
    else if (step.kind === 'HAJB_NUQSHAN') {
      lines.push(line(`Hajb nuqshan: bagian ${listLabel(ctx, [step.affected])} berkurang dari ${fr(step.from)} menjadi ${fr(step.to)}.`, step.refs));
    } else if (step.kind === 'SPECIAL_CASE') lines.push(line(`Kasus khusus: ${SPECIAL_NAME[step.name]}.`, step.refs));
    else if (step.kind === 'ASHABAH' && !fardhGroups.has(step.group)) lines.push(...ashabahLines(ctx, step));
  }
  return { title: 'Bagian masing-masing', lines };
}

function fardhText(ctx: Ctx, step: Step<'FARDH'>): string {
  const subject = capitalize(groupLabel(ctx, step.group));
  const f = fr(step.fardh);
  const reason: FardhReason = step.reason;
  switch (reason.code) {
    case 'ADA_FARU_WARITS':
      return `${subject} mendapat ${f} karena ada keturunan yang mewarisi (far'u warits): ${listLabel(ctx, reason.by)}.`;
    case 'TANPA_FARU_WARITS':
      return `${subject} mendapat ${f} karena tidak ada keturunan yang mewarisi (far'u warits).`;
    case 'JAM_IKHWAH': {
      const adaYangTerhalang = reason.by.some(id => ctx.result.statuses[id]?.kind === 'mahjub');
      return `${subject} mendapat ${f} karena ada dua saudara atau lebih (jam' min al-ikhwah): ${listLabel(ctx, reason.by)}`
        + `${adaYangTerhalang ? ', tetap dihitung walaupun mereka terhalang' : ''}.`;
    }
    case 'TANPA_FARU_WARITS_DAN_IKHWAH':
      return `${subject} mendapat ${f} karena tidak ada keturunan yang mewarisi dan tidak ada dua saudara atau lebih.`;
    case 'UMARIYYATAIN':
      return `${subject} mendapat 1/3 dari sisa setelah bagian suami/istri (${fr(reason.spouseFardh)}), yaitu ${f} dari seluruh harta.`;
    case 'NENEK_TANPA_IBU':
      return `${subject} mendapat ${f}${reason.count > 1 ? ' dibagi rata' : ''} karena tidak ada ibu.`;
    case 'TANPA_MUASHSHIB':
      return `${subject} mendapat ${f} karena ${reason.count === 1 ? 'seorang diri' : `berjumlah ${reason.count} orang`}`
        + " tanpa laki-laki sederajat yang menjadikannya ashabah (mu'ashshib).";
    case 'TAKMILAH':
      return `${subject} mendapat ${f} sebagai penyempurna 2/3 (takmilah ats-tsulutsain) bersama ${listLabel(ctx, reason.with)}.`;
    case 'KALALAH':
      return `${subject} mendapat ${f}${reason.count > 1 ? ' dibagi rata' : ''} karena pewaris tidak punya keturunan yang mewarisi maupun ayah/kakek (kalalah).`;
    case 'ADA_FARU_MUDZAKKAR':
      return `${subject} mendapat ${f} saja karena ada keturunan laki-laki: ${listLabel(ctx, reason.by)}.`;
    case 'ADA_FARU_MUANNATS':
      return `${subject} mendapat ${f} ditambah sisa harta (ashabah) karena keturunan yang ada hanya perempuan: ${listLabel(ctx, reason.by)}.`;
    case 'MUSYARRAKAH':
      return `${subject} berbagi ${f} rata per kepala: saudara kandung digabung dengan saudara seibu karena ibu mereka sama.`;
    case 'AKDARIYYAH': {
      const members = ctx.membersOf(step.group);
      if (reason.part === 'jadd') return `${capitalize(listLabel(ctx, members.filter(id => hasRole(ctx, id, ['JADD']))))} diberi 1/6.`;
      const ukht = members.filter(id => !hasRole(ctx, id, ['JADD']));
      return `${capitalize(listLabel(ctx, ukht))} diberi 1/2, lalu bagiannya digabung dengan bagian kakek (1/6 + 1/2 = 2/3) untuk dibagi 2 : 1.`;
    }
    case 'JADD_SISA_SEDIKIT':
      return `Sisa setelah furudh hanya ${fr(reason.sisa)} (tidak lebih dari 1/6) → ${lowerFirst(subject)} mendapat 1/6 dan saudara tidak mendapat bagian.`;
    case 'JADD_WAL_IKHWAH':
      return `${subject} ${jaddChoiceText(reason)}`;
  }
}

function jaddChoiceText(choice: Extract<FardhReason, { code: 'JADD_WAL_IKHWAH' }>): string {
  const options = choice.options.map(o => `${JADD_OPTION[o.name]} = ${fr(o.value)}`).join(', ');
  const chosen = choice.options.find(o => o.name === choice.chosen)!;
  return `mengambil yang terbaik di antara ${options} → ${JADD_OPTION[choice.chosen]} (${fr(chosen.value)}).`;
}

function ashabahLines(ctx: Ctx, step: Step<'ASHABAH'>): ExplainLine[] {
  const subject = capitalize(groupLabel(ctx, step.group));
  const lines: ExplainLine[] = [];
  if (step.jaddChoice) {
    const kakek = ctx.membersOf(step.group).filter(id => hasRole(ctx, id, ['JADD']));
    lines.push(line(`${capitalize(listLabel(ctx, kakek))} ${jaddChoiceText(step.jaddChoice)}`, step.refs));
  }
  const cara = step.type === 'binNafsi' ? 'ashabah bi nafsihi'
    : step.type === 'bilGhair' ? 'ashabah bil ghair: laki-laki mendapat dua kali bagian perempuan'
    : "ashabah ma'al ghair (bersama anak/cucu perempuan)";
  lines.push(line(`${subject} mengambil sisa harta sebagai ${cara}.`, step.refs));
  return lines;
}

// ─── Tahap 3: ashlul mas'alah ─────────────────────────────────────────────────

function ashlSection(ctx: Ctx): ExplainSection {
  const { rows, totals } = ctx.result.table;
  const ashl = totals.ashl!;
  const compares = stepsOf(ctx, 'NISAB_COMPARE').filter(s => s.purpose === 'ashl');
  const lines: ExplainLine[] = [];
  const semuaAshabah = rows.every(r => r.fardh === undefined);

  if (semuaAshabah) lines.push(line(`Semua ahli waris adalah ashabah → ashl = jumlah ru'us (laki-laki dihitung 2): ${ashl}.`, ['R09-2']));
  else if (compares.length === 0) lines.push(line(`Hanya ada satu penyebut (${ashl}) → ashl = ${ashl}.`, ['R09-1']));
  for (const step of compares) lines.push(line(narrateNisab(step), step.refs));

  const saham = rows.map(row => {
    const label = groupLabel(ctx, row.group);
    const s = row.cells['ashl']!;
    if (semuaAshabah) return `${label} ${s}`;
    if (!row.fardh) return `${label} sisa ${s}`;
    const bagianFardh = row.fardh.n * ashl / row.fardh.d;
    return `${label} ${fr(row.fardh)} × ${ashl} = ${bagianFardh}${row.ashabah ? ` + sisa ${s - bagianFardh}` : ''}`;
  });
  lines.push(line(`Ashl = ${ashl}. Saham: ${saham.join('; ')}.`));
  return { title: "Ashlul mas'alah (penyebut bersama)", lines };
}

// ─── Tahap 4: 'adilah / 'aul / radd ───────────────────────────────────────────

function classSection(ctx: Ctx): ExplainSection {
  const [cls] = stepsOf(ctx, 'MASALAH_CLASS');
  if (!cls) throw new Error('trace tanpa MASALAH_CLASS');
  const { sumSaham, ashl } = cls;
  switch (cls.cls) {
    case 'adilah':
      return { title: 'Pemeriksaan jumlah saham', lines: [line(`Jumlah saham = ashl (${ashl}) → masalah 'adilah: tidak ada 'aul maupun radd.`, cls.refs)] };
    case 'ailah':
      return { title: "'Aul", lines: [line(`Jumlah saham ${sumSaham} lebih besar dari ashl ${ashl} → 'aul: ashl dinaikkan menjadi ${sumSaham}, `
        + 'sehingga setiap bagian berkurang secara proporsional.', stepsOf(ctx, 'AUL')[0]?.refs ?? cls.refs)] };
    case 'raddA': case 'raddB':
      return { title: 'Radd (pengembalian sisa)', lines: raddLines(ctx, cls) };
  }
}

function raddLines(ctx: Ctx, cls: Step<'MASALAH_CLASS'>): ExplainLine[] {
  const [radd] = stepsOf(ctx, 'RADD');
  if (!radd) throw new Error('trace radd tanpa langkah RADD');
  const lines = [line(`Jumlah saham ${cls.sumSaham} lebih kecil dari ashl ${cls.ashl} dan tidak ada ashabah → sisa dikembalikan kepada ashabul furudh (radd).`
    + (radd.zawjiyyah ? ' Suami/istri tidak menerima radd.' : ''), cls.refs)];
  const entries = Object.entries(radd.raddiyyah.saham);

  if (!radd.zawjiyyah) {
    const rincian = entries.map(([group, s]) => `${groupLabel(ctx, group)} ${s}`).join(' + ');
    lines.push(line(`Tidak ada suami/istri, maka ashl diganti jumlah saham ahli radd: ${rincian} = ${radd.raddiyyah.ashl}.`, radd.refs));
    return lines;
  }

  const z = radd.zawjiyyah;
  const pasangan = groupLabel(ctx, z.group);
  lines.push(line(`Mas'alah zawjiyyah: ashl ${z.ashl} dari bagian ${pasangan} → ${pasangan} ${z.spouseSaham}, sisa ${z.sisa}.`, radd.refs));
  lines.push(line(entries.length === 1
    ? `Mas'alah raddiyyah: hanya ${groupLabel(ctx, entries[0]![0])} → ashl radd ${radd.raddiyyah.ashl}.`
    : `Mas'alah raddiyyah: perbandingan ${entries.map(([g]) => groupLabel(ctx, g)).join(' : ')} = ${entries.map(([, s]) => s).join(' : ')}`
      + ` → ashl radd ${radd.raddiyyah.ashl}.`, radd.refs));
  for (const step of stepsOf(ctx, 'NISAB_COMPARE').filter(s => s.purpose === 'raddVsSisa')) lines.push(line(narrateNisab(step), step.refs));
  return lines;
}

// ─── Tahap 5: tashih ──────────────────────────────────────────────────────────

function tashihSection(ctx: Ctx): ExplainSection | undefined {
  const inkisar = stepsOf(ctx, 'NISAB_COMPARE').filter(s => s.purpose === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const lines = inkisar.map(step => {
    const members = ctx.membersOf(step.group!);
    const weighted = step.b > BigInt(members.length);
    return line(`${capitalize(groupLabel(ctx, step.group!))}: ${lowerFirst(narrateNisab(step, { weighted }))}`, step.refs);
  });
  for (const step of stepsOf(ctx, 'NISAB_COMPARE').filter(s => s.purpose === 'juzSahm')) lines.push(line(narrateNisab(step), step.refs));
  const [tashih] = stepsOf(ctx, 'TASHIH');
  lines.push(tashih
    ? line(`Juz' as-sahm = ${tashih.juzSahm}. Tashih = ${tashih.base} × ${tashih.juzSahm} = ${tashih.result}.`, tashih.refs)
    : line("Semua saham habis dibagi jumlah ru'usnya → tidak perlu tashih.", ['R10-2']));
  return { title: 'Tashih (koreksi agar bagian per orang bulat)', lines };
}

// ─── Tahap 6: hasil ───────────────────────────────────────────────────────────

function resultSection(ctx: Ctx): ExplainSection {
  const { table, rounding } = ctx.result;
  const penyebut = table.totals.tashih ?? table.totals.radd ?? table.totals.aul ?? table.totals.ashl!;
  const tampilkanNominal = (stepsOf(ctx, 'TIRKAH')[0]?.gross ?? 0n) > 0n;
  const lines: ExplainLine[] = [];
  for (const row of table.rows) {
    for (const [id, { saham, nominal }] of Object.entries(row.perPerson)) {
      lines.push(line(`${capitalize(listLabel(ctx, [id]))}: ${saham}/${penyebut}${tampilkanNominal ? ` = ${rupiah(nominal)}` : ''}.`, ['R11-1']));
    }
  }
  if (tampilkanNominal && rounding.remainder > 0n) {
    const perUnit = rounding.unit > 1n;
    lines.push(line(`Selisih pembulatan ${rupiah(rounding.remainder)}${perUnit ? ` (dibulatkan ke bawah per ${rupiah(rounding.unit)})` : ''} belum dibagikan; `
      + 'tetap milik ahli waris dan perlu disepakati penyalurannya.'
      + (perUnit ? ' Bila diserahkan lewat transfer bank, pembagian bisa per rupiah sehingga selisihnya lebih kecil.' : '')));
  }
  return { title: 'Hasil', lines };
}
