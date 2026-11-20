// Kasus = satu-satunya state yang disimpan (penyimpanan lokal dan berkas JSON, dua-duanya urusan pemanggil).
// Menerima isian wizard atau berkas; menyerahkan Kasus ke jalankan.ts. Berkas adalah batas kepercayaan:
// bentuknya divalidasi penuh sebelum dipakai, bigint disimpan sebagai string digit.
// Galat validasi berupa KODE (GalatKasus), bukan kalimat: pemanggil yang menerjemahkannya (web: diksi, server: apa adanya).

import { DAFTAR_RULESET } from '@waris/engine';
import type { GrafKeluarga, IdOrang, InputTirkah, KeadaanGharqa, Orang, Pernikahan, Ruleset } from '@waris/engine';

export const SATUAN_PEMBULATAN = [1n, 100n, 1000n] as const;
// Rincian harta hanya alat bantu mengisi total; engine tetap menerima `tirkah.kotor`.
export const KATEGORI_HARTA = ['tabungan', 'properti', 'kendaraan', 'emas', 'piutang', 'lainnya'] as const;
export type KategoriHarta = typeof KATEGORI_HARTA[number];
const ID_PEWARIS = 'PEWARIS';
const KEADAAN_GHARQA: KeadaanGharqa[] = ['serentak', 'terlupakan', 'berurutanTakDiketahui', 'tidakDiketahui'];
const STATUS_HIDUP: Orang['statusHidup'][] = ['hidup', 'wafat', 'tidakDiketahui', 'dalamKandungan', 'mafqud'];
const KHUNTSA: NonNullable<Orang['khuntsa']>[] = ['diharapkanJelas', 'tidakDiharapkanJelas'];

export const JENIS_KASUS = ['latihan', 'nyata'] as const;
export type JenisKasus = typeof JENIS_KASUS[number];
/** Jawaban pertanyaan pintu "hartanya sudah dibagi?" (spec kanvas 4); kosong = belum dijawab, tanpa bawaan. */
export const PINTU = ['baru', 'lama', 'sudah', 'tidakTahu'] as const;
export type Pintu = typeof PINTU[number];
export const KELOMPOK = ['pasangan', 'anak', 'orangTua', 'kakekNenek', 'saudara', 'jauh', 'saudaraKakek', 'anakBersama', 'halLain'] as const;
export type Kelompok = typeof KELOMPOK[number];
/** Presisi bebas: tahun saja sampai tanggal lengkap. Khusus UI; tidak pernah dikirim ke engine. */
export interface TanggalKira { tahun: number; bulan?: number; hari?: number; kiraKira: boolean }
export type Peristiwa =
  | { jenis: 'lahir'; idOrang: IdOrang; sesudahWafat: IdOrang }
  | { jenis: 'nikah' | 'cerai'; idOrang: IdOrang; idPasangan: IdOrang; sesudahWafat: IdOrang };
export type HalBelumPasti =
  | { jenis: 'urutan'; a: IdOrang; b: IdOrang; bersamaan: boolean }
  | { jenis: 'lahir'; anak: IdOrang; almarhum: IdOrang };

export interface GharqaKasus { anggota: IdOrang[]; keadaan: KeadaanGharqa; tirkah: Record<IdOrang, InputTirkah> }

