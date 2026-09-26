// Beranda (dashboard): dua aksi utama (hitung skenario, lanjut belajar), status pengguna di perangkat ini
// (kasus terakhir, progres belajar, latihan), pintu ke referensi, dan identitas tim penyusun.
// Semua angka dari penyimpanan lokal; bila kosong, tampil ajakan memulai, bukan angka nol yang menggantung.

import { DAFTAR_FAQ, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG } from '@waris/content';
import type { Kasus } from '../kasus';
import { bacaAktivitas, bacaCatatan, bacaPelajaranSelesai } from '../preferensi';
import { bacaRiwayat, ringkasKasus, type EntriRiwayat } from '../riwayat';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanFaq, tautanTanyaJawab, tautanGlosarium, tautanLatihan, tautanRujukan } from '../rute';
import { Ikon } from '../ui/Ikon';
import { Pintu } from './belajar/Belajar';
import { Motif } from '../ui/komponen';

const JUMLAH_TANYA = 3;
// Situs pribadi masih PLACEHOLDER (tebakan), ganti dengan akun asli; nama tanpa situs tampil sebagai teks biasa.
const KAMPUS = { nama: "STDI Imam Syafi'i Jember", situs: 'https://stdiis.ac.id' };
const TIM: { nama: string; peran: string; situs?: string }[] = [
  { nama: 'Fariq bin Sutikno', peran: 'menulis kodenya', situs: 'https://github.com/fariqsutikno' },
  { nama: 'Ridha Ar Rasyid', peran: 'mengujinya', situs: 'https://www.linkedin.com/in/ridha-ar-rasyid' },
  { nama: 'Muhammad Fatih Ikhsan', peran: 'menjaga ilmunya', situs: 'https://www.instagram.com/muhammadfatihikhsan' },
  { nama: 'Riyan Maulana Sidiq', peran: 'menjaga ilmunya', situs: 'https://www.instagram.com/riyanmaulanasidiq' },
];
const PEMBIMBING: { nama: string; situs?: string }[] = [
  { nama: 'Ustaz Muhammad Yassir, M.H.', situs: 'https://www.instagram.com/muhammadyassir' },
  { nama: 'Ustaz Arif Husnul Khuluq, M.H.', situs: 'https://www.instagram.com/arifhusnulkhuluq' },
];

