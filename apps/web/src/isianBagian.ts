// Jawaban per bagian wawancara keluarga (spec kanvas 5.2–5.4, 5.8). Menerima Kasus + bagian; menyerahkan Kasus baru.
// Ya/Tidak, penghitung "+/−", baris tetap (orang tua, kakek-nenek), dan bagian Kamu. Aturan fikih tidak ada di sini:
// keadaan orang lewat keadaanBaris, siapa yang ditanya lewat kelompok/ujiHipotetis.

import type { GrafKeluarga, IdOrang, KunciAhliWaris, Orang } from '@waris/engine';
import { daftarInduk, hapusAhliWaris, hitungIsian, tambahAhliWaris, ubahOrang } from './checklist';
import { rapikanKeadaan, type Kasus, type Kelompok } from './kasus';
import { keadaanTerpilih, pilihKeadaan, tandaiBelumDiisi, type PilihanKeadaan } from './keadaanBaris';
import { orangTerputus } from './keadaanOrang';
import { anggotaBagian, daftarBagian, kunciBagian, orangDenganKunci, slotTetap, type Bagian } from './kelompok';

export { kunciBagian, orangDenganKunci, slotTetap };

/** Menghapus anggota bagian ini ikut menghapus keturunannya dan menantunya (cabang); pasangan tidak: anak tetap ada. */
const BAGIAN_BERCABANG: Kelompok[] = ['anak', 'saudara', 'jauh'];
const BAGIAN_TETAP: Kelompok[] = ['orangTua', 'kakekNenek'];
const BAGIAN_YA_TIDAK: Kelompok[] = ['pasangan', 'anak', 'saudara', 'jauh'];

export const adalahBagianTetap = (bagian: Bagian): boolean => BAGIAN_TETAP.some(jenis => jenis === bagian.jenis);

export function jawabAdaTidak(kasus: Kasus, bagian: Bagian, ada: boolean): Kasus {
  const jenis = jenisKelompok(bagian);
  if (!jenis) return kasus;
  // "Ya" tanpa anggota belum jawaban: bagian terbuka lagi sampai baris pertama ditambah.
  if (ada) return anggotaBagian(kasus, bagian).length ? kasus : tandaiDijawab(kasus, bagian.milik, jenis, false);
  return tandaiDijawab(hapusAnggota(kasus, bagian), bagian.milik, jenis, true);
}

/** Orang (bukan penghubung) yang akan hilang atau menjadi penghubung bila "Tidak" dipilih; untuk konfirmasi dampak. */
export function dampakAdaKeTidak(kasus: Kasus, bagian: Bagian): IdOrang[] {
  return orangYangHilang(kasus, hapusAnggota(kasus, bagian));
}

export function orangYangHilang(sebelum: Kasus, sesudah: Kasus): IdOrang[] {
  return Object.keys(sebelum.graf.orang).filter(id =>
    !sebelum.graf.orang[id]!.penghubung && (!sesudah.graf.orang[id] || sesudah.graf.orang[id]!.penghubung));
}

export function tambahBaris(kasus: Kasus, bagian: Bagian, kunci: KunciAhliWaris, opsi: { idInduk?: IdOrang } = {}): Kasus {
  const graf = tambahAhliWaris(kasus.graf, bagian.milik, kunci, opsi);
  const id = orangBaruDi(kasus.graf, graf);
  const denganOrang = { ...kasus, graf };
  const jenis = jenisKelompok(bagian);
  if (!id || !jenis) return denganOrang;
  // Baris pertama berarti jawabannya "Ya"; keadaannya belum dipilih, jadi baris menahan lanjut.
  return tandaiDijawab(tandaiBelumDiisi(denganOrang, id, true), bagian.milik, jenis, true);
}