export interface Kasus {
  versi: 4;
  graf: GrafKeluarga;
  tirkah: InputTirkah;
  satuanPembulatan: bigint;
  /** Wafat sesudah almarhum sebelumnya dan sebelum harta dibagi, urut waktu wafat (bab 12.7). */
  urutanWafat: IdOrang[];
  /** Diisi bila pengguna memilih "Rinci per jenis" di langkah Harta. */
  rincianHarta?: Partial<Record<KategoriHarta, bigint>>;
  /** Anak → almarhum yang wafat sebelum anak itu dikandung [R13-1]. */
  dikandungSetelahWafat?: Record<IdOrang, IdOrang>;
  /** Wafat bersamaan dengan pewaris (13d); pewaris selalu anggota, hartanya = `tirkah`. */
  gharqa?: GharqaKasus;
  /** Khusus UI (spec 2.2): wafat sesudah harta dibagi, engine melihat mereka hidup. */
  wafatSesudahDibagi?: IdOrang[];
  /** Madzhab yang dipakai engine; kosong = Syafi'i (default). */
  madzhab?: Ruleset;
  pilihanJanin?: 'tunggu' | 'hitungSekarang';
  /** Nama kasus dari pengguna (langkah Periksa); kosong = dinamai otomatis dari ringkasan. */
  nama?: string;
  /** Pintu masuk Lab (spec kanvas 3): latihan soal atau kasus keluarga nyata. */
  jenisKasus: JenisKasus;
  pintu?: Pintu;
  /** Bagian yang sudah dijawab per orang ("Tidak" juga jawaban). Khusus UI. */
  kelompokDijawab?: Record<IdOrang, Kelompok[]>;
  /** Baris hasil penghitung yang keadaannya belum dipilih. Khusus UI. */
  belumDiisi?: IdOrang[];
  /** Jangkar diri; undefined = belum dijawab, null = mengisi untuk orang lain. Tidak ikut dibagikan. */
  saya?: IdOrang | null;
  waktu?: Record<IdOrang, { wafat?: TanggalKira; lahir?: TanggalKira }>;
  peristiwa?: Peristiwa[];
  /** Orang di urutanWafat yang posisinya sudah dipastikan (berpasangan/diatur). Khusus UI. */
  urutanDijawab?: IdOrang[];
  belumPasti?: HalBelumPasti[];
}

export function kasusBaru(jenisKelaminPewaris: 'L' | 'P', jenisKasus: JenisKasus = 'nyata'): Kasus {
  return {
    versi: 4,
    jenisKasus,
    graf: {
      idPewaris: ID_PEWARIS,
      orang: { [ID_PEWARIS]: { id: ID_PEWARIS, jenisKelamin: jenisKelaminPewaris, statusHidup: 'wafat', agama: 'islam' } },
      pernikahan: [],
    },
    tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
    satuanPembulatan: 1n,
    urutanWafat: [],
  };
}

export const keJson = (kasus: Kasus): string =>
  JSON.stringify(kasus, (_kunci, nilai) => (typeof nilai === 'bigint' ? nilai.toString() : nilai));

/** Untuk dibagikan: jangkar diri (`saya`) tidak ikut, supaya penerima tidak melihat "ayahmu" (spec kanvas 5.8). */
export function keJsonDibagikan(kasus: Kasus): string {
  const { saya: _saya, ...tanpaSaya } = kasus;
  return keJson(tanpaSaya as Kasus);
}

export type KodeGalatKasus =
  | 'VERSI_TIDAK_DIKENAL' | 'SATUAN_PEMBULATAN_SALAH' | 'DATA_KEADAAN_RUSAK' | 'ORANG_WAFAT_DUA_KALI'
  | 'DAFTAR_WAFAT_ORANG_TIDAK_ADA' | 'PEWARIS_DI_DAFTAR_WAFAT' | 'PEWARIS_TIDAK_ADA' | 'DATA_PERNIKAHAN_RUSAK'
  | 'DATA_ORANG_RUSAK' | 'ORANG_TUA_TIDAK_ADA' | 'BAGIAN_RUSAK' | 'NILAI_BUKAN_BULAT' | 'JENIS_HARTA_TIDAK_DIKENAL'
  /** Bukan JSON atau galat tak terduga; `param.pesan` = pesan asli. */
  | 'TIDAK_BISA_DIBACA';

export class GalatKasus extends Error {
  constructor(readonly kode: KodeGalatKasus, readonly param: Readonly<Record<string, string>> = {}) { super(kode); }
}

export type HasilBacaKasus = { berhasil: true; kasus: Kasus } | { berhasil: false; galat: GalatKasus };

/** Teks berkas → Kasus tervalidasi, atau galat berkode. */
export function bacaBerkasKasus(teks: string): HasilBacaKasus {
  try {
    return { berhasil: true, kasus: bacaKasus(JSON.parse(teks)) };
  } catch (galat) {
    if (galat instanceof GalatKasus) return { berhasil: false, galat };
    return { berhasil: false, galat: new GalatKasus('TIDAK_BISA_DIBACA', { pesan: galat instanceof Error ? galat.message : '' }) };
  }
}

