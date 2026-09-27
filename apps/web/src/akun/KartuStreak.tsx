// Kartu streak & XP di Beranda (spec tahap 5 "Web"). Hanya untuk yang login; angka dihitung server dari log_kegiatan.
// Selama memuat atau bila gagal, kartu tidak tampil sama sekali: lebih baik kosong daripada angka nol yang keliru.

import { useEffect, useState } from 'react';
import type { RingkasanPeringkat, Sesi } from '@waris/data';
import { tautanPeringkat } from '../rute';
import { panah, t } from '../terjemah';
import type { RepoAkun } from './sinkron';

export function KartuStreak({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  const [ringkasan, setRingkasan] = useState<RingkasanPeringkat | null>(null);
  useEffect(() => {
    setRingkasan(null);
    if (!sesi || !repo) return;
    let masihDipakai = true;
    repo.peringkat.ringkasanSaya()
      .then(hasil => { if (masihDipakai) setRingkasan(hasil); })
      .catch(galat => console.warn('ringkasan streak gagal dimuat:', galat));
    return () => { masihDipakai = false; };
  }, [sesi?.userId, repo]);
  if (!ringkasan) return null;

  return (
    <a className="kotak-status kartu-streak" href={tautanPeringkat()}>
      <span className="label-langkah">{t('akun.streak_dan_xp')}</span>
      <b>{t('akun.streak_hari', { jumlah: ringkasan.streakSekarang })}</b>
      <span className="keterangan">{t('akun.xp_total_dan_minggu_ini', { total: ringkasan.xpTotal, minggu: ringkasan.xpMingguIni })}</span>
      <span className="keterangan">{ringkasan.aktifHariIni ? t('akun.hari_ini_sudah_aktif') : t('akun.belajar_hari_ini_untuk_menjaga_streak')}</span>
      <span className="aksi-status">{t('akun.lihat_papan_peringkat')} {panah()}</span>
    </a>
  );
}
