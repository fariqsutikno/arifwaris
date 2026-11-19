// Teks pesan untuk grup keluarga (lembar Bagikan): menerima ringkasan hasil dari engine, menyerahkan teks siap tempel.
// Fungsi murni; semua kalimat dari templat diksi `hasil.ringkasan_teks.*`. Urutan baris = urutan daftar "Siapa dapat berapa".

import type { BentukPecahan, RingkasanHasil } from './ringkasan';
import { pecahanTeks } from './ringkasan';
import type { Kasus } from '../kasus';
import { formatRupiah } from '../format';
import { namaMadzhab } from '../layar/DialogMadzhab';
import { t } from '../terjemah';

interface Opsi { sembunyiNominal: boolean; bentuk: BentukPecahan }

export function susunTeksRingkasan(ringkasan: RingkasanHasil, kasus: Kasus, { sembunyiNominal, bentuk }: Opsi): string {
  const nama = kasus.graf.orang[kasus.graf.idPewaris]?.nama?.trim() || t('hitung.almarhum');
  const uang = (nilai: bigint) => formatRupiah(nilai);
  const baris = ringkasan.penerima.map(orang => {
    // Gharqa: daftar memakai rincian per harta sebagai ganti pecahan.
    const bagian = orang.rincian ?? pecahanTeks(orang.saham, ringkasan.penyebut, bentuk);
    return sembunyiNominal ? t('hasil.ringkasan_teks.baris_tanpa_nominal', { nama: orang.nama, bagian })
      : t('hasil.ringkasan_teks.baris', { nama: orang.nama, bagian, rupiah: uang(orang.nominal) });
  });
  const ditahan = ringkasan.ditahan && ringkasan.ditahan.nominal > 0n && !sembunyiNominal
    ? [t('hasil.ringkasan_teks.ditahan', { rupiah: uang(ringkasan.ditahan.nominal) })] : [];
  return [
    t('hasil.ringkasan_teks.judul', { nama, madzhab: namaMadzhab(kasus.madzhab ?? 'syafii') }),
    sembunyiNominal ? t('hasil.ringkasan_teks.harta_tersembunyi') : t('hasil.ringkasan_teks.harta', { rupiah: uang(ringkasan.tirkah.bersih) }),
    '',
    ...baris,
    ...ditahan,
    '',
    t('hasil.ringkasan_teks.penutup'),
  ].join('\n');
}
