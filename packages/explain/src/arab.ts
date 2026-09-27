// Penjelasan berbahasa Arab untuk santri (keputusan 2026-09-26, docs/design/dwibahasa.md).
// Menerima konteks yang sama dengan mode ringkas → bab-bab bergaya kitab: angka Arab (٠١٢), tanpa harakat,
// nama fardh (النصف، السدس) alih-alih "1/2". Urutan bab & `kolom` sama dengan cerita supaya sorotan UI tetap jalan.
// Semua redaksi Arab di sini draf: perlu dicek tim keilmuan (bukan hukum baru; hukumnya tetap dari jejak engine).

import type { AlasanFardh, GrafKeluarga, IdOrang, KunciAhliWaris, PilihanJadd } from '@waris/engine';
import type { Pecahan } from '@waris/math';
import type { Bab } from './cerita.js';
import type { Konteks, Langkah } from './context.js';
import { kalimat, type BarisPenjelasan, type Potongan } from './segments.js';
import { istilah } from './terms.js';

export const PERLU_CEK_ARAB = true;

/** Padanan Arab kunci ahli waris, dari transliterasi tabel KB bab 3.1–3.2 [R03-1]. */
export const LABEL_ARAB: Record<KunciAhliWaris, string> = {
  ANAK_LK: 'الابن', CUCU_LK: 'ابن الابن', AYAH: 'الأب', KAKEK: 'الجد', SAUDARA_KANDUNG: 'الأخ الشقيق',
  SAUDARA_SEBAPAK: 'الأخ لأب', SAUDARA_SEIBU: 'الأخ لأم', KEPONAKAN_KANDUNG: 'ابن الأخ الشقيق', KEPONAKAN_SEBAPAK: 'ابن الأخ لأب',
  PAMAN_KANDUNG: 'العم الشقيق', PAMAN_SEBAPAK: 'العم لأب', SEPUPU_KANDUNG: 'ابن العم الشقيق', SEPUPU_SEBAPAK: 'ابن العم لأب',
  SUAMI: 'الزوج', MUTIQ: 'المعتق',
  ANAK_PR: 'البنت', CUCU_PR: 'بنت الابن', IBU: 'الأم', NENEK_DARI_IBU: 'أم الأم', NENEK_DARI_AYAH: 'أم الأب',
  SAUDARI_KANDUNG: 'الأخت الشقيقة', SAUDARI_SEBAPAK: 'الأخت لأب', SAUDARI_SEIBU: 'الأخت لأم', ISTRI: 'الزوجة', MUTIQAH: 'المعتقة',
};

