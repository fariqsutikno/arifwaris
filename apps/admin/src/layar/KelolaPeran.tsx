// Layar kelola peran (khusus admin): tabel nama+email+peran dari repo.akun.daftarPeran(), form untuk
// memberi peran lewat email (repo.akun.aturPeran), dan "Cabut" per baris (window.confirm) yang menonaktifkan
// tombol untuk baris admin sendiri supaya admin tidak bisa mengunci diri sendiri. Galat aturPeran (mis. email
// tak dikenal) ditampilkan sebagai teks, tabel tidak diubah sebelum aturPeran berhasil.
import { useEffect, useState } from 'react';
import { type Peran } from '@waris/content';
import type { PeranPengguna } from '@waris/data';
import { usePortal } from '../repo';
import { Tombol } from '@waris/web/ui/komponen';

const DAFTAR_PERAN: Peran[] = ['admin', 'penulis', 'reviewer'];

export function KelolaPeran() {
  const { repo, sesi } = usePortal();
  const [daftar, setDaftar] = useState<PeranPengguna[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [peranBaru, setPeranBaru] = useState<Peran>('penulis');

  function muatUlang() {
    return repo.akun.daftarPeran().then(setDaftar);
  }

  useEffect(() => {
    muatUlang().catch(e => setGalat(e instanceof Error ? e.message : String(e)));
  }, [repo]);

  async function beriPeran() {
    setGalat(null);
    try {
      await repo.akun.aturPeran(email.trim(), peranBaru);
      setEmail('');
      await muatUlang();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    }
  }

  async function cabut(baris: PeranPengguna) {
    if (!window.confirm(`Cabut peran ${baris.email}?`)) return;
    setGalat(null);
    try {
      await repo.akun.aturPeran(baris.email, null);
      await muatUlang();
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <h2>Peran</h2>
      {galat ? <p role="alert">{galat}</p> : null}
      <table>
        <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th /></tr></thead>
        <tbody>
          {daftar.map(baris => (
            <tr key={baris.userId}>
              <td>{baris.nama ?? ''}</td>
              <td>{baris.email}</td>
              <td>{baris.peran}</td>
              <td>
                <Tombol onClick={() => void cabut(baris)} disabled={baris.userId === sesi.userId}>Cabut</Tombol>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <label>
        Email{' '}
        <input value={email} onChange={event => setEmail(event.target.value)} />
      </label>
      {' '}
      <label>
        Peran{' '}
        <select value={peranBaru} onChange={event => setPeranBaru(event.target.value as Peran)}>
          {DAFTAR_PERAN.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      {' '}
      <Tombol onClick={() => void beriPeran()}>Beri peran</Tombol>
    </div>
  );
}
