// Layar menu konten (spec tahap A "Daftar konten"): kepala (jejak grup, judul menu, tombol buat baru), tab jenis
// untuk menu bertab, lalu daftar entri dengan tab status + jumlah, cari (judul/slug/ref), urut, saring lanjutan
// (tombol Saring: milik saya, bab/tingkat/kelompok, perlu dicek; chip saring aktif), dan baris berstatus + info ringkas. Saring & urut tersimpan di URL
// (replaceState, tanpa memicu pindah rute). "Pilih beberapa" menyalakan centang baris + bilah aksi massal lengkap per
// peran (Terbitkan, Kirim untuk review, Setujui, Kembalikan, Sampah, Pulihkan), tiap tombol menyebut berapa yang bisa
// dan alasan sisanya (aksiDaftar.ts). Tiap baris punya menu ⋯ berisi aksi yang berlaku untuk entri itu; database tetap penjaga. Menu materi mengelompokkan materi di bawah modulnya, FAQ per kelompok (urutan diatur di dalam kelompok). Urutan diubah lewat mode
// "Atur urutan" (admin/penulis): seret & naik/turun hanya mengubah susunan lokal, lalu Simpan urutan mengirim satu
// kali. Data dari repo.konten.daftarEntri; perhitungan di ringkas.ts.
import { useEffect, useState, type ReactNode } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Ellipsis, GripVertical, ListFilter, Plus, Search, X } from 'lucide-react';
import { JUDUL_BAB, type JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LABEL_ISI, menuDari, type IsiMenu, type KunciMenu } from '../navigasi';
import {
  bacaSaring, saringTanpaStatus, diSampah, indeksSeret, jumlahPerTab, judulEntri, kelompokkanPerModul, LABEL_TAB, LABEL_URUTAN, nilaiBerbeda,
  nilaiIsi, pindahkan, SARING_AWAL, statusTampil, TAB_STATUS, tanggalLengkap, terapkanSaring, tulisSaring, waktuRelatif,
  type BidangSaring, type GrupModul, type SaringDaftar, type UrutanDaftar,
} from '../ringkas';
import { usePortal } from '../repo';
import { teksRujukan } from '../editor/rujukan';
import { aksiPeran, alasanTolak, HASIL_AKSI, LABEL_AKSI, ringkasAlasan, type AksiDaftar } from '../editor/aksiDaftar';
import { lepasPenjaga, usePenjagaPerubahan } from '../penjaga';
import { useNamaTim } from '../hooks/useNamaTim';
import { tulisRute, type Kueri } from '../rute';
import { ChipStatus, PesanGalat } from './Beranda';
import { EditorTeksAplikasi } from './EditorTeksAplikasi';
import { pesanGalat } from '../pesanGalat';

// Bidang isi yang bisa disaring per jenis; sisanya hanya status/cari/milik saya.
const BIDANG_SARING_JENIS: Partial<Record<JenisKonten, BidangSaring[]>> = {
  soal_kuis: ['bab'], soal_hitung: ['bab', 'tingkat'], faq: ['kelompok'],
};
const LABEL_BIDANG_SARING: Record<BidangSaring, string> = { bab: 'Bab', tingkat: 'Tingkat', kelompok: 'Kelompok' };
const KETERANGAN_TERBIT_DRAF = 'Entri terbit yang punya draf baru dihitung di Draf dan di Terbit.';

