// Panel kanan Teks aplikasi (putaran 2 A8, satu tampilan dengan layar web di kiri). Tanpa kata cari: "Teks di layar
// ini" = teks yang sedang tampil di layar web (arahkan kursor → kotaknya di layar menyala). Dengan kata cari: SEMUA teks
// dari dua tempat simpan (teks edukasi & diksi), termasuk yang tidak tampil di layar mana pun (tur, pesan galat);
// label pendek disembunyikan kecuali "Tampilkan juga label pendek" (kurasi C6). Tiap butir: teks Indonesia/Arab,
// "Tampil di", status, Sunting (dialog di EditorTeksAplikasi) dan Riwayat.
import { useMemo, useState } from 'react';
import lokasiTeks from 'virtual:lokasi-teks';
import type { RingkasanEntri, RingkasanKunciDiksi } from '@waris/data';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { layakDisunting, susunButir, type ButirTeks, type StatusTeks } from '../editor/teksAplikasi';
import { rapikan } from '../editor/teksLayar';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { RiwayatDiksi } from './RiwayatDiksi';

const LABEL_STATUS: Record<StatusTeks, string> = { terbit: 'Terbit', draf: 'Draf', diajukan: 'Menunggu review', dikembalikan: 'Dikembalikan' };
const BATAS_HASIL_CARI = 50;
export const kunciTeks = (sumber: { sumber: string; kunci: string }) => `${sumber.sumber}/${sumber.kunci}`;

export function PanelTeks({ data, diLayar, saatSorot, saatSunting, saatBerubah }: {
  data: { entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] };
  /** Kunci teks (kunciTeks) yang sedang tampil di layar web, urut kemunculan. */
  diLayar: readonly string[];
  saatSorot: (kunci: string | null) => void; saatSunting: (butir: ButirTeks) => void; saatBerubah: () => void;
}) {
  const [cari, setCari] = useState('');
  const [semua, setSemua] = useState(false);
  const butir = useMemo(() => susunButir(data.entri, data.diksi, lokasiTeks), [data]);
  const kata = rapikan(cari).toLowerCase();

  let daftar: ButirTeks[];
  let keterangan: string;
  if (kata) {
    const layak = semua ? butir : butir.filter(b => layakDisunting(b.id));
    const cocok = layak.filter(b => b.id.toLowerCase().includes(kata) || (b.ar ?? '').includes(cari.trim()));
    daftar = cocok.slice(0, BATAS_HASIL_CARI);
    keterangan = `${cocok.length} teks cocok dari semua layar${cocok.length > BATAS_HASIL_CARI ? `, ${BATAS_HASIL_CARI} pertama ditampilkan` : ''}`;
  } else {
    const menurutKunci = new Map(butir.map(b => [kunciTeks(b), b]));
    daftar = diLayar.flatMap(k => menurutKunci.get(k) ?? []);
    keterangan = `Teks di layar ini (${daftar.length})`;
  }

  return (
    <div className="grid gap-3">
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" aria-label="Cari teks" className="pl-9" placeholder="Cari semua teks, mis. harta" value={cari} onChange={e => setCari(e.target.value)} />
      </label>
      {kata ? (
        <Label className="gap-2 text-sm font-normal">
          <input type="checkbox" className="size-4 accent-primary" checked={semua} onChange={e => setSemua(e.target.checked)} />
          Tampilkan juga label pendek (mis. "Kembali")
        </Label>
      ) : null}
      <p className="text-sm font-medium">{keterangan}</p>
      {daftar.length === 0 ? (
        <p className="text-sm text-muted-foreground">{kata ? 'Tidak ada teks yang cocok.' : 'Belum ada teks yang bisa disunting di layar ini.'}</p>
      ) : (
        <div className="grid divide-y rounded-lg border">
          {daftar.map(b => (
            <ButirDaftar key={kunciTeks(b)} butir={b} saatSunting={() => saatSunting(b)} saatBerubah={saatBerubah}
              saatSorot={saatSorot} />
          ))}
        </div>
      )}
    </div>
  );
}

function ButirDaftar({ butir, saatSunting, saatBerubah, saatSorot }: {
  butir: ButirTeks; saatSunting: () => void; saatBerubah: () => void; saatSorot: (kunci: string | null) => void;
}) {
  const { peran } = usePortal();
  const [riwayat, setRiwayat] = useState(false);
  return (
    <article className="grid gap-1 px-3 py-2.5" aria-label={butir.id}
      onMouseEnter={() => saatSorot(kunciTeks(butir))} onMouseLeave={() => saatSorot(null)}>
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
