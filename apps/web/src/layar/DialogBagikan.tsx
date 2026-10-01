// Dialog "Bagikan kasus". Dua tampilan: LIHAT (tautan siap salin + ringkasan siapa yang bisa membuka) dan ATUR (siapa yang boleh
// membuka, daftar email, nama tautan). Kasus yang belum pernah dibagikan langsung di ATUR dengan tautan acak yang tinggal disimpan;
// nama tautan baru bisa diedit setelah menekan "Ubah tautan", jadi tidak ada kolom yang terbuka sebelum diminta.
// Menyimpan menyalin tautan otomatis. Penerima hanya melihat; pengaturan tersimpan di server (kasus_dibagikan).

import { useEffect, useId, useRef, useState } from 'react';
import type { AksesBagikan, PengaturanBagikan, RepositoriBagikan } from '@waris/data';
import { keJson, type Kasus } from '../kasus';
import { SLUG_BAGIKAN, alamatBagikan } from '../rute';
import { tandaiDibagikan } from '../bagikanLokal';
import { Tombol } from '../ui/komponen';
import { t } from '../terjemah';

interface Props { idRiwayat: string; kasus: Kasus; repo: RepositoriBagikan; saatTutup: () => void }

const BATAS_EMAIL = 50;
const PANJANG_SLUG_ACAK = 8;

