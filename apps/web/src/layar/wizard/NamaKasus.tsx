// Akhir langkah Periksa: nama kasus (opsional), sebelum masuk Hasil. Kosong = dinamai otomatis dari ringkasan ahli waris.
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
    <label className="isian isian-kecil nama-kasus">
      <span className="judul-bagian-kecil">{t('hitung.nama_kasus_tanya')}</span>
      <span className="caption-isian">{t('hitung.nama_kasus_ket')}</span>
      <input value={kasus.nama ?? ''} maxLength={BATAS_JUDUL} autoComplete="off" onChange={event => simpanNama(event.target.value)}
        placeholder={t('hitung.nama_kasus_contoh')} />
    </label>
  );
}
