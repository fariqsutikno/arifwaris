// Layar menu konten (spec tahap A "Daftar konten"): kepala (jejak grup, judul menu, tombol buat baru), tab jenis
// untuk menu bertab, lalu daftar entri dengan tab status + jumlah, cari (judul/slug/ref), dan baris berstatus.
// Menu materi mengelompokkan materi di bawah modulnya. Urutan diubah lewat mode "Atur urutan" (admin/penulis): seret &
// naik/turun hanya mengubah susunan lokal, lalu Simpan urutan mengirim satu kali. Data dari repo.konten.daftarEntri;
// perhitungan di ringkas.ts.
import { useEffect, useState, type ReactNode } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowUpDown, ChevronDown, ChevronUp, GripVertical, Pencil, Search } from 'lucide-react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LABEL_ISI, menuDari, type IsiMenu, type KunciMenu } from '../navigasi';
import {
  indeksSeret, jumlahPerTab, judulEntri, kelompokkanPerModul, LABEL_TAB, pindahkan, saringDaftar, statusTampil, TAB_STATUS, waktuRelatif,
  type GrupModul, type TabStatus,
} from '../ringkas';
import { usePortal } from '../repo';
import { lepasPenjaga, usePenjagaPerubahan } from '../penjaga';
import { tulisRute } from '../rute';
import { ChipStatus, PesanGalat } from './Beranda';
import { EditorDiksi } from './EditorDiksi';

