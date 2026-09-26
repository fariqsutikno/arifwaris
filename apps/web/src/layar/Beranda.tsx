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
  { nama: t('Fariq bin Sutikno'), peran: t('menulis kodenya'), situs: 'https://github.com/fariqsutikno' },
  { nama: t('Ridha Ar Rasyid'), peran: 'mengujinya', situs: 'https://www.linkedin.com/in/ridha-ar-rasyid' },
  { nama: t('Muhammad Fatih Ikhsan'), peran: t('menjaga ilmunya'), situs: 'https://www.instagram.com/muhammadfatihikhsan' },
  { nama: t('Riyan Maulana Sidiq'), peran: t('menjaga ilmunya'), situs: 'https://www.instagram.com/riyanmaulanasidiq' },
];
const PEMBIMBING: { nama: string; situs?: string }[] = [
  { nama: t('Ustaz Muhammad Yassir, M.H.'), situs: 'https://www.instagram.com/muhammadyassir' },
  { nama: t('Ustaz Arif Husnul Khuluq, M.H.'), situs: 'https://www.instagram.com/arifhusnulkhuluq' },
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
          <h1 className="judul-beranda">{t('Waris itu gampang, asal tahu urutannya.')}</h1>
          <p className="lead">{t('Hitung pembagian warisan menurut madzhab Syafi\'i, lengkap dengan alasan tiap angkanya, dan pelajari ilmunya pelan-pelan.')}</p>
        </header>

        <div className="aksi-dasbor">
          <a className="kartu-pilihan pilihan-utama" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}>
            <span className="judul-pilihan"><Ikon nama="hitung" ukuran={24} />{t('Coba di ArifLab')}</span>
            <small>{t('Isi data almarhum, ahli waris, dan harta. Sekitar 3 menit.')}</small>
          </a>
          <a className="kartu-pilihan" href={berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar()}>
            <span className="judul-pilihan"><Ikon nama="pelajaran" ukuran={24} />{jumlahSelesai === 0 ? t('Mulai belajar') : t('Lanjut belajar')}</span>
            <small>{berikutnya ? t('Berikutnya: {judul}', { judul: berikutnya.judul }) : t('Semua pelajaran sudah selesai.')}</small>
          </a>
        </div>

        <section className="tumpuk-rapat" aria-labelledby="judul-status">
          <h2 id="judul-status" className="tanya-tujuan">{t('Punyamu di perangkat ini')}</h2>
          <div className="status-dasbor">
            <a className="kotak-status" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}>
              <span className="label-langkah">{t('Kasus terakhir')}</span>
              {terakhir ? <><b>{terakhir.judul}</b><span className="keterangan">{terakhir.keterangan}</span></>
                : <span className="keterangan">{t('Belum ada kasus yang dihitung.')}</span>}
              <span className="aksi-status">{terakhir ? t('Lanjutkan kasus') : t('Mulai hitung')} {panah()}</span>
            </a>
            <a className="kotak-status" href={tautanBelajar()}>
              <span className="label-langkah">{t('Belajar')}</span>
              <b>{t('{selesai}/{total} pelajaran', { selesai: jumlahSelesai, total: daftarPelajaran().length })}</b>
              <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(jumlahSelesai / daftarPelajaran().length) * 100}%` }} /></span>
              <span className="aksi-status">{jumlahSelesai === 0 ? t('Mulai belajar') : berikutnya ? t('Lanjutkan belajar') : t('Lihat materi')} {panah()}</span>
            </a>
            <a className="kotak-status" href={tautanLatihan()}>
              <span className="label-langkah">{t('Latihan')}</span>
              <b>{t('{selesai}/{total} soal hitung', { selesai: soalSelesai, total: daftarSoalHitung().length })}</b>
              <span className="keterangan">{kuisTerakhir ? t('Kuis terakhir: {judul}, skor {skor}', { judul: kuisTerakhir.judul, skor: kuisTerakhir.hasil ?? '' }) : t('Belum ada kuis yang dikerjakan.')}</span>
              <span className="aksi-status">{soalSelesai === 0 && !kuisTerakhir ? t('Mulai latihan') : t('Lanjutkan latihan')} {panah()}</span>
            </a>
          </div>
        </section>

        <div className="dua-kolom-dasbor">
          <section className="tumpuk-rapat" aria-labelledby="judul-tanya">
            <h2 id="judul-tanya" className="tanya-tujuan">{t('Dari FAQ')}</h2>
            <ul className="daftar-polos daftar-soal">
              {daftarFaq().slice(0, JUMLAH_TANYA).map(entri => (
                <li key={entri.id} className="baris-soal"><a className="isi-soal" href={tautanFaq(entri.id)}><b>{entri.pertanyaan}</b></a></li>
              ))}
            </ul>
            <a href={tautanFaq()}>{t('Semua pertanyaan')}</a>
          </section>
          <section className="tumpuk-rapat" aria-labelledby="judul-cari">
            <h2 id="judul-cari" className="tanya-tujuan">{t('Cari tahu')}</h2>
            <div className="grid-pintu">
              <Pintu tautan={tautanGlosarium()} ikon="glosarium" judul={t('Glosarium')} />
              <Pintu tautan={tautanRujukan()} ikon="rujukan" judul={t('Rujukan')} />
              <Pintu tautan={tautanFaq()} ikon="tanya" judul={t('FAQ')} />
              <Pintu tautan={tautanTanyaJawab()} ikon="tanya" judul={t('Tanya jawab')} />
            </div>
          </section>
        </div>

        <footer className="tentang-tim" aria-labelledby="judul-tentang">
          <h2 id="judul-tentang" className="label-langkah">{t('Tentang ARIF')}</h2>
          <p>
            <b>{t('ARIF')}</b> {t('singkatan dari')} <b>{t('Aplikasi Representasi Ilmu Faraidh')}</b>{t(': tempat ilmu waris Islam dipelajari lewat penjelasan, latihan, dan')} <b>{t('ArifLab')}</b>{t(', ruang untuk mencoba simulasi hitung waris sendiri.')}
          </p>
          <p>
            {t('Aplikasi ini berawal dari tugas akhir beberapa mahasiswa Hukum Keluarga Islam di')} <Nama {...KAMPUS} />.
            {' '}{t('Kami ingin ilmu faraidh terasa dekat: bisa dihitung, sekaligus dipahami alasannya.')}
          </p>
          <p>
            {TIM.map((orang, i) => (
              <span key={orang.nama}>{i > 0 && (i === TIM.length - 1 ? t(', dan ') : t(', '))}<Nama {...orang} /> {orang.peran}</span>
            ))}.
            {' '}{t('Semuanya berjalan di bawah bimbingan')} {PEMBIMBING.map((orang, i) => (
              <span key={orang.nama}>{i > 0 && t(' dan ')}<Nama {...orang} /></span>
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
