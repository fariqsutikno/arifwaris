// Dialog "Bagikan kasus", satu layar tanpa mode. Dari atas: tautan (selalu terlihat, nama tautannya bisa diketik langsung
// dengan umpan balik "tersedia / sudah dipakai" saat mengetik, tombol Salin di sampingnya), siapa yang boleh membuka (kartu
// pilihan), daftar email bila perlu. Kasus yang belum dibagikan memakai tombol "Buat tautan"; yang sudah, "Simpan perubahan"
// (aktif hanya bila ada yang berubah). Menyimpan menyalin tautan otomatis. Mematikan tautan minta konfirmasi.

import { useEffect, useId, useState } from 'react';
import type { AksesBagikan, PengaturanBagikan, RepositoriBagikan } from '@waris/data';
import { keJson, type Kasus } from '../kasus';
import { SLUG_BAGIKAN, alamatBagikan, tautanBagikan } from '../rute';
import { tandaiDibagikan } from '../bagikanLokal';
import { Ikon, type NamaIkon } from '../ui/Ikon';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

interface Props { idRiwayat: string; kasus: Kasus; repo: RepositoriBagikan; saatTutup: () => void }
type StatusNama = 'sendiri' | 'memeriksa' | 'tersedia' | 'dipakai' | 'tidak_sah' | 'tak_diketahui';

const BATAS_EMAIL = 50;
const PANJANG_SLUG_ACAK = 8;
const JEDA_CEK_NAMA_MS = 400;