export function babArab(konteks: Konteks, graf: GrafKeluarga): Bab[] {
  const sebut = buatSebutArab(konteks, graf);
  return [babTirkah, babWaratsah, babFurudh, babAshl, babKelas, babTashih, babHasil]
    .map(susun => susun(konteks, sebut))
    .filter((bab): bab is Bab => bab !== undefined);
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

type SebutArab = (ids: IdOrang[]) => Potongan;

const ANGKA_ARAB = '٠١٢٣٤٥٦٧٨٩';
export const angkaArab = (teks: string): string => teks.replace(/\d/g, digit => ANGKA_ARAB[Number(digit)]!);

const NAMA_FARDH: Record<string, string> = {
  '1/2': 'النصف', '1/4': 'الربع', '1/8': 'الثمن', '2/3': 'الثلثان', '1/3': 'الثلث', '1/6': 'السدس',
};
const fardh = (pecahan: Pecahan): string => NAMA_FARDH[`${pecahan.n}/${pecahan.d}`] ?? `${pecahan.n}/${pecahan.d}`;

const uang = (besaran: bigint): string => `${besaran.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬')} روبية`;

/** Baris Arab: angka Latin di teks diganti angka Arab; sebutan orang & istilah tetap berjenis. */
function baris(daftarPotongan: Potongan[], refs: string[] = [], subjek?: IdOrang[]): BarisPenjelasan {
  const potonganArab = daftarPotongan.map(potongan => ({ ...potongan, teks: angkaArab(potongan.teks) }));
  return { daftarPotongan: potonganArab, refs, ...(subjek ? { subjek } : {}) };
}

/** "و" sebagai penghubung, seperti kebiasaan kitab: «الأب والأم والبنت». */
const gabungWa = (daftar: Potongan[][]): Potongan[] =>
  daftar.flatMap((unsur, i) => (i === 0 ? unsur : [{ jenis: 'teks' as const, teks: ' و' }, ...unsur]));

function buatSebutArab(konteks: Konteks, graf: GrafKeluarga): SebutArab {
  const labelDari = (id: IdOrang) => {
    const kunci = konteks.sebutan.peranDari(id)?.kunci;
    // ponytail: paman/anak paman ayah-kakek (R03-2) tidak diberi keterangan leluhur; tambah bila tim keilmuan memberi redaksinya.
    return kunci && kunci in LABEL_ARAB ? LABEL_ARAB[kunci as KunciAhliWaris] : 'قريب';
  };
  const warits = Object.entries(konteks.hasil.statusOrang).filter(([, status]) => status.jenis === 'ahliWaris').map(([id]) => id);
  const nomorDalamPeran = (id: IdOrang) => {
    const sePeran = warits.filter(lain => labelDari(lain) === labelDari(id));
    return sePeran.length > 1 ? ` ${sePeran.indexOf(id) + 1}` : '';
  };
  return ids => {
    const perLabel = new Map<string, IdOrang[]>();
    for (const id of ids) perLabel.set(labelDari(id), [...(perLabel.get(labelDari(id)) ?? []), id]);
    const teks = [...perLabel].map(([label, anggota]) => {
      const bernama = anggota.map(id => graf.orang[id]?.nama).filter((nama): nama is string => !!nama);
      if (bernama.length === anggota.length) return `${bernama.join(' و')} (${label})`;
      return anggota.length === 1 ? `${label}${nomorDalamPeran(anggota[0]!)}` : `${label} ×${anggota.length}`;
    }).join(' و');
    return { jenis: 'orang', daftarIdOrang: ids, teks };
  };
}

const KUNCI_PEREMPUAN = new Set(['ANAK_PR', 'CUCU_PR', 'IBU', 'NENEK_DARI_IBU', 'NENEK_DARI_AYAH', 'SAUDARI_KANDUNG', 'SAUDARI_SEBAPAK', 'SAUDARI_SEIBU', 'ISTRI', 'MUTIQAH']);

const semuaAnggota = (konteks: Konteks, idKelompok: string) => konteks.anggotaDari(idKelompok);

// ─── Bab ──────────────────────────────────────────────────────────────────────

function babTirkah(konteks: Konteks): Bab | undefined {
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  if (!tirkah || tirkah.kotor === 0n) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  if (tirkah.tajhiz > 0n || tirkah.hutang > 0n) {
    daftarBaris.push(baris(kalimat`${istilah('tirkah', 'التركة')} ${uang(tirkah.kotor)}، يخرج منها مؤن التجهيز ${uang(tirkah.tajhiz)} والدين ${uang(tirkah.hutang)}، فيبقى ${uang(tirkah.bersih + tirkah.wasiatDipakai)}.`, tirkah.refs));
  }
  if (tirkah.wasiatDiminta > 0n) {
    daftarBaris.push(baris(kalimat`الوصية ${uang(tirkah.wasiatDiminta)}، وحدها الثلث ${uang(tirkah.wasiatBatas)}، فينفذ منها ${uang(tirkah.wasiatDipakai)}`
      .concat(tirkah.wasiatButuhIjazah > 0n ? kalimat`، والزائد ${uang(tirkah.wasiatButuhIjazah)} موقوف على إجازة الورثة.` : kalimat`.`), ['R01-4']));
  }
  daftarBaris.push(baris(kalimat`ما يقسم بين الورثة: ${uang(tirkah.bersih)}.`, ['R11-1']));
  return { judul: 'التركة', daftarBaris, kolom: 'nominal' };
}

function babWaratsah(konteks: Konteks, sebut: SebutArab): Bab {
  const daftarWarits = Object.entries(konteks.hasil.statusOrang).filter(([, status]) => status.jenis === 'ahliWaris').map(([id]) => id);
  const daftarBaris = [baris(kalimat`${istilah('warits', 'الورثة')}: ${gabungWa(daftarWarits.map(id => [sebut([id])]))}.`)];
  for (const langkah of konteks.daftarLangkah('MANI')) {
    daftarBaris.push(baris(kalimat`${sebut([langkah.idOrang])} لا يرث، ${istilah('mani', 'لمانع')} ${langkah.mani === 'qatl' ? 'القتل' : 'اختلاف الدين'}.`, langkah.refs, [langkah.idOrang]));
  }
  for (const langkah of konteks.daftarLangkah('HAJB_HIRMAN')) {
    daftarBaris.push(baris(kalimat`${sebut([langkah.mahjub])} ${istilah('hajb-hirman', 'محجوب حجب حرمان')} بـ${sebut(langkah.hajib)}.`, langkah.refs, [langkah.mahjub]));
  }
  return { judul: 'الورثة', daftarBaris, kolom: 'ahliWaris' };
}

const OPSI_JADD: Record<PilihanJadd, string> = { muqasamah: 'المقاسمة', tsuluts: 'ثلث المال', tsulutsBaqi: 'ثلث الباقي', sudus: 'سدس المال' };

function pilihanJadd(pilihan: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }>): Potongan[] {
  const daftarOpsi = pilihan.opsi.map(opsi => `${OPSI_JADD[opsi.nama]} ${opsi.nilai.n}/${opsi.nilai.d}`).join('، ');
  return kalimat`له الأحظ من: ${daftarOpsi}، وهو ${OPSI_JADD[pilihan.terpilih]}.`;
}