export function LayarMenu({ menu: kunci, tab }: { menu: KunciMenu; tab: IsiMenu }) {
  const { peran } = usePortal();
  const menu = menuDari(kunci)!;
  const bertab = menu.isi.length > 1 && kunci !== 'materi';
  // Teks edukasi & diksi berkunci tetap dari kode aplikasi: hanya disunting, tidak dibuat dari portal.
  const jenisBaru = kunci === 'materi' ? (['materi', 'modul'] as const) : tab === 'diksi' || tab === 'teks_edukasi' ? [] : [tab];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{menu.grup} /</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{menu.label}</h1>
          {peran !== 'reviewer' ? (
            <div className="flex gap-2">
              {jenisBaru.map(jenis => (
                <Button key={jenis} size="sm" asChild><a href={tulisRute({ layar: 'entriBaru', jenis })}>+ {LABEL_ISI[jenis]} baru</a></Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {bertab ? (
        <nav aria-label="Jenis" className="flex gap-2">
          {menu.isi.map(isi => (
            <Button key={isi} size="sm" variant={isi === tab ? 'default' : 'outline'} asChild>
              <a href={tulisRute({ layar: 'menu', menu: kunci, tab: isi })} aria-current={isi === tab ? 'page' : undefined}>{LABEL_ISI[isi]}</a>
            </Button>
          ))}
        </nav>
      ) : null}
      {tab === 'diksi' ? <EditorDiksi /> : <DaftarKonten key={tab} jenis={tab} menuMateri={kunci === 'materi'} />}
    </div>
  );
}

export function DaftarKonten({ jenis, menuMateri = false }: { jenis: JenisKonten; menuMateri?: boolean }) {
  const { repo, peran } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanEntri[] | null>(null);
  const [modul, setModul] = useState<RingkasanEntri[]>([]);
  const [isiModulTerbit, setIsiModulTerbit] = useState<ReadonlyMap<string, unknown>>(new Map());
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [tab, setTab] = useState<TabStatus>('semua');
  const [cari, setCari] = useState('');
  // Mode atur urutan: urutanDraf = susunan lokal yang belum dikirim; null = mode mati. Semua seret/naik/turun hanya
  // mengubah susunan lokal; "Simpan urutan" mengirim satu kali (atur_urutan langsung terbit = satu versi konten).
  const [urutanDraf, setUrutanDraf] = useState<RingkasanEntri[] | null>(null);
  const [menyimpanUrutan, setMenyimpanUrutan] = useState(false);
  const [galatUrutan, setGalatUrutan] = useState<string | null>(null);
  const modeUrutan = urutanDraf !== null;
  const urutanBerubah = !!urutanDraf && !!daftar && urutanDraf.some((entri, i) => entri.entriId !== daftar[i]?.entriId);
  usePenjagaPerubahan(urutanBerubah);

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    Promise.all([
      repo.konten.daftarEntri(jenis),
      menuMateri ? repo.konten.daftarEntri('modul') : Promise.resolve([]),
      menuMateri ? repo.konten.bacaTerbit({ jenis: 'modul' }) : Promise.resolve([]),
    ])
      .then(([entri, daftarModul, modulTerbit]) => {
        if (dibatalkan) return;
        setDaftar(entri);
        setModul(daftarModul);
        setIsiModulTerbit(new Map(modulTerbit.map(baris => [baris.entriId, baris.isi])));
      })
      .catch(e => { if (!dibatalkan) setGalat(e instanceof Error ? e.message : String(e)); });
    return () => { dibatalkan = true; };
  }, [repo, jenis, menuMateri, muatUlang]);

  function mulaiAturUrutan() {
    if (!daftar) return;
    setTab('semua');
    setCari('');
    setGalatUrutan(null);
    setUrutanDraf(daftar);
  }

  /** Ganti isi satu kelompok (satu modul, atau seluruh daftar) di susunan lokal dengan urutan barunya. */
  function pindahLokal(kelompokLama: RingkasanEntri[], kelompokBaru: RingkasanEntri[]) {
    setUrutanDraf(sekarang => {
      if (!sekarang) return sekarang;
      const anggota = new Set(kelompokLama.map(entri => entri.entriId));
      const sisaBaru = [...kelompokBaru];
      return sekarang.map(entri => (anggota.has(entri.entriId) ? sisaBaru.shift()! : entri));
    });
  }

  // Materi dikirim utuh rata per modul supaya urutan global web (pelajaran berikutnya) tetap mengikuti urutan modul.
  async function simpanUrutan() {
    if (!urutanDraf) return;
    const urutanKirim = menuMateri ? kelompokkanPerModul(urutanDraf, modul, isiModulTerbit).flatMap(grup => grup.materi) : urutanDraf;
    setMenyimpanUrutan(true);
    setGalatUrutan(null);
    try {
      await repo.editorial.aturUrutan(urutanKirim.map(entri => entri.entriId));
      lepasPenjaga();
      setUrutanDraf(null);
      setMuatUlang(n => n + 1);
    } catch (e) {
      setGalatUrutan(`Urutan gagal disimpan: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMenyimpanUrutan(false);
    }
  }

  function batalAturUrutan() {
    if (urutanBerubah && !window.confirm('Buang perubahan urutan?')) return;
    setUrutanDraf(null);
    setGalatUrutan(null);
  }

  if (galat) return <PesanGalat pesan={galat} onCobaLagi={() => setMuatUlang(n => n + 1)} />;
  if (!daftar) return <div aria-busy="true" className="space-y-2"><Skeleton className="h-11" /><Skeleton className="h-11" /><Skeleton className="h-11" /></div>;

  const jumlah = jumlahPerTab(daftar);
  const tampil = urutanDraf ?? saringDaftar(daftar, tab, cari);
  const sekarang = new Date();
  const bolehAturUrutan = peran !== 'reviewer' && daftar.length > 1;
  return (
    <div className="space-y-3">
      {modeUrutan ? (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/95 px-4 py-2 backdrop-blur">
          <p className="min-w-0 flex-1 text-sm">
            <b>Atur urutan.</b> Seret baris atau pakai tombol naik/turun. Urutan baru langsung tampil di web setelah disimpan.
          </p>
          <Button size="sm" disabled={!urutanBerubah || menyimpanUrutan} onClick={() => void simpanUrutan()}>
            {menyimpanUrutan ? 'Menyimpan…' : 'Simpan urutan'}
          </Button>
          <Button size="sm" variant="ghost" disabled={menyimpanUrutan} onClick={batalAturUrutan}>Batal</Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={tab} onValueChange={nilai => setTab(nilai as TabStatus)} className="min-w-0 overflow-x-auto">
              <TabsList aria-label="Status">
                {TAB_STATUS.map(t => <TabsTrigger key={t} value={t}>{LABEL_TAB[t]} {jumlah[t]}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            {bolehAturUrutan ? (
              <Button size="sm" variant="outline" className="ml-auto" onClick={mulaiAturUrutan}><ArrowUpDown />Atur urutan</Button>
            ) : null}
          </div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" aria-label="Cari" className="pl-9" placeholder="Cari judul, slug, atau kode rujukan"
              value={cari} onChange={e => setCari(e.target.value)} />
          </label>
        </>
      )}
      {daftar.length === 0 && !menuMateri ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Belum ada {LABEL_ISI[jenis].toLowerCase()}. Buat entri pertama lewat tombol di atas.
        </p>
      ) : null}
      {daftar.length > 0 && tampil.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Tidak ada yang cocok.</p> : null}
      {galatUrutan ? <Alert variant="destructive" role="alert"><AlertDescription>{galatUrutan}</AlertDescription></Alert> : null}
      {menuMateri
        ? kelompokkanPerModul(tampil, modul, isiModulTerbit).map(grup => (
          <GrupMateri key={grup.nomor ?? 'tanpa'} grup={grup} sekarang={sekarang} bolehSeret={modeUrutan} saatPindah={pindahLokal} />
        ))
        : tampil.length > 0 ? (
          <Card role="region" aria-label={LABEL_ISI[jenis]} className="gap-0 divide-y py-0">
            <KelompokSeret daftar={tampil} sekarang={sekarang} bolehSeret={modeUrutan} saatPindah={pindahLokal} />
          </Card>
        ) : null}
    </div>
  );
}

function GrupMateri({ grup, sekarang, bolehSeret, saatPindah }: {
  grup: GrupModul; sekarang: Date; bolehSeret: boolean; saatPindah: SaatPindah;
}) {
  const label = grup.nomor === null ? grup.judul : `Modul ${grup.nomor}: ${grup.judul}`;
  return (
    <Card role="region" aria-label={label} className="gap-0 divide-y py-0">
      <div className="flex items-center gap-3 bg-muted px-4 py-2">
        <Badge variant="outline">{grup.nomor ?? '–'}</Badge>
        <b>{grup.judul}</b>
        <span className="text-sm text-muted-foreground">{grup.materi.length} materi</span>
        {grup.modul ? (
          <Button variant="ghost" size="icon" className="ml-auto" asChild>
            <a href={tulisRute({ layar: 'entri', entriId: grup.modul.entriId })} aria-label={`Edit modul ${grup.judul}`}><Pencil /></a>
          </Button>
        ) : null}
      </div>
      {grup.materi.length === 0 ? <p className="px-4 py-2 text-sm text-muted-foreground">Belum ada materi.</p> : null}
      <KelompokSeret daftar={grup.materi} sekarang={sekarang} bolehSeret={bolehSeret} saatPindah={saatPindah} />
    </Card>
  );
}

type SaatPindah = (kelompokLama: RingkasanEntri[], kelompokBaru: RingkasanEntri[]) => void;

/** Satu kelompok yang bisa diurutkan: seret @dnd-kit (pointer, sentuh, keyboard lewat pegangan) atau tombol naik/turun. */
function KelompokSeret({ daftar, sekarang, bolehSeret, saatPindah }: {
  daftar: RingkasanEntri[]; sekarang: Date; bolehSeret: boolean; saatPindah: SaatPindah;
}) {
  const sensor = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = daftar.map(entri => entri.entriId);
  const pindah = (dari: number, ke: number) => { if (dari !== ke) saatPindah(daftar, pindahkan(daftar, dari, ke)); };
  if (!bolehSeret) return <>{daftar.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}</>;
  const saatLepas = ({ active, over }: DragEndEvent) => {
    const indeks = indeksSeret(ids, String(active.id), over ? String(over.id) : null);
    if (indeks) pindah(...indeks);
  };
  return (
    <DndContext sensors={sensor} collisionDetection={closestCenter} onDragEnd={saatLepas}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {daftar.map((entri, indeks) => (
          <BarisSeret key={entri.entriId} entri={entri} sekarang={sekarang}
            naik={indeks > 0 ? () => pindah(indeks, indeks - 1) : undefined}
            turun={indeks < daftar.length - 1 ? () => pindah(indeks, indeks + 1) : undefined} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function BarisSeret({ entri, sekarang, naik, turun }: { entri: RingkasanEntri; sekarang: Date; naik: (() => void) | undefined; turun: (() => void) | undefined }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: entri.entriId });
  const judul = judulEntri(entri);
  const pegangan = (
    <span className="flex items-center text-muted-foreground">
      <button type="button" ref={setActivatorNodeRef} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'cursor-grab touch-none')}
        {...attributes} {...listeners} aria-label={`Seret ${judul}`}>
        <GripVertical />
      </button>
      <Button variant="ghost" size="icon" aria-label={`Naikkan ${judul}`} disabled={!naik} onClick={naik}><ChevronUp /></Button>
      <Button variant="ghost" size="icon" aria-label={`Turunkan ${judul}`} disabled={!turun} onClick={turun}><ChevronDown /></Button>
    </span>
  );
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'opacity-50' : undefined}>
      <BarisEntri entri={entri} sekarang={sekarang} pegangan={pegangan} />
    </div>
  );
}

export function BarisEntri({ entri, sekarang, pegangan }: { entri: RingkasanEntri; sekarang: Date; pegangan?: ReactNode }) {
  const catatan = entri.revisiTerakhir?.status === 'dikembalikan' ? entri.revisiTerakhir.catatanReview : null;
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-2">
      {pegangan}
      <span className="min-w-0 flex-1">
        <a className="font-semibold hover:underline" href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judulEntri(entri)}</a>
        {catatan ? <span className="block text-sm text-muted-foreground">Catatan: {catatan}</span> : null}
      </span>
      <ChipStatus status={statusTampil(entri)} />
      <span className="hidden gap-1 md:flex">
        {(entri.revisiTerakhir?.refs ?? []).map(kode => <Badge key={kode} variant="secondary" className="font-mono">{kode}</Badge>)}
      </span>
      <span className="hidden text-sm text-muted-foreground md:inline">
        {entri.revisiTerakhir ? waktuRelatif(entri.revisiTerakhir.dibuatPada, sekarang) : ''}
      </span>
    </div>
  );
}
