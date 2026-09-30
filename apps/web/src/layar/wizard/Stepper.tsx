// Stepper sebagai jalur: tiap langkah satu stasiun, Hasil stasiun ujung. Yang sudah boleh dibuka bisa diklik; sisanya nonaktif.

import { LANGKAH_WIZARD } from '../../konten/wizard';
import { LANGKAH_HASIL } from './validasi';
import { angka, t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';

interface Props { langkahAktif: number; terjauh: number; saatPilih: (langkah: number) => void }

export function Stepper({ langkahAktif, terjauh, saatPilih }: Props) {
  const daftar = [...LANGKAH_WIZARD.map(teks => teks.nama), t('hitung.hasil')];
  return (
    <nav className="stepper" data-tur="stepper" aria-label={t('hitung.langkah_isian')}>
      <ol className="jalur-stepper">
        {daftar.map((nama, indeks) => {
          const langkah = indeks + 1;
          const adalahAktif = langkah === langkahAktif;
          const sudahLengkap = langkah < terjauh && !adalahAktif && langkah !== LANGKAH_HASIL;
          const kelas = ['stepper-item', sudahLengkap && 'kelar', langkah === LANGKAH_HASIL && 'ujung'].filter(Boolean).join(' ');
          return (
            <li key={nama}>
              <button type="button" className={kelas} disabled={langkah > terjauh}
                aria-current={adalahAktif ? 'step' : undefined} onClick={() => saatPilih(langkah)}>
                <b aria-hidden="true">{sudahLengkap ? <Ikon nama="benar" ukuran={14} /> : langkah === LANGKAH_HASIL ? <Ikon nama="tujuan" ukuran={14} /> : angka(String(langkah))}</b>
                <span className="nama-stasiun">{nama}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
