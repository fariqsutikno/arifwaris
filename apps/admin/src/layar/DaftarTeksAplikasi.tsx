// Daftar teks aplikasi: semua teks (dari dua tempat simpan) sebagai satu daftar, dikelompokkan per layar tempatnya
// tampil, bisa dicari. Bawaannya hanya teks yang layak disunting (kurasi C6); admin bisa menampilkan semua. Tiap butir
// menampilkan teks Indonesia/Arab, "Tampil di", status, lalu Sunting (dialog yang sama dengan Sunting di layar) dan
// Riwayat. Untuk teks yang tidak terlihat di layar mana pun, mis. tur.
import { useEffect, useMemo, useState } from 'react';
import lokasiTeks from 'virtual:lokasi-teks';
import type { RingkasanEntri, RingkasanKunciDiksi } from '@waris/data';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { kelompokkanPerLayar, layakDisunting, susunButir, type ButirTeks, type StatusTeks } from '../editor/teksAplikasi';
import { rapikan } from '../editor/teksLayar';
import { pesanGalat } from '../pesanGalat';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { PesanGalat } from './Beranda';
import { DialogSunting } from './EditorTeksAplikasi';
import { RiwayatDiksi } from './RiwayatDiksi';

const LABEL_STATUS: Record<StatusTeks, string> = { terbit: 'Terbit', draf: 'Draf', diajukan: 'Menunggu review', dikembalikan: 'Dikembalikan' };

export function DaftarTeksAplikasi() {
  const { repo, peran } = usePortal();
  const [data, setData] = useState<{ entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [cari, setCari] = useState('');
  const [semua, setSemua] = useState(false);
  const [dipilih, setDipilih] = useState<ButirTeks | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.konten.daftarEntri('teks_edukasi'), repo.diksi.daftarKunci()])
      .then(([entri, diksi]) => { if (!dibatalkan) setData({ entri, diksi }); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, muatUlang]);

  const butir = useMemo(() => (data ? susunButir(data.entri, data.diksi, lokasiTeks) : []), [data]);
  if (galat) return <PesanGalat pesan={galat} onCobaLagi={() => setMuatUlang(n => n + 1)} />;
  if (!data) return <Skeleton className="h-48" />;

  const kata = rapikan(cari).toLowerCase();
  const tampilSemua = semua && peran === 'admin';
  const layak = tampilSemua ? butir : butir.filter(b => layakDisunting(b.id));
  const cocok = kata ? layak.filter(b => b.id.toLowerCase().includes(kata) || (b.ar ?? '').includes(cari.trim())) : layak;
  const tersembunyi = butir.length - layak.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" aria-label="Cari teks" className="pl-9" placeholder="Cari kata di teks, mis. harta" value={cari} onChange={e => setCari(e.target.value)} />
        </label>
        {peran === 'admin' ? (
          <Label className="gap-2 text-sm font-normal">
            <input type="checkbox" className="size-4 accent-primary" checked={semua} onChange={e => setSemua(e.target.checked)} />
            Tampilkan semua teks, termasuk label pendek
          </Label>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {cocok.length} teks{!tampilSemua && tersembunyi ? ` · ${tersembunyi} label pendek (mis. "Kembali", "Simpan") tidak ditampilkan` : ''}
      </p>
      {kelompokkanPerLayar(cocok).map(([layar, anggota]) => (
        <details key={layar} open={!!kata} className="rounded-lg border">
          <summary className="cursor-pointer bg-muted px-4 py-2 font-semibold">
            {layar} <span className="text-sm font-normal text-muted-foreground">{anggota.length} teks</span>
          </summary>
          <Card className="gap-0 divide-y rounded-none border-0 py-0 shadow-none">
            {anggota.map(b => (
              <ButirDaftar key={`${b.sumber}/${b.kunci}`} butir={b} saatSunting={() => setDipilih(b)} saatBerubah={() => setMuatUlang(n => n + 1)} />
            ))}
          </Card>
        </details>
      ))}
      {dipilih ? (
        <DialogSunting pilihan={[dipilih]} data={data} bacaSaja={peran === 'reviewer'}
          saatTutup={() => setDipilih(null)} saatTersimpan={() => setMuatUlang(n => n + 1)} />
      ) : null}
    </div>
  );
}

function ButirDaftar({ butir, saatSunting, saatBerubah }: { butir: ButirTeks; saatSunting: () => void; saatBerubah: () => void }) {
  const { peran } = usePortal();
  const [riwayat, setRiwayat] = useState(false);
  return (
    <article className="grid gap-1 px-4 py-3" aria-label={butir.id}>
      <p className="text-sm whitespace-pre-wrap">{butir.id}</p>
      {butir.ar ? <p className="text-sm whitespace-pre-wrap" dir="rtl" lang="ar">{butir.ar}</p> : <p className="text-xs text-muted-foreground">Belum ada versi Arab</p>}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Tampil di: {butir.lokasi.length ? butir.lokasi.join(' · ') : 'belum diketahui'}</span>
        {butir.status !== 'terbit' ? <Badge variant="outline">{LABEL_STATUS[butir.status]}</Badge> : null}
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={saatSunting}>{peran === 'reviewer' ? 'Lihat' : 'Sunting'}</Button>
        {butir.entriId
          ? <a className="text-primary underline-offset-4 hover:underline" href={tulisRute({ layar: 'entri', entriId: butir.entriId })}>Riwayat</a>
          : <Button variant="link" size="sm" className="h-auto p-0 text-xs" aria-expanded={riwayat} onClick={() => setRiwayat(!riwayat)}>Riwayat</Button>}
      </p>
      {riwayat && !butir.entriId ? (
        <div className="rounded-md bg-muted/50 px-3"><RiwayatDiksi kunci={butir.kunci} terbit={butir.terbit ?? null} peran={peran} saatBerubah={saatBerubah} /></div>
      ) : null}
    </article>
  );
}
