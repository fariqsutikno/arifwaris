// Panel di bawah penyunting isi pelajaran: hasil pemeriksa sebaris (galat dan peringatan dengan nomor baris, bahasa biasa)
// dan panel "Sintaks blok" yang dibuka dengan tautan teks. Menerima Markdown isi + slug; memeriksa setelah penulis
// berhenti mengetik. Galat menghalangi Simpan (dijaga EditorEntri lewat galatSimpanMateri), peringatan tidak.
import { useEffect, useState } from 'react';
import { AlertTriangle, CircleCheck, XCircle } from 'lucide-react';
import type { Temuan } from '@waris/content';
import { Button } from '@/components/ui/button';
import { hitungGalat, memakaiFormatBaru, periksaIsiMateri } from '../editor/periksaIsiMateri';
import { SINTAKS_BLOK, SINTAKS_TEKS } from '../editor/sintaksBlok';

const JEDA_PERIKSA_MS = 400;

export function PanelPemeriksa({ markdown, slug }: { markdown: string; slug: string }) {
  const [temuan, setTemuan] = useState<Temuan[] | null>(null);
  const [bukaSintaks, setBukaSintaks] = useState(false);
  useEffect(() => {
    const jeda = setTimeout(() => setTemuan(periksaIsiMateri(markdown, slug)), JEDA_PERIKSA_MS);
    return () => clearTimeout(jeda);
  }, [markdown, slug]);

  const galat = temuan ? hitungGalat(temuan) : 0;
  return (
    <div className="grid gap-2 border-t p-3 text-sm" aria-label="Pemeriksa isi pelajaran">
      <div className="flex flex-wrap items-center gap-3">
        <Ringkasan temuan={temuan} galat={galat} formatBaru={memakaiFormatBaru(markdown)} />
        <Button type="button" variant="link" size="sm" className="ml-auto h-auto p-0 text-xs" aria-expanded={bukaSintaks}
          onClick={() => setBukaSintaks(!bukaSintaks)}>
          {bukaSintaks ? 'Tutup sintaks blok' : 'Sintaks blok'}
        </Button>
      </div>
      {temuan && temuan.length > 0 ? (
        <ul className="grid gap-1" aria-label="Temuan pemeriksa">
          {temuan.map((isi, i) => (
            <li key={i} className="flex items-start gap-2">
              {isi.tingkat === 'galat'
                ? <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Galat" />
                : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-label="Peringatan" />}
              <span><span className="font-medium">Baris {isi.baris}:</span> {isi.pesan}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {bukaSintaks ? <PanelSintaks /> : null}
    </div>
  );
}

function Ringkasan({ temuan, galat, formatBaru }: { temuan: Temuan[] | null; galat: number; formatBaru: boolean }) {
  if (!formatBaru) return <span className="text-muted-foreground">Isi gaya lama: pemeriksa format baru tidak dijalankan.</span>;
  if (!temuan) return <span className="text-muted-foreground">Memeriksa...</span>;
  if (temuan.length === 0) return <span className="flex items-center gap-1.5"><CircleCheck className="size-4 text-emerald-600" aria-hidden /> Tidak ada temuan.</span>;
  const peringatan = temuan.length - galat;
  return (
    <span role="status" className={galat ? 'font-medium text-destructive' : 'font-medium'}>
      {galat ? `${galat} galat harus diperbaiki sebelum disimpan` : 'Siap disimpan'}{peringatan ? `, ${peringatan} peringatan` : ''}.
    </span>
  );
}

function PanelSintaks() {
  return (
    <div className="grid gap-3 rounded-md border bg-muted/40 p-3" aria-label="Sintaks blok">
      <p className="text-xs text-muted-foreground">
        Setiap blok ditulis di antara pagar tiga tanda kutip terbalik dengan nama blok, lalu baris "kunci: nilai". Baris kosong di dalam blok diabaikan.
      </p>
      <dl className="grid gap-1 text-xs">
        {SINTAKS_TEKS.map(baris => (
          <div key={baris.tulis} className="grid gap-0.5 sm:grid-cols-[16rem_1fr] sm:gap-3">
            <dt><code>{baris.tulis}</code></dt><dd>{baris.hasil}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-2">
        {SINTAKS_BLOK.map(blok => (
          <details key={blok.nama} className="text-xs">
            <summary className="cursor-pointer"><span className="font-medium">{blok.nama}</span> · {blok.fungsi}</summary>
            <pre className="mt-1 overflow-x-auto rounded bg-background p-2 font-mono">{blok.contoh}</pre>
          </details>
        ))}
      </div>
    </div>
  );
}