/** Membuang baris kosong terakhir (tanpa nama dan tanpa keadaan); null bila tidak ada yang kosong. */
export function kurangiBarisKosong(kasus: Kasus, bagian: Bagian, kunci: KunciAhliWaris): Kasus | null {
  const jenis = jenisKelompok(bagian);
  const sasaran = hitungIsian(kasus.graf, bagian.milik)[kunci]?.filter(id => adalahBarisKosong(kasus, id)).at(-1);
  if (!sasaran || !jenis) return null;
  const tanpa = tandaiBelumDiisi(rapikanKeadaan({ ...kasus, graf: hapusAhliWaris(kasus.graf, sasaran) }), sasaran, false);
  return anggotaBagian(tanpa, bagian).length ? tanpa : tandaiDijawab(tanpa, bagian.milik, jenis, false);
}

export function hapusBaris(kasus: Kasus, id: IdOrang): Kasus {
  const sesudah = hapusBiasa(kasus, [id]);
  // Bagian yang jadi kosong kembali belum dijawab, sama dengan kurangiBarisKosong; "Tidak" harus pilihan sadar.
  return daftarBagian(kasus).filter(bagian => BAGIAN_YA_TIDAK.some(jenis => jenis === bagian.jenis) && anggotaBagian(kasus, bagian).includes(id))
    .reduce((hasil, bagian) => (anggotaBagian(hasil, bagian).length ? hasil : tandaiDijawab(hasil, bagian.milik, bagian.jenis as Kelompok, false)), sesudah);
}

/** Pilih keadaan satu baris tetap (Ayah, Ibu, kakek, nenek); orangnya dibuat bila belum ada. Bagian dijawab bila semua baris terpilih. */
export function isiBarisTetap(kasus: Kasus, bagian: Bagian, kunci: KunciAhliWaris, pilihan: PilihanKeadaan): Kasus {
  const jenis = jenisKelompok(bagian);
  let id = orangDenganKunci(kasus, bagian.milik, kunci)[0];
  let basis = kasus;
  if (!id) {
    // Posisi yang pernah dihapus tinggal penghubung (pemilik masih menunjuknya): dipakai ulang, bukan dibuat baru.
    const penghubung = daftarInduk(kasus.graf, bagian.milik, kunci)[0];
    const graf = penghubung ? ubahOrang(kasus.graf, penghubung, { penghubung: false, statusHidup: 'hidup' }) : tambahAhliWaris(kasus.graf, bagian.milik, kunci);
    id = penghubung ?? orangBaruDi(kasus.graf, graf);
    if (!id) return kasus;
    basis = tandaiBelumDiisi({ ...kasus, graf }, id, true);
  }
  const hasil = pilihKeadaan(basis, id, pilihan, bagian.milik);
  return jenis ? tandaiDijawab(hasil, bagian.milik, jenis, semuaSlotTerpilih(hasil, bagian)) : hasil;
}

/** Anak pewaris yang bukan penghubung; yang dipilih sebagai "juga anak pemilik cabang" ditandai lewat orang tua yang sama. */
const anakPewaris = (kasus: Kasus): IdOrang[] =>
  Object.values(kasus.graf.orang).filter(orang => !orang.penghubung && (orang.idAyah === kasus.graf.idPewaris || orang.idIbu === kasus.graf.idPewaris)).map(orang => orang.id);
/** Slot orang tua anak yang dipegang pemilik cabang: ayah bila pemilik laki-laki, selain itu ibu. */
const slotOrangTua = (kasus: Kasus, milik: IdOrang): 'idAyah' | 'idIbu' => (kasus.graf.orang[milik]?.jenisKelamin === 'L' ? 'idAyah' : 'idIbu');

/** "Ya, semuanya": semua anak pewaris menjadi anak pemilik cabang, kecuali yang slotnya sudah diisi orang tua lain. */
export function jawabAnakBersama(kasus: Kasus, bagian: Bagian, semua: boolean): Kasus {
  const slot = slotOrangTua(kasus, bagian.milik);
  const graf = semua
    ? anakPewaris(kasus).reduce((g, id) => (g.orang[id]![slot] ? g : ubahOrang(g, id, { [slot]: bagian.milik })), kasus.graf)
    : kasus.graf;
  return tandaiDijawab({ ...kasus, graf }, bagian.milik, 'anakBersama', true);
}

