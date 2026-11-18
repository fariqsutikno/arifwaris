// Kasus pemilik (docs/design riset bagian 7): pohon keluarga besar dengan pernikahan kedua pada leluhur.
import { describe, expect, it } from 'vitest';
import type { GrafKeluarga } from '@waris/engine';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { susunGaris, type Kotak, type Ruas } from '../hasil/garisPohon';
import { BATAS_PER_BARIS, jumlahPerBaris, tataLetak } from '../hasil/tataLetak';
import { buatSebutSimpul } from '../checklist';
import { ID_RINGKAS_SAUDARA, kelompokSaudara, ringkaskanSaudara } from '../hasil/saudara';
import { susunBingkai } from '../hasil/garisPohon';

const MAKS_LAYAR_PENUH = 8;
const LEBAR = 120, TINGGI = 40, JARAK_X = 14, JARAK_Y = 56;

/** Nenek dari ibu, ayah, ibu, saudara 3 kandung + 1 seayah + 1 seibu, almarhum beristri dengan 3 anak. */
function kasusPemilik() {
  let graf = kasusBaru('L').graf;
  for (const kunci of ['ISTRI', 'AYAH', 'IBU', 'NENEK_DARI_IBU', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARI_KANDUNG',
    'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU', 'ANAK_LK', 'ANAK_LK', 'ANAK_PR'] as const) graf = tambahAhliWaris(graf, 'PEWARIS', kunci);
  return graf;
}

/** Kotak seperti tampilan: baris yang lebih dari batas dibungkus rata, tiap baris tampil rata tengah. */
function ukurKotak(baris: string[][], maks = BATAS_PER_BARIS): Map<string, Kotak> {
  const tampil = baris.flatMap(deret => {
    const per = jumlahPerBaris(deret.length, maks);
    return Array.from({ length: Math.ceil(deret.length / per) }, (_, i) => deret.slice(i * per, (i + 1) * per));
  });
  const lebarBaris = tampil.map(deret => deret.length * LEBAR + (deret.length - 1) * JARAK_X);
  const lebarMaks = Math.max(...lebarBaris);
  const kotak = new Map<string, Kotak>();
  tampil.forEach((deret, r) => deret.forEach((id, i) => {
    const kiri = (lebarMaks - lebarBaris[r]!) / 2 + i * (LEBAR + JARAK_X);
    const atas = r * (TINGGI + JARAK_Y);
    kotak.set(id, { kiri, kanan: kiri + LEBAR, atas, bawah: atas + TINGGI, tengahX: kiri + LEBAR / 2, tengahY: atas + TINGGI / 2 });
  }));
  return kotak;
}

function ruasMenembus(graf: GrafKeluarga, maks?: number) {
  const letak = tataLetak(graf);
  const kotak = ukurKotak(letak.baris, maks);
  const { ruas } = susunGaris(id => kotak.get(id) ?? null, letak);
  const tembus = ruas.flatMap(([x1, y1, x2, y2]) => [...kotak].filter(([, k]) =>
    Math.max(x1, x2) > k.kiri && Math.min(x1, x2) < k.kanan && Math.max(y1, y2) > k.atas && Math.min(y1, y2) < k.bawah).map(([id]) => id));
  return { letak, kotak, ruas, tembus };
}

/** Pasangan ruas tegak-mendatar yang saling memotong tegak lurus (sentuhan ujung tidak dihitung). */
function jumlahSilang(ruas: Ruas[]): number {
  const tegak = ruas.filter(([x1, , x2]) => x1 === x2), datar = ruas.filter(([, y1, , y2]) => y1 === y2);
  return tegak.flatMap(([x, ya, , yb]) => datar.filter(([xa, y, xb]) =>
    x > Math.min(xa, xb) && x < Math.max(xa, xb) && y > Math.min(ya, yb) && y < Math.max(ya, yb))).length;
}

describe('pohon keluarga besar (A: pasangan kedua leluhur sebaris)', () => {
  it('istri lain ayah, ayah, ibu, suami ibu berjajar di satu baris dan tidak ada garis yang menembus kotak', () => {
    const graf = kasusPemilik();
    const { letak, tembus, ruas } = ruasMenembus(graf, MAKS_LAYAR_PENUH);
    expect(jumlahSilang(ruas)).toBe(0);
    const barisOrangTua = letak.baris.find(deret => deret.includes('O2'))!;
    expect(letak.rel).toEqual([]);
    expect(barisOrangTua).toEqual(['O8', 'O2', 'O3', 'O10']);   // istri lain ayah — ayah — ibu — suami ibu
    expect(tembus).toEqual([]);
  });

  it('anak dikelompokkan per pasangan orang tua: seayah, kandung (dengan almarhum), seibu berurutan', () => {
    const graf = kasusPemilik();
    const barisAnak = tataLetak(graf).baris.find(deret => deret.includes('PEWARIS'))!;
    const posisi = (id: string) => barisAnak.indexOf(id);
    const kandung = ['O5', 'O6', 'O7', 'PEWARIS'].map(posisi);
    expect(posisi('O9')).toBeLessThan(Math.min(...kandung));
    expect(Math.max(...kandung) - Math.min(...kandung)).toBe(3);
    expect(posisi('O11')).toBeGreaterThan(Math.max(...kandung));
  });

  it('juga bersih pada lebar baris sempit (panggung wizard)', () => {
    expect(ruasMenembus(kasusPemilik(), 4).tembus).toEqual([]);
  });
});

