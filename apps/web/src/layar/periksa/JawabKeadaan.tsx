// Jawab keadaan satu orang di tempat (hidup, wafat sebelum/sesudah `milik`, belum tahu), dipakai Ubah dipandu dan panel
// ubah per babak. Menerima Kasus + orang; menyimpan lewat ubah() memakai fungsi keadaanBaris (aturan fikih tidak diulang di sini).

import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { jawabLanjutan, pilihKeadaan } from '../../keadaanBaris';
import { keadaanOrang, namaSingkat } from '../../keadaanOrang';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; id: IdOrang; milik: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void }

export function JawabKeadaan({ kasus, id, milik, ubah }: Props) {
  const keadaan = keadaanOrang(kasus, id);
  const nama = namaSingkat(kasus, milik);
  const wafat = (waktu: 'sebelum' | 'sesudah') => (k: Kasus) =>
    jawabLanjutan(pilihKeadaan(k, id, 'wafat', milik), id, milik, { jenis: 'wafat', waktu });
  const pilihan: Array<[string, boolean, (k: Kasus) => Kasus]> = [
    [t('hitung.periksa.masih_hidup'), keadaan === 'hidup', k => pilihKeadaan(k, id, 'hidup', milik)],
    [t('hitung.periksa.wafat_sebelum', { nama }), keadaan === 'wafatSebelum', wafat('sebelum')],
    [t('hitung.periksa.wafat_sesudah', { nama }), keadaan === 'wafatSesudah', wafat('sesudah')],
    [t('hitung.periksa.belum_tahu'), keadaan === 'belumTahu', k => pilihKeadaan(k, id, 'belumTahu', milik)],
  ];
  return (
    <div className="seg" role="radiogroup" aria-label={t('hitung.periksa.keadaan_sekarang', { nama: namaSingkat(kasus, id) })}>
      {pilihan.map(([teks, terpilih, terapkan]) => (
        <button key={teks} type="button" role="radio" aria-checked={terpilih} onClick={() => ubah(terapkan)}>{teks}</button>
      ))}
    </div>
  );
}
