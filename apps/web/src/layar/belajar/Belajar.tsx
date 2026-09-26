// Beranda Belajar: satu aksi utama (lanjutkan pelajaran), lalu tiga kelompok menurut niat pengguna dengan urutan yang
// sama di semua layar: Belajar (jalur modul) → Latihan (soal hitung, kuis) → Cari tahu (tanya jawab, glosarium,
// rujukan). Jejak terakhir paling bawah dan hanya tampil bila ada.

import { DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS } from '@waris/content';
import { useState } from 'react';
import { bacaAktivitas, bacaCatatan, bacaPelajaranSelesai, hapusAktivitas, resetProgresBelajar, type Aktivitas } from '../../preferensi';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { waktuRelatif } from '../../riwayat';
import { tautanBelajar, tautanFaq, tautanGlosarium, tautanLatihan, tautanRujukan, tautanTanyaJawab } from '../../rute';
import { angka, panah, t, terjemahIsi } from '../../terjemah';
import { Ikon, type NamaIkon } from '../../ui/Ikon';
import { PAKET_ACAK } from './KuisKonsep';

const adaMateri = (nomor: number) => DAFTAR_PELAJARAN.some(pelajaran => pelajaran.modul === nomor);
const modulTersedia = DAFTAR_MODUL.filter(modul => adaMateri(modul.nomor));
const modulMenyusul = DAFTAR_MODUL.filter(modul => !adaMateri(modul.nomor));