export function DialogBagikan({ idRiwayat, kasus, repo, saatTutup }: Props) {
  const id = useId();
  const [memuat, setMemuat] = useState(true);
  const [tersimpan, setTersimpan] = useState<PengaturanBagikan | null>(null);
  const [akses, setAkses] = useState<AksesBagikan>('tautan');
  const [slug, setSlug] = useState(slugAcak);
  const [teksEmail, setTeksEmail] = useState('');
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [tersalin, setTersalin] = useState(false);
  const [baruDisimpan, setBaruDisimpan] = useState(false);
  const [tanyaMatikan, setTanyaMatikan] = useState(false);
  const [statusNama, setStatusNama] = useState<StatusNama>('tersedia');

  useEffect(() => {
    void repo.bacaPengaturan(idRiwayat).then(ada => {
      if (!ada) return;
      setTersimpan(ada); setAkses(ada.akses); setSlug(ada.slug); setTeksEmail(ada.email.join('\n'));
    }).catch(() => setGalat(t('bagikan.gagal_memuat'))).finally(() => setMemuat(false));
  }, [repo, idRiwayat]);

  // Nama tautan diperiksa saat mengetik (setelah jeda singkat); kegagalan cek tidak menghalangi, server tetap menolak bentrok.
  useEffect(() => {
    if (!SLUG_BAGIKAN.test(slug)) return setStatusNama('tidak_sah');
    if (tersimpan?.slug === slug) return setStatusNama('sendiri');
    setStatusNama('memeriksa');
    let batal = false;
    const tunda = setTimeout(() => {
      repo.tautanTersedia(slug, idRiwayat).then(ya => { if (!batal) setStatusNama(ya ? 'tersedia' : 'dipakai'); })
        .catch(() => { if (!batal) setStatusNama('tak_diketahui'); });
    }, JEDA_CEK_NAMA_MS);
    return () => { batal = true; clearTimeout(tunda); };
  }, [slug, tersimpan, repo, idRiwayat]);

  const email = bacaEmail(teksEmail);
  const emailSalah = email.filter(surel => !SUREL.test(surel));
  const berubah = !tersimpan || akses !== tersimpan.akses || slug !== tersimpan.slug
    || (akses === 'email' && email.join() !== tersimpan.email.join());
  const siapSalin = !!tersimpan && slug === tersimpan.slug;
  const bisaSimpan = !sibuk && berubah && statusNama !== 'dipakai' && statusNama !== 'tidak_sah'
    && (akses !== 'email' || (email.length > 0 && emailSalah.length === 0 && email.length <= BATAS_EMAIL));

  // Gagal menyalin (mis. izin ditolak) tidak apa-apa: tautan tetap tampil dan bisa dipilih manual.
  const salin = async (slugTarget: string) => {
    try { await navigator.clipboard.writeText(alamatBagikan(slugTarget)); setTersalin(true); } catch { setTersalin(false); }
  };
  const simpan = async () => {
    if (!bisaSimpan) return;
    const pengaturan = { slug, akses, email: akses === 'email' ? email : [] };
    setSibuk(true);
    setGalat('');
    try {
      await repo.simpan(idRiwayat, pengaturan, JSON.parse(keJson(kasus)));
      tandaiDibagikan(idRiwayat, true);
      setTersimpan(pengaturan);
      setBaruDisimpan(true);
      await salin(slug);
    } catch (kesalahan) {
      setGalat(kesalahan instanceof Error ? kesalahan.message : t('bagikan.gagal_menyimpan'));
    } finally {
      setSibuk(false);
    }
  };
  const matikan = async () => {
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
  // Mengubah apa pun membuat status "baru disimpan/tersalin" tidak berlaku lagi.
  const ubah = (aksi: () => void) => { aksi(); setBaruDisimpan(false); setTersalin(false); setGalat(''); };

  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`} onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
      <form className="konfirmasi-isi form-bagikan" onSubmit={event => { event.preventDefault(); void simpan(); }}>
        <header>
          <h2 id={`${id}-judul`}>{t('bagikan.judul')}</h2>
          <p className="bantu-bagikan">{t('bagikan.subjudul')}</p>
        </header>
        {memuat ? <p>{t('bagikan.memuat')}</p> : (
          <>
            <section aria-labelledby={`${id}-tautan`} className="bagian-bagikan">
              <h3 id={`${id}-tautan`}>{t('bagikan.tautan')}</h3>
              <div className={`kotak-tautan${statusNama === 'dipakai' || statusNama === 'tidak_sah' ? ' salah' : ''}`}>
                <span className="awalan-tautan" aria-hidden="true">{awalanTautan()}</span>
                <input value={slug} maxLength={40} autoComplete="off" spellCheck={false} aria-label={t('bagikan.nama_tautan')} aria-describedby={`${id}-status-nama`}
                  onFocus={event => event.target.select()} onChange={event => ubah(() => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')))} />
                <Tombol type="button" varian={siapSalin ? 'primary' : 'secondary'} disabled={!siapSalin} onClick={() => void salin(slug)}>
                  {tersalin ? <><Ikon nama="benar" ukuran={16} /> {t('bagikan.tersalin_pendek')}</> : t('bagikan.salin')}
                </Tombol>
              </div>
              <p id={`${id}-status-nama`} className={`status-nama ${statusNama}`} role="status">{teksStatusNama(statusNama)}</p>
            </section>

            <fieldset className="bagian-bagikan">
              <legend>{t('bagikan.siapa_bisa_buka')}</legend>
              {pilihanAkses().map(pilihan => (
                <label key={pilihan.nilai} className="opsi-akses" data-pilih={akses === pilihan.nilai}>
                  <input type="radio" name={`${id}-akses`} checked={akses === pilihan.nilai} onChange={() => ubah(() => setAkses(pilihan.nilai))} />
                  <span className="ikon-opsi"><Ikon nama={pilihan.ikon} ukuran={18} /></span>
                  <span className="teks-opsi"><b>{pilihan.label}</b><small>{pilihan.bantu}</small></span>
                </label>
              ))}
            </fieldset>

            {akses === 'email' && (
              <label className="isian bagian-bagikan">
                <span>{t('bagikan.daftar_email')}</span>
                <textarea rows={3} value={teksEmail} placeholder="nama@contoh.com" autoComplete="off" spellCheck={false} aria-invalid={emailSalah.length > 0}
                  onChange={event => ubah(() => setTeksEmail(event.target.value))} />
                <small className={emailSalah.length > 0 || email.length > BATAS_EMAIL ? 'caption-isian isian-salah' : 'caption-isian'}>
                  {emailSalah.length > 0 ? t('bagikan.email_tidak_sah_nama', { email: emailSalah[0]! })
                    : email.length > BATAS_EMAIL ? t('bagikan.email_terlalu_banyak', { batas: BATAS_EMAIL })
                    : t('bagikan.email_bantu', { jumlah: email.length })}
                </small>
              </label>
            )}

            {baruDisimpan && <p className="sukses-bagikan" role="status"><Ikon nama="benar" ukuran={16} /> {tersalin ? t('bagikan.tautan_aktif_tersalin') : t('bagikan.tautan_aktif')}</p>}
            {galat && <p role="alert" className="isian-salah">{galat}</p>}

            {tanyaMatikan ? (
              <div className="tanya-matikan" role="alert">
                <p>{t('bagikan.matikan_tanya')}</p>
                <div className="aksi-konfirmasi">
                  <Tombol type="button" varian="secondary" onClick={() => setTanyaMatikan(false)}>{t('bagikan.jangan')}</Tombol>
                  <Tombol type="button" disabled={sibuk} onClick={() => void matikan()}>{t('bagikan.ya_matikan')}</Tombol>
                </div>
              </div>
            ) : (
              <div className="aksi-konfirmasi aksi-bagikan">
                {tersimpan && (
                  <span className="aksi-kiri">
                    <a className="tautan-aksi" href={tautanBagikan(tersimpan.slug)} target="_blank" rel="noopener">{t('bagikan.lihat_sebagai_penerima')}</a>
                    <button type="button" className="tautan-aksi" onClick={() => setTanyaMatikan(true)}>{t('bagikan.matikan')}</button>
                  </span>
                )}
                <Tombol type="button" varian="secondary" onClick={saatTutup}>{berubah ? t('umum.batal') : t('umum.tutup')}</Tombol>
                {berubah && <Tombol type="submit" disabled={!bisaSimpan}>{tersimpan ? t('bagikan.simpan_perubahan') : t('bagikan.buat_tautan')}</Tombol>}
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}

function teksStatusNama(status: StatusNama): string {
  switch (status) {
    case 'memeriksa': return t('bagikan.status_periksa');
    case 'tersedia': return t('bagikan.status_tersedia');
    case 'dipakai': return t('bagikan.status_dipakai');
    case 'tidak_sah': return t('bagikan.slug_tidak_sah');
    case 'tak_diketahui': return t('bagikan.aturan_tautan');
    case 'sendiri': return '';
  }
}

const pilihanAkses = (): Array<{ nilai: AksesBagikan; ikon: NamaIkon; label: string; bantu: string }> => [
  { nilai: 'tautan', ikon: 'buka', label: t('bagikan.akses_tautan'), bantu: t('bagikan.akses_tautan_bantu') },
  { nilai: 'email', ikon: 'profil', label: t('bagikan.akses_email'), bantu: t('bagikan.akses_email_bantu') },
  { nilai: 'privat', ikon: 'kunci', label: t('bagikan.akses_privat'), bantu: t('bagikan.akses_privat_bantu') },
];

/** Bagian tetap alamat sebelum nama tautan. */
const awalanTautan = (): string => alamatBagikan('x').slice(0, -1).replace(/^https?:\/\//, '');

const SUREL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dipisah koma, titik koma, spasi, atau baris baru; huruf kecil dan tanpa duplikat. */
const bacaEmail = (teks: string): string[] => [...new Set(teks.toLowerCase().split(/[\s,;]+/).filter(Boolean))];

const slugAcak = (): string => Array.from({ length: PANJANG_SLUG_ACAK }, () => Math.floor(Math.random() * 36).toString(36)).join('');
