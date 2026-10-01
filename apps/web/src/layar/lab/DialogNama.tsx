// Dialog "Beri nama kasus": dipakai tombol Simpan di Hasil dan "Ganti nama" di Lab. Terisi nama saat ini; Simpan
// mengirim nama yang sudah dipangkas (nama kosong ditangani tersimpan.ts: kembali ke ringkasan otomatis).

import { useEffect, useId, useRef, useState } from 'react';
import { BATAS_JUDUL } from '../../tersimpan';
import { Tombol } from '../../ui/komponen';
import { t } from '../../terjemah';

interface Props { judulAwal: string; saatSimpan: (nama: string) => void; saatBatal: () => void }

export function DialogNama({ judulAwal, saatSimpan, saatBatal }: Props) {
  const id = useId();
  const [nama, setNama] = useState(judulAwal);
  const isian = useRef<HTMLInputElement>(null);
  useEffect(() => { isian.current?.select(); }, []);
  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`}
      onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <form className="konfirmasi-isi" onSubmit={event => { event.preventDefault(); saatSimpan(nama.trim()); }}>
        <h2 id={`${id}-judul`}>{t('hitung.lab_beri_nama')}</h2>
        <label className="isian">
          <span>{t('hitung.lab_nama_kasus')}</span>
          <input ref={isian} value={nama} maxLength={BATAS_JUDUL} placeholder={t('hitung.lab_nama_contoh')} autoComplete="off"
            onChange={event => setNama(event.target.value)} />
        </label>
        <div className="aksi-konfirmasi">
          <Tombol type="button" onClick={saatBatal}>{t('umum.batal')}</Tombol>
          <Tombol type="submit" varian="secondary">{t('umum.simpan')}</Tombol>
        </div>
      </form>
    </div>
  );
}
