// Bagian soal kuis di Antrean review: satu soal pilihan ganda ditampilkan utuh (pertanyaan, pilihan dengan kunci ditandai,
// alasan tiap pilihan, pembahasan, rujukan sebagai kalimat KB) dengan checklist 5 butir dan aksi dua tahap (AksiReview).
// Menerima semua butir soal kuis yang menunggu; menyaring per bab, tingkat, status, dan paket; setelah satu aksi pindah
// ke soal berikutnya dan meminta induknya memuat ulang. Hanya satu soal dirender sekaligus karena antreannya bisa ribuan.
import { useEffect, useMemo, useState } from 'react';
import { Circle, CircleCheck } from 'lucide-react';
import { BUTIR_CEKLIS_REVIEW, type Potongan, type SoalKuis } from '@waris/content';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  bacaSoalKuis, labelBab, labelPaket, LABEL_STATUS_KUIS, paketDari, pilihanSaring, rujukanManusia, saringKuis, SARING_KUIS_KOSONG,
  type ButirKuis, type SaringKuis,
} from '../editor/soalKuisReview';
import { teksRujukan } from '../editor/rujukan';
import { useNamaTim } from '../hooks/useNamaTim';
import { pesanGalat } from '../pesanGalat';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { waktuRelatif } from '../ringkas';
import { AksiReview } from './AksiReview';

const HURUF_PILIHAN = 'ABCDEFGHIJ';

export function AntreanSoalKuis({ daftar, muatUlang }: { daftar: ButirKuis[]; muatUlang: () => void }) {
  const { peran } = usePortal();
  const [saring, setSaring] = useState<SaringKuis>({ ...SARING_KUIS_KOSONG, status: peran === 'reviewer' ? 'diajukan' : '' });
  const [pilihId, setPilihId] = useState<string | null>(null);
  const pilihan = useMemo(() => pilihanSaring(daftar), [daftar]);
  const disaring = useMemo(() => saringKuis(daftar, saring), [daftar, saring]);
  const posisi = Math.max(0, disaring.findIndex(butir => butir.id === pilihId));
  const sekarang = disaring[posisi];
  const ubahSaring = (kunci: keyof SaringKuis, nilai: string) => { setSaring({ ...saring, [kunci]: nilai }); setPilihId(null); };
  const pindahKe = (indeks: number) => setPilihId(disaring[indeks]?.id ?? null);
  const selesai = () => {
    setPilihId(disaring[posisi + 1]?.id ?? disaring[posisi - 1]?.id ?? null);
    muatUlang();
  };

  return (
    <section aria-label="Soal kuis" className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <h2 className="mr-auto text-lg font-semibold">Soal kuis <span className="text-sm font-normal text-muted-foreground">{disaring.length} dari {daftar.length}</span></h2>
        <PilihSaring label="Bab" nilai={saring.bab} saatUbah={nilai => ubahSaring('bab', nilai)}
          opsi={pilihan.bab.map(bab => [String(bab), labelBab(bab)])} />
        <PilihSaring label="Tingkat" nilai={saring.tingkat} saatUbah={nilai => ubahSaring('tingkat', nilai)}
          opsi={pilihan.tingkat.map(tingkat => [tingkat, tingkat])} />
        {peran !== 'keilmuan' ? (
          <PilihSaring label="Status" nilai={saring.status} saatUbah={nilai => ubahSaring('status', nilai)}
            opsi={Object.entries(LABEL_STATUS_KUIS) as [string, string][]} />
        ) : null}
        <PilihSaring label="Paket" nilai={saring.paket} saatUbah={nilai => ubahSaring('paket', nilai)}
          opsi={pilihan.paket.map(paket => [paket, labelPaket(paket)])} />
      </div>
      {sekarang ? (
        <>
          <p className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
            Soal {posisi + 1} dari {disaring.length}
            <Button variant="link" size="sm" className="h-auto p-0" disabled={posisi === 0} onClick={() => pindahKe(posisi - 1)}>Sebelumnya</Button>
            <Button variant="link" size="sm" className="h-auto p-0" disabled={posisi >= disaring.length - 1} onClick={() => pindahKe(posisi + 1)}>Berikutnya</Button>
          </p>
          <KartuReviewKuis key={sekarang.id} butir={sekarang} saatSelesai={selesai} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">Tidak ada soal yang cocok dengan saringan ini.</p>
      )}
    </section>
  );
}

