// Linimasa mode "Langkah demi langkah" untuk munasakhat (bab 12; rencana bagian 3): urutan tahap =
//   pembukaan → [pembagian tiap mayit (pipeline biasa, satu babak tabel per mayit) → "menyambung bagian" ke jami'ah] → hasil akhir.
// Kalimat dari bab munasakhat (munasakhat.ts, templat diksi `narasi.munasakhat.*`); visual penyambungan dan hasil akhir = kotak
// wakil berpenyebut jami'ah, isinya `rincian.sesudah` dari jejak MUNASAKHAT atau saham akhir engine. Tidak ada hitungan fikih di sini.

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import type { Bab } from './cerita.js';
import { buatKonteks } from './context.js';
import { kolomTabel, kotakWakil, tahapBiasa, type IsiKotak, type Langkah, type Linimasa, type Tahap, type Visual } from './linimasa.js';
import {
  AWALAN_SISA, buatSebut, hasilAkhir, penggabungan, pembukaan, sebutPenerima, type BagianMunasakhat, type HasilMunasakhatOk, type LangkahGabungan,
} from './munasakhat.js';
import type { Kamus, Penyusun } from './segments.js';

export function susunLinimasaMunasakhat(hasil: HasilMunasakhatOk, graf: GrafKeluarga, opsi: { kamus: Kamus }): Linimasa {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const sebut = buatSebut(hasil, graf, penyusun);
  const daftarGabungan = hasil.jejak.filter((langkah): langkah is LangkahGabungan => langkah.jenis === 'MUNASAKHAT');
  const tahap: Tahap[] = [tahapDariBab('berantai', pembukaan(hasil, sebut, penyusun))];

  for (const [urutan, langkah] of hasil.daftarLangkah.entries()) {
    // Mayit berikutnya disebut dengan perannya ("anak perempuan"), bukan "almarhumah" (sama dengan jelaskanMunasakhat).
    const grafMayit: GrafKeluarga = {
      ...graf, idPewaris: langkah.mayit,
      orang: urutan === 0 ? graf.orang : { ...graf.orang, [langkah.mayit]: { ...graf.orang[langkah.mayit]!, nama: sebut(langkah.mayit).teks } },
    };
    const konteks = buatKonteks(langkah.hasil, grafMayit, { kamus: opsi.kamus, bahasa: 'id' });
    const awalan = sebut(langkah.mayit).teks;
    // Hanya mayit pertama yang membawa harta; mayit berikutnya membagi saham, jadi kolom rupiahnya (Rp 0) tidak ditampilkan.
    const tanpaNominal = (kode: string) => urutan > 0 && kode.startsWith('nominal:');
    tahap.push(...tahapBiasa(konteks, urutan).map(satu => ({
      ...satu, judul: `${awalan}: ${satu.judul}`,
      langkah: satu.langkah.map(isi => (isi.sel ? { ...isi, sel: isi.sel.filter(kode => !tanpaNominal(kode)) } : isi)),
    })));
    const gabungan = daftarGabungan.find(langkahIni => langkahIni.mayit === langkah.mayit);
    if (gabungan) tahap.push(tahapPenyambung(penggabungan(gabungan, sebut, penyusun), gabungan));
  }
  tahap.push(tahapAkhir(hasilAkhir(hasil, sebut, penyusun), hasil));

  const idDalamRantai = new Set<string>([...Object.keys(hasil.saham), ...daftarGabungan.flatMap(satu => Object.keys(satu.rincian)), ...hasil.daftarLangkah.map(satu => satu.mayit)]);
  const nama = Object.fromEntries([...idDalamRantai].map(id => [id, id.startsWith(AWALAN_SISA)
    ? sebutPenerima(penyusun, id, sebut).map(potongan => potongan.teks).join('') : sebut(id).teks]));
  return { tahap, tabel: hasil.daftarLangkah.map((langkah, urutan) => kolomTabel(langkah.hasil).filter(kolom => urutan === 0 || kolom.kolom !== 'nominal')), nama };
}

// ─── Tahap ────────────────────────────────────────────────────────────────────

const langkahDariBaris = (baris: Bab['daftarBaris'][number]): Langkah => ({ bagian: 'hitung', narasi: baris, papan: baris, refs: baris.refs });

function tahapDariBab(id: Tahap['id'], bagian: BagianMunasakhat): Tahap {
  const bab = bagian.daftarBab[0]!;
  return { id, judul: bagian.judul, langkah: bab.daftarBaris.map(langkahDariBaris) };
}

/** "Menyambung bagian": kotak jami'ah baru berisi `sesudah` tiap orang (jami'ah sebelumnya × wafq mas'alah + saham mayit × wafq saham). */
function tahapPenyambung(bab: Bab, gabungan: LangkahGabungan): Tahap {
  const langkah = bab.daftarBaris.map(langkahDariBaris);
  const isi = Object.entries(gabungan.rincian).map(([id, rincian]): IsiKotak => ({ kelompok: id, anggota: [id], jumlah: rincian.sesudah }));
  langkah[0] = { ...langkah[0]!, visual: kotakJamiah(gabungan.jamiah, isi) };
  return { id: 'menyambung', judul: bab.judul, langkah };
}

function tahapAkhir(bagian: BagianMunasakhat, hasil: HasilMunasakhatOk): Tahap {
  const tahap = tahapDariBab('hasilAkhir', bagian);
  // Ikhtishar = saham yang sudah disederhanakan (sama dengan narasi "diringkas"); baris sisa memakai kunci `sisaKeluar:<mayit>`.
  const isi: IsiKotak[] = Object.entries(hasil.ikhtishar.saham).filter(([, saham]) => saham > 0n).map(([id, saham]) => ({ kelompok: id, anggota: [id], jumlah: saham }));
  return { ...tahap, langkah: [{ ...tahap.langkah[0]!, visual: kotakJamiah(hasil.ikhtishar.jamiah, isi) }, ...tahap.langkah.slice(1)] };
}

function kotakJamiah(jamiah: bigint, isi: IsiKotak[]): Visual {
  const jumlahIsi = isi.reduce((total, satu) => total + satu.jumlah, 0n);
  if (jumlahIsi !== jamiah) throw new Error(`kotak jami'ah tidak pas: Σ isi ${jumlahIsi} ≠ ${jamiah}`);
  return { jenis: 'kotak', ...kotakWakil(jamiah), isi };
}
