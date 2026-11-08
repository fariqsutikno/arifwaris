// Perubahan atas almarhum (pewaris asal) yang berlaku di seluruh Kasus: jenis kelamin dan nama.
// Menerima Kasus; menyerahkan Kasus baru. Dipakai langkah Almarhum di wizard.

import { kasusBaru, type Kasus } from './kasus';

/** Kasus baru dengan jenis kelamin lain. Dibawa: harta, kewajiban, pembulatan, nama, jenis kasus, jawaban pintu, tahun wafat almarhum.
 * Keluarga dan semua jawaban bagian dikosongkan karena hubungan keluarganya ikut berubah. */
export function gantiJenisKelaminPewaris(kasus: Kasus, jenisKelamin: 'L' | 'P'): Kasus {
  const baru = kasusBaru(jenisKelamin, kasus.jenisKasus);
  const { idPewaris } = baru.graf;
  const nama = kasus.graf.orang[kasus.graf.idPewaris]?.nama;
  const pewaris = { ...baru.graf.orang[idPewaris]!, ...(nama ? { nama } : {}) };
  const tahunWafat = kasus.waktu?.[kasus.graf.idPewaris]?.wafat;
  return {
    ...baru, tirkah: kasus.tirkah, satuanPembulatan: kasus.satuanPembulatan,
    ...(kasus.rincianHarta ? { rincianHarta: kasus.rincianHarta } : {}),
    ...(kasus.pintu ? { pintu: kasus.pintu } : {}),
    ...(tahunWafat ? { waktu: { [idPewaris]: { wafat: tahunWafat } } } : {}),
    graf: { ...baru.graf, orang: { [idPewaris]: pewaris } },
  };
}

export function ubahNamaPewaris(kasus: Kasus, nama: string): Kasus {
  const { nama: _lama, ...tanpaNama } = kasus.graf.orang[kasus.graf.idPewaris]!;
  const pewaris = nama ? { ...tanpaNama, nama } : tanpaNama;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [kasus.graf.idPewaris]: pewaris } } };
}
