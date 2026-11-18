// Dialog kecil "Tambah anak X" dari pohon layar penuh: nama (boleh kosong) dan jenis kelamin (wajib, tanpa bawaan).
// Simpan tanpa jenis kelamin tidak ditolak diam-diam: kekurangannya disebut. Menyerahkan nama + kelamin lewat saatSimpan.

import { useId, useState } from 'react';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';
import { Pilihan } from './wizard/DialogTambahOrang';

interface Props { namaOrangTua: string; saatSimpan: (jenisKelamin: 'L' | 'P', nama: string) => void; saatBatal: () => void }

export function DialogTambahAnak({ namaOrangTua, saatSimpan, saatBatal }: Props) {
  const id = useId();
  const [nama, setNama] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P' | null>(null);
  const [kurang, setKurang] = useState(false);
  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); saatBatal(); } }}>
      <form className="konfirmasi-isi" onSubmit={event => { event.preventDefault(); if (jenisKelamin) saatSimpan(jenisKelamin, nama.trim()); else setKurang(true); }}>
        <h2 id={`${id}-judul`}>{t('hitung.pohon.judul_tambah_anak', { nama: namaOrangTua })}</h2>
        <label className="isian isian-kecil">
          <span>{t('hitung.pohon.nama_orang')}</span>
          <input type="text" value={nama} autoComplete="off" onChange={event => setNama(event.target.value)} />
        </label>
        <Pilihan label={t('hitung.pohon.kelamin')} nilai={jenisKelamin} saatPilih={nilai => setJenisKelamin(nilai as 'L' | 'P')}
          daftar={[{ nilai: 'L', label: t('hitung.pohon.laki_laki') }, { nilai: 'P', label: t('hitung.pohon.perempuan') }]} />
        {kurang && !jenisKelamin && <p role="alert">{t('hitung.pohon.kelamin_wajib')}</p>}
        <div className="aksi-konfirmasi">
          <Tombol type="button" varian="secondary" onClick={saatBatal}>{t('hitung.pohon.batal')}</Tombol>
          <Tombol type="submit">{t('hitung.pohon.simpan')}</Tombol>
        </div>
      </form>
    </div>
  );
}
