// Beranda Belajar (etalase): lanjutkan pelajaran, angka progres, jalur modul, jejak terakhir, dan pintu ke
// latihan, kuis, tanya jawab, glosarium, rujukan. Teks sesedikit mungkin; angka dan kartu yang bicara.

import { DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS } from '@waris/content';
import { bacaAktivitas, bacaCatatan, bacaPelajaranSelesai, type Aktivitas } from '../../preferensi';
import { waktuRelatif } from '../../riwayat';
import { tautanBelajar, tautanFaq, tautanGlosarium, tautanLatihan, tautanRujukan } from '../../rute';
import { PAKET_ACAK } from './Latihan';

export function Belajar() {
  const selesai = bacaPelajaranSelesai();
  const soalSelesai = Object.keys(bacaCatatan('soal')).filter(kode => DAFTAR_SOAL_HITUNG.some(soal => soal.kode === kode)).length;
  const kuisBenar = DAFTAR_SOAL_KUIS.filter(soal => bacaCatatan('kuis')[soal.kode] === 'benar').length;
  const jumlahSelesai = DAFTAR_PELAJARAN.filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const persen = Math.round((jumlahSelesai / DAFTAR_PELAJARAN.length) * 100);
  const berikutnya = DAFTAR_PELAJARAN.find(pelajaran => !selesai.has(pelajaran.slug));
  const aktivitas = bacaAktivitas().slice(0, 5);
  const sekarang = Date.now();

  return (
    <main className="halaman tumpuk pusat-belajar">
      <section className="hero-belajar">
        <div className="tumpuk-rapat">
          <h1>Pusat belajar faraidh</h1>
          <p className="lead">Dari nol sampai bisa menghitung sendiri.</p>
          {berikutnya ? (
            <a className="kartu-lanjut" href={tautanBelajar(berikutnya.slug)}>
              <span className="label-langkah">{jumlahSelesai === 0 ? 'Mulai dari sini' : 'Lanjutkan'} · Modul {berikutnya.modul}</span>
              <b>{berikutnya.judul}</b>
              <span className="panah" aria-hidden="true">→</span>
            </a>
          ) : <p className="kartu-lanjut"><b>Semua pelajaran sudah selesai. Mantap!</b></p>}
        </div>
        <CincinProgres persen={persen} label={`${jumlahSelesai}/${DAFTAR_PELAJARAN.length} pelajaran`} />
      </section>

      <section className="deret-angka" aria-label="Progres">
        <KotakAngka nilai={jumlahSelesai} total={DAFTAR_PELAJARAN.length} label="Pelajaran selesai" tautan={berikutnya ? tautanBelajar(berikutnya.slug) : tautanBelajar()} />
        <KotakAngka nilai={soalSelesai} total={DAFTAR_SOAL_HITUNG.length} label="Soal hitung dikerjakan" tautan={tautanLatihan('hitung')} />
        <KotakAngka nilai={kuisBenar} total={DAFTAR_SOAL_KUIS.length} label="Kuis dijawab benar" tautan={tautanLatihan('kuis')} />
      </section>

      <section className="tumpuk-rapat" aria-labelledby="judul-jalur">
        <h2 id="judul-jalur">Jalur belajar</h2>
        <ol className="daftar-polos grid-modul">
          {DAFTAR_MODUL.map(modul => {
            const daftar = DAFTAR_PELAJARAN.filter(pelajaran => pelajaran.modul === modul.nomor);
            const beres = daftar.filter(pelajaran => selesai.has(pelajaran.slug)).length;
            const tujuan = daftar.find(pelajaran => !selesai.has(pelajaran.slug)) ?? daftar[0];
            const isi = (
              <>
                <span className="nomor-modul">{beres === daftar.length && daftar.length > 0 ? '✓' : modul.nomor}</span>
                <b>{modul.judul}</b>
                <span className="keterangan">{daftar.length ? `${beres}/${daftar.length} pelajaran` : 'Menyusul'}</span>
                {daftar.length > 0 && <span className="bar-progres" aria-hidden="true"><span style={{ width: `${(beres / daftar.length) * 100}%` }} /></span>}
              </>
            );
            return (
              <li key={modul.nomor}>
                {tujuan ? <a className="kartu-modul-jalur" href={tautanBelajar(tujuan.slug)} title={modul.ringkas}>{isi}</a>
                  : <div className="kartu-modul-jalur modul-menyusul" title={modul.ringkas}>{isi}</div>}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="dua-kolom-belajar">
        <section className="tumpuk-rapat" aria-labelledby="judul-jejak">
          <h2 id="judul-jejak">Terakhir kamu</h2>
          {aktivitas.length === 0 ? <p className="keterangan">Belum ada. Mulai dari pelajaran pertama, yuk.</p> : (
            <ul className="daftar-polos daftar-soal">
              {aktivitas.map(isi => (
                <li key={`${isi.jenis}-${isi.kode}`} className="baris-soal">
                  <span className="ikon-aktivitas" aria-hidden="true">{IKON[isi.jenis]}</span>
                  <a className="isi-soal" href={tautanAktivitas(isi)}>
                    <b>{isi.judul}</b>
                    <span className="keterangan">{LABEL[isi.jenis]}{isi.hasil ? ` · skor ${isi.hasil}` : ''} · {waktuRelatif(isi.waktu, sekarang)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tumpuk-rapat" aria-labelledby="judul-jelajah">
          <h2 id="judul-jelajah">Jelajahi</h2>
          <div className="grid-pintu">
            <Pintu tautan={tautanLatihan('hitung')} ikon="🧮" judul="Soal hitung" />
            <Pintu tautan={tautanLatihan('kuis', PAKET_ACAK)} ikon="🎲" judul="Kuis acak" />
            <Pintu tautan={tautanFaq()} ikon="💬" judul="Tanya jawab" />
            <Pintu tautan={tautanGlosarium()} ikon="📘" judul="Glosarium" />
            <Pintu tautan={tautanRujukan()} ikon="📜" judul="Rujukan" />
          </div>
        </section>
      </div>
    </main>
  );
}

const IKON: Record<Aktivitas['jenis'], string> = { pelajaran: '📖', soal: '🧮', kuis: '✅' };
const LABEL: Record<Aktivitas['jenis'], string> = { pelajaran: 'Pelajaran', soal: 'Soal hitung', kuis: 'Kuis' };

function tautanAktivitas(aktivitas: Aktivitas): string {
  if (aktivitas.jenis === 'pelajaran') return tautanBelajar(aktivitas.kode);
  if (aktivitas.jenis === 'kuis') return tautanLatihan('kuis', aktivitas.kode);
  return tautanLatihan('hitung');
}

function KotakAngka({ nilai, total, label, tautan }: { nilai: number; total: number; label: string; tautan: string }) {
  return (
    <a className="kotak-angka" href={tautan}>
      <span className="angka-besar">{nilai}<small>/{total}</small></span>
      <span className="keterangan">{label}</span>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${total ? (nilai / total) * 100 : 0}%` }} /></span>
    </a>
  );
}

const Pintu = ({ tautan, ikon, judul }: { tautan: string; ikon: string; judul: string }) => (
  <a className="pintu-belajar" href={tautan}><span aria-hidden="true">{ikon}</span>{judul}</a>
);

/** Cincin progres keseluruhan; angka di tengah juga ditulis sebagai teks untuk pembaca layar. */
function CincinProgres({ persen, label }: { persen: number; label: string }) {
  const jari = 52;
  const keliling = 2 * Math.PI * jari;
  return (
    <figure className="cincin-progres" aria-label={`Progres ${persen}%, ${label}`}>
      <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
        <circle cx="60" cy="60" r={jari} className="cincin-latar" />
        <circle cx="60" cy="60" r={jari} className="cincin-isi" strokeDasharray={keliling} strokeDashoffset={keliling * (1 - persen / 100)} transform="rotate(-90 60 60)" />
      </svg>
      <figcaption><b>{persen}%</b><span>{label}</span></figcaption>
    </figure>
  );
}