/** Satu tempat merapikan keadaan setelah graf berubah (dipanggil di UBAH_KASUS dan saat memuat file). */
export function rapikanKeadaan(kasus: Kasus): Kasus {
  const { graf } = kasus;
  const pewaris = graf.idPewaris;
  const ada = (id: IdOrang) => !!graf.orang[id];
  const orangNyata = (id: IdOrang) => { const orang = graf.orang[id]; return orang && !orang.penghubung ? orang : undefined; };
  const urutanWafat = kasus.urutanWafat.filter(id => orangNyata(id)?.statusHidup === 'hidup');
  const diUrutan = new Set(urutanWafat);

  const anggota = (kasus.gharqa?.anggota ?? []).filter(id => id === pewaris || (orangNyata(id)?.statusHidup === 'wafat' && !diUrutan.has(id)));
  const gharqa: GharqaKasus | undefined = kasus.gharqa && anggota.length >= 2 && anggota.includes(pewaris)
    ? { anggota, keadaan: kasus.gharqa.keadaan,
        tirkah: Object.fromEntries(Object.entries(kasus.gharqa.tirkah).filter(([id]) => anggota.includes(id) && id !== pewaris)) }
    : undefined;

  const wafatSesudahDibagi = (kasus.wafatSesudahDibagi ?? []).filter(id => orangNyata(id)?.statusHidup === 'hidup' && !diUrutan.has(id));
  const almarhum = new Set([pewaris, ...urutanWafat]);
  const dikandung = Object.entries(kasus.dikandungSetelahWafat ?? {}).filter(([anak, mayit]) => orangNyata(anak) && almarhum.has(mayit));
  const adaJanin = Object.values(graf.orang).some(orang => orang.statusHidup === 'dalamKandungan');

  // Field v4 (spec kanvas 9.1): rujukan ke orang yang sudah tidak ada dibuang.
  const saringKunci = <T>(isi: Record<IdOrang, T> | undefined) => isi && Object.fromEntries(Object.entries(isi).filter(([id]) => ada(id)));
  const kelompokDijawab = saringKunci(kasus.kelompokDijawab);
  const waktu = saringKunci(kasus.waktu);
  const belumDiisi = (kasus.belumDiisi ?? []).filter(ada);
  const saya = kasus.saya === null ? null : kasus.saya !== undefined && ada(kasus.saya) ? kasus.saya : undefined;
  const peristiwa = (kasus.peristiwa ?? []).filter(e => ada(e.idOrang) && almarhum.has(e.sesudahWafat) && (e.jenis === 'lahir' || ada(e.idPasangan)));
  const urutanDijawab = (kasus.urutanDijawab ?? []).filter(id => diUrutan.has(id));
  const belumPasti = (kasus.belumPasti ?? []).filter(h => (h.jenis === 'urutan' ? diUrutan.has(h.a) && diUrutan.has(h.b) : ada(h.anak) && almarhum.has(h.almarhum)));

  const {
    gharqa: _g, wafatSesudahDibagi: _w, dikandungSetelahWafat: _d, pilihanJanin: _p,
    kelompokDijawab: _kd, waktu: _wk, belumDiisi: _bd, saya: _s, peristiwa: _pe, urutanDijawab: _ud, belumPasti: _bp, ...inti
  } = kasus;
  return {
    ...inti,
    urutanWafat,
    ...(gharqa ? { gharqa } : {}),
    ...(wafatSesudahDibagi.length ? { wafatSesudahDibagi } : {}),
    ...(dikandung.length ? { dikandungSetelahWafat: Object.fromEntries(dikandung) } : {}),
    ...(adaJanin && kasus.pilihanJanin ? { pilihanJanin: kasus.pilihanJanin } : {}),
    ...(kelompokDijawab ? { kelompokDijawab } : {}),
    ...(waktu ? { waktu } : {}),
    ...(belumDiisi.length ? { belumDiisi } : {}),
    ...(saya !== undefined ? { saya } : {}),
    ...(peristiwa.length ? { peristiwa } : {}),
    ...(urutanDijawab.length ? { urutanDijawab } : {}),
    ...(belumPasti.length ? { belumPasti } : {}),
  };
}

