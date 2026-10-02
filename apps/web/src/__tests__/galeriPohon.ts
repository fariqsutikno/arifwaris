// Galeri fixture pohon keluarga (spec perjalanan-keresahan 5.5) dan pemeriksa invarian tata letak P1–P5.
// Fixture ditulis sebagai graf literal supaya bentuk keluarganya terbaca langsung dari kode.

import type { GrafKeluarga, IdOrang, Orang, Pernikahan } from '@waris/engine';
import type { TataLetak } from '../hasil/tataLetak';

type Ringkas = Partial<Omit<Orang, 'id' | 'jenisKelamin'>>;

class Perakit {
  private readonly orang: Record<IdOrang, Orang> = {};
  private readonly pernikahan: Pernikahan[] = [];
  tambah(id: IdOrang, jenisKelamin: 'L' | 'P', sisa: Ringkas = {}): this {
    this.orang[id] = { id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...sisa };
    return this;
  }
  nikah(idSuami: IdOrang, idIstri: IdOrang, status: Pernikahan['status'] = 'utuh'): this {
    this.pernikahan.push({ idSuami, idIstri, status });
    return this;
  }
  graf(idPewaris: IdOrang): GrafKeluarga {
    return { idPewaris, orang: this.orang, pernikahan: this.pernikahan };
  }
}

const wafat: Ringkas = { statusHidup: 'wafat' };

export interface FixturePohon { nama: string; graf: GrafKeluarga; /** pernikahan antar-kerabat: P5 hanya mensyaratkan tanpa tumpukan */ nikahKerabat?: boolean }

