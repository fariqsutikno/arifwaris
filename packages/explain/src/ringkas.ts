import type { FardhReason, JaddOption, PersonId } from '@waris/engine';
import type { Section } from './cerita.js';
import { group, mentionAll, type Ctx, type Step } from './context.js';
import { rupiah } from './format.js';
import { narrateNisab } from './nisab.js';
import { line, s, type ExplainLine, type Segment } from './segments.js';
import { term } from './terms.js';

/** Mode ringkas (pelajar/ustadz): istilah dulu, langsung ke angka. */
export function ringkasSections(ctx: Ctx): Section[] {
  return [harta, ahliWaris, bagian, ashl, klasifikasi, tashih, hasil]
    .map(build => build(ctx))
    .filter((section): section is Section => section !== undefined);
}

function harta(ctx: Ctx): Section | undefined {
  const [t] = ctx.steps('TIRKAH');
  if (!t || t.gross === 0n) return undefined;
  const lines: ExplainLine[] = [];
  if (t.tajhiz > 0n || t.hutang > 0n) {
    lines.push(line(s`${term('tirkah', 'Tirkah')} ${rupiah(t.gross)} − tajhiz ${rupiah(t.tajhiz)} − hutang ${rupiah(t.hutang)} = ${rupiah(t.bersih + t.wasiatDipakai)}.`, t.refs));
  }
  if (t.wasiatDiminta > 0n) {
    lines.push(line(s`Wasiat ${rupiah(t.wasiatDiminta)}, batas 1/3 = ${rupiah(t.wasiatBatas)} → dijalankan ${rupiah(t.wasiatDipakai)}`
      .concat(t.wasiatButuhIjazah > 0n ? s`; kelebihan ${rupiah(t.wasiatButuhIjazah)} butuh ijazah ahli waris.` : s`.`), ['R01-4']));
  }
  lines.push(line(s`Tirkah bersih: ${rupiah(t.bersih)}.`, ['R11-1']));
  return { title: 'Harta yang dibagi', lines };
}

function ahliWaris(ctx: Ctx): Section {
  const heirs = Object.entries(ctx.result.statuses).filter(([, st]) => st.kind === 'heir').map(([id]) => id);
  const lines = [line(s`Yang mewarisi: ${mentionAll(ctx, heirs)}.`)];
  for (const step of ctx.steps('MANI')) {
    lines.push(line(s`${ctx.people.mention([step.personId])} tidak mewarisi: ${term('mani', "mani'")} ${step.mani === 'qatl' ? 'qatl' : 'ikhtilaf ad-din'}.`, step.refs));
  }
  for (const step of ctx.steps('HAJB_HIRMAN')) {
    lines.push(line(s`${ctx.people.mention([step.mahjub])} ${term('hajb-hirman', 'mahjub hirman')} oleh ${mentionAll(ctx, step.hajib)}.`, step.refs));
  }
  return { title: 'Ahli waris', lines };
}

const JADD_OPTION: Record<JaddOption, string> = { muqasamah: 'muqasamah', tsuluts: '1/3 harta', tsulutsBaqi: '1/3 sisa', sudus: '1/6 harta' };

function jaddChoice(choice: Extract<FardhReason, { code: 'JADD_WAL_IKHWAH' }>): Segment[] {
  const chosen = choice.options.find(o => o.name === choice.chosen)!;
  return s`terbaik dari ${choice.options.map(o => `${JADD_OPTION[o.name]} ${o.value.n}/${o.value.d}`).join(', ')} → ${JADD_OPTION[choice.chosen]} ${chosen.value}.`;
}

