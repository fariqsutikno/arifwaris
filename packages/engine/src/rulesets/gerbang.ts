// Gerbang ruleset (bab 18 header): hasil madzhab non-[SYF] hanya sah bila setiap token Rxx-y yang dipakai
// tercantum "ya" di KB 18.4 untuk madzhab itu. Kode Kxx-y (sel matriks) selalu sah.
import type { HasilEngine, InputEngine, Ruleset } from '../types.js';
import { BERLAKU_LINTAS_MADZHAB } from './berlaku.js';
import { ATURAN } from './madzhab.js';

type TidakDidukung = Extract<HasilEngine, { status: 'TIDAK_DIDUKUNG' }>;
type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

const NAMA_MADZHAB: Record<Ruleset, string> = { syafii: "Syafi'i", hanbali: 'Hanbali', hanafi: 'Hanafi', maliki: 'Maliki' };
const KODE_KHILAF = /^K\d{2}[a-d]?-\d+$/;

export function periksaKonfigurasi(input: InputEngine): TidakDidukung | undefined {
  const aturan = ATURAN[input.ruleset];
  if (!aturan.kebijakanSisaSah.includes(input.konfigurasi.kebijakanSisa)) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Kebijakan sisa "${input.konfigurasi.kebijakanSisa}" tidak dikenal dalam madzhab ${NAMA_MADZHAB[input.ruleset]}.`, refs: ['K09-1'] };
  }
  // [K02-3] qaul qadim adalah khilaf internal Syafi'iyyah.
  if (input.ruleset !== 'syafii' && input.konfigurasi.talakBainSaatMaradh === 'qaulQadim') {
    return { status: 'TIDAK_DIDUKUNG', alasan: "Pilihan qaul qadim hanya ada dalam madzhab Syafi'i.", refs: ['K02-3'] };
  }
  return undefined;
}

export function periksaKeberlakuan(ruleset: Ruleset, hasil: HasilOk): TidakDidukung | undefined {
  if (ruleset === 'syafii') return undefined;
  const berlaku = BERLAKU_LINTAS_MADZHAB[ruleset];
  const dipakai = new Set([
    ...hasil.jejak.flatMap(langkah => langkah.refs),
    ...Object.values(hasil.statusOrang).flatMap(status => ('rujukanAturan' in status && status.rujukanAturan ? [status.rujukanAturan] : [])),
  ]);
  const belumDikaji = [...dipakai].filter(kode => !KODE_KHILAF.test(kode) && !berlaku.has(kode)).sort();
  if (belumDikaji.length === 0) return undefined;
  return {
    status: 'TIDAK_DIDUKUNG',
    alasan: `Kasus ini menyentuh aturan yang belum dikaji untuk madzhab ${NAMA_MADZHAB[ruleset]}: ${belumDikaji.join(', ')}.`,
    refs: belumDikaji,
  };
}
