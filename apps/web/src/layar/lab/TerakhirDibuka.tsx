// Terakhir dibuka: riwayat otomatis dua pekan (riwayat.ts), dikelompokkan per hari. Kolom cari hanya muncul bila entri
// banyak. "Simpan jadi eksperimen" memberi nama dan memindahkan kasus ke rak (tersimpan.ts). Kosong → tidak dirender.

import { useState } from 'react';
import { BATAS_TAMPIL_CARI, cariEntri, kelompokkanRiwayat, type KelompokHari } from '../../lab';
import { keJson, type Kasus } from '../../kasus';
import { MASA_BERANDA, bacaRiwayat, labelSumber, waktuRelatif, type EntriRiwayat } from '../../riwayat';
import { tautanRiwayat } from '../../rute';
import { bacaTersimpan, simpanKasus } from '../../tersimpan';
import { TombolBukaKasus } from '../belajar/TombolBukaKasus';
import { DialogNama } from './DialogNama';
import { t } from '../../terjemah';

const LABEL_KELOMPOK: Record<KelompokHari, () => string> = {
  hariIni: () => t('hitung.lab_hari_ini'),
  kemarin: () => t('hitung.lab_kemarin'),
  pekanIni: () => t('hitung.lab_pekan_ini'),
  lebihLama: () => t('hitung.lab_lebih_lama'),
};

export function TerakhirDibuka({ kasusSekarang, saatBuka }: { kasusSekarang: Kasus | null; saatBuka: (entri: EntriRiwayat) => void }) {
  const sekarang = Date.now();
  // Kasus yang sudah tersimpan di rak (id dan isi sama) tidak diulang di sini.
  const [daftar] = useState(() => {
    const dirak = new Map(bacaTersimpan().map(baris => [baris.id, keJson(baris.kasus)]));
    return bacaRiwayat().filter(entri => sekarang - entri.waktu <= MASA_BERANDA && dirak.get(entri.id) !== keJson(entri.kasus));
  });
  const [kata, setKata] = useState('');
  const [diberiNama, setDiberiNama] = useState<EntriRiwayat | null>(null);
  if (daftar.length === 0) return null;
  const tampil = cariEntri(daftar, kata);
  return (
    <section className="bagian-lab lab-terakhir" aria-labelledby="judul-lab-terakhir">
      <h2 id="judul-lab-terakhir" className="judul-bagian">{t('hitung.lab_terakhir_dibuka')}</h2>
      <p className="keterangan">{t('hitung.lab_terakhir_ket')}</p>
      {daftar.length > BATAS_TAMPIL_CARI && (
        <label className="isian isian-kecil">
          <span className="sembunyi-visual">{t('hitung.lab_cari')}</span>
          <input type="search" value={kata} placeholder={t('hitung.lab_cari')} aria-label={t('hitung.lab_cari')} onChange={event => setKata(event.target.value)} />
        </label>
      )}
      {tampil.length === 0 && <p className="keterangan">{t('hitung.lab_tidak_ketemu')}</p>}
      {kelompokkanRiwayat(tampil, sekarang).map(({ kelompok, isi }) => (
        <div key={kelompok} className="lab-kelompok">
          <h3 className="label-langkah">{LABEL_KELOMPOK[kelompok]()}</h3>
          <ul className="daftar-polos daftar-soal daftar-riwayat">
            {isi.map(entri => (
              <li key={entri.id} className="baris-soal">
                <div className="isi-soal">
                  <b>{entri.judul}</b>
                  <span className="keterangan">
                    <span className="sumber-riwayat">{labelSumber(entri.sumber)}</span> · {entri.keterangan} · {t('hitung.dibuka_waktu', { waktu: waktuRelatif(entri.waktu, sekarang) })}
                  </span>
                </div>
                <TombolBukaKasus kasusSekarang={kasusSekarang && keJson(kasusSekarang) !== keJson(entri.kasus) ? kasusSekarang : null} saatBuka={() => saatBuka(entri)}>
                  {entri.lengkap ? t('hitung.buka') : t('hitung.lanjut')}
                </TombolBukaKasus>
                <button type="button" className="tautan-aksi" onClick={() => setDiberiNama(entri)}>{t('hitung.lab_simpan_jadi_eksperimen')}</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <a href={tautanRiwayat()}>{t('hitung.lihat_semua_riwayat')}</a>
      {diberiNama && <DialogNama judulAwal={diberiNama.judul} saatBatal={() => setDiberiNama(null)}
        saatSimpan={nama => { simpanKasus(diberiNama.id, diberiNama.kasus, nama); setDiberiNama(null); }} />}
    </section>
  );
}
