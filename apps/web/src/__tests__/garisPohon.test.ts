import { describe, expect, it } from 'vitest';
import type { GrafKeluarga } from '@waris/engine';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { susunGaris, type Kotak } from '../hasil/garisPohon';
import { tataLetak } from '../hasil/tataLetak';

const LEBAR = 100, TINGGI = 40, JARAK_X = 20, JARAK_Y = 60;

/** Kotak seperti tampilan: tiap baris rata tengah, jarak vertikal tetap. */
function ukurKotak(baris: string[][]): Map<string, Kotak> {
  const lebarBaris = baris.map(deret => deret.length * LEBAR + (deret.length - 1) * JARAK_X);
  const lebarMaks = Math.max(...lebarBaris);
  const kotak = new Map<string, Kotak>();
  baris.forEach((deret, r) => deret.forEach((id, i) => {
    const kiri = (lebarMaks - lebarBaris[r]!) / 2 + i * (LEBAR + JARAK_X);
    const atas = r * (TINGGI + JARAK_Y);
    kotak.set(id, { kiri, kanan: kiri + LEBAR, atas, bawah: atas + TINGGI, tengahX: kiri + LEBAR / 2, tengahY: atas + TINGGI / 2 });
  }));
  return kotak;
}

/** Ruas lurus yang menembus bagian dalam kotak mana pun (menyentuh tepi tidak dihitung). */
function ruasMenembus(graf: GrafKeluarga) {
  const letak = tataLetak(graf);
  const kotak = ukurKotak(letak.baris);
  const { ruas } = susunGaris(id => kotak.get(id) ?? null, letak);
  const tembus = ruas.flatMap(([x1, y1, x2, y2]) => [...kotak].filter(([, k]) =>
    Math.max(x1, x2) > k.kiri && Math.min(x1, x2) < k.kanan && Math.max(y1, y2) > k.atas && Math.min(y1, y2) < k.bawah).map(([id]) => id));
  return { letak, kotak, tembus };
}

function duaIstri() {
  let graf = kasusBaru('L').graf;
  for (const kunci of ['ISTRI', 'ISTRI', 'AYAH'] as const) graf = tambahAhliWaris(graf, 'PEWARIS', kunci);
  const [istri1, istri2] = hitungIsian(graf, 'PEWARIS').ISTRI!;
  graf = tambahAhliWaris(graf, istri1!, 'ANAK_LK');
  graf = tambahAhliWaris(graf, istri1!, 'ANAK_LK');
  graf = tambahAhliWaris(graf, istri2!, 'ANAK_PR');
  return { graf, istri1: istri1!, istri2: istri2! };
}

describe('garis pohon: pasangan ganda (C5-1)', () => {
  it('dua istri menggantung berjajar di baris sendiri di bawah almarhum, bukan sebaris dengannya', () => {
    const { graf, istri1, istri2 } = duaIstri();
    const { baris, rel } = tataLetak(graf);
    expect(rel).toEqual([{ induk: 'PEWARIS', pasangan: [istri1, istri2] }]);
    const barisPewaris = baris.findIndex(deret => deret.includes('PEWARIS'));
    expect(baris[barisPewaris]).not.toContain(istri1);
    expect(baris[barisPewaris + 1]).toEqual([istri1, istri2]);
  });

  it('anak digantung di bawah ibunya: urutannya mengikuti ibu', () => {
    const { graf, istri1, istri2 } = duaIstri();
    const { keluarga, baris } = tataLetak(graf);
    const anakIstri1 = keluarga.find(k => k.orangTua.join() === istri1)!.anak;
    const anakIstri2 = keluarga.find(k => k.orangTua.join() === istri2)!.anak;
    expect(anakIstri1).toHaveLength(2);
    expect(anakIstri2).toHaveLength(1);
    const barisAnak = baris[baris.findIndex(deret => deret.includes(istri1)) + 1]!;
    expect(Math.max(...anakIstri1.map(id => barisAnak.indexOf(id)))).toBeLessThan(barisAnak.indexOf(anakIstri2[0]!));
  });

  it('tidak ada ruas garis yang menembus kotak siapa pun', () => {
    expect(ruasMenembus(duaIstri().graf).tembus).toEqual([]);
  });

  it('tiga istri dengan anak ayah yang ibunya tidak diketahui tetap tidak menembus kotak', () => {
    let graf = kasusBaru('L').graf;
    for (const kunci of ['ISTRI', 'ISTRI', 'ISTRI', 'ANAK_LK'] as const) graf = tambahAhliWaris(graf, 'PEWARIS', kunci);
    expect(ruasMenembus(graf).tembus).toEqual([]);
  });

  it('satu istri tetap pola lama: sebaris, tanpa rel', () => {
    let graf = kasusBaru('L').graf;
    for (const kunci of ['ISTRI', 'ANAK_LK'] as const) graf = tambahAhliWaris(graf, 'PEWARIS', kunci);
    const { letak, tembus } = ruasMenembus(graf);
    expect(letak.rel).toEqual([]);
    expect(tembus).toEqual([]);
  });
});
