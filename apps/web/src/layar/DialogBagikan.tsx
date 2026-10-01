// Dialog "Bagikan kasus", satu layar, urutan mengikuti cara orang berpikir: (1) siapa yang boleh membuka, (2) daftar email bila
// perlu, (3) tautannya. Bawaan "Hanya saya" = tidak dibagikan, jadi tautan baru muncul setelah memilih untuk membagikan.
// Memilih "Hanya saya" lalu menyimpan = menghentikan pembagian. Setiap simpan lewat konfirmasi yang menjelaskan akibatnya.
// Nama tautan diketik langsung dengan cek "tersedia / sudah dipakai"; menyimpan menyalin tautan otomatis. Klik di luar menutup.

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
  const [akses, setAkses] = useState<AksesBagikan>('privat');
  const [slug, setSlug] = useState(slugAcak);
  const [teksEmail, setTeksEmail] = useState('');
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [tersalin, setTersalin] = useState(false);
  const [baruDisimpan, setBaruDisimpan] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [statusNama, setStatusNama] = useState<StatusNama>('tersedia');

  useEffect(() => {
    void repo.bacaPengaturan(idRiwayat).then(ada => {
      if (!ada) return;
      setTersimpan(ada); setAkses(ada.akses); setSlug(ada.slug); setTeksEmail(ada.email.join('\n'));
    }).catch(() => setGalat(t('bagikan.gagal_memuat'))).finally(() => setMemuat(false));
  }, [repo, idRiwayat]);

  const dibagikanSekarang = !!tersimpan && tersimpan.akses !== 'privat';
  const membagikan = akses !== 'privat';

  // Nama tautan diperiksa saat mengetik (setelah jeda singkat); kegagalan cek tidak menghalangi, server tetap menolak bentrok.
  useEffect(() => {
    if (!membagikan) return;
    if (!SLUG_BAGIKAN.test(slug)) return setStatusNama('tidak_sah');
    if (tersimpan?.slug === slug) return setStatusNama('sendiri');
    setStatusNama('memeriksa');
    let batal = false;
    const tunda = setTimeout(() => {
      repo.tautanTersedia(slug, idRiwayat).then(ya => { if (!batal) setStatusNama(ya ? 'tersedia' : 'dipakai'); })
        .catch(() => { if (!batal) setStatusNama('tak_diketahui'); });
    }, JEDA_CEK_NAMA_MS);
    return () => { batal = true; clearTimeout(tunda); };
  }, [slug, tersimpan, repo, idRiwayat, membagikan]);

  const email = bacaEmail(teksEmail);
  const emailSalah = email.filter(surel => !SUREL.test(surel));
  const emailSah = email.length > 0 && emailSalah.length === 0 && email.length <= BATAS_EMAIL;
  const berubah = akses !== (dibagikanSekarang ? tersimpan.akses : 'privat')
    || (membagikan && (slug !== tersimpan?.slug || (akses === 'email' && email.join() !== tersimpan?.email.join())));
  const bisaSimpan = !sibuk && berubah && (!membagikan || (statusNama !== 'dipakai' && statusNama !== 'tidak_sah' && (akses !== 'email' || emailSah)));
  const siapSalin = dibagikanSekarang && slug === tersimpan.slug;

  // Gagal menyalin (mis. izin ditolak) tidak apa-apa: tautan tetap tampil dan bisa dipilih manual.
  const salin = async (slugTarget: string) => {
    try { await navigator.clipboard.writeText(alamatBagikan(slugTarget)); setTersalin(true); } catch { setTersalin(false); }
  };
  const simpan = async () => {
    setKonfirmasi(false);
    setSibuk(true);
    setGalat('');
    try {
      if (!membagikan) {
        await repo.berhenti(idRiwayat);
        tandaiDibagikan(idRiwayat, false);
        saatTutup();
        return;
      }
      const pengaturan = { slug, akses, email: akses === 'email' ? email : [] };
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
  // Mengubah apa pun membuat status "baru disimpan/tersalin" tidak berlaku lagi.
  const ubah = (aksi: () => void) => { aksi(); setBaruDisimpan(false); setTersalin(false); setGalat(''); setKonfirmasi(false); };
  const tautanLamaBerubah = dibagikanSekarang && membagikan && slug !== tersimpan.slug;

  return (
    <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-judul`}
      onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }} onMouseDown={event => { if (event.target === event.currentTarget) saatTutup(); }}>
      <form className="konfirmasi-isi form-bagikan" onSubmit={event => { event.preventDefault(); if (!berubah) saatTutup(); else if (bisaSimpan) setKonfirmasi(true); }}>
        <header className="kepala-bagikan">
          <span className="lencana-bagikan" aria-hidden="true"><Ikon nama="bagikan" ukuran={22} /></span>
          <div>
            <h2 id={`${id}-judul`}>{t('bagikan.judul')}</h2>
            <p className="bantu-bagikan">{t('bagikan.subjudul_pilih')}</p>
          </div>
          <button type="button" className="tutup-bagikan" aria-label={t('umum.tutup')} onClick={saatTutup}><Ikon nama="salah" ukuran={18} /></button>
        </header>
        {memuat ? <p>{t('bagikan.memuat')}</p> : (
          <>
            <fieldset className="langkah-bagikan">
              <legend><span className="nomor-langkah" aria-hidden="true">1</span><span><b>{t('bagikan.langkah1')}</b><small>{t('bagikan.langkah1_bantu')}</small></span></legend>
              {pilihanAkses().map(pilihan => (
                <label key={pilihan.nilai} className="opsi-akses" data-pilih={akses === pilihan.nilai}>
                  <input type="radio" name={`${id}-akses`} checked={akses === pilihan.nilai} onChange={() => ubah(() => setAkses(pilihan.nilai))} />
                  <span className="ikon-opsi"><Ikon nama={pilihan.ikon} ukuran={20} /></span>
                  <span className="teks-opsi"><b>{pilihan.label}</b><small>{pilihan.bantu}</small></span>
                  <span className="radio-visual" aria-hidden="true" />
                </label>
              ))}
              {akses === 'email' && (
                <div className="bagian-bagikan">
                  <label htmlFor={`${id}-email`} className="judul-bagian">{t('bagikan.email_label')}</label>
                  <textarea id={`${id}-email`} rows={3} value={teksEmail} placeholder="nama@contoh.com" autoComplete="off" spellCheck={false}
                    aria-invalid={emailSalah.length > 0} aria-describedby={`${id}-bantu-email`} onChange={event => ubah(() => setTeksEmail(event.target.value))} />
                  <p id={`${id}-bantu-email`} className={emailSalah.length > 0 || email.length > BATAS_EMAIL ? 'catatan-kolom salah' : 'catatan-kolom'}>
                    {emailSalah.length > 0 ? t('bagikan.email_tidak_sah_nama', { email: emailSalah[0]! })
                      : email.length > BATAS_EMAIL ? t('bagikan.email_terlalu_banyak', { batas: BATAS_EMAIL })
                      : t('bagikan.email_bantu', { jumlah: email.length })}
                  </p>
                </div>
              )}
            </fieldset>

            {membagikan ? (
              <section className="langkah-bagikan garis-atas" aria-labelledby={`${id}-langkah2`}>
                <div className="judul-langkah-bagikan">
                  <span className="nomor-langkah" aria-hidden="true">2</span>
                  <span><b id={`${id}-langkah2`}>{t('bagikan.langkah2')}</b><small>{t('bagikan.langkah2_bantu')}</small></span>
                </div>
                <div className={`kotak-tautan${statusNama === 'dipakai' || statusNama === 'tidak_sah' ? ' salah' : ''}`}>
                  <span className="awalan-tautan" aria-hidden="true">{awalanTautan()}</span>
                  <input aria-label={t('bagikan.tautan')} value={slug} maxLength={40} autoComplete="off" spellCheck={false} aria-describedby={`${id}-status-nama`}
                    onFocus={event => event.target.select()} onChange={event => ubah(() => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')))} />
                  <Tombol type="button" disabled={!siapSalin} onClick={() => void salin(slug)}>
                    <Ikon nama={tersalin ? 'benar' : 'salin'} ukuran={16} /> {tersalin ? t('bagikan.tersalin_pendek') : t('bagikan.salin')}
                  </Tombol>
                </div>
                <p id={`${id}-status-nama`} className={`catatan-kolom ${statusNama === 'dipakai' || statusNama === 'tidak_sah' ? 'salah' : statusNama === 'tersedia' ? 'bagus' : ''}`} role="status">
                  {teksStatusNama(statusNama)}
                </p>
                <div className="baris-pratinjau">
                  {siapSalin
                    ? <a className="tombol-kecil" href={tautanBagikan(tersimpan.slug)} target="_blank" rel="noopener"><Ikon nama="buka" ukuran={16} /> {t('bagikan.pratinjau')}</a>
                    : <span className="tombol-kecil mati" aria-disabled="true"><Ikon nama="buka" ukuran={16} /> {t('bagikan.pratinjau')}</span>}
                  <p className={baruDisimpan ? 'catatan-info sukses' : 'catatan-info'} role="status">
                    <Ikon nama={baruDisimpan ? 'benar' : 'info'} ukuran={16} />
                    {baruDisimpan ? (tersalin ? t('bagikan.tautan_aktif_tersalin') : t('bagikan.tautan_aktif')) : siapSalin && !berubah ? t('bagikan.tautan_aktif') : t('bagikan.baru_aktif')}
                  </p>
                </div>
                <details className="pratinjau-penerima">
                  <summary><Ikon nama="mata" ukuran={18} /> <b>{t('bagikan.pratinjau')}</b> <span className="chip-kecil-info">{t('bagikan.chip_hanya_lihat')}</span></summary>
                  <ul>
                    <li><Ikon nama="benar" ukuran={14} /> {t('bagikan.ceklis_lihat')}</li>
                    <li><Ikon nama="benar" ukuran={14} /> {t('bagikan.ceklis_tidak_ubah')}</li>
                    <li><Ikon nama="benar" ukuran={14} /> {t('bagikan.ceklis_ikut')}</li>
                  </ul>
                </details>
              </section>
            ) : <p className="info-privat"><Ikon nama="kunci" ukuran={16} /> {t('bagikan.privat_info')}</p>}

            {galat && <p role="alert" className="catatan-kolom salah">{galat}</p>}

            {konfirmasi ? (
              <div className="tanya-simpan" role="alertdialog" aria-label={t('bagikan.konfirmasi_judul')}>
                <p><b>{t('bagikan.konfirmasi_judul')}</b></p>
                <p>{akses === 'tautan' ? t('bagikan.konf_tautan') : akses === 'email' ? t('bagikan.konf_email', { email: email.join(', ') }) : t('bagikan.konf_privat')}</p>
                {tautanLamaBerubah && <p>{t('bagikan.konf_tautan_diganti', { lama: tersimpan.slug })}</p>}
                <div className="aksi-konfirmasi">
                  <Tombol type="button" varian="secondary" onClick={() => setKonfirmasi(false)}>{t('bagikan.kembali')}</Tombol>
                  <Tombol type="button" disabled={sibuk} onClick={() => void simpan()}>{t('bagikan.konf_ya')}</Tombol>
                </div>
              </div>
            ) : (
              <div className="aksi-konfirmasi">
                <Tombol type="button" varian="secondary" onClick={saatTutup}>{t('umum.tutup')}</Tombol>
                <Tombol type="submit" disabled={berubah && !bisaSimpan}>{berubah && !membagikan ? t('bagikan.berhenti') : t('bagikan.selesai')}</Tombol>
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

// Urutan dari yang paling tertutup ke yang paling terbuka; bawaan = paling atas.
const pilihanAkses = (): Array<{ nilai: AksesBagikan; ikon: NamaIkon; label: string; bantu: string }> => [
  { nilai: 'privat', ikon: 'kunci', label: t('bagikan.akses_privat'), bantu: t('bagikan.privat_bantu') },
  { nilai: 'email', ikon: 'profil', label: t('bagikan.akses_email'), bantu: t('bagikan.email_akses_bantu') },
  { nilai: 'tautan', ikon: 'buka', label: t('bagikan.akses_tautan'), bantu: t('bagikan.tautan_bantu') },
];

/** Bagian tetap alamat sebelum nama tautan. */
const awalanTautan = (): string => alamatBagikan('x').slice(0, -1).replace(/^https?:\/\//, '');

const SUREL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dipisah koma, titik koma, spasi, atau baris baru; huruf kecil dan tanpa duplikat. */
const bacaEmail = (teks: string): string[] => [...new Set(teks.toLowerCase().split(/[\s,;]+/).filter(Boolean))];

const slugAcak = (): string => Array.from({ length: PANJANG_SLUG_ACAK }, () => Math.floor(Math.random() * 36).toString(36)).join('');
