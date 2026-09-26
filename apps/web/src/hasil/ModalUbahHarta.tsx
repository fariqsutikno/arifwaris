// Ubah harta cepat dari layar hasil: hanya nominal harta peninggalan yang diganti. Biaya jenazah, hutang, dan wasiat
// tetap; pratinjau "yang dibagi" dari hitungTirkah engine. Batal = tidak ada yang berubah.

import { useEffect, useRef, useState } from 'react';
import { hitungTirkah } from '@waris/engine';
import { formatRupiah } from '../format';
import type { Kasus } from '../kasus';
import { IsianUang } from '../layar/wizard/IsianUang';
import { t } from '../terjemah';

interface Props { kasus: Kasus; saatSimpan: (kotor: bigint) => void; saatTutup: () => void; saatBukaKewajiban: () => void }

export function ModalUbahHarta({ kasus, saatSimpan, saatTutup, saatBukaKewajiban }: Props) {
  const [kotor, setKotor] = useState(kasus.tirkah.kotor);
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLInputElement>('input')?.focus(); }, []);
  const { jejak } = hitungTirkah({ ...kasus.tirkah, kotor });

  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang modal-kecil" role="dialog" aria-modal="true" aria-label={t('Ubah harta peninggalan')} ref={wadah}
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className="kepala-modal netral"><div><h2>{t('Ubah harta peninggalan')}</h2></div></header>
        <div className="isi-modal">
          <IsianUang id="ubah-harta" label={t('Harta peninggalan')} nilai={kotor} saatUbah={setKotor} besar />
          {kasus.rincianHarta && <p className="catatan-info">{t('Rincian per jenis akan diganti dengan total baru ini.')}</p>}
          <div className="hitungan-berjalan">
            <div className="potongan"><span>{t('Pengurusan jenazah')}</span><span>−{formatRupiah(jejak.tajhiz)}</span></div>
            <div className="potongan"><span>{t('Hutang')}</span><span>−{formatRupiah(jejak.hutang)}</span></div>
            <div className="potongan"><span>{t('Wasiat')}</span><span>−{formatRupiah(jejak.wasiatDipakai)}</span></div>
            <div className="garis-total"><b>{t('Dibagi ke ahli waris')}</b><b className="hitungan-total">{formatRupiah(jejak.bersih)}</b></div>
          </div>
          <p className="caption-isian">
            {t('Biaya jenazah, hutang, dan wasiat tidak ikut berubah.')}{' '}
            <button type="button" className="tautan-teks" onClick={saatBukaKewajiban}>{t('Mau ubah juga? Buka langkah Kewajiban.')}</button>
          </p>
          {jejak.bersih === 0n && kotor > 0n && <p className="peringatan-isian" role="status">Hutang dan biaya jenazah menghabiskan seluruh harta; tidak ada yang dibagi.</p>}
        </div>
        <footer className="kaki-modal">
          <button type="button" className="aw-btn aw-btn-ghost aw-btn-sm" onClick={saatTutup}>{t('Batal')}</button>
          <span className="pengisi" />
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" disabled={kotor === 0n} onClick={() => saatSimpan(kotor)}>{t('Simpan')}</button>
        </footer>
      </div>
    </div>
  );
}
