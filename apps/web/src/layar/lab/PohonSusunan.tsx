// Pohon keluarga ringkas dari graf saja (tanpa hasil engine): dipakai hero Awal Lab untuk kasus yang belum
// lengkap dan kartu berkas di rak. Isi node hanya sebutan hubungan; angka bagian tidak ada di sini.

import { labelOrangChecklist } from '../../checklist';
import { PohonDasar } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';

export function PohonSusunan({ kasus, skalaMaks }: { kasus: Kasus; skalaMaks: number }) {
  const { graf } = kasus;
  return (
    <PratinjauPohon skalaMaks={skalaMaks}>
      <PohonDasar graf={graf} isiNode={id => ({
        kelas: id === graf.idPewaris ? 'pewaris' : graf.orang[id]?.penghubung ? 'penghubung' : 'ahli-waris',
        peran: '',
        nama: id === graf.idPewaris ? t('hitung.almarhum') : labelOrangChecklist(graf, graf.idPewaris, id),
      })} />
    </PratinjauPohon>
  );
}
