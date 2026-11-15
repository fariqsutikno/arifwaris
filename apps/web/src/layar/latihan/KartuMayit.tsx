// Satu kartu mayit: isian "− jumlah +" ahli warisnya, chip untuk menandai siapa yang wafat sebelum harta dibagi
// [R12-1], pertanyaan hamil, dan "Hal lain" (keadaan khusus orang di kartu). Melepas tanda yang menghapus keluarga orang itu meminta konfirmasi.

import { useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { labelOrangChecklist } from '../../checklist';
import type { Kasus } from '../../kasus';
import { namaSingkat, orangTerputus } from '../../keadaanOrang';
import { labelMayit, orangDiKartu, tandaiWafatSebelumDibagi } from '../../latihan';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { t } from '../../terjemah';
import { LangkahAhliWaris } from '../LangkahAhliWaris';
import { PertanyaanHamil } from '../keadaan/PertanyaanHamil';
import { HalLainKartu } from './HalLainKartu';

interface Props { kasus: Kasus; idMayit: IdOrang; nomor: number; ubah: (f: (k: Kasus) => Kasus) => void }

export function KartuMayit({ kasus, idMayit, nomor, ubah }: Props) {
  const [lepas, setLepas] = useState<{ id: IdOrang; terhapus: IdOrang[] } | null>(null);
  const nama = labelMayit(kasus, idMayit);
  const ketuk = (id: IdOrang) => {
    if (!kasus.urutanWafat.includes(id)) return ubah(k => tandaiWafatSebelumDibagi(k, id, true));
    const terhapus = orangTerputus(kasus, tandaiWafatSebelumDibagi(kasus, id, false));
    if (terhapus.length === 0) ubah(k => tandaiWafatSebelumDibagi(k, id, false));
    else setLepas({ id, terhapus });
  };
  return (
    <section className="kartu tumpuk kartu-mayit" id={`mayit-${idMayit}`} tabIndex={-1} aria-labelledby={`judul-mayit-${idMayit}`}>
      <h2 id={`judul-mayit-${idMayit}`} className="judul-bagian-kecil">
        {nomor === 1 ? t('hitung.latihan.mayit_pertama', { nama }) : t('hitung.latihan.mayit_ke', { nomor, nama })}
      </h2>
      {nomor > 1 && <p className="keterangan">{t('hitung.latihan.wafat_sesudah_sebelumnya')}</p>}
      <LangkahAhliWaris graf={kasus.graf} idMayit={idMayit} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
      <div className="chip-orang">
        {orangDiKartu(kasus, idMayit).map(id => {
          const bertanda = kasus.urutanWafat.includes(id);
          const label = labelOrangChecklist(kasus.graf, idMayit, id);
          return (
            <button key={id} type="button" aria-pressed={bertanda} onClick={() => ketuk(id)}>
              {label}{bertanda && <small>{t('hitung.latihan.wafat_sebelum_dibagi')}</small>}
            </button>
          );
        })}
      </div>
      <PertanyaanHamil kasus={kasus} idMayit={idMayit} ubah={ubah} />
      <HalLainKartu kasus={kasus} idMayit={idMayit} ubah={ubah} />
      {lepas && (
        <DialogKonfirmasi judul={t('hitung.latihan.lepas_tanda_judul', { nama: namaSingkat(kasus, lepas.id) })} labelLanjut={t('umum.lanjut')}
          saatBatal={() => setLepas(null)} saatLanjut={() => { ubah(k => tandaiWafatSebelumDibagi(k, lepas.id, false)); setLepas(null); }}>
          {t('hitung.latihan.lepas_tanda_isi', { nama: namaSingkat(kasus, lepas.id), daftar: lepas.terhapus.map(id => namaSingkat(kasus, id)).join(', ') })}
        </DialogKonfirmasi>
      )}
    </section>
  );
}
