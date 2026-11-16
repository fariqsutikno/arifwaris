// Teks bagian kanvas keluarga (spec kanvas 5.2, 5.5): judul, judul pendek di peta, pertanyaan kartu aktif, dan ringkasan
// bagian yang sudah selesai. Menerima Kasus + Bagian; menyerahkan teks dari diksi (`hitung.kanvas.*`), tanpa aturan fikih.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';
import { keadaanTerpilih } from './keadaanBaris';
import { keadaanOrang, namaSingkat } from './keadaanOrang';
import { anggotaBagian, bagianDijawab, type Bagian, type JenisBagian } from './kelompok';
import { t } from './terjemah';

type Jenis = JenisBagian | 'suami';
/** Kunci diksi harus literal (dicek tes diksi), jadi tiap teks per jenis ditulis eksplisit, bukan dirangkai. */
const JUDUL: Record<Jenis, (nama: string) => string> = {
  pasangan: nama => t('hitung.kanvas.judul_istri', { nama }), suami: nama => t('hitung.kanvas.judul_suami', { nama }),
  anak: nama => t('hitung.kanvas.judul_anak', { nama }), anakBersama: nama => t('hitung.kanvas.judul_anak', { nama }),
  orangTua: nama => t('hitung.kanvas.judul_orang_tua', { nama }), kakekNenek: nama => t('hitung.kanvas.judul_kakek_nenek', { nama }),
  saudara: nama => t('hitung.kanvas.judul_saudara', { nama }), jauh: nama => t('hitung.kanvas.judul_jauh', { nama }),
  saudaraKakek: nama => t('hitung.kanvas.judul_saudara_kakek', { nama }),
  halLain: nama => t('hitung.kanvas.judul_hal_lain', { nama }), urutan: () => t('hitung.kanvas.judul_urutan'), kamu: () => t('hitung.kanvas.judul_kamu'),
};
const PENDEK: Record<Jenis, () => string> = {
  pasangan: () => t('hitung.kanvas.pendek_istri'), suami: () => t('hitung.kanvas.pendek_suami'),
  anak: () => t('hitung.kanvas.pendek_anak'), anakBersama: () => t('hitung.kanvas.pendek_anak'),
  orangTua: () => t('hitung.kanvas.pendek_orang_tua'), kakekNenek: () => t('hitung.kanvas.pendek_kakek_nenek'),
  saudara: () => t('hitung.kanvas.pendek_saudara'), jauh: () => t('hitung.kanvas.pendek_jauh'), saudaraKakek: () => t('hitung.kanvas.pendek_saudara_kakek'),
  halLain: () => t('hitung.kanvas.pendek_hal_lain'), urutan: () => t('hitung.kanvas.pendek_urutan'), kamu: () => t('hitung.kanvas.pendek_kamu'),
};
const TANYA: Partial<Record<Jenis, (nama: string) => string>> = {
  pasangan: nama => t('hitung.kanvas.tanya_istri', { nama }), suami: nama => t('hitung.kanvas.tanya_suami', { nama }),
  anak: nama => t('hitung.kanvas.tanya_anak', { nama }), orangTua: nama => t('hitung.kanvas.tanya_orang_tua', { nama }),
  saudara: nama => t('hitung.kanvas.tanya_saudara', { nama }), jauh: nama => t('hitung.kanvas.tanya_jauh', { nama }),
  saudaraKakek: nama => t('hitung.kanvas.tanya_saudara_kakek', { nama }),
  halLain: nama => t('hitung.kanvas.tanya_hal_lain', { nama }),
};
const TANYA_KAKEK_NENEK = {
  '': (nama: string) => t('hitung.kanvas.tanya_kakek_nenek', { nama }),
  ayah: (nama: string) => t('hitung.kanvas.tanya_kakek_nenek_ayah', { nama }),
  ibu: (nama: string) => t('hitung.kanvas.tanya_kakek_nenek_ibu', { nama }),
  keduanya: (nama: string) => t('hitung.kanvas.tanya_kakek_nenek_keduanya', { nama }),
};
/** Bagian lintas-cabang tidak punya pemilik yang perlu disebut. */
const adalahLintasCabang = (bagian: Bagian) => bagian.jenis === 'urutan' || bagian.jenis === 'kamu';
const jenisTampil = (kasus: Kasus, bagian: Bagian): Jenis =>
  bagian.jenis === 'pasangan' && kasus.graf.orang[bagian.milik]?.jenisKelamin !== 'L' ? 'suami' : bagian.jenis;

export function judulBagian(kasus: Kasus, bagian: Bagian): string {
  return JUDUL[jenisTampil(kasus, bagian)](namaSingkat(kasus, bagian.milik));
}

/** Di peta dan tombol lanjut; pemilik disebut hanya untuk bagian cabang. */
export function judulPendek(kasus: Kasus, bagian: Bagian): string {
  const dasar = PENDEK[jenisTampil(kasus, bagian)]();
  return bagian.milik === kasus.graf.idPewaris || adalahLintasCabang(bagian) ? dasar : `${dasar} ${namaSingkat(kasus, bagian.milik)}`;
}

