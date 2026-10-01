// Kasus = satu-satunya state yang disimpan (localStorage & file JSON).
// Menerima isian wizard; menyerahkan Kasus ke jalankan.ts. File import adalah batas kepercayaan:
// bentuknya divalidasi penuh sebelum dipakai, bigint disimpan sebagai string digit.

import { t } from './terjemah';
import { DAFTAR_RULESET, type GrafKeluarga, type IdOrang, type InputTirkah, type KeadaanGharqa, type Orang, type Pernikahan, type Ruleset } from '@waris/engine';

export const SATUAN_PEMBULATAN = [1n, 100n, 1000n] as const;
// Rincian harta hanya alat bantu mengisi total; engine tetap menerima `tirkah.kotor`.
export const KATEGORI_HARTA = ['tabungan', 'properti', 'kendaraan', 'emas', 'piutang', 'lainnya'] as const;
export type KategoriHarta = typeof KATEGORI_HARTA[number];
const KUNCI_PENYIMPANAN = 'arif-waris:kasus';
const ID_PEWARIS = 'PEWARIS';
const KEADAAN_GHARQA: KeadaanGharqa[] = ['serentak', 'terlupakan', 'berurutanTakDiketahui', 'tidakDiketahui'];
const STATUS_HIDUP: Orang['statusHidup'][] = ['hidup', 'wafat', 'tidakDiketahui', 'dalamKandungan', 'mafqud'];
const KHUNTSA: NonNullable<Orang['khuntsa']>[] = ['diharapkanJelas', 'tidakDiharapkanJelas'];

export interface GharqaKasus { anggota: IdOrang[]; keadaan: KeadaanGharqa; tirkah: Record<IdOrang, InputTirkah> }

export interface Kasus {
  versi: 3;
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
  pilihanJanin?: 'tunggu' | 'hitungSekarang';
  /** Nama kasus dari pengguna (langkah Periksa); kosong = dinamai otomatis dari ringkasan. */
  nama?: string;
  /** Madzhab penghitung; kosong = Syafi'i (bawaan, satu-satunya yang diperiksa sampai teks primer). */
  ruleset?: Ruleset;
  /** Jawaban "tidak tahu" yang disimpan apa adanya (spec 10-01 bag. 3); sumber kemungkinan yang dihitung berdampingan di Hasil. */
  belumPasti?: HalBelumPasti[];
}

/** Dua orang yang sama-sama wafat sesudah pewaris, tetapi urutan wafatnya tidak diketahui; `urutanWafat` memuat salah satu urutan. */
export type HalBelumPasti = { jenis: 'urutan'; a: IdOrang; b: IdOrang };

