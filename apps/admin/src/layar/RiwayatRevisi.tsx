// Riwayat revisi satu entri: daftar semua revisi (terbaru di atas) dengan status, pembuat, tanggal, catatan
// review, dan diff terhadap revisi yang sedang terbit. Rollback (terbitkanUlang) hanya ditawarkan untuk revisi
// berstatus disetujui yang bukan revisi terbit sekarang (termasuk untuk memulihkan entri yang dihapus), mencerminkan penjaga SQL terbitkan_ulang_revisi
// (peran reviewer/admin) — database tetap penjaga sebenarnya, tombol ini cuma sinyal UI.
import { useEffect, useState } from 'react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanRevisi } from '@waris/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { diffBaris, teksBanding } from '../editor/diff';
import { usePortal, type RepoPortal } from '../repo';

export function RiwayatRevisi(props: { entriId: string; jenis: JenisKonten; revisiTerbitId: string | null; saatBerubah: () => void }) {
  const { repo, peran } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanRevisi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    repo.konten.daftarRevisi(props.entriId)
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, props.entriId]);

  if (galat) return <p role="alert" className="text-sm text-destructive">{galat}</p>;
  if (!daftar) return null;
  const terbit = daftar.find(r => r.id === props.revisiTerbitId) ?? null;
  const bolehRollback = peran === 'reviewer' || peran === 'admin';

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">Riwayat revisi</h2>
      <Card className="gap-0 divide-y py-0">
      {[...daftar].reverse().map(revisi => (
        <BarisRiwayat
          key={revisi.id}
          revisi={revisi}
          jenis={props.jenis}
          terbit={terbit}
          sedangTerbit={revisi.id === props.revisiTerbitId}
          bolehRollback={bolehRollback}
          repo={repo}
          saatBerubah={props.saatBerubah}
        />
      ))}
      </Card>
    </section>
  );
}

function BarisRiwayat(props: {
  revisi: RingkasanRevisi; jenis: JenisKonten; terbit: RingkasanRevisi | null; sedangTerbit: boolean;
  bolehRollback: boolean; repo: RepoPortal; saatBerubah: () => void;
}) {
  const { revisi, jenis, terbit, sedangTerbit, bolehRollback } = props;
  const [tampilDiff, setTampilDiff] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const bolehTombolRollback = bolehRollback && revisi.status === 'disetujui' && !sedangTerbit;

  async function rollback() {
    if (!window.confirm(`Terbitkan ulang revisi ${revisi.id.slice(0, 8)}? Ini akan menggantikan revisi yang sedang terbit.`)) return;
    setGalat(null);
    try {
      await props.repo.editorial.terbitkanUlang(revisi.id);
      props.saatBerubah();
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  return (
    <article aria-label={`revisi ${revisi.id.slice(0, 8)}`} className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm">
          {sedangTerbit ? 'terbit' : revisi.status} · {revisi.dibuatOleh.slice(0, 8)} · {revisi.dibuatPada}
        </p>
        {revisi.hapus ? <Badge variant="destructive">penghapusan</Badge> : null}
        {sedangTerbit && !revisi.hapus ? <Badge>Terbit</Badge> : null}
        <span className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTampilDiff(v => !v)}>Lihat beda dengan terbit</Button>
          {bolehTombolRollback ? <Button size="sm" onClick={() => void rollback()}>Terbitkan ulang</Button> : null}
        </span>
      </div>
      {revisi.catatanReview ? <p className="text-sm text-muted-foreground">Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert" className="text-sm text-destructive">{galat}</p> : null}
      {tampilDiff ? <Diff baris={diffBaris(terbit ? teksBanding(jenis, terbit.isi) : '', teksBanding(jenis, revisi.isi))} /> : null}
    </article>
  );
}

const WARNA_DIFF = { sama: '', tambah: 'bg-primary/15', hapus: 'bg-destructive/15' } as const;

/** Diff baris (hasil diffBaris) dengan penanda +/- dan latar berwarna; dipakai riwayat & antrean review. */
export function Diff({ baris: daftarBaris }: { baris: ReturnType<typeof diffBaris> }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-3 font-mono text-xs">
      {daftarBaris.map((baris, i) => <div key={i} className={WARNA_DIFF[baris.jenis]}>{PENANDA_DIFF[baris.jenis]}{baris.teks}</div>)}
    </pre>
  );
}

const PENANDA_DIFF = { sama: '  ', tambah: '+ ', hapus: '- ' } as const;
const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));
