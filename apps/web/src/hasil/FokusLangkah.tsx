// Mode fokus langkah perhitungan: satu layar hanya untuk tahap yang sedang dibahas. Pohon dan tabel berdampingan;
// di atas tabel, panel hitung menyebut sub-langkahnya ("Langkah 4b — ...") beserta kalimatnya, lalu memperagakan
// hitungannya bagian demi bagian sebelum angkanya masuk ke kotak di tabel. Daftar langkah lengkap disembunyikan di
// laci samping (bawah di HP) yang dibuka dengan tombol. Kontrol animasi (nyala/mati, putar/jeda) berupa ikon di kepala.
// Di layar lebar, bagian pecahan "terbang" dari orangnya di pohon ke selnya di tabel saat langkah bagian masing-masing.

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { BarisPenjelasan, KolomBab } from '@waris/explain';
import { formatRupiah } from '../format';
import { Baris } from '../layar/Penjelasan';
import { Ikon } from '../ui/Ikon';
import { JEDA_BAGIAN, type Peraga } from './peraga';
import { LegendaSorot, useSorot, type PeranSorot } from './sorot';

interface Props {
  judul: string;
  nomor: number;
  kolom: KolomBab | undefined;
  kanvas: { pohon: ReactNode; tabel: ReactNode };
  saatTutup: () => void;
  kontrol: ReactNode;
  atasTabel: ReactNode;
  /** Daftar langkah lengkap; null = laci tertutup. */
  laci: ReactNode | null;
  navigasi: ReactNode;
  dijeda: boolean;
}

const DURASI_TERBANG = 1400;
const LEBAR_BERDAMPINGAN = '(min-width: 900px)';

