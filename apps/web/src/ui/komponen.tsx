// Port komponen design system Arif Waris (bundle.js v4) ke TSX.
// Nama asli → nama di sini: Button→Tombol, Chip→Pilihan, Sticker→Stiker, Highlight→Stabilo,
// FractionBadge→LencanaPecahan, HeirCard→KartuAhliWaris, ShareBar→BarBagian, CalcStep→LangkahHitung,
// ResultCard→KartuHasil, NavBar→BilahNavigasi, Logo, Motif. Kelas CSS tetap `aw-*` (komponen.css).

import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { Kelompok } from '../checklist';

const gabungKelas = (...daftar: Array<string | false | undefined>) => daftar.filter(Boolean).join(' ');
const LABEL_KELOMPOK: Record<Kelompok, string> = { pasangan: 'Pasangan', keturunan: 'Keturunan', leluhur: 'Leluhur', saudara: 'Saudara' };

export function Tombol({ varian = 'primary', kecil, className, ...sisa }:
  ButtonHTMLAttributes<HTMLButtonElement> & { varian?: 'primary' | 'secondary' | 'sun' | 'ghost'; kecil?: boolean }) {
  return <button type="button" {...sisa} className={gabungKelas('aw-btn', `aw-btn-${varian}`, kecil && 'aw-btn-sm', className)} />;
}

export function Pilihan({ terpilih, saatKlik, children }: { terpilih?: boolean; saatKlik?: () => void; children: ReactNode }) {
  return <button type="button" className="aw-chip" aria-pressed={!!terpilih} onClick={saatKlik}>{children}</button>;
}

export function Stiker({ warna = 'sun', miringKanan, children }: { warna?: 'sun' | 'pink' | 'lime' | 'blue'; miringKanan?: boolean; children: ReactNode }) {
  return <span className={gabungKelas('aw-sticker', `aw-s-${warna}`, miringKanan && 'aw-sticker-r')}>{children}</span>;
}

export const Stabilo = ({ children }: { children: ReactNode }) => <mark className="aw-hl">{children}</mark>;
export const LencanaPecahan = ({ nilai }: { nilai: string }) => <span className="aw-frac">{nilai}</span>;

