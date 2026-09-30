// Jawaban dialog keadaan → Kasus (spec 2.2). Menerima Kasus + satu jawaban tentang satu orang;
// menyerahkan Kasus baru yang sudah dirapikan. "Babak asal" tidak disimpan: diturunkan dari graf,
// yaitu almarhum pertama (pewaris, lalu urutan wafat) yang menjadikan orang itu kerabat.

import { KONFIGURASI_BAWAAN, turunkanPeran, type IdOrang, type InputTirkah, type KeadaanGharqa } from '@waris/engine';
import { hapusAhliWaris, labelOrangChecklist, tambahOrangBaru } from './checklist';
import { rapikanKeadaan, type Kasus } from './kasus';

export type KeadaanTampil = 'hidup' | 'wafatSebelum' | 'wafatSesudah' | 'wafatSesudahDibagi' | 'bersamaan' | 'hilang' | 'dalamKandungan' | 'khuntsa';
export type JawabanKeadaan =
  | { jenis: 'hidup' }
  | { jenis: 'wafatSebelum' }
  | { jenis: 'wafatSesudah'; hartaSudahDibagi: boolean; posisi?: number }
  | { jenis: 'bersamaan'; keadaan: KeadaanGharqa; tirkah: InputTirkah }
  | { jenis: 'hilang' }
  | { jenis: 'khuntsa'; keadaan: 'diharapkanJelas' | 'tidakDiharapkanJelas' };

export const daftarAlmarhum = (kasus: Kasus): IdOrang[] => [kasus.graf.idPewaris, ...kasus.urutanWafat];

/** Orang yang punya peran (ahli waris, mahjub, atau dzawil arham) bila `idMayit` pewarisnya. */
export function kerabatDari(kasus: Kasus, idMayit: IdOrang): IdOrang[] {
  const { daftarPeran } = turunkanPeran({ ...kasus.graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN);
  return Object.keys(kasus.graf.orang).filter(id => id !== idMayit && !kasus.graf.orang[id]!.penghubung
    && daftarPeran[id] && daftarPeran[id]!.kunci !== 'BUKAN_AHLI_WARIS');
}

export function babakAsal(kasus: Kasus, idOrang: IdOrang): IdOrang | undefined {
  return daftarAlmarhum(kasus).find(idMayit => kerabatDari(kasus, idMayit).includes(idOrang));
}

export function keadaanOrang(kasus: Kasus, idOrang: IdOrang): KeadaanTampil {
  const orang = kasus.graf.orang[idOrang]!;
  if (kasus.urutanWafat.includes(idOrang)) return 'wafatSesudah';
  if (kasus.wafatSesudahDibagi?.includes(idOrang)) return 'wafatSesudahDibagi';
  if (kasus.gharqa?.anggota.includes(idOrang)) return 'bersamaan';
  if (orang.statusHidup === 'wafat') return 'wafatSebelum';
  if (orang.statusHidup === 'mafqud') return 'hilang';
  if (orang.statusHidup === 'dalamKandungan') return 'dalamKandungan';
  if (orang.khuntsa) return 'khuntsa';
  return 'hidup';
}

/** Terapkan satu jawaban. Keadaan lama orang itu dibersihkan dulu; orang yang tak lagi kerabat almarhum mana pun dihapus. */
export function terapkanKeadaan(kasus: Kasus, idOrang: IdOrang, jawaban: JawabanKeadaan): Kasus {
  const bersih = bersihkanKeadaan(kasus, idOrang);
  const ubah = (perubahan: Partial<Kasus['graf']['orang'][string]>): Kasus =>
    ({ ...bersih, graf: { ...bersih.graf, orang: { ...bersih.graf.orang, [idOrang]: { ...bersih.graf.orang[idOrang]!, ...perubahan } } } });
  let hasil: Kasus;
  switch (jawaban.jenis) {
    case 'hidup': hasil = bersih; break;
    case 'wafatSebelum': hasil = ubah({ statusHidup: 'wafat' }); break;   // bukan ahli waris almarhum babaknya (bab 12.7)
    case 'wafatSesudah':
      if (jawaban.hartaSudahDibagi) { hasil = { ...bersih, wafatSesudahDibagi: [...(bersih.wafatSesudahDibagi ?? []), idOrang] }; break; }
      {
        const urutan = [...bersih.urutanWafat];
        urutan.splice(jawaban.posisi ?? urutan.length, 0, idOrang);
        hasil = { ...bersih, urutanWafat: urutan };
      }
      break;
    case 'bersamaan': {
      // [R13-10] 13d: pewaris selalu anggota; harta anggota lain disimpan per orang.
      const lama = bersih.gharqa;
      const anggota = [...new Set([bersih.graf.idPewaris, ...(lama?.anggota ?? []), idOrang])];
      hasil = { ...ubah({ statusHidup: 'wafat' }), gharqa: { anggota, keadaan: jawaban.keadaan, tirkah: { ...(lama?.tirkah ?? {}), [idOrang]: jawaban.tirkah } } };
      break;
    }
    case 'hilang': hasil = ubah({ statusHidup: 'mafqud' }); break;        // [R13-6] hukum asal hidup, bagian ditahan
    case 'khuntsa': hasil = ubah({ khuntsa: jawaban.keadaan }); break;    // [K13c-1]
  }
  const rapi = rapikanKeadaan(hasil);
  return orangTerputus(kasus, rapi).reduce((k, id) => ({ ...k, graf: hapusAhliWaris(k.graf, id) }), rapi);
}

function bersihkanKeadaan(kasus: Kasus, idOrang: IdOrang): Kasus {
  const { khuntsa: _k, ...orang } = kasus.graf.orang[idOrang]!;
  const statusHidup = orang.statusHidup === 'dalamKandungan' ? orang.statusHidup : 'hidup';
  return rapikanKeadaan({
    ...kasus,
    graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [idOrang]: { ...orang, statusHidup } } },
    urutanWafat: kasus.urutanWafat.filter(id => id !== idOrang),
    ...(kasus.wafatSesudahDibagi ? { wafatSesudahDibagi: kasus.wafatSesudahDibagi.filter(id => id !== idOrang) } : {}),
    ...(kasus.gharqa ? { gharqa: { ...kasus.gharqa, anggota: kasus.gharqa.anggota.filter(id => id !== idOrang) } } : {}),
  });
}

