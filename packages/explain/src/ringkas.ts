// Mode ringkas (untuk pelajar/ustadz): istilah dulu, langsung ke angka.
// Urutan bab sama dengan mode cerita: harta → ahli waris → bagian → ashl → klasifikasi → tashih → hasil.
// Kalimat = diksi `narasi.ringkas.*`; label istilah baku dari `narasi.umum.istilah.*` (kapital awal oleh buatBaris).

import type { AlasanFardh, PilihanJadd, IdOrang } from '@waris/engine';
import { ceritaSisaKeluar, type Bab } from './cerita.js';
import { sebutKelompok, sebutSemua, type Konteks } from './context.js';
import { rupiah } from './format.js';
import { narasiNisab } from './nisab.js';
import { buatBaris, kalimat, susun, teksKamus, type BarisPenjelasan, type Potongan, type Sisipan } from './segments.js';
import { istilah, istilahNarasi, type IdIstilah } from './terms.js';

export function babRingkas(konteks: Konteks): Bab[] {
  return [babHarta, babAhliWaris, babBagian, babAshl, babKlasifikasi, babTashih, babHasil]
    .map(buatBab => buatBab(konteks))
    .filter((bab): bab is Bab => bab !== undefined);
}

const ringkas = (konteks: Konteks, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] =>
  susun(konteks.penyusun, `narasi.ringkas.${kunci}`, sisipan);
const judulRingkas = (konteks: Konteks, kunci: string): string => teksKamus(konteks.penyusun, `narasi.ringkas.${kunci}`);
const istilahUmum = (konteks: Konteks, id: IdIstilah): Potongan => istilahNarasi(konteks.penyusun, id);
/** Istilah yang labelnya khas mode ringkas (mis. "mahjub hirman", "ashl"). */
const istilahLokal = (konteks: Konteks, id: IdIstilah, kunci: string): Potongan => istilah(id, judulRingkas(konteks, kunci));

function babHarta(konteks: Konteks): Bab | undefined {
  const [langkahTirkah] = konteks.daftarLangkah('TIRKAH');
  if (!langkahTirkah || langkahTirkah.kotor === 0n) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  if (langkahTirkah.tajhiz > 0n || langkahTirkah.hutang > 0n) {
    daftarBaris.push(buatBaris(ringkas(konteks, 'harta.potongan', {
      tirkah: istilahUmum(konteks, 'tirkah'), kotor: rupiah(langkahTirkah.kotor), tajhiz: rupiah(langkahTirkah.tajhiz),
      hutang: rupiah(langkahTirkah.hutang), tersisa: rupiah(langkahTirkah.bersih + langkahTirkah.wasiatDipakai),
    }), langkahTirkah.refs));
  }
  if (langkahTirkah.wasiatDiminta > 0n) {
    const sisipan = { diminta: rupiah(langkahTirkah.wasiatDiminta), batas: rupiah(langkahTirkah.wasiatBatas), dipakai: rupiah(langkahTirkah.wasiatDipakai) };
    daftarBaris.push(buatBaris(langkahTirkah.wasiatButuhIjazah > 0n
      ? ringkas(konteks, 'harta.wasiat.lebih', { ...sisipan, kelebihan: rupiah(langkahTirkah.wasiatButuhIjazah) })
      : ringkas(konteks, 'harta.wasiat.cukup', sisipan), ['R01-4']));
  }
  daftarBaris.push(buatBaris(ringkas(konteks, 'harta.bersih', { bersih: rupiah(langkahTirkah.bersih) }), ['R11-1']));
  return { judul: judulRingkas(konteks, 'harta.judul'), daftarBaris };
}

