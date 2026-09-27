// Gerbang sesi & peran portal admin: memuat sesi lalu peran dari repo.akun, dan hanya merender navigasi + rute
// setelah keduanya siap. Tanpa sesi → tombol masuk Google; sesi tanpa peran → pesan "belum punya akses" + keluar;
// galat saat memuat → pesan galat (bukan layar kosong). Rute dibaca dari location.hash (bacaRute/tulisRute).
import { useContext, useEffect, useState } from 'react';
import type { Peran } from '@waris/content';
import type { Sesi } from '@waris/data';
import { Tombol } from '@waris/web/ui/komponen';
import { KonteksRepo, type RepoPortal } from './repo';
import { MENU_PORTAL } from './navigasi';
import { bacaRute, tulisRute } from './rute';
import { DaftarKonten } from './layar/DaftarKonten';
import { EditorEntri } from './layar/EditorEntri';
import { AntreanReview } from './layar/AntreanReview';
import { EditorDiksi } from './layar/EditorDiksi';
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
  if (status.tahap === 'galat') return <p role="alert">{status.pesan}</p>;
  if (status.tahap === 'tamu') {
    return <Tombol onClick={() => void repo.akun.masukGoogle(location.origin + location.pathname)}>Masuk dengan Google</Tombol>;
  }
  if (status.tahap === 'tanpaPeran') {
    return (
      <div>
        <p>Belum punya akses. Hubungi admin untuk diberi peran.</p>
        <Tombol onClick={() => void repo.akun.keluar().then(() => setStatus({ tahap: 'tamu' }))}>Keluar</Tombol>
      </div>
    );
  }
  return (
    <KonteksRepo.Provider value={{ repo, sesi: status.sesi, peran: status.peran }}>
      <NavigasiPortal peran={status.peran} onKeluar={() => void repo.akun.keluar().then(() => setStatus({ tahap: 'tamu' }))} />
      <LayarRute />
    </KonteksRepo.Provider>
  );
}

function NavigasiPortal({ peran, onKeluar }: { peran: Peran; onKeluar: () => void }) {
  return (
    <nav>
      {MENU_PORTAL.map(menu => (
        <a key={menu.kunci} href={tulisRute({ layar: 'menu', menu: menu.kunci, tab: menu.isi[0]! })}>{menu.label}</a>
      ))}
      <a href={tulisRute({ layar: 'review' })}>Antrean review</a>
      {peran === 'admin' && <a href={tulisRute({ layar: 'peran' })}>Peran</a>}
      <Tombol onClick={onKeluar}>Keluar</Tombol>
    </nav>
  );
}

function LayarRute() {
  const { peran } = useContext(KonteksRepo)!;
  const [rute, setRute] = useState(() => bacaRute(location.hash));
  useEffect(() => {
    const nyalakan = () => setRute(bacaRute(location.hash));
    window.addEventListener('hashchange', nyalakan);
    return () => window.removeEventListener('hashchange', nyalakan);
  }, []);
  if (rute.layar === 'menu') return rute.tab === 'diksi' ? <EditorDiksi /> : <DaftarKonten jenis={rute.tab} />;
  if (rute.layar === 'entri') return <EditorEntri key={rute.entriId} entriId={rute.entriId} />;
  if (rute.layar === 'entriBaru') return <EditorEntri key={`baru-${rute.jenis}`} jenis={rute.jenis} />;
  if (rute.layar === 'review') return <AntreanReview />;
  if (rute.layar === 'peran') return peran === 'admin' ? <KelolaPeran /> : <p>Hanya admin.</p>;
  return <p>Segera</p>;
}
