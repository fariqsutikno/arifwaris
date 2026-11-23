// Pemicu catatan "kalau menurut KHI" (hukum positif, bukan fikih).
// Menerima hasil engine fikih + masukan, memutuskan catatan KHI mana yang relevan untuk kasus ini.
// Tidak menghitung bagian apa pun dan tidak mengubah masukan; isi catatan ada di packages/content (catatanKhi).
// Dua catatan (anakLuarKawin, hibahOrtuAnak) belum punya pemicu karena engine tidak menerima nasab li'an/zina atau hibah;
// keduanya hanya muncul lewat halaman baca KHI.
import type { GrafKeluarga, HasilEngine, InputEngine, KunciAhliWaris, StatusOrang } from '../types.js';

/** Urutan tampil. Harus sama dengan ID_CATATAN_KHI di packages/content (dijaga tes di packages/content). */
export const ID_CATATAN_KHI = [
  'pengganti', 'wasiatWajibah', 'hartaBersama', 'penghalang', 'saudaraSeibu', 'kerabatJauh',
  'anakLuarKawin', 'wasiatAhliWaris', 'hibahOrtuAnak', 'ayah', 'saudariKandungSeayah',
] as const;
export type IdCatatanKhi = (typeof ID_CATATAN_KHI)[number];

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

export function pilihCatatanKhi(hasil: HasilEngine, masukan: InputEngine): IdCatatanKhi[] {
  const terpilih = new Set<IdCatatanKhi>();
  if (adaCalonPengganti(masukan.graf)) terpilih.add('pengganti');
  if (adaPasanganHidup(masukan.graf)) terpilih.add('hartaBersama');
  if (hasil.status === 'OK') pilihDariHasil(hasil, terpilih);
  return ID_CATATAN_KHI.filter(id => terpilih.has(id));
}

function pilihDariHasil(hasil: HasilOk, terpilih: Set<IdCatatanKhi>): void {
  const daftarStatus = Object.values(hasil.statusOrang);
  const adaKunci = (...kunci: KunciAhliWaris[]) => daftarStatus.some(status => memilikiKunci(status, kunci, ['ahliWaris', 'mahjub']));
  const adaPenghalang = (...mani: string[]) => daftarStatus.some(status => status.jenis === 'mamnu' && mani.includes(status.mani));

  if (adaPenghalang('qatl', 'ikhtilafDin')) terpilih.add('penghalang');
  if (adaPenghalang('ikhtilafDin')) terpilih.add('wasiatWajibah');
  if (adaKunci('SAUDARA_SEIBU', 'SAUDARI_SEIBU') && adaKunci('SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK')) {
    terpilih.add('saudaraSeibu');
  }
  if (adaKerabatJauh(hasil, daftarStatus)) terpilih.add('kerabatJauh');
  // KHI Pasal 177 menyebut ayah 1/3 atau 1/6; ketidakselarasan bunyi hanya relevan bila ayah mewarisi tanpa anak/cucu laki-laki.
  if (daftarStatus.some(status => memilikiKunci(status, ['AYAH'], ['ahliWaris'])) &&
      !daftarStatus.some(status => memilikiKunci(status, ['ANAK_LK', 'CUCU_LK'], ['ahliWaris']))) {
    terpilih.add('ayah');
  }
  if (adaKunci('SAUDARI_SEBAPAK')) terpilih.add('saudariKandungSeayah');
  if (hasil.jejak.some(langkah => langkah.jenis === 'TIRKAH' && (langkah.wasiatDiminta > langkah.wasiatBatas || langkah.wasiatButuhIjazah > 0n))) {
    terpilih.add('wasiatAhliWaris');
  }
}

function memilikiKunci(status: StatusOrang, kunci: readonly string[], jenis: readonly StatusOrang['jenis'][]): boolean {
  return jenis.includes(status.jenis) && 'peran' in status && kunci.includes(status.peran.kunci);
}

function adaKerabatJauh(hasil: HasilOk, daftarStatus: StatusOrang[]): boolean {
  const tujuanKerabat = hasil.sisaKeluar?.tujuan;
  return hasil.tanzil !== undefined
    || daftarStatus.some(status => memilikiKunci(status, ['DZAWIL_ARHAM'], ['ahliWaris']))
    || tujuanKerabat === 'dzawilArham' || tujuanKerabat === 'baitulMal' || tujuanKerabat === 'baitulMalTeratur';
}

/** Calon pengganti (KHI-185): orang hidup yang orang tuanya wafat lebih dulu dan orang tua itu anak atau saudara pewaris. */
function adaCalonPengganti(graf: GrafKeluarga): boolean {
  const pewaris = graf.orang[graf.idPewaris];
  const orangLain = Object.values(graf.orang).filter(orang => orang.id !== graf.idPewaris);
  return orangLain.some(orang => {
    if (orang.statusHidup !== 'hidup') return false;
    return [orang.idAyah, orang.idIbu].some(idOrangTua => {
      const orangTua = idOrangTua === undefined ? undefined : graf.orang[idOrangTua];
      if (!orangTua || orangTua.id === graf.idPewaris || orangTua.statusHidup !== 'wafat') return false;
      const anakPewaris = orangTua.idAyah === graf.idPewaris || orangTua.idIbu === graf.idPewaris;
      const saudaraPewaris = (pewaris?.idAyah !== undefined && orangTua.idAyah === pewaris.idAyah)
        || (pewaris?.idIbu !== undefined && orangTua.idIbu === pewaris.idIbu);
      return anakPewaris || saudaraPewaris;
    });
  });
}

/** Harta bersama (KHI-96): ada pernikahan dengan pewaris yang pasangannya masih hidup dan belum talak ba'in. */
function adaPasanganHidup(graf: GrafKeluarga): boolean {
  return graf.pernikahan.some(nikah => {
    if (nikah.status === 'talakBain') return false;
    const idPasangan = nikah.idSuami === graf.idPewaris ? nikah.idIstri : nikah.idIstri === graf.idPewaris ? nikah.idSuami : undefined;
    return idPasangan !== undefined && graf.orang[idPasangan]?.statusHidup === 'hidup';
  });
}
