// Profil untuk papan peringkat (spec tahap 5 "Web"): nama tampilan, ikut papan (opt-in), avatar, zona waktu batas hari.
// Dibaca & disimpan langsung ke server (tidak lewat antrean). Belum pernah diatur → nama depan dari Google, tidak ikut,
// zona waktu perangkat bila termasuk pilihan, selain itu WIB.

import { useEffect, useState } from 'react';
import type { Profil, Sesi } from '@waris/data';
import { t } from '../terjemah';
import type { RepoAkun } from './sinkron';

const PANJANG_NAMA_MAKS = 40;
const ZONA_INDONESIA = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];

interface Props {
  sesi: Sesi;
  repo: RepoAkun;
  /** Dibuka dari ajakan "ikut papan": sakelar ikut sudah menyala. */
  ajakIkut?: boolean;
  saatTutup: () => void;
  saatTersimpan: (profil: Profil) => void;
}

export function ModalProfil({ sesi, repo, ajakIkut, saatTutup, saatTersimpan }: Props) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [galat, setGalat] = useState<'muat' | 'simpan' | null>(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  useEffect(() => {
    repo.pengguna.bacaProfil()
      .then(tersimpan => setProfil(tersimpan ? { ...tersimpan, ikutPapanPeringkat: tersimpan.ikutPapanPeringkat || !!ajakIkut } : profilBawaan(sesi, !!ajakIkut)))
      .catch(() => setGalat('muat'));
  }, []);

  const nama = profil?.namaTampilan.trim() ?? '';
  const simpan = async () => {
    if (!profil || !nama) return;
    setSedangSimpan(true);
    try {
      await repo.pengguna.simpanProfil({ ...profil, namaTampilan: nama });
      saatTersimpan({ ...profil, namaTampilan: nama });
    } catch {
      setGalat('simpan');
      setSedangSimpan(false);
    }
  };
  const ubah = (sebagian: Partial<Profil>) => setProfil(lama => lama && { ...lama, ...sebagian });

  return (
    <div className="modal-latar" onClick={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <div className="modal-orang modal-kecil" role="dialog" aria-modal="true" aria-label={t('akun.profil')}
        onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
        <header className="kepala-modal netral"><div><h2>{t('akun.profil')}</h2></div></header>
        <div className="isi-modal tumpuk-rapat">
          {galat === 'muat' && <p role="alert" className="peringatan-isian">{t('akun.profil_gagal_dimuat')}</p>}
          {profil && (
            <>
              <label className="isian isian-kecil">
                <span>{t('akun.nama_tampilan')}</span>
                <input value={profil.namaTampilan} maxLength={PANJANG_NAMA_MAKS} autoComplete="nickname"
                  onChange={event => ubah({ namaTampilan: event.target.value })} />
              </label>
              {!nama && <p className="isian-salah">{t('akun.nama_tampilan_wajib_diisi')}</p>}
              <label className="isian-centang">
                <input type="checkbox" checked={profil.ikutPapanPeringkat} onChange={event => ubah({ ikutPapanPeringkat: event.target.checked })} />
                <span>{t('akun.tampilkan_namaku_di_papan_peringkat')}</span>
              </label>
              <label className="isian-centang">
                <input type="checkbox" checked={profil.tampilkanAvatar} disabled={!profil.ikutPapanPeringkat}
                  onChange={event => ubah({ tampilkanAvatar: event.target.checked })} />
                <span>{t('akun.tampilkan_foto_google')}</span>
              </label>
              <label className="isian isian-kecil">
                <span>{t('akun.zona_waktu')}</span>
                <select value={profil.zonaWaktu} onChange={event => ubah({ zonaWaktu: event.target.value })}>
                  {pilihanZona(profil.zonaWaktu).map(zona => <option key={zona} value={zona}>{labelZona(zona)}</option>)}
                </select>
                <small className="caption-isian">{t('akun.hari_berganti_pukul_00_00_di_zona_ini')}</small>
              </label>
              {galat === 'simpan' && <p role="alert" className="peringatan-isian">{t('akun.profil_gagal_disimpan')}</p>}
            </>
          )}
        </div>
        <footer className="kaki-modal">
          <button type="button" className="aw-btn aw-btn-ghost aw-btn-sm" onClick={saatTutup}>{t('umum.batal')}</button>
          <span className="pengisi" />
          <button type="button" className="aw-btn aw-btn-primary aw-btn-sm" disabled={!profil || !nama || sedangSimpan}
            onClick={() => void simpan()}>{t('umum.simpan')}</button>
        </footer>
      </div>
    </div>
  );
}

function profilBawaan(sesi: Sesi, ikut: boolean): Profil {
  const namaDepan = (sesi.nama ?? sesi.email.split('@')[0] ?? '').trim().split(/\s+/)[0] ?? '';
  const zonaPerangkat = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    namaTampilan: namaDepan.slice(0, PANJANG_NAMA_MAKS), ikutPapanPeringkat: ikut, tampilkanAvatar: false,
    zonaWaktu: ZONA_INDONESIA.includes(zonaPerangkat) ? zonaPerangkat : 'Asia/Jakarta',
  };
}

/** Tiga zona Indonesia, ditambah zona perangkat dan zona tersimpan bila di luar negeri. */
const pilihanZona = (tersimpan: string): string[] =>
  [...new Set([...ZONA_INDONESIA, Intl.DateTimeFormat().resolvedOptions().timeZone, tersimpan])];

function labelZona(zona: string): string {
  switch (zona) {
    case 'Asia/Jakarta': return t('akun.zona_wib');
    case 'Asia/Makassar': return t('akun.zona_wita');
    case 'Asia/Jayapura': return t('akun.zona_wit');
    default: return zona;
  }
}
