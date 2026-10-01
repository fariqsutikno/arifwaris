// Satu kasus sebagai berkas berwarna: pohon mini, nama, ringkasan, status (Tersimpan / Sementara), dan aksi yang sama
// untuk semua kasus: Buka, Simpan (sementara) atau Ganti nama (tersimpan), dan Hapus. Dialog nama dan konfirmasi hapus
// hidup di sini supaya Awal Lab dan halaman Kasusmu memakai perilaku yang sama.

import { useState } from 'react';
import { keJson, type Kasus } from '../../kasus';
import { hapusKasus, type KasusKu } from '../../kasusmu';
import { waktuRelatif, type EntriRiwayat } from '../../riwayat';
import { simpanKasus, ubahJudul } from '../../tersimpan';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { TombolBukaKasus } from '../belajar/TombolBukaKasus';
import { DialogNama } from './DialogNama';
import { PohonSusunan } from './PohonSusunan';
import { angka, t } from '../../terjemah';

const SKALA_BERKAS = 0.55;

interface Props { kasus: KasusKu; kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void; saatBerubah: () => void }

export function BerkasKasus({ kasus, kasusSekarang, saatBuka, saatBerubah }: Props) {
  const [dialog, setDialog] = useState<'nama' | 'hapus' | null>(null);
  const tutup = () => setDialog(null);
  return (
    <>
      <span className={kasus.tersimpan ? 'lab-status tersimpan' : 'lab-status'}>
        {kasus.tersimpan ? t('hitung.lab_status_tersimpan') : `${t('hitung.lab_status_sementara')} · ${t('hitung.lab_sisa_hari', { jumlah: angka(String(kasus.sisaHari)) })}`}
      </span>
      <PohonSusunan kasus={kasus.kasus} skalaMaks={SKALA_BERKAS} />
      <h3>{kasus.judul}</h3>
      <p className="keterangan">{kasus.keterangan} · {t('hitung.dibuka_waktu', { waktu: waktuRelatif(kasus.waktu, Date.now()) })}</p>
      <div className="lab-berkas-aksi">
        <TombolBukaKasus kasusSekarang={kasusSekarang && keJson(kasusSekarang) !== keJson(kasus.kasus) ? kasusSekarang : null} saatBuka={() => saatBuka(kasus)}>
          {kasus.lengkap ? t('hitung.buka') : t('hitung.lanjut')}
        </TombolBukaKasus>
        <button type="button" className="tautan-aksi" aria-label={`${kasus.tersimpan ? t('hitung.lab_ganti_nama') : t('hitung.lab_simpan')} ${kasus.judul}`} onClick={() => setDialog('nama')}>
          {kasus.tersimpan ? t('hitung.lab_ganti_nama') : t('hitung.lab_simpan')}
        </button>
        <button type="button" className="tautan-aksi" aria-label={t('hitung.hapus_judul', { judul: kasus.judul })} onClick={() => setDialog('hapus')}>{t('umum.hapus')}</button>
      </div>
      {dialog === 'nama' && (
        <DialogNama judulAwal={kasus.judul} saatBatal={tutup}
          saatSimpan={nama => { if (kasus.tersimpan) ubahJudul(kasus.id, nama); else simpanKasus(kasus.id, kasus.kasus, nama); tutup(); saatBerubah(); }} />
      )}
      {dialog === 'hapus' && (
        <DialogKonfirmasi judul={t('hitung.hapus_kasus_ini')} labelLanjut={t('umum.hapus')} saatBatal={tutup}
          saatLanjut={() => { hapusKasus(kasus.id); tutup(); saatBerubah(); }}>
          <p>{`"${kasus.judul}"`} {kasus.tersimpan ? t('hitung.lab_hapus_tersimpan_isi') : t('hitung.akan_dihapus_dari_perangkat_ini_dan')}</p>
        </DialogKonfirmasi>
      )}
    </>
  );
}