// ─── Validasi file ────────────────────────────────────────────────────────────

function bacaKasus(data: unknown): Kasus {
  const objek = wajibObjek(data, 'kasus');
  // Versi 1/2 = versi 3 tanpa field keadaan, jadi dibaca dengan aturan yang sama; v1–v3 dimigrasi ke v4.
  if (![1, 2, 3, 4].includes(objek.versi as number)) throw new GalatKasus('VERSI_TIDAK_DIKENAL');
  const graf = bacaGraf(objek.graf);
  const tirkahMentah = wajibObjek(objek.tirkah, 'tirkah');
  const tirkah: InputTirkah = {
    kotor: bacaUang(tirkahMentah.kotor, 'harta'),
    tajhiz: bacaUang(tirkahMentah.tajhiz, 'biaya jenazah'),
    hutang: bacaUang(tirkahMentah.hutang, 'hutang'),
    wasiat: bacaUang(tirkahMentah.wasiat, 'wasiat'),
  };
  const satuanPembulatan = bacaUang(objek.satuanPembulatan, 'satuan pembulatan');
  if (!SATUAN_PEMBULATAN.includes(satuanPembulatan as 1n)) throw new GalatKasus('SATUAN_PEMBULATAN_SALAH');
  const urutanWafat = bacaUrutanWafat(objek.urutanWafat, graf);
  const rincianHarta = objek.rincianHarta === undefined ? undefined : bacaRincianHarta(objek.rincianHarta);
  const gharqa = objek.gharqa === undefined ? undefined : bacaGharqa(objek.gharqa, graf);
  const wafatSesudahDibagi = objek.wafatSesudahDibagi === undefined ? undefined : bacaDaftarOrang(objek.wafatSesudahDibagi, graf);
  const dikandungSetelahWafat = objek.dikandungSetelahWafat === undefined ? undefined
    : bacaDikandung(objek.dikandungSetelahWafat, graf, [graf.idPewaris, ...urutanWafat]);
  const pilihanJanin = objek.pilihanJanin;
  if (pilihanJanin !== undefined && pilihanJanin !== 'tunggu' && pilihanJanin !== 'hitungSekarang') throw new GalatKasus('DATA_KEADAAN_RUSAK');
  const tambahanV4 = objek.versi === 4 ? bacaTambahanV4(objek, graf) : migrasiKeV4(graf, urutanWafat);
  const semuaDaftar = [...urutanWafat, ...(gharqa?.anggota.filter(id => id !== graf.idPewaris) ?? []), ...(wafatSesudahDibagi ?? [])];
  if (new Set(semuaDaftar).size !== semuaDaftar.length) throw new GalatKasus('ORANG_WAFAT_DUA_KALI');
  if (objek.nama !== undefined && typeof objek.nama !== 'string') throw new GalatKasus('DATA_KEADAAN_RUSAK');
  const kasus: Kasus = {
    versi: 4, ...tambahanV4, graf, tirkah, satuanPembulatan, urutanWafat,
    ...(rincianHarta ? { rincianHarta } : {}), ...(gharqa ? { gharqa } : {}),
    ...(wafatSesudahDibagi ? { wafatSesudahDibagi } : {}), ...(dikandungSetelahWafat ? { dikandungSetelahWafat } : {}),
    ...(pilihanJanin ? { pilihanJanin } : {}), ...(objek.nama ? { nama: objek.nama } : {}),
  };
  return rapikanKeadaan(kasus);
}

/** Kasus v1–v3 (alur Babak): checklist lama menanyakan semua peran, jadi semua kelompok tiap almarhum dianggap dijawab. */
function migrasiKeV4(graf: GrafKeluarga, urutanWafat: IdOrang[]): Pick<Kasus, 'jenisKasus' | 'pintu' | 'kelompokDijawab'> {
  return {
    jenisKasus: 'nyata',
    pintu: urutanWafat.length ? 'lama' : 'baru',
    kelompokDijawab: Object.fromEntries([graf.idPewaris, ...urutanWafat].map(id => [id, [...KELOMPOK]])),
  };
}

