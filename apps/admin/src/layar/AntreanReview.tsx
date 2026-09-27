// Antrean review: memuat revisi berstatus diajukan dari editorial (konten) & diksi, lalu menampilkan tiap butir
// dengan diff terhadap versi terbitnya (konten: revisi terbit entri; diksi: teks terbit kunci; belum ada → semua
// baris tambah). Tombol Setujui/Kembalikan hanya tampil bila transisiRevisi mengizinkan (UI saja; database tetap
// penjaga); revisi milik sendiri berlabel "revisi Anda". Tiap butir berjudul jenis + judul entri, menyebut pembuat &
// waktu, dan menaut ke editor entrinya. Galat repo ditampilkan (lewat pesanGalat) di butir yang bersangkutan.
import { useEffect, useState } from 'react';
import { bacaIsi, transisiRevisi, type JenisKonten, type StatusRevisi } from '@waris/content';
import type { DiksiTerbit, RingkasanEntri } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { diffBaris, teksBanding } from '../editor/diff';
import { usePortal } from '../repo';
import { LABEL_ISI } from '../navigasi';
import { pesanGalat } from '../pesanGalat';
import { useNamaPengguna } from '../pengguna';
import { judulEntri, tanggalLengkap, waktuRelatif } from '../ringkas';
import { tulisRute } from '../rute';
import { Pratinjau } from './Pratinjau';
import { Diff } from './RiwayatRevisi';

interface Butir {
  id: string;
  jenis: string;
  judul: string;
  tautan: string;
  dibuatPada: string;
  status: StatusRevisi;
  dibuatOleh: string;
  teksLama: string;
  teksBaru: string;
  konten: { jenis: JenisKonten; slug: string; isi: unknown } | null;
  setujui: () => Promise<void>;
  kembalikan: (catatan: string) => Promise<void>;
}

export function AntreanReview() {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<Butir[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      const [revisiKonten, revisiDiksi, kunciDiksi, entri] = await Promise.all([
        repo.editorial.antreanReview(),
        repo.diksi.antreanReview(),
        repo.diksi.daftarKunci(),
        repo.konten.daftarEntri(),
      ]);
      const butirKonten = await Promise.all(revisiKonten.map(async (revisi): Promise<Butir> => {
        const e = entri.find(x => x.entriId === revisi.entriId);
        if (!e) throw new Error(`entri ${revisi.entriId} tidak ditemukan`);
        const basis = await basisTerbit(e);
        return {
          id: revisi.id, jenis: LABEL_ISI[e.jenis], judul: judulEntri(e, revisi.isi), tautan: tulisRute({ layar: 'entri', entriId: e.entriId }),
          dibuatPada: revisi.dibuatPada, status: revisi.status, dibuatOleh: revisi.dibuatOleh,
          teksLama: basis === null ? '' : teksBanding(e.jenis, basis), teksBaru: teksBanding(e.jenis, revisi.isi),
          konten: { jenis: e.jenis, slug: e.slug, isi: revisi.isi },
          setujui: () => repo.editorial.setujui(revisi.id),
          kembalikan: catatan => repo.editorial.kembalikan(revisi.id, catatan),
        };
      }));
      const butirDiksi = revisiDiksi.map((revisi): Butir => {
        const terbit = kunciDiksi.find(k => k.kunci === revisi.kunci)?.terbit ?? null;
        return {
          id: revisi.id, jenis: 'Diksi', judul: revisi.kunci, tautan: tulisRute({ layar: 'menu', menu: 'aplikasi', tab: 'diksi' }),
          dibuatPada: revisi.dibuatPada, status: revisi.status, dibuatOleh: revisi.dibuatOleh,
          teksLama: terbit ? teksDiksi(terbit) : '', teksBaru: teksDiksi({ id: revisi.idTeks, ar: revisi.arTeks }),
          konten: null,
          setujui: () => repo.diksi.setujui(revisi.id),
          kembalikan: catatan => repo.diksi.kembalikan(revisi.id, catatan),
        };
      });
      if (!dibatalkan) setDaftar([...butirKonten, ...butirDiksi].sort((a, b) => a.dibuatPada.localeCompare(b.dibuatPada)));
    })().catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };

    async function basisTerbit(e: RingkasanEntri): Promise<unknown> {
      const revisi = await repo.konten.daftarRevisi(e.entriId);
      const terbit = revisi.find(r => r.id === e.revisiTerbitId) ?? revisi.filter(r => r.status === 'disetujui').at(-1);
      return terbit?.isi ?? null;
    }
  }, [repo, muatUlang]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Antrean review</h1>
        {daftar?.length ? <p className="text-sm text-muted-foreground">{daftar.length} revisi menunggu diperiksa, terlama di atas.</p> : null}
      </div>
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      {!daftar && !galat ? <Skeleton className="h-48" /> : null}
      {daftar?.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Antrean review kosong.</p> : null}
      {daftar?.map(butir => <ButirReview key={butir.id} butir={butir} saatSelesai={() => setMuatUlang(n => n + 1)} />)}
    </div>
  );
}

