// Akhir langkah Periksa: nama kasus (opsional), sebelum masuk Hasil. Kosong = dinamai otomatis dari ringkasan ahli waris.
// Tersembunyi di balik satu tautan ("Beri nama kasus ini"): bukan keputusan yang harus diambil di layar konfirmasi.
// Nama dipakai sebagai judul di Kasusmu dan jadi isian awal dialog Simpan di Hasil.

import { BATAS_JUDUL } from '../../tersimpan';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

export function NamaKasus({ kasus, ubah }: Props) {
  const simpanNama = (nama: string) => ubah(k => {
    const { nama: _lama, ...tanpaNama } = k;
    return nama.trim() ? { ...tanpaNama, nama } : tanpaNama;
  });
  return (
    <details className="nama-kasus" open={!!kasus.nama}>
      <summary className="tautan-tambah"><span className="plus-tambah" aria-hidden="true">+</span>{t('hitung.periksa.beri_nama')}</summary>
      <label className="isian isian-kecil">
        <span className="caption-isian">{t('hitung.nama_kasus_ket')}</span>
        <input value={kasus.nama ?? ''} maxLength={BATAS_JUDUL} autoComplete="off" onChange={event => simpanNama(event.target.value)}
          aria-label={t('hitung.nama_kasus_tanya')} placeholder={t('hitung.nama_kasus_contoh')} />
      </label>
    </details>
  );
}
