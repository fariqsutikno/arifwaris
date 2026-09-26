// Beranda (dashboard): dua aksi utama (hitung skenario, lanjut belajar), status pengguna di perangkat ini
// (kasus terakhir, progres belajar, latihan), pintu ke referensi, dan identitas tim penyusun.
// Semua angka dari penyimpanan lokal; bila kosong, tampil ajakan memulai, bukan angka nol yang menggantung.

import { daftarFaq, daftarPelajaran, daftarSoalHitung } from '../konten/sumber';
import type { Kasus } from '../kasus';
import { bacaAktivitas, bacaCatatan, bacaPelajaranSelesai } from '../preferensi';
import { bacaRiwayat, ringkasKasus, type EntriRiwayat } from '../riwayat';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanFaq, tautanTanyaJawab, tautanGlosarium, tautanLatihan, tautanRujukan } from '../rute';
import { Ikon } from '../ui/Ikon';
import { Pintu } from './belajar/Belajar';
import { Motif } from '../ui/komponen';
import { panah, t } from '../terjemah';

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

export function Beranda({ kasusTerakhir, saatKeHitung }: { kasusTerakhir: Kasus | null; saatKeHitung: () => void }) {
  const selesai = bacaPelajaranSelesai();
  const jumlahSelesai = daftarPelajaran().filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const berikutnya = daftarPelajaran().find(pelajaran => !selesai.has(pelajaran.slug));
  const soalSelesai = daftarSoalHitung().filter(soal => bacaCatatan('soal')[soal.kode]).length;
  const kuisTerakhir = bacaAktivitas().find(aktivitas => aktivitas.jenis === 'kuis');
  // Tanpa kasus yang sedang dimuat (misal sesudah reset), tetap tunjukkan entri riwayat terbaru,
  // supaya Beranda tidak bilang "belum ada" sementara Riwayat berisi.
  const terakhir = kasusTerakhir ? ringkasKasus(kasusTerakhir) : entriTerbaru();

  return (
    <Motif>
      <main className="halaman tumpuk dasbor">
        <header className="tumpuk-rapat">
          <h1 className="judul-beranda">{t('beranda.waris_itu_gampang_asal_tahu_urutannya')}</h1>
          <p className="lead">{t('beranda.hitung_pembagian_warisan_menurut_madzhab_syafi')}</p>
        </header>

        <div className="aksi-dasbor">
          <a className="kartu-pilihan pilihan-utama" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}>
            <span className="judul-pilihan"><Ikon nama="hitung" ukuran={24} />{t('beranda.coba_di_ariflab')}</span>
            <small>{t('beranda.isi_data_almarhum_ahli_waris_dan')}</small>
          </a>
          <a className="kartu-pilihan" href={berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar()}>
            <span className="judul-pilihan"><Ikon nama="pelajaran" ukuran={24} />{jumlahSelesai === 0 ? t('beranda.mulai_belajar') : t('beranda.lanjut_belajar')}</span>
            <small>{berikutnya ? t('hitung.berikutnya_judul', { judul: berikutnya.judul }) : t('beranda.semua_pelajaran_sudah_selesai')}</small>
          </a>
        </div>

        <section className="tumpuk-rapat" aria-labelledby="judul-status">
          <h2 id="judul-status" className="tanya-tujuan">{t('beranda.punyamu_di_perangkat_ini')}</h2>
          <div className="status-dasbor">
            <a className="kotak-status" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}>
              <span className="label-langkah">{t('beranda.kasus_terakhir')}</span>
              {terakhir ? <><b>{terakhir.judul}</b><span className="keterangan">{terakhir.keterangan}</span></>
                : <span className="keterangan">{t('beranda.belum_ada_kasus_yang_dihitung')}</span>}
              <span className="aksi-status">{terakhir ? t('beranda.lanjutkan_kasus') : t('beranda.mulai_hitung')} {panah()}</span>
            </a>
            <a className="kotak-status" href={tautanBelajar()}>
              <span className="label-langkah">{t('umum.belajar')}</span>
              <b>{t('hitung.selesai_total_pelajaran', { selesai: jumlahSelesai, total: daftarPelajaran().length })}</b>
              <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(jumlahSelesai / daftarPelajaran().length) * 100}%` }} /></span>
              <span className="aksi-status">{jumlahSelesai === 0 ? t('beranda.mulai_belajar') : berikutnya ? t('beranda.lanjutkan_belajar') : t('beranda.lihat_materi')} {panah()}</span>
            </a>
            <a className="kotak-status" href={tautanLatihan()}>
              <span className="label-langkah">{t('umum.latihan')}</span>
              <b>{t('hitung.selesai_total_soal_hitung', { selesai: soalSelesai, total: daftarSoalHitung().length })}</b>
              <span className="keterangan">{kuisTerakhir ? t('hitung.kuis_terakhir_judul_skor_skor', { judul: kuisTerakhir.judul, skor: kuisTerakhir.hasil ?? '' }) : t('beranda.belum_ada_kuis_yang_dikerjakan')}</span>
              <span className="aksi-status">{soalSelesai === 0 && !kuisTerakhir ? t('beranda.mulai_latihan') : t('beranda.lanjutkan_latihan')} {panah()}</span>
            </a>
          </div>
        </section>

        <div className="dua-kolom-dasbor">
          <section className="tumpuk-rapat" aria-labelledby="judul-tanya">
            <h2 id="judul-tanya" className="tanya-tujuan">{t('beranda.dari_faq')}</h2>
            <ul className="daftar-polos daftar-soal">
              {daftarFaq().slice(0, JUMLAH_TANYA).map(entri => (
                <li key={entri.id} className="baris-soal"><a className="isi-soal" href={tautanFaq(entri.id)}><b>{entri.pertanyaan}</b></a></li>
              ))}
            </ul>
            <a href={tautanFaq()}>{t('hitung.semua_pertanyaan')}</a>
          </section>
          <section className="tumpuk-rapat" aria-labelledby="judul-cari">
            <h2 id="judul-cari" className="tanya-tujuan">{t('beranda.cari_tahu')}</h2>
            <div className="grid-pintu">
              <Pintu tautan={tautanGlosarium()} ikon="glosarium" judul={t('umum.glosarium')} />
              <Pintu tautan={tautanRujukan()} ikon="rujukan" judul={t('umum.rujukan')} />
              <Pintu tautan={tautanFaq()} ikon="tanya" judul={t('umum.faq')} />
              <Pintu tautan={tautanTanyaJawab()} ikon="tanya" judul={t('umum.tanya_jawab')} />
            </div>
          </section>
        </div>

        <footer className="tentang-tim" aria-labelledby="judul-tentang">
          <h2 id="judul-tentang" className="label-langkah">{t('beranda.tentang_arif')}</h2>
          <p>
            <b>{t('beranda.arif')}</b> {t('beranda.singkatan_dari')} <b>{t('beranda.aplikasi_representasi_ilmu_faraidh')}</b>{t('hitung.tempat_ilmu_waris_islam_dipelajari_lewat')} <b>{t('hitung.ariflab')}</b>{t('hitung.ruang_untuk_mencoba_simulasi_hitung_waris')}
          </p>
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
    </Motif>
  );
}

function Nama({ nama, situs }: { nama: string; situs?: string }) {
  return situs ? <a className="tautan-lembut" href={situs} target="_blank" rel="noreferrer">{nama}</a> : <>{nama}</>;
}

const entriTerbaru = () => bacaRiwayat().reduce<EntriRiwayat | null>(
  (terbaru, entri) => (!terbaru || entri.waktu > terbaru.waktu ? entri : terbaru), null);
