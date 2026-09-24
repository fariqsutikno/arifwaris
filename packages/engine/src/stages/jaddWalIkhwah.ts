import { bandingkan, pecahan, kali, kurang, type Pecahan } from '@waris/math';
import type { PilihanJadd, IdOrang, LangkahJejak } from '../types.js';
import { isMale, makeGroup, unitOf, type AhliWaris, type KelompokBagian, type Unsupported } from './model.js';

const ONE = pecahan(1n);
const SUDUS = pecahan(1n, 6n);
const NISF = pecahan(1n, 2n);
const TSULUTS = pecahan(1n, 3n);

const unitWeights = (daftarAhliWaris: AhliWaris[]): Record<IdOrang, bigint> => Object.fromEntries(daftarAhliWaris.map(h => [h.idOrang, unitOf(h)]));
const ashabahType = (daftarAhliWaris: AhliWaris[]) => (daftarAhliWaris.some(h => !isMale(h)) ? 'bilGhair' as const : 'binNafsi' as const);

/**
 * Bab 08 [SYF], algoritma 8.6: kakek bersama saudara kandung/sebapak. Dipanggil setelah semua furudh
 * lain ditetapkan; `furudhSum` = jumlahnya. Akdariyyah ditangani pemanggil (pola furudh khusus).
 */
