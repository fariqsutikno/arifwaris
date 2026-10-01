// Streak di header (keputusan 2026-09-28, menggantikan kartu Beranda): ikon api + angka N yang menuju papan peringkat, redup
// bila hari ini belum aktif. Dimuat saat login dan tiap kegiatan sampai server (PERISTIWA_KEGIATAN_TERKIRIM); bila XP
// naik, "+N XP" tampil sebentar sebagai umpan balik. Tanpa login, memuat, atau gagal: tidak tampil apa-apa.

import { useEffect, useRef, useState } from 'react';
import type { Sesi } from '@waris/data';
import { tautanPeringkat } from '../rute';
import { t } from '../terjemah';
import { IkonApi, tanpaEmojiApi } from '../ui/Ikon';
import { useMuatRingkasan, useRingkasanSaya } from './ringkasan';
import type { RepoAkun } from './sinkron';

const LAMA_TAMPIL_TAMBAHAN_MS = 4000;

export function StreakKepala({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  useMuatRingkasan(sesi, repo);
  const ringkasan = useRingkasanSaya();
  const [tambahanXp, setTambahanXp] = useState(0);
  const xpSebelumnya = useRef<number | null>(null);

  useEffect(() => {
    if (!ringkasan) { xpSebelumnya.current = null; return; }
    const naik = xpSebelumnya.current === null ? 0 : ringkasan.xpTotal - xpSebelumnya.current;
    xpSebelumnya.current = ringkasan.xpTotal;
    if (naik <= 0) return;
    setTambahanXp(naik);
    const pewaktu = setTimeout(() => setTambahanXp(0), LAMA_TAMPIL_TAMBAHAN_MS);
    return () => clearTimeout(pewaktu);
  }, [ringkasan]);
  if (!ringkasan) return null;

  const keterangan = t('akun.streak_keterangan', { jumlah: ringkasan.streakSekarang, xp: ringkasan.xpTotal })
    + ' ' + (ringkasan.aktifHariIni ? t('akun.hari_ini_sudah_aktif') : t('akun.belajar_hari_ini_untuk_menjaga_streak'));
  return (
    <span className="streak-kepala">
      <a href={tautanPeringkat()} className={ringkasan.aktifHariIni ? 'tautan-streak' : 'tautan-streak redup'}
        aria-label={keterangan} title={keterangan}>
        <IkonApi />{tanpaEmojiApi(ringkasan.streakSekarang > 0 ? t('akun.streak_singkat', { jumlah: ringkasan.streakSekarang }) : t('akun.mulai_streak'))}
      </a>
      <span className="tambahan-xp" role="status">{tambahanXp > 0 ? t('akun.tambahan_xp', { jumlah: tambahanXp }) : ''}</span>
    </span>
  );
}