// Redaksi sebab tiap fardh; kodenya dari engine (hukumnya sudah diputuskan di sana).
function sebabFardh(alasan: AlasanFardh, sebut: SebutArab): Potongan[] {
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS': return kalimat`لوجود ${istilah('faru-warits', 'الفرع الوارث')} (${sebut(alasan.oleh)})`;
    case 'TANPA_FARU_WARITS': return kalimat`لعدم ${istilah('faru-warits', 'الفرع الوارث')}`;
    case 'JAM_IKHWAH': return kalimat`لوجود ${istilah('jam-min-al-ikhwah', 'جمع من الإخوة')} (${sebut(alasan.oleh)})`;
    case 'TANPA_FARU_WARITS_DAN_IKHWAH': return kalimat`لعدم الفرع الوارث وعدم الجمع من الإخوة`;
    case 'UMARIYYATAIN': return kalimat`${istilah('umariyyatain', 'العمريتان')}: ثلث الباقي بعد فرض أحد الزوجين ${fardh(alasan.fardhPasangan)}`;
    case 'NENEK_TANPA_IBU': return kalimat`لعدم الأم`;
    case 'TANPA_MUASHSHIB': return kalimat`${alasan.banyaknya === 1 ? 'لانفرادها' : 'لتعددهن'} وعدم ${istilah('muashshib', 'المعصب')}`;
    case 'TAKMILAH': return kalimat`${istilah('takmilah-tsulutsain', 'تكملة الثلثين')} مع ${sebut(alasan.bersama)}`;
    case 'KALALAH': return kalimat`${alasan.banyaknya === 1 ? 'لانفراده' : 'لتعددهم'}، والمسألة ${istilah('kalalah', 'كلالة')}`;
    case 'ADA_FARU_MUDZAKKAR': return kalimat`لوجود الفرع الوارث الذكر (${sebut(alasan.oleh)})`;
    case 'ADA_FARU_MUANNATS': return kalimat`لوجود الفرع الوارث الأنثى (${sebut(alasan.oleh)})، فله السدس والباقي تعصيبا`;
    case 'MUSYARRAKAH': return kalimat`${istilah('musyarrakah', 'المشركة')}، يقسم بينهم بالسوية`;
    case 'AKDARIYYAH': return kalimat`${istilah('akdariyyah', 'الأكدرية')} (${alasan.porsi === 'jadd' ? 'للجد السدس' : 'للأخت النصف، ثم يضم إلى نصيب الجد ويقسم للذكر مثل حظ الأنثيين'})`;
    case 'JADD_SISA_SEDIKIT': return kalimat`الباقي ${alasan.sisa} لا يزيد على السدس، فللجد السدس وسقط الإخوة`;
    case 'JADD_WAL_IKHWAH': return pilihanJadd(alasan);
  }
}

