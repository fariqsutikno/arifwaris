// Daftar isi satu pelajaran: bagian (h2) dibaca dari blok materi, posisi baca dilacak saat scroll, lalu dipakai tiga tempat:
// bilah baca yang menempel di atas (judul pelajaran, bagian yang sedang dibaca, bar progres), daftar "Di halaman ini" di
// kanan (layar lebar), dan menu daftar isi di bilah (layar sempit). Murni penyajian; tidak menyentuh progres belajar.

import { useEffect, useState, type RefObject } from 'react';
import type { Blok } from '@waris/content';
import { angka, t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';

export interface Bagian { id: string; judul: string }

/** Garis baca: bagian yang judulnya sudah melewati garis ini (sepertiga atas layar, di bawah bilah baca) dianggap sedang dibaca. */
const GARIS_MINIMUM = 120;
const garisBaca = () => Math.max(GARIS_MINIMUM, window.innerHeight * 0.3);

export const idBagian = (urutan: number) => `bagian-${urutan + 1}`;

export function ambilBagian(daftarBlok: Blok[]): Bagian[] {
  return daftarBlok.flatMap(blok => blok.jenis === 'judul' && blok.tingkat === 2 ? [blok.isi] : [])
    .map((isi, urutan) => ({ id: idBagian(urutan), judul: isi.map(potongan => ('teks' in potongan ? potongan.teks : '')).join('') }));
}

interface Posisi { aktif: string; persen: number; bilahTampil: boolean }

/** Satu pendengar scroll untuk semua: bagian aktif, persen artikel terbaca, dan apakah banner sudah lewat (bilah muncul). */
export function useBacaan(bagian: Bagian[], artikel: RefObject<HTMLElement>, banner: RefObject<HTMLElement>): Posisi {
  const [posisi, setPosisi] = useState<Posisi>({ aktif: '', persen: 0, bilahTampil: false });
  useEffect(() => {
    let bingkai = 0;
    const hitung = () => {
      bingkai = 0;
      const garis = garisBaca();
      let aktif = '';
      for (const { id } of bagian) if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= garis) aktif = id;
      const kotak = artikel.current?.getBoundingClientRect();
      const persen = kotak ? Math.round(Math.min(1, Math.max(0, (garis - kotak.top) / Math.max(1, kotak.height))) * 100) : 0;
      const bilahTampil = (banner.current?.getBoundingClientRect().bottom ?? 1) <= 0;
      setPosisi(lama => lama.aktif === aktif && lama.persen === persen && lama.bilahTampil === bilahTampil ? lama : { aktif, persen, bilahTampil });
    };
    const jadwalkan = () => { if (!bingkai) bingkai = requestAnimationFrame(hitung); };
    hitung();
    window.addEventListener('scroll', jadwalkan, { passive: true });
    window.addEventListener('resize', jadwalkan);
    return () => { window.removeEventListener('scroll', jadwalkan); window.removeEventListener('resize', jadwalkan); cancelAnimationFrame(bingkai); };
  }, [bagian, artikel, banner]);
  return posisi;
}

/** Geser ke bagian tanpa mengubah hash (hash dipakai router). */
function keBagian(id: string) {
  const mengurangiGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: mengurangiGerak ? 'auto' : 'smooth', block: 'start' });
}

function DaftarBagian({ bagian, aktif, saatPilih }: { bagian: Bagian[]; aktif: string; saatPilih?: () => void }) {
  return (
    <ol className="daftar-polos daftar-bagian">
      {bagian.map((isi, urutan) => (
        <li key={isi.id}>
          <a href={`#${isi.id}`} aria-current={isi.id === aktif ? 'location' : undefined}
            onClick={kejadian => { kejadian.preventDefault(); keBagian(isi.id); saatPilih?.(); }}>
            <span className="nomor-bagian" aria-hidden="true">{angka(String(urutan + 1).padStart(2, '0'))}</span>{isi.judul}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Daftar isi di kolom kanan (layar lebar). */
export function RailIsi({ bagian, aktif }: { bagian: Bagian[]; aktif: string }) {
  if (bagian.length === 0) return null;
  return (
    <nav className="rail-isi" aria-label={t('belajar.di_halaman_ini')}>
      <p className="label-langkah">{t('belajar.di_halaman_ini')}</p>
      <DaftarBagian bagian={bagian} aktif={aktif} />
    </nav>
  );
}

/** Bilah yang menempel di atas setelah banner lewat: pelajaran apa, bagian mana, seberapa jauh; ketukan membuka daftar isi. */
export function BilahBaca({ judul, bagian, posisi }: { judul: string; bagian: Bagian[]; posisi: Posisi }) {
  const [terbuka, setTerbuka] = useState(false);
  useEffect(() => { if (!posisi.bilahTampil) setTerbuka(false); }, [posisi.bilahTampil]);
  useEffect(() => {
    if (!terbuka) return;
    const saatTombol = (kejadian: KeyboardEvent) => { if (kejadian.key === 'Escape') setTerbuka(false); };
    document.addEventListener('keydown', saatTombol);
    return () => document.removeEventListener('keydown', saatTombol);
  }, [terbuka]);
  const urutanAktif = bagian.findIndex(isi => isi.id === posisi.aktif);
  return (
    <div className={posisi.bilahTampil ? 'bilah-baca tampil' : 'bilah-baca'}>
      <div className="isi-bilah-baca">
        <div className="teks-bilah-baca">
          <b>{judul}</b>
          {urutanAktif >= 0 && <span>{angka(String(urutanAktif + 1).padStart(2, '0'))} · {bagian[urutanAktif]!.judul}</span>}
        </div>
        {bagian.length > 0 && (
          <button type="button" className="tombol-isi-bilah" aria-expanded={terbuka} onClick={() => setTerbuka(buka => !buka)}>
            <Ikon nama="daftar" ukuran={18} /><span>{t('belajar.di_halaman_ini')}</span>
          </button>
        )}
      </div>
      {terbuka && (
        <div className="menu-isi-bilah">
          <DaftarBagian bagian={bagian} aktif={posisi.aktif} saatPilih={() => setTerbuka(false)} />
        </div>
      )}
      <span className="bar-baca" aria-hidden="true"><span style={{ width: `${posisi.persen}%` }} /></span>
    </div>
  );
}
