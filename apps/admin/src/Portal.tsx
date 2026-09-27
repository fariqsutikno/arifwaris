// Gerbang sesi & peran portal admin: memuat sesi lalu peran dari repo.akun, dan hanya merender navigasi + rute
// setelah keduanya siap. Tanpa sesi → tombol masuk Google; sesi tanpa peran → pesan "belum punya akses" + keluar;
// galat saat memuat → pesan galat (bukan layar kosong). Rute dibaca dari location.hash (bacaRute/tulisRute).
import { useEffect, useState, type ReactNode } from 'react';
import type { JenisKonten, Peran } from '@waris/content';
import type { Sesi } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Kerangka } from './Kerangka';
import { KonteksRepo, usePortal, type RepoPortal } from './repo';
import { bacaRute, type Rute } from './rute';
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

  if (status.tahap === 'memuat') return null;
  if (status.tahap === 'galat') {
    return <LayarGerbang><Alert variant="destructive" role="alert"><AlertDescription>{status.pesan}</AlertDescription></Alert></LayarGerbang>;
  }
  if (status.tahap === 'tamu') {
    return (
      <LayarGerbang>
        <Button className="w-full" onClick={() => void repo.akun.masukGoogle(location.origin + location.pathname)}>Masuk dengan Google</Button>
      </LayarGerbang>
    );
  }
  if (status.tahap === 'tanpaPeran') {
    return (
      <LayarGerbang>
        <p className="text-sm">Belum punya akses. Hubungi admin untuk diberi peran.</p>
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
    const nyalakan = () => setRute(bacaRute(location.hash));
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
