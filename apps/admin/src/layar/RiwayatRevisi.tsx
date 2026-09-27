// Riwayat satu entri sebagai linimasa (terbaru di atas): tiap revisi dan tiap kejadian Sampah (jejak_entri) ditulis
// sebagai kalimat manusia — siapa, melakukan apa, kapan — lengkap dengan catatan review/alasan. Revisi biasa bisa
// dibandingkan dengan versi tayang; reviewer/admin bisa menayangkan lagi revisi disetujui yang bukan versi tayang
// (terbitkanUlang). Database tetap penjaga sebenarnya; tombol ini cuma sinyal UI. Entri di Sampah dipulihkan lewat
// tombol Pulihkan di editor, bukan dari sini, supaya pemulihan tercatat.
import { useEffect, useState } from 'react';
import type { JenisKonten } from '@waris/content';
import type { JejakEntri, RingkasanRevisi } from '@waris/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { diffBaris, teksBanding } from '../editor/diff';
import { useNamaTim } from '../hooks/useNamaTim';
import { waktuRelatif } from '../ringkas';
import { usePortal, type RepoPortal } from '../repo';

const CATATAN_TARIK = 'pengajuan ditarik kembali';
type NamaDari = (userId: string) => string;
type Butir =
  | { jenis: 'revisi'; pada: string; revisi: RingkasanRevisi }
  | { jenis: 'jejak'; pada: string; jejak: JejakEntri };

export function RiwayatRevisi(props: { entriId: string; jenis: JenisKonten; revisiTerbitId: string | null; saatBerubah: () => void }) {
  const { repo, peran } = usePortal();
  const namaDari = useNamaTim();
  const [data, setData] = useState<{ revisi: RingkasanRevisi[]; jejak: JejakEntri[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.konten.daftarRevisi(props.entriId), repo.konten.daftarJejak(props.entriId)])
      .then(([revisi, jejak]) => { if (!dibatalkan) setData({ revisi, jejak }); })
      .catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, props.entriId, props.revisiTerbitId]);

  if (galat) return <p role="alert" className="text-sm text-destructive">{galat}</p>;
  if (!data) return null;
  const terbit = data.revisi.find(r => r.id === props.revisiTerbitId) ?? null;
  const bolehTayangkanLagi = (peran === 'reviewer' || peran === 'admin') && !terbit?.hapus;
  const sekarang = new Date();

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">Riwayat</h2>
      <Card className="gap-0 divide-y py-0">
        {susunLinimasa(data.revisi, data.jejak).map(butir => butir.jenis === 'jejak' ? (
          <article key={butir.jejak.id} aria-label="kejadian Sampah" className="space-y-1 px-4 py-3">
            <p className="text-sm">{kalimatJejak(butir.jejak, namaDari)} · <Waktu iso={butir.pada} sekarang={sekarang} /></p>
            {butir.jejak.catatan ? <p className="text-sm text-muted-foreground">Alasan: {butir.jejak.catatan}</p> : null}
          </article>
        ) : (
          <BarisRevisi
            key={butir.revisi.id}
            revisi={butir.revisi}
            jenis={props.jenis}
            terbit={terbit}
            sedangTayang={butir.revisi.id === props.revisiTerbitId && !butir.revisi.hapus}
            bolehTayangkanLagi={bolehTayangkanLagi && butir.revisi.status === 'disetujui' && !butir.revisi.hapus && butir.revisi.id !== props.revisiTerbitId}
            namaDari={namaDari}
            sekarang={sekarang}
            repo={repo}
            saatBerubah={props.saatBerubah}
          />
        ))}
      </Card>
    </section>
  );
}

/** Revisi & jejak digabung, terbaru di atas. Pengajuan ke Sampah yang masih menunggu atau yang dibuang langsung sudah
 * diwakili jejaknya (beserta alasan), jadi revisi penandanya tidak ditulis dua kali. */
