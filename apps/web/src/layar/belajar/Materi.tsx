// Satu pelajaran, tata letak e-learning: sidebar (progres + daftar modul & pelajaran) di kiri, isi di kanan.
// Di HP sidebar jadi laci dari kanan, dibuka lewat tombol yang menempel di tepi layar.
// Isi = blok Markdown terbatas dari packages/content: teks, tabel, video YouTube, contoh kasus dihitung engine,
// dan kuis cek pemahaman. Pelajaran ditandai selesai saat dibaca sampai bawah atau saat lanjut ke berikutnya.
// Navigasi bawah: Sebelumnya · Beranda belajar · Berikutnya, gayanya setara.

import { useEffect, useMemo, useRef, useState } from 'react';
import { type Blok, type ContohKasus, type Pelajaran } from '@waris/content';
import { cariPelajaran, daftarModul, daftarPelajaran, daftarSoalKuis } from '../../konten/sumber';
import { TabelFaraidh } from '../../hasil/TabelFaraidh';
import { ringkas } from '../../hasil/ringkasan';
import { jalankan, type HasilOk } from '../../jalankan';
import type { Kasus } from '../../kasus';
import { catatAktivitas } from '../../preferensi';
import { bacaPelajaranSelesai, tandaiPelajaranSelesai } from '../../progres';
import { tautanBelajar } from '../../rute';
import { kasusDariContoh } from './contoh';
import { KartuSoalKuis } from './KartuSoalKuis';
import { angka, panah, panahMundur, t } from '../../terjemah';
import { Sebaris } from './Sebaris';
import { TombolBukaKasus } from './TombolBukaKasus';
import { Bagikan } from '../../ui/Bagikan';
import { Ikon } from '../../ui/Ikon';
import { Laci } from '../../ui/Laci';
import { ambilBagian, BilahBaca, idBagian, RailIsi, useBacaan } from './DaftarIsi';

interface Props {
  slug: string;
  /** Kasus yang sedang ada di kalkulator; bila ada, "Buka di Hitung" minta konfirmasi dulu. */
  kasusSekarang: Kasus | null;
  saatCoba: (kasus: Kasus) => void;
}