function babFurudh(konteks: Konteks, sebut: SebutArab): Bab {
  const daftarBaris: BarisPenjelasan[] = [];
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(langkah => langkah.kelompok));
  for (const langkah of konteks.hasil.jejak) {
    if (langkah.jenis === 'FARDH') {
      const anggota = semuaAnggota(konteks, langkah.kelompok);
      daftarBaris.push(baris(kalimat`${sebut(anggota)}: ${fardh(langkah.fardh)}، ${sebabFardh(langkah.alasan, sebut)}.`, langkah.refs, anggota));
    } else if (langkah.jenis === 'HAJB_NUQSHAN') {
      daftarBaris.push(baris(kalimat`${istilah('hajb-nuqshan', 'حجب نقصان')}: ${sebut([langkah.terdampak])} من ${fardh(langkah.dari)} إلى ${fardh(langkah.menjadi)}.`, langkah.refs, [langkah.terdampak]));
    } else if (langkah.jenis === 'ASHABAH' && !kelompokFardh.has(langkah.kelompok)) {
      const anggota = semuaAnggota(konteks, langkah.kelompok);
      const jenis = langkah.jenisAshabah === 'binNafsi' ? istilah('bi-nafsihi', 'عصبة بالنفس')
        : langkah.jenisAshabah === 'bilGhair' ? istilah('bil-ghair', 'عصبة بالغير، للذكر مثل حظ الأنثيين') : istilah('maal-ghair', 'عصبة مع الغير');
      daftarBaris.push(baris(kalimat`${sebut(anggota)}: ${jenis}${langkah.pilihanJadd ? kalimat`، والجد ${pilihanJadd(langkah.pilihanJadd)}` : '.'}`, langkah.refs, anggota));
    }
  }
  return { judul: 'الفروض والتعصيب', daftarBaris, kolom: 'bagian' };
}

function babAshl(konteks: Konteks, sebut: SebutArab): Bab {
  const { baris: daftarBarisTabel, totalKolom } = konteks.hasil.tabel;
  const daftarBaris: BarisPenjelasan[] = konteks.daftarLangkah('PERBANDINGAN_NISAB')
    .filter(langkah => langkah.tujuan === 'ashl')
    .map(langkah => baris(nisabArba(langkah, 'المخرجان'), langkah.refs));
  const rincian = daftarBarisTabel.map(barisTabel => kalimat`${sebut(barisTabel.anggota)} ${barisTabel.sel['ashl']!}`);
  daftarBaris.push(baris(kalimat`${istilah('ashlul-masalah', 'أصل المسألة')} ${totalKolom.ashl!}. ${istilah('saham', 'السهام')}: `
    .concat(...rincian.flatMap((potongan, i) => (i ? [kalimat`، `, potongan] : [potongan])), kalimat`.`)));
  return { judul: 'أصل المسألة', daftarBaris, kolom: 'ashl' };
}

function babKelas(konteks: Konteks, sebut: SebutArab): Bab {
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) return { judul: 'العول والرد', daftarBaris: [barisSisaKeluar(konteks, sebut, sisaKeluar)], kolom: 'penyesuaian' };
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const daftarBaris: BarisPenjelasan[] = [];
  if (kelas.kelas === 'adilah') daftarBaris.push(baris(kalimat`مجموع السهام ${kelas.jumlahSaham} مساو للأصل ${kelas.ashl}، فالمسألة ${istilah('adilah', 'عادلة')}.`, kelas.refs));
  if (kelas.kelas === 'ailah') daftarBaris.push(baris(kalimat`مجموع السهام ${kelas.jumlahSaham} أكثر من الأصل ${kelas.ashl}، فالمسألة ${istilah('aul', 'عائلة')}، تعول إلى ${kelas.jumlahSaham}.`, kelas.refs));
  if (kelas.kelas === 'raddA' || kelas.kelas === 'raddB') daftarBaris.push(...barisRadd(konteks, sebut, kelas));
  return { judul: 'العول والرد', daftarBaris, kolom: 'penyesuaian' };
}

