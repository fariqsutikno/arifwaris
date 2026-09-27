// Tombol akun di header (spec akun pengguna "Login"): belum masuk → "Masuk dengan Google"; sudah masuk → tombol berinisial
// email dengan menu Keluar. Keluar mengirim perubahan dulu; yang belum terkirim ditanyakan sebelum data perangkat dihapus.
// Tanpa repo (env Supabase kosong) tidak tampil apa pun.

import { useState } from 'react';
import type { Sesi } from '@waris/data';
import { t } from '../terjemah';
import { DialogKonfirmasi } from '../ui/Dialog';
import { Tombol } from '../ui/komponen';
import { keluarDanBersihkan, kirimSebelumKeluar, type RepoAkun } from './sinkron';

export function TombolAkun({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  const [galat, setGalat] = useState(false);
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [belumTerkirim, setBelumTerkirim] = useState(0);
  if (!repo) return null;

  const keluar = async () => {
    setBelumTerkirim(0);
    try {
      await keluarDanBersihkan(repo);
      window.location.reload();
    } catch {
      setGalat(true);
    }
  };
  const cobaKeluar = async () => {
    setMenuTerbuka(false);
    const sisa = await kirimSebelumKeluar(repo);
    if (sisa > 0) setBelumTerkirim(sisa);
    else await keluar();
  };

  if (!sesi) return (
    <>
      <Tombol varian="secondary" kecil className="tombol-kepala"
        onClick={() => repo.akun.masukGoogle(window.location.href).catch(() => setGalat(true))}>{t('umum.masuk_dengan_google')}</Tombol>
      {galat && <p role="alert" className="pesan-akun">{t('umum.layanan_akun_tidak_tersedia')}</p>}
    </>
  );
  return (
    <div className="menu-akun" onKeyDown={event => { if (event.key === 'Escape') setMenuTerbuka(false); }}>
      <Tombol varian="secondary" kecil className="tombol-kepala" aria-label={sesi.email} aria-haspopup="menu" aria-expanded={menuTerbuka}
        onClick={() => setMenuTerbuka(!menuTerbuka)}>{sesi.email.slice(0, 1).toUpperCase()}</Tombol>
      {menuTerbuka && (
        <div role="menu" className="menu-akun-isi">
          <span className="keterangan">{sesi.email}</span>
          <button type="button" role="menuitem" onClick={() => void cobaKeluar()}>{t('umum.keluar')}</button>
        </div>
      )}
      {belumTerkirim > 0 && (
        <DialogKonfirmasi judul={t('umum.keluar')} labelLanjut={t('umum.tetap_keluar')}
          saatBatal={() => setBelumTerkirim(0)} saatLanjut={() => void keluar()}>
          <p>{t('umum.perubahan_belum_terkirim', { jumlah: belumTerkirim })}</p>
        </DialogKonfirmasi>
      )}
      {galat && <p role="alert" className="pesan-akun">{t('umum.gagal_keluar')}</p>}
    </div>
  );
}
