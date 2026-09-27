// Daftar kelengkapan di panel Info: tiap bidang wajib (bidangWajib) beserta statusnya — sudah benar, belum diisi, atau
// belum benar (galat dariNilaiForm) — ditambah rujukan dalil bila jenisnya wajib punya rujukan. Murni; EditorEntri
// yang menghitung galat & kewajiban rujukan.
import type { JenisKonten } from '@waris/content';
import { bidangWajib, FORM_KONTEN } from './formulir';
import type { NilaiBidang, NilaiForm, NilaiPilihanKuis } from './nilaiForm';

export type StatusButir = 'benar' | 'kosong' | 'salah';
export interface ButirKelengkapan { jalur: string; label: string; status: StatusButir }

export function daftarKelengkapan(jenis: JenisKonten, form: NilaiForm, galatBidang: Record<string, string>, rujukanWajibKurang: boolean | null): ButirKelengkapan[] {
  const butir: ButirKelengkapan[] = FORM_KONTEN[jenis]
    .filter(bagian => !bagian.objekOpsional || form.aktif[bagian.objekOpsional])
    .flatMap(bagian => bagian.bidang.filter(bidangWajib))
    .map(bidang => ({
      jalur: bidang.jalur, label: bidang.label,
      status: kosong(form.nilai[bidang.jalur]) ? 'kosong' : galatBidang[bidang.jalur] ? 'salah' : 'benar',
    }));
  if (rujukanWajibKurang !== null) butir.push({ jalur: 'refs', label: 'Rujukan dalil', status: rujukanWajibKurang ? 'kosong' : 'benar' });
  return butir;
}

function kosong(nilai: NilaiBidang | undefined): boolean {
  if (nilai === undefined) return true;
  if (typeof nilai === 'string') return nilai.trim() === '';
  if (typeof nilai === 'boolean') return false;
  if (Array.isArray(nilai)) return nilai.length === 0;
  if ('daftar' in nilai) return (nilai as NilaiPilihanKuis).daftar.some(teks => teks.trim() === '');
  return nilai.ahliWaris.length === 0;
}