function PilihSaring({ label, nilai, opsi, saatUbah }: { label: string; nilai: string; opsi: [string, string][]; saatUbah: (nilai: string) => void }) {
  const id = `saring-kuis-${label}`;
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <NativeSelect id={id} size="sm" className="max-w-56" value={nilai} onChange={e => saatUbah(e.target.value)}>
        <NativeSelectOption value="">Semua</NativeSelectOption>
        {opsi.map(([nilaiOpsi, teks]) => <NativeSelectOption key={nilaiOpsi} value={nilaiOpsi}>{teks}</NativeSelectOption>)}
      </NativeSelect>
    </div>
  );
}

function KartuReviewKuis({ butir, saatSelesai }: { butir: ButirKuis; saatSelesai: () => void }) {
  const { repo, sesi, peran } = usePortal();
  const namaDari = useNamaTim();
  const [ceklis, setCeklis] = useState<number[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const bacaan = bacaSoalKuis(butir.isi);
  const bisaCentang = butir.status === 'diajukan' && (peran === 'admin' || peran === 'reviewer');
  const idJudul = `kuis-${butir.id}`;

  useEffect(() => {
    let dibatalkan = false;
    repo.editorial.daftarCeklis(butir.id).then(daftar => { if (!dibatalkan) setCeklis(daftar); }).catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, butir.id]);

  async function aturButir(nomor: number, dicentang: boolean) {
    setGalat(null);
    try {
      await repo.editorial.aturCeklis(butir.id, nomor, dicentang);
      setCeklis(lama => (dicentang ? [...new Set([...(lama ?? []), nomor])] : (lama ?? []).filter(n => n !== nomor)));
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  return (
    <Card role="article" aria-labelledby={idJudul}>
      <CardHeader className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-muted-foreground">
            {labelBab((butir.isi as { bab?: number }).bab ?? 0)} · {(butir.isi as { tingkat?: string }).tingkat ?? 'dasar'} · {labelPaket(paketDari(butir.isi))}
          </p>
          <CardTitle id={idJudul} className="break-words">Soal {(butir.isi as { kode?: string }).kode ?? ''}</CardTitle>
          <p className="text-sm text-muted-foreground">
            oleh {namaDari(butir.dibuatOleh)} ·{' '}
            <time dateTime={butir.dibuatPada} title={new Date(butir.dibuatPada).toLocaleString('id-ID')}>{waktuRelatif(butir.dibuatPada, new Date())}</time>
          </p>
        </div>
        <Badge variant={butir.status === 'diperiksa' ? 'secondary' : 'outline'}>{LABEL_STATUS_KUIS[butir.status]}</Badge>
        {butir.dibuatOleh === sesi.userId ? <Badge variant="secondary">revisi Anda</Badge> : null}
        <a className="text-sm text-primary underline-offset-4 hover:underline" href={tulisRute({ layar: 'entri', entriId: butir.entriId })}>Buka entri</a>
      </CardHeader>
      <CardContent className="space-y-4">
        {bacaan.ok ? <IsiSoal soal={bacaan.soal} refs={butir.refs} /> : <Alert variant="destructive" role="alert"><AlertDescription>Isi soal tidak sah: {bacaan.galat}</AlertDescription></Alert>}
        <Ceklis dicentang={ceklis} bisaUbah={bisaCentang} saatUbah={(nomor, nilai) => void aturButir(nomor, nilai)} />
        {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
        <AksiReview pembuatId={butir.dibuatOleh} status={butir.status} saatSelesai={saatSelesai}
          setujui={() => repo.editorial.setujui(butir.id)} kembalikan={catatan => repo.editorial.kembalikan(butir.id, catatan)}
          soalKuis={{ periksa: () => repo.editorial.periksa(butir.id), butirDicentang: ceklis ?? [] }} />
      </CardContent>
    </Card>
  );
}

export function IsiSoal({ soal, refs }: { soal: SoalKuis; refs: readonly string[] }) {
  const rujukan = rujukanManusia(refs);
  return (
    <div className="space-y-4">
      <p className="text-base font-medium"><Teks potongan={soal.pertanyaan} /></p>
      <ol className="space-y-2" aria-label="Pilihan jawaban">
        {soal.pilihan.map((pilihan, indeks) => {
          const benar = indeks === soal.indeksBenar;
          return (
            <li key={indeks} className={`rounded-lg border p-3 ${benar ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-start gap-2">
                <span className="font-semibold">{HURUF_PILIHAN[indeks]}.</span>
                <span className="flex-1"><Teks potongan={pilihan} /></span>
                {benar ? <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary"><CircleCheck className="size-4" aria-hidden="true" />Jawaban benar</span> : null}
              </div>
              {soal.alasanPilihan?.[indeks] ? <p className="mt-1 pl-6 text-sm text-muted-foreground">Alasan: <Teks potongan={soal.alasanPilihan[indeks]!} /></p> : null}
            </li>
          );
        })}
      </ol>
      <div>
        <h3 className="text-sm font-semibold">Pembahasan</h3>
        <p className="text-sm"><Teks potongan={soal.pembahasan} /></p>
      </div>
      {soal.catatan?.length ? <div><h3 className="text-sm font-semibold">Catatan</h3><p className="text-sm"><Teks potongan={soal.catatan} /></p></div> : null}
      <div>
        <h3 className="text-sm font-semibold">Rujukan</h3>
        {rujukan.length > 0
          ? <ul className="list-disc pl-5 text-sm">{rujukan.map((teks, indeks) => <li key={indeks}>{teks}</li>)}</ul>
          : <p className="text-sm text-muted-foreground">Belum ada rujukan.</p>}
      </div>
    </div>
  );
}

function Ceklis({ dicentang, bisaUbah, saatUbah }: { dicentang: number[] | null; bisaUbah: boolean; saatUbah: (nomor: number, nilai: boolean) => void }) {
  const sudah = new Set(dicentang ?? []);
  return (
    <fieldset className="space-y-1.5 border-t pt-3" disabled={!bisaUbah || dicentang === null}>
      <legend className="text-sm font-semibold">Checklist pemeriksaan <span className="font-normal text-muted-foreground">{sudah.size} dari {BUTIR_CEKLIS_REVIEW.length}</span></legend>
      {BUTIR_CEKLIS_REVIEW.map((teks, indeks) => {
        const nomor = indeks + 1;
        return bisaUbah ? (
          <label key={nomor} className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={sudah.has(nomor)} onChange={e => saatUbah(nomor, e.target.checked)} />
            {teks}
          </label>
        ) : (
          <p key={nomor} className="flex items-start gap-2 text-sm">
            {sudah.has(nomor) ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-label="dicentang" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="belum dicentang" />}
            {teks}
          </p>
        );
      })}
    </fieldset>
  );
}

function Teks({ potongan }: { potongan: readonly Potongan[] }) {
  return (
    <>
      {potongan.map((bagian, indeks) => {
        switch (bagian.jenis) {
          case 'tebal': return <strong key={indeks}>{bagian.teks}</strong>;
          case 'miring': return <em key={indeks}>{bagian.teks}</em>;
          case 'rujukan': return <span key={indeks}>{teksRujukan(bagian.kode)}</span>;
          case 'tautanPelajaran':
          case 'tautanBagian': return <span key={indeks}>{bagian.teks ?? ''}</span>;
          default: return <span key={indeks}>{bagian.teks}</span>;
        }
      })}
    </>
  );
}
