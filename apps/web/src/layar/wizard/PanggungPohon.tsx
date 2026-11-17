// Panggung gelap di samping pertanyaan wizard: pohon keluarga susunan sekarang, lalu ringkasan kasus.
// Di langkah Keluarga (ada `ubah`) pohon interaktif dan selalu tampil agar orang pertama bisa ditambah dari pewaris;
// di langkah lain hanya-baca dan baru muncul setelah ada kerabat.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { PohonLayarPenuh } from '../../hasil/PohonLayarPenuh';
import { t } from '../../terjemah';
import { PohonSusunan } from '../lab/PohonSusunan';
import { PohonKeluarga } from './PohonKeluarga';
import { RingkasanSamping } from './RingkasanSamping';

/** Pohon lengkap di layar penuh memuat semua saudara satu baris (tanpa dibungkus) supaya garisnya tidak bersilangan. */
const MAKS_PER_BARIS_LENGKAP = 8;

interface Props {
  kasus: Kasus | null; ubah?: (f: (k: Kasus) => Kasus) => void; maksPerBaris?: number;
  /** Langkah Keluarga kasus nyata: pohon hanya tampilan; mengetuk simpul menggulir ke barisnya (spec kanvas 5.11). */
  saatPilihOrang?: (id: IdOrang) => void;
}

export function PanggungPohon({ kasus, ubah, maksPerBaris, saatPilihOrang }: Props) {
  const [lengkap, setLengkap] = useState(false);
  const adaKerabat = !!kasus && Object.keys(kasus.graf.orang).length > 1;
  const ringkasSaudara = { saatBuka: () => setLengkap(true) };
  return (
    <>
      {kasus && saatPilihOrang && (
        <div className="panggung-pohon pohon-samping">
          <PohonSusunan kasus={kasus} skalaMaks={1} saatPilih={saatPilihOrang} pilihPenghubung={false} pewarisBisaDipilih={false} ringkasSaudara={ringkasSaudara}
            labelPilih={nama => t('hitung.kanvas.ke_baris', { nama })} {...(maksPerBaris ? { maksPerBaris } : {})} />
          <button type="button" className="tautan-teks tautan-pohon-lengkap" onClick={ringkasSaudara.saatBuka}>{t('hitung.kanvas.pohon_lengkap')}</button>
        </div>
      )}
      {kasus && ubah && !saatPilihOrang && <PohonKeluarga kasus={kasus} ubah={ubah} {...(maksPerBaris ? { maksPerBaris } : {})} />}
      {kasus && !ubah && !saatPilihOrang && adaKerabat && (
        <div className="panggung-pohon pohon-samping">
          <PohonSusunan kasus={kasus} skalaMaks={1} ringkasSaudara={ringkasSaudara} {...(maksPerBaris ? { maksPerBaris } : {})} />
          <button type="button" className="tautan-teks tautan-pohon-lengkap" onClick={ringkasSaudara.saatBuka}>{t('hitung.kanvas.pohon_lengkap')}</button>
        </div>
      )}
      <RingkasanSamping kasus={kasus} />
      {kasus && lengkap && <PohonLayarPenuh pohon={<PohonSusunan kasus={kasus} skalaMaks={1} maksPerBaris={MAKS_PER_BARIS_LENGKAP} />} saatTutup={() => setLengkap(false)} />}
    </>
  );
}
