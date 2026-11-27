import { readdirSync, readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import type { KunciAhliWaris } from '@waris/engine';
import { tulisBit } from '../bank/bitMuatan.js';
import {
  analisisKasus, ATURAN_PENGECOH, bangunKuis, buatKodeKuis, daftarPertanyaan, DAFTAR_ATURAN, DAFTAR_JENIS_CHECKLIST, hisabUlang, jawabanBenar,
  kunciJawaban, rakitPilihan, sapuKasusBiasa, semuaPengecoh, soalKuisDariKode, tingkatKuis, uraiKodeKuis, VERSI_KODE_KUIS,
  type AturanPengecoh, type KasusBiasa, type PertanyaanKuis,
} from '../index.js';

const BERKAS_SNAPSHOT = new URL('../../../../apps/web/src/snapshot.json', import.meta.url);
const snapshot = JSON.parse(readFileSync(BERKAS_SNAPSHOT, 'utf8')) as { diksi: Array<{ kunci: string; id: string; ar: string | null }> };
const petaDiksi = new Map(snapshot.diksi.map(butir => [butir.kunci, butir]));
const penyusun = { kamus: (kunci: string) => petaDiksi.get(kunci), bahasa: 'id' as const };

const kasus = (pewaris: 'L' | 'P', ahliWaris: Partial<Record<KunciAhliWaris, number>>): KasusBiasa => ({ pewaris, ahliWaris });
function fakta(dasar: KasusBiasa) {
  const analisis = analisisKasus(dasar);
  if (!analisis.ok) throw new Error(`kasus uji tak bisa dianalisis: ${analisis.galat}`);
  return analisis.fakta;
}
/** Peta aturan → jawaban (teks) dari semuaPengecoh, sebelum disaring. */
function pengecoh(dasar: KasusBiasa, tanya: PertanyaanKuis) {
  return Object.fromEntries(semuaPengecoh(fakta(dasar), tanya).map(isi => [isi.aturan, kunciJawaban(isi.jawaban)]));
}
const benar = (dasar: KasusBiasa, tanya: PertanyaanKuis) => kunciJawaban(jawabanBenar(fakta(dasar), tanya));

// ─── kode K1 ──────────────────────────────────────────────────────────────────

const kasusBiasaSah = fc.constantFrom<'L' | 'P'>('L', 'P').chain(pewaris =>
  fc.tuple(...DAFTAR_JENIS_CHECKLIST.map(jenis => {
    const dibolehkan = !jenis.hanyaUntuk || jenis.hanyaUntuk === pewaris;
    return fc.integer({ min: 0, max: dibolehkan ? jenis.maksimal ?? 7 : 0 });
  })).map(jumlah => ({
    pewaris,
    ahliWaris: Object.fromEntries(DAFTAR_JENIS_CHECKLIST.flatMap((jenis, i) => (jumlah[i]! > 0 ? [[jenis.kunci, jumlah[i]!]] : []))),
  } satisfies KasusBiasa)),
).filter(isi => Object.keys(isi.ahliWaris).length > 0);

const kasusDenganPertanyaan = kasusBiasaSah.chain(isi => fc.constantFrom<PertanyaanKuis>(
  { jenis: 'gugur' }, { jenis: 'ashlAkhir' }, { jenis: 'ashabah' },
  ...(Object.keys(isi.ahliWaris) as KunciAhliWaris[]).map((kunci): PertanyaanKuis => ({ jenis: 'bagian', kunci })),
).map(tanya => ({ isi, tanya })));

describe('kode soal kuis K1', () => {
  test('bolak-balik untuk semua jenis pertanyaan (property)', () => {
    fc.assert(fc.property(kasusDenganPertanyaan, ({ isi, tanya }) => {
      const kode = buatKodeKuis(isi, tanya);
      expect(kode).toMatch(/^K1-[0-9A-HJKMNP-TV-Z]{18}$/);
      expect(uraiKodeKuis(kode)).toEqual({ ok: true, kasus: isi, tanya });
    }), { numRuns: 500 });
  });

  test('dua pertanyaan berbeda tak pernah berkode sama', () => {
    const satu = kasus('L', { ANAK_LK: 1, IBU: 1 });
    const kode = [{ jenis: 'gugur' }, { jenis: 'ashlAkhir' }, { jenis: 'ashabah' }, { jenis: 'bagian', kunci: 'IBU' }, { jenis: 'bagian', kunci: 'ANAK_LK' }]
      .map(tanya => buatKodeKuis(satu, tanya as PertanyaanKuis));
    expect(new Set(kode).size).toBe(kode.length);
  });

  test('kode rusak ditolak: versi, panjang, jenis, kunci tak ada di kasus, bit sisa', () => {
    const kode = buatKodeKuis(kasus('L', { ANAK_LK: 1, IBU: 1 }), { jenis: 'bagian', kunci: 'IBU' });
    const muatan = kode.slice('K1-'.length);
    expect(uraiKodeKuis(`K${VERSI_KODE_KUIS + 1}-${muatan}`)).toEqual({ ok: false, galat: 'VERSI_TIDAK_DIKENAL' });
    expect(uraiKodeKuis(kode.slice(0, -1))).toEqual({ ok: false, galat: 'MUATAN_RUSAK' });
    expect(uraiKodeKuis('G1-B-0000000000000040')).toEqual({ ok: false, galat: 'BUKAN_KODE_GENERATOR' });
    // gugur dengan indeks kunci bukan nol bukan bentuk baku (dua kode untuk satu soal)
    const gugur = buatKodeKuis(kasus('L', { ANAK_LK: 1, IBU: 1 }), { jenis: 'gugur' });
    const gugurDenganKunci = `${gugur.slice(0, -2)}${tulisBit([1, 17], [3, 5])}`;
    expect(uraiKodeKuis(gugurDenganKunci).ok).toBe(false);
    expect(() => buatKodeKuis(kasus('L', { ANAK_LK: 1 }), { jenis: 'bagian', kunci: 'IBU' })).toThrow();
    expect(uraiKodeKuis(`${kode.slice(0, -2)}${'Z'}Z`).ok).toBe(false);
  });
});

// ─── aturan pengecoh: angka keliru dihitung tangan dari KB ─────────────────────

describe('aturan pengecoh', () => {
  // Pewaris P: suami, ibu, 2 saudari kandung. Furudh: suami 1/2 [R04-2], ibu 1/6 (dua saudara) [R04-4], 2 saudari 2/3 [R04-14].
  // Ashl 6: 3 + 1 + 4 = 8 > 6, 'aul ke 8 [R09-3]. Benar: suami 3/8, ibu 1/8, ashl akhir 8.
  const aul = kasus('P', { SUAMI: 1, IBU: 1, SAUDARI_KANDUNG: 2 });

  test('lupaAul: bagian sebelum aul = saham di ashl 6 ÷ 6; penyebut = ashl 6', () => {
    expect(benar(aul, { jenis: 'bagian', kunci: 'SUAMI' })).toBe('3/8');
    expect(pengecoh(aul, { jenis: 'bagian', kunci: 'SUAMI' }).lupaAul).toBe('1/2');
    expect(pengecoh(aul, { jenis: 'bagian', kunci: 'IBU' }).lupaAul).toBe('1/6');
    expect(benar(aul, { jenis: 'ashlAkhir' })).toBe('8');
    expect(pengecoh(aul, { jenis: 'ashlAkhir' }).lupaAul).toBe('6');
  });

  test('ibuTetapSepertiga: ibu 1/3 → saham 3+2+4 = 9 di ashl 6, aul ke 9 (sah, R09-4): ibu 2/9, suami 3/9, penyebut 9', () => {
    expect(pengecoh(aul, { jenis: 'bagian', kunci: 'IBU' }).ibuTetapSepertiga).toBe('2/9');
    expect(pengecoh(aul, { jenis: 'bagian', kunci: 'SUAMI' }).ibuTetapSepertiga).toBe('1/3');
    expect(pengecoh(aul, { jenis: 'ashlAkhir' }).ibuTetapSepertiga).toBe('9');
  });

  test('pasanganTertukar: suami 1/4 (bukan 1/2) → ashl 12: 3 + 2 + 8 = 13, aul ke 13 (sah): suami 3/13, penyebut 13', () => {
    expect(pengecoh(aul, { jenis: 'bagian', kunci: 'SUAMI' }).pasanganTertukar).toBe('3/13');
    expect(pengecoh(aul, { jenis: 'ashlAkhir' }).pasanganTertukar).toBe('13');
  });

  // Pewaris P: suami 1/4 (ada anak) + anak perempuan 1/2: ashl 4, saham 1 + 2 = 3 < 4, tanpa ashabah → radd; pasangan tak ikut radd [R09-9]:
  // sisa 1 untuk anak → anak 3/4, suami 1/4, ashl akhir 4 (radd 4, sama dengan ashl).
  const radd = kasus('P', { SUAMI: 1, ANAK_PR: 1 });

  test('lupaRadd: bagian anak = saham di ashl 2/4 = 1/2; bagian suami tidak berubah (sama dengan benar, disaring)', () => {
    expect(benar(radd, { jenis: 'bagian', kunci: 'ANAK_PR' })).toBe('3/4');
    expect(pengecoh(radd, { jenis: 'bagian', kunci: 'ANAK_PR' }).lupaRadd).toBe('1/2');
    expect(pengecoh(radd, { jenis: 'bagian', kunci: 'SUAMI' }).lupaRadd).toBe(benar(radd, { jenis: 'bagian', kunci: 'SUAMI' }));
    expect(pengecoh(radd, { jenis: 'ashlAkhir' }).lupaRadd).toBe(benar(radd, { jenis: 'ashlAkhir' }));
  });

  test('pengecoh kembar disaring: anak 1/2 muncul dari lupaRadd dan pasanganTertukar (suami 1/2 → anak 1/2), tersisa satu → soal dibuang', () => {
    expect(pengecoh(radd, { jenis: 'bagian', kunci: 'ANAK_PR' }).pasanganTertukar).toBe('1/2');
    expect(rakitPilihan('K1-X', fakta(radd), { jenis: 'bagian', kunci: 'ANAK_PR' })).toBeNull();
  });

  // Pewaris L: ayah + 2 saudara kandung. Ayah ashabah mengambil seluruh harta; saudara kandung gugur oleh ayah [R06-4].
  const hajb = kasus('L', { AYAH: 1, SAUDARA_KANDUNG: 2 });

  test('lupaHajb: gugur → "tidak ada" (kunci kosong); ashabah → ayah + saudara yang sebenarnya gugur', () => {
    expect(benar(hajb, { jenis: 'gugur' })).toBe('kunci:SAUDARA_KANDUNG');
    expect(pengecoh(hajb, { jenis: 'gugur' }).lupaHajb).toBe('kunci:');
    expect(benar(hajb, { jenis: 'ashabah' })).toBe('kunci:AYAH');
    expect(pengecoh(hajb, { jenis: 'ashabah' }).lupaHajb).toBe('kunci:AYAH+SAUDARA_KANDUNG');
  });

  test('ashabahTerbalik: gugur → ayah (yang menghalangi); ashabah → saudara kandung (yang kalah)', () => {
    expect(pengecoh(hajb, { jenis: 'gugur' }).ashabahTerbalik).toBe('kunci:AYAH');
    expect(pengecoh(hajb, { jenis: 'ashabah' }).ashabahTerbalik).toBe('kunci:SAUDARA_KANDUNG');
  });

  test('ibuTetapSepertiga bersama ashabah: istri 1/4, ibu 1/6 (dua saudara gugur tetap dihitung, R06-6), ayah ashabah → ibu 1/3 bila salah', () => {
    const ibu = kasus('L', { ISTRI: 1, IBU: 1, SAUDARA_KANDUNG: 2, AYAH: 1 });
    expect(benar(ibu, { jenis: 'bagian', kunci: 'IBU' })).toBe('1/6');
    expect(pengecoh(ibu, { jenis: 'bagian', kunci: 'IBU' }).ibuTetapSepertiga).toBe('1/3');
    // 1/4 + 1/3 = 7/12 < 1 dan ada ashabah → ashl 12 tidak berubah: penyebut keliru sama dengan benar, disaring.
    expect(pengecoh(ibu, { jenis: 'ashlAkhir' }).ibuTetapSepertiga).toBe(benar(ibu, { jenis: 'ashlAkhir' }));
  });

  test('pasanganTertukar bila ada keturunan: istri 1/8 (bukan 1/4), anak laki-laki ashabah 7/8; salah → istri 1/4, anak 3/4, ashl 4', () => {
    const keturunan = kasus('L', { ISTRI: 1, ANAK_LK: 1 });
    expect(benar(keturunan, { jenis: 'bagian', kunci: 'ISTRI' })).toBe('1/8');
    expect(pengecoh(keturunan, { jenis: 'bagian', kunci: 'ISTRI' }).pasanganTertukar).toBe('1/4');
    expect(pengecoh(keturunan, { jenis: 'bagian', kunci: 'ANAK_LK' }).pasanganTertukar).toBe('3/4');
    expect(benar(keturunan, { jenis: 'ashlAkhir' })).toBe('8');
    expect(pengecoh(keturunan, { jenis: 'ashlAkhir' }).pasanganTertukar).toBe('4');
  });

  // Anak laki-laki ×1 dan perempuan ×2, tanpa furudh lain: ashl = 2 + 1 + 1 = 4 [R09-2]; laki-laki 2/4, perempuan 2/4 [R04-11].
  // Sama rata per kepala (3 kepala): laki-laki 1/3, perempuan 2/3, ashl 3.
  test('ashabahSamaRata: 2:1 diganti sama rata per kepala', () => {
    const anak = kasus('L', { ANAK_LK: 1, ANAK_PR: 2 });
    expect(benar(anak, { jenis: 'bagian', kunci: 'ANAK_LK' })).toBe('1/2');
    expect(pengecoh(anak, { jenis: 'bagian', kunci: 'ANAK_LK' }).ashabahSamaRata).toBe('1/3');
    expect(pengecoh(anak, { jenis: 'bagian', kunci: 'ANAK_PR' }).ashabahSamaRata).toBe('2/3');
    expect(benar(anak, { jenis: 'ashlAkhir' })).toBe('4');
    expect(pengecoh(anak, { jenis: 'ashlAkhir' }).ashabahSamaRata).toBe('3');
  });

  test('tiap aturan terdaftar punya dasar KB yang benar-benar ada di tabel "Dasar dan Rujukan"', () => {
    const direktori = new URL('../../../../docs/kb/', import.meta.url);
    const kode = new Set(readdirSync(direktori).filter(nama => nama.endsWith('.md'))
      .flatMap(nama => [...readFileSync(new URL(nama, direktori), 'utf8').matchAll(/^\| (R\d\d-\d+) \|/gm)].map(cocok => cocok[1]!)));
    expect(ATURAN_PENGECOH.map(aturan => aturan.id)).toEqual([...DAFTAR_ATURAN]);
    for (const aturan of ATURAN_PENGECOH) for (const dasar of aturan.dasar) expect(kode.has(dasar), `${aturan.id}: ${dasar}`).toBe(true);
  });
});

// ─── hisab ulang setara engine ────────────────────────────────────────────────

describe('hisabUlang', () => {
  test('tanpa pengganti hasilnya sama dengan engine (bagian tiap baris; penyebut bila tanpa tashih)', () => {
    let dibandingkan = 0;
    for (const dasar of sapuKasusBiasa(4000)) {
      const analisis = analisisKasus(dasar);
      if (!analisis.ok) continue;
      const { fakta: isi } = analisis;
      const dunia = hisabUlang(isi);
      if (!dunia) continue;
      dibandingkan++;
      for (const baris of isi.baris) {
        const saham = Object.values(baris.sahamAkhir).reduce<bigint>((total, nilai) => total + (nilai ?? 0n), 0n);
        const bagian = dunia.bagianBaris.get(baris.id)!;
        expect(bagian.n * isi.penyebutAkhir, JSON.stringify(dasar)).toBe(bagian.d * saham);
      }
      if (isi.tashih === undefined) expect(dunia.penyebut, JSON.stringify(dasar)).toBe(isi.penyebutAkhir);
    }
    expect(dibandingkan).toBeGreaterThan(500);
  });
});

// ─── soal utuh dari sapuan sampel ─────────────────────────────────────────────

describe('soal kuis dari kode (sapuan sampel)', () => {
  const sampel = bangunKuis(() => sapuKasusBiasa(6000), 400);
  const teksPilihan = (pilihan: Array<{ jenis: string; teks?: string }>) => pilihan.map(potongan => potongan.teks ?? '').join('');

  test('sampel cukup besar dan semua jenis pertanyaan ada', () => {
    expect(sampel.terpilih.length).toBeGreaterThan(100);
    expect(new Set(sampel.terpilih.map(baris => baris.jenis)).size).toBe(4);
  });

  test('invarian: 3-4 pilihan, tepat satu kunci, jawaban benar = engine, pengecoh tak sama dengan benar atau satu sama lain', () => {
    for (const baris of sampel.terpilih) {
      const hasil = soalKuisDariKode(baris.kode, penyusun);
      if (!hasil.ok) throw new Error(`${baris.kode}: ${hasil.galat}`);
      const { soal } = hasil;
      expect(soal.pilihan.length).toBeGreaterThanOrEqual(3);
      expect(soal.pilihan.length).toBeLessThanOrEqual(4);
      expect(soal.alasanPilihan).toHaveLength(soal.pilihan.length);
      const teks = soal.pilihan.map(isi => teksPilihan(isi as never));
      expect(new Set(teks).size, baris.kode).toBe(teks.length);
      const kunci = soal.alasanPilihan!.map((alasan, urutan) => (teksPilihan(alasan as never).startsWith('Tepat.') ? urutan : -1)).filter(urutan => urutan >= 0);
      expect(kunci, baris.kode).toEqual([soal.indeksBenar]);
      // jawaban benar dihitung ulang dari engine, bukan dari soal
      const urai = uraiKodeKuis(baris.kode);
      if (!urai.ok) throw new Error('kode tak terurai');
      const analisis = analisisKasus(urai.kasus);
      if (!analisis.ok) throw new Error('kasus tak terhitung');
      const jawaban = jawabanBenar(analisis.fakta, urai.tanya);
      if (jawaban.tipe === 'pecahan') expect(teks[soal.indeksBenar]).toBe(`${jawaban.nilai.n}/${jawaban.nilai.d}`);
      if (jawaban.tipe === 'penyebut') expect(teks[soal.indeksBenar]).toBe(String(jawaban.nilai));
      expect(soal.sumber).toBe('mesin');
      expect(soal.tingkat).toBe(tingkatKuis(analisis.tingkat, urai.tanya.jenis));
      expect(new Set(soal.aturan).size).toBe(soal.aturan.length);
    }
  });

  test('deterministik: kode yang sama menghasilkan soal yang sama', () => {
    for (const baris of sampel.terpilih.slice(0, 30)) expect(soalKuisDariKode(baris.kode, penyusun)).toEqual(soalKuisDariKode(baris.kode, penyusun));
  });

  test('kode dari sampel bolak-balik dan baris indeks cocok dengan soalnya', () => {
    for (const baris of sampel.terpilih) {
      const urai = uraiKodeKuis(baris.kode);
      if (!urai.ok) throw new Error('kode tak terurai');
      expect(buatKodeKuis(urai.kasus, urai.tanya)).toBe(baris.kode);
      const hasil = soalKuisDariKode(baris.kode, penyusun);
      if (!hasil.ok) throw new Error('soal tak terbentuk');
      expect(hasil.soal.aturan).toEqual(baris.aturan);
      expect(hasil.soal.tingkat).toBe(baris.tingkat);
      expect(hasil.soal.modul).toEqual(baris.modul);
    }
  });

  test('gugur dan ashabah satu tingkat lebih mudah daripada kasusnya, minimal dasar', () => {
    expect(tingkatKuis('sulit', 'gugur')).toBe('menengah');
    expect(tingkatKuis('menengah', 'ashabah')).toBe('dasar');
    expect(tingkatKuis('dasar', 'ashabah')).toBe('dasar');
    expect(tingkatKuis('sulit', 'bagian')).toBe('sulit');
    expect(tingkatKuis('menengah', 'ashlAkhir')).toBe('menengah');
  });

  test('pertanyaan yang tidak sah untuk kasusnya ditolak (gugur tanpa yang gugur)', () => {
    const kode = buatKodeKuis(kasus('L', { ANAK_LK: 1 }), { jenis: 'gugur' });
    expect(soalKuisDariKode(kode, penyusun)).toEqual({ ok: false, galat: 'PERTANYAAN_TIDAK_SAH' });
  });

  test('daftarPertanyaan hanya memuat penerima bagian', () => {
    const isi = fakta(kasus('L', { AYAH: 1, SAUDARA_KANDUNG: 2 }));
    expect(daftarPertanyaan(isi)).toEqual([{ jenis: 'bagian', kunci: 'AYAH' }, { jenis: 'ashlAkhir' }, { jenis: 'gugur' }, { jenis: 'ashabah' }]);
  });
});

// ─── diksi ────────────────────────────────────────────────────────────────────

describe('diksi soal_kuis', () => {
  const direktori = new URL('../bank/kuis/', import.meta.url);
  const sumber = readdirSync(direktori).filter(nama => nama.endsWith('.ts')).map(nama => readFileSync(new URL(nama, direktori), 'utf8')).join('\n');
  const dipakai = new Set([...sumber.matchAll(/'(soal_kuis\.[a-z0-9_.]+)'/g)].map(cocok => cocok[1]!));
  const diSnapshot = snapshot.diksi.map(butir => butir.kunci).filter(kunci => kunci.startsWith('soal_kuis.'));

  test('setiap kunci di kode ada di snapshot dan sebaliknya', () => {
    expect([...dipakai].filter(kunci => !petaDiksi.has(kunci))).toEqual([]);
    expect(diSnapshot.filter(kunci => !dipakai.has(kunci))).toEqual([]);
  });

  test('semua aturan punya alasan yang bisa disusun (tidak ada kunci/sisipan hilang)', () => {
    const terlihat = new Set<AturanPengecoh>();
    for (const baris of sampel_aturan()) {
      const hasil = soalKuisDariKode(baris, penyusun);
      if (hasil.ok) hasil.soal.aturan.forEach(aturan => terlihat.add(aturan));
    }
    expect([...terlihat].sort()).toEqual([...DAFTAR_ATURAN].sort());
  });
});

/** Satu kode per aturan: sapuan dihentikan begitu semua aturan pernah menjadi pengecoh terpilih. */
function sampel_aturan(): string[] {
  const perAturan = new Map<AturanPengecoh, string>();
  for (const dasar of sapuKasusBiasa()) {
    const analisis = analisisKasus(dasar);
    if (!analisis.ok) continue;
    for (const tanya of daftarPertanyaan(analisis.fakta)) {
      const kode = buatKodeKuis(dasar, tanya);
      for (const isi of rakitPilihan(kode, analisis.fakta, tanya)?.pengecoh ?? []) if (!perAturan.has(isi.aturan)) perAturan.set(isi.aturan, kode);
    }
    if (perAturan.size === DAFTAR_ATURAN.length) break;
  }
  return [...perAturan.values()];
}
