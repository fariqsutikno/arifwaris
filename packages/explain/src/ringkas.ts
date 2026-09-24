import type { AlasanFardh, PilihanJadd, IdOrang } from '@waris/engine';
import type { Section } from './cerita.js';
import { kelompok, mentionAll, type Ctx, type Step } from './context.js';
import { rupiah } from './format.js';
import { narrateNisab } from './nisab.js';
import { line, s, type ExplainLine, type Segment } from './segments.js';
import { term } from './terms.js';

/** Mode ringkas (pelajar/ustadz): istilah dulu, langsung ke angka. */
export function ringkasSections(ctx: Ctx): Section[] {
  return [babHarta, babAhliWaris, babBagian, babAshl, babKlasifikasi, babTashih, babHasil]
    .map(build => build(ctx))
    .filter((section): section is Section => section !== undefined);
}

function babHarta(ctx: Ctx): Section | undefined {
  const [t] = ctx.langkahLangkah('TIRKAH');
  if (!t || t.kotor === 0n) return undefined;
  const lines: ExplainLine[] = [];
  if (t.tajhiz > 0n || t.hutang > 0n) {
    lines.push(line(s`${term('tirkah', 'Tirkah')} ${rupiah(t.kotor)} − tajhiz ${rupiah(t.tajhiz)} − hutang ${rupiah(t.hutang)} = ${rupiah(t.bersih + t.wasiatDipakai)}.`, t.refs));
  }
  if (t.wasiatDiminta > 0n) {
    lines.push(line(s`Wasiat ${rupiah(t.wasiatDiminta)}, batas 1/3 = ${rupiah(t.wasiatBatas)} → dijalankan ${rupiah(t.wasiatDipakai)}`
      .concat(t.wasiatButuhIjazah > 0n ? s`; kelebihan ${rupiah(t.wasiatButuhIjazah)} butuh ijazah ahli waris.` : s`.`), ['R01-4']));
  }
  lines.push(line(s`Tirkah bersih: ${rupiah(t.bersih)}.`, ['R11-1']));
  return { title: 'Harta yang dibagi', lines };
}

function babAhliWaris(ctx: Ctx): Section {
  const daftarAhliWaris = Object.entries(ctx.hasil.statusOrang).filter(([, st]) => st.jenis === 'ahliWaris').map(([id]) => id);
  const lines = [line(s`Yang mewarisi: ${mentionAll(ctx, daftarAhliWaris)}.`)];
  for (const step of ctx.langkahLangkah('MANI')) {
    lines.push(line(s`${ctx.people.mention([step.idOrang])} tidak mewarisi: ${term('mani', "mani'")} ${step.mani === 'qatl' ? 'qatl' : 'ikhtilaf ad-din'}.`, step.refs));
  }
  for (const step of ctx.langkahLangkah('HAJB_HIRMAN')) {
    lines.push(line(s`${ctx.people.mention([step.mahjub])} ${term('hajb-hirman', 'mahjub hirman')} oleh ${mentionAll(ctx, step.hajib)}.`, step.refs));
  }
  return { title: 'Ahli waris', lines };
}

const JADD_OPTION: Record<PilihanJadd, string> = { muqasamah: 'muqasamah', tsuluts: '1/3 harta', tsulutsBaqi: '1/3 sisa', sudus: '1/6 harta' };

function pilihanJadd(choice: Extract<AlasanFardh, { code: 'JADD_WAL_IKHWAH' }>): Segment[] {
  const terpilih = choice.opsi.find(o => o.nama === choice.terpilih)!;
  return s`terbaik dari ${choice.opsi.map(o => `${JADD_OPTION[o.nama]} ${o.nilai.n}/${o.nilai.d}`).join(', ')} → ${JADD_OPTION[choice.terpilih]} ${terpilih.nilai}.`;
}