export function LayarMenu({ menu: kunci, tab, kueri }: { menu: KunciMenu; tab: IsiMenu; kueri?: Kueri | undefined }) {
  const { peran } = usePortal();
  const menu = menuDari(kunci)!;
  const bertab = menu.isi.length > 1 && kunci !== 'materi';
  // Teks edukasi & diksi berkunci tetap dari kode aplikasi: hanya disunting, tidak dibuat dari portal.
  const jenisBaru = kunci === 'materi' ? (['materi', 'modul'] as const) : tab === 'layar' || tab === 'teks_edukasi' ? [] : [tab];
  // Saring ditulis ke URL tanpa hashchange: tautan bisa dibagikan & kembali dari editor memulihkan saring.
  const simpanSaringKeUrl = (saring: SaringDaftar) =>
    history.replaceState(null, '', tulisRute({ layar: 'menu', menu: kunci, tab, kueri: tulisSaring(saring) }));
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
        <nav aria-label="Jenis" className="inline-flex gap-1 rounded-lg border p-1">
          {menu.isi.map(isi => (
            <a key={isi} href={tulisRute({ layar: 'menu', menu: kunci, tab: isi })} aria-current={isi === tab ? 'page' : undefined}
              className={cn(buttonVariants({ size: 'sm', variant: isi === tab ? 'secondary' : 'ghost' }), isi === tab && 'font-semibold')}>
              {LABEL_ISI[isi]}
            </a>
          ))}
        </nav>
      ) : null}
      {kunci === 'aplikasi' ? (
        <p className="text-sm text-muted-foreground">
          Teks aplikasi = kata-kata di tombol, judul, petunjuk, dan penjelasan di aplikasi. Untuk istilah fikih beserta maknanya, buka Glosarium.
        </p>
      ) : null}
      {tab === 'layar' ? <EditorTeksAplikasi />
        : <DaftarKonten key={tab} jenis={tab} menuMateri={kunci === 'materi'} saringAwal={bacaSaring(kueri)} saatSaring={simpanSaringKeUrl} />}
    </div>
  );
}