function barisRadd(konteks: Konteks, sebut: SebutArab, kelas: Langkah<'KELAS_MASALAH'>): BarisPenjelasan[] {
  const daftarBaris = [baris(kalimat`مجموع السهام ${kelas.jumlahSaham} أقل من الأصل ${kelas.ashl} ولا عاصب، ففيها ${istilah('radd', 'الرد')}${kelas.kelas === 'raddB' ? '، ولا يرد على الزوجين' : ''}.`, kelas.refs)];
  const [radd] = konteks.daftarLangkah('RADD');
  if (radd?.zawjiyyah) {
    const zawjiyyah = radd.zawjiyyah;
    daftarBaris.push(baris(kalimat`مسألة الزوجية من ${zawjiyyah.ashl}: ${sebut(semuaAnggota(konteks, zawjiyyah.kelompok))} ${zawjiyyah.sahamPasangan}، والباقي ${zawjiyyah.sisa}. `
      .concat(kalimat`مسألة الرد: ${Object.values(radd.raddiyyah.saham).join(' : ')}، فأصلها ${radd.raddiyyah.ashl}.`), radd.refs));
  } else if (radd) {
    daftarBaris.push(baris(kalimat`أصل مسألة الرد مجموع سهام أهل الرد: ${radd.raddiyyah.ashl}.`, radd.refs));
  }
  for (const langkah of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkah => langkah.tujuan === 'raddVsSisa')) {
    daftarBaris.push(baris(nisabRadd(langkah), langkah.refs));
  }
  return daftarBaris;
}

function barisSisaKeluar(konteks: Konteks, sebut: SebutArab, langkah: Langkah<'SISA_KELUAR'>): BarisPenjelasan {
  const pasangan = konteks.hasil.tabel.baris.flatMap(barisTabel => barisTabel.anggota);
  const tujuan = langkah.tujuan === 'dzawilArham' ? 'لذوي الأرحام' : 'لذوي الأرحام إن وجدوا، وإلا فلبيت المال';
  return baris(kalimat`من ${langkah.ashl}: ${sebut(pasangan)} ${langkah.ashl - langkah.saham}، والباقي ${langkah.saham} لا يرد على الزوجين، فهو ${tujuan}.`, langkah.refs, pasangan);
}

function babTashih(konteks: Konteks, sebut: SebutArab): Bab | undefined {
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkah => langkah.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const daftarBaris = inkisar.map(langkah => {
    const anggota = semuaAnggota(konteks, langkah.kelompok!);
    const semuaPerempuan = anggota.every(id => KUNCI_PEREMPUAN.has(konteks.sebutan.peranDari(id)?.kunci ?? ''));
    return baris(kalimat`${sebut(anggota)}: `.concat(nisabInkisar(langkah, langkah.b > BigInt(anggota.length), semuaPerempuan ? 'هن' : 'هم')), langkah.refs);
  });
  for (const langkah of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkah => langkah.tujuan === 'juzSahm')) {
    daftarBaris.push(baris(nisabArba(langkah, 'المثبتان'), langkah.refs));
  }
  const [tashih] = konteks.daftarLangkah('TASHIH');
  daftarBaris.push(tashih
    ? baris(kalimat`${istilah('juz-as-sahm', 'جزء السهم')} ${tashih.juzSahm}، و${istilah('tashih', 'التصحيح')}: ${tashih.dasar} × ${tashih.juzSahm} = ${tashih.hasil}.`, tashih.refs)
    : baris(kalimat`لا ${istilah('inkisar', 'انكسار')}، فلا حاجة إلى التصحيح.`, ['R10-2']));
  return { judul: 'التصحيح', daftarBaris, kolom: 'tashih' };
}

function babHasil(konteks: Konteks, sebut: SebutArab): Bab {
  const { tabel, pembulatan } = konteks.hasil;
  const daftarBaris: BarisPenjelasan[] = [];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang) as Array<[IdOrang, { saham: bigint; nominal: bigint }]>) {
      daftarBaris.push(baris(kalimat`${sebut([id])}: ${saham} من ${konteks.penyebutAkhir}${konteks.tampilkanNominal ? ` = ${uang(nominal)}` : ''}.`, ['R11-1'], [id]));
    }
  }
  if (konteks.tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    daftarBaris.push({ ...baris(kalimat`فرق التقريب ${uang(pembulatan.sisaPembulatan)} (بوحدة ${uang(pembulatan.satuan)})، لم يقسم.`), penekanan: 'perhatian' });
  }
  return { judul: 'القسمة', daftarBaris, kolom: 'nominal' };
}

