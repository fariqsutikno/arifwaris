// Riwayat revisi satu entri: daftar semua revisi (terbaru di atas) bernomor urut, dengan status, pembuat ("Anda" /
// nama untuk admin), waktu relatif (tanggal lengkap di tooltip), catatan review, dan perubahan dibanding revisi
// sebelumnya atau versi terbit. Rollback (terbitkanUlang) hanya ditawarkan untuk revisi berstatus disetujui yang bukan
// revisi terbit sekarang, mencerminkan penjaga SQL terbitkan_ulang_revisi (peran reviewer/admin) — database tetap
// penjaga sebenarnya, tombol ini cuma sinyal UI. Diff dipakai juga oleh antrean review.
import { useEffect, useState } from 'react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanRevisi } from '@waris/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { diffBaris, lipatDiff, teksBanding, type BarisDiff } from '../editor/diff';
import { usePortal, type RepoPortal } from '../repo';
import { pesanGalat } from '../pesanGalat';
import { useNamaPengguna } from '../pengguna';
import { LABEL_STATUS_REVISI, tanggalLengkap, waktuRelatif } from '../ringkas';

type Banding = 'sebelumnya' | 'terbit';

export function RiwayatRevisi(props: { entriId: string; jenis: JenisKonten; revisiTerbitId: string | null; saatBerubah: () => void }) {
  const { repo, peran } = usePortal();
  const namaPengguna = useNamaPengguna();
  const [daftar, setDaftar] = useState<RingkasanRevisi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    repo.konten.daftarRevisi(props.entriId)
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
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
        {daftar.map((revisi, indeks) => (
          <BarisRiwayat
            key={revisi.id}
            nomor={indeks + 1}
            revisi={revisi}
            sebelumnya={daftar[indeks - 1] ?? null}
            jenis={props.jenis}
            terbit={terbit}
            sedangTerbit={revisi.id === props.revisiTerbitId}
            bolehRollback={bolehRollback}
            pembuat={namaPengguna(revisi.dibuatOleh)}
            repo={repo}
            saatBerubah={props.saatBerubah}
          />
        )).reverse()}
      </Card>
    </section>
  );
}

function BarisRiwayat(props: {
  nomor: number; revisi: RingkasanRevisi; sebelumnya: RingkasanRevisi | null; jenis: JenisKonten; terbit: RingkasanRevisi | null;
  sedangTerbit: boolean; bolehRollback: boolean; pembuat: string; repo: RepoPortal; saatBerubah: () => void;
}) {
  const { nomor, revisi, sebelumnya, jenis, terbit, sedangTerbit, bolehRollback, pembuat } = props;
  const [banding, setBanding] = useState<Banding | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const bolehTombolRollback = bolehRollback && revisi.status === 'disetujui' && !sedangTerbit;
  const label = `Revisi ${nomor}`;

  async function rollback() {
    if (!window.confirm(`Terbitkan ulang ${label.toLowerCase()}? Isinya akan menggantikan versi yang sedang terbit.`)) return;
    setGalat(null);
    try {
      await props.repo.editorial.terbitkanUlang(revisi.id);
      props.saatBerubah();
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  const pembanding = banding === 'terbit' ? terbit : sebelumnya;
  return (
    <article aria-label={label} className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-sm">{label}</b>
        {sedangTerbit ? <Badge>Terbit</Badge> : <Badge variant="secondary">{LABEL_STATUS_REVISI[revisi.status]}</Badge>}
        <span className="text-sm text-muted-foreground">
          oleh {pembuat} · <time dateTime={revisi.dibuatPada} title={tanggalLengkap(revisi.dibuatPada)}>{waktuRelatif(revisi.dibuatPada, new Date())}</time>
        </span>
        <span className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBanding(b => (b ? null : sebelumnya ? 'sebelumnya' : 'terbit'))}>
            {banding ? 'Tutup perubahan' : 'Lihat perubahan'}
          </Button>
          {bolehTombolRollback ? <Button size="sm" onClick={() => void rollback()}>Terbitkan ulang</Button> : null}
        </span>
      </div>
      {revisi.catatanReview ? <p className="text-sm text-muted-foreground">Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert" className="text-sm text-destructive">{galat}</p> : null}
      {banding ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            Dibanding:
            <Button size="sm" variant={banding === 'sebelumnya' ? 'secondary' : 'ghost'} disabled={!sebelumnya} onClick={() => setBanding('sebelumnya')}>revisi sebelumnya</Button>
            <Button size="sm" variant={banding === 'terbit' ? 'secondary' : 'ghost'} disabled={!terbit || sedangTerbit} onClick={() => setBanding('terbit')}>versi terbit</Button>
          </div>
          <Diff baris={diffBaris(pembanding ? teksBanding(jenis, pembanding.isi) : '', teksBanding(jenis, revisi.isi))} />
        </div>
      ) : null}
    </article>
  );
}

const WARNA_DIFF = { sama: '', tambah: 'bg-tambah/20', hapus: 'bg-destructive/15' } as const;
const PENANDA_DIFF = { sama: '  ', tambah: '+ ', hapus: '- ' } as const;

/** Diff baris (hasil diffBaris) dengan penanda +/- dan latar berwarna; baris sama yang jauh dari perubahan dilipat
 * (lipatDiff) dan bisa dibuka. Dipakai riwayat & antrean review. */
export function Diff({ baris: daftarBaris }: { baris: BarisDiff[] }) {
  const [terbuka, setTerbuka] = useState<ReadonlySet<number>>(new Set());
  const tambah = daftarBaris.filter(baris => baris.jenis === 'tambah').length;
  const hapus = daftarBaris.filter(baris => baris.jenis === 'hapus').length;
  const barisDiff = (baris: BarisDiff, i: number) => <div key={i} className={WARNA_DIFF[baris.jenis]}>{PENANDA_DIFF[baris.jenis]}{baris.teks}</div>;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        {tambah === 0 && hapus === 0 ? 'Tidak ada perubahan isi.' : `${tambah} baris ditambah, ${hapus} baris dihapus`}
      </p>
      <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
        {lipatDiff(daftarBaris).map((bagian, i) => {
          if (bagian.jenis === 'baris') return barisDiff(bagian.baris, i);
          if (terbuka.has(i)) return <div key={i}>{bagian.baris.map((baris, j) => barisDiff(baris, j))}</div>;
          return (
            <button key={i} type="button" className="my-0.5 block w-full rounded bg-background/60 py-0.5 text-center text-muted-foreground hover:text-foreground"
              onClick={() => setTerbuka(sekarang => new Set(sekarang).add(i))}>
              ⋯ {bagian.baris.length} baris sama (tampilkan)
            </button>
          );
        })}
      </pre>
    </div>
  );
}
