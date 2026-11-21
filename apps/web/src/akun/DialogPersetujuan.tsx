// Dialog sekali setelah masuk (dan tiap versi kebijakan naik): ringkasan + tautan kebijakan lengkap; aksi utama Setuju.
// Tidak setuju = keluar dari akun; kalkulator dan belajar tanpa akun tetap jalan.

import { useState } from 'react';
import type { RepoAkun } from './sinkron';
import { VERSI_KEBIJAKAN_PRIVASI } from './persetujuan';
import { tautanPrivasi } from '../rute';
import { t } from '../terjemah';
import { Tombol } from '../ui/komponen';

interface Props { repo: RepoAkun; saatSetuju: () => void; saatKeluar: () => void }

export function DialogPersetujuan({ repo, saatSetuju, saatKeluar }: Props) {
  const [galat, setGalat] = useState(false);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const setuju = async () => {
    setSedangSimpan(true);
    try {
      await repo.pengguna.aturPersetujuan('kebijakan_privasi', true, VERSI_KEBIJAKAN_PRIVASI);
      saatSetuju();
    } catch {
      setGalat(true);
      setSedangSimpan(false);
    }
  };
  return (
    <div className="modal-latar">
      <div className="modal-orang modal-kecil" role="dialog" aria-modal="true" aria-label={t('privasi.dialog_judul')}>
        <header className="kepala-modal netral"><div><h2>{t('privasi.dialog_judul')}</h2></div></header>
        <div className="isi-modal tumpuk-rapat">
          <p>{t('privasi.dialog_ringkas')}</p>
          <p><a className="tautan-teks" href={tautanPrivasi()} target="_blank" rel="noreferrer">{t('privasi.baca_lengkap')}</a></p>
          {galat && <p role="alert" className="peringatan-isian">{t('akun.profil_gagal_disimpan')}</p>}
        </div>
        <footer className="kaki-modal">
          <button type="button" className="tautan-teks" onClick={saatKeluar}>{t('privasi.menolak_keluar')}</button>
          <span className="pengisi" />
          <Tombol varian="primary" kecil disabled={sedangSimpan} onClick={() => void setuju()}>{t('privasi.setuju')}</Tombol>
        </footer>
      </div>
    </div>
  );
}
