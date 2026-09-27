// Layar daftar entri satu jenis konten: tabel terurut `urutan` dengan slug, judul, status ringkas, dan refs;
// filter status di sisi klien; tautan "Entri baru" ke layar buat entri. Data dari repo.konten.daftarEntri(jenis);
// galat repository ditampilkan sebagai teks di atas tabel, bukan menghentikan render.
import { useEffect, useState } from 'react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { judulEntri, statusTampil } from '../ringkas';

type FilterStatus = 'semua' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit';
const FILTER_STATUS: FilterStatus[] = ['semua', 'draf', 'diajukan', 'dikembalikan', 'terbit'];
const LABEL_FILTER: Record<FilterStatus, string> = {
  semua: 'Semua', draf: 'Draf', diajukan: 'Diajukan', dikembalikan: 'Dikembalikan', terbit: 'Terbit',
};

export function DaftarKonten({ jenis }: { jenis: JenisKonten }) {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanEntri[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('semua');

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    repo.konten.daftarEntri(jenis)
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(e instanceof Error ? e.message : String(e)); });
    return () => { dibatalkan = true; };
  }, [repo, jenis]);

  const tampil = daftar.filter(entri => filter === 'semua' || statusTampil(entri) === filter);

  return (
    <div>
      <h2>{jenis}</h2>
      {galat ? <p role="alert">{galat}</p> : null}
      <label>
        Status{' '}
        <select value={filter} onChange={event => setFilter(event.target.value as FilterStatus)}>
          {FILTER_STATUS.map(f => <option key={f} value={f}>{LABEL_FILTER[f]}</option>)}
        </select>
      </label>
      {' '}
      <a href={tulisRute({ layar: 'entriBaru', jenis })}>Entri baru</a>
      <table>
        <thead><tr><th>Slug</th><th>Judul</th><th>Status</th><th>Refs</th></tr></thead>
        <tbody>
          {tampil.map(entri => (
            <tr key={entri.entriId}>
              <td><a href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{entri.slug}</a></td>
              <td>{judulEntri(entri)}</td>
              <td>{statusTampil(entri)}</td>
              <td>{entri.revisiTerakhir?.refs.join(', ') ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