function babAhliWaris(konteks: Konteks): Bab {
  const daftarAhliWaris = Object.entries(konteks.hasil.statusOrang).filter(([, langkahIni]) => langkahIni.jenis === 'ahliWaris').map(([id]) => id);
  const daftarBaris = [buatBaris(ringkas(konteks, 'ahli_waris.daftar', { daftar_ahli_waris: sebutSemua(konteks, daftarAhliWaris) }))];
  for (const langkah of konteks.daftarLangkah('MANI')) {
    daftarBaris.push(buatBaris(ringkas(konteks, 'ahli_waris.mani', {
      siapa: konteks.sebutan.sebut([langkah.idOrang]), mani: istilahUmum(konteks, 'mani'),
      sebab: judulRingkas(konteks, langkah.mani === 'qatl' ? 'ahli_waris.sebab_mani.qatl' : 'ahli_waris.sebab_mani.beda_agama'),
    }), langkah.refs));
  }
  for (const langkah of konteks.daftarLangkah('HAJB_HIRMAN')) {
    daftarBaris.push(buatBaris(ringkas(konteks, 'ahli_waris.terhalang', {
      siapa: konteks.sebutan.sebut([langkah.mahjub]), mahjub_hirman: istilahLokal(konteks, 'hajb-hirman', 'ahli_waris.istilah_mahjub_hirman'),
      hajib: sebutSemua(konteks, langkah.hajib),
    }), langkah.refs));
  }
  return { judul: judulRingkas(konteks, 'ahli_waris.judul'), daftarBaris };
}

const KUNCI_OPSI_KAKEK: Record<PilihanJadd, string> = { muqasamah: 'muqasamah', tsuluts: 'tsuluts', tsulutsBaqi: 'tsuluts_baqi', sudus: 'sudus' };
const opsiKakek = (konteks: Konteks, pilihan: PilihanJadd): string => judulRingkas(konteks, `bagian.opsi_kakek.${KUNCI_OPSI_KAKEK[pilihan]}`);

function pilihanJadd(konteks: Konteks, pilihan: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }>): Potongan[] {
  const terpilih = pilihan.opsi.find(opsiIni => opsiIni.nama === pilihan.terpilih)!;
  return ringkas(konteks, 'bagian.pilihan_jadd', {
    opsi: pilihan.opsi.map(opsiIni => `${opsiKakek(konteks, opsiIni.nama)} ${opsiIni.nilai.n}/${opsiIni.nilai.d}`).join(', '),
    terpilih: opsiKakek(konteks, pilihan.terpilih), nilai: terpilih.nilai,
  });
}

function alasanFardh(konteks: Konteks, alasan: AlasanFardh): Potongan[] {
  const alasanRingkas = (kunci: string, sisipan: Record<string, Sisipan> = {}) => ringkas(konteks, `bagian.alasan.${kunci}`, sisipan);
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS': return alasanRingkas('ada_faru_warits', { faru_warits: istilahUmum(konteks, 'faru-warits'), oleh: sebutSemua(konteks, alasan.oleh) });
    case 'TANPA_FARU_WARITS': return alasanRingkas('tanpa_faru_warits', { faru_warits: istilahUmum(konteks, 'faru-warits') });
    case 'JAM_IKHWAH': return alasanRingkas('jam_ikhwah', { jam_min_al_ikhwah: istilahUmum(konteks, 'jam-min-al-ikhwah'), oleh: sebutSemua(konteks, alasan.oleh) });
    case 'TANPA_FARU_WARITS_DAN_IKHWAH': return alasanRingkas('tanpa_faru_warits_dan_ikhwah');
    case 'UMARIYYATAIN':
      return alasanRingkas('umariyyatain', {
        umariyyatain: istilahLokal(konteks, 'umariyyatain', 'bagian.istilah_umariyyatain'), fardh_pasangan: alasan.fardhPasangan,
      });
    case 'NENEK_TANPA_IBU': return alasanRingkas('nenek_tanpa_ibu');
    case 'TANPA_MUASHSHIB': return alasanRingkas('tanpa_muashshib', { banyaknya: alasan.banyaknya, muashshib: istilahUmum(konteks, 'muashshib') });
    case 'TAKMILAH':
      return alasanRingkas('takmilah', { takmilah_tsulutsain: istilahUmum(konteks, 'takmilah-tsulutsain'), bersama: sebutSemua(konteks, alasan.bersama) });
    case 'KALALAH': return alasanRingkas('kalalah', { banyaknya: alasan.banyaknya, kalalah: istilahUmum(konteks, 'kalalah') });
    case 'ADA_FARU_MUDZAKKAR': return alasanRingkas('ada_faru_mudzakkar', { oleh: sebutSemua(konteks, alasan.oleh) });
    case 'ADA_FARU_MUANNATS': return alasanRingkas('ada_faru_muannats', { oleh: sebutSemua(konteks, alasan.oleh) });
    case 'MUSYARRAKAH': return alasanRingkas('musyarrakah', { musyarrakah: istilahLokal(konteks, 'musyarrakah', 'bagian.istilah_musyarrakah') });
    case 'AKDARIYYAH':
      return alasanRingkas(alasan.porsi === 'jadd' ? 'akdariyyah.kakek' : 'akdariyyah.saudari', {
        akdariyyah: istilahLokal(konteks, 'akdariyyah', 'bagian.istilah_akdariyyah'),
      });
    case 'JADD_SISA_SEDIKIT': return alasanRingkas('jadd_sisa_sedikit', { sisa: alasan.sisa });
    case 'JADD_WAL_IKHWAH': return pilihanJadd(konteks, alasan);
  }
}

