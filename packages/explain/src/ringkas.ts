// Mode ringkas (untuk pelajar/ustadz): istilah dulu, langsung ke angka.
// Urutan bab sama dengan mode cerita: harta → ahli waris → bagian → ashl → klasifikasi → tashih → hasil.

import type { AlasanFardh, PilihanJadd, IdOrang } from '@waris/engine';
import { ceritaSisaKeluar, type Bab } from './cerita.js';
import { sebutKelompok, sebutSemua, type Konteks, type Langkah } from './context.js';
import { rupiah } from './format.js';
import { narasiNisab } from './nisab.js';
import { buatBaris, kalimat, type BarisPenjelasan, type Potongan } from './segments.js';
import { istilah } from './terms.js';

export function babRingkas(konteks: Konteks): Bab[] {
  return [babHarta, babAhliWaris, babBagian, babAshl, babKlasifikasi, babTashih, babHasil]
    .map(susun => susun(konteks))
    .filter((bab): bab is Bab => bab !== undefined);
}

function babHarta(konteks: Konteks): Bab | undefined {
  const [langkahTirkah] = konteks.daftarLangkah('TIRKAH');
  if (!langkahTirkah || langkahTirkah.kotor === 0n) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  if (langkahTirkah.tajhiz > 0n || langkahTirkah.hutang > 0n) {
    daftarBaris.push(buatBaris(kalimat`${istilah('tirkah', 'Tirkah')} ${rupiah(langkahTirkah.kotor)} − tajhiz ${rupiah(langkahTirkah.tajhiz)} − hutang ${rupiah(langkahTirkah.hutang)} = ${rupiah(langkahTirkah.bersih + langkahTirkah.wasiatDipakai)}.`, langkahTirkah.refs));
  }
  if (langkahTirkah.wasiatDiminta > 0n) {
    daftarBaris.push(buatBaris(kalimat`Wasiat ${rupiah(langkahTirkah.wasiatDiminta)}, batas 1/3 = ${rupiah(langkahTirkah.wasiatBatas)} → dijalankan ${rupiah(langkahTirkah.wasiatDipakai)}`
      .concat(langkahTirkah.wasiatButuhIjazah > 0n ? kalimat`; kelebihan ${rupiah(langkahTirkah.wasiatButuhIjazah)} butuh ijazah ahli waris.` : kalimat`.`), ['R01-4']));
  }
  daftarBaris.push(buatBaris(kalimat`Tirkah bersih: ${rupiah(langkahTirkah.bersih)}.`, ['R11-1']));
  return { judul: 'Harta yang dibagi', daftarBaris };
}

function babAhliWaris(konteks: Konteks): Bab {
  const daftarAhliWaris = Object.entries(konteks.hasil.statusOrang).filter(([, langkahIni]) => langkahIni.jenis === 'ahliWaris').map(([id]) => id);
  const daftarBaris = [buatBaris(kalimat`Yang mewarisi: ${sebutSemua(konteks, daftarAhliWaris)}.`)];
  for (const langkah of konteks.daftarLangkah('MANI')) {
    daftarBaris.push(buatBaris(kalimat`${konteks.sebutan.sebut([langkah.idOrang])} tidak mewarisi: ${istilah('mani', "mani'")} ${langkah.mani === 'qatl' ? 'qatl' : 'ikhtilaf ad-din'}.`, langkah.refs));
  }
  for (const langkah of konteks.daftarLangkah('HAJB_HIRMAN')) {
    daftarBaris.push(buatBaris(kalimat`${konteks.sebutan.sebut([langkah.mahjub])} ${istilah('hajb-hirman', 'mahjub hirman')} oleh ${sebutSemua(konteks, langkah.hajib)}.`, langkah.refs));
  }
  return { judul: 'Ahli waris', daftarBaris };
}

const OPSI_KAKEK: Record<PilihanJadd, string> = { muqasamah: 'muqasamah', tsuluts: '1/3 harta', tsulutsBaqi: '1/3 sisa', sudus: '1/6 harta' };

function pilihanJadd(pilihan: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }>): Potongan[] {
  const terpilih = pilihan.opsi.find(o => o.nama === pilihan.terpilih)!;
  return kalimat`terbaik dari ${pilihan.opsi.map(o => `${OPSI_KAKEK[o.nama]} ${o.nilai.n}/${o.nilai.d}`).join(', ')} → ${OPSI_KAKEK[pilihan.terpilih]} ${terpilih.nilai}.`;
}

