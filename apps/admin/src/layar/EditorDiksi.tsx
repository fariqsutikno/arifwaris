// Layar editor diksi: tabel semua kunci dikelompokkan per halaman, dengan filter Arab kosong/belum terbit/cari.
// Penulis & admin mengubah kolom Indonesia/Arab satu baris lalu "Simpan & ajukan" (buatDraf lalu ajukan langsung);
// reviewer melihat sel baca-saja. Bila buatDraf sukses tapi ajukan gagal, galat ditampilkan dan daftar dimuat ulang
// (draf sudah tersimpan di database walau belum diajukan). Data dari repo.diksi.daftarKunci(). Tiap baris juga
// punya toggle "Riwayat" (repo.diksi.daftarRevisi) dengan rollback (terbitkanUlang) untuk reviewer/admin, mengikuti
// pola RiwayatRevisi.tsx.
import { useEffect, useState } from 'react';
import type { Peran } from '@waris/content';
import type { DiksiTerbit, RingkasanKunciDiksi, RingkasanRevisiDiksi } from '@waris/data';
import { Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortal } from '../repo';

const JUMLAH_KOLOM = 5;

type StatusTampil = 'terbit' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit + draf';

interface SaringDiksi { halaman?: string; arKosong?: boolean; belumTerbit?: boolean; cari?: string }

/** Status ringkas satu kunci untuk ditampilkan, sama semantiknya dengan statusTampil di DaftarKonten. `DiksiTerbit.id`
 * adalah teks id yang terbit (bukan id revisi), jadi "terbit" dikenali dari status revisi terakhir, bukan dari
 * membandingkan id. */
function statusTampilDiksi(k: RingkasanKunciDiksi): StatusTampil {
  const { terbit, revisiTerakhir } = k;
  if (!revisiTerakhir) return terbit ? 'terbit' : 'draf';
  if (revisiTerakhir.status === 'disetujui') return 'terbit';
  if (terbit) return 'terbit + draf';
  if (revisiTerakhir.status === 'diajukan') return 'diajukan';
  if (revisiTerakhir.status === 'draf') return 'draf';
  return 'dikembalikan';
}

const idTeksTampil = (k: RingkasanKunciDiksi): string => k.revisiTerakhir?.idTeks ?? k.terbit?.id ?? '';
const arTeksTampil = (k: RingkasanKunciDiksi): string => k.revisiTerakhir?.arTeks ?? k.terbit?.ar ?? '';

/** Filter murni dipakai layar & tes. `arKosong`: teks Arab terbit kosong/null. `belumTerbit`: belum pernah terbit
 * sama sekali, atau revisi terakhirnya bukan yang disetujui. `cari`: cocok di kunci atau teks Indonesia. */
export function saringDiksi(daftar: RingkasanKunciDiksi[], saring: SaringDiksi): RingkasanKunciDiksi[] {
  const cari = saring.cari?.trim().toLowerCase();
  return daftar.filter(k => {
    if (saring.halaman && k.halaman !== saring.halaman) return false;
    if (saring.arKosong && k.terbit?.ar) return false;
    if (saring.belumTerbit) {
      const belumTerbit = !k.terbit || (k.revisiTerakhir != null && k.revisiTerakhir.status !== 'disetujui');
      if (!belumTerbit) return false;
    }
    if (cari && !k.kunci.toLowerCase().includes(cari) && !idTeksTampil(k).toLowerCase().includes(cari)) return false;
    return true;
  });
}

