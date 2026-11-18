// Rantai munasakhat untuk tampilan (bab 12): berapa bagian harta mayit pertama yang sampai ke tiap mayit, diteruskan ke siapa,
// dan kolom penggabungan jami'ah (KB 12.3). Angka dari engine: tabel tiap mayit (daftarLangkah) dan jejak MUNASAKHAT;
// di sini hanya dirangkai. Jami'ah akhir dicocokkan ke hasil engine; beda = throw (invarian), bukan lanjut diam-diam.

import type { IdOrang, LangkahJejak } from '@waris/engine';
import { penyebutAkhir } from '../format';
import type { HasilMunasakhatOk } from '../jalankan';

export type JejakGabung = Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }>;

export interface BagianLangkah {
  id: IdOrang;
  /** Saham orang ini di mas'alah mayit langkah ini. */
  saham: bigint;
  fardh: { n: bigint; d: bigint } | undefined;
  /** Rupiah dari langkah ini saja (dibulatkan ke bawah ke satuan pembulatan). */
  nominal: bigint;
  /** Orang ini juga wafat sebelum pembagian: bagiannya dibagi lagi di langkah ke-n (mulai 1). */
  diteruskanDiLangkah: number | undefined;
}

export interface LangkahRantai {
  mayit: IdOrang;
  masalah: bigint;
  /** Rupiah dari harta mayit pertama yang sampai ke mayit ini (mayit pertama: seluruh harta bersih). */
  nominalMasuk: bigint;
  /** Mayit sebelumnya yang meneruskan bagian kepadanya. */
  dari: IdOrang[];
  daftarBagian: BagianLangkah[];
  /** Penggabungan ke jami'ah; tidak ada untuk mayit pertama. */
  gabung: JejakGabung | undefined;
}

export function rantaiMunasakhat(hasil: HasilMunasakhatOk, hartaBersih: bigint, satuan: bigint): LangkahRantai[] {
  const gabungan = new Map(hasil.jejak.flatMap(langkah => (langkah.jenis === 'MUNASAKHAT' ? [[langkah.mayit, langkah] as const] : [])));
  const langkahKe = new Map(hasil.daftarLangkah.map(({ mayit }, indeks) => [mayit, indeks + 1]));
  const rupiah = (pembilang: bigint, penyebut: bigint) => hartaBersih * pembilang / penyebut / satuan * satuan;

  const rantai = hasil.daftarLangkah.map(({ mayit, hasil: hasilMayit }, indeks): LangkahRantai => {
    const gabung = indeks === 0 ? undefined : gabungan.get(mayit);
    if (indeks > 0 && !gabung) throw new Error(`invarian munasakhat: penggabungan ${mayit} tidak ada di jejak`);
    const masalah = penyebutAkhir(hasilMayit.tabel);
    if (gabung && gabung.masalah !== masalah) throw new Error(`invarian munasakhat: mas'alah ${mayit} ${masalah} ≠ jejak ${gabung.masalah}`);
    // [R12-2] bagian mayit di jami'ah sebelum digabung: saham ÷ (jami'ah sesudah ÷ pengali jami'ah lama).
    const masuk = gabung ? { n: gabung.saham, d: gabung.jamiah / gabung.wafqMasalah } : { n: 1n, d: 1n };
    const daftarBagian = hasilMayit.tabel.baris.flatMap(baris => Object.entries(baris.perOrang).filter(([, orang]) => orang.saham > 0n).map(([id, orang]): BagianLangkah => {
      const ke = langkahKe.get(id);
      return { id, saham: orang.saham, fardh: baris.fardh, nominal: rupiah(masuk.n * orang.saham, masuk.d * masalah), diteruskanDiLangkah: ke && ke > indeks + 1 ? ke : undefined };
    }));
    return { mayit, masalah, nominalMasuk: rupiah(masuk.n, masuk.d), dari: [], daftarBagian, gabung };
  });
  for (const langkah of rantai) {
    langkah.dari = rantai.filter(lain => lain.daftarBagian.some(bagian => bagian.id === langkah.mayit && bagian.diteruskanDiLangkah)).map(lain => lain.mayit);
  }
  cocokkanJamiah(hasil, rantai);
  return rantai;
}

/** Kolom jami'ah terakhir harus sama persis dengan jami'ah dan saham akhir engine. */
function cocokkanJamiah(hasil: HasilMunasakhatOk, rantai: LangkahRantai[]): void {
  const akhir = rantai.filter(langkah => langkah.gabung).at(-1)?.gabung;
  const jamiah = akhir?.jamiah ?? rantai[0]!.masalah;
  if (jamiah !== hasil.jamiah) throw new Error(`invarian munasakhat: jami'ah tabel ${jamiah} ≠ engine ${hasil.jamiah}`);
  for (const [id, saham] of Object.entries(hasil.saham)) {
    const diTabel = akhir ? akhir.rincian[id]?.sesudah ?? 0n : rantai[0]!.daftarBagian.find(bagian => bagian.id === id)?.saham ?? 0n;
    if (diTabel !== saham) throw new Error(`invarian munasakhat: saham ${id} di tabel ${diTabel} ≠ engine ${saham}`);
  }
}
