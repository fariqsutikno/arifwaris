// Isi kartu bagian keluarga (spec kanvas 5.2): penghitung dan baris orang menurut jenis bagian. Menerima Kasus + bagian;
// menyerahkan Kasus lewat ubah(). Hanya memanggil fungsi murni (isianBagian, keadaanBaris); siapa yang ditanya sudah
// diputuskan kelompok.ts. `ya` = bagian ber-Ya/Tidak sudah dijawab Ya, jadi isinya boleh tampil.

import { useId, useState } from 'react';
import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import type { Kasus } from '../../kasus';
import { daftarAnakPewaris, isiBarisTetap, jawabAnakBersama, kunciBagian, orangDenganKunci, slotTetap, tandaiAnakBersama } from '../../isianBagian';
import { pilihanKeadaan, type PilihanKeadaan } from '../../keadaanBaris';
import { namaSingkat } from '../../keadaanOrang';
import { anggotaBagian, bagianDijawab, KUNCI_PER_KELOMPOK, orangDiBaris, type Bagian } from '../../kelompok';
import { t } from '../../terjemah';
import { PertanyaanHamil } from '../keadaan/PertanyaanHamil';
import { BagianHalLain } from './BagianHalLain';
import { BagianKamu } from './BagianKamu';
import { BagianUrutan } from './BagianUrutan';
import { BarisOrang, BingungMemilih, LABEL_KEADAAN, namaPeran } from './BarisOrang';
import { PenghitungOrang } from './PenghitungOrang';

interface Props {
  kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void;
  tandaiKurang: boolean; disorot: IdOrang | null; ya?: boolean;
}

export function BagianKeluarga({ kasus, bagian, ubah, tandaiKurang, disorot, ya = true }: Props) {
  const barisDi = (kunci: KunciAhliWaris) => orangDiBaris(kasus, bagian, kunci).map(id => (
    <BarisOrang key={id} kasus={kasus} id={id} kunci={kunci} milik={bagian.milik} ubah={ubah} tandaiKurang={tandaiKurang} disorot={id === disorot} />
  ));
  const kelompokPeran = (kunci: KunciAhliWaris, label?: string) => (
    <div className="kelompok-peran" key={kunci}>
      <PenghitungOrang kasus={kasus} bagian={bagian} kunci={kunci} ubah={ubah} {...(label ? { label } : {})} />
      {barisDi(kunci)}
    </div>
  );
  const bingung = (daftar: KunciAhliWaris[]) => <BingungMemilih daftarKunci={daftar.filter(kunci => orangDenganKunci(kasus, bagian.milik, kunci).length > 0)} />;

  switch (bagian.jenis) {
    case 'pasangan': {
      if (!ya) return null;
      const [kunci] = kunciBagian(kasus, bagian);
      // Perempuan: satu suami, jadi tanpa penghitung; barisnya dibuat saat "Ya" dipilih.
      const banyak = kasus.graf.orang[bagian.milik]?.jenisKelamin === 'L';
      return <>{banyak ? kelompokPeran(kunci!, t('hitung.kanvas.berapa_istri')) : barisDi(kunci!)}{bingung([kunci!])}</>;
    }
    case 'anak':
      return !ya ? null : (
        <>
          {kelompokPeran('ANAK_LK', t('hitung.laki_laki'))}
          {kelompokPeran('ANAK_PR', t('hitung.perempuan'))}
          <PertanyaanHamil kasus={kasus} idMayit={bagian.milik} ubah={ubah} />
          {bingung(['ANAK_LK', 'ANAK_PR'])}
        </>
      );
    case 'orangTua': case 'kakekNenek':
      return <>{slotTetap(kasus, bagian).map(kunci => <BarisTetap key={kunci} kasus={kasus} bagian={bagian} kunci={kunci} ubah={ubah}
        tandaiKurang={tandaiKurang} disorot={disorot} />)}{bingung(slotTetap(kasus, bagian))}</>;
    case 'saudara': case 'jauh': case 'saudaraKakek': {
      const daftar = KUNCI_PER_KELOMPOK[bagian.jenis] ?? [];
      return !ya ? null : <>{daftar.map(kunci => kelompokPeran(kunci))}{bingung(daftar)}</>;
    }
    case 'anakBersama': return <AnakBersama kasus={kasus} bagian={bagian} ubah={ubah} />;
    case 'halLain': return <BagianHalLain kasus={kasus} bagian={bagian} ubah={ubah} />;
    case 'urutan': return <BagianUrutan kasus={kasus} bagian={bagian} ubah={ubah} />;
    case 'kamu': return <BagianKamu kasus={kasus} bagian={bagian} ubah={ubah} />;
  }
}