export function EditorDiksi() {
  const { repo, peran } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanKunciDiksi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [halaman, setHalaman] = useState('');
  const [arKosong, setArKosong] = useState(false);
  const [belumTerbit, setBelumTerbit] = useState(false);
  const [cari, setCari] = useState('');
  const bolehEdit = peran === 'penulis' || peran === 'admin';

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    repo.diksi.daftarKunci()
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, muatUlang]);

  if (galat) return <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert>;
  if (!daftar) return <Skeleton className="h-48" />;

  const tampil = saringDiksi(daftar, halaman ? { halaman, arKosong, belumTerbit, cari } : { arKosong, belumTerbit, cari });
  const daftarHalaman = [...new Set(daftar.map(k => k.halaman))];
  const kelompok = kelompokkanPerHalaman(tampil);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Label>
          Halaman
          <NativeSelect value={halaman} onChange={e => setHalaman(e.target.value)}>
            <NativeSelectOption value="">Semua</NativeSelectOption>
            {daftarHalaman.map(h => <NativeSelectOption key={h} value={h}>{h}</NativeSelectOption>)}
          </NativeSelect>
        </Label>
        <Label><input type="checkbox" className="size-4 accent-primary" checked={arKosong} onChange={e => setArKosong(e.target.checked)} />Arab kosong</Label>
        <Label><input type="checkbox" className="size-4 accent-primary" checked={belumTerbit} onChange={e => setBelumTerbit(e.target.checked)} />Belum terbit</Label>
      </div>
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input type="search" aria-label="Cari" className="pl-9" placeholder="Cari kunci atau teks Indonesia" value={cari} onChange={e => setCari(e.target.value)} />
      </label>
      {kelompok.map(([h, baris]) => (
        <Card key={h} className="gap-0 py-0">
          <Table>
            <caption className="border-b bg-muted px-4 py-2 text-left font-semibold">{h}</caption>
            <TableHeader>
              <TableRow><TableHead>Kunci</TableHead><TableHead>Indonesia</TableHead><TableHead>Arab</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {baris.map(k => (
                <BarisDiksi
                  key={k.kunci} k={k} bolehEdit={bolehEdit} peran={peran}
                  onSimpanSelesai={() => setMuatUlang(n => n + 1)}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
}

function kelompokkanPerHalaman(daftar: RingkasanKunciDiksi[]): [string, RingkasanKunciDiksi[]][] {
  const peta = new Map<string, RingkasanKunciDiksi[]>();
  for (const k of daftar) {
    const kelompok = peta.get(k.halaman) ?? [];
    kelompok.push(k);
    peta.set(k.halaman, kelompok);
  }
  return [...peta.entries()];
}

function BarisDiksi(
  { k, bolehEdit, peran, onSimpanSelesai }:
  { k: RingkasanKunciDiksi; bolehEdit: boolean; peran: Peran; onSimpanSelesai: () => void },
) {
  const { repo } = usePortal();
  const [idTeks, setIdTeks] = useState(idTeksTampil(k));
  const [arTeks, setArTeks] = useState(arTeksTampil(k));
  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [riwayatTerbuka, setRiwayatTerbuka] = useState(false);
  const berubah = idTeks !== idTeksTampil(k) || arTeks !== arTeksTampil(k);

  async function simpanDanAjukan() {
    setGalat(null);
    setMenyimpan(true);
    let idRevisi: string;
    try {
      idRevisi = await repo.diksi.buatDraf(k.kunci, idTeks, arTeks || null, null);
    } catch (e) {
      setGalat(pesan(e));
      setMenyimpan(false);
      return;
    }
    try {
      await repo.diksi.ajukan(idRevisi);
    } catch (e) {
      setGalat(pesan(e));
    } finally {
      setMenyimpan(false);
      onSimpanSelesai(); // draf sudah tersimpan meski ajukan gagal → muat ulang agar daftar mencerminkannya.
    }
  }

  return (
    <>
      <TableRow className={berubah ? 'bg-accent/40' : undefined}>
        <TableCell className="font-mono text-xs">{k.kunci}</TableCell>
        <TableCell className="min-w-48">{bolehEdit ? <Input aria-label={`Indonesia ${k.kunci}`} value={idTeks} onChange={e => setIdTeks(e.target.value)} /> : idTeks}</TableCell>
        <TableCell className="min-w-40">{bolehEdit ? <Input aria-label={`Arab ${k.kunci}`} dir="rtl" lang="ar" value={arTeks} onChange={e => setArTeks(e.target.value)} /> : arTeks}</TableCell>
        <TableCell><Badge variant="secondary">{statusTampilDiksi(k)}</Badge></TableCell>
        <TableCell>
          <span className="flex justify-end gap-2">
            {bolehEdit ? <Button size="sm" disabled={!berubah || menyimpan} onClick={() => void simpanDanAjukan()}>Simpan &amp; ajukan</Button> : null}
            <Button variant="outline" size="sm" onClick={() => setRiwayatTerbuka(v => !v)}>Riwayat</Button>
          </span>
          {galat ? <span role="alert" className="block text-sm whitespace-normal text-destructive">{galat}</span> : null}
        </TableCell>
      </TableRow>
      {riwayatTerbuka ? (
        <TableRow>
          <TableCell colSpan={JUMLAH_KOLOM} className="bg-muted/50 whitespace-normal">
            <RiwayatDiksi kunci={k.kunci} terbit={k.terbit} peran={peran} saatBerubah={onSimpanSelesai} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

/** Riwayat revisi satu kunci diksi, terbaru di atas, dengan rollback (terbitkanUlang) untuk reviewer/admin.
 * `DiksiTerbit` cuma menyimpan teks yang terbit (bukan id revisi, beda dari `RingkasanEntri.revisiTerbitId`),
 * jadi revisi yang sedang "terbit" dikenali sebagai revisi *disetujui terbaru* yang idTeks & arTeks-nya persis
 * sama dengan teks terbit sekarang — bukan pencarian id, karena id itu tidak tersedia di sini. */
function RiwayatDiksi(
  { kunci, terbit, peran, saatBerubah }:
  { kunci: string; terbit: DiksiTerbit | null; peran: Peran; saatBerubah: () => void },
) {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanRevisiDiksi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    repo.diksi.daftarRevisi(kunci)
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, kunci]);

  if (galat) return <p role="alert" className="text-sm text-destructive">{galat}</p>;
  if (!daftar) return null;
  const bolehRollback = peran === 'reviewer' || peran === 'admin';
  const idTerbit = terbit
    ? [...daftar].reverse().find(r => r.status === 'disetujui' && r.idTeks === terbit.id && (r.arTeks ?? null) === terbit.ar)?.id ?? null
    : null;

  return (
    <div className="divide-y">
      {[...daftar].reverse().map(revisi => (
        <BarisRiwayatDiksi
          key={revisi.id} revisi={revisi} sedangTerbit={revisi.id === idTerbit}
          bolehRollback={bolehRollback} saatBerubah={saatBerubah}
        />
      ))}
    </div>
  );
}

function BarisRiwayatDiksi(
  { revisi, sedangTerbit, bolehRollback, saatBerubah }:
  { revisi: RingkasanRevisiDiksi; sedangTerbit: boolean; bolehRollback: boolean; saatBerubah: () => void },
) {
  const { repo } = usePortal();
  const [galat, setGalat] = useState<string | null>(null);
  const bolehTombolRollback = bolehRollback && revisi.status === 'disetujui' && !sedangTerbit;

  async function rollback() {
    if (!window.confirm(`Terbitkan ulang revisi ${revisi.id.slice(0, 8)}? Ini akan menggantikan revisi yang sedang terbit.`)) return;
    setGalat(null);
    try {
      await repo.diksi.terbitkanUlang(revisi.id);
      saatBerubah();
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  return (
    <article aria-label={`revisi ${revisi.id.slice(0, 8)}`} className="flex flex-wrap items-center gap-2 py-2">
      <p className="text-sm">
        {sedangTerbit ? 'terbit' : revisi.status} · id: {revisi.idTeks} · ar: {revisi.arTeks ?? ''}
      </p>
      {bolehTombolRollback ? <Button size="sm" className="ml-auto" onClick={() => void rollback()}>Terbitkan ulang</Button> : null}
      {revisi.catatanReview ? <p className="w-full text-sm text-muted-foreground">Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert" className="w-full text-sm text-destructive">{galat}</p> : null}
    </article>
  );
}

const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));