export function DaftarKonten({ jenis, menuMateri = false, saringAwal = SARING_AWAL, saatSaring }: {
  jenis: JenisKonten; menuMateri?: boolean; saringAwal?: SaringDaftar; saatSaring?: (saring: SaringDaftar) => void;
}) {
  const { repo, peran, sesi } = usePortal();
  const namaPengguna = useNamaTim();
  const [daftar, setDaftar] = useState<RingkasanEntri[] | null>(null);
  const [modul, setModul] = useState<RingkasanEntri[]>([]);
  const [isiModulTerbit, setIsiModulTerbit] = useState<ReadonlyMap<string, unknown>>(new Map());
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [saring, setSaring] = useState<SaringDaftar>(saringAwal);
  // Mode pilih (kotak centang + aksi massal) hanya menyala lewat "Pilih beberapa", supaya daftar biasa tetap tenang.
  const [modePilih, setModePilih] = useState(false);
  const [terpilih, setTerpilih] = useState<ReadonlySet<string>>(new Set());
  const [sibukMassal, setSibukMassal] = useState<AksiDaftar | null>(null);
  const [hasilMassal, setHasilMassal] = useState<{ jenis: 'sukses' | 'galat'; teks: string } | null>(null);
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
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, jenis, menuMateri, muatUlang]);

  function ubahSaring(perubahan: Partial<SaringDaftar>) {
    const baru = { ...saring, ...perubahan };
    setSaring(baru);
    saatSaring?.(baru);
  }

  function mulaiAturUrutan() {
    if (!daftar) return;
    ubahSaring(SARING_AWAL);
    setTerpilih(new Set());
    setModePilih(false);
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
      setGalatUrutan(`Urutan gagal disimpan: ${pesanGalat(e)}`);
    } finally {
      setMenyimpanUrutan(false);
    }
  }

  function batalAturUrutan() {
    if (urutanBerubah && !window.confirm('Buang perubahan urutan?')) return;
    setUrutanDraf(null);
    setGalatUrutan(null);
  }

  const pelaku = { peran, userId: sesi.userId };
  const bolehAksi = (entri: RingkasanEntri, aksi: AksiDaftar) => alasanTolak(aksi, entri, pelaku) === null;

  function jalankanPada(aksi: AksiDaftar, entri: RingkasanEntri, catatan: string): Promise<unknown> {
    const revisiId = entri.revisiTerakhir?.id ?? '';
    switch (aksi) {
      case 'terbitkan': return repo.editorial.terbitkanLangsung(revisiId);
      case 'ajukan': return repo.editorial.ajukan(revisiId);
      case 'setujui': return repo.editorial.setujui(revisiId);
      case 'kembalikan': return repo.editorial.kembalikan(revisiId, catatan);
      case 'sampah': return repo.editorial.buangEntri(entri.entriId, catatan);
      case 'pulihkan': return repo.editorial.pulihkanEntri(entri.entriId);
    }
  }

  /** Konfirmasi / catatan sebelum aksi; null = dibatalkan pengguna. Kembalikan wajib bercatatan (satu untuk semua). */
  function mintaCatatan(aksi: AksiDaftar, jumlah: number): string | null {
    const sasaran = jumlah === 1 ? 'entri ini' : `${jumlah} entri`;
    if (aksi === 'terbitkan' || aksi === 'setujui') return window.confirm(`${LABEL_AKSI[aksi]} ${sasaran}? Langsung tampil di web.`) ? '' : null;
    if (aksi === 'sampah') return window.prompt(`Pindahkan ${sasaran} ke Sampah? Bisa dipulihkan kapan saja. Entri yang sudah terbit diajukan dulu bila Anda penulis.\nAlasan (opsional):`, '');
    if (aksi === 'kembalikan') {
      const catatan = window.prompt(`Kembalikan ${sasaran} ke penulisnya. Catatan untuk penulis (wajib):`, '');
      return catatan?.trim() ? catatan : null;
    }
    return '';
  }

  // Dijalankan berurutan supaya satu kegagalan tidak membatalkan yang lain; hasilnya diringkas dalam satu pesan.
  async function jalankanMassal(aksi: AksiDaftar, sasaran: RingkasanEntri[]) {
    const catatan = mintaCatatan(aksi, sasaran.length);
    if (catatan === null) return;
    setSibukMassal(aksi);
    setHasilMassal(null);
    const gagal: string[] = [];
    for (const entri of sasaran) {
      try {
        await jalankanPada(aksi, entri, catatan);
      } catch (e) {
        gagal.push(`${judulEntri(entri)}: ${pesanGalat(e)}`);
      }
    }
    const berhasil = sasaran.length - gagal.length;
    setHasilMassal(gagal.length
      ? { jenis: 'galat', teks: `${berhasil} ${HASIL_AKSI[aksi]}, ${gagal.length} gagal. ${gagal.join(' · ')}` }
      : { jenis: 'sukses', teks: `${berhasil} entri ${HASIL_AKSI[aksi]}.` });
    setTerpilih(new Set());
    setSibukMassal(null);
    setMuatUlang(n => n + 1);
  }

  if (galat) return <PesanGalat pesan={galat} onCobaLagi={() => setMuatUlang(n => n + 1)} />;
  if (!daftar) return <div aria-busy="true" className="space-y-2"><Skeleton className="h-11" /><Skeleton className="h-11" /><Skeleton className="h-11" /></div>;

  // Angka tab mengikuti cari & saring lanjutan yang aktif, supaya sama dengan jumlah baris yang akan tampil.
  const jumlah = jumlahPerTab(saringTanpaStatus(daftar, saring, sesi.userId));
  const tampil = urutanDraf ?? terapkanSaring(daftar, saring, sesi.userId);
  const bolehAturUrutan = peran !== 'reviewer' && saring.status !== 'sampah' && daftar.length > 1;
  const bolehPilih = tampil.length > 0;
  const tabSampah = saring.status === 'sampah';
  const aksiTersedia = aksiPeran(peran, tabSampah);
  const dipilih = daftar.filter(entri => terpilih.has(entri.entriId));
  const semuaTampilDipilih = tampil.length > 0 && tampil.every(entri => terpilih.has(entri.entriId));
  const baris: KonteksBaris = {
    sekarang: new Date(),
    namaPengguna,
    aksi: modeUrutan ? undefined : entri => (
      <MenuBaris entri={entri} aksi={aksiTersedia.filter(aksi => bolehAksi(entri, aksi))} bacaSaja={peran === 'reviewer'}
        saatAksi={aksi => void jalankanMassal(aksi, [entri])} />
    ),
    pilih: !modePilih || modeUrutan ? null : {
      terpilih,
      saatUbah: (entriId, pilih) => setTerpilih(sekarang => {
        const baru = new Set(sekarang);
        if (pilih) baru.add(entriId); else baru.delete(entriId);
        return baru;
      }),
    },
  };

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
            <Tabs value={saring.status} onValueChange={nilai => ubahSaring({ status: nilai as SaringDaftar['status'] })} className="min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
              <TabsList aria-label="Status">
                {TAB_STATUS.map(t => (
                  <TabsTrigger key={t} value={t} title={t === 'draf' || t === 'terbit' ? KETERANGAN_TERBIT_DRAF : undefined}>
                    {LABEL_TAB[t]} {jumlah[t]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <BilahSaring jenis={jenis} menuMateri={menuMateri} daftar={daftar} saring={saring} ubah={ubahSaring} />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-sm text-muted-foreground">
            {modePilih && tampil.length > 0 ? (
              <Label className="gap-2 font-normal">
                <input type="checkbox" className="size-4 accent-primary" checked={semuaTampilDipilih}
                  onChange={e => setTerpilih(e.target.checked ? new Set(tampil.map(entri => entri.entriId)) : new Set())} />
                Pilih semua yang tampil ({tampil.length})
              </Label>
            ) : <span>{tampil.length} entri</span>}
            <span className="flex gap-4">
              {bolehPilih ? (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setModePilih(!modePilih); setTerpilih(new Set()); }}>
                  {modePilih ? 'Selesai memilih' : 'Pilih beberapa'}
                </Button>
              ) : null}
              {bolehAturUrutan ? <Button variant="link" size="sm" className="h-auto p-0" onClick={mulaiAturUrutan}>Atur urutan</Button> : null}
            </span>
          </div>
          {modePilih ? (
            <div className="sticky top-0 z-10 grid gap-2 rounded-lg border bg-muted/95 px-4 py-2 backdrop-blur" role="toolbar" aria-label="Aksi massal">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-sm">{dipilih.length ? `${dipilih.length} dipilih` : 'Centang entri yang ingin diproses'}</b>
                {dipilih.length ? <Button size="sm" variant="ghost" disabled={!!sibukMassal} onClick={() => setTerpilih(new Set())}>Batal pilih</Button> : null}
              </div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {aksiTersedia.map(aksi => {
                  const bisa = dipilih.filter(entri => bolehAksi(entri, aksi));
                  const alasan = dipilih.length ? ringkasAlasan(aksi, dipilih, pelaku) : null;
                  return (
                    <li key={aksi} className="grid justify-items-start gap-0.5">
                      <Button size="sm" variant={aksi === 'sampah' ? 'ghost' : 'secondary'} className={aksi === 'sampah' ? 'text-destructive' : undefined}
                        disabled={!!sibukMassal || bisa.length === 0} onClick={() => void jalankanMassal(aksi, bisa)}>
                        {sibukMassal === aksi ? 'Memproses…' : `${LABEL_AKSI[aksi]} (${bisa.length})`}
                      </Button>
                      {alasan ? <span className="text-xs text-muted-foreground">{alasan}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </>
      )}
      {hasilMassal ? (
        <Alert variant={hasilMassal.jenis === 'galat' ? 'destructive' : 'default'} role={hasilMassal.jenis === 'galat' ? 'alert' : 'status'}>
          <AlertDescription>{hasilMassal.teks}</AlertDescription>
        </Alert>
      ) : null}
      {daftar.length === 0 && !menuMateri ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Belum ada {LABEL_ISI[jenis].toLowerCase()}. Buat entri pertama lewat tombol di atas.
        </p>
      ) : null}
      {daftar.length > 0 && tampil.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Tidak ada yang cocok.{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => ubahSaring(SARING_AWAL)}>Hapus semua saring</Button>
        </p>
      ) : null}
      {galatUrutan ? <Alert variant="destructive" role="alert"><AlertDescription>{galatUrutan}</AlertDescription></Alert> : null}
      {menuMateri
        ? kelompokkanPerModul(tampil, modul.filter(entri => !diSampah(entri)), isiModulTerbit).map(grup => (
          <GrupMateri key={grup.nomor ?? 'tanpa'} grup={grup} baris={baris} bolehSeret={modeUrutan} saatPindah={pindahLokal}
            bolehBuat={peran !== 'reviewer' && !modeUrutan} />
        ))
        : jenis === 'faq' && tampil.length > 0 ? (
          kelompokkanPerKelompok(tampil).map(([kelompok, anggota]) => (
            <Card key={kelompok} role="region" aria-label={`Kelompok ${kelompok}`} className="gap-0 divide-y py-0">
              <div className="flex items-center gap-3 bg-muted px-4 py-2">
                <b>{kelompok}</b><span className="text-sm text-muted-foreground">{anggota.length} pertanyaan</span>
              </div>
              <KelompokSeret daftar={anggota} baris={baris} bolehSeret={modeUrutan} saatPindah={pindahLokal} />
            </Card>
          ))
        ) : tampil.length > 0 ? (
          <Card role="region" aria-label={LABEL_ISI[jenis]} className="gap-0 divide-y py-0">
            <KelompokSeret daftar={tampil} baris={baris} bolehSeret={modeUrutan} saatPindah={pindahLokal} />
          </Card>
        ) : null}
    </div>
  );
}

/** FAQ per kelompok, urutan kelompok = kemunculan pertama (sama dengan halaman FAQ web). */
function kelompokkanPerKelompok(daftar: RingkasanEntri[]): [string, RingkasanEntri[]][] {
  const grup = new Map<string, RingkasanEntri[]>();
  for (const entri of daftar) {
    const kelompok = nilaiIsi(entri, 'kelompok') || 'Tanpa kelompok';
    grup.set(kelompok, [...(grup.get(kelompok) ?? []), entri]);
  }
  return [...grup];
}

/** Satu bilah: cari, tombol Saring (popover berisi milik saya, bidang per jenis, perlu dicek), dan urutan; saring aktif
 * tampil sebagai chip yang bisa dihapus satu per satu. */
function BilahSaring({ jenis, menuMateri, daftar, saring, ubah }: {
  jenis: JenisKonten; menuMateri: boolean; daftar: RingkasanEntri[]; saring: SaringDaftar; ubah: (perubahan: Partial<SaringDaftar>) => void;
}) {
  const ubahBidang = (kunci: BidangSaring, nilai: string | undefined) => ubah({ bidang: { ...saring.bidang, [kunci]: nilai || undefined } });
  const labelNilai = (kunci: BidangSaring, nilai: string) => (kunci === 'bab' ? `Bab ${nilai}${JUDUL_BAB[Number(nilai)] ? ` · ${JUDUL_BAB[Number(nilai)]}` : ''}` : nilai);
  const chip: { label: string; hapus: () => void }[] = [
    ...(saring.milikSaya ? [{ label: 'Milik saya', hapus: () => ubah({ milikSaya: false }) }] : []),
    ...(saring.perluCek ? [{ label: 'Perlu dicek', hapus: () => ubah({ perluCek: false }) }] : []),
    ...(Object.entries(saring.bidang) as [BidangSaring, string | undefined][]).flatMap(([kunci, nilai]) =>
      nilai ? [{ label: `${LABEL_BIDANG_SARING[kunci]}: ${labelNilai(kunci, nilai)}`, hapus: () => ubahBidang(kunci, undefined) }] : []),
  ];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" aria-label="Cari" className="pl-9" placeholder="Cari judul atau alamat"
            value={saring.cari} onChange={e => ubah({ cari: e.target.value })} />
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline"><ListFilter />Saring{chip.length ? <Badge className="ml-0.5 h-4 px-1.5">{chip.length}</Badge> : null}</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Saring" className="grid gap-3 text-sm">
            <Label className="gap-2 font-normal">
              <input type="checkbox" className="size-4 accent-primary" checked={saring.milikSaya} onChange={e => ubah({ milikSaya: e.target.checked })} />
              Hanya milik saya
            </Label>
            {menuMateri ? (
              <Label className="gap-2 font-normal">
                <input type="checkbox" className="size-4 accent-primary" checked={saring.perluCek} onChange={e => ubah({ perluCek: e.target.checked })} />
                Perlu dicek tim keilmuan
              </Label>
            ) : null}
            {(BIDANG_SARING_JENIS[jenis] ?? []).map(kunci => (
              <Label key={kunci} className="grid gap-1.5 font-normal">
                {LABEL_BIDANG_SARING[kunci]}
                <NativeSelect className="w-full" value={saring.bidang[kunci] ?? ''} onChange={e => ubahBidang(kunci, e.target.value)}>
                  <NativeSelectOption value="">Semua</NativeSelectOption>
                  {nilaiBerbeda(daftar, kunci).map(nilai => <NativeSelectOption key={nilai} value={nilai}>{labelNilai(kunci, nilai)}</NativeSelectOption>)}
                </NativeSelect>
              </Label>
            ))}
          </PopoverContent>
        </Popover>
        <NativeSelect aria-label="Urutkan" value={saring.urut} onChange={e => ubah({ urut: e.target.value as UrutanDaftar })}>
          {(Object.keys(LABEL_URUTAN) as UrutanDaftar[]).map(u => <NativeSelectOption key={u} value={u}>{LABEL_URUTAN[u]}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      {chip.length ? (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          {chip.map(({ label, hapus }) => (
            <Badge key={label} variant="secondary" className="gap-1">
              {label}
              <button type="button" className="rounded-sm hover:text-destructive" aria-label={`Hapus saring ${label}`} onClick={hapus}><X className="size-3" /></button>
            </Badge>
          ))}
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => ubah({ milikSaya: false, perluCek: false, bidang: {} })}>Hapus semua saring</Button>
        </div>
      ) : null}
    </div>
  );
}

/** Menu ⋯ satu baris: buka/sunting entri, lalu aksi yang berlaku untuk entri ini saja. */
function MenuBaris({ entri, aksi, bacaSaja, saatAksi }: {
  entri: RingkasanEntri; aksi: AksiDaftar[]; bacaSaja: boolean; saatAksi: (aksi: AksiDaftar) => void;
}) {
  const [buka, setBuka] = useState(false);
  const judul = judulEntri(entri);
  const pilih = (a: AksiDaftar) => { setBuka(false); saatAksi(a); };
  return (
    <Popover open={buka} onOpenChange={setBuka}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${judul}`}><Ellipsis /></Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="grid w-56 gap-0.5 p-1 text-sm">
        <a className="rounded-sm px-2 py-1.5 hover:bg-muted" href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{bacaSaja ? 'Buka' : 'Sunting'}</a>
        {aksi.map(a => (
          <button key={a} type="button" className={cn('rounded-sm px-2 py-1.5 text-left hover:bg-muted', a === 'sampah' && 'text-destructive')}
            onClick={() => pilih(a)}>{LABEL_AKSI[a]}</button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Data yang sama untuk semua baris: waktu acuan, nama pembuat, dan pilihan (null = mode atur urutan). */
interface KonteksBaris {
  sekarang: Date;
  namaPengguna: (userId: string) => string;
  pilih: { terpilih: ReadonlySet<string>; saatUbah: (entriId: string, pilih: boolean) => void } | null;
  /** Menu aksi per baris; tidak ada selama mode atur urutan. */
  aksi?: ((entri: RingkasanEntri) => ReactNode) | undefined;
}

function GrupMateri({ grup, baris, bolehSeret, saatPindah, bolehBuat }: {
  grup: GrupModul; baris: KonteksBaris; bolehSeret: boolean; saatPindah: SaatPindah; bolehBuat: boolean;
}) {
  const label = grup.nomor === null ? grup.judul : `Modul ${grup.nomor}: ${grup.judul}`;
  return (
    <Card role="region" aria-label={label} className="gap-0 divide-y py-0">
      <div className="flex items-center gap-3 bg-muted px-4 py-2">
        <Badge variant="outline">{grup.nomor ?? '–'}</Badge>
        {grup.modul ? (
          <a className="font-semibold hover:underline" href={tulisRute({ layar: 'entri', entriId: grup.modul.entriId })} aria-label={`Edit modul ${grup.judul}`}>{grup.judul}</a>
        ) : <b>{grup.judul}</b>}
        <span className="text-sm text-muted-foreground">{grup.materi.length} materi</span>
        <span className="ml-auto flex gap-1">
          {bolehBuat && grup.nomor !== null ? (
            <Button variant="ghost" size="sm" asChild>
              <a href={tulisRute({ layar: 'entriBaru', jenis: 'materi', kueri: { modul: String(grup.nomor) } })}><Plus />Materi di modul ini</a>
            </Button>
          ) : null}
          {grup.modul ? baris.aksi?.(grup.modul) : null}
        </span>
      </div>
      {grup.materi.length === 0 ? <p className="px-4 py-2 text-sm text-muted-foreground">Belum ada materi.</p> : null}
      <KelompokSeret daftar={grup.materi} baris={baris} bolehSeret={bolehSeret} saatPindah={saatPindah} />
    </Card>
  );
}

type SaatPindah = (kelompokLama: RingkasanEntri[], kelompokBaru: RingkasanEntri[]) => void;

/** Satu kelompok yang bisa diurutkan: seret @dnd-kit (pointer, sentuh, keyboard lewat pegangan) atau tombol naik/turun. */
function KelompokSeret({ daftar, baris, bolehSeret, saatPindah }: {
  daftar: RingkasanEntri[]; baris: KonteksBaris; bolehSeret: boolean; saatPindah: SaatPindah;
}) {
  const sensor = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = daftar.map(entri => entri.entriId);
  const pindah = (dari: number, ke: number) => { if (dari !== ke) saatPindah(daftar, pindahkan(daftar, dari, ke)); };
  if (!bolehSeret) return <>{daftar.map(entri => <BarisEntri key={entri.entriId} entri={entri} baris={baris} />)}</>;
  const saatLepas = ({ active, over }: DragEndEvent) => {
    const indeks = indeksSeret(ids, String(active.id), over ? String(over.id) : null);
    if (indeks) pindah(...indeks);
  };
  return (
    <DndContext sensors={sensor} collisionDetection={closestCenter} onDragEnd={saatLepas}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {daftar.map((entri, indeks) => (
          <BarisSeret key={entri.entriId} entri={entri} baris={baris}
            naik={indeks > 0 ? () => pindah(indeks, indeks - 1) : undefined}
            turun={indeks < daftar.length - 1 ? () => pindah(indeks, indeks + 1) : undefined} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function BarisSeret({ entri, baris, naik, turun }: { entri: RingkasanEntri; baris: KonteksBaris; naik: (() => void) | undefined; turun: (() => void) | undefined }) {
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
      <BarisEntri entri={entri} baris={baris} pegangan={pegangan} />
    </div>
  );
}

function BarisEntri({ entri, baris, pegangan }: { entri: RingkasanEntri; baris: KonteksBaris; pegangan?: ReactNode }) {
  const revisi = entri.revisiTerakhir;
  const catatan = revisi?.status === 'dikembalikan' && !revisi.diabaikan ? revisi.catatanReview : null;
  const judul = judulEntri(entri);
  const info = [
    nilaiIsi(entri, 'bab') ? `Bab ${nilaiIsi(entri, 'bab')}` : '',
    nilaiIsi(entri, 'tingkat'),
    nilaiIsi(entri, 'kelompok'),
    revisi ? `oleh ${baris.namaPengguna(revisi.dibuatOleh)}` : '',
  ].filter(Boolean);
  const isi = revisi?.isi as { perluCek?: unknown; ar?: unknown } | undefined;
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-2">
      {baris.pilih ? (
        <input type="checkbox" className="size-4 shrink-0 accent-primary" aria-label={`Pilih ${judul}`}
          checked={baris.pilih.terpilih.has(entri.entriId)} onChange={e => baris.pilih!.saatUbah(entri.entriId, e.target.checked)} />
      ) : null}
      {pegangan}
      <span className="min-w-0 flex-1">
        <a className="font-semibold hover:underline" href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judul}</a>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {info.join(' · ')}
          {isi?.perluCek === true ? <Badge variant="outline" className="h-4 px-1 text-[10px]">Perlu dicek</Badge> : null}
          {isi?.ar ? <Badge variant="outline" className="h-4 px-1 text-[10px]">AR</Badge> : null}
        </span>
        {catatan ? <span className="block text-sm text-muted-foreground">Catatan: {catatan}</span> : null}
      </span>
      <ChipStatus status={statusTampil(entri)} />
      <span className="hidden gap-1 md:flex">
        {revisi?.refs.length ? (
          <span className="text-xs text-muted-foreground" title={revisi.refs.map(teksRujukan).join('\n')}>{revisi.refs.length} rujukan</span>
        ) : null}
      </span>
      <span className="hidden text-sm text-muted-foreground md:inline" title={revisi ? tanggalLengkap(revisi.dibuatPada) : undefined}>
        {revisi ? waktuRelatif(revisi.dibuatPada, baris.sekarang) : ''}
      </span>
      {baris.aksi?.(entri)}
    </div>
  );
}
