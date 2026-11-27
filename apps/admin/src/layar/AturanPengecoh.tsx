// Halaman "Aturan pengecoh" (keilmuan/admin): tiap aturan salah paham yang melahirkan pilihan keliru di soal kuis mesin tampil
// dengan nama, penjelasan singkat, status, dan lima contoh soal acak (deterministik terhadap benih; "contoh lain" menggeser
// benihnya). Satu aturan disetujui = semua soal yang memakainya boleh tampil ke pelajar (spec soal kuis 3.2). Soal dibangun ulang
// dari kode, ditampilkan utuh seperti di antrean soal kuis. Semua teks lewat diksi (soal_kuis.aturan.*), tanpa kode teknis.
import { useEffect, useState } from 'react';
import { DAFTAR_ATURAN, soalKuisDariKode, type AturanPengecoh as KunciAturan, type SoalKuisMesin } from '@waris/latihan';
import { t } from '@waris/web/terjemah';
import { cariDiksi } from '@waris/web/sumber';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pesanGalat } from '../pesanGalat';
import { usePortal } from '../repo';
import { IsiSoal } from './AntreanSoalKuis';
import { rujukanDariSoal } from './rujukanDariSoal';

const JUMLAH_CONTOH = 5;
const kunciDiksi = (aturan: KunciAturan, bagian: 'nama' | 'penjelasan') => `soal_kuis.aturan.${aturan.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`)}.${bagian}`;
const bangunSoal = (kode: string): SoalKuisMesin | null => {
  const hasil = soalKuisDariKode(kode, { kamus: cariDiksi, bahasa: 'id' });
  return hasil.ok ? hasil.soal : null;
};

export function AturanPengecoh() {
  const { repo, peran } = usePortal();
  const [disetujui, setDisetujui] = useState<ReadonlySet<string> | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    repo.bank.daftarDisetujui().then(daftar => { if (!dibatalkan) setDisetujui(new Set(daftar)); }).catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo]);

  if (peran !== 'keilmuan' && peran !== 'admin') return <p>{t('soal_kuis.aturan.hanya_keilmuan')}</p>;

  async function ubah(aturan: KunciAturan, setuju: boolean) {
    setGalat(null);
    try {
      await (setuju ? repo.bank.setujui(aturan) : repo.bank.cabut(aturan));
      setDisetujui(lama => { const baru = new Set(lama); if (setuju) baru.add(aturan); else baru.delete(aturan); return baru; });
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('soal_kuis.aturan.halaman_judul')}</h1>
        <p className="max-w-3xl text-muted-foreground">{t('soal_kuis.aturan.halaman_pengantar')}</p>
      </div>
      {galat ? <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert> : null}
      {DAFTAR_ATURAN.map(aturan => (
        <KartuAturan key={aturan} aturan={aturan} status={disetujui === null ? null : disetujui.has(aturan)} saatUbah={setuju => void ubah(aturan, setuju)} />
      ))}
    </div>
  );
}

function KartuAturan({ aturan, status, saatUbah }: { aturan: KunciAturan; status: boolean | null; saatUbah: (setuju: boolean) => void }) {
  const [terbuka, setTerbuka] = useState(false);
  const idJudul = `aturan-${aturan}`;
  return (
    <Card role="article" aria-labelledby={idJudul}>
      <CardHeader className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <CardTitle id={idJudul}>{t(kunciDiksi(aturan, 'nama'))}</CardTitle>
          <CardDescription>{t(kunciDiksi(aturan, 'penjelasan'))}</CardDescription>
        </div>
        {status === null ? null : <Badge variant={status ? 'secondary' : 'outline'}>{status ? t('soal_kuis.aturan.status_disetujui') : t('soal_kuis.aturan.status_belum')}</Badge>}
        {status === null ? null : status
          ? <Button variant="outline" size="sm" onClick={() => saatUbah(false)}>{t('soal_kuis.aturan.cabut')}</Button>
          : <Button size="sm" onClick={() => saatUbah(true)}>{t('soal_kuis.aturan.setujui')}</Button>}
      </CardHeader>
      <CardContent>
        <details onToggle={event => setTerbuka(event.currentTarget.open)}>
          <summary className="cursor-pointer text-sm font-semibold">{t('soal_kuis.aturan.contoh_judul')}</summary>
          {terbuka ? <ContohSoal aturan={aturan} /> : null}
        </details>
      </CardContent>
    </Card>
  );
}

function ContohSoal({ aturan }: { aturan: KunciAturan }) {
  const { repo } = usePortal();
  const [putaran, setPutaran] = useState(0);
  const [daftar, setDaftar] = useState<SoalKuisMesin[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    setDaftar(null);
    repo.bank.contohSoal(aturan, JUMLAH_CONTOH, `${aturan}:${putaran}`)
      .then(kode => { if (!dibatalkan) setDaftar(kode.flatMap(isi => bangunSoal(isi) ?? [])); })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, aturan, putaran]);

  if (galat) return <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert>;
  if (daftar === null) return <p className="mt-3 text-sm text-muted-foreground">{t('soal_kuis.aturan.memuat')}</p>;
  if (daftar.length === 0) return <p className="mt-3 text-sm text-muted-foreground">{t('soal_kuis.aturan.contoh_kosong')}</p>;
  return (
    <div className="mt-3 space-y-4">
      <ol className="space-y-4">
        {daftar.map((soal, indeks) => (
          <li key={soal.kode} className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">{t('soal_kuis.aturan.contoh_nomor', { nomor: indeks + 1 })}</p>
            <IsiSoal soal={soal} refs={rujukanDariSoal(soal)} />
          </li>
        ))}
      </ol>
      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setPutaran(putaran + 1)}>{t('soal_kuis.aturan.contoh_lain')}</Button>
    </div>
  );
}
