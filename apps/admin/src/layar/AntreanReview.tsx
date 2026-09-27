// Antrean review: memuat revisi berstatus diajukan dari editorial (konten) & diksi, lalu menampilkan tiap butir
// dengan perbandingan per bidang terhadap versi terbitnya (konten: revisi terbit entri; diksi: teks terbit kunci;
// belum ada → semua isi tambah; pengajuan ke Sampah → cukup keterangan). Tombol Setujui/Kembalikan hanya tampil bila transisiRevisi mengizinkan (UI saja; database tetap
// penjaga); revisi milik sendiri berlabel "revisi Anda". Tiap butir berjudul jenis + judul entri, menyebut pembuat &
// waktu, dan menaut ke editor entrinya; terlama di atas. Galat repo ditampilkan (lewat pesanGalat) di butirnya.
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
import { bidangBanding, daftarPerubahan, type BidangBanding, type PerubahanBidang } from '../editor/banding';
import { useNamaTim } from '../hooks/useNamaTim';
import { LABEL_ISI } from '../navigasi';
import { pesanGalat } from '../pesanGalat';
import { usePortal } from '../repo';
import { judulEntri, waktuRelatif } from '../ringkas';
import { tulisRute } from '../rute';
import { Pratinjau } from './Pratinjau';
import { Perbandingan } from './Perbandingan';

interface Butir {
  id: string;
  jenis: string;
  judul: string;
  tautan: string;
  dibuatPada: string;
  status: StatusRevisi;
  dibuatOleh: string;
  hapus: boolean;
  /** null = pengajuan ke Sampah (tidak ada isi baru untuk dibandingkan). */
  perubahan: PerubahanBidang[] | null;
  baru: boolean;
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
          id: revisi.id, jenis: LABEL_ISI[e.jenis], judul: judulEntri(e, revisi.hapus ? e.revisiTerakhir?.isi : revisi.isi),
          tautan: tulisRute({ layar: 'entri', entriId: e.entriId }), dibuatPada: revisi.dibuatPada, status: revisi.status, dibuatOleh: revisi.dibuatOleh, hapus: revisi.hapus,
          perubahan: revisi.hapus ? null : daftarPerubahan(basis && bidangBanding(e.jenis, basis.isi, basis.refs), bidangBanding(e.jenis, revisi.isi, revisi.refs)),
          baru: basis === null,
          konten: revisi.hapus ? null : { jenis: e.jenis, slug: e.slug, isi: revisi.isi },
          setujui: () => repo.editorial.setujui(revisi.id),
          kembalikan: catatan => repo.editorial.kembalikan(revisi.id, catatan),
        };
      }));
      const butirDiksi = revisiDiksi.map((revisi): Butir => {
        const terbit = kunciDiksi.find(k => k.kunci === revisi.kunci)?.terbit ?? null;
        return {
          id: revisi.id, jenis: 'Diksi', judul: revisi.kunci, tautan: tulisRute({ layar: 'menu', menu: 'aplikasi', tab: 'diksi' }),
          dibuatPada: revisi.dibuatPada, status: revisi.status, dibuatOleh: revisi.dibuatOleh, hapus: false,
          perubahan: daftarPerubahan(terbit && bidangDiksi(terbit), bidangDiksi({ id: revisi.idTeks, ar: revisi.arTeks })), baru: !terbit,
          konten: null,
          setujui: () => repo.diksi.setujui(revisi.id),
          kembalikan: catatan => repo.diksi.kembalikan(revisi.id, catatan),
        };
      });
      if (!dibatalkan) setDaftar([...butirKonten, ...butirDiksi].sort((a, b) => a.dibuatPada.localeCompare(b.dibuatPada)));
    })().catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };

    async function basisTerbit(e: RingkasanEntri) {
      const revisi = await repo.konten.daftarRevisi(e.entriId);
      return revisi.find(r => r.id === e.revisiTerbitId) ?? revisi.filter(r => r.status === 'disetujui').at(-1) ?? null;
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
  const namaDari = useNamaTim();
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
            oleh {namaDari(butir.dibuatOleh)} ·{' '}
            <time dateTime={butir.dibuatPada} title={new Date(butir.dibuatPada).toLocaleString('id-ID')}>{waktuRelatif(butir.dibuatPada, new Date())}</time>
          </p>
        </div>
        {butir.hapus ? <Badge variant="destructive">pengajuan ke Sampah</Badge> : null}
        {butir.dibuatOleh === sesi.userId ? <Badge variant="secondary">revisi Anda</Badge> : null}
        <a className="text-sm text-primary underline-offset-4 hover:underline" href={butir.tautan}>Buka entri</a>
      </CardHeader>
      <CardContent className="space-y-3">
        {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
        {butir.hapus ? <p className="text-sm text-muted-foreground">Bila disetujui, entri pindah ke Sampah dan hilang dari web. Bisa dipulihkan kapan saja.</p> : null}
        {butir.perubahan ? <Perbandingan perubahan={butir.perubahan} keterangan={butir.baru ? 'Entri baru: semua isi ditambahkan.' : 'Dibandingkan dengan versi yang tayang.'} /> : null}
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

const bidangDiksi = (d: Pick<DiksiTerbit, 'id' | 'ar'>): BidangBanding[] => [
  { label: 'Bahasa Indonesia', arab: false, teks: d.id },
  { label: 'Bahasa Arab', arab: true, teks: d.ar ?? '' },
];
