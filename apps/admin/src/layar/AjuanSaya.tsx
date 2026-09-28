// Layar "Ajuan saya" (putaran 2 A5): hasil review perubahan milik pengguna, dibagi Perlu diperbaiki · Menunggu review ·
// Disetujui (editor/ajuanSaya.ts). Membuka layar = menandai semua kabar sudah dilihat (lencana sidebar hilang).
// Konten dibuka di editornya; teks aplikasi disunting di tempat lewat dialog yang sama dengan menu Teks aplikasi.
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.editorial.revisiSaya(sesi.userId), repo.diksi.revisiSaya(sesi.userId)])
      .then(([konten, diksi]) => {
        if (dibatalkan) return;
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
              <Card key={butir.id} className="py-4">
                <CardContent className="grid gap-2">
                  <div className="flex flex-wrap items-start gap-2">
                    <p className="min-w-0 flex-1"><span className="text-sm text-muted-foreground">{butir.jenis} · </span><b className="break-words">{butir.judul}</b></p>
                    <Badge variant={VARIAN_TAB[butir.tab]}>{STATUS_TAB[butir.tab]}</Badge>
                  </div>
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
                  <TautanAksi butir={butir} bukaTeks={bukaTeks} />
                </CardContent>
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
