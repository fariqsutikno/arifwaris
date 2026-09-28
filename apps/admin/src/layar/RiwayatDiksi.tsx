// Riwayat revisi satu teks aplikasi bersumber diksi, terbaru di atas, dengan "Tayangkan lagi" (terbitkanUlang) untuk
// reviewer/admin. `DiksiTerbit` hanya menyimpan teks yang terbit (bukan id revisinya), jadi revisi yang sedang tayang
// dikenali sebagai revisi disetujui terbaru yang teks Indonesia & Arab-nya persis sama dengan teks terbit sekarang.
import { useEffect, useState } from 'react';
import type { Peran } from '@waris/content';
import type { DiksiTerbit, RingkasanRevisiDiksi } from '@waris/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNamaTim } from '../hooks/useNamaTim';
import { pesanGalat } from '../pesanGalat';
import { usePortal } from '../repo';
import { waktuRelatif } from '../ringkas';

const LABEL_STATUS = { draf: 'Draf', diajukan: 'Menunggu review', disetujui: 'Disetujui', dikembalikan: 'Dikembalikan' } as const;

export function RiwayatDiksi({ kunci, terbit, peran, saatBerubah }: {
  kunci: string; terbit: DiksiTerbit | null; peran: Peran; saatBerubah: () => void;
}) {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanRevisiDiksi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    repo.diksi.daftarRevisi(kunci)
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, kunci]);

  if (galat) return <p role="alert" className="text-sm text-destructive">{galat}</p>;
  if (!daftar) return null;
  if (daftar.length === 0) return <p className="text-sm text-muted-foreground">Belum ada riwayat perubahan.</p>;
  const bolehTayangkanLagi = peran === 'reviewer' || peran === 'admin';
  const idTerbit = terbit
    ? [...daftar].reverse().find(r => r.status === 'disetujui' && r.idTeks === terbit.id && (r.arTeks ?? null) === terbit.ar)?.id ?? null
    : null;

  return (
    <div className="divide-y">
      {[...daftar].reverse().map(revisi => (
        <BarisRiwayatDiksi key={revisi.id} revisi={revisi} sedangTayang={revisi.id === idTerbit}
          bolehTayangkanLagi={bolehTayangkanLagi} saatBerubah={saatBerubah} />
      ))}
    </div>
  );
}

function BarisRiwayatDiksi({ revisi, sedangTayang, bolehTayangkanLagi, saatBerubah }: {
  revisi: RingkasanRevisiDiksi; sedangTayang: boolean; bolehTayangkanLagi: boolean; saatBerubah: () => void;
}) {
  const { repo } = usePortal();
  const namaDari = useNamaTim();
  const [galat, setGalat] = useState<string | null>(null);

  async function tayangkanLagi() {
    if (!window.confirm('Tayangkan lagi teks ini? Teks yang sekarang tayang di aplikasi akan digantikan.')) return;
    setGalat(null);
    try {
      await repo.diksi.terbitkanUlang(revisi.id);
      saatBerubah();
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  return (
    <article aria-label={`revisi ${revisi.id.slice(0, 8)}`} className="grid gap-1 py-2 text-sm">
      <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
        {sedangTayang ? <Badge>Tayang</Badge> : <Badge variant="secondary">{LABEL_STATUS[revisi.status]}</Badge>}
        oleh {namaDari(revisi.dibuatOleh)} · {waktuRelatif(revisi.dibuatPada, new Date())}
        {bolehTayangkanLagi && revisi.status === 'disetujui' && !sedangTayang ? (
          <Button variant="link" size="sm" className="ml-auto h-auto p-0" onClick={() => void tayangkanLagi()}>Tayangkan lagi</Button>
        ) : null}
      </p>
      <p className="whitespace-pre-wrap">{revisi.idTeks}</p>
      {revisi.arTeks ? <p dir="rtl" lang="ar" className="whitespace-pre-wrap">{revisi.arTeks}</p> : null}
      {revisi.catatanReview ? <p className="text-muted-foreground">Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert" className="text-destructive">{galat}</p> : null}
    </article>
  );
}
