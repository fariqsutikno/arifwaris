// Beranda gaya Logivo: hero gelap berisi contoh hitungan hidup (ContohHidup) dengan dua ajakan, lalu ubin status pengguna di
// perangkat ini (kasus terakhir, progres belajar, latihan), FAQ, pintu ke referensi, dan identitas tim penyusun.
// Semua angka dari penyimpanan lokal; bila kosong, tampil ajakan memulai, bukan angka nol yang menggantung.

import { useEffect, useRef, type CSSProperties } from 'react';
import { daftarFaq, daftarPelajaran, daftarSoalHitung } from '../konten/sumber';
import type { Kasus } from '../kasus';
import { bacaAktivitas } from '../preferensi';
import { bacaPelajaranSelesai, bacaProgresLatihan } from '../progres';
import { bacaRiwayat, ringkasKasus, type EntriRiwayat } from '../riwayat';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanFaq, tautanTanyaJawab, tautanGlosarium, tautanLatihan, tautanRujukan } from '../rute';
import { Ikon } from '../ui/Ikon';
import { ContohHidup } from './beranda/ContohHidup';
import { angka, merekDisamarkan, panah, t } from '../terjemah';

const JUMLAH_TANYA = 3;
// Situs pribadi masih PLACEHOLDER (tebakan), ganti dengan akun asli; nama tanpa situs tampil sebagai teks biasa.
const KAMPUS = { nama: "STDI Imam Syafi'i Jember", situs: 'https://stdiis.ac.id' };
const TIM: { nama: string; peran: string; situs?: string }[] = [
  { nama: t('beranda.fariq_bin_sutikno'), peran: t('beranda.menulis_kodenya'), situs: 'https://github.com/fariqsutikno' },
  { nama: t('beranda.ridha_ar_rasyid'), peran: 'mengujinya', situs: 'https://www.linkedin.com/in/ridha-ar-rasyid' },
  { nama: t('beranda.muhammad_fatih_ikhsan'), peran: t('beranda.menjaga_ilmunya'), situs: 'https://www.instagram.com/muhammadfatihikhsan' },
  { nama: t('beranda.riyan_maulana_sidiq'), peran: t('beranda.menjaga_ilmunya'), situs: 'https://www.instagram.com/riyanmaulanasidiq' },
];
const PEMBIMBING: { nama: string; situs?: string }[] = [
  { nama: t('beranda.ustaz_muhammad_yassir_m_h'), situs: 'https://www.instagram.com/muhammadyassir' },
  { nama: t('beranda.ustaz_arif_husnul_khuluq_m_h'), situs: 'https://www.instagram.com/arifhusnulkhuluq' },
];

