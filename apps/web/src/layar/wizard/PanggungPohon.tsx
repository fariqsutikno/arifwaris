// Panggung gelap di samping pertanyaan wizard: pohon keluarga susunan sekarang, lalu ringkasan kasus.
// Di langkah Keluarga (ada `ubah`) pohon interaktif dan selalu tampil agar orang pertama bisa ditambah dari pewaris;
// di langkah lain hanya-baca dan baru muncul setelah ada kerabat.

import type { Kasus } from '../../kasus';
import { PohonSusunan } from '../lab/PohonSusunan';
import { PohonKeluarga } from './PohonKeluarga';
import { RingkasanSamping } from './RingkasanSamping';

interface Props { kasus: Kasus | null; ubah?: (f: (k: Kasus) => Kasus) => void; maksPerBaris?: number }

export function PanggungPohon({ kasus, ubah, maksPerBaris }: Props) {
  const adaKerabat = !!kasus && Object.keys(kasus.graf.orang).length > 1;
  return (
    <>
      {kasus && ubah && <PohonKeluarga kasus={kasus} ubah={ubah} {...(maksPerBaris ? { maksPerBaris } : {})} />}
      {kasus && !ubah && adaKerabat && <div className="panggung-pohon"><PohonSusunan kasus={kasus} skalaMaks={1} {...(maksPerBaris ? { maksPerBaris } : {})} /></div>}
      <RingkasanSamping kasus={kasus} />
    </>
  );
}
