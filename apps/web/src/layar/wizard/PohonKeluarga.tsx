// Pohon keluarga interaktif di panggung langkah Keluarga: mengetuk kotak membuka menu orang (spec Tahap 4).
// Menerima Kasus + ubah; menyerahkan perubahan graf lewat ubah. Dialog tambah/ubah/hapus ditangani di Task 5.

import { useRef, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { aksiTersedia, bolehHapus } from '../../kerabatPohon';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { PohonSusunan } from '../lab/PohonSusunan';
import { MenuOrang, type AksiMenu } from './MenuOrang';

export interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; maksPerBaris?: number }

export function PohonKeluarga({ kasus, ubah: _ubah, maksPerBaris }: Props) {
  const [terbuka, setTerbuka] = useState<{ id: IdOrang; jangkar: HTMLElement } | null>(null);
  const [aksiDipilih, setAksiDipilih] = useState<{ id: IdOrang; aksi: AksiMenu } | null>(null);
  const pemicu = useRef<HTMLElement | null>(null);
  const tutup = () => { setTerbuka(null); pemicu.current?.focus(); };
  const bukaMenu = (id: IdOrang) => {
    const kotak = document.querySelector<HTMLElement>(`.panggung-pohon [data-orang="${id}"]`);
    if (!kotak) return;
    pemicu.current = kotak;
    setTerbuka({ id, jangkar: kotak });
  };
  const aksiUntuk = (id: IdOrang): AksiMenu[] => [
    ...aksiTersedia(kasus.graf, id),
    ...(id === kasus.graf.idPewaris ? [] : ['ubah' as const]),
    ...(bolehHapus(kasus.graf, id) ? ['hapus' as const] : []),
  ];
  return (
    <div className="panggung-pohon pohon-keluarga">
      <PohonSusunan kasus={kasus} skalaMaks={1} saatPilih={bukaMenu} {...(maksPerBaris ? { maksPerBaris } : {})} />
      {terbuka && (
        <MenuOrang jangkar={terbuka.jangkar} aksi={aksiUntuk(terbuka.id)} judul={namaSingkat(kasus, terbuka.id)}
          saatPilih={aksi => { setAksiDipilih({ id: terbuka.id, aksi }); setTerbuka(null); }} saatTutup={tutup} />
      )}
      {void aksiDipilih}
    </div>
  );
}
