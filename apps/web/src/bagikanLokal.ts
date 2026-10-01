// Id riwayat kasus yang sedang dibagikan dari perangkat ini, supaya perubahan kasus hanya dikirim ke server bila memang dibagikan.
// Sumber kebenarannya tetap tabel kasus_dibagikan; ini cuma penanda untuk menghemat permintaan.

import { bacaMentah, simpanMentah } from './penyimpanan';

const KUNCI_DIBAGIKAN = 'arif-waris:dibagikan';

function bacaDaftar(): string[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_DIBAGIKAN) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export const sudahDibagikan = (idRiwayat: string): boolean => bacaDaftar().includes(idRiwayat);

export function tandaiDibagikan(idRiwayat: string, dibagikan: boolean): void {
  const lain = bacaDaftar().filter(id => id !== idRiwayat);
  simpanMentah(KUNCI_DIBAGIKAN, JSON.stringify(dibagikan ? [...lain, idRiwayat] : lain));
}
