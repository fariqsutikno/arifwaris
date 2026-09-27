// Beranda portal (spec tahap A "Beranda"): memuat daftarEntri semua jenis, meringkasnya lewat ringkasBeranda
// (angka milik saya & antrean, lanjutkan pekerjaan, antrean tertua untuk reviewer), dan menampilkan tombol buat baru
// untuk admin/penulis. Galat repo tampil sebagai Alert dengan tombol coba lagi.
import { useEffect, useState } from 'react';
import { JENIS_KONTEN, type JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LABEL_ISI } from '../navigasi';
import { judulEntri, LABEL_TAB, ringkasBeranda, statusTampil, waktuRelatif, type RingkasanBeranda, type StatusTampil } from '../ringkas';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';

const JENIS_BUAT_BARU: JenisKonten[] = ['materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq'];
const LABEL_PERAN = { admin: 'Admin', penulis: 'Penulis', reviewer: 'Reviewer' } as const;

export function Beranda() {
  const { repo, sesi, peran } = usePortal();
  const [ringkasan, setRingkasan] = useState<RingkasanBeranda | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    Promise.all(JENIS_KONTEN.map(jenis => repo.konten.daftarEntri(jenis)))
      .then(semua => { if (!dibatalkan) setRingkasan(ringkasBeranda(semua.flat(), sesi.userId)); })
      .catch(e => { if (!dibatalkan) setGalat(e instanceof Error ? e.message : String(e)); });
    return () => { dibatalkan = true; };
  }, [repo, sesi.userId, muatUlang]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assalamu'alaikum, {sesi.email.split('@')[0]}</h1>
        <p className="text-muted-foreground">{LABEL_PERAN[peran]}</p>
      </div>
      {galat ? <PesanGalat pesan={galat} onCobaLagi={() => setMuatUlang(n => n + 1)} /> : null}
      {!ringkasan && !galat ? <div className="space-y-2"><Skeleton className="h-24" /><Skeleton className="h-48" /></div> : null}
      {ringkasan ? <IsiBeranda ringkasan={ringkasan} reviewer={peran === 'reviewer'} /> : null}
    </div>
  );
}

export function PesanGalat({ pesan, onCobaLagi }: { pesan: string; onCobaLagi: () => void }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription className="flex items-center justify-between gap-3">
        {pesan}<Button variant="outline" size="sm" onClick={onCobaLagi}>Coba lagi</Button>
      </AlertDescription>
    </Alert>
  );
}

export function ChipStatus({ status }: { status: StatusTampil }) {
  if (status === 'terbit + draf') return <span className="inline-flex gap-1"><Badge>Terbit</Badge><Badge variant="secondary">+ draf</Badge></span>;
  const varian = status === 'terbit' ? 'default' : status === 'dikembalikan' ? 'destructive' : status === 'diajukan' ? 'outline' : 'secondary';
  return <Badge variant={varian}>{LABEL_TAB[status]}</Badge>;
}

function IsiBeranda({ ringkasan, reviewer }: { ringkasan: RingkasanBeranda; reviewer: boolean }) {
  const sekarang = new Date();
  const daftarUtama = reviewer ? ringkasan.antreanTertua : ringkasan.lanjutkan;
  const judulDaftar = reviewer ? 'Menunggu review' : 'Lanjutkan pekerjaan';
  return (
    <>
      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KartuAngka label="Draf saya" angka={ringkasan.drafSaya} />
        <KartuAngka label="Menunggu review" angka={ringkasan.menungguReview} />
        <KartuAngka label="Dikembalikan ke saya" angka={ringkasan.dikembalikanKeSaya} peringatan={ringkasan.dikembalikanKeSaya > 0} />
        <KartuAngka label="Terbit" angka={ringkasan.terbit} />
      </section>
      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        <Card aria-label={judulDaftar} role="region">
          <CardHeader><CardTitle>{judulDaftar}</CardTitle></CardHeader>
          <CardContent>
            {daftarUtama.length === 0 ? <p className="text-muted-foreground">Tidak ada yang tertunda.</p> : (
              <ul className="divide-y">{daftarUtama.map(entri => <BarisBeranda key={entri.entriId} entri={entri} sekarang={sekarang} />)}</ul>
            )}
            {reviewer ? <a className="font-semibold underline" href={tulisRute({ layar: 'review' })}>Buka antrean review</a> : null}
          </CardContent>
        </Card>
        {reviewer ? null : (
          <Card aria-label="Buat baru" role="region">
            <CardHeader><CardTitle>Buat baru</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {JENIS_BUAT_BARU.map(jenis => (
                <Button key={jenis} variant="outline" size="sm" asChild>
                  <a href={tulisRute({ layar: 'entriBaru', jenis })}>+ {LABEL_ISI[jenis]}</a>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function KartuAngka({ label, angka, peringatan }: { label: string; angka: number; peringatan?: boolean }) {
  return (
    <Card className={peringatan ? 'border-destructive' : undefined}>
      <CardContent className="pt-6">
        <div className="text-3xl font-bold">{angka}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function BarisBeranda({ entri, sekarang }: { entri: RingkasanEntri; sekarang: Date }) {
  const catatan = entri.revisiTerakhir?.catatanReview;
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="min-w-0 flex-1">
        <a className="font-semibold hover:underline" href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judulEntri(entri)}</a>
        <span className="block text-sm text-muted-foreground">{LABEL_ISI[entri.jenis]}</span>
        {catatan ? <span className="block text-sm text-muted-foreground">{catatan}</span> : null}
      </span>
      <ChipStatus status={statusTampil(entri)} />
      <span className="hidden text-sm text-muted-foreground md:inline">
        {entri.revisiTerakhir ? waktuRelatif(entri.revisiTerakhir.dibuatPada, sekarang) : ''}
      </span>
    </li>
  );
}
