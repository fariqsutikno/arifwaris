// Mode fokus langkah perhitungan: satu layar tanpa menu dan tombol lain. Pohon dan tabel berdampingan di atas,
// penjelasan langkah + navigasi di bawah. Di atas tabel, panel hitung membacakan poin yang sedang dibahas dan
// memunculkan hitungannya pelan-pelan (saham/penyebut × harta = nominal) sebelum angkanya masuk ke tabel. Di layar lebar, bagian pecahan "terbang" dari orangnya di pohon ke selnya
// di tabel saat langkah bagian masing-masing. Di HP keduanya ditumpuk dan layar menggulir ke bagian yang dibahas.

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { BarisPenjelasan, KolomBab } from '@waris/explain';
import { formatRupiah } from '../format';
import { Baris } from '../layar/Penjelasan';
import { Ikon } from '../ui/Ikon';
import { LegendaSorot, useSorot, type PeranSorot } from './sorot';

interface Props {
  judul: string;
  nomor: number;
  total: number;
  kolom: KolomBab | undefined;
  kanvas: { pohon: ReactNode; tabel: ReactNode };
  saatTutup: () => void;
  atasTabel: ReactNode;
  children: ReactNode;
}

const DURASI_TERBANG = 1400;
/** Jeda antarbagian hitungan di panel; angka masuk ke tabel setelah seluruh hitungan tampil. */
const JEDA_BAGIAN_HITUNGAN = 1000;
export const DURASI_HITUNGAN = JEDA_BAGIAN_HITUNGAN * 3 + 400;
const LEBAR_BERDAMPINGAN = '(min-width: 900px)';

export function FokusLangkah({ judul, nomor, total, kolom, kanvas, saatTutup, atasTabel, children }: Props) {
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

  // Sekali per ketukan, hanya untuk orang yang menerima bagian (bukan penyebab).
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
    <div className="fokus-langkah" role="dialog" aria-modal="true" aria-label={`Mode fokus: ${judul}`} ref={wadah}
      onKeyDown={event => { if (event.key === 'Escape') saatTutup(); }}>
      <header className="kepala-fokus">
        <p><span className="ke-langkah">Mode fokus</span> <b>Langkah {nomor + 1} dari {total}</b></p>
        <LegendaSorot />
        <button type="button" className="tombol-ikon" onClick={layarPenuh} aria-label="Layar penuh" title="Layar penuh"><Ikon nama="perbesar" /></button>
        <button type="button" className="aw-btn aw-btn-secondary aw-btn-sm" data-tutup onClick={saatTutup}><Ikon nama="salah" ukuran={16} /> Tutup</button>
      </header>
      <div className="kanvas-fokus">
        <section className="fokus-pohon" aria-label="Pohon keluarga">{kanvas.pohon}</section>
        <section className="fokus-tabel" aria-label="Tabel faraidh">{atasTabel}<div className="wadah-tabel">{kanvas.tabel}</div></section>
      </div>
      <div className="panel-fokus">{children}</div>
    </div>,
    document.body,
  );
}

export interface Hitungan { saham: bigint; penyebut: bigint; harta: bigint; nominal: bigint }

/** Poin yang sedang dibahas, dibaca besar. poin null = semua langkah sudah diikuti. */
export function PanelHitung({ judul, poin, jumlahPoin, baris, hitungan }: {
  judul: string; poin: number | null; jumlahPoin: number; baris: BarisPenjelasan | null; hitungan: Hitungan | null;
}) {
  if (poin === null) {
    return (
      <div className="panel-hitung panel-hitung-selesai" aria-live="polite">
        <p className="judul-panel-hitung">Selesai!</p>
        <p className="narasi-hitung">Kamu sudah mengikuti seluruh pembagian, langkah demi langkah. Tabelnya sekarang lengkap.</p>
      </div>
    );
  }
  // Nominal dibulatkan ke bawah oleh engine; kalau tidak pas, tanda "=" jadi "≈".
  const pas = hitungan && hitungan.nominal * hitungan.penyebut === hitungan.saham * hitungan.harta;
  const tunda = (urutan: number) => ({ animationDelay: `${urutan * JEDA_BAGIAN_HITUNGAN}ms` });
  return (
    <div className="panel-hitung" aria-live="polite">
      <p className="judul-panel-hitung">{judul} <span>· poin {poin + 1} dari {jumlahPoin}</span></p>
      {baris && <p className="narasi-hitung"><Baris baris={baris} /></p>}
      {hitungan && (
        <p className="rumus-hitung">
          <span style={tunda(0)}>{String(hitungan.saham)}/{String(hitungan.penyebut)}</span>
          <span style={tunda(1)}> × {formatRupiah(hitungan.harta)}</span>
          <b style={tunda(2)}> {pas ? '=' : '≈'} {formatRupiah(hitungan.nominal)}</b>
          {!pas && <small style={tunda(3)}>dibulatkan ke bawah</small>}
        </p>
      )}
    </div>
  );
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
