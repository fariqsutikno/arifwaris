// Dropdown multi-pilih: tombol berisi ringkasan pilihan, panel daftar kotak centang. Menutup saat klik di luar atau Esc
// (fokus kembali ke tombol). Pilihan dikendalikan induk; komponen ini hanya menyajikan dan melaporkan perubahan.

import { useEffect, useId, useRef, useState } from 'react';
import { Ikon } from '../../ui/Ikon';
import { t } from '../../terjemah';

export interface OpsiCentang { nilai: string; teks: string }

interface Props {
  label: string;
  opsi: OpsiCentang[];
  terpilih: ReadonlySet<string>;
  ringkasan: string;
  saatUbah: (baru: Set<string>) => void;
}

export function DropdownCentang({ label, opsi, terpilih, ringkasan, saatUbah }: Props) {
  const [terbuka, setTerbuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  const tombol = useRef<HTMLButtonElement>(null);
  const idPanel = useId();
  const semuaTerpilih = opsi.every(isi => terpilih.has(isi.nilai));

  useEffect(() => {
    if (!terbuka) return;
    const diLuar = (kejadian: PointerEvent) => { if (!akar.current?.contains(kejadian.target as Node)) setTerbuka(false); };
    document.addEventListener('pointerdown', diLuar);
    return () => document.removeEventListener('pointerdown', diLuar);
  }, [terbuka]);

  const ubah = (nilai: string) => {
    const baru = new Set(terpilih);
    if (!baru.delete(nilai)) baru.add(nilai);
    saatUbah(baru);
  };

  return (
    <div className="dropdown-centang" ref={akar} onKeyDown={kejadian => { if (kejadian.key === 'Escape' && terbuka) { setTerbuka(false); tombol.current?.focus(); } }}>
      <span className="label-dropdown">{label}</span>
      <button type="button" ref={tombol} className="pemicu-dropdown" aria-expanded={terbuka} aria-controls={idPanel} onClick={() => setTerbuka(!terbuka)}>
        <span>{ringkasan}</span><Ikon nama="kembali" ukuran={16} />
      </button>
      {terbuka && (
        <div className="panel-dropdown" id={idPanel} role="group" aria-label={label}>
          <button type="button" className="tautan-dropdown" onClick={() => saatUbah(new Set(semuaTerpilih ? [] : opsi.map(isi => isi.nilai)))}>
            {semuaTerpilih ? t('latihan.kosongkan_pilihan') : t('latihan.pilih_semua')}
          </button>
          {opsi.map(isi => (
            <label key={isi.nilai} className="opsi-dropdown">
              <input type="checkbox" checked={terpilih.has(isi.nilai)} onChange={() => ubah(isi.nilai)} />
              <span className="kotak-centang" aria-hidden="true"><Ikon nama="benar" ukuran={14} /></span>
              <span>{isi.teks}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
