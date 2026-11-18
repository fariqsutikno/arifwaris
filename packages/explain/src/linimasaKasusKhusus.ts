// Linimasa mode "Langkah demi langkah" untuk kasus khusus bab 13 (rencana bagian 3): taqdir/menunggu (haml, mafqud, khuntsa)
// dan gharqa. Kalimat dari penjelasan bab 13 (kasusKhusus.ts: templat diksi `narasi.taqdir.*`, `narasi.gharqa.*`), satu bab = satu tahap;
// visual = meja "jika terbukti X" (tiap dunia = satu batang saham) dan kotak jami'ah (diberikan sekarang + bagian ditahan).
// Keputusan fikih (aqall, ditahan, lebur, tilad–tharif) sudah ada di jejak engine; di sini hanya disajikan. Tanpa tabel pipeline.

import type { GrafKeluarga, HartaGharqa, KeadaanGharqa } from '@waris/engine';
import type { Bab } from './cerita.js';
import { jelaskanGharqa, jelaskanTaqdir, sebutGharqa, sebutTaqdir, type GharqaSelesai, type TaqdirOk } from './kasusKhusus.js';
import { kotakWakil, type IsiKotak, type Langkah, type Linimasa, type Tahap, type Visual } from './linimasa.js';
import type { BagianMunasakhat } from './munasakhat.js';
import { sebutPenerima } from './munasakhat.js';
import type { Kamus, Penyusun } from './segments.js';
import { teksKamus } from './segments.js';

/** Kunci baris "bagian yang ditahan" di kotak jami'ah (bukan orang; sebutannya dari diksi). */
export const KUNCI_DITAHAN = 'ditahan';

export function susunLinimasaTaqdir(hasil: TaqdirOk, graf: GrafKeluarga, opsi: { kamus: Kamus }): Linimasa {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const penjelasan = jelaskanTaqdir(hasil, graf, opsi);
  const [pembukaan, ...sisa] = penjelasan.daftarBagian;
  const pembagian = sisa.at(-1)!;
  const kemungkinan = sisa.length > 1 ? sisa[0] : undefined;
  const meja = (sorot?: number): Visual => ({
    jenis: 'meja', jamiah: hasil.jamiah, ...(sorot === undefined ? {} : { sorot }),
    dunia: hasil.daftarDunia.map(dunia => ({ masalah: dunia.masalah, isi: isiDariSaham(dunia.saham) })),
  });
  const tahap: Tahap[] = [tahapDariBab('belumPasti', pembukaan!.judul, pembukaan!.daftarBab[0]!)];
  if (kemungkinan) tahap.push({ id: 'kemungkinan', judul: kemungkinan.judul, langkah: kemungkinan.daftarBab.flatMap((bab, nomorDunia) =>
    bab.daftarBaris.map((baris, urut): Langkah => ({ ...langkahDariBaris(baris), ...(urut === 0 ? { visual: meja(nomorDunia) } : {}) }))) });
  tahap.push(tahapPemberian(pembagian, hasil.jamiah, hasil.diberikan, hasil.mauquf));
  return { tahap, tabel: [], nama: nama(penyusun, sebutTaqdir(graf, hasil, penyusun), [...Object.keys(hasil.diberikan), ...hasil.daftarDunia.flatMap(dunia => Object.keys(dunia.saham))]) };
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

const langkahDariBaris = (baris: Bab['daftarBaris'][number]): Langkah => ({ bagian: 'hitung', narasi: baris, papan: baris, refs: baris.refs });

function tahapDariBab(id: Tahap['id'], judul: string, bab: Bab): Tahap {
  return { id, judul, langkah: bab.daftarBaris.map(langkahDariBaris) };
}

function tahapPemberian(bagian: BagianMunasakhat, jamiah: bigint, diberikan: Record<string, bigint>, ditahan: bigint): Tahap {
  const tahap = tahapDariBab('pemberian', bagian.judul, bagian.daftarBab[0]!);
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

