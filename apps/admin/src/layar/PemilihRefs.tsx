// Pemilih refs [Rxx-y]: memuat daftar_refs sekali lewat repo.konten.daftarRefs(), menyaring dengan kode ("R09") atau
// bab ("bab 9"), dan menampilkan ref terpilih sebagai chip yang bisa dihapus. Hanya kode dari daftar_refs yang bisa
// dipilih; tidak ada input bebas, supaya ref tak pernah dikarang.
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePortal } from '../repo';
import { pesanGalat } from '../pesanGalat';

const BATAS_SARAN = 20;

export function PemilihRefs({ nilai, saatUbah, bacaSaja = false }: { nilai: string[]; saatUbah: (refs: string[]) => void; bacaSaja?: boolean }) {
  const { repo } = usePortal();
  const [daftarRefs, setDaftarRefs] = useState<{ kode: string; bab: number }[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [cari, setCari] = useState('');

  useEffect(() => {
    repo.konten.daftarRefs().then(setDaftarRefs).catch(e => setGalat(pesanGalat(e)));
  }, [repo]);

  const saran = cari.trim() ? daftarRefs.filter(ref => !nilai.includes(ref.kode) && cocokRef(ref, cari)).slice(0, BATAS_SARAN) : [];

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-medium">Refs</legend>
      {galat ? <p role="alert" className="text-sm text-destructive">{galat}</p> : null}
      {nilai.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {nilai.map(kode => (
            <Badge key={kode} variant="secondary" className="gap-1 font-mono">
              {kode}
              {bacaSaja ? null : (
                <button type="button" className="rounded-sm hover:text-destructive" aria-label={`Hapus ${kode}`} onClick={() => saatUbah(nilai.filter(k => k !== kode))}>
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      ) : bacaSaja ? <p className="text-sm text-muted-foreground">Belum ada ref.</p> : null}
      {bacaSaja ? null : (
        <>
          <Input aria-label="Cari ref" placeholder='kode atau "bab 9"' value={cari} onChange={e => setCari(e.target.value)} />
          {saran.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {saran.map(ref => (
                <Button key={ref.kode} type="button" variant="outline" size="sm" className="font-mono" onClick={() => { saatUbah([...nilai, ref.kode]); setCari(''); }}>{ref.kode}</Button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </fieldset>
  );
}

export function cocokRef(ref: { kode: string; bab: number }, cari: string): boolean {
  const bab = /^bab\s*(\d+)$/i.exec(cari.trim());
  return bab ? ref.bab === Number(bab[1]) : ref.kode.toLowerCase().includes(cari.trim().toLowerCase());
}
