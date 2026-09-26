// Tipe FAQ (isinya konten jenis faq di database): jawaban = blok Markdown terbatas yang sama dengan materi.
import type { Blok } from './materi.js';

export interface EntriFaq { id: string; kelompok: string; pertanyaan: string; jawaban: Blok[] }