/** Orang (bukan pewaris) yang tadinya kerabat salah satu almarhum dan sesudah perubahan tidak lagi. */
export function orangTerputus(sebelum: Kasus, sesudah: Kasus): IdOrang[] {
  const kerabatSesudah = new Set(daftarAlmarhum(sesudah).flatMap(idMayit => [idMayit, ...kerabatDari(sesudah, idMayit)]));
  const kerabatSebelum = new Set(daftarAlmarhum(sebelum).flatMap(idMayit => kerabatDari(sebelum, idMayit)));
  // Sudah terhapus dari `sesudah` (mis. hasil terapkanKeadaan) tetap terhitung terputus: pemanggil memakainya untuk konfirmasi.
  return [...kerabatSebelum].filter(id => !kerabatSesudah.has(id));
}

/** Kunci diksi pesan penolakan, atau null bila didukung engine (spec 1.7, celah E1/E2). */
export function alasanTidakDidukung(kasus: Kasus, idOrang: IdOrang, jawaban: JawabanKeadaan): string | null {
  const diBabakPewaris = babakAsal(kasus, idOrang) === kasus.graf.idPewaris;
  const adaUrutanLain = kasus.urutanWafat.some(id => id !== idOrang);
  const adaGharqaLain = (kasus.gharqa?.anggota ?? []).some(id => id !== idOrang && id !== kasus.graf.idPewaris);
  if (jawaban.jenis === 'bersamaan' && (!diBabakPewaris || adaUrutanLain)) return 'hitung.keadaan.belum_didukung';
  if (jawaban.jenis === 'wafatSesudah' && !jawaban.hartaSudahDibagi && adaGharqaLain) return 'hitung.keadaan.belum_didukung';
  return null;
}

export function perluPeriksaCerita(kasus: Kasus): boolean {
  return kasus.urutanWafat.length > 0 || !!kasus.gharqa || !!kasus.wafatSesudahDibagi?.length
    || Object.values(kasus.graf.orang).some(o => o.statusHidup === 'mafqud' || o.statusHidup === 'dalamKandungan' || !!o.khuntsa);
}

/** Nama untuk kalimat: nama isian, atau label hubungan dari babak asalnya ("Anak laki-laki"). */
export const namaSingkat = (kasus: Kasus, idOrang: IdOrang): string =>
  kasus.graf.orang[idOrang]!.nama ?? labelOrangChecklist(kasus.graf, babakAsal(kasus, idOrang) ?? kasus.graf.idPewaris, idOrang);
/** [R13-1] Anak yang baru dikandung sesudah `idMayit` wafat bukan ahli warisnya; null = sudah ada sebelum semua almarhum. */
export function aturDikandung(kasus: Kasus, idAnak: IdOrang, idMayit: IdOrang | null): Kasus {
  const { [idAnak]: _lama, ...sisa } = kasus.dikandungSetelahWafat ?? {};
  const baru = idMayit ? { ...sisa, [idAnak]: idMayit } : sisa;
  return rapikanKeadaan({ ...kasus, dikandungSetelahWafat: baru });
}