const GALERI_DASAR: FixturePohon[] = [
  { nama: '1. kasus biasa (istri, 2 anak)', graf: new Perakit()
    .tambah('P', 'L', wafat).tambah('I', 'P').tambah('A1', 'L', { idAyah: 'P', idIbu: 'I' }).tambah('A2', 'P', { idAyah: 'P', idIbu: 'I' })
    .nikah('P', 'I').graf('P') },
  { nama: '2. turun-temurun 4 generasi', graf: new Perakit()
    .tambah('MB', 'L', wafat).tambah('MI', 'P', wafat)
    .tambah('K1', 'L', { ...wafat, idAyah: 'MB', idIbu: 'MI' }).tambah('K2', 'P', { idAyah: 'MB', idIbu: 'MI' })
    .tambah('K1I', 'P', wafat)
    .tambah('P', 'L', { ...wafat, idAyah: 'K1', idIbu: 'K1I' }).tambah('PS', 'L', { idAyah: 'K1', idIbu: 'K1I' })
    .tambah('PI', 'P').tambah('C1', 'L', { idAyah: 'P', idIbu: 'PI' }).tambah('C2', 'P', { idAyah: 'P', idIbu: 'PI' })
    .tambah('PSI', 'P').tambah('C3', 'L', { idAyah: 'PS', idIbu: 'PSI' })
    .tambah('C1I', 'P').tambah('B1', 'L', { idAyah: 'C1', idIbu: 'C1I' })
    .nikah('MB', 'MI').nikah('K1', 'K1I').nikah('P', 'PI').nikah('PS', 'PSI').nikah('C1', 'C1I').graf('P') },
  { nama: '3. poligami 2 istri, anak masing-masing', graf: new Perakit()
    .tambah('P', 'L', wafat).tambah('I1', 'P').tambah('I2', 'P')
    .tambah('A1', 'L', { idAyah: 'P', idIbu: 'I1' }).tambah('A2', 'P', { idAyah: 'P', idIbu: 'I1' })
    .tambah('A3', 'L', { idAyah: 'P', idIbu: 'I2' }).tambah('A4', 'P', { idAyah: 'P', idIbu: 'I2' })
    .nikah('P', 'I1').nikah('P', 'I2').graf('P') },
  { nama: '4. janda menikah lagi, anak dari dua suami', graf: new Perakit()
    .tambah('P', 'L', wafat).tambah('J', 'P').tambah('S1', 'L', wafat)
    .tambah('A1', 'L', { idAyah: 'S1', idIbu: 'J' }).tambah('A2', 'P', { idAyah: 'P', idIbu: 'J' })
    .nikah('S1', 'J', 'talakBain').nikah('P', 'J').graf('P') },
  { nama: '5. suami pewaris menikahi saudari pewaris', nikahKerabat: true, graf: new Perakit()
    .tambah('AY', 'L', wafat).tambah('IB', 'P', wafat)
    .tambah('P', 'P', { ...wafat, idAyah: 'AY', idIbu: 'IB' }).tambah('SD', 'P', { idAyah: 'AY', idIbu: 'IB' })
    .tambah('SU', 'L').tambah('A1', 'L', { idAyah: 'SU', idIbu: 'P' }).tambah('A2', 'P', { idAyah: 'SU', idIbu: 'SD' })
    .nikah('AY', 'IB').nikah('SU', 'P').nikah('SU', 'SD').graf('P') },
  { nama: '6. sepupu menikah', nikahKerabat: true, graf: new Perakit()
    .tambah('MB', 'L', wafat).tambah('MI', 'P', wafat)
    .tambah('X', 'L', { idAyah: 'MB', idIbu: 'MI' }).tambah('Y', 'L', { idAyah: 'MB', idIbu: 'MI' })
    .tambah('XI', 'P').tambah('YI', 'P')
    .tambah('P', 'L', { ...wafat, idAyah: 'X', idIbu: 'XI' }).tambah('SP', 'P', { idAyah: 'Y', idIbu: 'YI' })
    .tambah('A1', 'L', { idAyah: 'P', idIbu: 'SP' })
    .nikah('MB', 'MI').nikah('X', 'XI').nikah('Y', 'YI').nikah('P', 'SP').graf('P') },
  { nama: '7. besan dua sisi, satu besan wafat', graf: new Perakit()
    .tambah('P', 'L', wafat).tambah('I', 'P')
    .tambah('A1', 'L', { idAyah: 'P', idIbu: 'I' }).tambah('A2', 'P', { idAyah: 'P', idIbu: 'I' })
    .tambah('M1', 'P').tambah('B1', 'L', wafat).tambah('M2', 'L').tambah('B2', 'P')
    .tambah('Q1', 'P', { idAyah: 'B1', idIbu: 'M1' }).tambah('Q2', 'L', { idAyah: 'M2', idIbu: 'B2' })
    .nikah('P', 'I').nikah('A1', 'Q1').nikah('M2', 'B2').nikah('B1', 'M1').nikah('Q2', 'A2').graf('P') },
  { nama: '8. anak tanpa ibu tercatat dan penghubung tak bernama', graf: new Perakit()
    .tambah('P', 'L', wafat).tambah('H', 'P', { ...wafat, penghubung: true })
    .tambah('A1', 'L', { idAyah: 'P' }).tambah('A2', 'P', { idAyah: 'P', idIbu: 'H' })
    .graf('P') },
  { nama: '10. janin, hilang, kelamin belum jelas, cerai', graf: new Perakit()
    .tambah('P', 'L', wafat).tambah('I', 'P').tambah('M', 'P', { statusHidup: 'dalamKandungan', idAyah: 'P', idIbu: 'I' })
    .tambah('H', 'L', { statusHidup: 'mafqud', idAyah: 'P', idIbu: 'I' }).tambah('K', 'L', { khuntsa: 'diharapkanJelas', idAyah: 'P', idIbu: 'I' })
    .tambah('I0', 'P').nikah('P', 'I').nikah('P', 'I0', 'talakBain').graf('P') },
];

export const GALERI: FixturePohon[] = [
  ...GALERI_DASAR,
  { nama: '11. pusat dipindah dari Mbah ke cucu', graf: { ...GALERI_DASAR[1]!.graf, idPewaris: 'C1' } },
];

// ─── Pemeriksa invarian ───────────────────────────────────────────────────────

