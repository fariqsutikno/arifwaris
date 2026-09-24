import type { InputEngine, PeranAhliWaris, IdOrang, Pertanyaan } from '../types.js';

const MAX_ZAWJAH = 4;   // [R04-3] istri maksimal 4
const MAX_ZAWJ = 1;

/**
 * Data kurang atau tidak sah → pertanyaan untuk pengguna, bukan asumsi (bab 00 konvensi 4).
 * Hanya calon ahli waris yang ditanya; placeholder buatan sistem tidak.
 */
export function validasiInput(input: InputEngine, daftarPeran: Record<IdOrang, PeranAhliWaris>): Pertanyaan[] {
  const { graf } = input;
  const pertanyaan: Pertanyaan[] = [];

  if (input.pembulatan.satuan <= 0n) {
    pertanyaan.push({ isian: 'pembulatan', alasan: 'Satuan pembulatan harus lebih dari 0 (mis. 1, 100, 1000).' });
  }

  const pewaris = graf.orang[graf.idPewaris]!;
  if (pewaris.statusHidup !== 'wafat') {
    pertanyaan.push({ idOrang: pewaris.id, isian: 'statusHidup', alasan: 'Pewaris harus sudah wafat (syarat 1, bab 2.2).' });
  }
  if (pewaris.agama === 'tidakDiketahui') {
    pertanyaan.push({ idOrang: pewaris.id, isian: 'agama', alasan: 'Agama pewaris belum diisi.' });
  }

  for (const peran of Object.values(daftarPeran)) {
    if (peran.kunci === 'BUKAN_AHLI_WARIS' || peran.kunci === 'DZAWIL_ARHAM') continue;
    const person = graf.orang[peran.idOrang]!;
    if (person.penghubung) continue;
    if (person.statusHidup === 'tidakDiketahui') {
      pertanyaan.push({ idOrang: person.id, isian: 'statusHidup', alasan: 'Apakah masih hidup saat pewaris wafat? Jika hilang → mafqud (bab 13.2).' });
    } else if (person.statusHidup === 'hidup' && person.agama === 'tidakDiketahui') {
      pertanyaan.push({ idOrang: person.id, isian: 'agama', alasan: 'Agama belum diisi; beda agama menghalangi waris (bab 2.4).' });
    }
  }

  pertanyaan.push(...sexConsistency(input));

  // Pasangan yang sudah wafat tidak dihitung: pernikahan berakhir karena kematian (mis. janda yang menikah lagi, bab 12).
  const spouses = Object.values(daftarPeran)
    .filter(r => (r.kunci === 'SUAMI' || r.kunci === 'ISTRI') && graf.orang[r.idOrang]!.statusHidup !== 'wafat');
  const limit = pewaris.jenisKelamin === 'L' ? MAX_ZAWJAH : MAX_ZAWJ;
  if (spouses.length > limit) {
    pertanyaan.push({ isian: 'pernikahan', alasan: `Jumlah pasangan yang sah (${spouses.length}) melebihi batas ${limit}; periksa status pernikahan.` });
  }
  return pertanyaan;
}

/** Jenis kelamin harus cocok dengan perannya di graf (ayah/suami laki-laki, ibu/istri perempuan). */
function sexConsistency({ graf }: InputEngine): Pertanyaan[] {
  const expected = new Map<IdOrang, 'L' | 'P'>();
  for (const person of Object.values(graf.orang)) {
    if (person.idAyah) expected.set(person.idAyah, 'L');
    if (person.idIbu) expected.set(person.idIbu, 'P');
  }
  for (const marriage of graf.pernikahan) {
    expected.set(marriage.idSuami, 'L');
    expected.set(marriage.idIstri, 'P');
  }
  return [...expected].flatMap(([idOrang, jenisKelamin]) => {
    const person = graf.orang[idOrang];
    return person && person.jenisKelamin !== jenisKelamin
      ? [{ idOrang, isian: 'jenisKelamin' as const, alasan: `Tercatat sebagai ${jenisKelamin === 'L' ? 'ayah/suami' : 'ibu/istri'} tetapi jenis kelaminnya berbeda.` }]
      : [];
  });
}
