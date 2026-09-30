// Beranda: hero dengan satu aksi utama, papan peta jalur (kasus terakhir, progres belajar, latihan di perangkat ini),
// pintu ke referensi, dan identitas tim penyusun.
// Semua angka dari penyimpanan lokal; bila kosong, tampil ajakan memulai, bukan angka nol yang menggantung.

import { daftarFaq, daftarPelajaran, daftarSoalHitung } from '../konten/sumber';
import type { Kasus } from '../kasus';
import { bacaAktivitas } from '../preferensi';
import { bacaPelajaranSelesai, bacaProgresLatihan } from '../progres';
import { bacaRiwayat, ringkasKasus, type EntriRiwayat } from '../riwayat';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanFaq, tautanTanyaJawab, tautanGlosarium, tautanLatihan, tautanRujukan } from '../rute';
import { Ikon } from '../ui/Ikon';
import { PetaJalur, type LintasPeta } from './PetaJalur';
import { LANGKAH_WIZARD } from '../konten/wizard';
import { langkahTerjauh } from './wizard/validasi';
import { Motif } from '../ui/komponen';
import { merekDisamarkan, panah, t } from '../terjemah';

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
  const soalSelesai = daftarSoalHitung().filter(soal => bacaProgresLatihan('hitung')[soal.kode]).length;
  const kuisTerakhir = bacaAktivitas().find(aktivitas => aktivitas.jenis === 'kuis');
  // Tanpa kasus yang sedang dimuat (misal sesudah reset), tetap tunjukkan entri riwayat terbaru,
  // supaya Beranda tidak bilang "belum ada" sementara Riwayat berisi.
  const terakhir = kasusTerakhir ? ringkasKasus(kasusTerakhir) : entriTerbaru();

  const langkahKasus = kasusTerakhir ? langkahTerjauh(kasusTerakhir) : terakhir ? 1 : 0;
  const namaLangkah = [...LANGKAH_WIZARD.map(teks => teks.nama), t('hitung.hasil')];
  const lintas: LintasPeta[] = [
    {
      id: 'hitung', ikon: 'hitung', judul: t('beranda.kasus_terakhir'), stasiun: namaLangkah, jumlah: namaLangkah.length,
      dilewati: Math.max(0, langkahKasus - 1),
      keterangan: terakhir ? <><b>{terakhir.judul}</b> {terakhir.keterangan}</> : t('beranda.belum_ada_kasus_yang_dihitung'),
      tautan: TAUTAN_KALKULATOR, saatKlik: saatKeHitung, aksi: `${terakhir ? t('beranda.lanjutkan_kasus') : t('beranda.mulai_hitung')} ${panah()}`,
    },
    {
      id: 'belajar', ikon: 'pelajaran', judul: t('umum.belajar'), stasiun: [], jumlah: daftarPelajaran().length, dilewati: jumlahSelesai,
      keterangan: <><b>{t('hitung.selesai_total_pelajaran', { selesai: jumlahSelesai, total: daftarPelajaran().length })}</b> {berikutnya ? t('hitung.berikutnya_judul', { judul: berikutnya.judul }) : t('beranda.semua_pelajaran_sudah_selesai')}</>,
      tautan: berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar(),
      aksi: `${jumlahSelesai > 0 && berikutnya ? t('beranda.lanjutkan_belajar') : t('beranda.lihat_materi')} ${panah()}`,
    },
    {
      id: 'latihan', ikon: 'kuis', judul: t('umum.latihan'), stasiun: [], jumlah: Math.min(daftarSoalHitung().length, 24), dilewati: Math.round(soalSelesai / Math.max(1, daftarSoalHitung().length) * Math.min(daftarSoalHitung().length, 24)),
      keterangan: <><b>{t('hitung.selesai_total_soal_hitung', { selesai: soalSelesai, total: daftarSoalHitung().length })}</b> {kuisTerakhir ? t('hitung.kuis_terakhir_judul_skor_skor', { judul: kuisTerakhir.judul, skor: kuisTerakhir.hasil ?? '' }) : t('beranda.belum_ada_kuis_yang_dikerjakan')}</>,
      tautan: tautanLatihan(), aksi: `${soalSelesai === 0 && !kuisTerakhir ? t('beranda.mulai_latihan') : t('beranda.lanjutkan_latihan')} ${panah()}`,
    },
  ];

  return (
    <Motif>
      <main className="halaman tumpuk dasbor">
        <div className="hero-beranda">
          <header className="tumpuk hero-teks">
            <h1 className="judul-beranda">{t('beranda.waris_itu_gampang_asal_tahu_urutannya')}</h1>
            <p className="lead">{t('beranda.hitung_pembagian_warisan_menurut_madzhab_syafi')}</p>
            <div className="aksi-hero">
              <a className="aw-btn aw-btn-primary" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}><Ikon nama="hitung" ukuran={20} />{t('beranda.coba_di_ariflab')}</a>
              <a href={berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar()}>{jumlahSelesai === 0 ? t('beranda.mulai_belajar') : t('beranda.lanjut_belajar')} {panah()}</a>
            </div>
            <p className="keterangan">{t('beranda.isi_data_almarhum_ahli_waris_dan')}</p>
          </header>
          <PetaJalur judul={t('beranda.punyamu_di_perangkat_ini')} lintas={lintas} />
        </div>

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
            <ul className="daftar-tautan daftar-polos">
              {([['glosarium', t('umum.glosarium'), tautanGlosarium()], ['rujukan', t('umum.rujukan'), tautanRujukan()], ['tanya', t('umum.tanya_jawab'), tautanTanyaJawab()]] as const).map(([ikon, judul, tautan]) => (
                <li key={ikon}><a className="tautan-daftar" href={tautan}><Ikon nama={ikon} ukuran={20} />{judul}</a></li>
              ))}
            </ul>
          </section>
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
    </Motif>
  );
}

function Nama({ nama, situs }: { nama: string; situs?: string }) {
  return situs ? <a className="tautan-lembut" href={situs} target="_blank" rel="noreferrer">{nama}</a> : <>{nama}</>;
}

const entriTerbaru = () => bacaRiwayat().reduce<EntriRiwayat | null>(
  (terbaru, entri) => (!terbaru || entri.waktu > terbaru.waktu ? entri : terbaru), null);
