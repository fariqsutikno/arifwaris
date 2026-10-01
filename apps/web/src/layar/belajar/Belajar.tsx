// Beranda Belajar: satu aksi utama (lanjutkan pelajaran), lalu tiga kelompok menurut niat pengguna dengan urutan yang
// sama di semua layar: Belajar (jalur modul) → Latihan (soal hitung, kuis) → Cari tahu (tanya jawab, glosarium,
// rujukan). Jejak terakhir paling bawah dan hanya tampil bila ada.

import { daftarCheatsheet, daftarModul, daftarPelajaran, daftarSoalHitung, daftarSoalKuis } from '../../konten/sumber';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { bacaAktivitas, hapusAktivitas, type Aktivitas } from '../../preferensi';
import { bacaPelajaranSelesai, bacaProgresLatihan, bacaSkorPaket, resetProgresBelajar } from '../../progres';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { waktuRelatif } from '../../riwayat';
import { tautanBelajar, tautanFaq, tautanGlosarium, tautanLatihan, tautanRujukan, tautanTanyaJawab } from '../../rute';
import { angka, bahasaArab, panah, t } from '../../terjemah';
import { Ikon, type NamaIkon } from '../../ui/Ikon';
import { pisahKataAkhir, sorotUbin, useCahayaIkutKursor } from '../../ui/sorotan';
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
  const progresHitung = bacaProgresLatihan('hitung');
  const progresKuis = bacaProgresLatihan('kuis');
  const soalSelesai = Object.keys(progresHitung).filter(kode => daftarSoalHitung().some(soal => soal.kode === kode)).length;
  const kuisBenar = daftarSoalKuis().filter(soal => progresKuis[soal.kode]?.benar).length;
  const jumlahSelesai = daftarPelajaran().filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const persen = Math.round((jumlahSelesai / daftarPelajaran().length) * 100);
  const berikutnya = daftarPelajaran().find(pelajaran => !selesai.has(pelajaran.slug));
  const aktivitas = bacaAktivitas().slice(0, JUMLAH_AKTIVITAS);
  const sekarang = Date.now();

  // Penanda halaman: latar krem, nav menyatu dengan hero (CSS body.layar-beranda), sama dengan Beranda.
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  const hero = useRef<HTMLElement>(null);
  useCahayaIkutKursor(hero);
  const [judulAwal, kataTekanan] = pisahKataAkhir(t('belajar.pusat_belajar_faraidh'));
  // Baris terakhir jalur modul diisi penuh (3 per baris di kisi 6 kolom), jadi tidak ada ubin yatim.
  const sisaBaris = modulTersedia.length % MODUL_PER_BARIS;

  return (
    <main className="halaman-beranda halaman-belajar">
      {/* Satu aksi utama di atas: lanjut dari titik terakhir. Sisanya dikelompokkan menurut niat: belajar, berlatih, mencari. */}
      <header className="hero-beranda hero-pusat" ref={hero}>
        <div className="sapa-beranda">
          <h1>{judulAwal} <span className="tekanan">{kataTekanan}</span></h1>
          <p className="lead">{t('belajar.materi_berurutan_dari_pengantar_sampai_menghitung')}</p>
        </div>
        <div className="panel-lanjut">
          <CincinProgres persen={persen} label={t('hitung.selesai_total_pelajaran', { selesai: jumlahSelesai, total: daftarPelajaran().length })} />
          {berikutnya ? (
            <a className="pil-terang kartu-lanjut-hero" href={tautanBelajar(berikutnya.slug)}>
              <span className="label-langkah">{jumlahSelesai === 0 ? t('belajar.mulai_dari_sini') : t('belajar.lanjutkan')} · {t('belajar.modul_nomor', { nomor: berikutnya.modul })}</span>
              <b>{berikutnya.judul}</b>
              <span className="panah-bulat" aria-hidden="true">{panah()}</span>
            </a>
          ) : <p className="kartu-lanjut-hero"><b>{t('belajar.semua_pelajaran_sudah_selesai_mantap')}</b></p>}
        </div>
      </header>

      <div className="tata-beranda" onPointerMove={sorotUbin}>
        <section className="bagian-belajar" aria-labelledby="judul-jalur">
          <h2 id="judul-jalur" className="judul-bagian">{t('umum.belajar')}</h2>
          <ol className="daftar-polos jalur-modul">
            {modulTersedia.map((modul, urutan) => {
              const daftar = daftarPelajaran().filter(pelajaran => pelajaran.modul === modul.nomor);
              const beres = daftar.filter(pelajaran => selesai.has(pelajaran.slug)).length;
              const tujuan = daftar.find(pelajaran => !selesai.has(pelajaran.slug)) ?? daftar[0];
              const lebar = sisaBaris && urutan >= modulTersedia.length - sisaBaris ? KOLOM_BARIS / sisaBaris : KOLOM_BARIS / MODUL_PER_BARIS;
              return (
                <li key={modul.nomor} style={{ gridColumn: `span ${lebar}` }}>
                  <a className="ubin ubin-modul" style={{ '--i': urutan } as CSSProperties} href={tautanBelajar(tujuan!.slug)} title={modul.ringkas}>
                    <span className="panah-bulat" aria-hidden="true">{panah()}</span>
                    <span className="nomor-ubin" aria-hidden="true">{beres === daftar.length && daftar.length > 0 ? '✓' : angka(String(modul.nomor))}</span>
                    <b className="judul-ubin">{modul.judul}</b>
                    <span className="keterangan">{t('hitung.selesai_total_pelajaran', { selesai: beres, total: daftar.length })}</span>
                    <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(beres / daftar.length) * 100}%` }} /></span>
                  </a>
                </li>
              );
            })}
          </ol>
          {/* Modul yang belum ada materinya cukup satu baris, bukan deretan kartu abu-abu. */}
          {modulMenyusul.length > 0 && (
            <p className="keterangan catatan-menyusul">{t('umum.segera_hadir')}: {modulMenyusul.map(modul => `${angka(String(modul.nomor))}.\u00a0${modul.judul}`).join(' · ')}</p>
          )}
        </section>

        <section className="bagian-belajar" aria-labelledby="judul-latihan">
          <h2 id="judul-latihan" className="judul-bagian">{t('umum.latihan')}</h2>
          <p className="keterangan">{t('belajar.uji_pemahaman_setelah_membaca_materi')}</p>
          <div className="deret-ubin">
            <UbinLatihan nilai={soalSelesai} total={daftarSoalHitung().length} label={t('belajar.soal_hitung_dikerjakan')} tautan={tautanLatihan('hitung')} ikon="hitung" warna="soal" urutan={0} />
            <UbinLatihan nilai={kuisBenar} total={daftarSoalKuis().length} label={t('belajar.kuis_konsep_dijawab_benar')} tautan={tautanLatihan('kuis')} ikon="kuis" warna="kuis" urutan={1} />
            <a className="ubin ubin-acak" style={{ '--i': 2 } as CSSProperties} href={tautanLatihan('kuis', PAKET_ACAK)}>
              <Ikon nama="acak" ukuran={130} /><span className="panah-bulat" aria-hidden="true">{panah()}</span>
              <b className="judul-ubin">{t('umum.kuis_acak')}</b><span className="keterangan">{t('belajar.soal_campuran_semua_bab')}</span>
            </a>
          </div>
        </section>

        {/* Cari tahu dan cheatsheet: tautan polos seperti di Beranda, bukan kotak. */}
        <nav className="cari-tahu" aria-labelledby="judul-cari">
          <h2 id="judul-cari" className="label-langkah">{t('beranda.cari_tahu')}</h2>
          <a className="tautan-cari" href={tautanFaq()}><Ikon nama="tanya" ukuran={20} />{t('umum.faq')}</a>
          <a className="tautan-cari" href={tautanTanyaJawab()}><Ikon nama="tanya" ukuran={20} />{t('umum.tanya_jawab')}</a>
          <a className="tautan-cari" href={tautanGlosarium()}><Ikon nama="glosarium" ukuran={20} />{t('umum.glosarium')}</a>
          <a className="tautan-cari" href={tautanRujukan()}><Ikon nama="rujukan" ukuran={20} />{t('umum.rujukan')}</a>
        </nav>

        <nav className="cari-tahu" aria-labelledby="judul-cheatsheet">
          <h2 id="judul-cheatsheet" className="label-langkah">{t('belajar.cheatsheet')}</h2>
          {daftarCheatsheet().map(lembar => {
            const judul = bahasaArab() && lembar.judulAr ? lembar.judulAr : lembar.judul;
            return lembar.tautan
              ? <a key={lembar.judul} className="tautan-cari" href={lembar.tautan} target="_blank" rel="noopener"><Ikon nama="unduh" ukuran={20} />{judul}</a>
              : <span key={lembar.judul} className="tautan-cari menyusul" aria-disabled="true"><Ikon nama="unduh" ukuran={20} />{judul} · {t('umum.segera_hadir')}</span>;
          })}
        </nav>

      {aktivitas.length > 0 && (
        <section className="bagian-belajar tumpuk-rapat" aria-labelledby="judul-jejak">
          <h2 id="judul-jejak" className="judul-bagian">{t('belajar.terakhir_kamu_buka')}</h2>
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

      {(jumlahSelesai > 0 || soalSelesai > 0 || Object.keys(progresKuis).length > 0 || Object.keys(bacaSkorPaket()).length > 0) && (
        <section className="zona-reset" aria-labelledby="judul-reset">
          <div>
            <h2 id="judul-reset">{t('belajar.reset_progres_belajar')}</h2>
            <p className="keterangan">{t('belajar.pelajaran_selesai_soal_hitung_skor_kuis')}</p>
          </div>
          <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" onClick={() => setAkanDihapus('reset')}>{t('belajar.reset_progres')}</button>
        </section>
      )}
      </div>

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
const KOLOM_BARIS = 6;
const MODUL_PER_BARIS = 3;
const KATA_RESET = 'reset progres';
const IKON: Record<Aktivitas['jenis'], NamaIkon> = { pelajaran: 'pelajaran', soal: 'hitung', kuis: 'kuis' };
const LABEL: Record<Aktivitas['jenis'], string> = { pelajaran: t('belajar.pelajaran'), soal: t('umum.soal_hitung'), kuis: t('belajar.kuis') };

function tautanAktivitas(aktivitas: Aktivitas): string {
  if (aktivitas.jenis === 'pelajaran') return tautanBelajar(aktivitas.kode);
  if (aktivitas.jenis === 'kuis') return tautanLatihan('kuis', aktivitas.kode);
  return tautanLatihan('hitung');
}

function UbinLatihan({ nilai, total, label, tautan, ikon, warna, urutan }: { nilai: number; total: number; label: string; tautan: string; ikon: NamaIkon; warna: string; urutan: number }) {
  return (
    <a className={`ubin ubin-${warna}`} style={{ '--i': urutan } as CSSProperties} href={tautan}>
      <Ikon nama={ikon} ukuran={130} /><span className="panah-bulat" aria-hidden="true">{panah()}</span>
      <span className="angka-besar">{angka(String(nilai))}<small>/{angka(String(total))}</small></span>
      <span className="keterangan">{label}</span>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${total ? (nilai / total) * 100 : 0}%` }} /></span>
    </a>
  );
}

/** Cincin progres keseluruhan; angka di tengah juga ditulis sebagai teks untuk pembaca layar. */
function CincinProgres({ persen, label }: { persen: number; label: string }) {
  const jari = 52;
  const keliling = 2 * Math.PI * jari;
  return (
    <figure className="cincin-progres" aria-label={t('belajar.progres_persen_label', { persen, label })}>
      <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
        <circle cx="60" cy="60" r={jari} className="cincin-latar" />
        <circle cx="60" cy="60" r={jari} className="cincin-isi" strokeDasharray={keliling} strokeDashoffset={keliling * (1 - persen / 100)} transform="rotate(-90 60 60)"
          style={{ '--panjang': keliling, '--sisa': keliling * (1 - persen / 100) } as CSSProperties} />
      </svg>
      <figcaption><b>{angka(`${persen}%`)}</b><span>{label}</span></figcaption>
    </figure>
  );
}