function fardhReason(ctx: Ctx, alasan: AlasanFardh): Segment[] {
  switch (alasan.code) {
    case 'ADA_FARU_WARITS': return s`ada ${term('faru-warits', "far'u warits")} (${mentionAll(ctx, alasan.oleh)})`;
    case 'TANPA_FARU_WARITS': return s`tanpa ${term('faru-warits', "far'u warits")}`;
    case 'JAM_IKHWAH': return s`${term('jam-min-al-ikhwah', "jam' min al-ikhwah")} (${mentionAll(ctx, alasan.oleh)})`;
    case 'TANPA_FARU_WARITS_DAN_IKHWAH': return s`tanpa far'u warits dan tanpa jam' min al-ikhwah`;
    case 'UMARIYYATAIN': return s`${term('umariyyatain', "'Umariyyatain")}: 1/3 sisa setelah pasangan ${alasan.fardhPasangan}`;
    case 'NENEK_TANPA_IBU': return s`tanpa ibu`;
    case 'TANPA_MUASHSHIB': return s`${alasan.banyaknya} orang, tanpa ${term('muashshib', "mu'ashshib")}`;
    case 'TAKMILAH': return s`${term('takmilah-tsulutsain', 'takmilah ats-tsulutsain')} bersama ${mentionAll(ctx, alasan.with)}`;
    case 'KALALAH': return s`${alasan.banyaknya} orang, ${term('kalalah', 'kalalah')}`;
    case 'ADA_FARU_MUDZAKKAR': return s`ada far'u warits laki-laki (${mentionAll(ctx, alasan.oleh)})`;
    case 'ADA_FARU_MUANNATS': return s`far'u warits perempuan saja (${mentionAll(ctx, alasan.oleh)}): 1/6 + sisa`;
    case 'MUSYARRAKAH': return s`${term('musyarrakah', 'musyarrakah')}, rata per kepala`;
    case 'AKDARIYYAH': return s`${term('akdariyyah', 'akdariyyah')} (${alasan.porsi === 'jadd' ? 'kakek 1/6' : 'saudari 1/2, digabung dengan kakek lalu 2 : 1'})`;
    case 'JADD_SISA_SEDIKIT': return s`sisa ${alasan.sisa} ≤ 1/6 → kakek 1/6, saudara gugur`;
    case 'JADD_WAL_IKHWAH': return pilihanJadd(alasan);
  }
}

function babBagian(ctx: Ctx): Section {
  const lines: ExplainLine[] = [];
  const fardhGroups = new Set(ctx.langkahLangkah('FARDH').map(st => st.kelompok));
  for (const step of ctx.hasil.jejak) {
    if (step.jenis === 'FARDH') {
      lines.push(line(s`${kelompok(ctx, step.kelompok)}: ${step.fardh} — ${fardhReason(ctx, step.alasan)}.`, step.refs));
    } else if (step.jenis === 'HAJB_NUQSHAN') {
      lines.push(line(s`${term('hajb-nuqshan', 'Hajb nuqshan')}: ${ctx.people.mention([step.terdampak])} ${step.from} → ${step.to}.`, step.refs));
    } else if (step.jenis === 'ASHABAH' && !fardhGroups.has(step.kelompok)) {
      const jenis = step.type === 'binNafsi' ? term('bi-nafsihi', 'ashabah bi nafsihi')
        : step.type === 'bilGhair' ? term('bil-ghair', 'ashabah bil ghair (2 : 1)') : term('maal-ghair', "ashabah ma'al ghair");
      lines.push(line(s`${kelompok(ctx, step.kelompok)}: ${jenis}${step.pilihanJadd ? s` — kakek ${pilihanJadd(step.pilihanJadd)}` : '.'}`, step.refs));
    } else if (step.jenis === 'KASUS_KHUSUS') {
      lines.push(line(s`Kasus khusus: ${term(step.nama, step.nama)}.`, step.refs));
    }
  }
  return { title: 'Bagian masing-masing', lines };
}

