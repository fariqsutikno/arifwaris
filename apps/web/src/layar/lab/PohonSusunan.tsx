// Pohon keluarga ringkas dari graf saja (tanpa hasil engine): dipakai hero Awal Lab untuk kasus yang belum
// lengkap, kartu berkas di rak, dan panggung langkah Keluarga. Isi node hanya sebutan hubungan; angka bagian tidak ada di sini.
// Dengan saatPilih, pohon interaktif: tiap kotak (termasuk penghubung) menjadi tombol "Buka menu".

import type { IdOrang } from '@waris/engine';
import { labelOrangChecklist } from '../../checklist';
import { PohonDasar } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; skalaMaks: number; saatPilih?: (id: IdOrang) => void; maksPerBaris?: number }

export function PohonSusunan({ kasus, skalaMaks, saatPilih, maksPerBaris }: Props) {
  const { graf } = kasus;
  return (
    <PratinjauPohon skalaMaks={skalaMaks} interaktif={!!saatPilih}>
      <PohonDasar graf={graf} {...(saatPilih ? { saatPilih, pilihPenghubung: true, labelPilih: (nama: string) => t('hitung.pohon.buka_menu', { nama }) } : {})}
        {...(maksPerBaris ? { maksPerBaris } : {})} isiNode={id => ({
        kelas: id === graf.idPewaris ? 'pewaris' : graf.orang[id]?.penghubung ? 'penghubung' : 'ahli-waris',
        peran: '',
        nama: id === graf.idPewaris ? t('hitung.almarhum') : labelOrangChecklist(graf, graf.idPewaris, id),
      })} />
    </PratinjauPohon>
  );
}