/** Baris tetap (Ayah, Ibu, kakek, nenek): sudah ada orangnya → BarisOrang; belum → pilihan keadaan yang membuatnya. */
function BarisTetap({ kasus, bagian, kunci, ubah, tandaiKurang, disorot }: Omit<Props, 'ya'> & { kunci: KunciAhliWaris }) {
  const [id] = orangDenganKunci(kasus, bagian.milik, kunci);
  const idLabel = useId();
  if (id) return <BarisOrang kasus={kasus} id={id} kunci={kunci} milik={bagian.milik} ubah={ubah} tandaiKurang={tandaiKurang} disorot={id === disorot} bisaHapus={false} />;
  const peran = namaPeran(kasus, kunci, bagian.milik);
  return (
    <div className={tandaiKurang ? 'orang kurang' : 'orang'} role="group" aria-label={peran} data-baris-tetap={kunci}
      {...(tandaiKurang ? { 'aria-invalid': true, tabIndex: -1 } : {})}>
      <div className="kol-orang">
        <span className="peran">{peran}</span>
        <span className="keadaan-label" id={idLabel}>{t('hitung.kanvas.keadaan_tanya')}</span>
        <div className="seg" role="radiogroup" aria-labelledby={idLabel}>
          {pilihanKeadaan(kunci).map(({ nilai }) => (
            <button key={nilai} type="button" role="radio" aria-checked={false}
              onClick={() => ubah(k => isiBarisTetap(k, bagian, kunci, nilai as PilihanKeadaan))}>{LABEL_KEADAAN[nilai]()}</button>
          ))}
        </div>
        {tandaiKurang && <span className="salah">{t('hitung.kanvas.baris_pilih_keadaan')}</span>}
      </div>
    </div>
  );
}

/** "Apakah anak-anak pewaris juga anak {pemilik}?" Ya semuanya, atau centang satu per satu. */
function AnakBersama({ kasus, bagian, ubah }: { kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void }) {
  const [tidakSemuaDipilih, setTidakSemuaDipilih] = useState(false);
  const semuaAnak = daftarAnakPewaris(kasus);
  const bersama = anggotaBagian(kasus, bagian);
  const dijawab = bagianDijawab(kasus, bagian);
  const semua = dijawab && semuaAnak.length > 0 && bersama.length === semuaAnak.length && !tidakSemuaDipilih;
  const tidakSemua = (dijawab && !semua) || tidakSemuaDipilih;
  return (
    <>
      <div className="ya-tidak" role="radiogroup" aria-labelledby="judul-bagian-aktif">
        <button type="button" role="radio" aria-checked={semua} onClick={() => { setTidakSemuaDipilih(false); ubah(k => jawabAnakBersama(k, bagian, true)); }}>{t('hitung.kanvas.ya_semuanya')}</button>
        <button type="button" role="radio" aria-checked={tidakSemua} onClick={() => { setTidakSemuaDipilih(true); ubah(k => jawabAnakBersama(k, bagian, false)); }}>{t('hitung.kanvas.tidak_semua')}</button>
      </div>
      {tidakSemua && (
        <ul className="centang-anak" aria-labelledby="judul-bagian-aktif" role="group">
          {semuaAnak.map(id => (
            <li key={id}><label><input type="checkbox" checked={bersama.includes(id)}
              onChange={event => ubah(k => tandaiAnakBersama(k, bagian, id, event.target.checked))} />{namaSingkat(kasus, id)}</label></li>
          ))}
        </ul>
      )}
    </>
  );
}