function babAshl(ctx: Ctx): Section {
  const { baris, totalKolom } = ctx.hasil.tabel;
  const nilai = totalKolom.ashl!;
  const lines: ExplainLine[] = ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(st => st.tujuan === 'ashl').map(st => line(narrateNisab(st), st.refs));
  const parts = baris.map(barisTabel => s`${kelompok(ctx, barisTabel.kelompok)} ${barisTabel.sel['ashl']!}`);
  lines.push(line(s`${term('ashlul-masalah', 'Ashl')} = ${nilai}. ${term('saham', 'Saham')}: `.concat(...parts.flatMap((p, i) => (i ? [s`; `, p] : [p])), s`.`)));
  return { title: "Ashlul mas'alah", lines };
}

function babKlasifikasi(ctx: Ctx): Section {
  const [kelas] = ctx.langkahLangkah('KELAS_MASALAH');
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const lines: ExplainLine[] = [];
  if (kelas.kelas === 'adilah') lines.push(line(s`Σ saham ${kelas.jumlahSaham} = ashl ${kelas.ashl} → ${term('adilah', "'adilah")}.`, kelas.refs));
  if (kelas.kelas === 'ailah') lines.push(line(s`Σ saham ${kelas.jumlahSaham} > ashl ${kelas.ashl} → ${term('aul', "'aul")} ke ${kelas.jumlahSaham}.`, kelas.refs));
  if (kelas.kelas === 'raddA' || kelas.kelas === 'raddB') {
    lines.push(line(s`Σ saham ${kelas.jumlahSaham} < ashl ${kelas.ashl}, tanpa ashabah → ${term('radd', 'radd')}${kelas.kelas === 'raddB' ? ' (pasangan tidak menerima radd)' : ''}.`, kelas.refs));
    const [radd] = ctx.langkahLangkah('RADD');
    if (radd?.zawjiyyah) {
      const z = radd.zawjiyyah;
      lines.push(line(s`Zawjiyyah: ashl ${z.ashl}, ${kelompok(ctx, z.kelompok)} ${z.sahamPasangan}, sisa ${z.sisa}. Raddiyyah: ${Object.values(radd.raddiyyah.saham).join(' : ')} → ashl radd ${radd.raddiyyah.ashl}.`, radd.refs));
    } else if (radd) {
      lines.push(line(s`Ashl radd = Σ saham ahli radd = ${radd.raddiyyah.ashl}.`, radd.refs));
    }
    for (const st of ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(x => x.tujuan === 'raddVsSisa')) lines.push(line(narrateNisab(st), st.refs));
  }
  return { title: 'Klasifikasi', lines };
}

function babTashih(ctx: Ctx): Section | undefined {
  const inkisar = ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(st => st.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const lines = inkisar.map(st => line(s`${kelompok(ctx, st.kelompok!)}: `
    .concat(narrateNisab(st, { weighted: st.b > BigInt(ctx.membersOf(st.kelompok!).length) })), st.refs));
  for (const st of ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(x => x.tujuan === 'juzSahm')) lines.push(line(narrateNisab(st), st.refs));
  const [t] = ctx.langkahLangkah('TASHIH');
  lines.push(t
    ? line(s`${term('juz-as-sahm', "Juz' as-sahm")} = ${t.juzSahm}. ${term('tashih', 'Tashih')} = ${t.dasar} × ${t.juzSahm} = ${t.hasil}.`, t.refs)
    : line(s`Tanpa ${term('inkisar', 'inkisar')} → tidak perlu tashih.`, ['R10-2']));
  return { title: 'Tashih', lines };
}

function babHasil(ctx: Ctx): Section {
  const { tabel, pembulatan } = ctx.hasil;
  const lines: ExplainLine[] = [];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang) as Array<[IdOrang, { saham: bigint; nominal: bigint }]>) {
      lines.push(line(s`${ctx.people.mention([id])}: ${saham}/${ctx.finalDenominator}${ctx.showNominal ? ` = ${rupiah(nominal)}` : ''}.`, ['R11-1']));
    }
  }
  if (ctx.showNominal && pembulatan.sisaPembulatan > 0n) {
    lines.push(line(s`Selisih pembulatan ${rupiah(pembulatan.sisaPembulatan)} (per ${rupiah(pembulatan.satuan)}), belum dibagikan.`));
  }
  return { title: 'Hasil', lines };
}
