// Bagian "Hal lain" (spec kanvas 5.2, bab 02): beda agama dan terlibat dalam wafatnya almarhum. Tidak ada/Ada tanpa
// bawaan; "Ada" membuka dua kelompok centang atas keluarga almarhum itu. Menerima Kasus + bagian; menyerahkan Kasus.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { anggotaHalLain, jawabHalLain, tandaiBedaAgama, tandaiTerlibat } from '../../halLain';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { bagianDijawab, type Bagian } from '../../kelompok';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; bagian: Bagian; ubah: (f: (k: Kasus) => Kasus) => void }

export function BagianHalLain({ kasus, bagian, ubah }: Props) {
  const anggota = anggotaHalLain(kasus, bagian.milik);
  const bertanda = anggota.some(id => kasus.graf.orang[id]!.agama === 'nonIslam' || kasus.graf.orang[id]!.membunuhPewaris);
  const [adaSementara, setAdaSementara] = useState(false);
  const ada = bertanda || adaSementara;
  const tidakAda = bagianDijawab(kasus, bagian) && !bertanda && !adaSementara;
  const pilih = (nilai: boolean) => { setAdaSementara(nilai); ubah(k => jawabHalLain(k, bagian.milik, nilai)); };
  return (
    <>
      <div className="ya-tidak" role="radiogroup" aria-labelledby="judul-bagian-aktif">
        <button type="button" role="radio" aria-checked={tidakAda} onClick={() => pilih(false)}>{t('umum.tidak_ada')}</button>
        <button type="button" role="radio" aria-checked={ada} onClick={() => pilih(true)}>{t('umum.ada')}</button>
      </div>
      {ada && (
        <>
          <KelompokCentang judul={t('hitung.kondisi_agama_judul')} keterangan={t('hitung.kondisi_agama_ket')} anggota={anggota} kasus={kasus}
            tercentang={id => kasus.graf.orang[id]!.agama === 'nonIslam'} saatUbah={(id, nilai) => ubah(k => tandaiBedaAgama(k, id, nilai))} />
          <KelompokCentang judul={t('hitung.kondisi_sebab_judul')} keterangan={t('hitung.kondisi_sebab_ket')} anggota={anggota} kasus={kasus}
            tercentang={id => !!kasus.graf.orang[id]!.membunuhPewaris} saatUbah={(id, nilai) => ubah(k => tandaiTerlibat(k, id, nilai))} />
        </>
      )}
    </>
  );
}

function KelompokCentang({ judul, keterangan, anggota, kasus, tercentang, saatUbah }: {
  judul: string; keterangan: string; anggota: IdOrang[]; kasus: Kasus;
  tercentang: (id: IdOrang) => boolean; saatUbah: (id: IdOrang, nilai: boolean) => void;
}) {
  return (
    <fieldset className="kelompok-centang">
      <legend><b>{judul}</b><small>{keterangan}</small></legend>
      {anggota.map(id => (
        <label key={id} className="centang"><input type="checkbox" checked={tercentang(id)} onChange={event => saatUbah(id, event.target.checked)} />
          <span>{namaSingkat(kasus, id)}</span></label>
      ))}
    </fieldset>
  );
}
