// Layar "Ajuan saya" (putaran 2 A5): hasil review perubahan milik pengguna, dibagi Perlu diperbaiki · Menunggu review ·
// Disetujui (editor/ajuanSaya.ts). Membuka layar = menandai semua kabar sudah dilihat (lencana sidebar hilang).
// Konten dibuka di editornya; teks aplikasi disunting di tempat lewat dialog yang sama dengan menu Teks aplikasi.
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { bolehAbaikanRevisi } from '@waris/content';
import type { RingkasanEntri, RingkasanKunciDiksi } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { catatDibuka, LABEL_TAB_AJUAN, susunAjuan, TAB_AJUAN, type ButirAjuan, type TabAjuan } from '../editor/ajuanSaya';
import type { SumberTeks } from '../editor/teksLayar';
import { useNamaTim } from '../hooks/useNamaTim';
import { usePortal } from '../repo';
import { waktuRelatif } from '../ringkas';
import { tulisRute } from '../rute';
import { pesanGalat } from '../pesanGalat';
import { DialogSunting } from './EditorTeksAplikasi';

const VARIAN_TAB = { perbaiki: 'destructive', menunggu: 'outline', disetujui: 'default' } as const;
const STATUS_TAB: Record<TabAjuan, string> = { perbaiki: 'Dikembalikan', menunggu: 'Menunggu review', disetujui: 'Disetujui' };

