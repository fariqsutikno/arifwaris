// Peta menu portal: satu sumber untuk sidebar (Kerangka), rute (#/menu/<kunci>/<tab>), dan daftar konten.
// Menerima JENIS_KONTEN + diksi, mengelompokkannya menjadi menu berlabel manusiawi (spec tahap A "Kerangka & navigasi").
// isi[0] = tab bawaan; menu materi menampilkan modul sebagai kepala grup, bukan tab.
import type { JenisKonten } from '@waris/content';
import { AppWindow, BookOpen, Calculator, CircleHelp, GraduationCap, Library, ListChecks, MessagesSquare, type LucideIcon } from 'lucide-react';

export type IsiMenu = JenisKonten | 'diksi';
export type KunciMenu = 'materi' | 'soal_kuis' | 'soal_hitung' | 'tanya_jawab' | 'faq' | 'pustaka' | 'kamus' | 'aplikasi';
export type GrupMenu = 'Belajar' | 'Bank soal' | 'Tanya jawab' | 'Pustaka' | 'Aplikasi';
export interface Menu { kunci: KunciMenu; label: string; grup: GrupMenu; ikon: LucideIcon; isi: readonly IsiMenu[] }

export const MENU_PORTAL: readonly Menu[] = [
  { kunci: 'materi', label: 'Modul & Materi', grup: 'Belajar', ikon: GraduationCap, isi: ['materi', 'modul'] },
  { kunci: 'soal_kuis', label: 'Soal kuis', grup: 'Bank soal', ikon: ListChecks, isi: ['soal_kuis'] },
  { kunci: 'soal_hitung', label: 'Soal hitung', grup: 'Bank soal', ikon: Calculator, isi: ['soal_hitung'] },
  { kunci: 'tanya_jawab', label: 'Kasus tanya jawab', grup: 'Tanya jawab', ikon: MessagesSquare, isi: ['tanya_jawab'] },
  { kunci: 'faq', label: 'FAQ', grup: 'Tanya jawab', ikon: CircleHelp, isi: ['faq'] },
  { kunci: 'pustaka', label: 'Kitab & syahid', grup: 'Pustaka', ikon: Library, isi: ['kitab', 'syahid'] },
  { kunci: 'kamus', label: 'Glosarium & ahwal', grup: 'Pustaka', ikon: BookOpen, isi: ['glosarium_ar', 'ahwal'] },
  { kunci: 'aplikasi', label: 'Teks aplikasi', grup: 'Aplikasi', ikon: AppWindow, isi: ['teks_edukasi', 'diksi', 'cheatsheet'] },
];

export const LABEL_ISI: Record<IsiMenu, string> = {
  modul: 'Modul', materi: 'Materi', soal_kuis: 'Soal kuis', soal_hitung: 'Soal hitung', tanya_jawab: 'Kasus tanya jawab',
  faq: 'FAQ', kitab: 'Kitab', syahid: 'Syahid', glosarium_ar: 'Glosarium', ahwal: 'Ahwal', teks_edukasi: 'Teks edukasi',
  cheatsheet: 'Cheatsheet', diksi: 'Diksi',
};

export const menuDari = (kunci: string): Menu | undefined => MENU_PORTAL.find(menu => menu.kunci === kunci);

export function menuUntukJenis(jenis: IsiMenu): Menu {
  const menu = MENU_PORTAL.find(calon => calon.isi.includes(jenis));
  if (!menu) throw new Error(`jenis ${jenis} tidak ada di MENU_PORTAL`);
  return menu;
}