/** "Tidak semua": satu anak dicentang (anak pemilik cabang) atau dicabut. */
export function tandaiAnakBersama(kasus: Kasus, bagian: Bagian, idAnak: IdOrang, bersama: boolean): Kasus {
  const slot = slotOrangTua(kasus, bagian.milik);
  const { [slot]: _lama, ...tanpaSlot } = kasus.graf.orang[idAnak]!;
  const orang = bersama ? { ...tanpaSlot, [slot]: bagian.milik } : tanpaSlot;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [idAnak]: orang } } };
}

export const daftarAnakPewaris = anakPewaris;

/** Orang yang masih hidup sekarang (bukan almarhum, bukan yang wafat sesudahnya, bukan baris kosong). */
export function calonKamu(kasus: Kasus): IdOrang[] {
  return Object.keys(kasus.graf.orang).filter(id => {
    if (id === kasus.graf.idPewaris || kasus.graf.orang[id]!.penghubung) return false;
    const keadaan = keadaanTerpilih(kasus, id);
    return keadaan === 'hidup' || keadaan === 'bercerai';
  });
}

/** `null` = mengisi untuk orang lain; keduanya jawaban sah. */
export function jawabKamu(kasus: Kasus, id: IdOrang | null): Kasus {
  return { ...kasus, saya: id };
}

/** Catat atau cabut jawaban satu bagian; entri kosong ikut dibuang supaya Kasus tidak menyimpan sisa. */
export function tandaiDijawab(kasus: Kasus, milik: IdOrang, jenis: Kelompok, dijawab: boolean): Kasus {
  const sekarang = kasus.kelompokDijawab?.[milik] ?? [];
  const daftar = dijawab ? [...new Set([...sekarang, jenis])] : sekarang.filter(lain => lain !== jenis);
  const { [milik]: _lama, ...lainnya } = kasus.kelompokDijawab ?? {};
  const peta = daftar.length ? { ...lainnya, [milik]: daftar } : lainnya;
  const { kelompokDijawab: _peta, ...inti } = kasus;
  return Object.keys(peta).length ? { ...inti, kelompokDijawab: peta } : inti;
}

function jenisKelompok(bagian: Bagian): Kelompok | null {
  return bagian.jenis === 'urutan' || bagian.jenis === 'kamu' ? null : bagian.jenis;
}

const orangBaruDi = (sebelum: GrafKeluarga, sesudah: GrafKeluarga): IdOrang | undefined =>
  Object.keys(sesudah.orang).find(id => !sebelum.orang[id] && !sesudah.orang[id]!.penghubung);

const adalahBarisKosong = (kasus: Kasus, id: IdOrang): boolean =>
  (kasus.belumDiisi ?? []).includes(id) && !kasus.graf.orang[id]?.nama && keadaanTerpilih(kasus, id) === null;

function semuaSlotTerpilih(kasus: Kasus, bagian: Bagian): boolean {
  return slotTetap(kasus, bagian).every(kunci => {
    const id = orangDenganKunci(kasus, bagian.milik, kunci)[0];
    return !!id && keadaanTerpilih(kasus, id) !== null;
  });
}

/** Anggota bagian yang dihapus bila "Tidak": semua orang di bagian itu, termasuk yang wafat dan penghubung. */
function hapusAnggota(kasus: Kasus, bagian: Bagian): Kasus {
  const jenis = jenisKelompok(bagian);
  if (!jenis) return kasus;
  const { graf } = kasus;
  const awal = jenis === 'anak'
    ? Object.values(graf.orang).filter(orang => orang.idAyah === bagian.milik || orang.idIbu === bagian.milik).map(orang => orang.id)
    : kunciBagian(kasus, bagian).flatMap(kunci => daftarInduk(graf, bagian.milik, kunci));
  if (awal.length === 0) return kasus;
  return BAGIAN_BERCABANG.includes(jenis) ? buangOrang(kasus, cabangDari(graf, awal, bagian.milik)) : hapusBiasa(kasus, awal);
}

