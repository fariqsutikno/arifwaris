import type { AlasanFardh, PilihanJadd, IdOrang } from '@waris/engine';
import { kelompok, mentionAll, type Ctx, type Step } from './context.js';
import { rupiah } from './format.js';
import { joinAnd, line, s, type ExplainLine, type Segment } from './segments.js';
import { term } from './terms.js';

export interface Section { title: string; lines: ExplainLine[] }

/** Mode cerita (default): tiap langkah = masalahnya apa → caranya → istilahnya → hasilnya. */
export function ceritaSections(ctx: Ctx): Section[] {
  return [babHarta, babAhliWaris, babBagian, babPenyebut, babPenyesuaian, babPembulatan, babHasil]
    .map(build => build(ctx))
    .filter((section): section is Section => section !== undefined);
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

const orList = (items: Segment[][]) => items.flatMap((item, i) =>
  i === 0 ? item : [{ jenis: 'text' as const, text: i === items.length - 1 ? ', atau ' : ', ' }, ...item]);

// ─── Langkah: harta ───────────────────────────────────────────────────────────

function babHarta(ctx: Ctx): Section | undefined {
  const [t] = ctx.langkahLangkah('TIRKAH');
  if (!t || t.kotor === 0n) return undefined;
  const lines: ExplainLine[] = [];
  const setelahHutang = t.bersih + t.wasiatDipakai;
  if (t.tajhiz > 0n || t.hutang > 0n) {
    lines.push(line([
      ...s`Sebelum dibagi, harta peninggalan (${term('tirkah', 'tirkah')}) ${rupiah(t.kotor)} dipakai dulu untuk biaya pengurusan jenazah `,
      ...s`${rupiah(t.tajhiz)} dan melunasi hutang ${rupiah(t.hutang)}, sehingga tersisa ${rupiah(setelahHutang)}.`,
      ...(setelahHutang === 0n ? s` Hutang menghabiskan seluruh harta, sehingga tidak ada yang dibagi sebagai warisan.` : []),
    ], t.refs));
  }
  if (t.wasiatButuhIjazah > 0n) {
    lines.push(line(s`Wasiat ${ctx.people.pewaris()} sebesar ${rupiah(t.wasiatDiminta)} melebihi batas sepertiga harta (${rupiah(t.wasiatBatas)}), `
      .concat(s`jadi yang dijalankan hanya ${rupiah(t.wasiatDipakai)}. Kelebihan ${rupiah(t.wasiatButuhIjazah)} baru boleh dijalankan `,
        s`jika semua ahli waris menyetujuinya (ijazah).`), ['R01-4']));
  } else if (t.wasiatDiminta > 0n) {
    lines.push(line(s`Wasiat ${ctx.people.pewaris()} sebesar ${rupiah(t.wasiatDipakai)} dijalankan karena tidak melebihi sepertiga harta (${rupiah(t.wasiatBatas)}).`, ['R01-4']));
  }
  lines.push(line(s`Harta yang dibagi kepada ahli waris: ${rupiah(t.bersih)}.`, ['R11-1']));
  return { title: 'Menghitung harta yang dibagi', lines };
}

// ─── Langkah: ahli waris ──────────────────────────────────────────────────────

function babAhliWaris(ctx: Ctx): Section {
  const daftarAhliWaris = Object.entries(ctx.hasil.statusOrang).filter(([, st]) => st.jenis === 'ahliWaris').map(([id]) => id);
  const lines = [line(s`Ahli waris (${term('warits', 'warits')}) ${ctx.people.pewaris()}: ${mentionAll(ctx, daftarAhliWaris)}.`)];

  for (const step of ctx.langkahLangkah('MANI')) {
    const who = ctx.people.mention([step.idOrang]);
    lines.push(line(step.mani === 'qatl'
      ? s`${who} tidak mendapat warisan karena membunuh ${ctx.people.pewaris()}; pembunuh terhalang dari warisan (${term('mani', "mani'")}).`
      : s`${who} tidak mendapat warisan karena berbeda agama dengan ${ctx.people.pewaris()} (${term('mani', "mani'")}).`, step.refs));
  }

  const grouped = new Map<string, { mahjub: IdOrang[]; step: Step<'HAJB_HIRMAN'> }>();
  for (const step of ctx.langkahLangkah('HAJB_HIRMAN')) {
    const kunci = `${ctx.people.roleOf(step.mahjub)?.kunci}|${step.hajib.join(',')}`;
    const entry = grouped.get(kunci) ?? { mahjub: [], step };
    entry.mahjub.push(step.mahjub);
    grouped.set(kunci, entry);
  }
  for (const { mahjub, step } of grouped.values()) {
    lines.push(line(s`${mentionAll(ctx, mahjub)} tidak mendapat bagian karena terhalang oleh ${mentionAll(ctx, step.hajib)} `
      .concat(s`(${term('hajb-hirman', 'hajb hirman')}).`), step.refs));
  }
  return { title: 'Siapa yang mendapat warisan', lines };
}

// ─── Langkah: bagian masing-masing ────────────────────────────────────────────

const JADD_OPTION: Record<PilihanJadd, (ctx: Ctx) => Segment[]> = {
  muqasamah: () => s`dihitung sebagai saudara (${term('muqasamah', 'muqasamah')})`,
  tsuluts: () => s`sepertiga harta`,
  tsulutsBaqi: () => s`sepertiga sisa`,
  sudus: () => s`seperenam harta`,
};

function babBagian(ctx: Ctx): Section {
  const lines: ExplainLine[] = [];
  const fardhGroups = new Set(ctx.langkahLangkah('FARDH').map(st => st.kelompok));
  let nuqshanDijelaskan = false;
  const nuqshanNote = (): Segment[] => {
    if (nuqshanDijelaskan) return [];
    nuqshanDijelaskan = true;
    return s` Pengurangan seperti ini disebut ${term('hajb-nuqshan', 'hajb nuqshan')}.`;
  };

  for (const step of ctx.hasil.jejak) {
    if (step.jenis === 'FARDH') {
      const anggota = ctx.membersOf(step.kelompok);
      const nuqshan = ctx.langkahLangkah('HAJB_NUQSHAN').find(n => anggota.includes(n.terdampak));
      lines.push(line(fardhStory(ctx, step, nuqshan ? s`, bukan ${nuqshan.from},` : [], nuqshan ? nuqshanNote : () => []), step.refs));
    } else if (step.jenis === 'KASUS_KHUSUS') {
      lines.push(line(specialStory(step.nama), step.refs));
    } else if (step.jenis === 'ASHABAH' && !fardhGroups.has(step.kelompok)) {
      if (step.pilihanJadd) {
        const kakek = ctx.membersOf(step.kelompok).filter(id => ctx.people.roleOf(id)?.kunci === 'KAKEK');
        lines.push(line(jaddChoiceStory(ctx, mentionAll(ctx, kakek), step.pilihanJadd), step.refs));
      }
      lines.push(line(ashabahStory(ctx, step), step.refs));
    }
  }
  return { title: 'Bagian masing-masing', lines };
}

function fardhStory(ctx: Ctx, step: Step<'FARDH'>, bukan: Segment[], note: () => Segment[]): Segment[] {
  const subject = kelompok(ctx, step.kelompok);
  const f = step.fardh;
  const almarhum = ctx.people.pewaris();
  const alasan: AlasanFardh = step.alasan;
  const faruWarits = term('faru-warits', "far'u warits");
  // Furudh bersama (istri-istri, nenek-nenek) dibagi rata [R04-3] [R04-8].
  const mendapat = ctx.membersOf(step.kelompok).length > 1 ? s`berbagi ${f}${bukan} sama rata` : s`mendapat ${f}${bukan}`;
  switch (alasan.code) {
    case 'ADA_FARU_WARITS':
      return [...s`${subject} ${mendapat} karena ${almarhum} meninggalkan keturunan yang ikut mewarisi (${faruWarits}): `,
        ...s`${mentionAll(ctx, alasan.oleh)}.`, ...note()];
    case 'TANPA_FARU_WARITS':
      return s`${subject} ${mendapat} karena ${almarhum} tidak meninggalkan keturunan yang ikut mewarisi (${faruWarits}).`;
    case 'JAM_IKHWAH': {
      const adaYangTerhalang = alasan.oleh.some(id => ctx.hasil.statusOrang[id]?.jenis === 'mahjub');
      return [...s`${subject} mendapat ${f}${bukan} karena ${almarhum} punya dua saudara atau lebih `,
        ...s`(${term('jam-min-al-ikhwah', "jam' min al-ikhwah")}): ${mentionAll(ctx, alasan.oleh)}.`,
        ...(adaYangTerhalang ? s` Mereka tetap dihitung walaupun tidak mendapat bagian.` : []), ...note()];
    }
    case 'TANPA_FARU_WARITS_DAN_IKHWAH':
      return s`${subject} mendapat ${f} karena ${almarhum} tidak meninggalkan keturunan yang ikut mewarisi dan tidak punya dua saudara atau lebih.`;
    case 'UMARIYYATAIN': {
      const pasangan = ctx.membersOf('SUAMI').length > 0 ? kelompok(ctx, 'SUAMI') : kelompok(ctx, 'ISTRI');
      return [...s`${subject} tidak mendapat 1/3 dari seluruh harta, melainkan 1/3 dari sisa setelah bagian ${pasangan} `,
        ...s`(${alasan.fardhPasangan}), yaitu ${f} dari seluruh harta. Dengan begitu bagian ayah tidak lebih kecil dari bagian ibu.`];
    }
    case 'NENEK_TANPA_IBU':
      return s`${subject} ${alasan.banyaknya > 1 ? 'berbagi' : 'mendapat'} ${f}${alasan.banyaknya > 1 ? ' sama rata' : ''} karena tidak ada ibu.`;
    case 'TANPA_MUASHSHIB':
      return alasan.banyaknya === 1
        ? s`${subject} mendapat ${f} karena ia sendirian dan tidak ada laki-laki sederajat yang membuatnya ikut mengambil sisa (${term('muashshib', "mu'ashshib")}).`
        : s`${subject} berbagi ${f} sama rata karena jumlahnya lebih dari satu dan tidak ada laki-laki sederajat yang membuat mereka ikut mengambil sisa (${term('muashshib', "mu'ashshib")}).`;
    case 'TAKMILAH':
      return [...s`${subject} mendapat ${f}${bukan} sebagai pelengkap agar bagiannya bersama ${mentionAll(ctx, alasan.with)} genap 2/3 `,
        ...s`(${term('takmilah-tsulutsain', 'takmilah ats-tsulutsain')}).`, ...note()];
    case 'KALALAH':
      return s`${subject} ${alasan.banyaknya > 1 ? 'berbagi' : 'mendapat'} ${f}${alasan.banyaknya > 1 ? ' sama rata' : ''} karena ${almarhum} tidak meninggalkan anak/cucu maupun ayah/kakek (${term('kalalah', 'kalalah')}).`;
    case 'ADA_FARU_MUDZAKKAR':
      return s`${subject} mendapat ${f} saja karena ada keturunan laki-laki: ${mentionAll(ctx, alasan.oleh)}.`;
    case 'ADA_FARU_MUANNATS':
      return s`${subject} mendapat ${f}, ditambah sisa harta nanti (${term('ashabah', 'ashabah')}), karena keturunan ${almarhum} hanya perempuan: ${mentionAll(ctx, alasan.oleh)}.`;
    case 'MUSYARRAKAH':
      return s`${subject} berbagi ${f} sama rata per orang: saudara kandung digabung dengan saudara seibu karena mereka sama-sama anak dari ibu yang sama.`;
    case 'AKDARIYYAH': {
      const anggota = ctx.membersOf(step.kelompok);
      const isJadd = (id: IdOrang) => ctx.people.roleOf(id)?.kunci === 'KAKEK';
      return alasan.porsi === 'jadd'
        ? s`${mentionAll(ctx, anggota.filter(isJadd))} diberi 1/6.`
        : s`${mentionAll(ctx, anggota.filter(id => !isJadd(id)))} diberi 1/2. Bagian keduanya lalu digabung (1/6 + 1/2 = 2/3) dan dibagi ulang: kakek mendapat dua kali bagian saudari.`;
    }
    case 'JADD_SISA_SEDIKIT':
      return s`Setelah bagian yang lain, sisa harta tinggal ${alasan.sisa}, tidak lebih dari 1/6. Karena itu ${subject} mendapat 1/6 dan para saudara tidak mendapat bagian.`;
    case 'JADD_WAL_IKHWAH':
      return jaddChoiceStory(ctx, subject, alasan);
  }
}

function jaddChoiceStory(ctx: Ctx, kakek: Segment[], choice: Extract<AlasanFardh, { code: 'JADD_WAL_IKHWAH' }>): Segment[] {
  const opsi = orList(choice.opsi.map(o => s`${JADD_OPTION[o.nama](ctx)} = ${o.nilai}`));
  const terpilih = choice.opsi.find(o => o.nama === choice.terpilih)!;
  return s`Bersama saudara, ${kakek} mendapat pilihan yang paling menguntungkan baginya: ${opsi}. Yang terbesar ${JADD_OPTION[choice.terpilih](ctx)}, yaitu ${terpilih.nilai}.`;
}

function specialStory(nama: Step<'KASUS_KHUSUS'>['nama']): Segment[] {
  switch (nama) {
    case 'umariyyatain': return s`Ini termasuk kasus khusus ${term('umariyyatain', "al-'Umariyyatain")}.`;
    case 'musyarrakah': return s`Ini termasuk kasus khusus ${term('musyarrakah', 'al-Musyarrakah')}.`;
    case 'akdariyyah': return s`Ini termasuk kasus khusus ${term('akdariyyah', 'al-Akdariyyah')}.`;
    case 'muaddah':
      return s`Ini termasuk kasus khusus ${term('muaddah', "al-Mu'addah")}: saudara sebapak ikut dihitung saat menentukan bagian kakek, lalu bagiannya diserahkan kepada saudara kandung.`;
  }
}

function ashabahStory(ctx: Ctx, step: Step<'ASHABAH'>): Segment[] {
  const subject = kelompok(ctx, step.kelompok);
  switch (step.type) {
    case 'binNafsi':
      return s`${subject} mengambil seluruh sisa harta setelah bagian-bagian di atas (${term('ashabah', 'ashabah')}).`;
    case 'bilGhair':
      return s`${subject} mengambil sisa harta bersama-sama (${term('bil-ghair', 'ashabah bil ghair')}): laki-laki mendapat dua kali bagian perempuan.`;
    case 'maalGhair':
      return s`${subject} mengambil sisa harta (${term('maal-ghair', "ashabah ma'al ghair")}) karena ${ctx.people.pewaris()} meninggalkan anak/cucu perempuan.`;
  }
}

// ─── Langkah: menyamakan penyebut ─────────────────────────────────────────────

/** Identifikasi dua bilangan dengan nisab arba' (bab 10.2) dalam kalimat sehari-hari. */
export function arbaStory(step: Step<'PERBANDINGAN_NISAB'>, prefix: Segment[]): Segment[] {
  const { a, b, fpb, hasil } = step;
  const [small, big] = a < b ? [a, b] : [b, a];
  const example = `Di kasus ini: ${a} dan ${b} → ${hasil}.`;
  switch (step.hubungan) {
    case 'tamatsul':
      return s`${prefix}: keduanya sama (${term('tamatsul', 'tamatsul', example)}), jadi cukup pakai ${hasil}.`;
    case 'tadakhul':
      return s`${prefix}: ${big} sudah habis dibagi ${small} (${term('tadakhul', 'tadakhul', example)}), jadi cukup pakai ${big}.`;
    case 'tawafuq':
      return s`${prefix}: tidak ada yang habis membagi yang lain, tetapi keduanya sama-sama bisa dibagi ${fpb} (${term('tawafuq', 'tawafuq', example)}). Caranya: ${a} × (${b} ÷ ${fpb}) = ${hasil}.`;
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return small === 1n
        ? s`${prefix}: angka 1 selalu dianggap tidak punya faktor bersama (${term('tabayun', 'tabayun', example)}), jadi dikalikan: ${a} × ${b} = ${hasil}.`
        : s`${prefix}: keduanya tidak punya faktor bersama selain 1 (${term('tabayun', 'tabayun', example)}), jadi dikalikan langsung: ${a} × ${b} = ${hasil}.`;
    default:
      throw new Error(`relasi ${step.hubungan} tidak berlaku untuk nisab arba'`);
  }
}

function babPenyebut(ctx: Ctx): Section {
  const { baris, totalKolom } = ctx.hasil.tabel;
  const ashl = totalKolom.ashl!;
  const lines: ExplainLine[] = [];
  const ashlTerm = term('ashlul-masalah', "ashlul mas'alah", `Di kasus ini: ${ashl}.`);

  if (baris.every(r => r.fardh === undefined)) {
    lines.push(line(s`Semua ahli waris mengambil sisa (${term('ashabah', 'ashabah')}), jadi harta langsung dibagi per kepala (${term('ruus', "ru'us")}): `
      .concat(s`laki-laki dihitung 2, perempuan 1. Totalnya ${ashl} bagian (${ashlTerm}).`), ['R09-2']));
    return { title: 'Menyamakan penyebut', lines };
  }

  const pecahan = baris.filter(r => r.fardh).map(r => s`${kelompok(ctx, r.kelompok)} ${r.fardh!}`);
  const compares = ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(st => st.tujuan === 'ashl');
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

  const bagianBagian = baris.map(barisTabel => {
    const n = barisTabel.sel['ashl']!;
    if (!barisTabel.fardh) return s`sisanya ${n} untuk ${kelompok(ctx, barisTabel.kelompok)}`;
    const fardhPart = barisTabel.fardh.n * ashl / barisTabel.fardh.d;
    return barisTabel.ashabah ? s`${kelompok(ctx, barisTabel.kelompok)} ${fardhPart} + sisa ${n - fardhPart}` : s`${kelompok(ctx, barisTabel.kelompok)} ${n}`;
  });
  lines.push(line(s`Jadi harta kita bayangkan dipotong menjadi ${ashl} bagian yang sama (${term('saham', 'saham')}): ${joinAnd(bagianBagian)}.`));
  return { title: 'Menyamakan penyebut', lines };
}

// ─── Langkah: 'adilah / 'aul / radd ───────────────────────────────────────────

function babPenyesuaian(ctx: Ctx): Section {
  const [kelas] = ctx.langkahLangkah('KELAS_MASALAH');
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const baris = ctx.hasil.tabel.baris;
  const rincian = baris.length > 1 ? `${baris.map(r => r.sel['ashl']).join(' + ')} = ` : '';
  const { jumlahSaham, ashl } = kelas;

  switch (kelas.kelas) {
    case 'adilah':
      return { title: 'Memeriksa jumlah bagian', lines: [line(
        s`Jumlah semua bagian ${rincian}${jumlahSaham}, pas sama dengan ${ashl} (${term('adilah', "'adilah")}). Tidak perlu penyesuaian.`, kelas.refs)] };
    case 'ailah': {
      const aul = term('aul', "'aul", `Di kasus ini: ${ashl} menjadi ${jumlahSaham}.`);
      return { title: 'Bagiannya melebihi harta', lines: [line(
        s`Jumlah semua bagian ${rincian}${jumlahSaham}, lebih besar dari ${ashl}. Supaya adil, penyebutnya dinaikkan menjadi ${jumlahSaham} (${aul}): `
          .concat(s`setiap orang tetap mendapat jumlah bagian yang sama, tetapi karena harta sekarang dibagi ${jumlahSaham}, semua bagian berkurang secara sebanding.`),
        ctx.langkahLangkah('AUL')[0]?.refs ?? kelas.refs)] };
    }
    case 'raddA': case 'raddB':
      return { title: 'Masih ada sisa, untuk siapa?', lines: raddStory(ctx, kelas, rincian) };
  }
}

function raddStory(ctx: Ctx, kelas: Step<'KELAS_MASALAH'>, rincian: string): ExplainLine[] {
  const [radd] = ctx.langkahLangkah('RADD');
  if (!radd) throw new Error('jejak radd tanpa langkah RADD');
  const penerimaGroups = Object.keys(radd.raddiyyah.saham);
  const penerima = mentionAll(ctx, penerimaGroups.flatMap(g => ctx.membersOf(g)));
  const z = radd.zawjiyyah;
  const lines = [line([
    ...s`Jumlah semua bagian ${rincian}${kelas.jumlahSaham}, padahal ada ${kelas.ashl}. Masih tersisa ${kelas.ashl - kelas.jumlahSaham} bagian, dan tidak ada `,
    ...s`ahli waris yang berhak atas sisa (${term('ashabah', 'ashabah')}). Sisa itu dikembalikan kepada ${penerima} sesuai besar bagian mereka (${term('radd', 'radd')}).`,
    ...(z ? s` ${kelompok(ctx, z.kelompok)} tidak ikut, karena suami/istri tidak menerima radd.` : []),
  ], kelas.refs)];

  const perbandingan = Object.values(radd.raddiyyah.saham).join(' : ');
  if (!z) {
    const rincianRadd = penerimaGroups.map(g => s`${kelompok(ctx, g)} ${radd.raddiyyah.saham[g]!}`);
    lines.push(line(s`Karena tidak ada suami/istri, harta cukup dibagi menurut perbandingan bagian mereka: ${joinAnd(rincianRadd)}, `
      .concat(s`jumlahnya ${radd.raddiyyah.ashl} bagian.`), radd.refs));
    return lines;
  }

  const spouseRow = ctx.hasil.tabel.baris.find(r => r.kelompok === z.kelompok)!;
  lines.push(line(s`Pertama, bagian ${kelompok(ctx, z.kelompok)} diselesaikan dulu: ${spouseRow.fardh!} berarti dari ${z.ashl} bagian ia mendapat ${z.sahamPasangan}, `
    .concat(s`dan sisanya ${z.sisa} bagian.`), radd.refs));
  lines.push(line(penerimaGroups.length > 1
    ? s`Kedua, ${penerima} berbagi sisa itu dengan perbandingan ${perbandingan}, totalnya ${radd.raddiyyah.ashl} bagian.`
    : s`Kedua, sisa ${z.sisa} bagian itu seluruhnya untuk ${penerima}.`, radd.refs));

  const [cmp] = ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(st => st.tujuan === 'raddVsSisa');
  if (cmp && penerimaGroups.length > 1) {
    const { a: sisa, b: ashlRadd, fpb, hasil } = cmp;
    lines.push(line(cmp.hubungan === 'habis'
      ? s`Ketiga, ${sisa} bagian bisa dibagi rata dengan perbandingan tadi (total ${ashlRadd}), jadi penyebutnya tetap ${hasil}.`
      : cmp.hubungan === 'tawafuq'
        ? s`Ketiga, ${sisa} bagian tidak bisa dibagi rata menjadi ${ashlRadd}, tetapi keduanya sama-sama bisa dibagi ${fpb} (${term('tawafuq', 'tawafuq')}). `
          .concat(s`Maka semuanya dikalikan ${ashlRadd / fpb}: harta dibagi menjadi ${hasil} bagian.`)
        : s`Ketiga, ${sisa} bagian tidak bisa dibagi rata menjadi ${ashlRadd}, dan keduanya tidak punya faktor bersama (${term('tabayun', 'tabayun')}). `
          .concat(s`Maka semuanya dikalikan ${ashlRadd}: harta dibagi menjadi ${hasil} bagian.`), cmp.refs));
  }

  const hasilRadd = ctx.hasil.tabel.baris.map(barisTabel => barisTabel.kelompok === z.kelompok
    ? s`${kelompok(ctx, barisTabel.kelompok)} ${barisTabel.sel['radd']!} bagian (tetap ${barisTabel.fardh!})`
    : s`${kelompok(ctx, barisTabel.kelompok)} ${barisTabel.sel['radd']!} bagian`);
  lines.push(line(s`Hasilnya: ${joinAnd(hasilRadd)}.`, radd.refs));
  return lines;
}

// ─── Langkah: tashih ──────────────────────────────────────────────────────────

function babPembulatan(ctx: Ctx): Section | undefined {
  const inkisar = ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(st => st.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const lines: ExplainLine[] = [];
  if (inkisar.some(st => st.hubungan !== 'habis')) {
    lines.push(line(s`Bagian sebuah kelompok kadang tidak bisa dibagi rata ke anggotanya (${term('inkisar', 'inkisar')}). Kalau begitu, jumlah bagian `
      .concat(s`diperbesar supaya setiap orang mendapat bilangan bulat (${term('tashih', 'tashih')}).`), ['R10-2']));
  }
  for (const step of inkisar) {
    const anggota = ctx.membersOf(step.kelompok!);
    const { a: saham, b: ruus, fpb, hasil } = step;
    const untuk = ruus > BigInt(anggota.length)
      ? s`${ruus} kepala (${term('ruus', "ru'us")}, laki-laki dihitung 2)`
      : s`${ruus} orang`;
    const who = kelompok(ctx, step.kelompok!);
    lines.push(line(step.hubungan === 'habis'
      ? s`${who} mendapat ${saham} bagian untuk ${untuk}, pas dibagi rata.`
      : step.hubungan === 'tawafuq'
        ? s`${who} mendapat ${saham} bagian untuk ${untuk}. ${saham} tidak bisa dibagi ${ruus}, tetapi keduanya sama-sama bisa dibagi ${fpb} `
          .concat(s`(${term('tawafuq', 'tawafuq')}), jadi yang disimpan ${ruus} ÷ ${fpb} = ${hasil}.`)
        : s`${who} mendapat ${saham} bagian untuk ${untuk}. ${saham} tidak bisa dibagi ${ruus} dan keduanya tidak punya faktor bersama `
          .concat(s`(${term('tabayun', 'tabayun')}), jadi angka ${ruus} disimpan.`), step.refs));
  }
  for (const step of ctx.langkahLangkah('PERBANDINGAN_NISAB').filter(st => st.tujuan === 'juzSahm')) {
    lines.push(line(arbaStory(step, s`Angka yang disimpan, ${step.a} dan ${step.b}, digabung`), step.refs));
  }
  const [tashih] = ctx.langkahLangkah('TASHIH');
  lines.push(tashih
    ? line(s`Semua bagian dikalikan ${tashih.juzSahm} (${term('juz-as-sahm', "juz' as-sahm")}): ${tashih.dasar} × ${tashih.juzSahm} = ${tashih.hasil} bagian.`, tashih.refs)
    : line(s`Semua kelompok bisa dibagi rata, jadi tidak perlu pembulatan.`, ['R10-2']));
  return { title: 'Membulatkan bagian per orang', lines };
}

// ─── Langkah: hasil ───────────────────────────────────────────────────────────

function babHasil(ctx: Ctx): Section {
  const { tabel, pembulatan } = ctx.hasil;
  const den = ctx.finalDenominator;
  const lines = [line(s`Harta dibagi menjadi ${den} bagian:`)];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang)) {
      const who = ctx.people.mention([id]);
      lines.push(line(saham === 0n
        ? s`${who}: tidak mendapat bagian karena sisa harta sudah habis.`
        : s`${who}: ${saham} bagian (${saham}/${den})${ctx.showNominal ? ` = ${rupiah(nominal)}` : ''}.`, ['R11-1']));
    }
  }
  if (ctx.showNominal && pembulatan.sisaPembulatan > 0n) {
    const perUnit = pembulatan.satuan > 1n;
    lines.push(line([
      ...s`Karena setiap bagian dibulatkan ke bawah${perUnit ? ` per ${rupiah(pembulatan.satuan)}` : ' ke rupiah'}, ada selisih ${rupiah(pembulatan.sisaPembulatan)} yang belum dibagikan. `,
      ...s`Uang ini tetap milik para ahli waris dan perlu disepakati bersama penyalurannya.`,
      ...(perUnit ? s` Jika dibagikan lewat transfer bank, pembulatan bisa per rupiah sehingga selisihnya lebih kecil.` : []),
    ]));
  }
  return { title: 'Hasil akhir', lines };
}

