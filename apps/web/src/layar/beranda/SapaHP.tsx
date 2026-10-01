// Sapaan Beranda di HP (tampilan "aplikasi"): "Ahlan, {nama}" dan isian nama, lalu contoh hitungan di bawahnya.
// KartuStreak punya bagian sendiri di Beranda (satu bagian satu fungsi); file ini hanya menyimpan komponennya.
// Nama panggilan disimpan di perangkat (tanpa login); bila belum ada dan pengguna masuk dengan Google, nama depan Google dipakai.
// Streak dari server (ringkasan.ts); tamu diajak masuk bila akun tersedia, selain itu kartu tidak tampil.

import { useState, type FormEvent } from 'react';
import type { Sesi } from '@waris/data';
import { useRingkasanSaya } from '../../akun/ringkasan';
import { bacaMentah, simpanMentah } from '../../penyimpanan';
import { angka, bahasaArab, t } from '../../terjemah';
import { Ikon, IkonApi } from '../../ui/Ikon';

const KUNCI_NAMA = 'arif-waris:nama';
const PANJANG_NAMA_MAKS = 24;
const HARI_DI_KARTU = 7;
const MS_HARI = 86_400_000;

export function SapaHP({ sesi }: { sesi: Sesi | null }) {
  const [nama, setNama] = useState(() => bacaMentah(KUNCI_NAMA)?.trim() ?? '');
  const [mengubah, setMengubah] = useState(false);
  const namaTampil = nama || sesi?.nama?.trim().split(/\s+/)[0] || '';
  const sedangMengisi = !namaTampil || mengubah;

  const simpan = (kejadian: FormEvent<HTMLFormElement>) => {
    kejadian.preventDefault();
    const isian = String(new FormData(kejadian.currentTarget).get('nama') ?? '').trim().slice(0, PANJANG_NAMA_MAKS);
    if (!isian) return;
    simpanMentah(KUNCI_NAMA, isian);
    setNama(isian);
    setMengubah(false);
  };

  return (
    <div className="sapa-hp">
      <div className="salam-hp">
        <p className="ahlan">{namaTampil ? t('beranda.ahlan') : t('beranda.ahlan_tamu')}</p>
        {namaTampil && <button type="button" className="nama-hp" aria-label={t('beranda.siapa_namamu')} onClick={() => setMengubah(true)}>
          <h1>{namaTampil}</h1><Ikon nama="pensil" ukuran={16} />
        </button>}
        <p className="ajakan-hp">{t('beranda.sapa_ajakan')}</p>
        {!namaTampil && <h1 className="sembunyi-visual">{t('beranda.waris_itu_gampang_asal_tahu_urutannya')}</h1>}
      </div>
      {sedangMengisi && (
        <form className="isi-nama" onSubmit={simpan}>
          <label htmlFor="nama-hp">{t('beranda.siapa_namamu')}</label>
          <div className="baris-isi-nama">
            <input id="nama-hp" name="nama" defaultValue={nama} maxLength={PANJANG_NAMA_MAKS} autoComplete="given-name" placeholder={t('beranda.nama_panggilan')} />
            <button type="submit" className="pil-hero pil-terang">{t('beranda.simpan_nama')}</button>
          </div>
          <small>{t('beranda.nama_catatan')}</small>
        </form>
      )}
    </div>
  );
}

/** Tracker streak: hanya untuk yang sudah masuk; tamu di HP melihat ajakan masuk (bila akun tersedia), di desktop tidak ada. */
export function KartuStreak({ sesi, saatMasuk }: { sesi: Sesi | null; saatMasuk?: (() => void) | undefined }) {
  const ringkasan = useRingkasanSaya();
  if (ringkasan) {
    // Hari-hari beruntun berakhir hari ini bila sudah aktif, selain itu kemarin (hari ini masih bisa menyelamatkannya).
    const geser = ringkasan.aktifHariIni ? 0 : 1;
    const hari = Array.from({ length: HARI_DI_KARTU }, (_, urutan) => {
      const lalu = HARI_DI_KARTU - 1 - urutan;
      return { aktif: lalu >= geser && lalu < ringkasan.streakSekarang + geser, hariIni: lalu === 0, tanggal: new Date(Date.now() - lalu * MS_HARI) };
    });
    const format = new Intl.DateTimeFormat(bahasaArab() ? 'ar' : 'id', { weekday: 'narrow' });
    return (
      <section className="kartu-streak" aria-label={t('beranda.streak_hari', { jumlah: ringkasan.streakSekarang })}>
        <div className="atas-streak">
          <span className={ringkasan.aktifHariIni ? 'api-streak' : 'api-streak redup'}>{ringkasan.streakSekarang > 0 ? <IkonApi ukuran={34} /> : <Ikon nama="api" ukuran={30} />}</span>
          <div>
            <b className="angka-streak">{ringkasan.streakSekarang > 0 ? t('beranda.streak_hari', { jumlah: angka(String(ringkasan.streakSekarang)) }) : t('beranda.streak_mulai')}</b>
            <span>{ringkasan.streakSekarang === 0 ? t('beranda.streak_belum_mulai') : ringkasan.aktifHariIni ? t('beranda.streak_aman') : t('beranda.streak_belum_aman')}</span>
          </div>
          <span className="xp-streak">{t('beranda.xp_pekan', { xp: angka(String(ringkasan.xpMingguIni)) })}</span>
        </div>
        <ol className="hari-streak daftar-polos" aria-hidden="true">
          {hari.map(ini => (
            <li key={ini.tanggal.getTime()} className={`${ini.aktif ? 'aktif' : ''}${ini.hariIni ? ' hari-ini' : ''}`}>
              <i>{ini.aktif && <Ikon nama="benar" ukuran={12} />}</i><span>{format.format(ini.tanggal)}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }
  if (sesi || !saatMasuk) return null;
  return (
    <section className="kartu-streak tamu-streak">
      <span className="api-streak redup"><Ikon nama="api" ukuran={30} /></span>
      <div><b className="angka-streak">{t('beranda.streak_mulai')}</b><span>{t('beranda.streak_masuk')}</span></div>
      <button type="button" className="tautan-lanjut" onClick={saatMasuk}>{t('umum.masuk_dengan_google')}</button>
    </section>
  );
}
