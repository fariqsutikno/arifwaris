import type { FamilyGraph, Person, PersonId } from './types.js';

/**
 * Penyusunan graf untuk UI: jenis kelamin orang baru selalu diturunkan dari relasinya, sehingga
 * graf salah gender (mis. laki-laki sebagai istri) tidak bisa dibuat lewat jalur ini.
 */
export type Relasi = 'ayah' | 'ibu' | 'anakLaki' | 'anakPerempuan' | 'suami' | 'istri';

const SEX_OF: Record<Relasi, Person['sex']> = { ayah: 'M', ibu: 'F', anakLaki: 'M', anakPerempuan: 'F', suami: 'M', istri: 'F' };
const MAX_ISTRI = 4;   // [R04-3]

type NewPerson = { id: PersonId } & Partial<Omit<Person, 'id' | 'sex' | 'fatherId' | 'motherId'>>;

const activeMarriages = (graph: FamilyGraph, personId: PersonId) =>
  graph.marriages.filter(m => m.status !== 'talakBain' && (m.husbandId === personId || m.wifeId === personId));

/** Relasi yang boleh ditambahkan untuk seseorang. Laki-laki: istri (maks. 4); perempuan: suami (maks. 1). */
export function relationOptions(graph: FamilyGraph, personId: PersonId): Relasi[] {
  const person = graph.persons[personId];
  if (!person) throw new Error(`orang ${personId} tidak ada di graf`);
  const options: Relasi[] = [];
  if (!person.fatherId) options.push('ayah');
  if (!person.motherId) options.push('ibu');
  options.push('anakLaki', 'anakPerempuan');
  const pasangan = activeMarriages(graph, personId).length;
  if (person.sex === 'M' && pasangan < MAX_ISTRI) options.push('istri');
  if (person.sex === 'F' && pasangan < 1) options.push('suami');
  return options;
}

/** Tambah kerabat untuk `personId`; mengembalikan graf baru (tidak mengubah input). */
export function addRelative(
  graph: FamilyGraph,
  personId: PersonId,
  relasi: Relasi,
  data: NewPerson,
  options: { otherParentId?: PersonId } = {},
): FamilyGraph {
  if (!relationOptions(graph, personId).includes(relasi)) {
    throw new Error(`relasi '${relasi}' tidak tersedia untuk ${personId}`);
  }
  if (graph.persons[data.id]) throw new Error(`id ${data.id} sudah dipakai`);
  const person = graph.persons[personId]!;
  const baru: Person = { life: 'alive', religion: 'islam', ...data, sex: SEX_OF[relasi] };
  const persons = { ...graph.persons, [baru.id]: baru };
  let marriages = graph.marriages;

  switch (relasi) {
    case 'ayah': persons[personId] = { ...person, fatherId: baru.id }; break;
    case 'ibu': persons[personId] = { ...person, motherId: baru.id }; break;
    case 'suami': marriages = [...marriages, { husbandId: baru.id, wifeId: personId, status: 'intact' }]; break;
    case 'istri': marriages = [...marriages, { husbandId: personId, wifeId: baru.id, status: 'intact' }]; break;
    case 'anakLaki': case 'anakPerempuan': {
      const other = options.otherParentId;
      if (other !== undefined && !activeMarriages(graph, personId).some(m => m.husbandId === other || m.wifeId === other)) {
        throw new Error(`${other} bukan pasangan ${personId}`);
      }
      const [ayahId, ibuId] = person.sex === 'M' ? [personId, other] : [other, personId];
      persons[baru.id] = { ...baru, ...(ayahId ? { fatherId: ayahId } : {}), ...(ibuId ? { motherId: ibuId } : {}) };
      break;
    }
  }
  return { ...graph, persons, marriages };
}

/** Jenis kelamin hanya boleh diubah bila orang itu belum tercatat sebagai ayah/ibu/suami/istri. */
export function canChangeSex(graph: FamilyGraph, personId: PersonId): boolean {
  const asParent = Object.values(graph.persons).some(p => p.fatherId === personId || p.motherId === personId);
  const asSpouse = graph.marriages.some(m => m.husbandId === personId || m.wifeId === personId);
  return !asParent && !asSpouse;
}
