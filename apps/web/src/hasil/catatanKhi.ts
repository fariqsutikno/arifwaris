// Catatan "kalau menurut KHI" untuk layar Hasil: memilih catatan yang relevan dari kasus dan hasil yang ditampilkan.
// Hanya memilih (engine pilihCatatanKhi, murni); tidak menghitung bagian apa pun. Hasil yang bukan hasil biasa
// (munasakhat, taqdir, gharqa, galat) tetap diperiksa dari grafnya saja: pemicu graf (pengganti, harta bersama) tetap jalan.
import { pilihCatatanKhi, type HasilEngine } from '@waris/engine';
import { cariCatatanKhi, type CatatanKhi } from '@waris/content';
import { keInputEngine, type HasilTampil } from '@waris/latihan';
import { VERSI_ENGINE } from '../versi';
import type { Kasus } from '../kasus';

const TANPA_HASIL: HasilEngine = { status: 'PERLU_INPUT', pertanyaan: [] };

export function catatanKhiUntuk(kasus: Kasus, tampil: HasilTampil): CatatanKhi[] {
  try {
    const hasil = tampil.jenis === 'biasa' ? tampil.hasil : TANPA_HASIL;
    return pilihCatatanKhi(hasil, keInputEngine(kasus, VERSI_ENGINE)).map(cariCatatanKhi);
  } catch {
    return [];
  }
}
