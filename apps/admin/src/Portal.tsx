// Gerbang sesi & peran portal admin: memuat sesi lalu peran dari repo.akun, dan hanya merender navigasi + rute
// setelah keduanya siap. Tanpa sesi → tombol masuk Google; sesi tanpa peran → pesan "belum punya akses" + keluar;
// galat saat memuat → pesan galat (bukan layar kosong). Rute dibaca dari location.hash (bacaRute/tulisRute).
import { useEffect, useState, type ReactNode } from 'react';
import type { JenisKonten, Peran } from '@waris/content';
import type { Sesi } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Kerangka } from './Kerangka';
import { KonteksRepo, usePortal, type RepoPortal } from './repo';
import { bacaRute, type Rute } from './rute';
import { bolehTinggalkan } from './penjaga';
import { LayarMenu } from './layar/DaftarKonten';
import { EditorEntri } from './layar/EditorEntri';
import { Beranda } from './layar/Beranda';
import { AntreanReview } from './layar/AntreanReview';
import { KelolaPeran } from './layar/KelolaPeran';

type Tahap =
  | { tahap: 'memuat' }
  | { tahap: 'galat'; pesan: string }
  | { tahap: 'tamu' }
  | { tahap: 'tanpaPeran'; sesi: Sesi }
  | { tahap: 'siap'; sesi: Sesi; peran: Peran };

export function Portal({ repo }: { repo: RepoPortal }) {
  const [status, setStatus] = useState<Tahap>({ tahap: 'memuat' });

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      try {
        const sesi = await repo.akun.sesi();
        if (!sesi) { if (!dibatalkan) setStatus({ tahap: 'tamu' }); return; }
        const peran = await repo.akun.peranSaya();
        if (dibatalkan) return;
        setStatus(peran ? { tahap: 'siap', sesi, peran } : { tahap: 'tanpaPeran', sesi });
      } catch (e) {
        if (!dibatalkan) setStatus({ tahap: 'galat', pesan: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => { dibatalkan = true; };
  }, [repo]);

  if (status.tahap === 'memuat') return <LayarGerbang><Skeleton aria-label="Memuat" className="h-9" /></LayarGerbang>;
  if (status.tahap === 'galat') {
    return <LayarGerbang><Alert variant="destructive" role="alert"><AlertDescription>{status.pesan}</AlertDescription></Alert></LayarGerbang>;
  }
  if (status.tahap === 'tamu') {
    return (
      <LayarGerbang>
        <Button className="w-full" onClick={() => void repo.akun.masukGoogle(location.origin + location.pathname)}><IkonGoogle />Masuk dengan Google</Button>
      </LayarGerbang>
    );
  }
  if (status.tahap === 'tanpaPeran') {
    return (
      <LayarGerbang>
        <p className="text-sm">Akun <b className="break-all">{status.sesi.email}</b> belum punya akses. Hubungi admin untuk diberi peran, atau keluar lalu masuk dengan akun lain.</p>
        <Button variant="outline" className="w-full" onClick={() => void repo.akun.keluar().then(() => setStatus({ tahap: 'tamu' }))}>Keluar</Button>
      </LayarGerbang>
    );
  }
  return (
    <KonteksRepo.Provider value={{ repo, sesi: status.sesi, peran: status.peran }}>
      <LayarRute onKeluar={() => void repo.akun.keluar().then(() => setStatus({ tahap: 'tamu' }))} />
    </KonteksRepo.Provider>
  );
}

function LayarGerbang({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Arif Waris</CardTitle><CardDescription>Portal Konten</CardDescription></CardHeader>
        <CardContent className="space-y-3">{children}</CardContent>
      </Card>
    </div>
  );
}

function LayarRute({ onKeluar }: { onKeluar: () => void }) {
  const [rute, setRute] = useState(() => bacaRute(location.hash));
  const [jenisEntri, setJenisEntri] = useState<JenisKonten | null>(null);
  useEffect(() => {
    // Pindah rute saat editor punya perubahan belum disimpan: tanya dulu; batal → hash dikembalikan tanpa memicu
    // hashchange lagi (replaceState), rute tetap.
    const nyalakan = (event: HashChangeEvent) => {
      if (!bolehTinggalkan()) { history.replaceState(null, '', new URL(event.oldURL).hash); return; }
      setRute(bacaRute(location.hash));
    };
    window.addEventListener('hashchange', nyalakan);
    return () => window.removeEventListener('hashchange', nyalakan);
  }, []);
  return (
    <Kerangka rute={rute} jenisEntri={rute.layar === 'entri' ? jenisEntri : null} onKeluar={onKeluar}>
      <IsiRute rute={rute} saatJenisEntri={setJenisEntri} />
    </Kerangka>
  );
}

function IsiRute({ rute, saatJenisEntri }: { rute: Rute; saatJenisEntri: (jenis: JenisKonten) => void }) {
  const { peran } = usePortal();
  if (rute.layar === 'menu') return <LayarMenu key={`${rute.menu}-${rute.tab}`} menu={rute.menu} tab={rute.tab} />;
  if (rute.layar === 'entri') return <EditorEntri key={rute.entriId} entriId={rute.entriId} saatJenisDiketahui={saatJenisEntri} />;
  if (rute.layar === 'entriBaru') return <EditorEntri key={`baru-${rute.jenis}`} jenis={rute.jenis} />;
  if (rute.layar === 'review') return <AntreanReview />;
  if (rute.layar === 'peran') return peran === 'admin' ? <KelolaPeran /> : <p>Hanya admin.</p>;
  return <Beranda />;
}

// Logo Google resmi (lucide tidak menyediakan ikon merek).
function IkonGoogle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.27a12 12 0 0 0 0 10.74l4-3.09z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  );
}
