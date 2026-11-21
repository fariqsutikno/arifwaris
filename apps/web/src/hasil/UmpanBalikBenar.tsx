import { Ikon } from '../ui/Ikon';
import { t } from '../terjemah';

/** Ditampilkan di atas pembagian setelah soal benar semua, bersama confetti. */
export function UmpanBalikBenar() {
  return (
    <div className="hasil-tebak benar" role="status">
      <b><Ikon nama="benar" ukuran={20} /> {t('hitung.benar_semua')}</b>
      <p>{t('hitung.pembagianmu_sama_persis_dengan_hasil_perhitungan')}</p>
    </div>
  );
}
