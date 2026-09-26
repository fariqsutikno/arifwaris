// Beranda Belajar: satu aksi utama (lanjutkan pelajaran), lalu tiga kelompok menurut niat pengguna dengan urutan yang
// sama di semua layar: Belajar (jalur modul) → Latihan (soal hitung, kuis) → Cari tahu (tanya jawab, glosarium,
// rujukan). Jejak terakhir paling bawah dan hanya tampil bila ada.

import { daftarCheatsheet, daftarModul, daftarPelajaran, daftarSoalHitung, daftarSoalKuis } from '../../konten/sumber';
import { useState } from 'react';
import { bacaAktivitas, bacaCatatan, bacaPelajaranSelesai, hapusAktivitas, resetProgresBelajar, type Aktivitas } from '../../preferensi';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { waktuRelatif } from '../../riwayat';
import { tautanBelajar, tautanFaq, tautanGlosarium, tautanLatihan, tautanRujukan, tautanTanyaJawab } from '../../rute';
import { angka, bahasaArab, panah, t } from '../../terjemah';
import { Ikon, type NamaIkon } from '../../ui/Ikon';
import { PAKET_ACAK } from './KuisKonsep';

const adaMateri = (nomor: number) => daftarPelajaran().some(pelajaran => pelajaran.modul === nomor);
const modulTersedia = daftarModul().filter(modul => adaMateri(modul.nomor));
const modulMenyusul = daftarModul().filter(modul => !adaMateri(modul.nomor));

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
  const soalSelesai = Object.keys(bacaCatatan('soal')).filter(kode => daftarSoalHitung().some(soal => soal.kode === kode)).length;
  const kuisBenar = daftarSoalKuis().filter(soal => bacaCatatan('kuis')[soal.kode] === 'benar').length;
  const jumlahSelesai = daftarPelajaran().filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const persen = Math.round((jumlahSelesai / daftarPelajaran().length) * 100);
  const berikutnya = daftarPelajaran().find(pelajaran => !selesai.has(pelajaran.slug));
  const aktivitas = bacaAktivitas().slice(0, JUMLAH_AKTIVITAS);
  const sekarang = Date.now();

  return (
    <main className="halaman tumpuk pusat-belajar">
      {/* Satu aksi utama di atas: lanjut dari titik terakhir. Sisanya dikelompokkan menurut niat: belajar, berlatih, mencari. */}
      <section className="hero-belajar">
        <div className="tumpuk-rapat">
          <h1>{t('belajar.pusat_belajar_faraidh')}</h1>
          {berikutnya ? (
            <a className="kartu-lanjut" href={tautanBelajar(berikutnya.slug)}>
              <span className="label-langkah">{jumlahSelesai === 0 ? t('belajar.mulai_dari_sini') : t('belajar.lanjutkan')} · {t('belajar.modul_nomor', { nomor: berikutnya.modul })}</span>
              <b>{berikutnya.judul}</b>
              <span className="panah" aria-hidden="true">{panah()}</span>
            </a>
          ) : <p className="kartu-lanjut"><b>{t('belajar.semua_pelajaran_sudah_selesai_mantap')}</b></p>}
        </div>
        <CincinProgres persen={persen} label={t('hitung.selesai_total_pelajaran', { selesai: jumlahSelesai, total: daftarPelajaran().length })} />
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-jalur">
        <div className="kepala-bagian"><h2 id="judul-jalur">{t('umum.belajar')}</h2><p className="keterangan">{t('belajar.materi_berurutan_dari_pengantar_sampai_menghitung')}</p></div>
        <ol className="daftar-polos daftar-modul">
          {modulTersedia.map(modul => {
            const daftar = daftarPelajaran().filter(pelajaran => pelajaran.modul === modul.nomor);
            const beres = daftar.filter(pelajaran => selesai.has(pelajaran.slug)).length;
            const tujuan = daftar.find(pelajaran => !selesai.has(pelajaran.slug)) ?? daftar[0];
            const isi = (
              <>
                <span className="nomor-modul">{beres === daftar.length && daftar.length > 0 ? '✓' : angka(String(modul.nomor))}</span>
                <span className="isi-modul"><b>{modul.judul}</b><span className="keterangan">{t('hitung.selesai_total_pelajaran', { selesai: beres, total: daftar.length })}</span></span>
                <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(beres / daftar.length) * 100}%` }} /></span>
              </>
            );
            return <li key={modul.nomor}><a className="baris-modul" href={tautanBelajar(tujuan!.slug)} title={modul.ringkas}>{isi}</a></li>;
          })}
        </ol>
        {/* Modul yang belum ada materinya cukup satu baris, bukan deretan kartu abu-abu. */}
        {modulMenyusul.length > 0 && (
          <p className="keterangan">{t('umum.segera_hadir')}: {modulMenyusul.map(modul => `${angka(String(modul.nomor))}.\u00a0${modul.judul}`).join(' · ')}</p>
        )}
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-latihan">
        <div className="kepala-bagian"><h2 id="judul-latihan">{t('umum.latihan')}</h2><p className="keterangan">{t('belajar.uji_pemahaman_setelah_membaca_materi')}</p></div>
        <div className="deret-angka">
          <KotakAngka nilai={soalSelesai} total={daftarSoalHitung().length} label={t('belajar.soal_hitung_dikerjakan')} tautan={tautanLatihan('hitung')} />
          <KotakAngka nilai={kuisBenar} total={daftarSoalKuis().length} label={t('belajar.kuis_konsep_dijawab_benar')} tautan={tautanLatihan('kuis')} />
          <a className="kotak-angka kotak-acak" href={tautanLatihan('kuis', PAKET_ACAK)}><Ikon nama="acak" ukuran={24} /><b>{t('umum.kuis_acak')}</b><span className="keterangan">{t('belajar.soal_campuran_semua_bab')}</span></a>
        </div>
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-cari">
        <div className="kepala-bagian"><h2 id="judul-cari">{t('beranda.cari_tahu')}</h2><p className="keterangan">{t('belajar.buka_kapan_saja_saat_ada_istilah')}</p></div>
        <div className="grid-pintu">
          <Pintu tautan={tautanFaq()} ikon="tanya" judul={t('umum.faq')} />
          <Pintu tautan={tautanTanyaJawab()} ikon="tanya" judul={t('umum.tanya_jawab')} />
          <Pintu tautan={tautanGlosarium()} ikon="glosarium" judul={t('umum.glosarium')} />
          <Pintu tautan={tautanRujukan()} ikon="rujukan" judul={t('umum.rujukan')} />
        </div>
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-cheatsheet">
        <div className="kepala-bagian"><h2 id="judul-cheatsheet">{t('belajar.cheatsheet')}</h2><p className="keterangan">{t('belajar.ringkasan_satu_halaman_untuk_dicetak_atau')}</p></div>
        <div className="grid-pintu">
          {daftarCheatsheet().map(lembar => {
            const judul = bahasaArab() && lembar.judulAr ? lembar.judulAr : lembar.judul;
            return lembar.tautan
              ? <a key={lembar.judul} className="pintu-belajar" href={lembar.tautan} target="_blank" rel="noopener"><Ikon nama="unduh" ukuran={22} />{judul}</a>
              : <span key={lembar.judul} className="pintu-belajar pintu-menyusul" aria-disabled="true"><Ikon nama="unduh" ukuran={22} />{judul}<small className="keterangan">Segera hadir</small></span>;
          })}
        </div>
      </section>

      {aktivitas.length > 0 && (
        <section className="tumpuk-rapat" aria-labelledby="judul-jejak">
          <h2 id="judul-jejak">{t('belajar.terakhir_kamu_buka')}</h2>
          <ul className="daftar-polos daftar-soal">
            {aktivitas.map(isi => (
              <li key={`${isi.jenis}-${isi.kode}`} className="baris-soal">
                <span className="ikon-aktivitas"><Ikon nama={IKON[isi.jenis]} ukuran={22} /></span>
                <a className="isi-soal" href={tautanAktivitas(isi)}>
                  <b>{isi.judul}</b>
                  <span className="keterangan">{LABEL[isi.jenis]}{isi.hasil ? ` · ${t('belajar.skor')} ${angka(isi.hasil)}` : ''} · {waktuRelatif(isi.waktu, sekarang)}</span>
                </a>
                <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setAkanDihapus(isi)} aria-label={t('belajar.hapus_judul_dari_riwayat', { judul: isi.judul })} title={t('belajar.hapus_dari_riwayat')}><Ikon nama="salah" ukuran={18} /></button>
              </li>
            ))}
          </ul>
          <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm tombol-hapus-semua" onClick={() => setAkanDihapus('semua')}><Ikon nama="sampah" ukuran={18} />{t('belajar.hapus_semua_riwayat_belajar')}</button>
        </section>
      )}

      {(jumlahSelesai > 0 || soalSelesai > 0 || Object.keys(bacaCatatan('kuis')).length > 0) && (
        <section className="zona-reset" aria-labelledby="judul-reset">
          <div>
            <h2 id="judul-reset">{t('belajar.reset_progres_belajar')}</h2>
            <p className="keterangan">{t('belajar.pelajaran_selesai_soal_hitung_skor_kuis')}</p>
          </div>
          <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setAkanDihapus('reset')}>{t('belajar.reset_progres')}</button>
        </section>
      )}

      {akanDihapus && (
        <DialogKonfirmasi
          judul={akanDihapus === 'reset' ? t('belajar.reset_semua_progres_belajar') : akanDihapus === 'semua' ? t('belajar.hapus_semua_riwayat_belajar_2') : t('belajar.hapus_dari_riwayat_belajar')}
          labelLanjut={akanDihapus === 'reset' ? t('belajar.reset_progres') : t('umum.hapus')}
          {...(akanDihapus === 'reset' ? { kataKunci: KATA_RESET } : {})}
          saatBatal={() => setAkanDihapus(null)} saatLanjut={jalankanHapus}>
          <p>
            {akanDihapus === 'reset' ? t('belajar.pelajaran_pelajaran_selesai_soal_soal_hitung', { pelajaran: jumlahSelesai, soal: soalSelesai })
              : akanDihapus === 'semua' ? t('belajar.daftar_terakhir_kamu_buka_akan_dikosongkan')
              : t('belajar.judul_dihapus_dari_daftar_progres_dan', { judul: akanDihapus.judul })}
          </p>
        </DialogKonfirmasi>
      )}
    </main>
  );
}

const JUMLAH_AKTIVITAS = 3;
const KATA_RESET = 'reset progres';
const IKON: Record<Aktivitas['jenis'], NamaIkon> = { pelajaran: 'pelajaran', soal: 'hitung', kuis: 'kuis' };
const LABEL: Record<Aktivitas['jenis'], string> = { pelajaran: t('belajar.pelajaran'), soal: t('umum.soal_hitung'), kuis: t('belajar.kuis') };

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
    <figure className="cincin-progres" aria-label={t('belajar.progres_persen_label', { persen, label })}>
      <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
        <circle cx="60" cy="60" r={jari} className="cincin-latar" />
        <circle cx="60" cy="60" r={jari} className="cincin-isi" strokeDasharray={keliling} strokeDashoffset={keliling * (1 - persen / 100)} transform="rotate(-90 60 60)" />
      </svg>
      <figcaption><b>{angka(`${persen}%`)}</b><span>{label}</span></figcaption>
    </figure>
  );
}