export function KartuAhliWaris(props: {
  nama: string; kelompok: Kelompok; bagian?: string | undefined; catatan?: string | undefined; jumlah?: number | undefined;
  adalahMahjub?: boolean; saatTambah?: () => void; saatKurang?: () => void; children?: ReactNode;
}) {
  const { nama, kelompok, bagian, catatan, jumlah, adalahMahjub, saatTambah, saatKurang, children } = props;
  return (
    <div className={gabungKelas('aw-heir', `aw-g-${kelompok}`, adalahMahjub && 'aw-heir-blocked')}>
      <div className="aw-heir-top">
        <div>
          <div className="aw-heir-rel">{adalahMahjub ? 'Kehalang (mahjub)' : LABEL_KELOMPOK[kelompok]}</div>
          <h3>{nama}</h3>
        </div>
        {bagian && !adalahMahjub ? <LencanaPecahan nilai={bagian} /> : null}
      </div>
      {catatan ? <p className="aw-heir-note">{catatan}</p> : null}
      {children}
      {jumlah !== undefined && !adalahMahjub ? (
        <div className="aw-heir-foot">
          <span className="aw-heir-note">Jumlah</span>
          <div className="aw-cnt">
            <button type="button" aria-label={`Kurangi ${nama}`} onClick={saatKurang} disabled={jumlah === 0}>−</button>
            <span aria-live="polite">{jumlah}</span>
            <button type="button" aria-label={`Tambah ${nama}`} onClick={saatTambah}>+</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export interface RuasBagian { nama: string; kelompok: Kelompok; bagian: string; bobot: number }

export function BarBagian({ daftarRuas }: { daftarRuas: RuasBagian[] }) {
  return (
    <div className="aw-bar" role="img" aria-label={daftarRuas.map(ruas => `${ruas.nama} ${ruas.bagian}`).join(', ')}>
      {daftarRuas.map((ruas, indeks) => <span key={indeks} className={`aw-b-${ruas.kelompok}`} style={{ flex: ruas.bobot }}>{ruas.bagian}</span>)}
    </div>
  );
}

export function LangkahHitung({ nomor, judul, pengantar, kenapa, sudahDibaca, children }: {
  nomor: number; judul: string; pengantar?: string; kenapa?: ReactNode; sudahDibaca?: boolean; children: ReactNode;
}) {
  return (
    <div className={gabungKelas('aw-step', sudahDibaca && 'aw-step-done')}>
      <div className="aw-step-n">{sudahDibaca ? '✓' : nomor}</div>
      <div>
        {pengantar ? <div className="aw-step-k">{pengantar}{sudahDibaca ? <Stiker warna="lime" miringKanan>Kelar</Stiker> : null}</div> : null}
        <h4>{judul}</h4>
        <div>{children}</div>
        {kenapa ? <div className="aw-why"><b>Kenapa?</b>{kenapa}</div> : null}
      </div>
    </div>
  );
}

export interface BarisHasil extends RuasBagian { nominal: string; keterangan?: string }

export function KartuHasil({ label = 'Harta yang dibagi', total, stiker, daftarBaris }: {
  label?: string; total: string; stiker?: string; daftarBaris: BarisHasil[];
}) {
  return (
    <div className="aw-res">
      {stiker ? <Stiker warna="pink">{stiker}</Stiker> : null}
      <div className="aw-res-k">{label}</div>
      <div className="aw-res-total">{total}</div>
      <BarBagian daftarRuas={daftarBaris} />
      <div className="aw-res-rows">
        {daftarBaris.map((baris, indeks) => (
          <div className="aw-res-row" key={indeks}>
            <span className={`aw-res-dot aw-b-${baris.kelompok}`} />
            <div>
              <span className="aw-res-name">{baris.nama}</span>
              {baris.keterangan ? <span className="aw-res-sub">{baris.keterangan}</span> : null}
            </div>
            <div className="aw-res-amt">{baris.bagian}<small>{baris.nominal}</small></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tanda({ ukuran = 40 }: { ukuran?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={ukuran} height={ukuran} aria-hidden>
      <rect x={2} y={2} width={56} height={56} rx={14} fill="#111322" />
      <rect x={0} y={0} width={56} height={56} rx={14} fill="var(--primary)" stroke="#111322" strokeWidth={3} />
      <path fill="var(--sun)" stroke="#111322" strokeWidth={3} d="M16 34V25c0-8 6-13 12-16 6 3 12 8 12 16v9z" />
      <rect x={10} y={39} width={36} height={6} rx={3} fill="#ffffff" stroke="#111322" strokeWidth={2} />
    </svg>
  );
}

export function Logo({ saatKlik }: { saatKlik?: () => void }) {
  return (
    <a className="aw-logo" href="#" aria-label="Arif Waris, beranda" onClick={event => { event.preventDefault(); saatKlik?.(); }}>
      <Tanda />
      <span><b>Arif Waris</b><small>by Prodi HKI STDI Imam Syafi'i</small></span>
    </a>
  );
}

export function BilahNavigasi({ saatKeBeranda, aksi }: { saatKeBeranda: () => void; aksi?: ReactNode | undefined }) {
  return (
    <nav className="aw-nav">
      <Logo saatKlik={saatKeBeranda} />
      {aksi ? <span className="aw-nav-cta" style={{ marginLeft: 'auto' }}>{aksi}</span> : null}
    </nav>
  );
}

export function Motif({ children }: { children: ReactNode }) {
  const idPola = useId();
  return (
    <div className="aw-motif">
      <svg className="aw-motif-bg" aria-hidden>
        <defs>
          <pattern id={idPola} width={56} height={80} patternUnits="userSpaceOnUse">
            <path fill="none" stroke="var(--motif)" strokeWidth={1.5} d="M8 80V38c0-12 9-20 20-26 11 6 20 14 20 26v42" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${idPola})`} />
      </svg>
      <div className="aw-motif-in">{children}</div>
    </div>
  );
}