function bacaTambahanV4(objek: Record<string, unknown>, graf: GrafKeluarga): Partial<Kasus> & { jenisKasus: JenisKasus } {
  const salah = () => new GalatKasus('DATA_KEADAAN_RUSAK');
  const adaDiGraf = (id: unknown): id is IdOrang => typeof id === 'string' && !!graf.orang[id];
  if (!JENIS_KASUS.includes(objek.jenisKasus as JenisKasus)) throw salah();
  const hasil: Partial<Kasus> & { jenisKasus: JenisKasus } = { jenisKasus: objek.jenisKasus as JenisKasus };
  if (objek.madzhab !== undefined) {
    if (!DAFTAR_RULESET.includes(objek.madzhab as Ruleset)) throw salah();
    hasil.madzhab = objek.madzhab as Ruleset;
  }
  if (objek.pintu !== undefined) {
    if (!PINTU.includes(objek.pintu as Pintu)) throw salah();
    hasil.pintu = objek.pintu as Pintu;
  }
  if (objek.kelompokDijawab !== undefined) {
    const isi = wajibObjek(objek.kelompokDijawab, 'kelompok dijawab');
    for (const [id, daftar] of Object.entries(isi)) {
      if (!adaDiGraf(id) || !Array.isArray(daftar) || !daftar.every(k => KELOMPOK.includes(k as Kelompok))) throw salah();
    }
    hasil.kelompokDijawab = isi as Record<IdOrang, Kelompok[]>;
  }
  if (objek.belumDiisi !== undefined) hasil.belumDiisi = bacaDaftarOrang(objek.belumDiisi, graf);
  if (objek.urutanDijawab !== undefined) hasil.urutanDijawab = bacaDaftarOrang(objek.urutanDijawab, graf);
  if (objek.saya !== undefined) {
    if (objek.saya !== null && !adaDiGraf(objek.saya)) throw salah();
    hasil.saya = objek.saya as IdOrang | null;
  }
  if (objek.waktu !== undefined) {
    const isi = wajibObjek(objek.waktu, 'waktu');
    const waktu: NonNullable<Kasus['waktu']> = {};
    for (const [id, mentah] of Object.entries(isi)) {
      if (!adaDiGraf(id)) throw salah();
      const w = wajibObjek(mentah, 'waktu orang');
      waktu[id] = {
        ...(w.wafat !== undefined ? { wafat: bacaTanggalKira(w.wafat) } : {}),
        ...(w.lahir !== undefined ? { lahir: bacaTanggalKira(w.lahir) } : {}),
      };
    }
    hasil.waktu = waktu;
  }
  if (objek.peristiwa !== undefined) {
    if (!Array.isArray(objek.peristiwa)) throw salah();
    hasil.peristiwa = objek.peristiwa.map(mentah => {
      const e = wajibObjek(mentah, 'peristiwa');
      if (!adaDiGraf(e.idOrang) || !adaDiGraf(e.sesudahWafat)) throw salah();
      if (e.jenis === 'lahir') return { jenis: 'lahir', idOrang: e.idOrang, sesudahWafat: e.sesudahWafat } as Peristiwa;
      if ((e.jenis !== 'nikah' && e.jenis !== 'cerai') || !adaDiGraf(e.idPasangan) || e.idPasangan === e.idOrang) throw salah();
      return { jenis: e.jenis, idOrang: e.idOrang, idPasangan: e.idPasangan, sesudahWafat: e.sesudahWafat } as Peristiwa;
    });
  }
  if (objek.belumPasti !== undefined) {
    if (!Array.isArray(objek.belumPasti)) throw salah();
    hasil.belumPasti = objek.belumPasti.map(mentah => {
      const h = wajibObjek(mentah, 'belum pasti');
      if (h.jenis === 'urutan' && adaDiGraf(h.a) && adaDiGraf(h.b) && typeof h.bersamaan === 'boolean') return { jenis: 'urutan', a: h.a, b: h.b, bersamaan: h.bersamaan } as HalBelumPasti;
      if (h.jenis === 'lahir' && adaDiGraf(h.anak) && adaDiGraf(h.almarhum)) return { jenis: 'lahir', anak: h.anak, almarhum: h.almarhum } as HalBelumPasti;
      throw salah();
    });
  }
  return hasil;
}

