// Panggung gelap di samping pertanyaan wizard: pohon keluarga susunan sekarang, lalu ringkasan kasus.
// Di langkah Keluarga (ada `ubah`) pohon interaktif dan selalu tampil agar orang pertama bisa ditambah dari pewaris;
// di langkah lain hanya-baca dan baru muncul setelah ada kerabat.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';
import { PohonSusunan } from '../lab/PohonSusunan';
import { PohonKeluarga } from './PohonKeluarga';
import { RingkasanSamping } from './RingkasanSamping';

interface Props {
  kasus: Kasus | null; ubah?: (f: (k: Kasus) => Kasus) => void; maksPerBaris?: number;
  /** Langkah Keluarga kasus nyata: pohon hanya tampilan; mengetuk simpul menggulir ke barisnya (spec kanvas 5.11). */
  saatPilihOrang?: (id: IdOrang) => void;
}

export function PanggungPohon({ kasus, ubah, maksPerBaris, saatPilihOrang }: Props) {
  const [penuh, setPenuh] = useState(false);
  const adaKerabat = !!kasus && Object.keys(kasus.graf.orang).length > 1;
  return (
    <>
      {kasus && saatPilihOrang && (
        <div className={penuh ? 'panggung-pohon pohon-samping penuh' : 'panggung-pohon pohon-samping'}>
          <PohonSusunan kasus={kasus} skalaMaks={1} saatPilih={saatPilihOrang} pilihPenghubung={false} pewarisBisaDipilih={false}
            labelPilih={nama => t('hitung.kanvas.ke_baris', { nama })} {...(maksPerBaris ? { maksPerBaris } : {})} />
          <button type="button" className="tautan-teks tautan-pohon-lengkap" aria-expanded={penuh} onClick={() => setPenuh(sekarang => !sekarang)}>{t('hitung.kanvas.pohon_lengkap')}</button>
        </div>
      )}
      {kasus && ubah && !saatPilihOrang && <PohonKeluarga kasus={kasus} ubah={ubah} {...(maksPerBaris ? { maksPerBaris } : {})} />}
      {kasus && !ubah && !saatPilihOrang && adaKerabat && <div className="panggung-pohon"><PohonSusunan kasus={kasus} skalaMaks={1} {...(maksPerBaris ? { maksPerBaris } : {})} /></div>}
      <RingkasanSamping kasus={kasus} />
    </>
  );
}