export function pertanyaanBagian(kasus: Kasus, bagian: Bagian): string {
  const nama = namaSingkat(kasus, bagian.milik);
  switch (bagian.jenis) {
    case 'kakekNenek': return TANYA_KAKEK_NENEK[orangTuaWafat(kasus, bagian.milik)](nama);
    case 'anakBersama': return t('hitung.kanvas.tanya_anak_bersama', { anak: daftarNama(kasus, anggotaAnakPewaris(kasus)), nama });
    // Pertanyaan berpasangan urutan ditampilkan BagianUrutan sendiri (ia memegang langkah pencarian biner yang sedang berjalan).
    case 'urutan': case 'kamu': return judulBagian(kasus, bagian);
    default: return TANYA[jenisTampil(kasus, bagian)]!(nama);
  }
}

export function ringkasanBagian(kasus: Kasus, bagian: Bagian): string {
  switch (bagian.jenis) {
    case 'kamu': return kasus.saya ? t('hitung.kanvas.ringkas_kamu', { nama: namaSingkat(kasus, kasus.saya) })
      : kasus.saya === null ? t('hitung.kanvas.ringkas_orang_lain') : '';
    case 'urutan': return (kasus.belumPasti ?? []).some(hal => hal.jenis === 'urutan') ? t('hitung.kanvas.ringkas_urutan_belum_pasti')
      : t('hitung.kanvas.ringkas_urutan_dulu', { nama: namaSingkat(kasus, kasus.urutanWafat[0]!) });
    case 'anakBersama': return anggotaBagian(kasus, bagian).length === anggotaAnakPewaris(kasus).length
      ? t('hitung.kanvas.ringkas_sama_anak', { nama: namaSingkat(kasus, kasus.graf.idPewaris) }) : t('hitung.kanvas.ringkas_tidak_semua');
    case 'halLain': return ringkasHalLain(kasus, bagian);
    default: {
      const anggota = anggotaBagian(kasus, bagian);
      return anggota.length === 0 ? (bagianDijawab(kasus, bagian) ? t('hitung.kanvas.ringkas_tidak_ada') : '')
        : anggota.map(id => `${namaSingkat(kasus, id)}${keterangan(kasus, id)}`).join(', ');
    }
  }
}

function ringkasHalLain(kasus: Kasus, bagian: Bagian): string {
  const bertanda = Object.values(kasus.graf.orang).filter(orang => !orang.penghubung && (orang.agama === 'nonIslam' || orang.membunuhPewaris));
  if (!bagianDijawab(kasus, bagian)) return '';
  return bertanda.length === 0 ? t('hitung.kanvas.ringkas_tidak_ada')
    : t('hitung.kanvas.ringkas_ada', { nama: daftarNama(kasus, bertanda.map(orang => orang.id)) });
}

const daftarNama = (kasus: Kasus, ids: IdOrang[]) => ids.map(id => namaSingkat(kasus, id)).join(', ');
const anggotaAnakPewaris = (kasus: Kasus): IdOrang[] =>
  anggotaBagian(kasus, { id: `anak:${kasus.graf.idPewaris}`, milik: kasus.graf.idPewaris, jenis: 'anak' });

/** Orang tua mana yang sudah wafat ('' bila belum ada yang wafat). */
function orangTuaWafat(kasus: Kasus, milik: IdOrang): keyof typeof TANYA_KAKEK_NENEK {
  const wafat = (id: IdOrang | undefined) => !!id && kasus.graf.orang[id]?.statusHidup === 'wafat';
  const ayah = wafat(kasus.graf.orang[milik]?.idAyah);
  const ibu = wafat(kasus.graf.orang[milik]?.idIbu);
  return ayah && ibu ? 'keduanya' : ayah ? 'ayah' : ibu ? 'ibu' : '';
}

function keterangan(kasus: Kasus, id: IdOrang): string {
  const tahun = kasus.waktu?.[id]?.wafat?.tahun;
  switch (keadaanTerpilih(kasus, id)) {
    // Yang wafat sesudah almarhum punya cabang sendiri (spec 5.2), jadi tidak diberi keterangan di sini.
    case 'wafat': return keadaanOrang(kasus, id) === 'wafatSesudah' ? '' : ` (${tahun ? t('hitung.kanvas.ket_wafat_tahun', { tahun }) : t('hitung.kanvas.ket_wafat')})`;
    case 'belumTahu': return ` (${t('hitung.kanvas.ket_belum_tahu')})`;
    case 'hilang': return ` (${t('hitung.kanvas.ket_hilang')})`;
    case 'bercerai': return ` (${t('hitung.kanvas.ket_bercerai')})`;
    case 'khuntsa': return ` (${t('hitung.kanvas.ket_khuntsa')})`;
    default: return '';
  }
}
