// Daftar riwayat hitung: di beranda Hitung (dua pekan terakhir) dan penuh di #/riwayat; tiap entri bisa dihapus.
// Tiap entri: daftar ahli waris, sumbernya, harta (atau "Data belum lengkap"), dan kapan terakhir dibuka. Membuka entri
// memuat kasusnya ke layar hasil, atau ke langkah wizard yang belum lengkap; bila kalkulator sedang memuat kasus lain, tanya dulu.

import { useState } from 'react';
import { keJson, type Kasus } from '../kasus';
import { MASA_BERANDA, bacaRiwayat, hapusRiwayat, labelSumber, waktuRelatif, type EntriRiwayat } from '../riwayat';
import { tautanRiwayat } from '../rute';
import { DialogKonfirmasi } from '../ui/Dialog';
import { Ikon } from '../ui/Ikon';
import { TombolBukaKasus } from './belajar/TombolBukaKasus';
import { t } from '../terjemah';

interface Props { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void; ringkas?: boolean }

export function DaftarRiwayat({ kasusSekarang, saatBuka, ringkas }: Props) {
  const [daftar, setDaftar] = useState(bacaRiwayat);
  const sekarang = Date.now();
  const tampil = ringkas ? daftar.filter(entri => sekarang - entri.waktu <= MASA_BERANDA) : daftar;
  // Hapus satu entri atau semua selalu ditanya dulu; riwayat tidak bisa dikembalikan.
  const [akanDihapus, setAkanDihapus] = useState<EntriRiwayat | 'semua' | null>(null);
  const hapus = (id?: string) => { hapusRiwayat(id); setDaftar(bacaRiwayat()); };
  if (tampil.length === 0) {
    if (ringkas && daftar.length > 0) {
      return <p className="keterangan">{t('hitung.tidak_ada_yang_dibuka_dua_pekan')} <a href={tautanRiwayat()}>{t('hitung.lihat_semua_riwayat')}</a></p>;
    }
    return (
      <div className="kartu-kosong">
        <Ikon nama="riwayat" ukuran={32} />
        <b>{t('hitung.riwayat_hitung_masih_kosong')}</b>
        <p className="keterangan">{t('hitung.tiap_kasus_yang_kamu_mulai_dari')}</p>
      </div>
    );
  }
  return (
    <>
      <ul className="daftar-polos daftar-soal daftar-riwayat">
        {tampil.map(entri => (
          <li key={entri.id} className="baris-soal">
            <div className="isi-soal">
              <b>{entri.judul}</b>
              <span className="keterangan">
                <span className="sumber-riwayat">{labelSumber(entri.sumber)}</span> · {entri.keterangan} · {t('hitung.dibuka_waktu', { waktu: waktuRelatif(entri.waktu, sekarang) })}
              </span>
            </div>
            <TombolBukaKasus kasusSekarang={kasusSekarang && keJson(kasusSekarang) !== keJson(entri.kasus) ? kasusSekarang : null}
              saatBuka={() => saatBuka(entri)}>{entri.lengkap ? t('hitung.buka') : t('hitung.lanjut')}</TombolBukaKasus>
            <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setAkanDihapus(entri)} aria-label={t('hitung.hapus_judul', { judul: entri.judul })} title={t('umum.hapus')}><Ikon nama="sampah" ukuran={18} /></button>
          </li>
        ))}
      </ul>
      {ringkas ? <a href={tautanRiwayat()}>{t('hitung.lihat_semua_riwayat_jumlah', { jumlah: daftar.length })}</a>
        : <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm tombol-hapus-semua" onClick={() => setAkanDihapus('semua')}><Ikon nama="sampah" ukuran={18} />{t('hitung.hapus_semua_riwayat')}</button>}
      {akanDihapus && (
        <DialogKonfirmasi judul={akanDihapus === 'semua' ? t('hitung.hapus_semua_riwayat_2') : t('hitung.hapus_kasus_ini')}
          labelLanjut={akanDihapus === 'semua' ? t('umum.hapus_semua') : t('umum.hapus')} saatBatal={() => setAkanDihapus(null)}
          saatLanjut={() => { setAkanDihapus(null); hapus(akanDihapus === 'semua' ? undefined : akanDihapus.id); }}>
          <p>{akanDihapus === 'semua' ? t('hitung.jumlah_kasus', { jumlah: daftar.length }) : `"${akanDihapus.judul}"`} {t('hitung.akan_dihapus_dari_perangkat_ini_dan')}</p>
        </DialogKonfirmasi>
      )}
    </>
  );
}

export function HalamanRiwayat(props: Omit<Props, 'ringkas'>) {
  return (
    <main className="halaman tumpuk">
      <h1>{t('hitung.riwayat_hitung')}</h1>
      <p className="keterangan">{t('hitung.tersimpan_di_perangkat_ini_selama_30')}</p>
      <DaftarRiwayat {...props} />
    </main>
  );
}