/** Awal + seluruh keturunannya + menantu yang semua anaknya ikut terhapus. Pewaris dan pemilik bagian tidak pernah ikut. */
function cabangDari(graf: GrafKeluarga, awal: IdOrang[], milik: IdOrang): IdOrang[] {
  const anakDari = (id: IdOrang) => Object.values(graf.orang).filter(orang => orang.idAyah === id || orang.idIbu === id).map(orang => orang.id);
  const pasanganDari = (id: IdOrang) => graf.pernikahan.flatMap(nikah => (nikah.idSuami === id ? [nikah.idIstri] : nikah.idIstri === id ? [nikah.idSuami] : []));
  const dalam = new Set(awal);
  const antre = [...awal];
  while (antre.length > 0) {
    for (const anak of anakDari(antre.shift()!)) if (!dalam.has(anak)) { dalam.add(anak); antre.push(anak); }
  }
  for (const id of [...dalam]) {
    for (const pasangan of pasanganDari(id)) {
      if (pasangan === graf.idPewaris || pasangan === milik || dalam.has(pasangan)) continue;
      if (anakDari(pasangan).every(anak => dalam.has(anak))) dalam.add(pasangan);
    }
  }
  return [...dalam];
}

function buangOrang(kasus: Kasus, ids: IdOrang[]): Kasus {
  const buang = new Set(ids);
  const orang = Object.fromEntries(Object.entries(kasus.graf.orang).filter(([id]) => !buang.has(id)));
  const pernikahan = kasus.graf.pernikahan.filter(nikah => !buang.has(nikah.idSuami) && !buang.has(nikah.idIstri));
  const rapi = rapikanKeadaan({ ...kasus, graf: { ...kasus.graf, orang, pernikahan } });
  const tanpaTerputus = orangTerputus(kasus, rapi).reduce((k, id) => ({ ...k, graf: hapusAhliWaris(k.graf, id) }), rapi);
  return buangPenghubungYatim(tanpaTerputus);
}

/** Penghubung yang tak lagi menghubungkan siapa pun selain almarhum (mis. ayah yang dibuat demi seorang paman) ikut dibuang. */
function buangPenghubungYatim(kasus: Kasus): Kasus {
  const almarhum = new Set([kasus.graf.idPewaris, ...kasus.urutanWafat]);
  let graf = kasus.graf;
  for (;;) {
    const daftar = Object.values(graf.orang);
    const yatim = daftar.find(orang => orang.penghubung
      && daftar.every(anak => (anak.idAyah !== orang.id && anak.idIbu !== orang.id) || almarhum.has(anak.id)));
    if (!yatim) return rapikanKeadaan({ ...kasus, graf });
    const lepas = (anak: Orang): Orang => {
      const { idAyah, idIbu, ...sisa } = anak;
      return { ...sisa, ...(idAyah && idAyah !== yatim.id ? { idAyah } : {}), ...(idIbu && idIbu !== yatim.id ? { idIbu } : {}) };
    };
    graf = {
      ...graf,
      orang: Object.fromEntries(daftar.filter(orang => orang.id !== yatim.id).map(orang => [orang.id, lepas(orang)])),
      pernikahan: graf.pernikahan.filter(nikah => nikah.idSuami !== yatim.id && nikah.idIstri !== yatim.id),
    };
  }
}

/** Hapus satu per satu: yang masih punya keturunan menjadi penghubung, yang tak lagi berkerabat ikut dibersihkan. */
function hapusBiasa(kasus: Kasus, ids: IdOrang[]): Kasus {
  const rapi = rapikanKeadaan({ ...kasus, graf: ids.reduce((graf, id) => hapusAhliWaris(graf, id), kasus.graf) });
  return orangTerputus(kasus, rapi).reduce((k, id) => ({ ...k, graf: hapusAhliWaris(k.graf, id) }), rapi);
}