function ButirReview({ butir, saatSelesai }: { butir: Butir; saatSelesai: () => void }) {
  const { sesi, peran } = usePortal();
  const namaPengguna = useNamaPengguna();
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [pratinjau, setPratinjau] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const pelaku = { peran, pelakuId: sesi.userId, pembuatId: butir.dibuatOleh, status: butir.status };
  const bolehPeriksa = transisiRevisi({ ...pelaku, aksi: 'setujui' }).ok;
  const bolehKembalikan = transisiRevisi({ ...pelaku, aksi: 'kembalikan', catatan }).ok;
  const idJudul = `review-${butir.id}`;

  async function jalankan(aksi: () => Promise<void>) {
    if (sibuk) return;
    setSibuk(true);
    setGalat(null);
    try {
      await aksi();
      saatSelesai();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Card role="article" aria-labelledby={idJudul}>
      <CardHeader className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-muted-foreground">{butir.jenis}</p>
          <CardTitle id={idJudul} className="break-words"><a className="hover:underline" href={butir.tautan}>{butir.judul}</a></CardTitle>
          <p className="text-sm text-muted-foreground">
            oleh {namaPengguna(butir.dibuatOleh)} ·{' '}
            <time dateTime={butir.dibuatPada} title={tanggalLengkap(butir.dibuatPada)}>{waktuRelatif(butir.dibuatPada, new Date())}</time>
          </p>
        </div>
        {butir.dibuatOleh === sesi.userId ? <Badge variant="secondary">revisi Anda</Badge> : null}
        <Button variant="ghost" size="sm" asChild><a href={butir.tautan}>Buka entri</a></Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
        <Diff baris={diffBaris(butir.teksLama, butir.teksBaru)} />
        {butir.konten ? <Button variant="outline" size="sm" onClick={() => setPratinjau(true)}>Pratinjau</Button> : null}
        {pratinjau && butir.konten ? <PratinjauButir {...butir.konten} saatTutup={() => setPratinjau(false)} /> : null}
        {bolehPeriksa ? (
          <div className="grid gap-3 border-t pt-3">
            <Label className="grid gap-1.5">
              Catatan
              <Textarea value={catatan} placeholder="Wajib diisi bila dikembalikan" onChange={e => setCatatan(e.target.value)} />
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button disabled={sibuk} onClick={() => void jalankan(butir.setujui)}>Setujui</Button>
              <Button variant="outline" disabled={sibuk || !bolehKembalikan} onClick={() => void jalankan(() => butir.kembalikan(catatan))}>Kembalikan</Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PratinjauButir({ jenis, slug, isi, saatTutup }: { jenis: JenisKonten; slug: string; isi: unknown; saatTutup: () => void }) {
  const hasil = bacaIsi(jenis, isi);
  if (!hasil.ok) return <p role="alert" className="text-sm text-destructive">isi revisi tidak sah: {hasil.galat}</p>;
  return <Pratinjau jenis={jenis} slug={slug} isi={hasil.isi} saatTutup={saatTutup} />;
}

const teksDiksi = (d: Pick<DiksiTerbit, 'id' | 'ar'>) => `id: ${d.id}\nar: ${d.ar ?? ''}`;