export function Belajar() {
  // Angka dibaca ulang dari penyimpanan setiap kali ada yang dihapus/di-reset.
  const [, setVersi] = useState(0);
  const [akanDihapus, setAkanDihapus] = useState<Aktivitas | 'semua' | 'reset' | null>(null);
  const jalankanHapus = () => {
    if (akanDihapus === 'reset') resetProgresBelajar();
    else if (akanDihapus === 'semua') hapusAktivitas();
    else if (akanDihapus) hapusAktivitas(akanDihapus);
    setAkanDihapus(null);
    setVersi(versi => versi + 1);
  };
  const selesai = bacaPelajaranSelesai();
  const soalSelesai = Object.keys(bacaCatatan('soal')).filter(kode => DAFTAR_SOAL_HITUNG.some(soal => soal.kode === kode)).length;
  const kuisBenar = DAFTAR_SOAL_KUIS.filter(soal => bacaCatatan('kuis')[soal.kode] === 'benar').length;
  const jumlahSelesai = DAFTAR_PELAJARAN.filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const persen = Math.round((jumlahSelesai / DAFTAR_PELAJARAN.length) * 100);
  const berikutnya = DAFTAR_PELAJARAN.find(pelajaran => !selesai.has(pelajaran.slug));
  const aktivitas = bacaAktivitas().slice(0, JUMLAH_AKTIVITAS);
  const sekarang = Date.now();

  return (
    <main className="halaman tumpuk pusat-belajar">
      {/* Satu aksi utama di atas: lanjut dari titik terakhir. Sisanya dikelompokkan menurut niat: belajar, berlatih, mencari. */}
      <section className="hero-belajar">
        <div className="tumpuk-rapat">
          <h1>{t('Pusat belajar faraidh')}</h1>
          {berikutnya ? (
            <a className="kartu-lanjut" href={tautanBelajar(berikutnya.slug)}>
              <span className="label-langkah">{jumlahSelesai === 0 ? t('Mulai dari sini') : t('Lanjutkan')} · {t('Modul {nomor}', { nomor: berikutnya.modul })}</span>
              <b>{terjemahIsi(berikutnya.judul)}</b>
              <span className="panah" aria-hidden="true">{panah()}</span>
            </a>
          ) : <p className="kartu-lanjut"><b>{t('Semua pelajaran sudah selesai. Mantap!')}</b></p>}
        </div>
        <CincinProgres persen={persen} label={t('{selesai}/{total} pelajaran', { selesai: jumlahSelesai, total: DAFTAR_PELAJARAN.length })} />
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-jalur">
        <div className="kepala-bagian"><h2 id="judul-jalur">{t('Belajar')}</h2><p className="keterangan">{t('Materi berurutan, dari pengantar sampai menghitung.')}</p></div>
        <ol className="daftar-polos daftar-modul">
          {modulTersedia.map(modul => {
            const daftar = DAFTAR_PELAJARAN.filter(pelajaran => pelajaran.modul === modul.nomor);
            const beres = daftar.filter(pelajaran => selesai.has(pelajaran.slug)).length;
            const tujuan = daftar.find(pelajaran => !selesai.has(pelajaran.slug)) ?? daftar[0];
            const isi = (
              <>
                <span className="nomor-modul">{beres === daftar.length && daftar.length > 0 ? '✓' : angka(String(modul.nomor))}</span>
                <span className="isi-modul"><b>{terjemahIsi(modul.judul)}</b><span className="keterangan">{t('{selesai}/{total} pelajaran', { selesai: beres, total: daftar.length })}</span></span>
                <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(beres / daftar.length) * 100}%` }} /></span>
              </>
            );
            return <li key={modul.nomor}><a className="baris-modul" href={tautanBelajar(tujuan!.slug)} title={terjemahIsi(modul.ringkas)}>{isi}</a></li>;
          })}
        </ol>
        {/* Modul yang belum ada materinya cukup satu baris, bukan deretan kartu abu-abu. */}
        {modulMenyusul.length > 0 && (
          <p className="keterangan">{t('Segera hadir')}: {modulMenyusul.map(modul => `${angka(String(modul.nomor))}.\u00a0${terjemahIsi(modul.judul)}`).join(' · ')}</p>
        )}
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-latihan">
        <div className="kepala-bagian"><h2 id="judul-latihan">{t('Latihan')}</h2><p className="keterangan">{t('Uji pemahaman setelah membaca materi.')}</p></div>
        <div className="deret-angka">
          <KotakAngka nilai={soalSelesai} total={DAFTAR_SOAL_HITUNG.length} label={t('Soal hitung dikerjakan')} tautan={tautanLatihan('hitung')} />
          <KotakAngka nilai={kuisBenar} total={DAFTAR_SOAL_KUIS.length} label={t('Kuis konsep dijawab benar')} tautan={tautanLatihan('kuis')} />
          <a className="kotak-angka kotak-acak" href={tautanLatihan('kuis', PAKET_ACAK)}><Ikon nama="acak" ukuran={24} /><b>{t('Kuis acak')}</b><span className="keterangan">{t('Soal campuran semua bab')}</span></a>
        </div>
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-cari">
        <div className="kepala-bagian"><h2 id="judul-cari">{t('Cari tahu')}</h2><p className="keterangan">{t('Buka kapan saja saat ada istilah atau hukum yang belum jelas.')}</p></div>
        <div className="grid-pintu">
          <Pintu tautan={tautanFaq()} ikon="tanya" judul={t('FAQ')} />
          <Pintu tautan={tautanTanyaJawab()} ikon="tanya" judul={t('Tanya jawab')} />
          <Pintu tautan={tautanGlosarium()} ikon="glosarium" judul={t('Glosarium')} />
          <Pintu tautan={tautanRujukan()} ikon="rujukan" judul={t('Rujukan')} />
        </div>
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-cheatsheet">
        <div className="kepala-bagian"><h2 id="judul-cheatsheet">{t('Cheatsheet')}</h2><p className="keterangan">{t('Ringkasan satu halaman untuk dicetak atau disimpan.')}</p></div>
        <div className="grid-pintu">
          {DAFTAR_CHEATSHEET.map(lembar => lembar.berkas
            ? <a key={lembar.judul} className="pintu-belajar" href={lembar.berkas} download><Ikon nama="unduh" ukuran={22} />{lembar.judul}</a>
            : <span key={lembar.judul} className="pintu-belajar pintu-menyusul" aria-disabled="true"><Ikon nama="unduh" ukuran={22} />{lembar.judul}<small className="keterangan">Segera hadir</small></span>)}
        </div>
      </section>

      {aktivitas.length > 0 && (
        <section className="tumpuk-rapat" aria-labelledby="judul-jejak">
          <h2 id="judul-jejak">{t('Terakhir kamu buka')}</h2>
          <ul className="daftar-polos daftar-soal">
            {aktivitas.map(isi => (
              <li key={`${isi.jenis}-${isi.kode}`} className="baris-soal">
                <span className="ikon-aktivitas"><Ikon nama={IKON[isi.jenis]} ukuran={22} /></span>
                <a className="isi-soal" href={tautanAktivitas(isi)}>
                  <b>{terjemahIsi(isi.judul)}</b>
                  <span className="keterangan">{LABEL[isi.jenis]}{isi.hasil ? ` · ${t('skor')} ${angka(isi.hasil)}` : ''} · {waktuRelatif(isi.waktu, sekarang)}</span>
                </a>
                <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setAkanDihapus(isi)} aria-label={t('Hapus {judul} dari riwayat', { judul: isi.judul })} title={t('Hapus dari riwayat')}><Ikon nama="salah" ukuran={18} /></button>
              </li>
            ))}
          </ul>
          <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm tombol-hapus-semua" onClick={() => setAkanDihapus('semua')}><Ikon nama="sampah" ukuran={18} />{t('Hapus semua riwayat belajar')}</button>
        </section>
      )}

      {(jumlahSelesai > 0 || soalSelesai > 0 || Object.keys(bacaCatatan('kuis')).length > 0) && (
        <section className="zona-reset" aria-labelledby="judul-reset">
          <div>
            <h2 id="judul-reset">{t('Reset progres belajar')}</h2>
            <p className="keterangan">{t('Pelajaran selesai, soal hitung, skor kuis, dan riwayat belajar dikosongkan. Riwayat hitung tidak ikut terhapus.')}</p>
          </div>
          <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setAkanDihapus('reset')}>{t('Reset progres')}</button>
        </section>
      )}

      {akanDihapus && (
        <DialogKonfirmasi
          judul={akanDihapus === 'reset' ? t('Reset semua progres belajar?') : akanDihapus === 'semua' ? t('Hapus semua riwayat belajar?') : t('Hapus dari riwayat belajar?')}
          labelLanjut={akanDihapus === 'reset' ? t('Reset progres') : t('Hapus')}
          {...(akanDihapus === 'reset' ? { kataKunci: KATA_RESET } : {})}
          saatBatal={() => setAkanDihapus(null)} saatLanjut={jalankanHapus}>
          <p>
            {akanDihapus === 'reset' ? t('{pelajaran} pelajaran selesai, {soal} soal hitung, dan semua skor kuis akan kembali ke nol. Ini tidak bisa dibatalkan.', { pelajaran: jumlahSelesai, soal: soalSelesai })
              : akanDihapus === 'semua' ? t('Daftar "Terakhir kamu buka" akan dikosongkan. Progres pelajaran dan skor tetap tersimpan.')
              : t('"{judul}" dihapus dari daftar. Progres dan skornya tetap tersimpan.', { judul: akanDihapus.judul })}
          </p>
        </DialogKonfirmasi>
      )}
    </main>
  );
}

const JUMLAH_AKTIVITAS = 3;
// Isi `berkas` (mis. '/cheatsheet/furudh.pdf' di apps/web/public) begitu PDF-nya siap; null = masih placeholder.
const DAFTAR_CHEATSHEET: { judul: string; berkas: string | null }[] = [
  { judul: 'Tabel furudh & ahli waris', berkas: null },
  { judul: 'Peta hajb', berkas: null },
  { judul: "Ashl, 'aul & radd", berkas: null },
  { judul: 'Langkah menghitung', berkas: null },
];
const KATA_RESET = 'reset progres';
const IKON: Record<Aktivitas['jenis'], NamaIkon> = { pelajaran: 'pelajaran', soal: 'hitung', kuis: 'kuis' };
const LABEL: Record<Aktivitas['jenis'], string> = { pelajaran: t('Pelajaran'), soal: t('Soal hitung'), kuis: t('Kuis') };

function tautanAktivitas(aktivitas: Aktivitas): string {
  if (aktivitas.jenis === 'pelajaran') return tautanBelajar(aktivitas.kode);
  if (aktivitas.jenis === 'kuis') return tautanLatihan('kuis', aktivitas.kode);
  return tautanLatihan('hitung');
}

function KotakAngka({ nilai, total, label, tautan }: { nilai: number; total: number; label: string; tautan: string }) {
  return (
    <a className="kotak-angka" href={tautan}>
      <span className="angka-besar">{angka(String(nilai))}<small>/{angka(String(total))}</small></span>
      <span className="keterangan">{label}</span>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${total ? (nilai / total) * 100 : 0}%` }} /></span>
    </a>
  );
}

export const Pintu = ({ tautan, ikon, judul }: { tautan: string; ikon: NamaIkon; judul: string }) => (
  <a className="pintu-belajar" href={tautan}><Ikon nama={ikon} ukuran={22} />{judul}</a>
);

/** Cincin progres keseluruhan; angka di tengah juga ditulis sebagai teks untuk pembaca layar. */
function CincinProgres({ persen, label }: { persen: number; label: string }) {
  const jari = 52;
  const keliling = 2 * Math.PI * jari;
  return (
    <figure className="cincin-progres" aria-label={t('Progres {persen}%, {label}', { persen, label })}>
      <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
        <circle cx="60" cy="60" r={jari} className="cincin-latar" />
        <circle cx="60" cy="60" r={jari} className="cincin-isi" strokeDasharray={keliling} strokeDashoffset={keliling * (1 - persen / 100)} transform="rotate(-90 60 60)" />
      </svg>
      <figcaption><b>{angka(`${persen}%`)}</b><span>{label}</span></figcaption>
    </figure>
  );
}
