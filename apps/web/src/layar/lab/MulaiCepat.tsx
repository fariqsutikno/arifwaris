// Chip susunan keluarga umum; satu ketukan membuka wizard dengan ahli waris terisi (harta masih kosong).

import { kasusDariSusunan, SUSUNAN_CEPAT } from '../../lab';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';

export function MulaiCepat({ saatPilih }: { saatPilih: (kasus: Kasus) => void }) {
  return (
    <section className="lab-cepat tumpuk-rapat" aria-labelledby="judul-lab-cepat">
      <h2 id="judul-lab-cepat" className="tanya-tujuan">{t('hitung.lab_mulai_cepat')}</h2>
      <div className="lab-cepat-chip">
        {SUSUNAN_CEPAT.map(susunan => (
          <button key={susunan.kunci} type="button" className="lab-chip" onClick={() => saatPilih(kasusDariSusunan(susunan))}>
            {t(susunan.kunciDiksi)}
          </button>
        ))}
      </div>
    </section>
  );
}