function bacaTanggalKira(nilai: unknown): TanggalKira {
  const salah = new GalatKasus('DATA_KEADAAN_RUSAK');
  const o = wajibObjek(nilai, 'tanggal');
  const bulat = (x: unknown, min: number, maks: number) => Number.isInteger(x) && (x as number) >= min && (x as number) <= maks;
  if (!bulat(o.tahun, 1, 9999) || typeof o.kiraKira !== 'boolean') throw salah;
  if (o.bulan !== undefined && !bulat(o.bulan, 1, 12)) throw salah;
  if (o.hari !== undefined && !bulat(o.hari, 1, 31)) throw salah;
  return { tahun: o.tahun as number, kiraKira: o.kiraKira, ...(o.bulan !== undefined ? { bulan: o.bulan as number } : {}), ...(o.hari !== undefined ? { hari: o.hari as number } : {}) };
}

function bacaGharqa(nilai: unknown, graf: GrafKeluarga): GharqaKasus {
  const objek = wajibObjek(nilai, 'wafat bersamaan');
  const salah = new GalatKasus('DATA_KEADAAN_RUSAK');
  const anggota = bacaDaftarOrang(objek.anggota, graf);
  if (!anggota.includes(graf.idPewaris) || anggota.length < 2) throw salah;
  if (anggota.some(id => id !== graf.idPewaris && graf.orang[id]!.statusHidup !== 'wafat')) throw salah;
  if (!KEADAAN_GHARQA.includes(objek.keadaan as KeadaanGharqa)) throw salah;
  const tirkahMentah = wajibObjek(objek.tirkah, 'harta wafat bersamaan');
  const tirkah: Record<IdOrang, InputTirkah> = {};
  for (const [id, isi] of Object.entries(tirkahMentah)) {
    if (!anggota.includes(id)) throw salah;
    const harta = wajibObjek(isi, 'harta');
    tirkah[id] = { kotor: bacaUang(harta.kotor, 'harta'), tajhiz: bacaUang(harta.tajhiz, 'biaya jenazah'), hutang: bacaUang(harta.hutang, 'hutang'), wasiat: bacaUang(harta.wasiat, 'wasiat') };
  }
  return { anggota, keadaan: objek.keadaan as KeadaanGharqa, tirkah };
}

function bacaDaftarOrang(nilai: unknown, graf: GrafKeluarga): IdOrang[] {
  if (!Array.isArray(nilai) || !nilai.every(id => typeof id === 'string' && graf.orang[id])) throw new GalatKasus('DAFTAR_WAFAT_ORANG_TIDAK_ADA');
  return nilai as IdOrang[];
}

function bacaDikandung(nilai: unknown, graf: GrafKeluarga, almarhum: IdOrang[]): Record<IdOrang, IdOrang> {
  const objek = wajibObjek(nilai, 'anak yang lahir belakangan');
  for (const [anak, mayit] of Object.entries(objek)) {
    if (!graf.orang[anak] || typeof mayit !== 'string' || !almarhum.includes(mayit)) throw new GalatKasus('DATA_KEADAAN_RUSAK');
  }
  return objek as Record<IdOrang, IdOrang>;
}

function bacaUrutanWafat(nilai: unknown, graf: GrafKeluarga): IdOrang[] {
  const salah = new GalatKasus('DAFTAR_WAFAT_ORANG_TIDAK_ADA');
  if (!Array.isArray(nilai) || !nilai.every(id => typeof id === 'string' && graf.orang[id])) throw salah;
  if (nilai.includes(graf.idPewaris)) throw new GalatKasus('PEWARIS_DI_DAFTAR_WAFAT');
  if (new Set(nilai).size !== nilai.length) throw new GalatKasus('ORANG_WAFAT_DUA_KALI');
  return nilai as IdOrang[];
}

