// PilihanMenunggu = layar pilihan menunggu kelahiran (spec 1.6, [R13-17]), tampil sesudah Periksa bila ada janin.

import { useState } from 'react';
import type { Aksi } from '../keadaan';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

export function PilihanMenunggu({ kirim }: { kirim: (aksi: Aksi) => void }) {
  const [pilihan, setPilihan] = useState<'tunggu' | 'hitungSekarang' | null>(null);
  const lanjut = () => {
    if (!pilihan) return;
    kirim({ jenis: 'UBAH_KASUS', ubah: k => ({ ...k, pilihanJanin: pilihan }) });
    kirim({ jenis: 'KE_LAYAR', layar: 'hasil' });
  };
  return (
    <main className="halaman tumpuk hasil-khusus">
      <h1 className="judul-langkah" id="tanya-menunggu">{t('hitung.cerita.menunggu_tanya')}</h1>
      <p className="keterangan">{t('hitung.cerita.menunggu_ket')}</p>
      <div className="pilihan-dialog" role="radiogroup" aria-labelledby="tanya-menunggu">
        <button type="button" role="radio" aria-checked={pilihan === 'tunggu'} className="opsi-dialog" onClick={() => setPilihan('tunggu')}>
          <span>{t('hitung.cerita.tunggu')}</span><small>{t('hitung.cerita.tunggu_ket')}</small>
        </button>
        <button type="button" role="radio" aria-checked={pilihan === 'hitungSekarang'} className="opsi-dialog" onClick={() => setPilihan('hitungSekarang')}>
          <span>{t('hitung.cerita.hitung_sekarang')}</span><small>{t('hitung.cerita.hitung_sekarang_ket')}</small>
        </button>
      </div>
      <div className="chip-deret">
        <button type="button" className="tautan" onClick={() => kirim({ jenis: 'KE_LANGKAH', langkah: 4 })}>{t('umum.kembali_2')}</button>
        <Tombol disabled={!pilihan} onClick={lanjut}>{t('umum.lanjut')}</Tombol>
      </div>
    </main>
  );
}
