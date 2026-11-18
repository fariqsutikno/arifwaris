// Kartu "Pertanyaan lanjutan" di akhir langkah Keluarga: keadaan yang jarang terjadi (hilang tanpa kabar, cerai) tidak jadi
// pil di tiap kartu orang. Menerima Kasus; menulis keadaan lewat pilihKeadaan (sama seperti pil lama) dan menyerahkan Kasus lewat ubah().
// Kartu hanya dirender bila ada orang yang bisa dipilih; jawaban "Ya" dibaca dari Kasus, jadi kasus lama yang sudah punya
// orang hilang/cerai langsung tampil "Ya" dengan centang yang benar.

import { useId, useState } from 'react';
import { jenisDari } from '../../checklist';
import type { Kasus } from '../../kasus';
import { calonCerai, calonHilang, keadaanTerpilih, pilihKeadaan, type CalonLanjutan, type PilihanKeadaan } from '../../keadaanBaris';
import { t } from '../../terjemah';
import { SEBUTAN_SAUDARA_KAKEK } from './BagianKeluarga';
import { LanjutanBaris, namaPeran } from './BarisOrang';

interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void }

export function PertanyaanLanjutan({ kasus, ubah }: Props) {
  const hilang = calonHilang(kasus);
  const cerai = calonCerai(kasus);
  if (hilang.length === 0 && cerai.length === 0) return null;
  const perempuanMilik = cerai.filter(calon => kasus.graf.orang[calon.milik]?.jenisKelamin === 'P').length;
  const pasangan = perempuanMilik === 0 ? t('hitung.kanvas.sebut_istri') : perempuanMilik === cerai.length ? t('hitung.kanvas.sebut_suami') : t('hitung.kanvas.sebut_istri_suami');
  return (
    <section className="grup" aria-label={t('hitung.kanvas.lanjutan_judul')}>
      <span className="label">{t('hitung.kanvas.lanjutan_judul')}</span>
      {hilang.length > 0 && <TanyaDaftar kasus={kasus} ubah={ubah} calon={hilang} sasaran="hilang" pertanyaan={t('hitung.kanvas.hilang_tanya')} />}
      {cerai.length > 0 && <TanyaDaftar kasus={kasus} ubah={ubah} calon={cerai} sasaran="bercerai" pertanyaan={t('hitung.kanvas.cerai_tanya', { pasangan })} />}
    </section>
  );
}

/** Tidak/Ya lalu daftar centang. Mencentang = keadaan `sasaran`; melepas centang atau memilih Tidak = kembali "masih hidup". */
function TanyaDaftar({ kasus, ubah, calon, sasaran, pertanyaan }: {
  kasus: Kasus; ubah: Props['ubah']; calon: CalonLanjutan[]; sasaran: PilihanKeadaan; pertanyaan: string;
}) {
  const idTanya = useId();
  const terpilih = calon.filter(({ id }) => keadaanTerpilih(kasus, id) === sasaran);
  const [ya, setYa] = useState(false);
  const terbuka = ya || terpilih.length > 0;
  const pilihTidak = () => {
    setYa(false);
    if (terpilih.length) ubah(k => terpilih.reduce((hasil, { id, milik }) => pilihKeadaan(hasil, id, 'hidup', milik), k));
  };
  return (
    <>
      <h3 id={idTanya} className="pertanyaan-bagian">{pertanyaan}</h3>
      <div className="ya-tidak" role="radiogroup" aria-labelledby={idTanya}>
        <button type="button" role="radio" aria-checked={!terbuka} onClick={pilihTidak}>{t('hitung.kanvas.tidak')}</button>
        <button type="button" role="radio" aria-checked={terbuka} onClick={() => setYa(true)}>{t('hitung.kanvas.ya')}</button>
      </div>
      {terbuka && (
        <ul className="centang-anak" role="group" aria-labelledby={idTanya}>
          {calon.map(satu => {
            const { id, milik } = satu;
            const dicentang = keadaanTerpilih(kasus, id) === sasaran;
            return (
              <li key={id}>
                <label><input type="checkbox" checked={dicentang}
                  onChange={event => ubah(k => pilihKeadaan(k, id, event.target.checked ? sasaran : 'hidup', milik))} />{labelCalon(kasus, satu)}</label>
                {dicentang && <LanjutanBaris kasus={kasus} id={id} milik={milik} terpilih={sasaran} ubah={ubah} />}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Nama yang diisi, atau sebutan peran seperti di kartunya ("Istri 1"). */
const labelCalon = (kasus: Kasus, { id, kunci, milik, jenis, nomor }: CalonLanjutan): string => {
  const peran = (jenis === 'saudaraKakek' ? SEBUTAN_SAUDARA_KAKEK[kunci]?.() : undefined) ?? namaPeran(kasus, kunci, milik);
  return kasus.graf.orang[id]?.nama || (jenisDari(kunci)?.maksimal === 1 ? peran : `${peran} ${nomor}`);
};