describe('pohon keluarga besar (B: ringkasan saudara, bingkai, sebutan)', () => {
  it('saudara, keturunannya, dan orang tua tiri diganti satu simpul ringkasan; sisanya utuh', () => {
    const { graf, ringkasan } = ringkaskanSaudara(kasusPemilik());
    expect(ringkasan).toEqual({ jumlah: 5, menurutJenis: { kandung: 3, sebapak: 1, seibu: 1 } });
    expect(Object.keys(graf.orang).sort()).toEqual(['O1', 'O12', 'O13', 'O14', 'O2', 'O3', 'O4', 'PEWARIS', ID_RINGKAS_SAUDARA].sort());
    expect(graf.orang[ID_RINGKAS_SAUDARA]).toMatchObject({ idAyah: 'O2', idIbu: 'O3' });
    const { baris } = tataLetak(graf);
    expect(baris.find(deret => deret.includes('O2'))).toEqual(['O2', 'O3']);
    expect(baris.flat()).toContain(ID_RINGKAS_SAUDARA);
  });

  it('tanpa saudara tidak ada yang berubah dan tidak ada simpul ringkasan', () => {
    const graf = tambahAhliWaris(tambahAhliWaris(kasusBaru('L').graf, 'PEWARIS', 'AYAH'), 'PEWARIS', 'IBU');
    const hasil = ringkaskanSaudara(graf);
    expect(hasil.graf).toBe(graf);
    expect(hasil.ringkasan).toBeUndefined();
  });

  it('istri orang tua tiri tetap tampil bila punya anak yang bukan saudara', () => {
    const { graf } = ringkaskanSaudara(kasusPemilik());
    expect(graf.orang.O8).toBeUndefined();
    expect(graf.orang.O10).toBeUndefined();
  });

  it('kelompok saudara per pasangan orang tua; bingkai membungkus anggotanya', () => {
    const graf = kasusPemilik();
    const kelompok = kelompokSaudara(graf);
    expect(kelompok.map(k => [k.jenis, [...k.anak].sort()])).toEqual(expect.arrayContaining([
      ['kandung', ['O5', 'O6', 'O7', 'PEWARIS']], ['sebapak', ['O9']], ['seibu', ['O11']],
    ]));
    const kotak = ukurKotak(tataLetak(graf).baris, MAKS_LAYAR_PENUH);
    const bingkai = susunBingkai(id => kotak.get(id) ?? null, kelompok.map(k => ({ label: k.jenis, anak: k.anak })));
    const kandung = bingkai.find(b => b.label === 'kandung')!;
    for (const id of ['O5', 'O6', 'O7', 'PEWARIS']) {
      const k = kotak.get(id)!;
      expect(k.kiri).toBeGreaterThan(kandung.kiri);
      expect(k.kanan).toBeLessThan(kandung.kiri + kandung.lebar);
    }
    expect(kotak.get('O9')!.kanan).toBeLessThan(kandung.kiri);
  });

  it('hanya satu kelompok (tanpa saudara tiri) tidak mendapat bingkai', () => {
    const graf = tambahAhliWaris(tambahAhliWaris(tambahAhliWaris(kasusBaru('L').graf, 'PEWARIS', 'AYAH'), 'PEWARIS', 'IBU'), 'PEWARIS', 'SAUDARA_KANDUNG');
    expect(kelompokSaudara(graf)).toEqual([]);
  });

  it('penghubung tiri disebut "Istri lain ayah" dan "Suami ibu", bukan "Kerabat"; saudara memakai label pendek di pohon', () => {
    const graf = kasusPemilik();
    const sebut = buatSebutSimpul(graf);
    expect(sebut('O8')).toBe('Istri lain ayah');
    expect(sebut('O10')).toBe('Suami ibu');
    expect(sebut('O5')).toBe('Saudara lk kandung');
    expect(sebut('O6')).toBe('Saudari kandung 1');
    expect(sebut('O9')).toBe('Saudara lk seayah');
    expect(sebut('O11')).toBe('Saudara lk seibu');
  });
});
