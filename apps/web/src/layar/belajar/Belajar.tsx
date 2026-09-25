// Beranda pusat belajar: lanjutkan pelajaran, daftar modul beserta pelajarannya, dan pintu ke glosarium & rujukan.
// Modul yang belum punya pelajaran tetap tampil sebagai "menyusul" supaya urutan belajarnya terlihat utuh.

import { DAFTAR_MODUL, DAFTAR_PELAJARAN } from '@waris/content';
import { bacaPelajaranSelesai } from '../../preferensi';
import { tautanBelajar, tautanGlosarium, tautanRujukan } from '../../rute';

export function Belajar() {
  const selesai = bacaPelajaranSelesai();
  const berikutnya = DAFTAR_PELAJARAN.find(pelajaran => !selesai.has(pelajaran.slug));
  return (
    <main className="halaman tumpuk">
      <h1>Belajar faraidh</h1>
      <p className="lead">Dari nol sampai bisa menghitung sendiri. Tiap contoh dihitung langsung oleh kalkulator.</p>
      {berikutnya && (
        <a className="aw-btn aw-btn-primary tombol-lanjut" href={tautanBelajar(berikutnya.slug)}>
          {selesai.size === 0 ? 'Mulai' : 'Lanjutkan'}: {berikutnya.judul}
        </a>
      )}
      <p className="keterangan">{selesai.size} dari {DAFTAR_PELAJARAN.length} pelajaran selesai.</p>

      <ol className="daftar-polos tumpuk">
        {DAFTAR_MODUL.map(modul => {
          const daftar = DAFTAR_PELAJARAN.filter(pelajaran => pelajaran.modul === modul.nomor);
          return (
            <li key={modul.nomor} className={daftar.length ? 'kartu kartu-modul' : 'kartu kartu-modul modul-menyusul'}>
              <p className="label-langkah">Modul {modul.nomor}{daftar.length ? '' : ' · menyusul'}</p>
              <h2>{modul.judul}</h2>
              <p className="keterangan">{modul.ringkas}</p>
              {daftar.length > 0 && (
                <ol className="daftar-pelajaran">
                  {daftar.map(pelajaran => (
                    <li key={pelajaran.slug}>
                      <a href={tautanBelajar(pelajaran.slug)}>{pelajaran.judul}</a>
                      {selesai.has(pelajaran.slug) && <span className="tanda-selesai" aria-label="selesai"> ✓</span>}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>

      <div className="kartu-pilihan-deret ringkas">
        <a className="kartu-pilihan kecil" href={tautanGlosarium()}>Glosarium<small>Arti istilah faraidh dalam bahasa sehari-hari.</small></a>
        <a className="kartu-pilihan kecil" href={tautanRujukan()}>Rujukan<small>Kitab, hadits, dan dalil yang dipakai.</small></a>
      </div>
    </main>
  );
}