export function Materi({ slug, kasusSekarang, saatCoba }: Props) {
  const pelajaran = cariPelajaran(slug);
  const ujung = useRef<HTMLElement>(null);
  const banner = useRef<HTMLElement>(null);
  const artikel = useRef<HTMLElement>(null);
  const bagian = useMemo(() => pelajaran ? ambilBagian(pelajaran.blok) : [], [pelajaran]);
  const posisi = useBacaan(bagian, artikel, banner);
  // Dinaikkan saat pelajaran ditandai selesai supaya progres di sidebar langsung ikut berubah.
  const [, setVersiProgres] = useState(0);

  // Latar krem dan nav menyatu dengan hero, sama dengan Beranda dan Belajar (CSS body.layar-beranda).
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);

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
    return <main className="halaman tumpuk"><a href={tautanBelajar()}>{panahMundur()} {t('umum.belajar')}</a><p role="alert">{t('belajar.pelajaran_ini_tidak_ditemukan')}</p></main>;
  }
  const indeks = daftarPelajaran().indexOf(pelajaran);
  const sebelumnya = daftarPelajaran()[indeks - 1];
  const berikutnya = daftarPelajaran()[indeks + 1];
  const modul = daftarModul().find(modulIni => modulIni.nomor === pelajaran.modul);
  // Judul bagian (h2) diberi id berurutan supaya daftar isi bisa menunjuk dan melacaknya.
  const idJudul = pelajaran.blok.reduce<(string | undefined)[]>((hasil, blok) => [...hasil, blok.jenis === 'judul' && blok.tingkat === 2 ? idBagian(hasil.filter(Boolean).length) : undefined], []);

  return (
    <div className="halaman-beranda halaman-materi">
      <header className="hero-materi" ref={banner}>
        <div className="baris-hero-materi">
          <a className="tombol-kembali" href={tautanBelajar()}><Ikon nama="kembali" ukuran={18} />{t('umum.kembali_2')}</a>
          <Bagikan judul={pelajaran.judul} tautan={window.location.hash} />
        </div>
        <p className="label-langkah">{t('belajar.modul_nomor_judul_pelajaran_indeks_dari', { nomor: pelajaran.modul, judul: modul?.judul ?? '', indeks: indeks + 1, total: daftarPelajaran().length })}</p>
        <h1>{pelajaran.judul}</h1>
        {pelajaran.perluCek && <p className="lencana-draf">{t('umum.draf_belum_direview_tim_keilmuan')}</p>}
        <p className="lead">{pelajaran.tujuan}</p>
      </header>
      <div className="tata-materi">
      <BilahBaca judul={pelajaran.judul} bagian={bagian} posisi={posisi} />
      <SidebarMateri key={pelajaran.slug} aktif={pelajaran} />
      <main className="konten-materi tumpuk">
        <article className="isi-materi" ref={artikel}>
          {pelajaran.blok.map((blok, urutan) => <BlokMateri key={urutan} blok={blok} kasusSekarang={kasusSekarang} saatCoba={saatCoba} idJudul={idJudul[urutan]} />)}
        </article>
        <nav ref={ujung} className="navigasi-materi" aria-label={t('belajar.navigasi_pelajaran')}>
          <TautanNavigasi tujuan={sebelumnya} label={`${panahMundur()} ${t('belajar.sebelumnya')}`} />
          <a className="aw-btn aw-btn-secondary" href={tautanBelajar()}><Ikon nama="rumah" /> {t('belajar.beranda_belajar')}</a>
          <TautanNavigasi tujuan={berikutnya} label={`${t('belajar.berikutnya')} ${panah()}`} saatKlik={() => tandaiPelajaranSelesai(pelajaran.slug)} />
        </nav>
      </main>
      <RailIsi bagian={bagian} aktif={posisi.aktif} />
      </div>
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
  const jumlahSelesai = daftarPelajaran().filter(pelajaran => selesai.has(pelajaran.slug)).length;
  const persen = Math.round((jumlahSelesai / daftarPelajaran().length) * 100);
  return (
    <Laci id="daftar-materi" label={t('belajar.daftar_materi')}
      ringkasan={<>{t('belajar.modul_nomor', { nomor: aktif.modul })} · {angka(`${daftarPelajaran().indexOf(aktif) + 1}/${daftarPelajaran().length}`)}<span className="bar-progres" aria-hidden="true"><span style={{ width: `${persen}%` }} /></span></>}
      judul={<>
      <span className="label-langkah">{t('belajar.progres_belajar')}</span>
      <span className="angka-progres">{t('hitung.selesai_total_pelajaran', { selesai: jumlahSelesai, total: daftarPelajaran().length })} · {angka(`${persen}%`)}</span>
      <span className="bar-progres" aria-hidden="true"><span style={{ width: `${persen}%` }} /></span>
    </>}>
        {daftarModul().map(modul => {
          const daftar = daftarPelajaran().filter(pelajaran => pelajaran.modul === modul.nomor);
          if (daftar.length === 0) return <p key={modul.nomor} className="modul-sidebar modul-menyusul judul-modul-sidebar">{angka(String(modul.nomor))}. {modul.judul} · {t('belajar.menyusul')}</p>;
          const beres = daftar.filter(pelajaran => selesai.has(pelajaran.slug)).length;
          // Hanya modul yang sedang dibaca yang terbuka; sisanya ringkas supaya daftar tidak panjang.
          return (
            <details key={modul.nomor} className="modul-sidebar" open={modul.nomor === aktif.modul}>
              <summary className="judul-modul-sidebar"><span>{angka(String(modul.nomor))}. {modul.judul}</span><small>{angka(`${beres}/${daftar.length}`)}</small></summary>
              <ol className="daftar-polos">
                {daftar.map(pelajaran => (
                  <li key={pelajaran.slug}>
                    <a href={tautanBelajar(pelajaran.slug)} aria-current={pelajaran === aktif ? 'page' : undefined}
                      className={selesai.has(pelajaran.slug) ? 'pelajaran-sidebar selesai' : 'pelajaran-sidebar'}>
                      <span className="tanda-pelajaran" aria-label={selesai.has(pelajaran.slug) ? t('belajar.selesai') : undefined}>{selesai.has(pelajaran.slug) ? '✓' : ''}</span>
                      {pelajaran.judul}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          );
        })}
    </Laci>
  );
}

export function BlokMateri({ blok, kasusSekarang, saatCoba, idJudul }: { blok: Blok; idJudul?: string | undefined } & Omit<Props, 'slug'>) {
  switch (blok.jenis) {
    case 'judul': return blok.tingkat === 2 ? <h2 id={idJudul}><Sebaris isi={blok.isi} /></h2> : <h3><Sebaris isi={blok.isi} /></h3>;
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
        {blok.daftarKode.map(kode => daftarSoalKuis().find(soal => soal.kode === kode)).filter(soal => soal !== undefined)
          .map((soal, urutan, semua) => <KartuSoalKuis key={soal.kode} soal={soal} label={t('umum.soal_nomor_dari_total', { nomor: urutan + 1, total: semua.length })} />)}
      </div>
    );
  }
}

function ContohDihitung({ contoh, kasusSekarang, saatCoba }: { contoh: ContohKasus } & Omit<Props, 'slug'>) {
  const kasus = useMemo(() => kasusDariContoh(contoh), [contoh]);
  const tampil = useMemo(() => jalankan(kasus), [kasus]);
  if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') {
    return <p className="kartu kartu-galat" role="alert">{t('belajar.contoh_ini_tidak_bisa_dihitung_laporkan')}</p>;
  }
  return (
    <figure className="contoh-kasus">
      <figcaption className="label-langkah">{t('belajar.dihitung_otomatis')}</figcaption>
      <div className="wadah-tabel">
        <TabelFaraidh sedangMenebak={false} hasil={tampil.hasil as HasilOk} ringkasan={ringkas(kasus, tampil)} sembunyiNominal={false} saatPilih={() => {}} />
      </div>
      <TombolBukaKasus kasusSekarang={kasusSekarang} saatBuka={() => saatCoba(kasus)}>{t('belajar.buka_di_hitung')}</TombolBukaKasus>
    </figure>
  );
}
