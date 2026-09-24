import type { EngineInput, HeirRole, PersonId, Question } from '../types.js';

const MAX_ZAWJAH = 4;   // [R04-3] istri maksimal 4
const MAX_ZAWJ = 1;

/**
 * Data kurang atau tidak sah → pertanyaan untuk pengguna, bukan asumsi (bab 00 konvensi 4).
 * Hanya calon ahli waris yang ditanya; placeholder buatan sistem tidak.
 */
export function validateInput(input: EngineInput, roles: Record<PersonId, HeirRole>): Question[] {
  const { graph } = input;
  const questions: Question[] = [];

  if (input.rounding.unit <= 0n) {
    questions.push({ field: 'rounding', reason: 'Satuan pembulatan harus lebih dari 0 (mis. 1, 100, 1000).' });
  }

  const deceased = graph.persons[graph.deceasedId]!;
  if (deceased.life !== 'dead') {
    questions.push({ personId: deceased.id, field: 'life', reason: 'Pewaris harus sudah wafat (syarat 1, bab 2.2).' });
  }
  if (deceased.religion === 'unknown') {
    questions.push({ personId: deceased.id, field: 'religion', reason: 'Agama pewaris belum diisi.' });
  }

  for (const role of Object.values(roles)) {
    if (role.key === 'NON_HEIR' || role.key === 'DZAWIL_ARHAM') continue;
    const person = graph.persons[role.personId]!;
    if (person.isPlaceholder) continue;
    if (person.life === 'unknown') {
      questions.push({ personId: person.id, field: 'life', reason: 'Apakah masih hidup saat pewaris wafat? Jika hilang → mafqud (bab 13.2).' });
    } else if (person.life === 'alive' && person.religion === 'unknown') {
      questions.push({ personId: person.id, field: 'religion', reason: 'Agama belum diisi; beda agama menghalangi waris (bab 2.4).' });
    }
  }

  const spouses = Object.values(roles).filter(r => r.key === 'ZAWJ' || r.key === 'ZAWJAH');
  const limit = deceased.sex === 'M' ? MAX_ZAWJAH : MAX_ZAWJ;
  if (spouses.length > limit) {
    questions.push({ field: 'marriages', reason: `Jumlah pasangan yang sah (${spouses.length}) melebihi batas ${limit}; periksa status pernikahan.` });
  }
  return questions;
}
