// Satu pintu bank soal: kode → kasus untuk layar + label + tingkat + modul. Kunci jawaban tidak dibawa;
// engine menghitungnya saat layar membutuhkan. Keluarga biasa (G1) dan lanjutan (G3: munasakhat, gharqa, mafqud,
// khuntsa, haml, dzawil arham). Soal lolos hanya bila engine memberi hasil yang memang keluarga itu menuntut;
// selebihnya dibuang dengan alasan (engine tak mendukung, perlu input, galat, bukan keluarganya, mayit dilewati).

import type { Tingkat } from '@waris/content';
import type { Kasus } from '../kasus.js';
import { jalankan, jenisSoalDari, type HasilTampil } from '../jalankan.js';
import { bangunKasusLanjutan, kasusBiasaDariKunci } from './bangunKasus.js';
import { adalahLanjutan, type KasusLanjutan } from './kodeLanjutan.js';
import { uraiKodeSoal, type KodeGalatSoal } from './kodeSoal.js';
import { labelDzawilArham, labelGharqa, labelMunasakhat, labelSoal, labelTaqdir } from './labelSoal.js';
import { modulSoal, tingkatSoal } from './tingkatModul.js';

/** Alasan soal dibuang (selain galat kode): dihitung per alasan oleh pembangun bank. */
export type AlasanBuang = 'TIDAK_DIDUKUNG' | 'PERLU_INPUT' | 'GALAT_ENGINE' | 'BUKAN_KELUARGA_INI' | 'MAYIT_DILEWATI';

export type SoalDariKode =
  | { ok: true; kasus: Kasus; label: string[]; tingkat: Tingkat; modul: number[] }
  | { ok: false; galat: KodeGalatSoal | AlasanBuang };

type Terpilih = { label: string[] } | { galat: AlasanBuang };

export function soalDariKode(kode: string): SoalDariKode {
  const urai = uraiKodeSoal(kode);
  if (!urai.ok) return urai;
  let kasus: Kasus;
  try {
    kasus = adalahLanjutan(urai.kasus) ? bangunKasusLanjutan(urai.kasus) : kasusBiasaDariKunci(urai.kasus);
  } catch {
    return { ok: false, galat: 'KASUS_TIDAK_SAH' };
  }
  const tampil = jalankan(kasus);
  const hasil = adalahLanjutan(urai.kasus) ? labelKeluarga(urai.kasus, kasus, tampil) : labelBiasa(tampil);
  if ('galat' in hasil) return { ok: false, galat: hasil.galat };
  return { ok: true, kasus, label: hasil.label, tingkat: tingkatSoal(hasil.label), modul: modulSoal(hasil.label) };
}

function galatDari(tampil: HasilTampil): AlasanBuang {
  if (tampil.jenis === 'galat') return 'GALAT_ENGINE';
  return tampil.hasil.status === 'PERLU_INPUT' ? 'PERLU_INPUT' : 'TIDAK_DIDUKUNG';
}

function labelBiasa(tampil: HasilTampil): Terpilih {
  if (tampil.jenis !== 'biasa') return { galat: galatDari(tampil) };
  return tampil.hasil.status === 'OK' ? { label: labelSoal(tampil.hasil) } : { galat: galatDari(tampil) };
}

function labelKeluarga(struktur: KasusLanjutan, kasus: Kasus, tampil: HasilTampil): Terpilih {
  const salah: Terpilih = { galat: 'BUKAN_KELUARGA_INI' };
  switch (struktur.keluarga) {
    case 'munasakhat': {
      if (tampil.jenis !== 'munasakhat') return salah;
      if (tampil.hasil.status !== 'OK') return { galat: galatDari(tampil) };
      // Mayit yang tak mendapat bagian dilewati [R12-1]: soalnya bukan lagi sebanyak mayit yang tertulis di kode.
      if (tampil.hasil.jejak.some(langkah => langkah.jenis === 'MUNASAKHAT_DILEWATI')) return { galat: 'MAYIT_DILEWATI' };
      return { label: labelMunasakhat(tampil.hasil) };
    }
    case 'gharqa':
      if (tampil.jenis !== 'gharqa') return salah;
      if (tampil.hasil.status === 'OK' || tampil.hasil.status === 'MAUQUF') return { label: labelGharqa(tampil.hasil, struktur.keadaan, kasus.gharqa!.anggota.length) };
      return { galat: galatDari(tampil) };
    case 'dzawilArham':
      if (tampil.jenis !== 'biasa') return salah;
      if (tampil.hasil.status !== 'OK') return { galat: galatDari(tampil) };
      return jenisSoalDari(kasus, tampil) === 'dzawilArham' ? { label: labelDzawilArham(tampil.hasil) } : salah;
    default:
      if (tampil.jenis !== 'taqdir') return salah;
      if (tampil.hasil.status !== 'OK') return { galat: galatDari(tampil) };
      return jenisSoalDari(kasus, tampil) === struktur.keluarga ? { label: labelTaqdir(tampil.hasil, struktur.keluarga) } : salah;
  }
}
