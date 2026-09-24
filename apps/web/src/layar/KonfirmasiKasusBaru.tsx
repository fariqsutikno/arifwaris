// Konfirmasi sebelum kasus yang sedang ada dihapus (Ulangi dari awal, atau memilih tujuan saat ada kasus tersimpan).
// Dialog di halaman (tanpa window.confirm): fokus langsung ke Batal, Esc = Batal, simpan file ditawarkan dulu.

import { useEffect, useRef } from 'react';
import { Tombol } from '../ui/komponen';

interface Props { saatSimpan: () => void; saatLanjut: () => void; saatBatal: () => void }

export function KonfirmasiKasusBaru({ saatSimpan, saatLanjut, saatBatal }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => {
    wadah.current?.querySelector<HTMLButtonElement>('[data-batal]')?.focus();
  }, []);
  return (
    <div className="konfirmasi" role="alertdialog" aria-modal="true" aria-labelledby="judul-konfirmasi" aria-describedby="isi-konfirmasi"
      ref={wadah} onKeyDown={event => { if (event.key === 'Escape') saatBatal(); }}>
      <div className="konfirmasi-isi">
        <h2 id="judul-konfirmasi">Mulai kasus baru?</h2>
        <p id="isi-konfirmasi">Kasus yang sedang diisi akan dihapus dari perangkat ini. Mau simpan file-nya dulu?</p>
        <div className="chip-deret">
          <Tombol varian="secondary" onClick={saatSimpan}>Simpan file dulu</Tombol>
          <Tombol onClick={saatLanjut}>Hapus dan mulai baru</Tombol>
          <Tombol varian="ghost" data-batal onClick={saatBatal}>Batal</Tombol>
        </div>
      </div>
    </div>
  );
}
