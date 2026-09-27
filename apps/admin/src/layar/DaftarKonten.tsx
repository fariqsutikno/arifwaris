// Layar menu konten (spec tahap A "Daftar konten"): kepala (jejak grup, judul menu, tombol buat baru), tab jenis
// untuk menu bertab, lalu daftar entri dengan tab status + jumlah, cari (judul/slug/ref), dan baris berstatus.
// Menu materi mengelompokkan materi di bawah modulnya. Data dari repo.konten.daftarEntri; perhitungan di ringkas.ts.
import { useEffect, useState, type ReactNode } from 'react';
import { Pencil, Search } from 'lucide-react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LABEL_ISI, menuDari, type IsiMenu, type KunciMenu } from '../navigasi';
import {
  jumlahPerTab, judulEntri, kelompokkanPerModul, LABEL_TAB, saringDaftar, statusTampil, TAB_STATUS, waktuRelatif,
  type GrupModul, type TabStatus,
} from '../ringkas';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { ChipStatus, PesanGalat } from './Beranda';
import { EditorDiksi } from './EditorDiksi';

export function LayarMenu({ menu: kunci, tab }: { menu: KunciMenu; tab: IsiMenu }) {
  const { peran } = usePortal();
  const menu = menuDari(kunci)!;
  const bertab = menu.isi.length > 1 && kunci !== 'materi';
  const jenisBaru = kunci === 'materi' ? (['materi', 'modul'] as const) : tab === 'diksi' ? [] : [tab];
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
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanEntri[] | null>(null);
  const [modul, setModul] = useState<RingkasanEntri[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [tab, setTab] = useState<TabStatus>('semua');
  const [cari, setCari] = useState('');

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    Promise.all([repo.konten.daftarEntri(jenis), menuMateri ? repo.konten.daftarEntri('modul') : Promise.resolve([])])
      .then(([entri, daftarModul]) => { if (!dibatalkan) { setDaftar(entri); setModul(daftarModul); } })
      .catch(e => { if (!dibatalkan) setGalat(e instanceof Error ? e.message : String(e)); });
    return () => { dibatalkan = true; };
  }, [repo, jenis, menuMateri, muatUlang]);

  if (galat) return <PesanGalat pesan={galat} onCobaLagi={() => setMuatUlang(n => n + 1)} />;
  if (!daftar) return <div aria-busy="true" className="space-y-2"><Skeleton className="h-11" /><Skeleton className="h-11" /><Skeleton className="h-11" /></div>;

  const jumlah = jumlahPerTab(daftar);
  const tampil = saringDaftar(daftar, tab, cari);
  const sekarang = new Date();
  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={nilai => setTab(nilai as TabStatus)}>
        <TabsList aria-label="Status">
          {TAB_STATUS.map(t => <TabsTrigger key={t} value={t}>{LABEL_TAB[t]} {jumlah[t]}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input type="search" aria-label="Cari" className="pl-9" placeholder="Cari judul, slug, atau kode rujukan"
          value={cari} onChange={e => setCari(e.target.value)} />
      </label>
      {daftar.length === 0 && !menuMateri ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Belum ada {LABEL_ISI[jenis].toLowerCase()}. Buat entri pertama lewat tombol di atas.
        </p>
      ) : null}
      {daftar.length > 0 && tampil.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Tidak ada yang cocok.</p> : null}
      {menuMateri
        ? kelompokkanPerModul(tampil, modul).map(grup => <GrupMateri key={grup.nomor ?? 'tanpa'} grup={grup} sekarang={sekarang} />)
        : tampil.length > 0 ? (
          <Card role="region" aria-label={LABEL_ISI[jenis]} className="gap-0 divide-y py-0">
            {tampil.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}
          </Card>
        ) : null}
    </div>
  );
}

function GrupMateri({ grup, sekarang }: { grup: GrupModul; sekarang: Date }) {
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
      {grup.materi.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}
    </Card>
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
