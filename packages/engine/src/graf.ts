import type { GrafKeluarga, Orang, IdOrang } from './types.js';

/**
 * Penyusunan graf untuk UI: jenis kelamin orang baru selalu diturunkan dari relasinya, sehingga
 * graf salah gender (mis. laki-laki sebagai istri) tidak bisa dibuat lewat jalur ini.
 */
export type Relasi = 'ayah' | 'ibu' | 'anakLaki' | 'anakPerempuan' | 'suami' | 'istri';

const SEX_OF: Record<Relasi, Orang['jenisKelamin']> = { ayah: 'L', ibu: 'P', anakLaki: 'L', anakPerempuan: 'P', suami: 'L', istri: 'P' };
const MAX_ISTRI = 4;   // [R04-3]

type OrangBaru = { id: IdOrang } & Partial<Omit<Orang, 'id' | 'jenisKelamin' | 'idAyah' | 'idIbu'>>;

const activeMarriages = (graf: GrafKeluarga, idOrang: IdOrang) =>
  graf.pernikahan.filter(m => m.status !== 'talakBain' && (m.idSuami === idOrang || m.idIstri === idOrang));

/** Relasi yang boleh ditambahkan untuk seseorang. Laki-laki: istri (maks. 4); perempuan: suami (maks. 1). */
export function opsiRelasi(graf: GrafKeluarga, idOrang: IdOrang): Relasi[] {
  const person = graf.orang[idOrang];
  if (!person) throw new Error(`orang ${idOrang} tidak ada di graf`);
  const opsi: Relasi[] = [];
  if (!person.idAyah) opsi.push('ayah');
  if (!person.idIbu) opsi.push('ibu');
  opsi.push('anakLaki', 'anakPerempuan');
  const pasangan = activeMarriages(graf, idOrang).length;
  if (person.jenisKelamin === 'L' && pasangan < MAX_ISTRI) opsi.push('istri');
  if (person.jenisKelamin === 'P' && pasangan < 1) opsi.push('suami');
  return opsi;
}

/** Tambah kerabat untuk `idOrang`; mengembalikan graf baru (tidak mengubah input). */
export function tambahKerabat(
  graf: GrafKeluarga,
  idOrang: IdOrang,
  relasi: Relasi,
  data: OrangBaru,
  opsi: { otherParentId?: IdOrang } = {},
): GrafKeluarga {
  if (!opsiRelasi(graf, idOrang).includes(relasi)) {
    throw new Error(`relasi '${relasi}' tidak tersedia untuk ${idOrang}`);
  }
  if (graf.orang[data.id]) throw new Error(`id ${data.id} sudah dipakai`);
  const person = graf.orang[idOrang]!;
  const baru: Orang = { statusHidup: 'hidup', agama: 'islam', ...data, jenisKelamin: SEX_OF[relasi] };
  const orang = { ...graf.orang, [baru.id]: baru };
  let pernikahan = graf.pernikahan;

  switch (relasi) {
    case 'ayah': orang[idOrang] = { ...person, idAyah: baru.id }; break;
    case 'ibu': orang[idOrang] = { ...person, idIbu: baru.id }; break;
    case 'suami': pernikahan = [...pernikahan, { idSuami: baru.id, idIstri: idOrang, status: 'utuh' }]; break;
    case 'istri': pernikahan = [...pernikahan, { idSuami: idOrang, idIstri: baru.id, status: 'utuh' }]; break;
    case 'anakLaki': case 'anakPerempuan': {
      const other = opsi.otherParentId;
      if (other !== undefined && !activeMarriages(graf, idOrang).some(m => m.idSuami === other || m.idIstri === other)) {
        throw new Error(`${other} bukan pasangan ${idOrang}`);
      }
      const [ayahId, ibuId] = person.jenisKelamin === 'L' ? [idOrang, other] : [other, idOrang];
      orang[baru.id] = { ...baru, ...(ayahId ? { idAyah: ayahId } : {}), ...(ibuId ? { idIbu: ibuId } : {}) };
      break;
    }
  }
  return { ...graf, orang, pernikahan };
}

/** Jenis kelamin hanya boleh diubah bila orang itu belum tercatat sebagai ayah/ibu/suami/istri. */
export function bolehUbahJenisKelamin(graf: GrafKeluarga, idOrang: IdOrang): boolean {
  const asParent = Object.values(graf.orang).some(p => p.idAyah === idOrang || p.idIbu === idOrang);
  const asSpouse = graf.pernikahan.some(m => m.idSuami === idOrang || m.idIstri === idOrang);
  return !asParent && !asSpouse;
}
