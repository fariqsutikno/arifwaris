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
    const orangIni = graf.orang[peran.idOrang]!;
    if (orangIni.penghubung) continue;
    if (orangIni.statusHidup === 'tidakDiketahui') {
      pertanyaan.push({ idOrang: orangIni.id, isian: 'statusHidup', alasan: 'Apakah masih hidup saat pewaris wafat? Jika hilang → mafqud (bab 13.2).' });
    } else if (orangIni.statusHidup === 'hidup' && orangIni.agama === 'tidakDiketahui') {
      pertanyaan.push({ idOrang: orangIni.id, isian: 'agama', alasan: 'Agama belum diisi; beda agama menghalangi waris (bab 2.4).' });
    }
  }

  pertanyaan.push(...konsistensiJenisKelamin(input));

  // Pasangan yang sudah wafat tidak dihitung: pernikahan berakhir karena kematian (mis. janda yang menikah lagi, bab 12).
  const daftarPasangan = Object.values(daftarPeran)
    .filter(r => (r.kunci === 'SUAMI' || r.kunci === 'ISTRI') && graf.orang[r.idOrang]!.statusHidup !== 'wafat');
  const limit = pewaris.jenisKelamin === 'L' ? MAX_ZAWJAH : MAX_ZAWJ;
  if (daftarPasangan.length > limit) {
    pertanyaan.push({ isian: 'pernikahan', alasan: `Jumlah pasangan yang sah (${daftarPasangan.length}) melebihi batas ${limit}; periksa status pernikahan.` });
  }
  return pertanyaan;
}

/** Jenis kelamin harus cocok dengan perannya di graf (ayah/suami laki-laki, ibu/istri perempuan). */
function konsistensiJenisKelamin({ graf }: InputEngine): Pertanyaan[] {
  const expected = new Map<IdOrang, 'L' | 'P'>();
  for (const orangIni of Object.values(graf.orang)) {
    if (orangIni.idAyah) expected.set(orangIni.idAyah, 'L');
    if (orangIni.idIbu) expected.set(orangIni.idIbu, 'P');
  }
  for (const nikah of graf.pernikahan) {
    expected.set(nikah.idSuami, 'L');
    expected.set(nikah.idIstri, 'P');
  }
  return [...expected].flatMap(([idOrang, jenisKelamin]) => {
    const orangIni = graf.orang[idOrang];
    return orangIni && orangIni.jenisKelamin !== jenisKelamin
      ? [{ idOrang, isian: 'jenisKelamin' as const, alasan: `Tercatat sebagai ${jenisKelamin === 'L' ? 'ayah/suami' : 'ibu/istri'} tetapi jenis kelaminnya berbeda.` }]
      : [];
  });
}
