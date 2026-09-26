// Stepper: nama semua langkah + Hasil. Langkah yang sudah boleh dibuka bisa diklik; sisanya nonaktif.

import { LANGKAH_WIZARD } from '../../konten/wizard';
import { LANGKAH_HASIL } from './validasi';
import { angka, t } from '../../terjemah';

interface Props { langkahAktif: number; terjauh: number; saatPilih: (langkah: number) => void }

export function Stepper({ langkahAktif, terjauh, saatPilih }: Props) {
  const daftar = [...LANGKAH_WIZARD.map(teks => teks.nama), t('hitung.hasil')];
  return (
    <nav className="stepper" data-tur="stepper" aria-label={t('hitung.langkah_isian')}>
      {daftar.map((nama, indeks) => {
        const langkah = indeks + 1;
        const adalahAktif = langkah === langkahAktif;
        const sudahLengkap = langkah < terjauh && !adalahAktif && langkah !== LANGKAH_HASIL;
        return (
          <button key={nama} type="button" className={sudahLengkap ? 'stepper-item kelar' : 'stepper-item'} disabled={langkah > terjauh}
            aria-current={adalahAktif ? 'step' : undefined} onClick={() => saatPilih(langkah)}>
            <b aria-hidden="true">{sudahLengkap ? '✓' : langkah === LANGKAH_HASIL ? '★' : angka(String(langkah))}</b>{nama}
          </button>
        );
      })}
    </nav>
  );
}
