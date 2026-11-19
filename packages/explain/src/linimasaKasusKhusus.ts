// Linimasa mode "Langkah demi langkah" untuk kasus khusus bab 13 (rencana bagian 3): taqdir/menunggu (haml, mafqud, khuntsa)
// dan gharqa. Kalimat dari penjelasan bab 13 (kasusKhusus.ts: templat diksi `narasi.taqdir.*`, `narasi.gharqa.*`), satu bab = satu tahap;
// visual = meja "jika terbukti X" (tiap dunia = satu batang saham) dan kotak jami'ah (diberikan sekarang + bagian ditahan).
// Keputusan fikih (aqall, ditahan, lebur, tilad–tharif) sudah ada di jejak engine; di sini hanya disajikan. Tanpa tabel pipeline.

import type { GrafKeluarga, HartaGharqa, KeadaanGharqa } from '@waris/engine';
import type { Bab } from './cerita.js';
import { jelaskanGharqa, sebutGharqa, sebutTaqdir, type GharqaSelesai, type TaqdirOk } from './kasusKhusus.js';
import { babBelumPastiSkrip, babKemungkinanSkrip, babPemberianSkrip } from './skripTaqdir.js';
import { kotakWakil, type IsiKotak, type Langkah, type Linimasa, type Tahap, type Visual } from './linimasa.js';
import { sebutPenerima } from './munasakhat.js';
import type { Kamus, Penyusun } from './segments.js';
import { teksKamus } from './segments.js';

/** Kunci baris "bagian yang ditahan" di kotak jami'ah (bukan orang; sebutannya dari diksi). */
export const KUNCI_DITAHAN = 'ditahan';

export function susunLinimasaTaqdir(hasil: TaqdirOk, graf: GrafKeluarga, opsi: { kamus: Kamus }): Linimasa {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const sebut = sebutTaqdir(graf, hasil, penyusun);
  const meja = (sorot?: number): Visual => ({
    jenis: 'meja', jamiah: hasil.jamiah, ...(sorot === undefined ? {} : { sorot }),
    dunia: hasil.daftarDunia.map(dunia => ({ masalah: dunia.masalah, isi: isiDariSaham(dunia.saham) })),
  });
  const belumPasti = babBelumPastiSkrip(hasil, graf, sebut, penyusun);
  const tahap: Tahap[] = [tahapDariBab('belumPasti', belumPasti.judul, belumPasti)];
  if (hasil.daftarDunia.some(dunia => Object.keys(dunia.taqdir).length > 0)) {
    const kemungkinan = babKemungkinanSkrip(hasil, graf, sebut, penyusun);
    const barisPengantar = kemungkinan.pengantar.map((baris, urut): Langkah => ({ ...langkahDariBaris(baris), ...(urut === 0 ? { visual: meja() } : {}) }));
    const barisDunia = kemungkinan.dunia.flatMap((daftar, nomorDunia) => daftar.map((baris, urut): Langkah => ({ ...langkahDariBaris(baris), ...(urut === 0 ? { visual: meja(nomorDunia) } : {}) })));
    tahap.push({ id: 'kemungkinan', judul: kemungkinan.judul, langkah: [...barisPengantar, ...barisDunia] });
  }
  const pemberian = babPemberianSkrip(hasil, sebut, penyusun);
  tahap.push(tahapPemberian(pemberian, hasil.jamiah, hasil.diberikan, hasil.mauquf));
  return { tahap, tabel: [], nama: nama(penyusun, sebut, [...Object.keys(hasil.diberikan), ...hasil.daftarDunia.flatMap(dunia => Object.keys(dunia.saham))]) };
}

