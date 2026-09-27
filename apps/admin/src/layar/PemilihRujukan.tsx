// Pemilih rujukan dalil tanpa kode. PemilihRefs (panel Info) menampilkan rujukan terpilih sebagai kartu kecil berisi
// klaimnya + tautan "Tambah rujukan"; DialogRujukan (dipakai panel ini dan tombol "Sisip rujukan" di editor blok)
// memuat daftar_refs, mencarinya lewat kata biasa, dan menampilkan klaim per bab beserta jenis dalil & peringatan.
// Hanya kode dari daftar_refs yang bisa dipilih; tidak ada input bebas, supaya rujukan tak pernah dikarang.
import { useEffect, useState } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cariOpsiRujukan, opsiRujukan, teksRujukan, type OpsiRujukan } from '../editor/rujukan';
import { usePortal } from '../repo';
import { pesanGalat } from '../pesanGalat';

export function PemilihRefs({ nilai, saatUbah, bacaSaja = false }: { nilai: string[]; saatUbah: (refs: string[]) => void; bacaSaja?: boolean }) {
  const [buka, setBuka] = useState(false);
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-medium">Rujukan dalil</legend>
      {nilai.length > 0 ? (
        <ul className="grid gap-1.5">
          {nilai.map(kode => (
            <li key={kode} className="flex items-start gap-2 rounded-md border bg-muted/40 px-2 py-1.5 text-sm">
              <span className="min-w-0 flex-1">{teksRujukan(kode)}</span>
              {bacaSaja ? null : (
                <button type="button" className="mt-0.5 rounded-sm text-muted-foreground hover:text-destructive" aria-label={`Hapus rujukan ${teksRujukan(kode)}`}
                  onClick={() => saatUbah(nilai.filter(k => k !== kode))}>
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Belum ada rujukan.</p>}
      {bacaSaja ? null : (
        <Button type="button" variant="link" size="sm" className="h-auto w-fit p-0" onClick={() => setBuka(true)}>+ Tambah rujukan</Button>
      )}
      <DialogRujukan buka={buka} judul="Tambah rujukan" kecuali={nilai} saatTutup={() => setBuka(false)}
        saatPilih={kode => { saatUbah([...nilai, kode]); setBuka(false); }} />
    </fieldset>
  );
}

interface PropsDialog { buka: boolean; saatPilih: (kode: string) => void; saatTutup: () => void; judul?: string; kecuali?: readonly string[] }

export function DialogRujukan({ buka, saatPilih, saatTutup, judul = 'Sisip rujukan', kecuali = [] }: PropsDialog) {
  const [cari, setCari] = useState('');
  const tutup = () => { setCari(''); saatTutup(); };
  return (
    <Dialog open={buka} onOpenChange={terbuka => { if (!terbuka) tutup(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{judul}</DialogTitle>
          <DialogDescription>Cari dengan kata biasa, mis. "radd", "ibu sepertiga", atau "hadits".</DialogDescription>
        </DialogHeader>
        <Input aria-label={`Cari: ${judul}`} placeholder="Cari rujukan…" value={cari} onChange={e => setCari(e.target.value)} autoFocus />
        {buka ? <DaftarRujukan cari={cari} kecuali={kecuali} saatPilih={kode => { setCari(''); saatPilih(kode); }} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Dipasang hanya saat dialog terbuka, supaya daftar_refs dimuat seperlunya. */
function DaftarRujukan({ cari, kecuali, saatPilih }: { cari: string; kecuali: readonly string[]; saatPilih: (kode: string) => void }) {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<OpsiRujukan[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  useEffect(() => {
    repo.konten.daftarRefs().then(refs => setDaftar(opsiRujukan(refs))).catch(e => setGalat(pesanGalat(e)));
  }, [repo]);
  if (galat) return <p role="alert" className="text-sm text-destructive">{galat}</p>;
  if (!daftar) return <p className="text-sm text-muted-foreground">Memuat rujukan…</p>;
  const cocok = cariOpsiRujukan(daftar, cari).filter(opsi => !kecuali.includes(opsi.kode));
  if (cocok.length === 0) return <p className="text-sm text-muted-foreground">Tidak ada rujukan yang cocok.</p>;
  return (
    <div className="-mx-2 max-h-[55vh] overflow-y-auto">
      {perBab(cocok).map(([bab, isi]) => (
        <section key={bab} aria-label={`Bab ${bab}`} className="mb-3">
          <h3 className="sticky top-0 bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">Bab {bab} · {isi[0]!.judulBab}</h3>
          <ul>
            {isi.map(opsi => (
              <li key={opsi.kode}>
                <button type="button" className="grid w-full gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onClick={() => saatPilih(opsi.kode)}>
                  <span className="text-sm">{opsi.klaim}</span>
                  {opsi.jenisDalil ? <span className="text-xs text-muted-foreground">{opsi.jenisDalil}</span> : null}
                  {opsi.peringatan.map(p => (
                    <span key={p} className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                      <TriangleAlert className="size-3 shrink-0" aria-hidden />{p}
                    </span>
                  ))}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function perBab(daftar: OpsiRujukan[]): [number, OpsiRujukan[]][] {
  const peta = new Map<number, OpsiRujukan[]>();
  for (const opsi of daftar) peta.set(opsi.bab, [...(peta.get(opsi.bab) ?? []), opsi]);
  return [...peta].sort(([a], [b]) => a - b);
}
