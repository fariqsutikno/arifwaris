// Streak di header (keputusan 2026-09-28, menggantikan kartu Beranda): teks "🔥 N" yang menuju papan peringkat, redup
// bila hari ini belum aktif. Dimuat saat login dan tiap kegiatan sampai server (PERISTIWA_KEGIATAN_TERKIRIM); bila XP
// naik, "+N XP" tampil sebentar sebagai umpan balik. Tanpa login, memuat, atau gagal: tidak tampil apa-apa.

import { useEffect, useRef, useState } from 'react';
import type { RingkasanPeringkat, Sesi } from '@waris/data';
import { tautanPeringkat } from '../rute';
import { t } from '../terjemah';
import { PERISTIWA_KEGIATAN_TERKIRIM } from './antrean';
import type { RepoAkun } from './sinkron';

const LAMA_TAMPIL_TAMBAHAN_MS = 4000;

export function StreakKepala({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  const [ringkasan, setRingkasan] = useState<RingkasanPeringkat | null>(null);
  const [tambahanXp, setTambahanXp] = useState(0);
  const xpSebelumnya = useRef<number | null>(null);

  useEffect(() => {
    setRingkasan(null);
    xpSebelumnya.current = null;
    if (!sesi || !repo) return;
    let masihDipakai = true;
    let pewaktu: ReturnType<typeof setTimeout> | undefined;
    const muat = () => repo.peringkat.ringkasanSaya()
      .then(hasil => {
        if (!masihDipakai) return;
        const naik = xpSebelumnya.current === null ? 0 : hasil.xpTotal - xpSebelumnya.current;
        xpSebelumnya.current = hasil.xpTotal;
        setRingkasan(hasil);
        if (naik > 0) {
          setTambahanXp(naik);
          clearTimeout(pewaktu);
          pewaktu = setTimeout(() => setTambahanXp(0), LAMA_TAMPIL_TAMBAHAN_MS);
        }
      })
      .catch(galat => console.warn('streak gagal dimuat:', galat));
    void muat();
    window.addEventListener(PERISTIWA_KEGIATAN_TERKIRIM, muat);
    return () => { masihDipakai = false; clearTimeout(pewaktu); window.removeEventListener(PERISTIWA_KEGIATAN_TERKIRIM, muat); };
  }, [sesi?.userId, repo]);
  if (!ringkasan) return null;

  const keterangan = t('akun.streak_keterangan', { jumlah: ringkasan.streakSekarang, xp: ringkasan.xpTotal })
    + ' ' + (ringkasan.aktifHariIni ? t('akun.hari_ini_sudah_aktif') : t('akun.belajar_hari_ini_untuk_menjaga_streak'));
  return (
    <span className="streak-kepala">
      <a href={tautanPeringkat()} className={ringkasan.aktifHariIni ? 'tautan-streak' : 'tautan-streak redup'}
        aria-label={keterangan} title={keterangan}>
        {ringkasan.streakSekarang > 0 ? t('akun.streak_singkat', { jumlah: ringkasan.streakSekarang }) : t('akun.mulai_streak')}
      </a>
      <span className="tambahan-xp" role="status">{tambahanXp > 0 ? t('akun.tambahan_xp', { jumlah: tambahanXp }) : ''}</span>
    </span>
  );
}
