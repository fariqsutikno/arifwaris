// Lonceng notifikasi di header: titik jumlah belum dibaca, panel kotak masuk (menu turun di layar lebar, lembar dari bawah di HP),
// dan dua tautan perangkat (aktifkan notifikasi, pasang aplikasi). Membuka panel tidak menandai dibaca; menutupnya yang menandai.

import { useEffect, useRef, useState } from 'react';
import { Ikon, IkonApi, type NamaIkon } from '../ui/Ikon';
import { bahasaArab, t } from '../terjemah';
import {
  bacaNotifikasi, hapusSemuaNotifikasi, PERISTIWA_NOTIFIKASI, tandaiSemuaDibaca, type JenisNotifikasi, type Notifikasi,
} from './gudang';
import { bisaDipasang, izinNotifikasi, mintaIzinNotifikasi, pasangAplikasi, PERISTIWA_PASANG } from './perangkat';

const IKON_JENIS: Record<Exclude<JenisNotifikasi, 'streak'>, NamaIkon> = { peringkat: 'peringkat', konten: 'segarkan', belajar: 'pelajaran', kasus: 'hitung' };
const SATUAN_WAKTU: Array<[Intl.RelativeTimeFormatUnit, number]> = [['day', 86_400_000], ['hour', 3_600_000], ['minute', 60_000]];

export function LonceNotifikasi() {
  const [daftar, setDaftar] = useState<Notifikasi[]>(bacaNotifikasi);
  const [terbuka, setTerbuka] = useState(false);
  const [izin, setIzin] = useState(izinNotifikasi);
  const [dapatDipasang, setDapatDipasang] = useState(bisaDipasang);
  const akar = useRef<HTMLDivElement>(null);
  const belumDibaca = daftar.filter(ini => !ini.dibaca).length;

  useEffect(() => {
    const segarkan = () => setDaftar(bacaNotifikasi());
    const segarkanPasang = () => setDapatDipasang(bisaDipasang());
    window.addEventListener(PERISTIWA_NOTIFIKASI, segarkan);
    window.addEventListener(PERISTIWA_PASANG, segarkanPasang);
    return () => { window.removeEventListener(PERISTIWA_NOTIFIKASI, segarkan); window.removeEventListener(PERISTIWA_PASANG, segarkanPasang); };
  }, []);

  const tutup = () => { setTerbuka(false); if (belumDibaca > 0) tandaiSemuaDibaca(); };
  useEffect(() => {
    if (!terbuka) return;
    const diLuar = (kejadian: PointerEvent) => { if (!akar.current?.contains(kejadian.target as Node)) tutup(); };
    document.addEventListener('pointerdown', diLuar);
    return () => document.removeEventListener('pointerdown', diLuar);
  });

  return (
    <div className="lonceng" ref={akar} onKeyDown={kejadian => { if (kejadian.key === 'Escape') tutup(); }}>
      <button type="button" className="tombol-lonceng" aria-haspopup="dialog" aria-expanded={terbuka}
        aria-label={belumDibaca > 0 ? t('notifikasi.buka_belum_dibaca', { jumlah: belumDibaca }) : t('notifikasi.buka')}
        onClick={() => (terbuka ? tutup() : setTerbuka(true))}>
        <Ikon nama="lonceng" ukuran={20} />
        {belumDibaca > 0 && <span className="titik-lonceng" aria-hidden="true">{belumDibaca > 9 ? '9+' : belumDibaca}</span>}
      </button>
      {terbuka && (
        <>
          <div className="tirai-lonceng" aria-hidden="true" />
          <section className="panel-lonceng" role="dialog" aria-label={t('notifikasi.judul')}>
            <header className="kepala-panel">
              <h2>{t('notifikasi.judul')}</h2>
              <span className="aksi-panel">
                {belumDibaca > 0 && <button type="button" className="tautan-teks" onClick={tandaiSemuaDibaca}>{t('notifikasi.tandai_dibaca')}</button>}
                {daftar.length > 0 && <button type="button" className="tautan-teks" onClick={hapusSemuaNotifikasi}>{t('notifikasi.hapus_semua')}</button>}
              </span>
            </header>
            {daftar.length === 0 ? <p className="kosong-panel">{t('notifikasi.kosong')}</p> : (
              <ul className="daftar-polos daftar-notif">
                {daftar.map(notif => <li key={notif.id}><Butir notif={notif} saatPilih={tutup} /></li>)}
              </ul>
            )}
            {(izin === 'default' || izin === 'denied' || izin === 'granted' || dapatDipasang) && (
              <footer className="kaki-panel">
                {izin === 'default' && <button type="button" className="tautan-teks" onClick={() => void mintaIzinNotifikasi().then(setIzin)}>{t('notifikasi.aktifkan_perangkat')}</button>}
                {izin === 'granted' && <span><Ikon nama="benar" ukuran={14} /> {t('notifikasi.perangkat_aktif')}</span>}
                {izin === 'denied' && <span>{t('notifikasi.perangkat_diblokir')}</span>}
                {dapatDipasang && <button type="button" className="tautan-teks" onClick={() => void pasangAplikasi()}>{t('notifikasi.pasang_aplikasi')}</button>}
              </footer>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Butir({ notif, saatPilih }: { notif: Notifikasi; saatPilih: () => void }) {
  const isi = (
    <>
      <span className={`ikon-notif jenis-${notif.jenis}`}>{notif.jenis === 'streak' ? <IkonApi ukuran={20} /> : <Ikon nama={IKON_JENIS[notif.jenis]} ukuran={20} />}</span>
      <span className="teks-notif"><b>{notif.judul}</b><span>{notif.isi}</span><small>{waktuRelatif(notif.waktu)}</small></span>
      {!notif.dibaca && <i className="penanda-baru" aria-label="•" />}
    </>
  );
  return notif.tautan
    ? <a className="butir-notif" href={notif.tautan} onClick={saatPilih}>{isi}</a>
    : <div className="butir-notif">{isi}</div>;
}

function waktuRelatif(waktu: number): string {
  const format = new Intl.RelativeTimeFormat(bahasaArab() ? 'ar' : 'id', { numeric: 'auto' });
  const selisih = waktu - Date.now();
  for (const [satuan, ms] of SATUAN_WAKTU) if (Math.abs(selisih) >= ms) return format.format(Math.round(selisih / ms), satuan);
  return format.format(0, 'second');
}