function bacaRincianHarta(nilai: unknown): Partial<Record<KategoriHarta, bigint>> {
  const objek = wajibObjek(nilai, 'rincian harta');
  const rincian: Partial<Record<KategoriHarta, bigint>> = {};
  for (const [kategori, jumlah] of Object.entries(objek)) {
    if (!KATEGORI_HARTA.includes(kategori as KategoriHarta)) throw new GalatKasus('JENIS_HARTA_TIDAK_DIKENAL', { kategori });
    rincian[kategori as KategoriHarta] = bacaUang(jumlah, `harta ${kategori}`);
  }
  return rincian;
}

function bacaGraf(data: unknown): GrafKeluarga {
  const objek = wajibObjek(data, 'graf');
  const orangMentah = wajibObjek(objek.orang, 'daftar orang');
  const orang: Record<IdOrang, Orang> = {};
  for (const [id, isi] of Object.entries(orangMentah)) orang[id] = bacaOrang(id, isi);
  for (const orangIni of Object.values(orang)) {
    for (const idOrangTua of [orangIni.idAyah, orangIni.idIbu]) {
      if (idOrangTua !== undefined && !orang[idOrangTua]) throw new GalatKasus('ORANG_TUA_TIDAK_ADA', { id: idOrangTua });
    }
  }
  if (typeof objek.idPewaris !== 'string' || !orang[objek.idPewaris]) throw new GalatKasus('PEWARIS_TIDAK_ADA');
  if (!Array.isArray(objek.pernikahan)) throw new GalatKasus('DATA_PERNIKAHAN_RUSAK');
  const pernikahan = objek.pernikahan.map(isi => bacaPernikahan(isi, orang));
  return { idPewaris: objek.idPewaris, orang, pernikahan };
}

function bacaOrang(id: string, data: unknown): Orang {
  const objek = wajibObjek(data, `orang ${id}`);
  const salah = () => new GalatKasus('DATA_ORANG_RUSAK', { id });
  if (objek.id !== id) throw salah();
  if (objek.jenisKelamin !== 'L' && objek.jenisKelamin !== 'P') throw salah();
  if (!STATUS_HIDUP.includes(objek.statusHidup as Orang['statusHidup'])) throw salah();
  if (!['islam', 'nonIslam', 'tidakDiketahui'].includes(objek.agama as string)) throw salah();
  for (const kunci of ['idAyah', 'idIbu', 'nama'] as const) {
    if (objek[kunci] !== undefined && typeof objek[kunci] !== 'string') throw salah();
  }
  if (objek.khuntsa !== undefined && !KHUNTSA.includes(objek.khuntsa as never)) throw salah();
  for (const kunci of ['membunuhPewaris', 'penghubung'] as const) {
    if (objek[kunci] !== undefined && typeof objek[kunci] !== 'boolean') throw salah();
  }
  return objek as unknown as Orang;
}

function bacaPernikahan(data: unknown, orang: Record<IdOrang, Orang>): Pernikahan {
  const objek = wajibObjek(data, 'pernikahan');
  const statusSah = ['utuh', 'talakRajiIddah', 'talakBain'];
  if (typeof objek.idSuami !== 'string' || typeof objek.idIstri !== 'string' || !orang[objek.idSuami] || !orang[objek.idIstri]
    || !statusSah.includes(objek.status as string)) {
    throw new GalatKasus('DATA_PERNIKAHAN_RUSAK');
  }
  return objek as unknown as Pernikahan;
}

function bacaUang(nilai: unknown, nama: string): bigint {
  if (typeof nilai !== 'string' || !/^\d+$/.test(nilai)) throw new GalatKasus('NILAI_BUKAN_BULAT', { nama });
  return BigInt(nilai);
}

function wajibObjek(nilai: unknown, nama: string): Record<string, unknown> {
  if (typeof nilai !== 'object' || nilai === null || Array.isArray(nilai)) throw new GalatKasus('BAGIAN_RUSAK', { nama });
  return nilai as Record<string, unknown>;
}