export function jaddWalIkhwah(
  jadd: AhliWaris,
  saudaraSaudara: AhliWaris[],
  furudhSum: Pecahan,
  hasFaruMuannats: boolean,
): { kelompokKelompok: KelompokBagian[]; jejak: LangkahJejak[] } | Unsupported {
  if (hasFaruMuannats && !saudaraSaudara.some(isMale)) {
    return {
      status: 'TIDAK_DIDUKUNG',
      alasan: "Kakek bersama saudari yang menjadi ashabah ma'al ghair (ada anak/cucu pr) belum dirinci KB bab 08.",
      refs: ['R08-3'],
    };
  }

  const kelompokKelompok: KelompokBagian[] = [];
  const jejak: LangkahJejak[] = [];
  const sisa = kurang(ONE, furudhSum);
  const units = saudaraSaudara.reduce((sum, h) => sum + unitOf(h), 0n);

  // [R08-3] sisa ≤ 1/6: kakek 1/6 (dengan 'aul bila perlu), saudara gugur — tetap dicatat sebagai ashabah tanpa sisa.
  if (furudhSum.n > 0n && bandingkan(sisa, SUDUS) <= 0) {
    kelompokKelompok.push(makeGroup('KAKEK', { [jadd.idOrang]: 1n }, { jenis: 'fardh', fardh: SUDUS }));
    jejak.push({ tahap: 'furudh', refs: ['R08-3'], jenis: 'FARDH', kelompok: 'KAKEK', fardh: SUDUS,
      alasan: { code: 'JADD_SISA_SEDIKIT', sisa } });
    kelompokKelompok.push(makeGroup('IKHWAH', unitWeights(saudaraSaudara), { jenis: 'ashabah', type: ashabahType(saudaraSaudara) }));
    jejak.push({ tahap: 'ashabah', refs: ['R08-3'], jenis: 'ASHABAH', kelompok: 'IKHWAH', type: ashabahType(saudaraSaudara) });
    return { kelompokKelompok, jejak };
  }

  // [R08-2] tanpa furudh: terbaik dari muqasamah dan 1/3; [R08-3] dengan furudh: + 1/3 sisa dan 1/6.
  // Seri → muqasamah didahulukan (bab 8.2 "pilih muqasamah secara default").
  const muqasamah = kali(sisa, pecahan(2n, 2n + units));
  const opsi: Array<[PilihanJadd, Pecahan]> = furudhSum.n === 0n
    ? [['muqasamah', muqasamah], ['tsuluts', TSULUTS]]
    : [['muqasamah', muqasamah], ['tsulutsBaqi', kali(sisa, TSULUTS)], ['sudus', SUDUS]];
  const [pilihan, bagianKakek] = opsi.reduce((best, opt) => (bandingkan(opt[1], best[1]) > 0 ? opt : best));
  const refs = [furudhSum.n === 0n ? 'R08-2' : 'R08-3'];
  const pilihanJadd = {
    code: 'JADD_WAL_IKHWAH' as const, sisa, opsi: opsi.map(([nama, nilai]) => ({ nama, nilai })), terpilih: pilihan,
  };

  const kandung = saudaraSaudara.filter(h => h.kunci === 'SAUDARA_KANDUNG' || h.kunci === 'SAUDARI_KANDUNG');
  const sebapak = saudaraSaudara.filter(h => h.kunci === 'SAUDARA_SEBAPAK' || h.kunci === 'SAUDARI_SEBAPAK');
  const muaddah = kandung.length > 0 && sebapak.length > 0;

  if (pilihan === 'muqasamah' && !muaddah) {
    // Kakek dihitung sebagai satu saudara lk dalam ashabah yang sama.
    const anggota = [jadd, ...saudaraSaudara];
    kelompokKelompok.push(makeGroup('JADD_IKHWAH', unitWeights(anggota), { jenis: 'ashabah', type: ashabahType(saudaraSaudara) }));
    jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: 'JADD_IKHWAH', type: ashabahType(saudaraSaudara), pilihanJadd });
    return { kelompokKelompok, jejak };
  }

  kelompokKelompok.push(makeGroup('KAKEK', { [jadd.idOrang]: 1n }, pilihan === 'sudus'
    ? { jenis: 'fardh', fardh: SUDUS }
    : { jenis: 'fixed', nilai: bagianKakek, basis: pilihan }));
  jejak.push({ tahap: 'furudh', refs, jenis: 'FARDH', kelompok: 'KAKEK', fardh: bagianKakek, alasan: pilihanJadd });

  if (!muaddah) {
    kelompokKelompok.push(makeGroup('IKHWAH', unitWeights(saudaraSaudara), { jenis: 'ashabah', type: ashabahType(saudaraSaudara) }));
    jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: 'IKHWAH', type: ashabahType(saudaraSaudara) });
    return { kelompokKelompok, jejak };
  }

  // [R08-4] mu'addah: sebapak ikut dihitung melawan kakek, lalu bagiannya kembali ke kandung.
  jejak.push({ tahap: 'ashabah', refs: ['R08-4'], jenis: 'KASUS_KHUSUS', nama: 'muaddah' });
  const [onlyKandung] = kandung;
  if (kandung.length === 1 && onlyKandung && !isMale(onlyKandung)) {
    // [R08-4] saudari kandung tunggal mengambil hingga 1/2; lebihnya untuk sebapak.
    const bagianSaudara = kurang(sisa, bagianKakek);
    const bagianUkht = bandingkan(bagianSaudara, NISF) < 0 ? bagianSaudara : NISF;
    kelompokKelompok.push(makeGroup('SAUDARI_KANDUNG', { [onlyKandung.idOrang]: 1n }, { jenis: 'fixed', nilai: bagianUkht, basis: 'muaddah' }));
    kelompokKelompok.push(makeGroup('IKHWAH', unitWeights(sebapak), { jenis: 'ashabah', type: ashabahType(sebapak) }));
    jejak.push({ tahap: 'ashabah', refs: ['R08-4'], jenis: 'ASHABAH', kelompok: 'IKHWAH', type: ashabahType(sebapak) });
    return { kelompokKelompok, jejak };
  }

  const bobot = { ...unitWeights(kandung), ...Object.fromEntries(sebapak.map(h => [h.idOrang, 0n])) };
  kelompokKelompok.push(makeGroup('IKHWAH', bobot, { jenis: 'ashabah', type: ashabahType(kandung) }));
  jejak.push({ tahap: 'ashabah', refs: ['R08-4'], jenis: 'ASHABAH', kelompok: 'IKHWAH', type: ashabahType(kandung) });
  return { kelompokKelompok, jejak };
}
