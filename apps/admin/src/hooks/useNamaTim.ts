// Nama anggota tim untuk riwayat & alasan terkunci (repo.akun.daftarNamaTim). Pengguna sendiri selalu "Anda"; id yang
// belum dikenal (atau selama memuat) ditampilkan sebagai potongan id supaya layar tidak menunggu.
import { useEffect, useState } from 'react';
import { usePortal } from '../repo';

export function useNamaTim(): (userId: string) => string {
  const { repo, sesi } = usePortal();
  const [nama, setNama] = useState<ReadonlyMap<string, string>>(new Map());
  useEffect(() => {
    let dibatalkan = false;
    repo.akun.daftarNamaTim()
      .then(daftar => { if (!dibatalkan) setNama(new Map(daftar.map(baris => [baris.userId, baris.nama]))); })
      .catch(() => { /* nama opsional: tetap tampil potongan id */ });
    return () => { dibatalkan = true; };
  }, [repo]);
  return userId => (userId === sesi.userId ? 'Anda' : nama.get(userId) ?? userId.slice(0, 8));
}