export function susunLinimasa(revisi: RingkasanRevisi[], jejak: JejakEntri[]): Butir[] {
  const butirRevisi = revisi
    .filter(r => !(r.hapus && (r.status === 'diajukan' || (r.status === 'disetujui' && r.diperiksaOleh === r.dibuatOleh))))
    .map((r): Butir => ({ jenis: 'revisi', pada: r.diperiksaPada ?? r.dibuatPada, revisi: r }));
  const butirJejak = jejak.map((j): Butir => ({ jenis: 'jejak', pada: j.pada, jejak: j }));
  return [...butirRevisi, ...butirJejak].sort((a, b) => b.pada.localeCompare(a.pada));
}

export function kalimatRevisi(r: RingkasanRevisi, namaDari: NamaDari): string {
  const pembuat = namaDari(r.dibuatOleh);
  const pemeriksa = r.diperiksaOleh ? namaDari(r.diperiksaOleh) : 'reviewer';
  if (r.hapus) {
    if (r.status === 'disetujui') return `${pemeriksa} menyetujui pemindahan ke Sampah (diajukan ${pembuat})`;
    if (r.catatanReview === CATATAN_TARIK) return `${pembuat} membatalkan pengajuan ke Sampah`;
    return `${pemeriksa} menolak pemindahan ke Sampah (diajukan ${pembuat})`;
  }
  switch (r.status) {
    case 'draf': return `${pembuat} menyimpan draf (belum dikirim)`;
    case 'diajukan': return `${pembuat} mengirim perubahan untuk review`;
    case 'disetujui': return r.diperiksaOleh === r.dibuatOleh ? `${pembuat} menerbitkan perubahan` : `${pemeriksa} menyetujui perubahan dari ${pembuat}`;
    case 'dikembalikan': return `${pemeriksa} mengembalikan perubahan dari ${pembuat}`;
  }
}

export function kalimatJejak(j: JejakEntri, namaDari: NamaDari): string {
  const pelaku = namaDari(j.pelaku);
  switch (j.aksi) {
    case 'dibuang': return `${pelaku} memindahkan entri ke Sampah`;
    case 'buang_diajukan': return `${pelaku} mengajukan pemindahan ke Sampah`;
    case 'dipulihkan': return `${pelaku} memulihkan entri dari Sampah`;
  }
}

function BarisRevisi(props: {
  revisi: RingkasanRevisi; jenis: JenisKonten; terbit: RingkasanRevisi | null; sedangTayang: boolean; bolehTayangkanLagi: boolean;
  namaDari: NamaDari; sekarang: Date; repo: RepoPortal; saatBerubah: () => void;
}) {
  const { revisi, jenis, terbit } = props;
  const [tampilDiff, setTampilDiff] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function tayangkanLagi() {
    if (!window.confirm('Tayangkan lagi versi ini? Versi yang sekarang tayang di web akan digantikan.')) return;
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
        <p className="text-sm">{kalimatRevisi(revisi, props.namaDari)} · <Waktu iso={revisi.diperiksaPada ?? revisi.dibuatPada} sekarang={props.sekarang} /></p>
        {props.sedangTayang ? <Badge>Tayang</Badge> : null}
        {!revisi.hapus ? (
          <span className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setTampilDiff(v => !v)}>{tampilDiff ? 'Tutup beda' : 'Lihat beda dengan versi tayang'}</Button>
            {props.bolehTayangkanLagi ? <Button variant="outline" size="sm" onClick={() => void tayangkanLagi()}>Tayangkan lagi</Button> : null}
          </span>
        ) : null}
      </div>
      {revisi.catatanReview && revisi.catatanReview !== CATATAN_TARIK ? <p className="text-sm text-muted-foreground">Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert" className="text-sm text-destructive">{galat}</p> : null}
      {tampilDiff ? <Diff baris={diffBaris(terbit ? teksBanding(jenis, terbit.isi) : '', teksBanding(jenis, revisi.isi))} /> : null}
    </article>
  );
}

function Waktu({ iso, sekarang }: { iso: string; sekarang: Date }) {
  return <time dateTime={iso} title={new Date(iso).toLocaleString('id-ID')} className="text-muted-foreground">{waktuRelatif(iso, sekarang)}</time>;
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