function fardhReason(ctx: Ctx, reason: FardhReason): Segment[] {
  switch (reason.code) {
    case 'ADA_FARU_WARITS': return s`ada ${term('faru-warits', "far'u warits")} (${mentionAll(ctx, reason.by)})`;
    case 'TANPA_FARU_WARITS': return s`tanpa ${term('faru-warits', "far'u warits")}`;
    case 'JAM_IKHWAH': return s`${term('jam-min-al-ikhwah', "jam' min al-ikhwah")} (${mentionAll(ctx, reason.by)})`;
    case 'TANPA_FARU_WARITS_DAN_IKHWAH': return s`tanpa far'u warits dan tanpa jam' min al-ikhwah`;
    case 'UMARIYYATAIN': return s`${term('umariyyatain', "'Umariyyatain")}: 1/3 sisa setelah pasangan ${reason.spouseFardh}`;
    case 'NENEK_TANPA_IBU': return s`tanpa ibu`;
    case 'TANPA_MUASHSHIB': return s`${reason.count} orang, tanpa ${term('muashshib', "mu'ashshib")}`;
    case 'TAKMILAH': return s`${term('takmilah-tsulutsain', 'takmilah ats-tsulutsain')} bersama ${mentionAll(ctx, reason.with)}`;
    case 'KALALAH': return s`${reason.count} orang, ${term('kalalah', 'kalalah')}`;
    case 'ADA_FARU_MUDZAKKAR': return s`ada far'u warits laki-laki (${mentionAll(ctx, reason.by)})`;
    case 'ADA_FARU_MUANNATS': return s`far'u warits perempuan saja (${mentionAll(ctx, reason.by)}): 1/6 + sisa`;
    case 'MUSYARRAKAH': return s`${term('musyarrakah', 'musyarrakah')}, rata per kepala`;
    case 'AKDARIYYAH': return s`${term('akdariyyah', 'akdariyyah')} (${reason.part === 'jadd' ? 'kakek 1/6' : 'saudari 1/2, digabung dengan kakek lalu 2 : 1'})`;
    case 'JADD_SISA_SEDIKIT': return s`sisa ${reason.sisa} ≤ 1/6 → kakek 1/6, saudara gugur`;
    case 'JADD_WAL_IKHWAH': return jaddChoice(reason);
  }
}

function bagian(ctx: Ctx): Section {
  const lines: ExplainLine[] = [];
  const fardhGroups = new Set(ctx.steps('FARDH').map(st => st.group));
  for (const step of ctx.result.trace) {
    if (step.kind === 'FARDH') {
      lines.push(line(s`${group(ctx, step.group)}: ${step.fardh} — ${fardhReason(ctx, step.reason)}.`, step.refs));
    } else if (step.kind === 'HAJB_NUQSHAN') {
      lines.push(line(s`${term('hajb-nuqshan', 'Hajb nuqshan')}: ${ctx.people.mention([step.affected])} ${step.from} → ${step.to}.`, step.refs));
    } else if (step.kind === 'ASHABAH' && !fardhGroups.has(step.group)) {
      const jenis = step.type === 'binNafsi' ? term('bi-nafsihi', 'ashabah bi nafsihi')
        : step.type === 'bilGhair' ? term('bil-ghair', 'ashabah bil ghair (2 : 1)') : term('maal-ghair', "ashabah ma'al ghair");
      lines.push(line(s`${group(ctx, step.group)}: ${jenis}${step.jaddChoice ? s` — kakek ${jaddChoice(step.jaddChoice)}` : '.'}`, step.refs));
    } else if (step.kind === 'SPECIAL_CASE') {
      lines.push(line(s`Kasus khusus: ${term(step.name, step.name)}.`, step.refs));
    }
  }
  return { title: 'Bagian masing-masing', lines };
}

function ashl(ctx: Ctx): Section {
  const { rows, totals } = ctx.result.table;
  const value = totals.ashl!;
  const lines: ExplainLine[] = ctx.steps('NISAB_COMPARE').filter(st => st.purpose === 'ashl').map(st => line(narrateNisab(st), st.refs));
  const parts = rows.map(row => s`${group(ctx, row.group)} ${row.cells['ashl']!}`);
  lines.push(line(s`${term('ashlul-masalah', 'Ashl')} = ${value}. ${term('saham', 'Saham')}: `.concat(...parts.flatMap((p, i) => (i ? [s`; `, p] : [p])), s`.`)));
  return { title: "Ashlul mas'alah", lines };
}