function babBagian(konteks: Konteks): Bab {
  const daftarBaris: BarisPenjelasan[] = [];
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(langkahIni => langkahIni.kelompok));
  for (const langkah of konteks.hasil.jejak) {
    if (langkah.jenis === 'FARDH') {
      daftarBaris.push(buatBaris(kalimat`${sebutKelompok(konteks, langkah.kelompok)}: ${langkah.fardh} — ${alasanFardh(konteks, langkah.alasan)}.`, langkah.refs));
    } else if (langkah.jenis === 'HAJB_NUQSHAN') {
      daftarBaris.push(buatBaris(ringkas(konteks, 'bagian.nuqshan', {
        hajb_nuqshan: istilahUmum(konteks, 'hajb-nuqshan'), siapa: konteks.sebutan.sebut([langkah.terdampak]), dari: langkah.dari, menjadi: langkah.menjadi,
      }), langkah.refs));
    } else if (langkah.jenis === 'ASHABAH' && !kelompokFardh.has(langkah.kelompok)) {
      const jenis = langkah.jenisAshabah === 'binNafsi' ? istilahUmum(konteks, 'bi-nafsihi')
        : langkah.jenisAshabah === 'bilGhair' ? istilahLokal(konteks, 'bil-ghair', 'bagian.istilah_bil_ghair') : istilahUmum(konteks, 'maal-ghair');
      const penutup = langkah.pilihanJadd ? kalimat` — ${ringkas(konteks, 'bagian.ashabah_kakek', { pilihan: pilihanJadd(konteks, langkah.pilihanJadd) })}` : kalimat`.`;
      daftarBaris.push(buatBaris(kalimat`${sebutKelompok(konteks, langkah.kelompok)}: ${jenis}${penutup}`, langkah.refs));
    } else if (langkah.jenis === 'KASUS_KHUSUS') {
      daftarBaris.push(buatBaris(ringkas(konteks, 'bagian.kasus_khusus', {
        kasus: istilahLokal(konteks, langkah.nama, `bagian.istilah_kasus.${langkah.nama}`),
      }), langkah.refs));
    }
  }
  return { judul: judulRingkas(konteks, 'bagian.judul'), daftarBaris };
}