export function susunLinimasaGharqa(hasil: GharqaSelesai, graf: GrafKeluarga, keadaan: KeadaanGharqa, opsi: { kamus: Kamus }): Linimasa {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const [pembukaan, ...bagian] = jelaskanGharqa(hasil, graf, keadaan, opsi).daftarBagian;
  const daftarHarta = hasil.status === 'OK' ? [hasil.harta] : hasil.skenario.map(skenario => skenario.harta);
  const tahap: Tahap[] = [tahapDariBab('wafatBersamaan', pembukaan!.judul, pembukaan!.daftarBab[0]!)];
  // OK: satu bagian berisi bab per harta. MAUQUF: satu bagian per skenario urutan, tiap bab satu harta.
  const daftarBab = hasil.status === 'OK' ? bagian[0]!.daftarBab.map(bab => [bab]) : bagian.map(satu => satu.daftarBab);
  for (const [urutBagian, babBagian] of daftarBab.entries()) {
    for (const [urut, bab] of babBagian.entries()) {
      const harta = daftarHarta[hasil.status === 'OK' ? 0 : urutBagian]![hasil.status === 'OK' ? urutBagian : urut]!;
      const judul = hasil.status === 'OK' ? bab.judul : `${bagian[urutBagian]!.judul}: ${bab.judul}`;
      tahap.push(tahapHarta(judul, bab, harta));
    }
  }
  const semuaId = daftarHarta.flat(2).flatMap(harta => [...Object.keys(harta.saham), harta.mayit]);
  return { tahap, tabel: [], nama: nama(penyusun, sebutGharqa(graf, hasil, penyusun), semuaId) };
}

// ─── Tahap ────────────────────────────────────────────────────────────────────

const langkahDariBaris = (baris: Bab['daftarBaris'][number]): Langkah => ({
  bagian: 'hitung', ...(baris.jenis ? { jenis: baris.jenis } : {}), narasi: baris, papan: baris.papan ? { daftarPotongan: baris.papan, refs: baris.refs } : baris, refs: baris.refs,
});

function tahapDariBab(id: Tahap['id'], judul: string, bab: Bab): Tahap {
  return { id, judul, langkah: bab.daftarBaris.map(langkahDariBaris) };
}

function tahapPemberian(bab: Bab, jamiah: bigint, diberikan: Record<string, bigint>, ditahan: bigint): Tahap {
  const tahap = tahapDariBab('pemberian', bab.judul, bab);
  return { ...tahap, langkah: [{ ...tahap.langkah[0]!, visual: kotakDitahan(jamiah, diberikan, ditahan) }, ...tahap.langkah.slice(1)] };
}

/** Satu harta gharqa: bab penjelasannya + kotak jami'ah harta itu. Harta yang seluruhnya ditahan ([MLK] haml) tanpa kotak. */
function tahapHarta(judul: string, bab: Bab, harta: HartaGharqa): Tahap {
  const tahap = tahapDariBab('harta', judul, bab);
  if (harta.mauqufSemua) return tahap;
  return { ...tahap, langkah: [{ ...tahap.langkah[0]!, visual: kotakDitahan(harta.jamiah, harta.saham, harta.mauquf) }, ...tahap.langkah.slice(1)] };
}

const isiDariSaham = (saham: Record<string, bigint>): IsiKotak[] =>
  Object.entries(saham).filter(([, jumlah]) => jumlah > 0n).map(([id, jumlah]) => ({ kelompok: id, anggota: [id], jumlah }));

function kotakDitahan(jamiah: bigint, diberikan: Record<string, bigint>, ditahan: bigint): Visual {
  const isi = [...isiDariSaham(diberikan), ...(ditahan > 0n ? [{ kelompok: KUNCI_DITAHAN, anggota: [KUNCI_DITAHAN], jumlah: ditahan }] : [])];
  const jumlahIsi = isi.reduce((total, satu) => total + satu.jumlah, 0n);
  if (jumlahIsi !== jamiah) throw new Error(`kotak jami'ah tidak pas: Σ isi ${jumlahIsi} ≠ ${jamiah}`);
  return { jenis: 'kotak', ...kotakWakil(jamiah), isi };
}

function nama(penyusun: Penyusun, sebut: ReturnType<typeof sebutTaqdir>, daftarId: string[]): Record<string, string> {
  return Object.fromEntries([...new Set([...daftarId, KUNCI_DITAHAN])].map(id => [id,
    id === KUNCI_DITAHAN ? teksKamus(penyusun, 'narasi.taqdir.visual.ditahan')
      : sebutPenerima(penyusun, id, sebut).map(potongan => potongan.teks).join('')]));
}

