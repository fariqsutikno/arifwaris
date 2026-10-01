// Dialog "Bagikan kasus": siapa yang boleh membuka (hanya saya / yang punya tautan / email tertentu) dan tautan pendek buatan
// sendiri (unik). Pengaturan tersimpan di server (kasus_dibagikan); penerima hanya melihat. Tanpa login: ajakan masuk.

import { useEffect, useId, useState } from 'react';
import type { AksesBagikan, RepositoriBagikan, Sesi } from '@waris/data';
import { keJson, type Kasus } from '../kasus';
import { SLUG_BAGIKAN, alamatBagikan } from '../rute';
import { tandaiDibagikan } from '../bagikanLokal';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

interface Props {
  idRiwayat: string;
  kasus: Kasus;
  repo: RepositoriBagikan;
  sesi: Sesi | null;
  saatMasuk?: (() => void) | undefined;
  saatTutup: () => void;
}

const BATAS_EMAIL = 50;
const PANJANG_SLUG_ACAK = 8;
const pilihanAkses = (): Array<{ nilai: AksesBagikan; label: string; bantu: string }> => [
  { nilai: 'tautan', label: t('bagikan.akses_tautan'), bantu: t('bagikan.akses_tautan_bantu') },
  { nilai: 'email', label: t('bagikan.akses_email'), bantu: t('bagikan.akses_email_bantu') },
  { nilai: 'privat', label: t('bagikan.akses_privat'), bantu: t('bagikan.akses_privat_bantu') },
];

export function DialogBagikan({ idRiwayat, kasus, repo, sesi, saatMasuk, saatTutup }: Props) {
  const id = useId();
  const [memuat, setMemuat] = useState(!!sesi);
  const [sudahAda, setSudahAda] = useState(false);
  const [akses, setAkses] = useState<AksesBagikan>('tautan');
  const [slug, setSlug] = useState(slugAcak);
  const [teksEmail, setTeksEmail] = useState('');
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    if (!sesi) return;
    void repo.bacaPengaturan(idRiwayat).then(ada => {
      if (ada) { setSudahAda(true); setAkses(ada.akses); setSlug(ada.slug); setTeksEmail(ada.email.join('\n')); }
    }).catch(() => setGalat(t('bagikan.gagal_memuat'))).finally(() => setMemuat(false));
  }, [sesi, repo, idRiwayat]);

  const simpan = async () => {
    const email = bacaEmail(teksEmail);
    if (!SLUG_BAGIKAN.test(slug)) return setGalat(t('bagikan.slug_tidak_sah'));
    if (akses === 'email' && email.length === 0) return setGalat(t('bagikan.email_kosong'));
    if (email.some(surel => !SUREL.test(surel))) return setGalat(t('bagikan.email_tidak_sah'));
    if (email.length > BATAS_EMAIL) return setGalat(t('bagikan.email_terlalu_banyak', { batas: BATAS_EMAIL }));
    setSibuk(true);
    setGalat('');
    try {
      await repo.simpan(idRiwayat, { slug, akses, email: akses === 'email' ? email : [] }, JSON.parse(keJson(kasus)));
      tandaiDibagikan(idRiwayat, true);
      setSudahAda(true);
    } catch (kesalahan) {
      setGalat(kesalahan instanceof Error ? kesalahan.message : t('bagikan.gagal_menyimpan'));
    } finally {
      setSibuk(false);
    }
  };
  const berhenti = async () => {
    setSibuk(true);
    try {
      await repo.berhenti(idRiwayat);
      tandaiDibagikan(idRiwayat, false);
      saatTutup();
    } catch {
      setGalat(t('bagikan.gagal_menyimpan'));
      setSibuk(false);
    }
  };
  const salin = () => void navigator.clipboard?.writeText(alamatBagikan(slug)).then(() => setTersalin(true)).catch(() => {});

  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`} onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
      <form className="konfirmasi-isi form-bagikan" onSubmit={event => { event.preventDefault(); void simpan(); }}>
        <h2 id={`${id}-judul`}>{t('bagikan.judul')}</h2>
        {!sesi ? (
          <>
            <p>{t('bagikan.perlu_masuk')}</p>
            <div className="aksi-konfirmasi">
              {saatMasuk && <button type="button" className="tautan-aksi" onClick={saatMasuk}>{t('bagikan.masuk_google')}</button>}
              <Tombol type="button" varian="secondary" onClick={saatTutup}>{t('umum.tutup')}</Tombol>
            </div>
          </>
        ) : memuat ? <p>{t('bagikan.memuat')}</p> : (
          <>
            <fieldset className="isian">
              <legend>{t('bagikan.siapa_bisa_buka')}</legend>
              {pilihanAkses().map(pilihan => (
                <label key={pilihan.nilai} className="pilihan-akses">
                  <input type="radio" name={`${id}-akses`} checked={akses === pilihan.nilai} onChange={() => setAkses(pilihan.nilai)} />
                  <span><b>{pilihan.label}</b><small>{pilihan.bantu}</small></span>
                </label>
              ))}
            </fieldset>
            {akses === 'email' && (
              <label className="isian">
                <span>{t('bagikan.daftar_email')}</span>
                <textarea rows={3} value={teksEmail} placeholder="nama@contoh.com" autoComplete="off" spellCheck={false}
                  onChange={event => setTeksEmail(event.target.value)} />
              </label>
            )}
            <label className="isian">
              <span>{t('bagikan.tautan')}</span>
              <span className="kotak-uang">
                <span className="prefix-uang" aria-hidden="true">{awalanTautan()}</span>
                <input value={slug} maxLength={40} autoComplete="off" spellCheck={false} aria-describedby={`${id}-aturan`}
                  onChange={event => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
              </span>
              <small id={`${id}-aturan`} className="caption-isian">{t('bagikan.aturan_tautan')}</small>
            </label>
            {galat && <p role="alert" className="isian-salah">{galat}</p>}
            <div className="aksi-konfirmasi">
              {sudahAda && <button type="button" className="tautan-aksi" disabled={sibuk} onClick={salin}>{tersalin ? t('bagikan.tersalin') : t('bagikan.salin_tautan')}</button>}
              {sudahAda && <button type="button" className="tautan-aksi" disabled={sibuk} onClick={() => void berhenti()}>{t('bagikan.berhenti')}</button>}
              <Tombol type="button" varian="secondary" onClick={saatTutup}>{t('umum.tutup')}</Tombol>
              <Tombol type="submit" disabled={sibuk}>{t('umum.simpan')}</Tombol>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

/** Bagian tetap alamat sebelum slug, untuk ditampilkan di depan kolom. */
const awalanTautan = (): string => alamatBagikan('x').slice(0, -1);

const SUREL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dipisah koma, titik koma, spasi, atau baris baru; huruf kecil dan tanpa duplikat. */
const bacaEmail = (teks: string): string[] => [...new Set(teks.toLowerCase().split(/[\s,;]+/).filter(Boolean))];

const slugAcak = (): string => Array.from({ length: PANJANG_SLUG_ACAK }, () => Math.floor(Math.random() * 36).toString(36)).join('');
