// Isi revisi → daftar bidang berlabel manusia untuk dibandingkan (riwayat & antrean review), menggantikan diff JSON.
// Menerima jenis, isi mentah, dan refs; memutuskan teks tiap bidang FORM_KONTEN (Markdown dibersihkan: dalil jadi
// klaimnya, istilah jadi teks tampilnya; bab/ahli waris/kasus jadi kalimat). Isi yang tidak terbaca Zod tetap
// ditampilkan sebagai satu bidang "Isi" supaya tidak ada yang disembunyikan.
import { bacaIsi, JUDUL_BAB, type BarisAhwal, type ContohKasus, type JenisKonten } from '@waris/content';
import { FORM_KONTEN, type Bidang } from './formulir';
import { labelKunci } from './kasus';
import { keNilaiForm, type NilaiBidang, type NilaiPilihanKuis } from './nilaiForm';
import { teksRujukan } from './rujukan';
import { diffKata, type BarisDiff } from './diff';

export interface BidangBanding { label: string; arab: boolean; teks: string }
export interface PerubahanBidang { label: string; arab: boolean; potongan: BarisDiff[] }

export function bidangBanding(jenis: JenisKonten, isi: unknown, refs: readonly string[]): BidangBanding[] {
  const rujukan = { label: 'Rujukan dalil', arab: false, teks: refs.map(teksRujukan).join('\n') };
  const hasil = bacaIsi(jenis, isi);
  if (!hasil.ok) return [{ label: 'Isi', arab: false, teks: JSON.stringify(isi, null, 2) }, rujukan];
  const form = keNilaiForm(jenis, hasil.isi);
  const bidang = FORM_KONTEN[jenis]
    .filter(bagian => !bagian.objekOpsional || form.aktif[bagian.objekOpsional])
    .flatMap(bagian => bagian.bidang)
    .map(b => ({ label: b.label, arab: !!b.arab, teks: teksNilai(b, form.nilai[b.jalur]) }));
  return [...bidang, rujukan];
}

/** Hanya bidang yang berubah; `lama` null = entri baru (semua isi tambah). Bidang dicocokkan lewat labelnya. */
export function daftarPerubahan(lama: BidangBanding[] | null, baru: BidangBanding[]): PerubahanBidang[] {
  const labelUrut = [...new Set([...baru.map(b => b.label), ...(lama ?? []).map(b => b.label)])];
  return labelUrut.flatMap(label => {
    const sebelum = lama?.find(b => b.label === label);
    const sesudah = baru.find(b => b.label === label);
    if ((sebelum?.teks ?? '') === (sesudah?.teks ?? '')) return [];
    return [{ label, arab: (sesudah ?? sebelum)!.arab, potongan: diffKata(sebelum?.teks ?? '', sesudah?.teks ?? '') }];
  });
}

function teksNilai(bidang: Bidang, nilai: NilaiBidang | undefined): string {
  if (nilai === undefined) return '';
  if (typeof nilai === 'boolean') return nilai ? 'Ya' : 'Tidak';
  if (typeof nilai === 'string') {
    if (bidang.jenis === 'markdownBlok' || bidang.jenis === 'markdownPotongan') return bersihkanMarkdown(nilai);
    if (bidang.sumberOpsi === 'bab' && nilai) return `Bab ${nilai} · ${JUDUL_BAB[Number(nilai)] ?? ''}`;
    if (bidang.sumberOpsi === 'refs' && nilai) return teksRujukan(nilai);
    if (bidang.sumberOpsi === 'kunciAhliWaris' && nilai) return labelKunci(nilai);
    return nilai;
  }
  if (bidang.jenis === 'pilihanKuis') {
    const { daftar, benar } = nilai as NilaiPilihanKuis;
    return daftar.map((teks, i) => `${String.fromCharCode(65 + i)}. ${bersihkanMarkdown(teks)}${i === benar ? ' (jawaban benar)' : ''}`).join('\n');
  }
  if (bidang.jenis === 'barisAhwal') return (nilai as BarisAhwal[]).map(baris => `${baris.bagian} — ${baris.syarat}`).join('\n');
  return teksKasus(nilai as ContohKasus);
}

function teksKasus(kasus: ContohKasus): string {
  const jumlah = new Map<string, number>();
  for (const kunci of kasus.ahliWaris) jumlah.set(kunci, (jumlah.get(kunci) ?? 0) + 1);
  const ahliWaris = [...jumlah].map(([kunci, n]) => (n > 1 ? `${labelKunci(kunci)} ×${n}` : labelKunci(kunci))).join(', ');
  const saham = Object.entries(kasus.harapan.saham).map(([kunci, s]) => `${labelKunci(kunci)} ${s}`).join(', ');
  return [
    `Pewaris: ${kasus.pewaris === 'L' ? 'laki-laki' : 'perempuan'}`,
    `Ahli waris: ${ahliWaris || '—'}`,
    `Harta: Rp ${kasus.harta.toLocaleString('id-ID')}`,
    `Jawaban: ashl akhir ${kasus.harapan.ashlAkhir}; ${saham || '—'}`,
  ].join('\n');
}

/** Kode dalil → klaimnya, [[id|teks]] → teks, [[id]] → id. Tanda Markdown lain dibiarkan (tetap terbaca). */
export const bersihkanMarkdown = (teks: string): string => teks
  .replace(/\[(R\d{2}-\d+)\]/g, (_, kode: string) => `(dalil: ${teksRujukan(kode)})`)
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
  .replace(/\[\[([^\]]+)\]\]/g, '$1');
