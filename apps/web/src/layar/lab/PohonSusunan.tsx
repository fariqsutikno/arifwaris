// Pohon keluarga ringkas dari graf saja (tanpa hasil engine): dipakai hero Awal Lab untuk kasus yang belum
// lengkap, kartu berkas di rak, dan panggung langkah Keluarga. Isi node hanya sebutan hubungan; angka bagian tidak ada di sini.
// Dengan saatPilih, pohon interaktif: tiap kotak (termasuk penghubung) menjadi tombol "Buka menu".

import type { ReactNode } from 'react';
import type { IdOrang } from '@waris/engine';
import { buatSebutSimpul } from '../../checklist';
import { PohonDasar } from '../../hasil/Pohon';
import { PratinjauPohon } from '../../hasil/PratinjauPohon';
import { ID_RINGKAS_SAUDARA, ringkaskanSaudara, type RingkasanSaudara } from '../../hasil/saudara';
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
  /** Pohon samping: saudara diganti satu simpul "Saudara: N" yang membuka pohon lengkap lewat aksi ini. */
  ringkasSaudara?: { saatBuka: () => void };
  /** Di dalam layar penuh: tanpa pratinjau, karena layar penuh sendiri yang mengatur zoom (pratinjau menghitung skala 0 di wadah tanpa lebar). */
  tanpaPratinjau?: boolean;
}

export function PohonSusunan({ kasus, skalaMaks, saatPilih, maksPerBaris, labelPilih, pilihPenghubung = true, pewarisBisaDipilih = true, ringkasSaudara, tanpaPratinjau = false }: Props) {
  const { graf: grafLengkap } = kasus;
  const { graf, ringkasan } = ringkasSaudara ? ringkaskanSaudara(grafLengkap) : { graf: grafLengkap, ringkasan: undefined };
  // Sebutan dihitung dari graf lengkap supaya nomor ("Anak laki-laki 2") sama dengan pohon lengkap.
  const sebut = buatSebutSimpul(grafLengkap);
  const adaRingkas = !!ringkasan && !!ringkasSaudara;
  const pilihNode = (id: IdOrang) => (id === ID_RINGKAS_SAUDARA ? ringkasSaudara?.saatBuka() : saatPilih?.(id));
  return (
    <KemasPratinjau aktif={!tanpaPratinjau} skalaMaks={skalaMaks} interaktif={!!saatPilih || adaRingkas} {...(saatPilih || adaRingkas ? { tinggiMaks: TINGGI_MAKS_INTERAKTIF } : {})}>
      <PohonDasar graf={graf} bingkaiSaudara={!adaRingkas}
        bisaPilih={id => id === ID_RINGKAS_SAUDARA || !!saatPilih && (pewarisBisaDipilih || id !== graf.idPewaris)}
        {...(saatPilih || adaRingkas ? { saatPilih: pilihNode, pilihPenghubung, labelPilih: (nama: string) => (ringkasan && nama === teksRingkas(ringkasan).judul ? t('hitung.pohon.buka_lengkap') : (labelPilih ?? ((n: string) => t('hitung.pohon.buka_menu', { nama: n })))(nama)) } : {})}
        {...(maksPerBaris ? { maksPerBaris } : {})} isiNode={id => id === ID_RINGKAS_SAUDARA && ringkasan ? simpulRingkas(ringkasan) : ({
        kelas: id === graf.idPewaris ? 'pewaris' : graf.orang[id]?.penghubung ? 'penghubung' : 'ahli-waris',
        tambahan: kelasKeadaan(kasus, id),
        peran: keteranganDari(kasus, id),
        nama: id === graf.idPewaris ? t('hitung.almarhum') : sebut(id),
      })} />
    </KemasPratinjau>
  );
}

const KemasPratinjau = ({ aktif, children, ...props }: { aktif: boolean; children: ReactNode; skalaMaks: number; interaktif: boolean; tinggiMaks?: number }) =>
  aktif ? <PratinjauPohon {...props}>{children}</PratinjauPohon> : <>{children}</>;

const teksRingkas = ({ jumlah, menurutJenis: { kandung, sebapak, seibu } }: RingkasanSaudara) => ({
  judul: t('hitung.pohon.saudara_n', { n: jumlah }),
  // Hanya jenis yang ada, mis. "3 kandung, 1 seayah, 1 seibu".
  rincian: [kandung && t('hitung.pohon.n_kandung', { n: kandung }), sebapak && t('hitung.pohon.n_seayah', { n: sebapak }), seibu && t('hitung.pohon.n_seibu', { n: seibu })]
    .filter(Boolean).join(', '),
});

const simpulRingkas = (ringkasan: RingkasanSaudara) => {
  const { judul, rincian } = teksRingkas(ringkasan);
  return { kelas: 'ringkas-saudara', peran: '', nama: judul, tanpaAvatar: true, isi: <span className="rincian-ringkas">{rincian}</span> };
};

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