export function Beranda({ kasusTerakhir, saatKeHitung, saatCoba }: { kasusTerakhir: Kasus | null; saatKeHitung: () => void; saatCoba: (kasus: Kasus) => void }) {
  const selesai = bacaPelajaranSelesai();
  const jumlahSelesai = daftarPelajaran().filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const berikutnya = daftarPelajaran().find(pelajaran => !selesai.has(pelajaran.slug));
  const soalSelesai = daftarSoalHitung().filter(soal => bacaProgresLatihan('hitung')[soal.kode]).length;
  const kuisTerakhir = bacaAktivitas().find(aktivitas => aktivitas.jenis === 'kuis');
  // Tanpa kasus yang sedang dimuat (misal sesudah reset), tetap tunjukkan entri riwayat terbaru,
  // supaya Beranda tidak bilang "belum ada" sementara Riwayat berisi.
  const terakhir = kasusTerakhir ? ringkasKasus(kasusTerakhir) : entriTerbaru();
  // Penanda halaman: latar sage, bingkai krem, nav menyatu dengan hero (CSS body.layar-beranda).
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  const [judulAwal, kataTekanan] = pisahKataAkhir(t('beranda.waris_itu_gampang_asal_tahu_urutannya'));
  const totalPelajaran = daftarPelajaran().length;
  const hero = useRef<HTMLElement>(null);
  useCahayaIkutKursor(hero);

  return (
    <main className="halaman-beranda">
      <header className="hero-beranda" ref={hero}>
        <div className="sapa-beranda">
          <h1>{judulAwal} <span className="tekanan">{kataTekanan}</span></h1>
          <p className="lead">{t('beranda.hitung_pembagian_warisan_menurut_madzhab_syafi')}</p>
          <div className="aksi-hero">
            <a className="pil-hero pil-terang" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}><Ikon nama="hitung" ukuran={18} />{t('beranda.coba_di_ariflab')}</a>
            <a className="tautan-hero" href={berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar()}>{jumlahSelesai === 0 ? t('beranda.mulai_belajar') : t('beranda.lanjut_belajar')} {panah()}</a>
          </div>
        </div>
        <ContohHidup saatCoba={saatCoba} />
      </header>

      <div className="tata-beranda">
        <h2 className="judul-bagian">{t('beranda.mulai_dari_mana')}</h2>
        <a className="ubin ubin-kasus" style={{ '--i': 0 } as CSSProperties} href={TAUTAN_KALKULATOR} onClick={saatKeHitung}>
          <span className="label-langkah">{terakhir ? t('beranda.kasus_terakhir') : t('beranda.punya_kasus_sendiri')}</span>
          {terakhir ? <><b className="judul-ubin">{terakhir.judul}</b><span className="keterangan">{terakhir.keterangan}</span></>
            : <><b className="judul-ubin">{t('beranda.mulai_hitung')}</b><span className="keterangan">{t('beranda.isi_data_almarhum_ahli_waris_dan')}</span></>}
          <span className="aksi-status">{terakhir ? t('beranda.lanjutkan_kasus') : t('beranda.mulai_hitung')} {panah()}</span>
        </a>
        <a className="ubin ubin-belajar" style={{ '--i': 1 } as CSSProperties} href={tautanBelajar(berikutnya?.slug)}>
          <Cincin selesai={jumlahSelesai} total={totalPelajaran} />
          <span className="isi-ubin">
            <span className="label-langkah">{t('umum.belajar')}</span>
            <b className="judul-ubin">{t('hitung.selesai_total_pelajaran', { selesai: jumlahSelesai, total: totalPelajaran })}</b>
            <span className="keterangan">{berikutnya ? t('hitung.berikutnya_judul', { judul: berikutnya.judul }) : t('beranda.semua_pelajaran_sudah_selesai')}</span>
            <span className="aksi-status">{jumlahSelesai === 0 ? t('beranda.mulai_belajar') : berikutnya ? t('beranda.lanjutkan_belajar') : t('beranda.lihat_materi')} {panah()}</span>
          </span>
        </a>
        <a className="ubin ubin-latihan" style={{ '--i': 2 } as CSSProperties} href={tautanLatihan()}>
          <span className="label-langkah">{t('umum.latihan')}</span>
          <b className="judul-ubin">{t('hitung.selesai_total_soal_hitung', { selesai: soalSelesai, total: daftarSoalHitung().length })}</b>
          <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(soalSelesai / Math.max(1, daftarSoalHitung().length)) * 100}%` }} /></span>
          <span className="keterangan">{kuisTerakhir ? t('hitung.kuis_terakhir_judul_skor_skor', { judul: kuisTerakhir.judul, skor: kuisTerakhir.hasil ?? '' }) : t('beranda.belum_ada_kuis_yang_dikerjakan')}</span>
          <span className="aksi-status">{soalSelesai === 0 && !kuisTerakhir ? t('beranda.mulai_latihan') : t('beranda.lanjutkan_latihan')} {panah()}</span>
        </a>
        <section className="ubin ubin-tanya" style={{ '--i': 3 } as CSSProperties} aria-labelledby="judul-tanya">
          <h2 id="judul-tanya" className="label-langkah">{t('beranda.dari_faq')}</h2>
          <ol className="daftar-polos daftar-tanya">
            {daftarFaq().slice(0, JUMLAH_TANYA).map((entri, urutan) => (
              <li key={entri.id}><a className="baris-tanya" href={tautanFaq(entri.id)}><span className="nomor-tanya" aria-hidden="true">{angka(String(urutan + 1))}</span><b>{entri.pertanyaan}</b></a></li>
            ))}
          </ol>
          <a href={tautanFaq()} className="aksi-status">{t('hitung.semua_pertanyaan')} {panah()}</a>
        </section>

        <nav className="cari-tahu" aria-labelledby="judul-cari">
          <h2 id="judul-cari" className="label-langkah">{t('beranda.cari_tahu')}</h2>
          <a className="tautan-cari" href={tautanGlosarium()}><Ikon nama="glosarium" ukuran={20} />{t('umum.glosarium')}</a>
          <a className="tautan-cari" href={tautanRujukan()}><Ikon nama="rujukan" ukuran={20} />{t('umum.rujukan')}</a>
          <a className="tautan-cari" href={tautanFaq()}><Ikon nama="tanya" ukuran={20} />{t('umum.faq')}</a>
          <a className="tautan-cari" href={tautanTanyaJawab()}><Ikon nama="tanya" ukuran={20} />{t('umum.tanya_jawab')}</a>
        </nav>
      </div>

      <footer className="tentang-tim" aria-labelledby="judul-tentang">
        <h2 id="judul-tentang" className="label-langkah">{t('beranda.tentang_arif')}</h2>
        {!merekDisamarkan && <p>
          <b>{t('beranda.arif')}</b> {t('beranda.singkatan_dari')} <b>{t('beranda.aplikasi_representasi_ilmu_faraidh')}</b>{t('hitung.tempat_ilmu_waris_islam_dipelajari_lewat')} <b>{t('hitung.ariflab')}</b>{t('hitung.ruang_untuk_mencoba_simulasi_hitung_waris')}
        </p>}
        <p>
          {t('hitung.aplikasi_ini_berawal_dari_tugas_akhir')} <Nama {...KAMPUS} />.
          {' '}{t('hitung.kami_ingin_ilmu_faraidh_terasa_dekat')}
        </p>
        <p>
          {TIM.map((orang, i) => (
            <span key={orang.nama}>{i > 0 && (i === TIM.length - 1 ? t('hitung.dan_2') : t('hitung.teks'))}<Nama {...orang} /> {orang.peran}</span>
          ))}.
          {' '}{t('hitung.semuanya_berjalan_di_bawah_bimbingan')} {PEMBIMBING.map((orang, i) => (
            <span key={orang.nama}>{i > 0 && t('umum.dan')}<Nama {...orang} /></span>
          ))}.
        </p>
      </footer>
    </main>
  );
}

/** Cahaya hangat hero mengikuti kursor dengan gerak melambat (easing); tanpa gerak bila pengguna mengurangi animasi. */
function useCahayaIkutKursor(hero: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const elemen = hero.current;
    if (!elemen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = { x: 0, y: 0 };
    const kini = { x: 0, y: 0 };
    let bingkai = 0;
    const gerak = () => {
      kini.x += (target.x - kini.x) * 0.08;
      kini.y += (target.y - kini.y) * 0.08;
      elemen.style.setProperty('--mx', `${kini.x}px`);
      elemen.style.setProperty('--my', `${kini.y}px`);
      bingkai = Math.abs(target.x - kini.x) + Math.abs(target.y - kini.y) > 0.5 ? requestAnimationFrame(gerak) : 0;
    };
    const saatGerak = (kejadian: PointerEvent) => {
      const kotak = elemen.getBoundingClientRect();
      target.x = kejadian.clientX - kotak.left;
      target.y = kejadian.clientY - kotak.top;
      if (!bingkai) bingkai = requestAnimationFrame(gerak);
    };
    // Posisi awal = titik bawaan CSS (kanan tengah) supaya tidak melompat saat kursor pertama datang.
    const awal = elemen.getBoundingClientRect();
    target.x = kini.x = awal.width * 0.72;
    target.y = kini.y = awal.height * 0.58;
    elemen.addEventListener('pointermove', saatGerak);
    return () => { elemen.removeEventListener('pointermove', saatGerak); cancelAnimationFrame(bingkai); };
  }, [hero]);
}

/** Cincin progres belajar; angkanya juga tertulis di judul ubin, jadi cincin ini hiasan data (aria-hidden). */
function Cincin({ selesai, total }: { selesai: number; total: number }) {
  const jari = 40;
  const keliling = 2 * Math.PI * jari;
  return (
    <svg className="cincin-beranda" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r={jari} className="cincin-latar" />
      <circle cx="50" cy="50" r={jari} className="cincin-isi" transform="rotate(-90 50 50)"
        strokeDasharray={keliling} style={{ '--panjang': keliling, '--sisa': keliling * (1 - selesai / Math.max(1, total)) } as CSSProperties} />
    </svg>
  );
}

/** Kata terakhir judul diberi tekanan (garis tergambar); kalimat satu kata tidak dipisah. */
function pisahKataAkhir(teks: string): [string, string] {
  const titik = teks.lastIndexOf(' ');
  return titik < 0 ? ['', teks] : [teks.slice(0, titik), teks.slice(titik + 1)];
}

function Nama({ nama, situs }: { nama: string; situs?: string }) {
  return situs ? <a className="tautan-lembut" href={situs} target="_blank" rel="noreferrer">{nama}</a> : <>{nama}</>;
}

const entriTerbaru = () => bacaRiwayat().reduce<EntriRiwayat | null>(
  (terbaru, entri) => (!terbaru || entri.waktu > terbaru.waktu ? entri : terbaru), null);
