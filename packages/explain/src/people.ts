// Cara menyebut orang dalam narasi; id internal tidak pernah tampil.
//   bernama   → "Fatimah (anak perempuan)" pertama kali, lalu "Fatimah".
//   tanpa nama → "anak perempuan", atau "anak perempuan kedua" bila perannya tidak tunggal;
//                satu peran disebut sekaligus → "kedua anak perempuan".

import type { HasilEngine, GrafKeluarga, KunciAhliWaris, PeranAhliWaris, IdOrang } from '@waris/engine';
import { gabungDan, teksKamus, type Penyusun, type Potongan } from './segments.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

// Padanan sehari-hari kode peran bab 3.1–3.2: diksi `narasi.umum.ahli_waris.<kunci>`.
const labelDasar = (penyusun: Penyusun, kunci: string): string =>
  teksKamus(penyusun, kunci in PERAN_BERLABEL ? `narasi.umum.ahli_waris.${kunci.toLowerCase()}` : 'narasi.umum.kerabat');

const PERAN_BERLABEL: Record<KunciAhliWaris, true> = {
  ANAK_LK: true, CUCU_LK: true, AYAH: true, KAKEK: true, SAUDARA_KANDUNG: true, SAUDARA_SEBAPAK: true, SAUDARA_SEIBU: true,
  KEPONAKAN_KANDUNG: true, KEPONAKAN_SEBAPAK: true, PAMAN_KANDUNG: true, PAMAN_SEBAPAK: true, SEPUPU_KANDUNG: true,
  SEPUPU_SEBAPAK: true, SUAMI: true, MUTIQ: true, ANAK_PR: true, CUCU_PR: true, IBU: true, NENEK_DARI_IBU: true,
  NENEK_DARI_AYAH: true, SAUDARI_KANDUNG: true, SAUDARI_SEBAPAK: true, SAUDARI_SEIBU: true, ISTRI: true, MUTIQAH: true,
};

// [R03-2] paman & anak paman mencakup paman ayah/kakek (generasiLeluhur 3, 4, …); «عم أب» = paman ayah.
const GENERASI_LELUHUR_BERNAMA = [3, 4];

/** Sebutan peran; paman/anak paman di atas generasi ayah diberi keterangan leluhurnya ("paman kandung ayah"). */
export function labelPeran(penyusun: Penyusun, peran: PeranAhliWaris): string {
  const dasar = labelDasar(penyusun, peran.kunci);
  const generasi = peran.kekerabatan.generasiLeluhur;
  if (!/^(PAMAN|SEPUPU)_/.test(peran.kunci) || generasi < 3) return dasar;
  const leluhur = GENERASI_LELUHUR_BERNAMA.includes(generasi)
    ? teksKamus(penyusun, `narasi.umum.leluhur.${generasi}`)
    : teksKamus(penyusun, 'narasi.umum.leluhur.lain', { nomor: String(generasi - 1) });
  return `${dasar} ${leluhur}`;
}

const JUMLAH_URUTAN_BERNAMA = 10;

/** "pertama", "kedua", … lalu "ke-11". */
export function urutanKe(penyusun: Penyusun, indeks: number): string {
  return indeks < JUMLAH_URUTAN_BERNAMA
    ? teksKamus(penyusun, `narasi.umum.urutan_ke.${indeks + 1}`)
    : teksKamus(penyusun, 'narasi.umum.urutan_ke.lain', { nomor: String(indeks + 1) });
}

/** "kedua", "ketiga", … (kedua anak perempuan); di atas sepuluh cukup angkanya. */
const kolektif = (penyusun: Penyusun, jumlah: number): string =>
  jumlah >= 2 && jumlah <= JUMLAH_URUTAN_BERNAMA ? teksKamus(penyusun, `narasi.umum.kolektif.${jumlah}`) : String(jumlah);

export interface Sebutan {
  /** Sebutan satu/beberapa orang. Sebutan pertama orang bernama memperkenalkan perannya. */
  sebut(ids: IdOrang[]): Potongan;
  pewaris(): Potongan;
  peranDari(id: IdOrang): PeranAhliWaris | undefined;
}

export function buatSebutan(hasil: HasilOk, graf: GrafKeluarga, penyusun: Penyusun): Sebutan {
  const peranDari = (id: IdOrang) => {
    const status = hasil.statusOrang[id];
    return status && 'peran' in status ? status.peran : undefined;
  };
  const labelDari = (id: IdOrang) => {
    const peran = peranDari(id);
    return peran ? labelPeran(penyusun, peran) : teksKamus(penyusun, 'narasi.umum.kerabat');
  };
  const peranSama = new Map<string, IdOrang[]>();
  for (const id of Object.keys(graf.orang)) {
    if (!peranDari(id)) continue;
    peranSama.set(labelDari(id), [...(peranSama.get(labelDari(id)) ?? []), id]);
  }
  const sudahDisebut = new Set<IdOrang>();

  const tunggal = (id: IdOrang): string => {
    const nama = graf.orang[id]?.nama;
    const label = labelDari(id);
    if (nama) return sudahDisebut.has(id) ? nama : `${nama} (${label})`;
    const sePeran = peranSama.get(label) ?? [id];
    return sePeran.length === 1 ? label : `${label} ${urutanKe(penyusun, sePeran.indexOf(id))}`;
  };

  const sebut = (ids: IdOrang[]): Potongan => {
    const label = labelDari(ids[0]!);
    const sePeran = peranSama.get(label) ?? [];
    const seluruhPeran = ids.length > 1 && ids.length === sePeran.length && ids.every(id => labelDari(id) === label)
      && ids.every(id => !graf.orang[id]?.nama);
    const teks = seluruhPeran
      ? `${kolektif(penyusun, ids.length)} ${label}`
      : gabungDan(penyusun, ids.map(id => [{ jenis: 'teks' as const, teks: tunggal(id) }])).map(potonganIni => potonganIni.teks).join('');
    ids.forEach(id => sudahDisebut.add(id));
    return { jenis: 'orang', daftarIdOrang: ids, teks };
  };

  const pewaris = (): Potongan => {
    const orangIni = graf.orang[graf.idPewaris]!;
    return { jenis: 'orang', daftarIdOrang: [orangIni.id], teks: orangIni.nama ?? teksKamus(penyusun, `narasi.umum.pewaris.${orangIni.jenisKelamin.toLowerCase()}`) };
  };

  return { sebut, pewaris, peranDari };
}