export function Beranda({ kasusTerakhir, saatKeHitung }: { kasusTerakhir: Kasus | null; saatKeHitung: () => void }) {
  const selesai = bacaPelajaranSelesai();
  const jumlahSelesai = DAFTAR_PELAJARAN.filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const berikutnya = DAFTAR_PELAJARAN.find(pelajaran => !selesai.has(pelajaran.slug));
  const soalSelesai = DAFTAR_SOAL_HITUNG.filter(soal => bacaCatatan('soal')[soal.kode]).length;
  const kuisTerakhir = bacaAktivitas().find(aktivitas => aktivitas.jenis === 'kuis');
  // Tanpa kasus yang sedang dimuat (misal sesudah reset), tetap tunjukkan entri riwayat terbaru,
  // supaya Beranda tidak bilang "belum ada" sementara Riwayat berisi.
  const terakhir = kasusTerakhir ? ringkasKasus(kasusTerakhir) : entriTerbaru();

  return (
    <Motif>
      <main className="halaman tumpuk dasbor">
        <header className="tumpuk-rapat">
          <h1 className="judul-beranda">Waris itu gampang, asal tahu urutannya.</h1>
          <p className="lead">Hitung pembagian warisan menurut madzhab Syafi'i, lengkap dengan alasan tiap angkanya, dan pelajari ilmunya pelan-pelan.</p>
        </header>

        <div className="aksi-dasbor">
          <a className="kartu-pilihan pilihan-utama" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}>
            <span className="judul-pilihan"><Ikon nama="hitung" ukuran={24} />Coba di ArifLab</span>
            <small>Isi data almarhum, ahli waris, dan harta. Sekitar 3 menit.</small>
          </a>
          <a className="kartu-pilihan" href={berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar()}>
            <span className="judul-pilihan"><Ikon nama="pelajaran" ukuran={24} />{jumlahSelesai === 0 ? 'Mulai belajar' : 'Lanjut belajar'}</span>
            <small>{berikutnya ? `Berikutnya: ${berikutnya.judul}` : 'Semua pelajaran sudah selesai.'}</small>
          </a>
        </div>

        <section className="tumpuk-rapat" aria-labelledby="judul-status">
          <h2 id="judul-status" className="tanya-tujuan">Punyamu di perangkat ini</h2>
          <div className="status-dasbor">
            <a className="kotak-status" href={TAUTAN_KALKULATOR} onClick={saatKeHitung}>
              <span className="label-langkah">Kasus terakhir</span>
              {terakhir ? <><b>{terakhir.judul}</b><span className="keterangan">{terakhir.keterangan}</span></>
                : <span className="keterangan">Belum ada kasus yang dihitung.</span>}
              <span className="aksi-status">{terakhir ? 'Lanjutkan kasus' : 'Mulai hitung'} →</span>
            </a>
            <a className="kotak-status" href={tautanBelajar()}>
              <span className="label-langkah">Belajar</span>
              <b>{jumlahSelesai}/{DAFTAR_PELAJARAN.length} pelajaran</b>
              <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(jumlahSelesai / DAFTAR_PELAJARAN.length) * 100}%` }} /></span>
              <span className="aksi-status">{jumlahSelesai === 0 ? 'Mulai belajar' : berikutnya ? 'Lanjutkan belajar' : 'Lihat materi'} →</span>
            </a>
            <a className="kotak-status" href={tautanLatihan()}>
              <span className="label-langkah">Latihan</span>
              <b>{soalSelesai}/{DAFTAR_SOAL_HITUNG.length} soal hitung</b>
              <span className="keterangan">{kuisTerakhir ? `Kuis terakhir: ${kuisTerakhir.judul}, skor ${kuisTerakhir.hasil}` : 'Belum ada kuis yang dikerjakan.'}</span>
              <span className="aksi-status">{soalSelesai === 0 && !kuisTerakhir ? 'Mulai latihan' : 'Lanjutkan latihan'} →</span>
            </a>
          </div>
        </section>

        <div className="dua-kolom-dasbor">
          <section className="tumpuk-rapat" aria-labelledby="judul-tanya">
            <h2 id="judul-tanya" className="tanya-tujuan">Dari FAQ</h2>
            <ul className="daftar-polos daftar-soal">
              {DAFTAR_FAQ.slice(0, JUMLAH_TANYA).map(entri => (
                <li key={entri.id} className="baris-soal"><a className="isi-soal" href={tautanFaq(entri.id)}><b>{entri.pertanyaan}</b></a></li>
              ))}
            </ul>
            <a href={tautanFaq()}>Semua pertanyaan</a>
          </section>
          <section className="tumpuk-rapat" aria-labelledby="judul-cari">
            <h2 id="judul-cari" className="tanya-tujuan">Cari tahu</h2>
            <div className="grid-pintu">
              <Pintu tautan={tautanGlosarium()} ikon="glosarium" judul="Glosarium" />
              <Pintu tautan={tautanRujukan()} ikon="rujukan" judul="Rujukan" />
              <Pintu tautan={tautanFaq()} ikon="tanya" judul="FAQ" />
              <Pintu tautan={tautanTanyaJawab()} ikon="tanya" judul="Tanya jawab" />
            </div>
          </section>
        </div>

        <footer className="tentang-tim" aria-labelledby="judul-tentang">
          <h2 id="judul-tentang" className="label-langkah">Tentang ARIF</h2>
          <p>
            <b>ARIF</b> singkatan dari <b>Aplikasi Representasi Ilmu Faraidh</b>: tempat ilmu waris Islam dipelajari lewat penjelasan,
            latihan, dan <b>ArifLab</b>, ruang untuk mencoba simulasi hitung waris sendiri.
          </p>
          <p>
            Aplikasi ini berawal dari tugas akhir beberapa mahasiswa Hukum Keluarga Islam di <Nama {...KAMPUS} />.
            Kami ingin ilmu faraidh terasa dekat: bisa dihitung, sekaligus dipahami alasannya.
          </p>
          <p>
            {TIM.map((orang, i) => (
              <span key={orang.nama}>{i > 0 && (i === TIM.length - 1 ? ', dan ' : ', ')}<Nama {...orang} /> {orang.peran}</span>
            ))}.
            Semuanya berjalan di bawah bimbingan {PEMBIMBING.map((orang, i) => (
              <span key={orang.nama}>{i > 0 && ' dan '}<Nama {...orang} /></span>
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