/** Lawan jenis yang hidup saat `idMayit` wafat dan belum menjadi pasangannya (S11). Pewaris & almarhum sebelumnya dikecualikan. */
export function calonPasangan(kasus: Kasus, idMayit: IdOrang): IdOrang[] {
  const mayit = kasus.graf.orang[idMayit]!;
  const almarhum = new Set(daftarAlmarhum(kasus));
  const sudah = new Set(kasus.graf.pernikahan.flatMap(n => (n.idSuami === idMayit ? [n.idIstri] : n.idIstri === idMayit ? [n.idSuami] : [])));
  return Object.values(kasus.graf.orang)
    .filter(o => o.jenisKelamin !== mayit.jenisKelamin && !o.penghubung && o.statusHidup === 'hidup' && !almarhum.has(o.id) && !sudah.has(o.id))
    .map(o => o.id);
}

/** Pernikahan utuh yang terjadi sebelum `idMayit` wafat; status dinilai saat salah satunya wafat (memori mode lanjutan). */
export function nikahkan(kasus: Kasus, idMayit: IdOrang, idPasangan: IdOrang): Kasus {
  const [idSuami, idIstri] = kasus.graf.orang[idMayit]!.jenisKelamin === 'L' ? [idMayit, idPasangan] : [idPasangan, idMayit];
  return rapikanKeadaan({ ...kasus, graf: { ...kasus.graf, pernikahan: [...kasus.graf.pernikahan, { idSuami, idIstri, status: 'utuh' }] } });
}

/** [R13-1] 13a.1: perempuan yang janinnya — dari suaminya di data, atau dari suami lain — punya peran ahli waris bagi `idMayit`. */
export function calonIbuJanin(kasus: Kasus, idMayit: IdOrang): Array<{ idIbu: IdOrang; idAyahSah?: IdOrang }> {
  const { graf } = kasus;
  const perempuan = Object.values(graf.orang).filter(o => o.jenisKelamin === 'P' && !o.penghubung && o.statusHidup === 'hidup' && o.id !== idMayit);
  const mewarisi = (idIbu: IdOrang, idAyah?: IdOrang) => {
    const uji = tambahOrangBaru(graf, { jenisKelamin: 'L', idIbu, ...(idAyah ? { idAyah } : {}) });
    const kunci = turunkanPeran({ ...uji.graf, idPewaris: idMayit }, KONFIGURASI_BAWAAN).daftarPeran[uji.idOrang]?.kunci;
    return !!kunci && kunci !== 'BUKAN_AHLI_WARIS' && kunci !== 'DZAWIL_ARHAM';
  };
  return perempuan.flatMap(ibu => {
    const suami = graf.pernikahan.find(n => n.idIstri === ibu.id && n.status !== 'talakBain')?.idSuami;
    if (suami && mewarisi(ibu.id, suami)) return [{ idIbu: ibu.id, idAyahSah: suami }];
    return mewarisi(ibu.id) ? [{ idIbu: ibu.id }] : [];
  });
}

/** Satu node mewakili seluruh janin (types.ts); jenis kelamin hanya pengisi, taqdir menentukan. [R13-3] */
export const tambahJanin = (kasus: Kasus, idIbu: IdOrang, idAyah?: IdOrang): Kasus => {
  const { graf } = tambahOrangBaru(kasus.graf, { jenisKelamin: 'L', idIbu, ...(idAyah ? { idAyah } : {}), statusHidup: 'dalamKandungan' });
  return rapikanKeadaan({ ...kasus, graf });
};

export type KelahiranJanin =
  | { jenis: 'belum' } | { jenis: 'hidup'; anak: Array<'L' | 'P'> }
  | { jenis: 'lahirLaluWafat'; jenisKelamin: 'L' | 'P' } | { jenis: 'tanpaKehidupan' };

export function janinLahir(kasus: Kasus, idJanin: IdOrang, kelahiran: KelahiranJanin): { kasus: Kasus; idBayiWafat?: IdOrang } {
  const janin = kasus.graf.orang[idJanin]!;
  const induk = { ...(janin.idAyah ? { idAyah: janin.idAyah } : {}), ...(janin.idIbu ? { idIbu: janin.idIbu } : {}) };
  const tanpaJanin = { ...kasus, graf: hapusAhliWaris(kasus.graf, idJanin) };
  switch (kelahiran.jenis) {
    case 'belum': return { kasus };
    case 'tanpaKehidupan': return { kasus: rapikanKeadaan(tanpaJanin) };   // [R13-2] syarat istihlal tidak terpenuhi
    case 'hidup': {
      const graf = kelahiran.anak.reduce((g, jenisKelamin) => tambahOrangBaru(g, { jenisKelamin, ...induk }).graf, tanpaJanin.graf);
      return { kasus: rapikanKeadaan({ ...tanpaJanin, graf }) };
    }
    case 'lahirLaluWafat': {
      const bayi = tambahOrangBaru(tanpaJanin.graf, { jenisKelamin: kelahiran.jenisKelamin, ...induk });
      return { kasus: rapikanKeadaan({ ...tanpaJanin, graf: bayi.graf }), idBayiWafat: bayi.idOrang };
    }
  }
}
