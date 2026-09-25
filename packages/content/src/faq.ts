/// <reference path="./raw.d.ts" />
// FAQ dari `docs/faq.md`: `## kelompok`, `### pertanyaan`, jawaban = blok Markdown terbatas yang sama dengan materi.
import faqMd from '../../../docs/faq.md?raw';
import { slug } from './glossary.js';
import { bacaBlok, type Blok } from './materi.js';

export interface EntriFaq { id: string; kelompok: string; pertanyaan: string; jawaban: Blok[] }

export function bacaFaq(teksMarkdown: string): EntriFaq[] {
  return teksMarkdown.split(/^## /m).slice(1).flatMap(bagianKelompok => {
    const [kelompok = '', ...daftarPertanyaan] = bagianKelompok.split(/^### /m);
    return daftarPertanyaan.map(bagian => {
      const [pertanyaan = '', ...isi] = bagian.split('\n');
      return { id: slug(pertanyaan), kelompok: kelompok.trim(), pertanyaan: pertanyaan.trim(), jawaban: bacaBlok(`faq ${pertanyaan}`, isi.join('\n')) };
    });
  });
}

export const DAFTAR_FAQ: EntriFaq[] = bacaFaq(faqMd);