export function AjuanSaya() {
  const { repo, sesi, peran } = usePortal();
  const namaDari = useNamaTim();
  const [daftar, setDaftar] = useState<ButirAjuan[] | null>(null);
  const [dataTeks, setDataTeks] = useState<{ entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] } | null>(null);
  const [teksDipilih, setTeksDipilih] = useState<SumberTeks | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  // Entri/teks yang sudah punya versi tayang: hanya itu yang bisa "kembali ke versi tayang" (buang perubahan).
  const [tayang, setTayang] = useState<Set<string>>(new Set());

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.editorial.revisiSaya(sesi.userId), repo.diksi.revisiSaya(sesi.userId), repo.konten.daftarEntri(), repo.diksi.daftarKunci()])
      .then(([konten, diksi, entri, kunci]) => {
        if (dibatalkan) return;
        setTayang(new Set([...entri.filter(e => e.revisiTerbitId).map(e => e.entriId), ...kunci.filter(k => k.terbit).map(k => k.kunci)]));
        setDaftar(susunAjuan(konten, diksi));
        catatDibuka(new Date().toISOString());
      })
      .catch(e => { if (!dibatalkan) setGalat(pesanGalat(e)); });
    return () => { dibatalkan = true; };
  }, [repo, sesi.userId, muatUlang]);

  async function bukaTeks(tujuan: { kunciTeks: string; id: string; ar: string | null }) {
    try {
      if (!dataTeks) {
        const [entri, diksi] = await Promise.all([repo.konten.daftarEntri('teks_edukasi'), repo.diksi.daftarKunci()]);
        setDataTeks({ entri, diksi });
      }
      setTeksDipilih({ sumber: 'diksi', kunci: tujuan.kunciTeks, id: tujuan.id, ar: tujuan.ar });
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }

  async function buang(butir: ButirAjuan) {
    try {
      await ('entriId' in butir.tujuan ? repo.editorial.abaikan(butir.id) : repo.diksi.abaikan(butir.id));
      setMuatUlang(n => n + 1);
    } catch (e) {
      setGalat(pesanGalat(e));
    }
  }
  // Semua butir di sini milik pengguna sendiri (revisiSaya).
  const bolehBuang = (butir: ButirAjuan) => butir.tab === 'perbaiki'
    && tayang.has('entriId' in butir.tujuan ? butir.tujuan.entriId : butir.tujuan.kunciTeks)
    && bolehAbaikanRevisi({ peran, pelakuId: sesi.userId, pembuatId: sesi.userId, status: 'dikembalikan' });

  if (galat) return <Alert variant="destructive" role="alert"><AlertDescription>{galat}</AlertDescription></Alert>;
  if (!daftar) return <Skeleton className="h-40" />;
  const sekarang = new Date();
  const perTab = (tab: TabAjuan) => daftar.filter(butir => butir.tab === tab);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ajuan saya</h1>
      <p className="text-sm text-muted-foreground">Hasil review perubahan yang Anda kirim: yang dikembalikan, yang masih menunggu, dan yang sudah tayang.</p>
      <Tabs defaultValue={perTab('perbaiki').length ? 'perbaiki' : 'menunggu'}>
        <TabsList>
          {TAB_AJUAN.map(tab => <TabsTrigger key={tab} value={tab}>{LABEL_TAB_AJUAN[tab]} ({perTab(tab).length})</TabsTrigger>)}
        </TabsList>
        {TAB_AJUAN.map(tab => (
          <TabsContent key={tab} value={tab} className="grid gap-3 pt-2">
            {perTab(tab).length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada.</p> : perTab(tab).map(butir => (
              <Card key={butir.id} className="py-3">
                {/* Native <details>: judul & status selalu terlihat, catatan & aksi dibuka bila perlu. Yang perlu diperbaiki terbuka. */}
                <details className="group" open={butir.tab === 'perbaiki'}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-6 [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
                    <p className="min-w-0 flex-1"><span className="text-sm text-muted-foreground">{butir.jenis} · </span><b className="break-words">{butir.judul}</b></p>
                    <Badge variant={VARIAN_TAB[butir.tab]}>{STATUS_TAB[butir.tab]}</Badge>
                  </summary>
                  <CardContent className="mt-2 grid gap-2 pl-12">
                    {butir.catatan ? (
                      <blockquote className="border-l-2 pl-3 text-sm">
                        “{butir.catatan}” <span className="text-muted-foreground">— {butir.pemeriksa ? namaDari(butir.pemeriksa) : 'reviewer'}, {waktuRelatif(butir.waktu, sekarang)}</span>
                      </blockquote>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {butir.tab === 'menunggu' ? `Dikirim ${waktuRelatif(butir.waktu, sekarang)}`
                          : `Disetujui${butir.pemeriksa ? ` oleh ${namaDari(butir.pemeriksa)}` : ''} ${waktuRelatif(butir.waktu, sekarang)}`}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <TautanAksi butir={butir} bukaTeks={bukaTeks} />
                      {bolehBuang(butir) ? (
                        <Button variant="link" className="h-auto w-fit p-0 text-sm text-muted-foreground" onClick={() => void buang(butir)}>Buang perubahan ini</Button>
                      ) : null}
                    </div>
                  </CardContent>
                </details>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
      {teksDipilih && dataTeks ? (
        <DialogSunting pilihan={[teksDipilih]} data={dataTeks} bacaSaja={peran === 'reviewer'}
          saatTutup={() => setTeksDipilih(null)} saatTersimpan={() => { setDataTeks(null); setMuatUlang(n => n + 1); }} />
      ) : null}
    </div>
  );
}

function TautanAksi({ butir, bukaTeks }: { butir: ButirAjuan; bukaTeks: (tujuan: { kunciTeks: string; id: string; ar: string | null }) => void }) {
  const label = butir.tab === 'perbaiki' ? 'Perbaiki →' : butir.tab === 'menunggu' ? 'Sunting ajuan →' : 'Lihat →';
  if ('entriId' in butir.tujuan) {
    return <a className="w-fit text-sm font-semibold text-primary hover:underline" href={tulisRute({ layar: 'entri', entriId: butir.tujuan.entriId })}>{label}</a>;
  }
  const tujuan = butir.tujuan;
  return <Button variant="link" className="h-auto w-fit p-0 text-sm font-semibold" onClick={() => void bukaTeks(tujuan)}>{label}</Button>;
}