export function FokusLangkah({ judul, nomor, kolom, kanvas, saatTutup, kontrol, atasTabel, laci, navigasi, dijeda }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const { langkah } = useSorot();

  useEffect(() => {
    const semula = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    wadah.current?.querySelector<HTMLButtonElement>('[data-tutup]')?.focus();
    return () => { document.body.style.overflow = semula; if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {}); };
  }, []);

  // HP: gulir ke pohon untuk langkah siapa-mewarisi, ke tabel untuk langkah angka.
  useEffect(() => {
    if (window.matchMedia?.(LEBAR_BERDAMPINGAN).matches) return;
    const tujuan = wadah.current?.querySelector(kolom === 'ahliWaris' ? '.fokus-pohon' : '.fokus-tabel');
    tujuan?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [kolom, nomor]);

  // Sekali per ketukan (termasuk tiap putaran ulang), hanya untuk orang yang menerima bagian (bukan penyebab).
  const ketukanTerbang = useRef<number | null>(null);
  useEffect(() => {
    if (langkah?.kolom !== 'bagian' || !wadah.current || ketukanTerbang.current === langkah.ketukan) return;
    ketukanTerbang.current = langkah.ketukan;
    terbangkanBagian(wadah.current, [...langkah.peran].filter(([, peran]) => peran === 'fardh' || peran === 'ashabah'));
  }, [langkah]);

  const layarPenuh = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    else void wadah.current?.requestFullscreen?.().catch(() => {});
  };

  return createPortal(
    <div className={['fokus-langkah', dijeda && 'dijeda', laci && 'laci-terbuka'].filter(Boolean).join(' ')} role="dialog" aria-modal="true"
      aria-label={`Mode fokus: ${judul}`} ref={wadah} onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
      <header className="kepala-fokus">
        <button type="button" className="tombol-ikon" data-tutup onClick={saatTutup} aria-label="Tutup" title="Tutup"><Ikon nama="salah" /></button>
        <p><b>Mode fokus</b></p>
        <LegendaSorot />
        <div className="kontrol-fokus">
          {kontrol}
          <button type="button" className="tombol-ikon" onClick={layarPenuh} aria-label="Layar penuh" title="Layar penuh"><Ikon nama="perbesar" /></button>
        </div>
      </header>
      <div className="kanvas-fokus">
        <section className="fokus-pohon" aria-label="Pohon keluarga">{kanvas.pohon}</section>
        <section className="fokus-tabel" aria-label="Tabel faraidh">{atasTabel}<div className="wadah-tabel">{kanvas.tabel}</div></section>
        {laci && <aside className="laci-langkah" aria-label="Daftar langkah">{laci}</aside>}
      </div>
      <div className="kaki-fokus">{navigasi}</div>
      {/* Mode fokus butuh kanvas dan panel berdampingan; di layar HP ditutup layar penuh ini (lewat CSS, jadi ikut saat jendela dikecilkan). */}
      <div className="fokus-tak-muat" role="alert">
        <button type="button" className="tombol-ikon" onClick={saatTutup} aria-label="Tutup" title="Tutup"><Ikon nama="salah" /></button>
        <Ikon nama="fokus" ukuran={48} />
        <b>Mode fokus tidak tersedia di mobile</b>
        <p>Gunakan desktop untuk membuka mode fokus.</p>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Kepala panel: sub-langkah yang sedang dibahas dan kalimatnya, lalu peraga hitungannya. Tanpa ketukan (animasi mati)
 * seluruh baris langkah tampil sekaligus. selesai = semua langkah sudah diikuti.
 */
export function PanelHitung({ posisi, label, judul, baris, semuaBaris, peraga, selesai }: {
  posisi: string; label: string; judul: string; baris: BarisPenjelasan | null; semuaBaris: BarisPenjelasan[]; peraga: Peraga | null; selesai: boolean;
}) {
  if (selesai) {
    return (
      <div className="panel-hitung panel-hitung-selesai" aria-live="polite">
        <p className="judul-panel-hitung">Selesai!</p>
        <p className="narasi-hitung">Kamu sudah mengikuti seluruh pembagian, langkah demi langkah. Tabelnya sekarang lengkap.</p>
      </div>
    );
  }
  return (
    <div className="panel-hitung" aria-live="polite">
      <p className="ke-langkah">{posisi}</p>
      <p className="judul-panel-hitung"><b>{label}</b> — {judul}</p>
      {baris ? <p className="narasi-hitung"><Baris baris={baris} /></p>
        : <ul className="narasi-semua">{semuaBaris.map((isi, nomor) => <li key={nomor}><Baris baris={isi} /></li>)}</ul>}
      {peraga && <TampilPeraga peraga={peraga} />}
    </div>
  );
}

const tunda = (urutan: number, tambahan = 0): CSSProperties => ({ animationDelay: `${urutan * JEDA_BAGIAN + tambahan}ms` });

function TampilPeraga({ peraga }: { peraga: Peraga }) {
  switch (peraga.jenis) {
    case 'penyebut':
      return (
        <div className="peraga">
          <span className="label-peraga" style={tunda(0)}>Penyebutnya:</span>
          {peraga.daftarPenyebut.map((penyebut, urutan) => <span key={urutan} className="kotak-angka" style={tunda(urutan + 1)}>{String(penyebut)}</span>)}
        </div>
      );
    case 'nisab': {
      const { a, b, hubungan, fpb, hasil } = peraga.langkah;
      const [kecil, besar] = a < b ? [a, b] : [b, a];
      const [keterangan, rumus] = hubungan === 'tamatsul' ? [`${a} = ${b}`, `ambil salah satu`]
        : hubungan === 'tadakhul' ? [`${besar} ÷ ${kecil} = ${besar / kecil}, habis`, `ambil yang besar`]
          : hubungan === 'tawafuq' ? [`FPB ${fpb}`, `${a} × (${b} ÷ ${fpb})`]
            : [`FPB 1`, `${a} × ${b}`];
      return (
        <div className="peraga">
          <span className="kotak-angka" style={tunda(0)}>{String(a)}</span><span className="label-peraga" style={tunda(0)}>dan</span>
          <span className="kotak-angka" style={tunda(0)}>{String(b)}</span>
          <span className="label-peraga" style={tunda(1)}>→ {keterangan} ({hubungan})</span>
          <span className="rumus-peraga" style={tunda(2)}>{rumus} =</span>
          <span className="kotak-angka kotak-hasil" style={tunda(3)}>{String(hasil)}</span>
        </div>
      );
    }
    case 'kali':
      return (
        <div className="peraga peraga-kali">
          <p style={tunda(0)}>Ashl masalah = <span className="kotak-angka kotak-hasil">{String(peraga.ashl)}</span></p>
          {peraga.daftar.map((baris, urutan) => (
            <p key={urutan} style={tunda(urutan + 1)}>
              <span className="nama-peraga">{baris.nama}</span> <span className="rumus-peraga">{baris.rumus} =</span>{' '}
              <span className="kotak-angka" style={tunda(urutan + 1, JEDA_BAGIAN / 3)}>{String(baris.hasil)}</span>
            </p>
          ))}
        </div>
      );
    case 'nominal': {
      const { saham, penyebut, harta, nominal } = peraga.hitungan;
      // Nominal dibulatkan ke bawah oleh engine; kalau tidak pas, tanda "=" jadi "≈".
      const pas = nominal * penyebut === saham * harta;
      return (
        <p className="rumus-hitung">
          <span style={tunda(0)}>{String(saham)}/{String(penyebut)}</span>
          <span style={tunda(1)}> × {formatRupiah(harta)}</span>
          <b style={tunda(2)}> {pas ? '=' : '≈'} <span className="kotak-angka kotak-hasil">{formatRupiah(nominal)}</span></b>
          {!pas && <small style={tunda(3)}>dibulatkan ke bawah</small>}
        </p>
      );
    }
  }
}

/** Label bagian meluncur dari node orang di pohon ke sel Bagian miliknya di tabel (Web Animations API, tanpa pustaka). */
function terbangkanBagian(wadah: HTMLElement, daftarOrang: Array<[string, PeranSorot]>) {
  if (!window.matchMedia?.(LEBAR_BERDAMPINGAN).matches || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const selBagian = [...wadah.querySelectorAll<HTMLElement>('.fokus-tabel td[data-anggota]')];
  for (const [id, peran] of daftarOrang) {
    const asal = [...wadah.querySelectorAll<HTMLElement>('.fokus-pohon [data-orang]')].find(elemen => elemen.dataset.orang === id);
    const tujuan = selBagian.find(sel => sel.dataset.anggota!.split(' ').includes(id));
    const teks = tujuan?.querySelector('.bagian-sel')?.firstChild?.textContent;
    if (!asal || !tujuan || !teks || typeof asal.animate !== 'function') continue;
    const a = asal.getBoundingClientRect();
    const b = tujuan.getBoundingClientRect();
    const lencana = document.createElement('span');
    lencana.className = `lencana-terbang sorot-${peran}`;
    lencana.textContent = teks;
    lencana.style.left = `${a.left + a.width / 2}px`;
    lencana.style.top = `${a.top}px`;
    wadah.appendChild(lencana);
    const geser = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - a.top}px)`;
    lencana.animate(
      [{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 1, offset: .2 },
        { transform: `${geser} translate(-50%,-50%) scale(1)`, opacity: 1 }],
      { duration: DURASI_TERBANG, easing: 'cubic-bezier(.5,0,.2,1)' },
    ).onfinish = () => lencana.remove();
  }
}