export function kasusBaru(jenisKelaminPewaris: 'L' | 'P'): Kasus {
  return {
    versi: 3,
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

export function dariJson(teks: string): { berhasil: true; kasus: Kasus } | { berhasil: false; pesan: string } {
  try {
    return { berhasil: true, kasus: bacaKasus(JSON.parse(teks)) };
  } catch (galat) {
    return { berhasil: false, pesan: galat instanceof Error ? galat.message : t('hitung.file_tidak_bisa_dibaca') };
  }
}

/** Satu tempat merapikan keadaan setelah graf berubah (dipanggil di UBAH_KASUS dan saat memuat file). */
export function rapikanKeadaan(kasus: Kasus): Kasus {
  const { graf } = kasus;
  const pewaris = graf.idPewaris;
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

  // Hal belum pasti hanya bermakna selama kedua orangnya masih ada di urutan wafat.
  const belumPasti = (kasus.belumPasti ?? []).filter(hal => diUrutan.has(hal.a) && diUrutan.has(hal.b) && hal.a !== hal.b);

  const { gharqa: _g, wafatSesudahDibagi: _w, dikandungSetelahWafat: _d, pilihanJanin: _p, belumPasti: _b, ...inti } = kasus;
  return {
    ...inti,
    urutanWafat,
    ...(belumPasti.length ? { belumPasti } : {}),
    ...(gharqa ? { gharqa } : {}),
    ...(wafatSesudahDibagi.length ? { wafatSesudahDibagi } : {}),
    ...(dikandung.length ? { dikandungSetelahWafat: Object.fromEntries(dikandung) } : {}),
    ...(adaJanin && kasus.pilihanJanin ? { pilihanJanin: kasus.pilihanJanin } : {}),
  };
}

export function simpanLokal(kasus: Kasus | null): void {
  try {
    if (kasus) localStorage.setItem(KUNCI_PENYIMPANAN, keJson(kasus));
    else localStorage.removeItem(KUNCI_PENYIMPANAN);
  } catch {
    // Mode privat / penyimpanan penuh: aplikasi tetap jalan tanpa autosave.
  }
}

export function muatLokal(): Kasus | null {
  try {
    const teks = localStorage.getItem(KUNCI_PENYIMPANAN);
    if (!teks) return null;
    const hasil = dariJson(teks);
    return hasil.berhasil ? hasil.kasus : null;
  } catch {
    return null;
  }
}

// ─── Validasi file ────────────────────────────────────────────────────────────

function bacaKasus(data: unknown): Kasus {
  const objek = wajibObjek(data, 'kasus');
  // Versi 1/2 = versi 3 tanpa field keadaan, jadi dibaca dengan aturan yang sama.
  if (![1, 2, 3].includes(objek.versi as number)) throw new Error(t('hitung.versi_file_tidak_dikenal'));
  const graf = bacaGraf(objek.graf);
  const tirkahMentah = wajibObjek(objek.tirkah, 'tirkah');
  const tirkah: InputTirkah = {
    kotor: bacaUang(tirkahMentah.kotor, 'harta'),
    tajhiz: bacaUang(tirkahMentah.tajhiz, 'biaya jenazah'),
    hutang: bacaUang(tirkahMentah.hutang, 'hutang'),
    wasiat: bacaUang(tirkahMentah.wasiat, 'wasiat'),
  };
  const satuanPembulatan = bacaUang(objek.satuanPembulatan, 'satuan pembulatan');
  if (!SATUAN_PEMBULATAN.includes(satuanPembulatan as 1n)) throw new Error(t('hitung.satuan_pembulatan_harus_1_100_1000'));
  const urutanWafat = bacaUrutanWafat(objek.urutanWafat, graf);
  const rincianHarta = objek.rincianHarta === undefined ? undefined : bacaRincianHarta(objek.rincianHarta);
  const gharqa = objek.gharqa === undefined ? undefined : bacaGharqa(objek.gharqa, graf);
  const wafatSesudahDibagi = objek.wafatSesudahDibagi === undefined ? undefined : bacaDaftarOrang(objek.wafatSesudahDibagi, graf);
  const dikandungSetelahWafat = objek.dikandungSetelahWafat === undefined ? undefined
    : bacaDikandung(objek.dikandungSetelahWafat, graf, [graf.idPewaris, ...urutanWafat]);
  const pilihanJanin = objek.pilihanJanin;
  if (pilihanJanin !== undefined && pilihanJanin !== 'tunggu' && pilihanJanin !== 'hitungSekarang') throw new Error(t('hitung.data_keadaan_rusak'));
  const semuaDaftar = [...urutanWafat, ...(gharqa?.anggota.filter(id => id !== graf.idPewaris) ?? []), ...(wafatSesudahDibagi ?? [])];
  if (new Set(semuaDaftar).size !== semuaDaftar.length) throw new Error(t('hitung.orang_tercatat_wafat_dua_kali'));
  if (objek.nama !== undefined && typeof objek.nama !== 'string') throw new Error(t('hitung.data_keadaan_rusak'));
  if (objek.ruleset !== undefined && !DAFTAR_RULESET.includes(objek.ruleset as Ruleset)) throw new Error(t('hitung.madzhab_file_tidak_dikenal'));
  const ruleset = objek.ruleset as Ruleset | undefined;
  const belumPasti = objek.belumPasti === undefined ? undefined : bacaBelumPasti(objek.belumPasti, urutanWafat);
  const kasus: Kasus = {
    versi: 3, graf, tirkah, satuanPembulatan, urutanWafat,
    ...(rincianHarta ? { rincianHarta } : {}), ...(gharqa ? { gharqa } : {}),
    ...(wafatSesudahDibagi ? { wafatSesudahDibagi } : {}), ...(dikandungSetelahWafat ? { dikandungSetelahWafat } : {}),
    ...(pilihanJanin ? { pilihanJanin } : {}), ...(objek.nama ? { nama: objek.nama } : {}),
    ...(ruleset && ruleset !== 'syafii' ? { ruleset } : {}),
    ...(belumPasti?.length ? { belumPasti } : {}),
  };
  return rapikanKeadaan(kasus);
}

function bacaBelumPasti(nilai: unknown, urutanWafat: IdOrang[]): HalBelumPasti[] {
  const salah = new Error(t('hitung.data_keadaan_rusak'));
  if (!Array.isArray(nilai)) throw salah;
  return nilai.map((isi): HalBelumPasti => {
    const hal = wajibObjek(isi, 'hal belum pasti');
    if (hal.jenis !== 'urutan' || typeof hal.a !== 'string' || typeof hal.b !== 'string' || !urutanWafat.includes(hal.a) || !urutanWafat.includes(hal.b) || hal.a === hal.b) throw salah;
    return { jenis: 'urutan', a: hal.a, b: hal.b };
  });
}

function bacaGharqa(nilai: unknown, graf: GrafKeluarga): GharqaKasus {
  const objek = wajibObjek(nilai, 'wafat bersamaan');
  const salah = new Error(t('hitung.data_keadaan_rusak'));
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
  if (!Array.isArray(nilai) || !nilai.every(id => typeof id === 'string' && graf.orang[id])) throw new Error(t('hitung.daftar_wafat_berisi_orang_tidak_ada'));
  return nilai as IdOrang[];
}

function bacaDikandung(nilai: unknown, graf: GrafKeluarga, almarhum: IdOrang[]): Record<IdOrang, IdOrang> {
  const objek = wajibObjek(nilai, 'anak yang lahir belakangan');
  for (const [anak, mayit] of Object.entries(objek)) {
    if (!graf.orang[anak] || typeof mayit !== 'string' || !almarhum.includes(mayit)) throw new Error(t('hitung.data_keadaan_rusak'));
  }
  return objek as Record<IdOrang, IdOrang>;
}

function bacaUrutanWafat(nilai: unknown, graf: GrafKeluarga): IdOrang[] {
  const salah = new Error(t('hitung.daftar_wafat_berisi_orang_tidak_ada'));
  if (!Array.isArray(nilai) || !nilai.every(id => typeof id === 'string' && graf.orang[id])) throw salah;
  if (nilai.includes(graf.idPewaris)) throw new Error(t('hitung.pewaris_tidak_boleh_di_daftar_wafat'));
  if (new Set(nilai).size !== nilai.length) throw new Error(t('hitung.orang_tercatat_wafat_dua_kali'));
  return nilai as IdOrang[];
}

function bacaRincianHarta(nilai: unknown): Partial<Record<KategoriHarta, bigint>> {
  const objek = wajibObjek(nilai, 'rincian harta');
  const rincian: Partial<Record<KategoriHarta, bigint>> = {};
  for (const [kategori, jumlah] of Object.entries(objek)) {
    if (!KATEGORI_HARTA.includes(kategori as KategoriHarta)) throw new Error(`Jenis harta "${kategori}" tidak dikenal.`);
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
      if (idOrangTua !== undefined && !orang[idOrangTua]) throw new Error(`Orang tua ${idOrangTua} tidak ada di file.`);
    }
  }
  if (typeof objek.idPewaris !== 'string' || !orang[objek.idPewaris]) throw new Error(t('hitung.pewaris_tidak_ada_di_file'));
  if (!Array.isArray(objek.pernikahan)) throw new Error(t('hitung.data_pernikahan_rusak'));
  const pernikahan = objek.pernikahan.map(isi => bacaPernikahan(isi, orang));
  return { idPewaris: objek.idPewaris, orang, pernikahan };
}

function bacaOrang(id: string, data: unknown): Orang {
  const objek = wajibObjek(data, `orang ${id}`);
  const salah = () => new Error(t('hitung.data_orang_rusak', { id }));
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
    throw new Error(t('hitung.data_pernikahan_rusak'));
  }
  return objek as unknown as Pernikahan;
}

function bacaUang(nilai: unknown, nama: string): bigint {
  if (typeof nilai !== 'string' || !/^\d+$/.test(nilai)) throw new Error(`Nilai ${nama} harus angka bulat tidak negatif.`);
  return BigInt(nilai);
}

function wajibObjek(nilai: unknown, nama: string): Record<string, unknown> {
  if (typeof nilai !== 'object' || nilai === null || Array.isArray(nilai)) throw new Error(`Bagian ${nama} rusak.`);
  return nilai as Record<string, unknown>;
}
