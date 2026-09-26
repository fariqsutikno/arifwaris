// apps/web/src/konten/sumber.ts
// Satu-satunya pintu web ke konten & diksi terbit. Menerima snapshot (bawaan build, atau cache yang dipasang main.tsx
// sebelum Aplikasi diimpor), memvalidasinya sekali, dan menyerahkan getter sinkron ke komponen. Glosarium = KB bab 15
// (tetap di repo) + terjemahan Arab dari konten glosarium_ar.
import { GLOSARIUM, type BarisAhwal, type EntriGlosarium, type IsiKonten, type IsiTeksEdukasi, type JenisKonten, type Pelajaran, type SoalHitung } from '@waris/content';
import type { DiksiTerbit, KontenTerbit } from '@waris/data';
import { saringDiksiValid, saringValid, type Snapshot } from '@waris/data/snapshot';
import bawaan from '../snapshot.json';

let terpasang: Snapshot;
let perJenis = new Map<JenisKonten, KontenTerbit[]>();
let diksi = new Map<string, DiksiTerbit>();
let glosariumTergabung: EntriGlosarium[] = [];
let istilahMenurutSinonim = new Map<string, EntriGlosarium>();

export function pasangSnapshot(snapshot: Snapshot): void {
  terpasang = snapshot;
  perJenis = new Map();
  for (const baris of saringValid(snapshot.konten)) perJenis.set(baris.jenis, [...(perJenis.get(baris.jenis) ?? []), baris]);
  for (const daftar of perJenis.values()) daftar.sort((a, b) => a.urutan - b.urutan || a.slug.localeCompare(b.slug));
  diksi = new Map(saringDiksiValid(snapshot.diksi).map(butir => [butir.kunci, butir]));
  glosariumTergabung = gabungGlosarium();
  istilahMenurutSinonim = new Map(glosariumTergabung.flatMap(entri => entri.sinonim.map(sinonim => [sinonim, entri] as const)));
}
export const snapshotTerpasang = (): Snapshot => terpasang;
export const daftarKonten = <J extends JenisKonten>(jenis: J): IsiKonten[J][] =>
  (perJenis.get(jenis) ?? []).map(baris => baris.isi as IsiKonten[J]);

export const daftarModul = () => daftarKonten('modul');
export const daftarPelajaran = () => daftarKonten('materi');
export const daftarSoalKuis = () => daftarKonten('soal_kuis');
export const daftarSoalHitung = () => daftarKonten('soal_hitung');
export const daftarFaq = () => daftarKonten('faq');
export const daftarTanyaJawab = () => daftarKonten('tanya_jawab');
export const daftarSyahid = () => daftarKonten('syahid');
export const sumberKitab = () => daftarKonten('kitab');
export const daftarCheatsheet = () => daftarKonten('cheatsheet');
export const cariPelajaran = (slug: string): Pelajaran | undefined => daftarPelajaran().find(p => p.slug === slug);
export const cariSoalHitung = (kode: string): SoalHitung | undefined => daftarSoalHitung().find(s => s.kode === kode);
export const glosarium = (): EntriGlosarium[] => glosariumTergabung;
export const cariIstilah = (id: string): EntriGlosarium | undefined => istilahMenurutSinonim.get(id);
export const ahwalUntuk = (kunci: string): BarisAhwal[] | undefined => daftarKonten('ahwal').find(a => a.kunci === kunci)?.baris;
export const cariDiksi = (kunci: string): DiksiTerbit | undefined => diksi.get(kunci);
export const teksEdukasiMentah = (slug: string): IsiTeksEdukasi | undefined =>
  perJenis.get('teks_edukasi')?.find(baris => baris.slug === slug)?.isi as IsiTeksEdukasi | undefined;

function gabungGlosarium(): EntriGlosarium[] {
  const arab = new Map(daftarKonten('glosarium_ar').map(isi => [isi.istilahId, isi]));
  return GLOSARIUM.map(entri => {
    const terjemahan = arab.get(entri.istilah);
    if (!terjemahan) return entri;
    const { istilahId: _istilah, ...ar } = terjemahan;
    return { ...entri, ar };
  });
}

// Dipasang terakhir: getter di atas (const) harus sudah terdefinisi.
pasangSnapshot(bawaan as Snapshot);
