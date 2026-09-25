// Dialog konfirmasi di halaman (tanpa window.confirm). Dua tombol sejajar selebar sama: Batal (fokus awal) dan
// aksi lanjut. Esc = Batal. Untuk aksi yang sengaja dibuat berat (mis. membuka jawaban dengan pindah mode),
// `kataKunci` mewajibkan pengguna mengetik kata itu dulu sebelum tombol lanjut aktif.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Tombol } from './komponen';

interface Props {
  judul: string;
  children: ReactNode;
  labelLanjut: string;
  labelBatal?: string;
  saatLanjut: () => void;
  saatBatal: () => void;
  kataKunci?: string;
}

export function DialogKonfirmasi({ judul, children, labelLanjut, labelBatal = 'Batal', saatLanjut, saatBatal, kataKunci }: Props) {
  const id = useId();
  const wadah = useRef<HTMLDivElement>(null);
  const [ketikan, setKetikan] = useState('');
  const bolehLanjut = !kataKunci || ketikan.trim().toLowerCase() === kataKunci.toLowerCase();
  useEffect(() => { wadah.current?.querySelector<HTMLButtonElement>('[data-batal]')?.focus(); }, []);
  return (
    <div className="konfirmasi" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-judul`} aria-describedby={`${id}-isi`}
      ref={wadah} onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <div className="konfirmasi-isi">
        <h2 id={`${id}-judul`}>{judul}</h2>
        <div id={`${id}-isi`} className="isi-konfirmasi">{children}</div>
        {kataKunci && (
          <label className="isian isian-kata-kunci">
            Ketik <b>{kataKunci}</b> untuk melanjutkan
            <input value={ketikan} onChange={event => setKetikan(event.target.value)} autoComplete="off" spellCheck={false} />
          </label>
        )}
        <div className="aksi-konfirmasi">
          <Tombol varian="secondary" data-batal onClick={saatBatal}>{labelBatal}</Tombol>
          <Tombol onClick={saatLanjut} disabled={!bolehLanjut}>{labelLanjut}</Tombol>
        </div>
      </div>
    </div>
  );
}
