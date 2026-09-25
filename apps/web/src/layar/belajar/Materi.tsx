// Satu pelajaran, tata letak e-learning: sidebar (progres + daftar modul & pelajaran) di kiri, isi di kanan.
// Di HP sidebar jadi laci dari kanan, dibuka lewat tombol yang menempel di tepi layar.
// Isi = blok Markdown terbatas dari packages/content: teks, tabel, video YouTube, contoh kasus dihitung engine,
// dan kuis cek pemahaman. Pelajaran ditandai selesai saat dibaca sampai bawah atau saat lanjut ke berikutnya.
// Navigasi bawah: Sebelumnya · Beranda belajar · Berikutnya, gayanya setara.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_KUIS, cariPelajaran,
  type Blok, type ContohKasus, type Pelajaran,
} from '@waris/content';
import { TabelFaraidh } from '../../hasil/TabelFaraidh';
import { ringkas } from '../../hasil/ringkasan';
import { jalankan, type HasilOk } from '../../jalankan';
import type { Kasus } from '../../kasus';
import { bacaPelajaranSelesai, catatAktivitas, tandaiPelajaranSelesai } from '../../preferensi';
import { tautanBelajar } from '../../rute';
import { kasusDariContoh } from './contoh';
import { KartuSoalKuis } from './KartuSoalKuis';
import { Sebaris } from './Sebaris';
import { TombolBukaKasus } from './TombolBukaKasus';
import { Ikon } from '../../ui/Ikon';
import { Laci } from '../../ui/Laci';

interface Props {
  slug: string;
  /** Kasus yang sedang ada di kalkulator; bila ada, "Buka di Hitung" minta konfirmasi dulu. */
  kasusSekarang: Kasus | null;
  saatCoba: (kasus: Kasus) => void;
}

export function Materi({ slug, kasusSekarang, saatCoba }: Props) {
  const pelajaran = cariPelajaran(slug);
  const ujung = useRef<HTMLElement>(null);
  // Dinaikkan saat pelajaran ditandai selesai supaya progres di sidebar langsung ikut berubah.
  const [, setVersiProgres] = useState(0);

  useEffect(() => {
    if (!pelajaran) return;
    catatAktivitas({ jenis: 'pelajaran', kode: pelajaran.slug, judul: pelajaran.judul, waktu: Date.now() });
    // Dibaca sampai bawah = selesai. Tanpa IntersectionObserver (browser lama, jsdom) cukup lewat tombol Berikutnya.
    if (!ujung.current || typeof IntersectionObserver === 'undefined') return;
    const pengamat = new IntersectionObserver(([isi]) => {
      if (!isi?.isIntersecting || bacaPelajaranSelesai().has(pelajaran.slug)) return;
      tandaiPelajaranSelesai(pelajaran.slug);
      setVersiProgres(versi => versi + 1);
    });
    pengamat.observe(ujung.current);
    return () => pengamat.disconnect();
  }, [pelajaran]);

  if (!pelajaran) {
    return <main className="halaman tumpuk"><a href={tautanBelajar()}>← Belajar</a><p role="alert">Pelajaran ini tidak ditemukan.</p></main>;
  }
  const indeks = DAFTAR_PELAJARAN.indexOf(pelajaran);
  const sebelumnya = DAFTAR_PELAJARAN[indeks - 1];
  const berikutnya = DAFTAR_PELAJARAN[indeks + 1];
  const modul = DAFTAR_MODUL.find(modulIni => modulIni.nomor === pelajaran.modul);

  return (
    <div className="tata-materi">
      <SidebarMateri key={pelajaran.slug} aktif={pelajaran} />
      <main className="konten-materi tumpuk">
        <p className="label-langkah">Modul {pelajaran.modul} · {modul?.judul} · Pelajaran {indeks + 1} dari {DAFTAR_PELAJARAN.length}</p>
        <h1>{pelajaran.judul}</h1>
        {pelajaran.perluCek && <p className="lencana-draf">Draf, belum direview tim keilmuan</p>}
        <p className="lead">{pelajaran.tujuan}</p>
        <article className="isi-materi">
          {pelajaran.blok.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />)}
        </article>
        <nav ref={ujung} className="navigasi-materi" aria-label="Navigasi pelajaran">
          <TautanNavigasi tujuan={sebelumnya} label="← Sebelumnya" />
          <a className="aw-btn aw-btn-secondary" href={tautanBelajar()}><Ikon nama="rumah" /> Beranda belajar</a>
          <TautanNavigasi tujuan={berikutnya} label="Berikutnya →" saatKlik={() => tandaiPelajaranSelesai(pelajaran.slug)} />
        </nav>
      </main>
    </div>
  );
}

function TautanNavigasi({ tujuan, label, saatKlik }: { tujuan: Pelajaran | undefined; label: string; saatKlik?: () => void }) {
  if (!tujuan) return <span className="aw-btn aw-btn-secondary nonaktif" aria-disabled="true">{label}</span>;
  return <a className="aw-btn aw-btn-secondary" href={tautanBelajar(tujuan.slug)} onClick={saatKlik} title={tujuan.judul}>{label}</a>;
}

