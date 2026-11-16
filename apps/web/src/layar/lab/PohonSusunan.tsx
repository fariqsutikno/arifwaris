// Pohon keluarga ringkas dari graf saja (tanpa hasil engine): dipakai hero Awal Lab untuk kasus yang belum
// lengkap, kartu berkas di rak, dan panggung langkah Keluarga. Isi node hanya sebutan hubungan; angka bagian tidak ada di sini.
// Dengan saatPilih, pohon interaktif: tiap kotak (termasuk penghubung) menjadi tombol "Buka menu".

import type { IdOrang } from '@waris/engine';
import { buatSebutSimpul } from '../../checklist';
import { PohonDasar } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import type { Kasus } from '../../kasus';
import { keteranganMeninggal, tahunWafat, waktuMeninggal } from '../../penandaMeninggal';
import { t } from '../../terjemah';

/** Pohon yang bisa diketuk dibiarkan lebih tinggi daripada pratinjau murni supaya tulisan tidak mengecil; halaman yang menggulir. */
const TINGGI_MAKS_INTERAKTIF = 640;

interface Props {
  kasus: Kasus; skalaMaks: number; saatPilih?: (id: IdOrang) => void; maksPerBaris?: number;
  /** Label tombol simpul; bawaan "Buka menu". */
  labelPilih?: (nama: string) => string;
  /** Penghubung (orang buatan sistem) ikut bisa dipilih; bawaan ya. */
  pilihPenghubung?: boolean;
  /** Pewaris tidak punya baris untuk dituju, jadi bisa dimatikan sebagai tombol. */
  pewarisBisaDipilih?: boolean;
}

export function PohonSusunan({ kasus, skalaMaks, saatPilih, maksPerBaris, labelPilih, pilihPenghubung = true, pewarisBisaDipilih = true }: Props) {
  const { graf } = kasus;
  const sebut = buatSebutSimpul(graf);
  return (
    <PratinjauPohon skalaMaks={skalaMaks} interaktif={!!saatPilih} {...(saatPilih ? { tinggiMaks: TINGGI_MAKS_INTERAKTIF } : {})}>
      <PohonDasar graf={graf} bisaPilih={id => pewarisBisaDipilih || id !== graf.idPewaris} {...(saatPilih ? { saatPilih, pilihPenghubung, labelPilih: labelPilih ?? ((nama: string) => t('hitung.pohon.buka_menu', { nama })) } : {})}
        {...(maksPerBaris ? { maksPerBaris } : {})} isiNode={id => ({
        kelas: id === graf.idPewaris ? 'pewaris' : graf.orang[id]?.penghubung ? 'penghubung' : 'ahli-waris',
        tambahan: kelasKeadaan(kasus, id),
        peran: keteranganDari(kasus, id),
        nama: id === graf.idPewaris ? t('hitung.almarhum') : sebut(id),
      })} />
    </PratinjauPohon>
  );
}

const keteranganDari = (kasus: Kasus, id: IdOrang): string => {
  const waktu = waktuMeninggal(kasus, id);
  return waktu ? keteranganMeninggal(waktu, tahunWafat(kasus, id)) : '';
};

/** Spec kanvas 8: belum diisi atau belum tahu = garis putus-putus, meninggal = latar abu (C5-3), pemilik harta = garis tebal. */
function kelasKeadaan(kasus: Kasus, id: IdOrang): string {
  const orang = kasus.graf.orang[id];
  if (!orang) return '';
  if (id === kasus.graf.idPewaris) return 'simpul-pemilik';
  const meninggal = waktuMeninggal(kasus, id) ? 'simpul-wafat meninggal' : '';
  if (orang.penghubung) return meninggal;
  if (orang.statusHidup === 'tidakDiketahui' || (kasus.belumDiisi ?? []).includes(id)) return 'simpul-belum-pasti';
  return meninggal;
}
