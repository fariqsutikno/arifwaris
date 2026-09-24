import type { HasilEngine, GrafKeluarga, KunciAhliWaris, PeranAhliWaris, IdOrang } from '@waris/engine';
import { joinAnd, type Segment } from './segments.js';

type Ok = Extract<HasilEngine, { status: 'OK' }>;

// Padanan sehari-hari kode peran bab 3.1–3.2.
export const ROLE_LABEL: Record<KunciAhliWaris, string> = {
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
const ANCESTOR_OF_DECEASED = ['', '', '', 'ayah', 'kakek'];

/** Sebutan peran; paman/anak paman di atas generasi ayah diberi keterangan leluhurnya ("paman kandung ayah"). */
export function roleLabel(peran: PeranAhliWaris): string {
  const dasar = peran.kunci in ROLE_LABEL ? ROLE_LABEL[peran.kunci as KunciAhliWaris] : 'kerabat';
  const generasi = peran.kekerabatan.generasiLeluhur;
  if (!/^(PAMAN|SEPUPU)_/.test(peran.kunci) || generasi < 3) return dasar;
  return `${dasar} ${ANCESTOR_OF_DECEASED[generasi] ?? `leluhur ke-${generasi - 1}`}`;
}

const ORDINAL = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];
const COLLECTIVE = ['', '', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];

export interface People {
  /** Sebutan satu/beberapa orang. Sebutan pertama orang bernama memperkenalkan perannya. */
  mention(ids: IdOrang[]): Segment;
  pewaris(): Segment;
  roleOf(id: IdOrang): PeranAhliWaris | undefined;
}

/**
 * Sebutan orang untuk narasi; id internal tidak pernah tampil.
 * - Bernama: "Fatimah (anak perempuan)" lalu "Fatimah".
 * - Tanpa nama: "anak perempuan" bila perannya tunggal, "anak perempuan kedua" bila lebih dari satu (urutan input);
 *   seluruh anggota satu peran sekaligus → "kedua anak perempuan".
 */
export function makePeople(hasil: Ok, graf: GrafKeluarga): People {
  const roleOf = (id: IdOrang) => {
    const status = hasil.statusOrang[id];
    return status && 'peran' in status ? status.peran : undefined;
  };
  const labelOf = (id: IdOrang) => {
    const peran = roleOf(id);
    return peran ? roleLabel(peran) : 'kerabat';
  };
  const sameRole = new Map<string, IdOrang[]>();
  for (const id of Object.keys(graf.orang)) {
    if (!roleOf(id)) continue;
    sameRole.set(labelOf(id), [...(sameRole.get(labelOf(id)) ?? []), id]);
  }
  const mentioned = new Set<IdOrang>();

  const single = (id: IdOrang): string => {
    const nama = graf.orang[id]?.nama;
    const label = labelOf(id);
    if (nama) return mentioned.has(id) ? nama : `${nama} (${label})`;
    const peers = sameRole.get(label) ?? [id];
    return peers.length === 1 ? label : `${label} ${ORDINAL[peers.indexOf(id)] ?? `ke-${peers.indexOf(id) + 1}`}`;
  };

  const mention = (ids: IdOrang[]): Segment => {
    const label = labelOf(ids[0]!);
    const peers = sameRole.get(label) ?? [];
    const wholeRole = ids.length > 1 && ids.length === peers.length && ids.every(id => labelOf(id) === label)
      && ids.every(id => !graf.orang[id]?.nama);
    const text = wholeRole
      ? `${COLLECTIVE[ids.length] ?? ids.length} ${label}`
      : joinAnd(ids.map(id => [{ jenis: 'text' as const, text: single(id) }])).map(p => p.text).join('');
    ids.forEach(id => mentioned.add(id));
    return { jenis: 'orangIni', daftarIdOrang: ids, text };
  };

  const pewaris = (): Segment => {
    const orangIni = graf.orang[graf.idPewaris]!;
    return { jenis: 'orangIni', daftarIdOrang: [orangIni.id], text: orangIni.nama ?? (orangIni.jenisKelamin === 'L' ? 'almarhum' : 'almarhumah') };
  };

  return { mention, pewaris, roleOf };
}