/** Sidebar: progres keseluruhan dan daftar modul; di HP jadi laci (dipasang ulang tiap pindah pelajaran, jadi tertutup lagi). */
function SidebarMateri({ aktif }: { aktif: Pelajaran }) {
  const selesai = bacaPelajaranSelesai();
  const jumlahSelesai = DAFTAR_PELAJARAN.filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const persen = Math.round((jumlahSelesai / DAFTAR_PELAJARAN.length) * 100);
  return (
    <Laci id="daftar-materi" label="Daftar materi"
      ringkasan={<>Modul {aktif.modul} · {DAFTAR_PELAJARAN.indexOf(aktif) + 1}/{DAFTAR_PELAJARAN.length}<span className="bar-progres" aria-hidden="true"><span style={{ width: `${persen}%` }} /></span></>}
      judul={<>
      <span className="label-langkah">Progres belajar</span>
      <span className="angka-progres">{jumlahSelesai}/{DAFTAR_PELAJARAN.length} pelajaran · {persen}%</span>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${persen}%` }} /></span>
    </>}>
        {DAFTAR_MODUL.map(modul => {
          const daftar = DAFTAR_PELAJARAN.filter(pelajaran => pelajaran.modul === modul.nomor);
          return (
            <div key={modul.nomor} className={daftar.length ? 'modul-sidebar' : 'modul-sidebar modul-menyusul'}>
              <p className="judul-modul-sidebar">{modul.nomor}. {modul.judul}{daftar.length ? '' : ' · menyusul'}</p>
              <ol className="daftar-polos">
                {daftar.map(pelajaran => (
                  <li key={pelajaran.slug}>
                    <a href={tautanBelajar(pelajaran.slug)} aria-current={pelajaran === aktif ? 'page' : undefined}
                      className={selesai.has(pelajaran.slug) ? 'pelajaran-sidebar selesai' : 'pelajaran-sidebar'}>
                      <span className="tanda-pelajaran" aria-label={selesai.has(pelajaran.slug) ? 'selesai' : undefined}>{selesai.has(pelajaran.slug) ? '✓' : ''}</span>
                      {pelajaran.judul}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
    </Laci>
  );
}

export function BlokMateri({ blok, kasusSekarang, saatCoba }: { blok: Blok } & Omit<Props, 'slug'>) {
  switch (blok.jenis) {
    case 'judul': return blok.tingkat === 2 ? <h2><Sebaris isi={blok.isi} /></h2> : <h3><Sebaris isi={blok.isi} /></h3>;
    case 'paragraf': return <p><Sebaris isi={blok.isi} /></p>;
    case 'catatan': return <aside className="catatan-materi"><Sebaris isi={blok.isi} /></aside>;
    case 'daftar': {
      const Daftar = blok.berurut ? 'ol' : 'ul';
      return <Daftar>{blok.butir.map((butir, urutan) => <li key={urutan}><Sebaris isi={butir} /></li>)}</Daftar>;
    }
    case 'tabel':
      return (
        <div className="wadah-tabel-materi">
          <table className="tabel-materi">
            <thead><tr>{blok.kepala.map((sel, urutan) => <th key={urutan}><Sebaris isi={sel} /></th>)}</tr></thead>
            <tbody>{blok.baris.map((baris, urutan) => <tr key={urutan}>{baris.map((sel, kolom) => <td key={kolom}><Sebaris isi={sel} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'kasus': return <ContohDihitung contoh={blok.kasus} kasusSekarang={kasusSekarang} saatCoba={saatCoba} />;
    case 'video': return (
      <figure className="video-materi">
        <iframe src={`https://www.youtube-nocookie.com/embed/${blok.idYoutube}`} title={blok.judul} loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        <figcaption className="keterangan">{blok.judul}</figcaption>
      </figure>
    );
    case 'kuis': return (
      <div className="tumpuk-rapat">
        {blok.daftarKode.map(kode => DAFTAR_SOAL_KUIS.find(soal => soal.kode === kode)).filter(soal => soal !== undefined)
          .map((soal, urutan, semua) => <KartuSoalKuis key={soal.kode} soal={soal} label={`Soal ${urutan + 1} dari ${semua.length}`} />)}
      </div>
    );
  }
}

function ContohDihitung({ contoh, kasusSekarang, saatCoba }: { contoh: ContohKasus } & Omit<Props, 'slug'>) {
  const kasus = useMemo(() => kasusDariContoh(contoh), [contoh]);
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') {
    return <p className="kartu kartu-galat" role="alert">Contoh ini tidak bisa dihitung. Laporkan ke pengembang.</p>;
  }
  return (
    <figure className="contoh-kasus">
      <figcaption className="label-langkah">Dihitung otomatis</figcaption>
      <div className="wadah-tabel">
        <TabelFaraidh hasil={tampil.hasil as HasilOk} ringkasan={ringkas(kasus, tampil)} sembunyiNominal={false} saatPilih={() => {}} />
      </div>
      <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatCoba(kasus)}>Buka di Hitung</TombolBukaKasus>
    </figure>
  );
}