function alasanFardh(konteks: Konteks, alasan: AlasanFardh): Potongan[] {
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS': return kalimat`ada ${istilah('faru-warits', "far'u warits")} (${sebutSemua(konteks, alasan.oleh)})`;
    case 'TANPA_FARU_WARITS': return kalimat`tanpa ${istilah('faru-warits', "far'u warits")}`;
    case 'JAM_IKHWAH': return kalimat`${istilah('jam-min-al-ikhwah', "jam' min al-ikhwah")} (${sebutSemua(konteks, alasan.oleh)})`;
    case 'TANPA_FARU_WARITS_DAN_IKHWAH': return kalimat`tanpa far'u warits dan tanpa jam' min al-ikhwah`;
    case 'UMARIYYATAIN': return kalimat`${istilah('umariyyatain', "'Umariyyatain")}: 1/3 sisa setelah pasangan ${alasan.fardhPasangan}`;
    case 'NENEK_TANPA_IBU': return kalimat`tanpa ibu`;
    case 'TANPA_MUASHSHIB': return kalimat`${alasan.banyaknya} orang, tanpa ${istilah('muashshib', "mu'ashshib")}`;
    case 'TAKMILAH': return kalimat`${istilah('takmilah-tsulutsain', 'takmilah ats-tsulutsain')} bersama ${sebutSemua(konteks, alasan.bersama)}`;
    case 'KALALAH': return kalimat`${alasan.banyaknya} orang, ${istilah('kalalah', 'kalalah')}`;
    case 'ADA_FARU_MUDZAKKAR': return kalimat`ada far'u warits laki-laki (${sebutSemua(konteks, alasan.oleh)})`;
    case 'ADA_FARU_MUANNATS': return kalimat`far'u warits perempuan saja (${sebutSemua(konteks, alasan.oleh)}): 1/6 + sisa`;
    case 'MUSYARRAKAH': return kalimat`${istilah('musyarrakah', 'musyarrakah')}, rata per kepala`;
    case 'AKDARIYYAH': return kalimat`${istilah('akdariyyah', 'akdariyyah')} (${alasan.porsi === 'jadd' ? 'kakek 1/6' : 'saudari 1/2, digabung dengan kakek lalu 2 : 1'})`;
    case 'JADD_SISA_SEDIKIT': return kalimat`sisa ${alasan.sisa} ≤ 1/6 → kakek 1/6, saudara gugur`;
    case 'JADD_WAL_IKHWAH': return pilihanJadd(alasan);
  }
}

function babBagian(konteks: Konteks): Bab {
  const daftarBaris: BarisPenjelasan[] = [];
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(langkahIni => langkahIni.kelompok));
  for (const langkah of konteks.hasil.jejak) {
    if (langkah.jenis === 'FARDH') {
      daftarBaris.push(buatBaris(kalimat`${sebutKelompok(konteks, langkah.kelompok)}: ${langkah.fardh} — ${alasanFardh(konteks, langkah.alasan)}.`, langkah.refs));
    } else if (langkah.jenis === 'HAJB_NUQSHAN') {
      daftarBaris.push(buatBaris(kalimat`${istilah('hajb-nuqshan', 'Hajb nuqshan')}: ${konteks.sebutan.sebut([langkah.terdampak])} ${langkah.dari} → ${langkah.menjadi}.`, langkah.refs));
    } else if (langkah.jenis === 'ASHABAH' && !kelompokFardh.has(langkah.kelompok)) {
      const jenis = langkah.jenisAshabah === 'binNafsi' ? istilah('bi-nafsihi', 'ashabah bi nafsihi')
        : langkah.jenisAshabah === 'bilGhair' ? istilah('bil-ghair', 'ashabah bil ghair (2 : 1)') : istilah('maal-ghair', "ashabah ma'al ghair");
      daftarBaris.push(buatBaris(kalimat`${sebutKelompok(konteks, langkah.kelompok)}: ${jenis}${langkah.pilihanJadd ? kalimat` — kakek ${pilihanJadd(langkah.pilihanJadd)}` : '.'}`, langkah.refs));
    } else if (langkah.jenis === 'KASUS_KHUSUS') {
      daftarBaris.push(buatBaris(kalimat`Kasus khusus: ${istilah(langkah.nama, langkah.nama)}.`, langkah.refs));
    }
  }
  return { judul: 'Bagian masing-masing', daftarBaris };
}