function klasifikasi(ctx: Ctx): Section {
  const [cls] = ctx.steps('MASALAH_CLASS');
  if (!cls) throw new Error('trace tanpa MASALAH_CLASS');
  const lines: ExplainLine[] = [];
  if (cls.cls === 'adilah') lines.push(line(s`Σ saham ${cls.sumSaham} = ashl ${cls.ashl} → ${term('adilah', "'adilah")}.`, cls.refs));
  if (cls.cls === 'ailah') lines.push(line(s`Σ saham ${cls.sumSaham} > ashl ${cls.ashl} → ${term('aul', "'aul")} ke ${cls.sumSaham}.`, cls.refs));
  if (cls.cls === 'raddA' || cls.cls === 'raddB') {
    lines.push(line(s`Σ saham ${cls.sumSaham} < ashl ${cls.ashl}, tanpa ashabah → ${term('radd', 'radd')}${cls.cls === 'raddB' ? ' (pasangan tidak menerima radd)' : ''}.`, cls.refs));
    const [radd] = ctx.steps('RADD');
    if (radd?.zawjiyyah) {
      const z = radd.zawjiyyah;
      lines.push(line(s`Zawjiyyah: ashl ${z.ashl}, ${group(ctx, z.group)} ${z.spouseSaham}, sisa ${z.sisa}. Raddiyyah: ${Object.values(radd.raddiyyah.saham).join(' : ')} → ashl radd ${radd.raddiyyah.ashl}.`, radd.refs));
    } else if (radd) {
      lines.push(line(s`Ashl radd = Σ saham ahli radd = ${radd.raddiyyah.ashl}.`, radd.refs));
    }
    for (const st of ctx.steps('NISAB_COMPARE').filter(x => x.purpose === 'raddVsSisa')) lines.push(line(narrateNisab(st), st.refs));
  }
  return { title: 'Klasifikasi', lines };
}

function tashih(ctx: Ctx): Section | undefined {
  const inkisar = ctx.steps('NISAB_COMPARE').filter(st => st.purpose === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const lines = inkisar.map(st => line(s`${group(ctx, st.group!)}: `
    .concat(narrateNisab(st, { weighted: st.b > BigInt(ctx.membersOf(st.group!).length) })), st.refs));
  for (const st of ctx.steps('NISAB_COMPARE').filter(x => x.purpose === 'juzSahm')) lines.push(line(narrateNisab(st), st.refs));
  const [t] = ctx.steps('TASHIH');
  lines.push(t
    ? line(s`${term('juz-as-sahm', "Juz' as-sahm")} = ${t.juzSahm}. ${term('tashih', 'Tashih')} = ${t.base} × ${t.juzSahm} = ${t.result}.`, t.refs)
    : line(s`Tanpa ${term('inkisar', 'inkisar')} → tidak perlu tashih.`, ['R10-2']));
  return { title: 'Tashih', lines };
}

function hasil(ctx: Ctx): Section {
  const { table, rounding } = ctx.result;
  const lines: ExplainLine[] = [];
  for (const row of table.rows) {
    for (const [id, { saham, nominal }] of Object.entries(row.perPerson) as Array<[PersonId, { saham: bigint; nominal: bigint }]>) {
      lines.push(line(s`${ctx.people.mention([id])}: ${saham}/${ctx.finalDenominator}${ctx.showNominal ? ` = ${rupiah(nominal)}` : ''}.`, ['R11-1']));
    }
  }
  if (ctx.showNominal && rounding.remainder > 0n) {
    lines.push(line(s`Selisih pembulatan ${rupiah(rounding.remainder)} (per ${rupiah(rounding.unit)}), belum dibagikan.`));
  }
  return { title: 'Hasil', lines };
}