// ─── Nisab arba' (bab 10.2 [R10-1]) ──────────────────────────────────────────

type LangkahNisab = Langkah<'PERBANDINGAN_NISAB'>;

function nisabArba({ a, b, hubungan, fpb, hasil }: LangkahNisab, kataBenda: string): Potongan[] {
  switch (hubungan) {
    case 'tamatsul': return kalimat`${kataBenda} ${a} و${b} ${istilah('tamatsul', 'متماثلان')}، فيكتفى بأحدهما: ${hasil}.`;
    case 'tadakhul': return kalimat`${kataBenda} ${a} و${b} ${istilah('tadakhul', 'متداخلان')}، فيكتفى بالأكبر: ${hasil}.`;
    case 'tawafuq': return kalimat`${kataBenda} ${a} و${b} ${istilah('tawafuq', 'متوافقان')} بـ${fpb}، فيضرب ${istilah('wafq', 'وفق')} أحدهما في الآخر: ${a} × (${b} ÷ ${fpb}) = ${hasil}.`;
    // [R10-5] «كل عدد مع الواحد فهو متباين»
    case 'tabayun': return kalimat`${kataBenda} ${a} و${b} ${istilah('tabayun', 'متباينان')}، فيضرب أحدهما في الآخر: ${a} × ${b} = ${hasil}.`;
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk nisab arba'`);
  }
}

/** `dhamir`: هم / هن (kelompok perempuan saja), supaya «سهامهن ... رؤوسهن» sesuai jenisnya. */
function nisabInkisar({ a: saham, b: ruus, hubungan, fpb, hasil }: LangkahNisab, berbobot: boolean, dhamir: 'هم' | 'هن'): Potongan[] {
  const teksRuus = kalimat`${istilah('ruus', `رؤوس${dhamir}`)} ${ruus}${berbobot ? ' (الذكر برأسين)' : ''}`;
  switch (hubungan) {
    case 'habis': return kalimat`سهام${dhamir} ${saham} تنقسم على ${teksRuus}.`;
    case 'tawafuq': return kalimat`سهام${dhamir} ${saham} لا تنقسم على ${teksRuus} وبينهما ${istilah('tawafuq', 'موافقة')} بـ${fpb}، فيثبت ${istilah('wafq', 'وفق')} الرؤوس: ${ruus} ÷ ${fpb} = ${hasil}.`;
    case 'tabayun': return kalimat`سهام${dhamir} ${saham} لا تنقسم على ${teksRuus} وبينهما ${istilah('tabayun', 'مباينة')}، فتثبت الرؤوس كلها: ${hasil}.`;
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk inkisar`);
  }
}

function nisabRadd({ a: sisa, b: ashlRadd, hubungan, fpb, hasil }: LangkahNisab): Potongan[] {
  const ashlZawjiyyah = hasil / (ashlRadd / fpb);
  switch (hubungan) {
    case 'habis': return kalimat`الباقي ${sisa} ينقسم على مسألة الرد ${ashlRadd}، فتصح من مسألة الزوجية: ${hasil}.`;
    case 'tawafuq': return kalimat`الباقي ${sisa} ومسألة الرد ${ashlRadd} ${istilah('tawafuq', 'متوافقان')} بـ${fpb}، فيضرب وفق مسألة الرد في مسألة الزوجية: ${ashlZawjiyyah} × (${ashlRadd} ÷ ${fpb}) = ${hasil}.`;
    case 'tabayun': return kalimat`الباقي ${sisa} ومسألة الرد ${ashlRadd} ${istilah('tabayun', 'متباينان')}، فتضرب مسألة الرد في مسألة الزوجية: ${ashlZawjiyyah} × ${ashlRadd} = ${hasil}.`;
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk radd`);
  }
}
