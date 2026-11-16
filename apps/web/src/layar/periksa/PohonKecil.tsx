// Pohon kecil keadaan keluarga saat satu almarhum wafat (spec kanvas 7.3, keputusan P4 rencana 4): subgraf berisi
// almarhum, orang tua, pasangan, dan anak-anaknya, digambar lewat PohonDasar yang sama dengan pohon lain.

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { PohonDasar } from '../../hasil/Pohon';
import { keadaanSaat, type BabakKisah } from '../../kisah';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { sebutanDariSaya } from '../../sebutan';

const MAKS_PER_BARIS_KECIL = 3;

export function PohonKecil({ kasus, babak }: { kasus: Kasus; babak: BabakKisah }) {
  const graf = subgraf(kasus, babak);
  return (
    <PohonDasar graf={graf} maksPerBaris={MAKS_PER_BARIS_KECIL}
      isiNode={id => ({ kelas: 'orang', tambahan: `m ${keadaanSaat(kasus, id, babak.idMayit)}`, peran: '',
        nama: sebutanDariSaya(kasus, id) ?? namaSingkat(kasus, id) })} />
  );
}

function subgraf(kasus: Kasus, babak: BabakKisah): GrafKeluarga {
  const ids = new Set<IdOrang>([babak.idMayit, ...babak.pasangan, ...babak.anak, ...babak.orangTua, ...babak.sudahTiada, ...babak.belumPasti]);
  const orang = Object.fromEntries([...ids].map(id => {
    const { idAyah, idIbu, ...inti } = kasus.graf.orang[id]!;
    return [id, { ...inti, ...(idAyah && ids.has(idAyah) ? { idAyah } : {}), ...(idIbu && ids.has(idIbu) ? { idIbu } : {}) }];
  }));
  return { idPewaris: babak.idMayit, orang,
    pernikahan: kasus.graf.pernikahan.filter(nikah => ids.has(nikah.idSuami) && ids.has(nikah.idIstri)) };
}
