// Setiap soal_hitung di snapshot.json (yang terbit) dijalankan lewat engine; saham per kunci dan ashl akhir
// harus sama dengan kunci jawaban (`harapan`) di konten. Membaca berkas snapshot langsung, bukan getter,
// supaya yang diuji persis isi yang dikirim ke pengguna.
import { describe, expect, it } from 'vitest';
import { bacaIsi } from '@waris/content';
import { jalankan, kasusDariSoal } from '@waris/latihan';
import { ringkas } from '../hasil/ringkasan';
import bawaan from '../snapshot.json';

const soalTerbit = (bawaan.konten as { jenis: string; slug: string; isi: unknown }[])
  .filter(baris => baris.jenis === 'soal_hitung')
  .map(baris => {
    const dibaca = bacaIsi('soal_hitung', baris.isi);
    if (!dibaca.ok) throw new Error(`${baris.slug}: ${dibaca.galat}`);
    return [baris.slug, dibaca.isi] as const;
  });

describe('soal_hitung terbit: kunci jawaban = hasil engine', () => {
  it('ada soal yang diuji', () => expect(soalTerbit.length).toBeGreaterThan(0));

  it.each(soalTerbit)('%s', (_slug, soal) => {
    if (!('harapan' in soal.kasus)) throw new Error('soal berkas belum punya kunci yang bisa dibandingkan di tes ini');
    const kasus = kasusDariSoal(soal.kasus);
    const tampil = jalankan(kasus);
    if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') throw new Error(JSON.stringify(tampil, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
    const { penerima, penyebut } = ringkas(kasus, tampil);
    const saham: Record<string, bigint> = {};
    for (const orang of penerima) if (orang.saham > 0n) saham[orang.kunci!] = (saham[orang.kunci!] ?? 0n) + orang.saham;
    expect({ saham, ashlAkhir: penyebut }).toEqual(soal.kasus.harapan);
  });
});