function babAshl(konteks: Konteks): Bab {
  const { baris, totalKolom } = konteks.hasil.tabel;
  const nilai = totalKolom.ashl!;
  const daftarBaris: BarisPenjelasan[] = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'ashl').map(langkahIni => buatBaris(narasiNisab(langkahIni), langkahIni.refs));
  const sisipan = baris.map(barisTabel => kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${barisTabel.sel['ashl']!}`);
  daftarBaris.push(buatBaris(kalimat`${istilah('ashlul-masalah', 'Ashl')} = ${nilai}. ${istilah('saham', 'Saham')}: `.concat(...sisipan.flatMap((potonganIni, i) => (i ? [kalimat`; `, potonganIni] : [potonganIni])), kalimat`.`)));
  return { judul: "Ashlul mas'alah", daftarBaris };
}

function babKlasifikasi(konteks: Konteks): Bab {
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) return { judul: 'Klasifikasi', daftarBaris: [ceritaSisaKeluar(konteks, sisaKeluar)] };
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const daftarBaris: BarisPenjelasan[] = [];
  if (kelas.kelas === 'adilah') daftarBaris.push(buatBaris(kalimat`Σ saham ${kelas.jumlahSaham} = ashl ${kelas.ashl} → ${istilah('adilah', "'adilah")}.`, kelas.refs));
  if (kelas.kelas === 'ailah') daftarBaris.push(buatBaris(kalimat`Σ saham ${kelas.jumlahSaham} > ashl ${kelas.ashl} → ${istilah('aul', "'aul")} ke ${kelas.jumlahSaham}.`, kelas.refs));
  if (kelas.kelas === 'raddA' || kelas.kelas === 'raddB') {
    daftarBaris.push(buatBaris(kalimat`Σ saham ${kelas.jumlahSaham} < ashl ${kelas.ashl}, tanpa ashabah → ${istilah('radd', 'radd')}${kelas.kelas === 'raddB' ? ' (pasangan tidak menerima radd)' : ''}.`, kelas.refs));
    const [radd] = konteks.daftarLangkah('RADD');
    if (radd?.zawjiyyah) {
      const z = radd.zawjiyyah;
      daftarBaris.push(buatBaris(kalimat`Zawjiyyah: ashl ${z.ashl}, ${sebutKelompok(konteks, z.kelompok)} ${z.sahamPasangan}, sisa ${z.sisa}. Raddiyyah: ${Object.values(radd.raddiyyah.saham).join(' : ')} → ashl radd ${radd.raddiyyah.ashl}.`, radd.refs));
    } else if (radd) {
      daftarBaris.push(buatBaris(kalimat`Ashl radd = Σ saham ahli radd = ${radd.raddiyyah.ashl}.`, radd.refs));
    }
    for (const langkahIni of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(x => x.tujuan === 'raddVsSisa')) daftarBaris.push(buatBaris(narasiNisab(langkahIni), langkahIni.refs));
  }
  return { judul: 'Klasifikasi', daftarBaris };
}

function babTashih(konteks: Konteks): Bab | undefined {
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const daftarBaris = inkisar.map(langkahIni => buatBaris(kalimat`${sebutKelompok(konteks, langkahIni.kelompok!)}: `
    .concat(narasiNisab(langkahIni, { berbobot: langkahIni.b > BigInt(konteks.anggotaDari(langkahIni.kelompok!).length) })), langkahIni.refs));
  for (const langkahIni of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(x => x.tujuan === 'juzSahm')) daftarBaris.push(buatBaris(narasiNisab(langkahIni), langkahIni.refs));
  const [langkahTirkah] = konteks.daftarLangkah('TASHIH');
  daftarBaris.push(langkahTirkah
    ? buatBaris(kalimat`${istilah('juz-as-sahm', "Juz' as-sahm")} = ${langkahTirkah.juzSahm}. ${istilah('tashih', 'Tashih')} = ${langkahTirkah.dasar} × ${langkahTirkah.juzSahm} = ${langkahTirkah.hasil}.`, langkahTirkah.refs)
    : buatBaris(kalimat`Tanpa ${istilah('inkisar', 'inkisar')} → tidak perlu tashih.`, ['R10-2']));
  return { judul: 'Tashih', daftarBaris };
}

function babHasil(konteks: Konteks): Bab {
  const { tabel, pembulatan } = konteks.hasil;
  const daftarBaris: BarisPenjelasan[] = [];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang) as Array<[IdOrang, { saham: bigint; nominal: bigint }]>) {
      daftarBaris.push(buatBaris(kalimat`${konteks.sebutan.sebut([id])}: ${saham}/${konteks.penyebutAkhir}${konteks.tampilkanNominal ? ` = ${rupiah(nominal)}` : ''}.`, ['R11-1']));
    }
  }
  if (konteks.tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    daftarBaris.push(buatBaris(kalimat`Selisih pembulatan ${rupiah(pembulatan.sisaPembulatan)} (per ${rupiah(pembulatan.satuan)}), belum dibagikan.`));
  }
  return { judul: 'Hasil', daftarBaris };
}
