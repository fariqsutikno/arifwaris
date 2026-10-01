// Panggung gelap di samping pertanyaan wizard: pohon keluarga susunan sekarang (hanya-baca), lalu ringkasan kasus.
// Pohon baru muncul setelah ada kerabat; sebelum itu hanya ringkasan.

import type { Kasus } from '../../kasus';
import { PohonSusunan } from '../lab/PohonSusunan';
import { RingkasanSamping } from './RingkasanSamping';

export function PanggungPohon({ kasus }: { kasus: Kasus | null }) {
  const adaKerabat = !!kasus && Object.keys(kasus.graf.orang).length > 1;
  return (
    <>
      {adaKerabat && <div className="panggung-pohon"><PohonSusunan kasus={kasus} skalaMaks={1} /></div>}
      <RingkasanSamping kasus={kasus} />
    </>
  );
}
