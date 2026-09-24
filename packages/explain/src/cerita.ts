import type { FardhReason, JaddOption, PersonId } from '@waris/engine';
import { group, mentionAll, type Ctx, type Step } from './context.js';
import { rupiah } from './format.js';
import { joinAnd, line, s, type ExplainLine, type Segment } from './segments.js';
import { term } from './terms.js';

export interface Section { title: string; lines: ExplainLine[] }

/** Mode cerita (default): tiap langkah = masalahnya apa → caranya → istilahnya → hasilnya. */
export function ceritaSections(ctx: Ctx): Section[] {
  return [harta, ahliWaris, bagian, penyebut, penyesuaian, pembulatan, hasil]
    .map(build => build(ctx))
    .filter((section): section is Section => section !== undefined);
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

const orList = (items: Segment[][]) => items.flatMap((item, i) =>
  i === 0 ? item : [{ kind: 'text' as const, text: i === items.length - 1 ? ', atau ' : ', ' }, ...item]);

// ─── Langkah: harta ───────────────────────────────────────────────────────────

function harta(ctx: Ctx): Section | undefined {
  const [t] = ctx.steps('TIRKAH');
  if (!t || t.gross === 0n) return undefined;
  const lines: ExplainLine[] = [];
  const setelahHutang = t.bersih + t.wasiatDipakai;
  if (t.tajhiz > 0n || t.hutang > 0n) {
    lines.push(line([
      ...s`Sebelum dibagi, harta peninggalan (${term('tirkah', 'tirkah')}) ${rupiah(t.gross)} dipakai dulu untuk biaya pengurusan jenazah `,
      ...s`${rupiah(t.tajhiz)} dan melunasi hutang ${rupiah(t.hutang)}, sehingga tersisa ${rupiah(setelahHutang)}.`,
      ...(setelahHutang === 0n ? s` Hutang menghabiskan seluruh harta, sehingga tidak ada yang dibagi sebagai warisan.` : []),
    ], t.refs));
  }
  if (t.wasiatButuhIjazah > 0n) {
    lines.push(line(s`Wasiat ${ctx.people.deceased()} sebesar ${rupiah(t.wasiatDiminta)} melebihi batas sepertiga harta (${rupiah(t.wasiatBatas)}), `
      .concat(s`jadi yang dijalankan hanya ${rupiah(t.wasiatDipakai)}. Kelebihan ${rupiah(t.wasiatButuhIjazah)} baru boleh dijalankan `,
        s`jika semua ahli waris menyetujuinya (ijazah).`), ['R01-4']));
  } else if (t.wasiatDiminta > 0n) {
    lines.push(line(s`Wasiat ${ctx.people.deceased()} sebesar ${rupiah(t.wasiatDipakai)} dijalankan karena tidak melebihi sepertiga harta (${rupiah(t.wasiatBatas)}).`, ['R01-4']));
  }
  lines.push(line(s`Harta yang dibagi kepada ahli waris: ${rupiah(t.bersih)}.`, ['R11-1']));
  return { title: 'Menghitung harta yang dibagi', lines };
}

// ─── Langkah: ahli waris ──────────────────────────────────────────────────────

function ahliWaris(ctx: Ctx): Section {
  const heirs = Object.entries(ctx.result.statuses).filter(([, st]) => st.kind === 'heir').map(([id]) => id);
  const lines = [line(s`Ahli waris (${term('warits', 'warits')}) ${ctx.people.deceased()}: ${mentionAll(ctx, heirs)}.`)];

  for (const step of ctx.steps('MANI')) {
    const who = ctx.people.mention([step.personId]);
    lines.push(line(step.mani === 'qatl'
      ? s`${who} tidak mendapat warisan karena membunuh ${ctx.people.deceased()}; pembunuh terhalang dari warisan (${term('mani', "mani'")}).`
      : s`${who} tidak mendapat warisan karena berbeda agama dengan ${ctx.people.deceased()} (${term('mani', "mani'")}).`, step.refs));
  }

  const grouped = new Map<string, { mahjub: PersonId[]; step: Step<'HAJB_HIRMAN'> }>();
  for (const step of ctx.steps('HAJB_HIRMAN')) {
    const key = `${ctx.people.roleOf(step.mahjub)?.key}|${step.hajib.join(',')}`;
    const entry = grouped.get(key) ?? { mahjub: [], step };
    entry.mahjub.push(step.mahjub);
    grouped.set(key, entry);
  }
  for (const { mahjub, step } of grouped.values()) {
    lines.push(line(s`${mentionAll(ctx, mahjub)} tidak mendapat bagian karena terhalang oleh ${mentionAll(ctx, step.hajib)} `
      .concat(s`(${term('hajb-hirman', 'hajb hirman')}).`), step.refs));
  }
  return { title: 'Siapa yang mendapat warisan', lines };
}

// ─── Langkah: bagian masing-masing ────────────────────────────────────────────

const JADD_OPTION: Record<JaddOption, (ctx: Ctx) => Segment[]> = {
  muqasamah: () => s`dihitung sebagai saudara (${term('muqasamah', 'muqasamah')})`,
  tsuluts: () => s`sepertiga harta`,
  tsulutsBaqi: () => s`sepertiga sisa`,
  sudus: () => s`seperenam harta`,
};

function bagian(ctx: Ctx): Section {
  const lines: ExplainLine[] = [];
  const fardhGroups = new Set(ctx.steps('FARDH').map(st => st.group));
  let nuqshanDijelaskan = false;
  const nuqshanNote = (): Segment[] => {
    if (nuqshanDijelaskan) return [];
    nuqshanDijelaskan = true;
    return s` Pengurangan seperti ini disebut ${term('hajb-nuqshan', 'hajb nuqshan')}.`;
  };

  for (const step of ctx.result.trace) {
    if (step.kind === 'FARDH') {
      const members = ctx.membersOf(step.group);
      const nuqshan = ctx.steps('HAJB_NUQSHAN').find(n => members.includes(n.affected));
      lines.push(line(fardhStory(ctx, step, nuqshan ? s`, bukan ${nuqshan.from},` : [], nuqshan ? nuqshanNote : () => []), step.refs));
    } else if (step.kind === 'SPECIAL_CASE') {
      lines.push(line(specialStory(step.name), step.refs));
    } else if (step.kind === 'ASHABAH' && !fardhGroups.has(step.group)) {
      if (step.jaddChoice) {
        const kakek = ctx.membersOf(step.group).filter(id => ctx.people.roleOf(id)?.key === 'JADD');
        lines.push(line(jaddChoiceStory(ctx, mentionAll(ctx, kakek), step.jaddChoice), step.refs));
      }
      lines.push(line(ashabahStory(ctx, step), step.refs));
    }
  }
  return { title: 'Bagian masing-masing', lines };
}

function fardhStory(ctx: Ctx, step: Step<'FARDH'>, bukan: Segment[], note: () => Segment[]): Segment[] {
  const subject = group(ctx, step.group);
  const f = step.fardh;
  const almarhum = ctx.people.deceased();
  const reason: FardhReason = step.reason;
  const faruWarits = term('faru-warits', "far'u warits");
  // Furudh bersama (istri-istri, nenek-nenek) dibagi rata [R04-3] [R04-8].
  const mendapat = ctx.membersOf(step.group).length > 1 ? s`berbagi ${f}${bukan} sama rata` : s`mendapat ${f}${bukan}`;
  switch (reason.code) {
    case 'ADA_FARU_WARITS':
      return [...s`${subject} ${mendapat} karena ${almarhum} meninggalkan keturunan yang ikut mewarisi (${faruWarits}): `,
        ...s`${mentionAll(ctx, reason.by)}.`, ...note()];
    case 'TANPA_FARU_WARITS':
      return s`${subject} ${mendapat} karena ${almarhum} tidak meninggalkan keturunan yang ikut mewarisi (${faruWarits}).`;
    case 'JAM_IKHWAH': {
      const adaYangTerhalang = reason.by.some(id => ctx.result.statuses[id]?.kind === 'mahjub');
      return [...s`${subject} mendapat ${f}${bukan} karena ${almarhum} punya dua saudara atau lebih `,
        ...s`(${term('jam-min-al-ikhwah', "jam' min al-ikhwah")}): ${mentionAll(ctx, reason.by)}.`,
        ...(adaYangTerhalang ? s` Mereka tetap dihitung walaupun tidak mendapat bagian.` : []), ...note()];
    }
    case 'TANPA_FARU_WARITS_DAN_IKHWAH':
      return s`${subject} mendapat ${f} karena ${almarhum} tidak meninggalkan keturunan yang ikut mewarisi dan tidak punya dua saudara atau lebih.`;
    case 'UMARIYYATAIN': {
      const pasangan = ctx.membersOf('ZAWJ').length > 0 ? group(ctx, 'ZAWJ') : group(ctx, 'ZAWJAH');
      return [...s`${subject} tidak mendapat 1/3 dari seluruh harta, melainkan 1/3 dari sisa setelah bagian ${pasangan} `,
        ...s`(${reason.spouseFardh}), yaitu ${f} dari seluruh harta. Dengan begitu bagian ayah tidak lebih kecil dari bagian ibu.`];
    }
    case 'NENEK_TANPA_IBU':
      return s`${subject} ${reason.count > 1 ? 'berbagi' : 'mendapat'} ${f}${reason.count > 1 ? ' sama rata' : ''} karena tidak ada ibu.`;
    case 'TANPA_MUASHSHIB':
      return reason.count === 1
        ? s`${subject} mendapat ${f} karena ia sendirian dan tidak ada laki-laki sederajat yang membuatnya ikut mengambil sisa (${term('muashshib', "mu'ashshib")}).`
        : s`${subject} berbagi ${f} sama rata karena jumlahnya lebih dari satu dan tidak ada laki-laki sederajat yang membuat mereka ikut mengambil sisa (${term('muashshib', "mu'ashshib")}).`;
    case 'TAKMILAH':
      return [...s`${subject} mendapat ${f}${bukan} sebagai pelengkap agar bagiannya bersama ${mentionAll(ctx, reason.with)} genap 2/3 `,
        ...s`(${term('takmilah-tsulutsain', 'takmilah ats-tsulutsain')}).`, ...note()];
    case 'KALALAH':
      return s`${subject} ${reason.count > 1 ? 'berbagi' : 'mendapat'} ${f}${reason.count > 1 ? ' sama rata' : ''} karena ${almarhum} tidak meninggalkan anak/cucu maupun ayah/kakek (${term('kalalah', 'kalalah')}).`;
    case 'ADA_FARU_MUDZAKKAR':
      return s`${subject} mendapat ${f} saja karena ada keturunan laki-laki: ${mentionAll(ctx, reason.by)}.`;
    case 'ADA_FARU_MUANNATS':
      return s`${subject} mendapat ${f}, ditambah sisa harta nanti (${term('ashabah', 'ashabah')}), karena keturunan ${almarhum} hanya perempuan: ${mentionAll(ctx, reason.by)}.`;
    case 'MUSYARRAKAH':
      return s`${subject} berbagi ${f} sama rata per orang: saudara kandung digabung dengan saudara seibu karena mereka sama-sama anak dari ibu yang sama.`;
    case 'AKDARIYYAH': {
      const members = ctx.membersOf(step.group);
      const isJadd = (id: PersonId) => ctx.people.roleOf(id)?.key === 'JADD';
      return reason.part === 'jadd'
        ? s`${mentionAll(ctx, members.filter(isJadd))} diberi 1/6.`
        : s`${mentionAll(ctx, members.filter(id => !isJadd(id)))} diberi 1/2. Bagian keduanya lalu digabung (1/6 + 1/2 = 2/3) dan dibagi ulang: kakek mendapat dua kali bagian saudari.`;
    }
    case 'JADD_SISA_SEDIKIT':
      return s`Setelah bagian yang lain, sisa harta tinggal ${reason.sisa}, tidak lebih dari 1/6. Karena itu ${subject} mendapat 1/6 dan para saudara tidak mendapat bagian.`;
    case 'JADD_WAL_IKHWAH':
      return jaddChoiceStory(ctx, subject, reason);
  }
}

function jaddChoiceStory(ctx: Ctx, kakek: Segment[], choice: Extract<FardhReason, { code: 'JADD_WAL_IKHWAH' }>): Segment[] {
  const options = orList(choice.options.map(o => s`${JADD_OPTION[o.name](ctx)} = ${o.value}`));
  const chosen = choice.options.find(o => o.name === choice.chosen)!;
  return s`Bersama saudara, ${kakek} mendapat pilihan yang paling menguntungkan baginya: ${options}. Yang terbesar ${JADD_OPTION[choice.chosen](ctx)}, yaitu ${chosen.value}.`;
}

function specialStory(name: Step<'SPECIAL_CASE'>['name']): Segment[] {
  switch (name) {
    case 'umariyyatain': return s`Ini termasuk kasus khusus ${term('umariyyatain', "al-'Umariyyatain")}.`;
    case 'musyarrakah': return s`Ini termasuk kasus khusus ${term('musyarrakah', 'al-Musyarrakah')}.`;
    case 'akdariyyah': return s`Ini termasuk kasus khusus ${term('akdariyyah', 'al-Akdariyyah')}.`;
    case 'muaddah':
      return s`Ini termasuk kasus khusus ${term('muaddah', "al-Mu'addah")}: saudara sebapak ikut dihitung saat menentukan bagian kakek, lalu bagiannya diserahkan kepada saudara kandung.`;
  }
}

function ashabahStory(ctx: Ctx, step: Step<'ASHABAH'>): Segment[] {
  const subject = group(ctx, step.group);
  switch (step.type) {
    case 'binNafsi':
      return s`${subject} mengambil seluruh sisa harta setelah bagian-bagian di atas (${term('ashabah', 'ashabah')}).`;
    case 'bilGhair':
      return s`${subject} mengambil sisa harta bersama-sama (${term('bil-ghair', 'ashabah bil ghair')}): laki-laki mendapat dua kali bagian perempuan.`;
    case 'maalGhair':
      return s`${subject} mengambil sisa harta (${term('maal-ghair', "ashabah ma'al ghair")}) karena ${ctx.people.deceased()} meninggalkan anak/cucu perempuan.`;
  }
}

// ─── Langkah: menyamakan penyebut ─────────────────────────────────────────────

/** Identifikasi dua bilangan dengan nisab arba' (bab 10.2) dalam kalimat sehari-hari. */
export function arbaStory(step: Step<'NISAB_COMPARE'>, prefix: Segment[]): Segment[] {
  const { a, b, gcd, result } = step;
  const [small, big] = a < b ? [a, b] : [b, a];
  const example = `Di kasus ini: ${a} dan ${b} → ${result}.`;
  switch (step.relation) {
    case 'tamatsul':
      return s`${prefix}: keduanya sama (${term('tamatsul', 'tamatsul', example)}), jadi cukup pakai ${result}.`;
    case 'tadakhul':
      return s`${prefix}: ${big} sudah habis dibagi ${small} (${term('tadakhul', 'tadakhul', example)}), jadi cukup pakai ${big}.`;
    case 'tawafuq':
      return s`${prefix}: tidak ada yang habis membagi yang lain, tetapi keduanya sama-sama bisa dibagi ${gcd} (${term('tawafuq', 'tawafuq', example)}). Caranya: ${a} × (${b} ÷ ${gcd}) = ${result}.`;
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return small === 1n
        ? s`${prefix}: angka 1 selalu dianggap tidak punya faktor bersama (${term('tabayun', 'tabayun', example)}), jadi dikalikan: ${a} × ${b} = ${result}.`
        : s`${prefix}: keduanya tidak punya faktor bersama selain 1 (${term('tabayun', 'tabayun', example)}), jadi dikalikan langsung: ${a} × ${b} = ${result}.`;
    default:
      throw new Error(`relasi ${step.relation} tidak berlaku untuk nisab arba'`);
  }
}

function penyebut(ctx: Ctx): Section {
  const { rows, totals } = ctx.result.table;
  const ashl = totals.ashl!;
  const lines: ExplainLine[] = [];
  const ashlTerm = term('ashlul-masalah', "ashlul mas'alah", `Di kasus ini: ${ashl}.`);

  if (rows.every(r => r.fardh === undefined)) {
    lines.push(line(s`Semua ahli waris mengambil sisa (${term('ashabah', 'ashabah')}), jadi harta langsung dibagi per kepala (${term('ruus', "ru'us")}): `
      .concat(s`laki-laki dihitung 2, perempuan 1. Totalnya ${ashl} bagian (${ashlTerm}).`), ['R09-2']));
    return { title: 'Menyamakan penyebut', lines };
  }

  const pecahan = rows.filter(r => r.fardh).map(r => s`${group(ctx, r.group)} ${r.fardh!}`);
  const compares = ctx.steps('NISAB_COMPARE').filter(st => st.purpose === 'ashl');
  if (compares.length === 0) {
    lines.push(line(s`Bagian yang sudah pasti: ${joinAnd(pecahan)}. ${pecahan.length > 1 ? 'Semua penyebutnya sama, yaitu' : 'Penyebutnya'} ${ashl}, `
      .concat(s`jadi angka itu langsung dipakai sebagai penyebut bersama (${ashlTerm}).`), ['R09-1']));
  } else {
    lines.push(line(s`Bagian-bagian di atas masih berupa pecahan: ${joinAnd(pecahan)}. Supaya bisa dijumlah, kita cari satu angka yang bisa dibagi `
      .concat(s`oleh semua penyebutnya. Angka ini disebut ${ashlTerm}.`), ['R09-1']));
    compares.forEach((step, i) => {
      const prefix = i === 0 ? s`Mulai dari ${step.a} dan ${step.b}` : s`Lalu ${step.a} dengan ${step.b}`;
      lines.push(line(arbaStory(step, prefix), step.refs));
    });
  }

  const bagianBagian = rows.map(row => {
    const n = row.cells['ashl']!;
    if (!row.fardh) return s`sisanya ${n} untuk ${group(ctx, row.group)}`;
    const fardhPart = row.fardh.n * ashl / row.fardh.d;
    return row.ashabah ? s`${group(ctx, row.group)} ${fardhPart} + sisa ${n - fardhPart}` : s`${group(ctx, row.group)} ${n}`;
  });
  lines.push(line(s`Jadi harta kita bayangkan dipotong menjadi ${ashl} bagian yang sama (${term('saham', 'saham')}): ${joinAnd(bagianBagian)}.`));
  return { title: 'Menyamakan penyebut', lines };
}

// ─── Langkah: 'adilah / 'aul / radd ───────────────────────────────────────────

function penyesuaian(ctx: Ctx): Section {
  const [cls] = ctx.steps('MASALAH_CLASS');
  if (!cls) throw new Error('trace tanpa MASALAH_CLASS');
  const rows = ctx.result.table.rows;
  const rincian = rows.length > 1 ? `${rows.map(r => r.cells['ashl']).join(' + ')} = ` : '';
  const { sumSaham, ashl } = cls;

  switch (cls.cls) {
    case 'adilah':
      return { title: 'Memeriksa jumlah bagian', lines: [line(
        s`Jumlah semua bagian ${rincian}${sumSaham}, pas sama dengan ${ashl} (${term('adilah', "'adilah")}). Tidak perlu penyesuaian.`, cls.refs)] };
    case 'ailah': {
      const aul = term('aul', "'aul", `Di kasus ini: ${ashl} menjadi ${sumSaham}.`);
      return { title: 'Bagiannya melebihi harta', lines: [line(
        s`Jumlah semua bagian ${rincian}${sumSaham}, lebih besar dari ${ashl}. Supaya adil, penyebutnya dinaikkan menjadi ${sumSaham} (${aul}): `
          .concat(s`setiap orang tetap mendapat jumlah bagian yang sama, tetapi karena harta sekarang dibagi ${sumSaham}, semua bagian berkurang secara sebanding.`),
        ctx.steps('AUL')[0]?.refs ?? cls.refs)] };
    }
    case 'raddA': case 'raddB':
      return { title: 'Masih ada sisa, untuk siapa?', lines: raddStory(ctx, cls, rincian) };
  }
}

function raddStory(ctx: Ctx, cls: Step<'MASALAH_CLASS'>, rincian: string): ExplainLine[] {
  const [radd] = ctx.steps('RADD');
  if (!radd) throw new Error('trace radd tanpa langkah RADD');
  const penerimaGroups = Object.keys(radd.raddiyyah.saham);
  const penerima = mentionAll(ctx, penerimaGroups.flatMap(g => ctx.membersOf(g)));
  const z = radd.zawjiyyah;
  const lines = [line([
    ...s`Jumlah semua bagian ${rincian}${cls.sumSaham}, padahal ada ${cls.ashl}. Masih tersisa ${cls.ashl - cls.sumSaham} bagian, dan tidak ada `,
    ...s`ahli waris yang berhak atas sisa (${term('ashabah', 'ashabah')}). Sisa itu dikembalikan kepada ${penerima} sesuai besar bagian mereka (${term('radd', 'radd')}).`,
    ...(z ? s` ${group(ctx, z.group)} tidak ikut, karena suami/istri tidak menerima radd.` : []),
  ], cls.refs)];

  const perbandingan = Object.values(radd.raddiyyah.saham).join(' : ');
  if (!z) {
    const rincianRadd = penerimaGroups.map(g => s`${group(ctx, g)} ${radd.raddiyyah.saham[g]!}`);
    lines.push(line(s`Karena tidak ada suami/istri, harta cukup dibagi menurut perbandingan bagian mereka: ${joinAnd(rincianRadd)}, `
      .concat(s`jumlahnya ${radd.raddiyyah.ashl} bagian.`), radd.refs));
    return lines;
  }

  const spouseRow = ctx.result.table.rows.find(r => r.group === z.group)!;
  lines.push(line(s`Pertama, bagian ${group(ctx, z.group)} diselesaikan dulu: ${spouseRow.fardh!} berarti dari ${z.ashl} bagian ia mendapat ${z.spouseSaham}, `
    .concat(s`dan sisanya ${z.sisa} bagian.`), radd.refs));
  lines.push(line(penerimaGroups.length > 1
    ? s`Kedua, ${penerima} berbagi sisa itu dengan perbandingan ${perbandingan}, totalnya ${radd.raddiyyah.ashl} bagian.`
    : s`Kedua, sisa ${z.sisa} bagian itu seluruhnya untuk ${penerima}.`, radd.refs));

  const [cmp] = ctx.steps('NISAB_COMPARE').filter(st => st.purpose === 'raddVsSisa');
  if (cmp && penerimaGroups.length > 1) {
    const { a: sisa, b: ashlRadd, gcd, result } = cmp;
    lines.push(line(cmp.relation === 'habis'
      ? s`Ketiga, ${sisa} bagian bisa dibagi rata dengan perbandingan tadi (total ${ashlRadd}), jadi penyebutnya tetap ${result}.`
      : cmp.relation === 'tawafuq'
        ? s`Ketiga, ${sisa} bagian tidak bisa dibagi rata menjadi ${ashlRadd}, tetapi keduanya sama-sama bisa dibagi ${gcd} (${term('tawafuq', 'tawafuq')}). `
          .concat(s`Maka semuanya dikalikan ${ashlRadd / gcd}: harta dibagi menjadi ${result} bagian.`)
        : s`Ketiga, ${sisa} bagian tidak bisa dibagi rata menjadi ${ashlRadd}, dan keduanya tidak punya faktor bersama (${term('tabayun', 'tabayun')}). `
          .concat(s`Maka semuanya dikalikan ${ashlRadd}: harta dibagi menjadi ${result} bagian.`), cmp.refs));
  }

  const hasilRadd = ctx.result.table.rows.map(row => row.group === z.group
    ? s`${group(ctx, row.group)} ${row.cells['radd']!} bagian (tetap ${row.fardh!})`
    : s`${group(ctx, row.group)} ${row.cells['radd']!} bagian`);
  lines.push(line(s`Hasilnya: ${joinAnd(hasilRadd)}.`, radd.refs));
  return lines;
}

// ─── Langkah: tashih ──────────────────────────────────────────────────────────

function pembulatan(ctx: Ctx): Section | undefined {
  const inkisar = ctx.steps('NISAB_COMPARE').filter(st => st.purpose === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const lines: ExplainLine[] = [];
  if (inkisar.some(st => st.relation !== 'habis')) {
    lines.push(line(s`Bagian sebuah kelompok kadang tidak bisa dibagi rata ke anggotanya (${term('inkisar', 'inkisar')}). Kalau begitu, jumlah bagian `
      .concat(s`diperbesar supaya setiap orang mendapat bilangan bulat (${term('tashih', 'tashih')}).`), ['R10-2']));
  }
  for (const step of inkisar) {
    const members = ctx.membersOf(step.group!);
    const { a: saham, b: ruus, gcd, result } = step;
    const untuk = ruus > BigInt(members.length)
      ? s`${ruus} kepala (${term('ruus', "ru'us")}, laki-laki dihitung 2)`
      : s`${ruus} orang`;
    const who = group(ctx, step.group!);
    lines.push(line(step.relation === 'habis'
      ? s`${who} mendapat ${saham} bagian untuk ${untuk}, pas dibagi rata.`
      : step.relation === 'tawafuq'
        ? s`${who} mendapat ${saham} bagian untuk ${untuk}. ${saham} tidak bisa dibagi ${ruus}, tetapi keduanya sama-sama bisa dibagi ${gcd} `
          .concat(s`(${term('tawafuq', 'tawafuq')}), jadi yang disimpan ${ruus} ÷ ${gcd} = ${result}.`)
        : s`${who} mendapat ${saham} bagian untuk ${untuk}. ${saham} tidak bisa dibagi ${ruus} dan keduanya tidak punya faktor bersama `
          .concat(s`(${term('tabayun', 'tabayun')}), jadi angka ${ruus} disimpan.`), step.refs));
  }
  for (const step of ctx.steps('NISAB_COMPARE').filter(st => st.purpose === 'juzSahm')) {
    lines.push(line(arbaStory(step, s`Angka yang disimpan, ${step.a} dan ${step.b}, digabung`), step.refs));
  }
  const [tashih] = ctx.steps('TASHIH');
  lines.push(tashih
    ? line(s`Semua bagian dikalikan ${tashih.juzSahm} (${term('juz-as-sahm', "juz' as-sahm")}): ${tashih.base} × ${tashih.juzSahm} = ${tashih.result} bagian.`, tashih.refs)
    : line(s`Semua kelompok bisa dibagi rata, jadi tidak perlu pembulatan.`, ['R10-2']));
  return { title: 'Membulatkan bagian per orang', lines };
}

// ─── Langkah: hasil ───────────────────────────────────────────────────────────

function hasil(ctx: Ctx): Section {
  const { table, rounding } = ctx.result;
  const den = ctx.finalDenominator;
  const lines = [line(s`Harta dibagi menjadi ${den} bagian:`)];
  for (const row of table.rows) {
    for (const [id, { saham, nominal }] of Object.entries(row.perPerson)) {
      const who = ctx.people.mention([id]);
      lines.push(line(saham === 0n
        ? s`${who}: tidak mendapat bagian karena sisa harta sudah habis.`
        : s`${who}: ${saham} bagian (${saham}/${den})${ctx.showNominal ? ` = ${rupiah(nominal)}` : ''}.`, ['R11-1']));
    }
  }
  if (ctx.showNominal && rounding.remainder > 0n) {
    const perUnit = rounding.unit > 1n;
    lines.push(line([
      ...s`Karena setiap bagian dibulatkan ke bawah${perUnit ? ` per ${rupiah(rounding.unit)}` : ' ke rupiah'}, ada selisih ${rupiah(rounding.remainder)} yang belum dibagikan. `,
      ...s`Uang ini tetap milik para ahli waris dan perlu disepakati bersama penyalurannya.`,
      ...(perUnit ? s` Jika dibagikan lewat transfer bank, pembulatan bisa per rupiah sehingga selisihnya lebih kecil.` : []),
    ]));
  }
  return { title: 'Hasil akhir', lines };
}

