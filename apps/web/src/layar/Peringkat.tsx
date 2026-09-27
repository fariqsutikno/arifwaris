// Papan peringkat (spec tahap 5 "Web"): tab Mingguan / Sepanjang waktu. Semua orang bisa melihat; hanya pengguna yang
// memilih ikut yang tampil. Belum login → ajakan masuk; login tapi belum ikut → ajakan ikut lewat ModalProfil.
// Baris sendiri disorot dan tetap tampil meski di luar batas.

import { useEffect, useState } from 'react';
import type { BarisPeringkat, PeriodePeringkat, Profil, Sesi } from '@waris/data';
import { ModalProfil } from '../akun/ModalProfil';
import type { RepoAkun } from '../akun/sinkron';
import { t } from '../terjemah';
import { Tombol } from '../ui/komponen';

type Papan = { status: 'memuat' } | { status: 'gagal' } | { status: 'siap'; daftar: BarisPeringkat[] };

export function Peringkat({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  const [periode, setPeriode] = useState<PeriodePeringkat>('minggu');
  const [papan, setPapan] = useState<Papan>({ status: 'memuat' });
  const [profil, setProfil] = useState<Profil | null>(null);
  const [modal, setModal] = useState<'tutup' | 'ubah' | 'ikut'>('tutup');
  const [versi, setVersi] = useState(0);
  const [galatMasuk, setGalatMasuk] = useState(false);

  useEffect(() => {
    if (!repo) return;
    let masihDipakai = true;
    setPapan({ status: 'memuat' });
    repo.peringkat.papan(periode)
      .then(daftar => { if (masihDipakai) setPapan({ status: 'siap', daftar }); })
      .catch(() => { if (masihDipakai) setPapan({ status: 'gagal' }); });
    return () => { masihDipakai = false; };
  }, [repo, periode, sesi?.userId, versi]);
  useEffect(() => {
    if (sesi && repo) repo.pengguna.bacaProfil().then(setProfil).catch(() => setProfil(null));
  }, [repo, sesi?.userId]);

  const tersimpan = (baru: Profil) => { setProfil(baru); setModal('tutup'); setVersi(versi + 1); };

  return (
    <main className="halaman tumpuk">
      <header className="tumpuk-rapat">
        <h1>{t('akun.papan_peringkat')}</h1>
        <p className="lead">{t('akun.xp_dari_pelajaran_soal_dan_kuis')}</p>
      </header>

      {!repo ? <p className="catatan-info">{t('umum.layanan_akun_tidak_tersedia')}</p> : (
        <>
          {!sesi ? (
            <div className="kotak-status">
              <b>{t('akun.masuk_untuk_ikut_papan_peringkat')}</b>
              <Tombol kecil onClick={() => void repo.akun.masukGoogle(window.location.href).catch(() => setGalatMasuk(true))}>
                {t('umum.masuk_dengan_google')}
              </Tombol>
              {galatMasuk && <p role="alert" className="peringatan-isian">{t('umum.layanan_akun_tidak_tersedia')}</p>}
            </div>
          ) : !profil?.ikutPapanPeringkat ? (
            <div className="kotak-status">
              <b>{t('akun.namamu_belum_tampil_di_papan')}</b>
              <span className="keterangan">{t('akun.ikut_papan_hanya_menampilkan_nama')}</span>
              <Tombol kecil onClick={() => setModal('ikut')}>{t('akun.ikut_papan_peringkat')}</Tombol>
            </div>
          ) : (
            <button type="button" className="tautan-teks" onClick={() => setModal('ubah')}>{t('akun.ubah_profil')}</button>
          )}

          <div className="tab-kecil" role="tablist" aria-label={t('akun.periode')}>
            <button type="button" role="tab" aria-selected={periode === 'minggu'} onClick={() => setPeriode('minggu')}>{t('akun.minggu_ini')}</button>
            <button type="button" role="tab" aria-selected={periode === 'semua'} onClick={() => setPeriode('semua')}>{t('akun.sepanjang_waktu')}</button>
          </div>

          {papan.status === 'memuat' ? <p className="keterangan" role="status">{t('akun.memuat')}</p>
            : papan.status === 'gagal' ? <p className="peringatan-isian" role="alert">{t('akun.papan_gagal_dimuat')}</p>
            : papan.daftar.length === 0 ? <p className="keterangan">{periode === 'minggu' ? t('akun.belum_ada_xp_minggu_ini') : t('akun.belum_ada_peserta')}</p>
            : <DaftarPeringkat daftar={papan.daftar} />}
        </>
      )}

      {modal !== 'tutup' && sesi && repo && (
        <ModalProfil sesi={sesi} repo={repo} ajakIkut={modal === 'ikut'} saatTutup={() => setModal('tutup')} saatTersimpan={tersimpan} />
      )}
    </main>
  );
}

function DaftarPeringkat({ daftar }: { daftar: BarisPeringkat[] }) {
  return (
    <ol className="daftar-polos daftar-peringkat">
      {daftar.map(baris => (
        <li key={`${baris.peringkat}-${baris.namaTampilan}-${baris.saya}`} className={baris.saya ? 'baris-peringkat baris-saya' : 'baris-peringkat'}
          aria-current={baris.saya ? 'true' : undefined}>
          <span className="nomor-peringkat">{t('akun.nomor_peringkat', { nomor: baris.peringkat })}</span>
          {baris.avatar ? <img className="avatar-peringkat" src={baris.avatar} alt="" referrerPolicy="no-referrer" />
            : <span className="avatar-peringkat" aria-hidden="true">{baris.namaTampilan.slice(0, 1).toUpperCase()}</span>}
          <span className="nama-peringkat">
            <b>{baris.namaTampilan}</b>{baris.saya && <small> {t('akun.kamu')}</small>}
            {baris.streakSekarang > 0 && <small className="keterangan">{t('akun.streak_hari', { jumlah: baris.streakSekarang })}</small>}
          </span>
          <b className="xp-peringkat">{t('akun.jumlah_xp', { jumlah: baris.xp })}</b>
        </li>
      ))}
    </ol>
  );
}
