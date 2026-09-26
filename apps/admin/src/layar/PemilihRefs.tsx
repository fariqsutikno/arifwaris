// Pemilih refs [Rxx-y]: memuat daftar_refs sekali lewat repo.konten.daftarRefs(), menyaring dengan kode ("R09") atau
// bab ("bab 9"), dan menampilkan ref terpilih sebagai chip yang bisa dihapus. Hanya kode dari daftar_refs yang bisa
// dipilih; tidak ada input bebas, supaya ref tak pernah dikarang.
import { useEffect, useState } from 'react';
import { usePortal } from '../repo';

const BATAS_SARAN = 20;

export function PemilihRefs({ nilai, saatUbah, bacaSaja = false }: { nilai: string[]; saatUbah: (refs: string[]) => void; bacaSaja?: boolean }) {
  const { repo } = usePortal();
  const [daftarRefs, setDaftarRefs] = useState<{ kode: string; bab: number }[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [cari, setCari] = useState('');

  useEffect(() => {
    repo.konten.daftarRefs().then(setDaftarRefs).catch(e => setGalat(e instanceof Error ? e.message : String(e)));
  }, [repo]);

  const saran = cari.trim() ? daftarRefs.filter(ref => !nilai.includes(ref.kode) && cocok(ref, cari)).slice(0, BATAS_SARAN) : [];

  return (
    <fieldset>
      <legend>Refs</legend>
      {galat ? <p role="alert">{galat}</p> : null}
      {nilai.map(kode => (
        <span key={kode}>
          {kode}
          {bacaSaja ? null : <button type="button" aria-label={`Hapus ${kode}`} onClick={() => saatUbah(nilai.filter(k => k !== kode))}>×</button>}{' '}
        </span>
      ))}
      {bacaSaja ? null : (
        <>
          <input aria-label="Cari ref" placeholder='kode atau "bab 9"' value={cari} onChange={e => setCari(e.target.value)} />
          {saran.map(ref => (
            <button key={ref.kode} type="button" onClick={() => { saatUbah([...nilai, ref.kode]); setCari(''); }}>{ref.kode}</button>
          ))}
        </>
      )}
    </fieldset>
  );
}

function cocok(ref: { kode: string; bab: number }, cari: string): boolean {
  const bab = /^bab\s*(\d+)$/i.exec(cari.trim());
  return bab ? ref.bab === Number(bab[1]) : ref.kode.toLowerCase().includes(cari.trim().toLowerCase());
}
