// Layar "Penjelasan hasil" (tab menu Teks aplikasi): menyunting kalimat penjelasan hasil hitung (templat narasi).
// A: kasus contoh dihitung engine & dirender layar Hasil web asli; klik kalimat → dialog sunting yang sama dengan Teks
// aplikasi (alur draf/ajuan/review tidak berubah). B: daftar semua kalimat per tahap untuk yang tidak muncul di kasus
// contoh. Kunci diksi tidak tampil; sisipan tampil sebagai label manusiawi (editor/penjelasanHasil).
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { RingkasanEntri, RingkasanKunciDiksi } from '@waris/data';
import { pasangSnapshot, snapshotTerpasang } from '@waris/web/sumber';
import { Hasil } from '@waris/web/layar/Hasil';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { kelompokkanNarasi, namaSisipan } from '../editor/penjelasanHasil';
import { susunButir, type StatusTeks } from '../editor/teksAplikasi';
import { buatPencocok, type SumberTeks } from '../editor/teksLayar';
import { usePortal } from '../repo';
import { pesanGalat } from '../pesanGalat';
import { DialogSunting, LayarBisaDisunting, PenjagaGalat, sumberDariSnapshot, timpaBelumTerbit } from './EditorTeksAplikasi';
import { kasusDariSoal } from '@waris/latihan';

const NAMA_LAYAR = 'Penjelasan hasil';
const HARTA_CONTOH = 120_000_000n;
const HARAPAN_KOSONG = { saham: {}, ashlAkhir: 0n }; // harapan tidak dipakai di sini
const buatKasus = (pewaris: 'L' | 'P', ahliWaris: string[]) => kasusDariSoal({ pewaris, ahliWaris, harta: HARTA_CONTOH, harapan: HARAPAN_KOSONG });
const KASUS_CONTOH = [
  { id: 'anak', label: 'Istri, ibu, anak laki-laki dan perempuan', kasus: buatKasus('L', ['ISTRI', 'IBU', 'ANAK_LK', 'ANAK_PR']) },
  { id: 'aul', label: 'Suami, ibu, dan saudari kandung (bagian melebihi harta)', kasus: buatKasus('P', ['SUAMI', 'IBU', 'SAUDARI_KANDUNG']) },
  { id: 'radd', label: 'Ibu dan anak perempuan (ada sisa dikembalikan)', kasus: buatKasus('L', ['IBU', 'ANAK_PR']) },
] as const;
const LABEL_STATUS: Record<StatusTeks, string> = { terbit: 'Terbit', draf: 'Draf', diajukan: 'Menunggu review', dikembalikan: 'Dikembalikan' };

export function PenjelasanHasil() {
  const { repo, peran } = usePortal();
  const [data, setData] = useState<{ entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [daftarSumber, setDaftarSumber] = useState<SumberTeks[]>(sumberDariSnapshot);
  const [versiLayar, setVersiLayar] = useState(0);
  const [kasusId, setKasusId] = useState<string>(KASUS_CONTOH[0].id);
  const [dipilih, setDipilih] = useState<SumberTeks[] | null>(null);
  const pencocok = useMemo(() => buatPencocok(daftarSumber), [daftarSumber]);
  const kasus = KASUS_CONTOH.find(k => k.id === kasusId)!.kasus;

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.konten.daftarEntri('teks_edukasi'), repo.diksi.daftarKunci()])
      .then(([entri, diksi]) => { if (!dibatalkan) setData({ entri, diksi }); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, muatUlang]);

  // Sama dengan EditorTeksAplikasi: layar web membaca draf/ajuan terbaru, snapshot asal dipulihkan saat keluar.
  useLayoutEffect(() => {
    if (!data) return;
    const asal = snapshotTerpasang();
    pasangSnapshot(timpaBelumTerbit(asal, data));
    setDaftarSumber(sumberDariSnapshot());
    setVersiLayar(n => n + 1);
    return () => pasangSnapshot(asal);
  }, [data]);

  const kelompok = useMemo(() => {
    if (!data) return [];
    const butir = new Map(susunButir([], data.diksi, {}).map(b => [b.kunci, b]));
    return kelompokkanNarasi([...butir.keys()]).map(g => ({ judul: g.judul, butir: g.kunci.map(k => butir.get(k)!) }));
  }, [data]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Kalimat penjelasan di halaman hasil. Pilih kasus contoh lalu klik kalimat bergaris putus-putus untuk menyuntingnya, atau cari kalimat
        yang tidak muncul di contoh pada daftar di bawah.
      </p>
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      <section className="space-y-2" aria-label="Kasus contoh">
        <Label className="gap-2 text-sm font-medium">
          Kasus contoh
          <select className="rounded-md border bg-background px-2 py-1 text-sm font-normal" value={kasusId} onChange={e => setKasusId(e.target.value)}>
            {KASUS_CONTOH.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </Label>
        <Card className="gap-0 overflow-hidden py-0">
          <PenjagaGalat key={`${kasusId}-${versiLayar}`}>
            <LayarBisaDisunting pencocok={pencocok} aktif sorot={null} saatKotak={() => {}} saatPilih={sumber => setDipilih(sumber)}>
              <Hasil kasus={kasus} idSesi="sunting-penjelasan" tujuan="hitung" kirim={() => {}} />
            </LayarBisaDisunting>
          </PenjagaGalat>
        </Card>
      </section>
      <section className="space-y-2" aria-label="Semua kalimat penjelasan">
        <h2 className="text-lg font-semibold">Semua kalimat per tahap</h2>
        {data ? kelompok.map(g => (
          <details key={g.judul} className="rounded-lg border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">{g.judul} ({g.butir.length})</summary>
            <ul className="mt-2 grid gap-1.5">
              {g.butir.map(b => (
                <li key={b.kunci}>
                  <article aria-label={b.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <KalimatBerlabel teks={b.id} />
                    {b.status !== 'terbit' ? <Badge variant="secondary">{LABEL_STATUS[b.status]}</Badge> : null}
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setDipilih([b])}>Sunting</Button>
                  </article>
                </li>
              ))}
            </ul>
          </details>
        )) : <Skeleton className="h-24" />}
      </section>
      {dipilih && data ? (
        <DialogSunting pilihan={dipilih} data={data} bacaSaja={peran === 'reviewer'} layarSekarang={NAMA_LAYAR}
          saatTutup={() => setDipilih(null)} saatTersimpan={() => setMuatUlang(n => n + 1)} />
      ) : null}
    </div>
  );
}

/** Teks dengan {sisipan} sebagai label manusiawi ("nama almarhum", "rujukan"). */
function KalimatBerlabel({ teks }: { teks: string }) {
  return <span>{teks.split(/(\{\w+\})/).map((bagian, i) => (/^\{\w+\}$/.test(bagian)
    ? <span key={i} className="rounded bg-primary/15 px-1 text-xs">{namaSisipan(bagian.slice(1, -1))}</span>
    : <span key={i}>{bagian}</span>))}</span>;
}