function babAshl(konteks: Konteks): Bab {
  const { baris, totalKolom } = konteks.hasil.tabel;
  const daftarBaris: BarisPenjelasan[] = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'ashl')
    .map(langkahIni => buatBaris(narasiNisab(konteks.penyusun, langkahIni), langkahIni.refs));
  const rincian = baris.map(barisTabel => kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${barisTabel.sel['ashl']!}`)
    .flatMap((potonganIni, i) => (i ? [...kalimat`; `, ...potonganIni] : potonganIni));
  daftarBaris.push(buatBaris(ringkas(konteks, 'ashl.rincian', {
    ashl: istilahLokal(konteks, 'ashlul-masalah', 'ashl.istilah_ashl'), nilai: totalKolom.ashl!, saham: istilahUmum(konteks, 'saham'), rincian,
  })));
  return { judul: judulRingkas(konteks, 'ashl.judul'), daftarBaris };
}

function babKlasifikasi(konteks: Konteks): Bab {
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  const judul = judulRingkas(konteks, 'klasifikasi.judul');
  if (sisaKeluar) return { judul, daftarBaris: [ceritaSisaKeluar(konteks, sisaKeluar)] };
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const daftarBaris: BarisPenjelasan[] = [];
  const jumlahDanAshl = { jumlah: kelas.jumlahSaham, ashl: kelas.ashl };
  if (kelas.kelas === 'adilah') daftarBaris.push(buatBaris(ringkas(konteks, 'klasifikasi.adilah', { ...jumlahDanAshl, adilah: istilahUmum(konteks, 'adilah') }), kelas.refs));
  if (kelas.kelas === 'ailah') daftarBaris.push(buatBaris(ringkas(konteks, 'klasifikasi.aul', { ...jumlahDanAshl, aul: istilahUmum(konteks, 'aul') }), kelas.refs));
  if (kelas.kelas === 'raddA' || kelas.kelas === 'raddB') {
    daftarBaris.push(buatBaris(ringkas(konteks, kelas.kelas === 'raddB' ? 'klasifikasi.radd.b' : 'klasifikasi.radd.a', {
      ...jumlahDanAshl, radd: istilahUmum(konteks, 'radd'),
    }), kelas.refs));
    const [radd] = konteks.daftarLangkah('RADD');
    if (radd?.zawjiyyah) {
      const zawjiyyah = radd.zawjiyyah;
      daftarBaris.push(buatBaris(ringkas(konteks, 'klasifikasi.zawjiyyah', {
        ashl: zawjiyyah.ashl, pasangan: sebutKelompok(konteks, zawjiyyah.kelompok), saham: zawjiyyah.sahamPasangan, sisa: zawjiyyah.sisa,
        perbandingan: Object.values(radd.raddiyyah.saham).join(' : '), ashl_radd: radd.raddiyyah.ashl,
      }), radd.refs));
    } else if (radd) {
      daftarBaris.push(buatBaris(ringkas(konteks, 'klasifikasi.tanpa_zawjiyyah', { ashl_radd: radd.raddiyyah.ashl }), radd.refs));
    }
    for (const langkahIni of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(nisab => nisab.tujuan === 'raddVsSisa')) {
      daftarBaris.push(buatBaris(narasiNisab(konteks.penyusun, langkahIni), langkahIni.refs));
    }
  }
  return { judul, daftarBaris };
}

function babTashih(konteks: Konteks): Bab | undefined {
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const daftarBaris = inkisar.map(langkahIni => buatBaris(kalimat`${sebutKelompok(konteks, langkahIni.kelompok!)}: `
    .concat(narasiNisab(konteks.penyusun, langkahIni, { berbobot: langkahIni.b > BigInt(konteks.anggotaDari(langkahIni.kelompok!).length) })), langkahIni.refs));
  for (const langkahIni of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(nisab => nisab.tujuan === 'juzSahm')) {
    daftarBaris.push(buatBaris(narasiNisab(konteks.penyusun, langkahIni), langkahIni.refs));
  }
  const [tashih] = konteks.daftarLangkah('TASHIH');
  daftarBaris.push(tashih
    ? buatBaris(ringkas(konteks, 'tashih.dikalikan', {
      juz_as_sahm: istilahUmum(konteks, 'juz-as-sahm'), pengali: tashih.juzSahm, tashih: istilahUmum(konteks, 'tashih'), dasar: tashih.dasar, hasil: tashih.hasil,
    }), tashih.refs)
    : buatBaris(ringkas(konteks, 'tashih.tidak_perlu', { inkisar: istilahUmum(konteks, 'inkisar') }), ['R10-2']));
  return { judul: judulRingkas(konteks, 'tashih.judul'), daftarBaris };
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
    daftarBaris.push(buatBaris(susun(konteks.penyusun, 'narasi.umum.selisih_pembulatan', {
      selisih: rupiah(pembulatan.sisaPembulatan), satuan: rupiah(pembulatan.satuan),
    })));
  }
  return { judul: judulRingkas(konteks, 'hasil.judul'), daftarBaris };
}