export function DialogBagikan({ idRiwayat, kasus, repo, saatTutup }: Props) {
  const id = useId();
  const [memuat, setMemuat] = useState(true);
  const [tersimpan, setTersimpan] = useState<PengaturanBagikan | null>(null);
  const [mode, setMode] = useState<'lihat' | 'atur'>('atur');
  const [akses, setAkses] = useState<AksesBagikan>('tautan');
  const [slug, setSlug] = useState(slugAcak);
  const [ubahTautan, setUbahTautan] = useState(false);
  const [teksEmail, setTeksEmail] = useState('');
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [tersalin, setTersalin] = useState(false);
  const kolomTautan = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void repo.bacaPengaturan(idRiwayat).then(ada => {
      if (!ada) return;
      setTersimpan(ada);
      isiForm(ada);
      setMode('lihat');
    }).catch(() => setGalat(t('bagikan.gagal_memuat'))).finally(() => setMemuat(false));
  }, [repo, idRiwayat]);

  const isiForm = (pengaturan: PengaturanBagikan) => {
    setAkses(pengaturan.akses); setSlug(pengaturan.slug); setTeksEmail(pengaturan.email.join('\n')); setUbahTautan(false); setGalat('');
  };

  // Gagal menyalin (mis. izin ditolak) tidak apa-apa: kolom tautan tetap terpilih supaya bisa disalin manual.
  const salin = async (slugTarget: string) => {
    kolomTautan.current?.select();
    try { await navigator.clipboard.writeText(alamatBagikan(slugTarget)); setTersalin(true); } catch { setTersalin(false); }
  };

  const simpan = async () => {
    const email = bacaEmail(teksEmail);
    if (!SLUG_BAGIKAN.test(slug)) return setGalat(t('bagikan.slug_tidak_sah'));
    if (akses === 'email' && email.length === 0) return setGalat(t('bagikan.email_kosong'));
    if (email.some(surel => !SUREL.test(surel))) return setGalat(t('bagikan.email_tidak_sah'));
    if (email.length > BATAS_EMAIL) return setGalat(t('bagikan.email_terlalu_banyak', { batas: BATAS_EMAIL }));
    const pengaturan = { slug, akses, email: akses === 'email' ? email : [] };
    setSibuk(true);
    setGalat('');
    try {
      await repo.simpan(idRiwayat, pengaturan, JSON.parse(keJson(kasus)));
      tandaiDibagikan(idRiwayat, true);
      setTersimpan(pengaturan);
      setMode('lihat');
      void salin(slug);
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
  const batalAtur = () => { if (tersimpan) { isiForm(tersimpan); setMode('lihat'); } else saatTutup(); };

  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`} onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
      <form className="konfirmasi-isi form-bagikan" onSubmit={event => { event.preventDefault(); if (mode === 'atur') void simpan(); }}>
        <h2 id={`${id}-judul`}>{mode === 'lihat' ? t('bagikan.tautan_siap') : t('bagikan.judul')}</h2>
        {memuat ? <p>{t('bagikan.memuat')}</p> : mode === 'lihat' && tersimpan ? (
          <>
            <div className="kotak-tautan">
              <input ref={kolomTautan} readOnly value={alamatBagikan(tersimpan.slug)} aria-label={t('bagikan.tautan')} onFocus={event => event.target.select()} />
              <Tombol type="button" onClick={() => void salin(tersimpan.slug)}>{tersalin ? t('bagikan.tersalin') : t('bagikan.salin_tautan')}</Tombol>
            </div>
            <p className="ringkasan-bagikan">{ringkasanAkses(tersimpan)}</p>
            {galat && <p role="alert" className="isian-salah">{galat}</p>}
            <div className="aksi-konfirmasi">
              <button type="button" className="tautan-aksi" disabled={sibuk} onClick={() => setMode('atur')}>{t('bagikan.ubah_pengaturan')}</button>
              <button type="button" className="tautan-aksi" disabled={sibuk} onClick={() => void berhenti()}>{t('bagikan.berhenti')}</button>
              <Tombol type="button" varian="secondary" onClick={saatTutup}>{t('umum.tutup')}</Tombol>
            </div>
          </>
        ) : (
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
            <div className="isian">
              <span>{t('bagikan.tautan')}</span>
              {ubahTautan ? (
                <>
                  <span className="kotak-uang">
                    <span className="prefix-uang" aria-hidden="true">{awalanTautan()}</span>
                    <input value={slug} maxLength={40} autoComplete="off" spellCheck={false} autoFocus aria-label={t('bagikan.nama_tautan')} aria-describedby={`${id}-aturan`}
                      onChange={event => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
                  </span>
                  <small id={`${id}-aturan`} className="caption-isian">{t('bagikan.aturan_tautan')}</small>
                </>
              ) : (
                <span className="tautan-terbaca">{alamatBagikan(slug)}{' '}
                  <button type="button" className="tautan-aksi" onClick={() => setUbahTautan(true)}>{t('bagikan.ubah_tautan')}</button></span>
              )}
            </div>
            {galat && <p role="alert" className="isian-salah">{galat}</p>}
            <div className="aksi-konfirmasi">
              <Tombol type="button" varian="secondary" onClick={batalAtur}>{t('umum.batal')}</Tombol>
              <Tombol type="submit" disabled={sibuk}>{t('bagikan.simpan_dan_salin')}</Tombol>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

const pilihanAkses = (): Array<{ nilai: AksesBagikan; label: string; bantu: string }> => [
  { nilai: 'tautan', label: t('bagikan.akses_tautan'), bantu: t('bagikan.akses_tautan_bantu') },
  { nilai: 'email', label: t('bagikan.akses_email'), bantu: t('bagikan.akses_email_bantu') },
  { nilai: 'privat', label: t('bagikan.akses_privat'), bantu: t('bagikan.akses_privat_bantu') },
];

function ringkasanAkses(pengaturan: PengaturanBagikan): string {
  if (pengaturan.akses === 'tautan') return t('bagikan.ringkasan_tautan');
  if (pengaturan.akses === 'privat') return t('bagikan.ringkasan_privat');
  return t('bagikan.ringkasan_email', { email: pengaturan.email.join(', ') });
}

/** Bagian tetap alamat sebelum slug, untuk ditampilkan di depan kolom. */
const awalanTautan = (): string => alamatBagikan('x').slice(0, -1);

const SUREL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dipisah koma, titik koma, spasi, atau baris baru; huruf kecil dan tanpa duplikat. */
const bacaEmail = (teks: string): string[] => [...new Set(teks.toLowerCase().split(/[\s,;]+/).filter(Boolean))];

const slugAcak = (): string => Array.from({ length: PANJANG_SLUG_ACAK }, () => Math.floor(Math.random() * 36).toString(36)).join('');
