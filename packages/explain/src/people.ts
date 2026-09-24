// Cara menyebut orang dalam narasi; id internal tidak pernah tampil.
//   bernama   → "Fatimah (anak perempuan)" pertama kali, lalu "Fatimah".
//   tanpa nama → "anak perempuan", atau "anak perempuan kedua" bila perannya tidak tunggal;
//                satu peran disebut sekaligus → "kedua anak perempuan".

import type { HasilEngine, GrafKeluarga, KunciAhliWaris, PeranAhliWaris, IdOrang } from '@waris/engine';
import { gabungDan, type Potongan } from './segments.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

// Padanan sehari-hari kode peran bab 3.1–3.2.
export const LABEL_PERAN: Record<KunciAhliWaris, string> = {
  ANAK_LK: 'anak laki-laki', CUCU_LK: 'cucu laki-laki dari anak laki-laki', AYAH: 'ayah', KAKEK: 'kakek',
  SAUDARA_KANDUNG: 'saudara laki-laki kandung', SAUDARA_SEBAPAK: 'saudara laki-laki sebapak', SAUDARA_SEIBU: 'saudara laki-laki seibu',
  KEPONAKAN_KANDUNG: 'anak laki-laki saudara kandung', KEPONAKAN_SEBAPAK: 'anak laki-laki saudara sebapak',
  PAMAN_KANDUNG: 'paman kandung', PAMAN_SEBAPAK: 'paman sebapak', SEPUPU_KANDUNG: 'anak laki-laki paman kandung',
  SEPUPU_SEBAPAK: 'anak laki-laki paman sebapak', SUAMI: 'suami', MUTIQ: "mu'tiq",
  ANAK_PR: 'anak perempuan', CUCU_PR: 'cucu perempuan dari anak laki-laki', IBU: 'ibu',
  NENEK_DARI_IBU: 'nenek dari pihak ibu', NENEK_DARI_AYAH: 'nenek dari pihak ayah',
  SAUDARI_KANDUNG: 'saudara perempuan kandung', SAUDARI_SEBAPAK: 'saudara perempuan sebapak', SAUDARI_SEIBU: 'saudara perempuan seibu',
  ISTRI: 'istri', MUTIQAH: "mu'tiqah",
};

// [R03-2] paman & anak paman mencakup paman ayah/kakek (generasiLeluhur 3, 4, …); «عم أب» = paman ayah.
const LELUHUR_PEWARIS = ['', '', '', 'ayah', 'kakek'];

/** Sebutan peran; paman/anak paman di atas generasi ayah diberi keterangan leluhurnya ("paman kandung ayah"). */
export function labelPeran(peran: PeranAhliWaris): string {
  const dasar = peran.kunci in LABEL_PERAN ? LABEL_PERAN[peran.kunci as KunciAhliWaris] : 'kerabat';
  const generasi = peran.kekerabatan.generasiLeluhur;
  if (!/^(PAMAN|SEPUPU)_/.test(peran.kunci) || generasi < 3) return dasar;
  return `${dasar} ${LELUHUR_PEWARIS[generasi] ?? `leluhur ke-${generasi - 1}`}`;
}

const URUTAN_KE = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];
const KOLEKTIF = ['', '', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];

export interface Sebutan {
  /** Sebutan satu/beberapa orang. Sebutan pertama orang bernama memperkenalkan perannya. */
  sebut(ids: IdOrang[]): Potongan;
  pewaris(): Potongan;
  peranDari(id: IdOrang): PeranAhliWaris | undefined;
}

export function buatSebutan(hasil: HasilOk, graf: GrafKeluarga): Sebutan {
  const peranDari = (id: IdOrang) => {
    const status = hasil.statusOrang[id];
    return status && 'peran' in status ? status.peran : undefined;
  };
  const labelDari = (id: IdOrang) => {
    const peran = peranDari(id);
    return peran ? labelPeran(peran) : 'kerabat';
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
    return sePeran.length === 1 ? label : `${label} ${URUTAN_KE[sePeran.indexOf(id)] ?? `ke-${sePeran.indexOf(id) + 1}`}`;
  };

  const sebut = (ids: IdOrang[]): Potongan => {
    const label = labelDari(ids[0]!);
    const sePeran = peranSama.get(label) ?? [];
    const seluruhPeran = ids.length > 1 && ids.length === sePeran.length && ids.every(id => labelDari(id) === label)
      && ids.every(id => !graf.orang[id]?.nama);
    const teks = seluruhPeran
      ? `${KOLEKTIF[ids.length] ?? ids.length} ${label}`
      : gabungDan(ids.map(id => [{ jenis: 'teks' as const, teks: tunggal(id) }])).map(potonganIni => potonganIni.teks).join('');
    ids.forEach(id => sudahDisebut.add(id));
    return { jenis: 'orang', daftarIdOrang: ids, teks };
  };

  const pewaris = (): Potongan => {
    const orangIni = graf.orang[graf.idPewaris]!;
    return { jenis: 'orang', daftarIdOrang: [orangIni.id], teks: orangIni.nama ?? (orangIni.jenisKelamin === 'L' ? 'almarhum' : 'almarhumah') };
  };

  return { sebut, pewaris, peranDari };
}
