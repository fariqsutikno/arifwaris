// Nama pembuat/pemeriksa revisi untuk ditampilkan. Semua peran melihat "Anda" untuk dirinya sendiri; nama/email orang
// lain hanya bisa dibaca admin (daftar_peran dijaga admin di database), peran lain melihat "penulis lain".
import { useEffect, useState } from 'react';
import { usePortal } from './repo';

export function useNamaPengguna(): (userId: string) => string {
  const { repo, sesi, peran } = usePortal();
  const [nama, setNama] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    if (peran !== 'admin') return;
    let dibatalkan = false;
    repo.akun.daftarPeran()
      .then(daftar => { if (!dibatalkan) setNama(new Map(daftar.map(baris => [baris.userId, baris.nama ?? baris.email]))); })
      .catch(() => { /* nama hanya pelengkap; tetap tampil "pengguna lain" */ });
    return () => { dibatalkan = true; };
  }, [repo, peran]);

  return userId => (userId === sesi.userId ? 'Anda' : nama.get(userId) ?? (peran === 'admin' ? 'pengguna lain' : 'penulis lain'));
}