/** Posisi kolom tiap orang di baris masing-masing (P1: tepat satu kotak per orang). */
export function posisiKotak(tata: TataLetak): Map<IdOrang, { baris: number; kolom: number }> {
  const hasil = new Map<IdOrang, { baris: number; kolom: number }>();
  tata.baris.forEach((baris, indeksBaris) => baris.forEach((id, kolom) => {
    if (hasil.has(id)) throw new Error(`P1 dilanggar: ${id} muncul lebih dari sekali`);
    hasil.set(id, { baris: indeksBaris, kolom });
  }));
  return hasil;
}

/** Garis orang tua → anak yang berada pada pasangan baris berdekatan, dipakai menghitung silang (P5). */
export function hitungSilang(tata: TataLetak): number {
  const posisi = posisiKotak(tata);
  const garis: Array<{ atas: number; bawah: number; barisAtas: number }> = [];
  for (const keluarga of tata.keluarga) {
    const orangTua = keluarga.orangTua.map(id => posisi.get(id)!);
    const tengah = orangTua.reduce((jumlah, p) => jumlah + p.kolom, 0) / orangTua.length;
    for (const idAnak of keluarga.anak) {
      const anak = posisi.get(idAnak)!;
      if (anak.baris > orangTua[0]!.baris) garis.push({ atas: tengah, bawah: anak.kolom, barisAtas: orangTua[0]!.baris });
    }
  }
  let silang = 0;
  for (let i = 0; i < garis.length; i++) {
    for (let j = i + 1; j < garis.length; j++) {
      const a = garis[i]!, b = garis[j]!;
      if (a.barisAtas !== b.barisAtas) continue;
      if ((a.atas - b.atas) * (a.bawah - b.bawah) < 0) silang++;
    }
  }
  return silang;
}

/** Daftar pelanggaran invarian yang bisa dicek dari TataLetak saja: P1, P2, P3, P4. */
export function pelanggaran(graf: GrafKeluarga, tata: TataLetak): string[] {
  const hasil: string[] = [];
  let posisi: ReturnType<typeof posisiKotak>;
  try { posisi = posisiKotak(tata); } catch (galat) { return [(galat as Error).message]; }

  for (const id of Object.keys(graf.orang)) {
    if (!posisi.has(id)) hasil.push(`P1: ${id} tidak punya kotak`);
  }
  // P2: anak selalu di baris lebih bawah dari orang tuanya.
  for (const orang of Object.values(graf.orang)) {
    for (const idOrangTua of [orang.idAyah, orang.idIbu]) {
      if (!idOrangTua || !posisi.has(idOrangTua) || !posisi.has(orang.id)) continue;
      if (posisi.get(orang.id)!.baris <= posisi.get(idOrangTua)!.baris) hasil.push(`P2: ${orang.id} tidak di bawah ${idOrangTua}`);
    }
  }
  // P3: pasangan satu baris bersebelahan, tidak ada orang lain di antaranya, kecuali poligami (istri berderet).
  for (const nikah of graf.pernikahan) {
    const suami = posisi.get(nikah.idSuami), istri = posisi.get(nikah.idIstri);
    if (!suami || !istri || suami.baris !== istri.baris) continue;
    const sela = tata.baris[suami.baris]!.slice(Math.min(suami.kolom, istri.kolom) + 1, Math.max(suami.kolom, istri.kolom));
    const semuaPasangan = sela.every(id => graf.pernikahan.some(n => [n.idSuami, n.idIstri].includes(id) && [n.idSuami, n.idIstri].some(lain => [nikah.idSuami, nikah.idIstri].includes(lain))));
    if (!semuaPasangan) hasil.push(`P3: ${nikah.idSuami}–${nikah.idIstri} tidak bersebelahan`);
  }
  // P4: anak dengan dua orang tua tercatat berada dalam keluarga yang memuat keduanya.
  for (const orang of Object.values(graf.orang)) {
    if (!orang.idAyah || !orang.idIbu) continue;
    const keluarga = tata.keluarga.find(k => k.anak.includes(orang.id));
    if (!keluarga || !keluarga.orangTua.includes(orang.idAyah) || !keluarga.orangTua.includes(orang.idIbu)) hasil.push(`P4: ${orang.id} tidak tergantung dari titik nikah orang tuanya`);
  }
  return hasil;
}
