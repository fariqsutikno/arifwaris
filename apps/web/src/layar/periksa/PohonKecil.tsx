// Pohon kecil keadaan keluarga saat satu almarhum wafat (spec kanvas 7.3, keputusan P4 rencana 4): subgraf berisi
// almarhum, orang tua, pasangan, dan anak-anaknya, digambar lewat PohonDasar yang sama dengan pohon lain, selebar kartu babak.

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { PohonDasar } from '../../hasil/Pohon';
import { keadaanSaat, type BabakKisah } from '../../kisah';
import type { Kasus } from '../../kasus';
import { buatSebutSimpul } from '../../checklist';
import { namaSingkat } from '../../keadaanOrang';
import { keteranganMeninggal, tahunWafat } from '../../penandaMeninggal';

const MAKS_PER_BARIS_KECIL = 4;

export function PohonKecil({ kasus, babak }: { kasus: Kasus; babak: BabakKisah }) {
  const graf = subgraf(kasus, babak);
  // Sebutan sama dengan pohon lain (dari sudut almarhum pemilik harta); sudut "kamu" hanya di kalimat kisah.
  const sebut = buatSebutSimpul(kasus.graf);
  return (
    <PohonDasar graf={graf} maksPerBaris={MAKS_PER_BARIS_KECIL} bingkaiSaudara={false}
      isiNode={id => {
        const keadaan = keadaanSaat(kasus, id, babak.idMayit);
        const meninggal = keadaan === 'mati';
        const pusat = id === babak.idMayit;
        const tambahan = [pusat && 'simpul-pemilik', meninggal && 'simpul-wafat meninggal', keadaan === 'tahu' && 'simpul-belum-pasti'].filter(Boolean).join(' ');
        // Kelas yang sama dengan pohon samping (PohonSusunan), supaya gayanya satu; keterangan meninggal ada di bawah nama (CSS .mini-pohon).
        return { kelas: pusat ? 'pewaris' : graf.orang[id]!.penghubung ? 'penghubung' : 'ahli-waris', tambahan,
          peran: meninggal ? keteranganMeninggal('lebihDulu', tahunWafat(kasus, id)) : '',
          nama: id === kasus.graf.idPewaris || pusat ? namaSingkat(kasus, id) : sebut(id) };
      }} />
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
