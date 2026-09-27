// Dialog konfirmasi di halaman (tanpa window.confirm). Dua tombol sejajar selebar sama: Batal (fokus awal) dan
// aksi lanjut. Esc = Batal. Untuk aksi yang sengaja dibuat berat (membuka jawaban di mode Belajar), `tahan`
// mengganti tombol lanjut dengan tombol yang harus ditekan-tahan sampai penuh (mouse, sentuh, atau Spasi/Enter).

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Tombol } from './komponen';
import { t } from '../terjemah';

interface Props {
  judul: string;
  children: ReactNode;
  labelLanjut: string;
  labelBatal?: string;
  saatLanjut: () => void;
  saatBatal: () => void;
  tahan?: boolean;
  /** Tantangan ketik: tombol lanjut baru aktif setelah kalimat ini diketik persis. Untuk aksi yang tidak bisa dibatalkan. */
  kataKunci?: string;
}

export function DialogKonfirmasi({ judul, children, labelLanjut, labelBatal = 'Batal', saatLanjut, saatBatal, tahan, kataKunci }: Props) {
  const id = useId();
  const [ketikan, setKetikan] = useState('');
  const cocok = !kataKunci || ketikan.trim() === kataKunci;
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLButtonElement>('[data-batal]')?.focus(); }, []);
  return (
    <div className="konfirmasi" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-judul`} aria-describedby={`${id}-isi`}
      ref={wadah} onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <div className="konfirmasi-isi">
        <h2 id={`${id}-judul`}>{judul}</h2>
        <div id={`${id}-isi`} className="isi-konfirmasi">{children}</div>
        {kataKunci && (
          <label className="isian isian-kecil">
            <span>{t('umum.ketik')} <b>{kataKunci}</b> {t('hitung.untuk_melanjutkan')}</span>
            <input value={ketikan} onChange={event => setKetikan(event.target.value)} autoComplete="off" spellCheck={false} />
          </label>
        )}
        <div className="aksi-konfirmasi">
          <Tombol data-batal onClick={saatBatal}>{labelBatal}</Tombol>
          {tahan ? <TombolTahan label={labelLanjut} saatSelesai={saatLanjut} />
            : <Tombol varian="secondary" disabled={!cocok} onClick={saatLanjut}>{labelLanjut}</Tombol>}
        </div>
      </div>
    </div>
  );
}

const DURASI_TAHAN = 1200;

/** Tombol tekan-tahan: aksi baru jalan setelah ditahan penuh; dilepas sebelum penuh = batal. */
export function TombolTahan({ label, saatSelesai }: { label: string; saatSelesai: () => void }) {
  const [menahan, setMenahan] = useState(false);
  const waktu = useRef<number>();
  const mulai = () => {
    setMenahan(true);
    waktu.current = window.setTimeout(() => { setMenahan(false); saatSelesai(); }, DURASI_TAHAN);
  };
  const lepas = () => { window.clearTimeout(waktu.current); setMenahan(false); };
  useEffect(() => () => window.clearTimeout(waktu.current), []);
  const tombolTahan = (event: React.KeyboardEvent) => event.key === ' ' || event.key === 'Enter';
  return (
    <button type="button" className={menahan ? 'aw-btn aw-btn-secondary tombol-tahan menahan' : 'aw-btn aw-btn-secondary tombol-tahan'}
      style={{ ['--durasi-tahan' as string]: `${DURASI_TAHAN}ms` }}
      onPointerDown={mulai} onPointerUp={lepas} onPointerLeave={lepas} onPointerCancel={lepas} onContextMenu={event => event.preventDefault()}
      onKeyDown={event => { if (tombolTahan(event) && !event.repeat) { event.preventDefault(); mulai(); } }}
      onKeyUp={event => { if (tombolTahan(event)) lepas(); }}>
      <span className="isi-tahan" aria-hidden="true" />
      <span className="label-tahan">{label}</span>
    </button>
  );
}
