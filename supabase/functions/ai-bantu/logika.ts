// Logika murni Edge Function ai-bantu (tanpa I/O, tanpa impor, jadi bisa dijalankan Deno dan dites vitest):
// membaca & memvalidasi permintaan, menyusun prompt + skema JSON per fitur, lalu memeriksa jawaban AI.
// Batas dari pengguna (rencana portal, A6/C7): AI TIDAK membuat hukum di materi/FAQ; di sana hanya merapikan bahasa dan
// memberi saran kelengkapan. Hanya draf soal kuis yang boleh dibuat AI, dengan rujukan dari bab itu saja, dan wajib review.

export const KUOTA_HARIAN = 50;
export const BATAS_PANJANG = 20_000;
const JUMLAH_PILIHAN = 4;

export type Permintaan =
  | { fitur: 'rapikan'; teks: string }
  | { fitur: 'drafKuis'; bab: number; judulBab: string; rujukan: RujukanKonteks[]; pertanyaan: string }
  | { fitur: 'saran'; jenis: 'materi' | 'faq'; judul: string; teks: string };
export interface RujukanKonteks { kode: string; klaim: string; sumber: string; kutipan: string }

export interface DrafKuis {
  pertanyaan: string; pilihan: string[]; indeksBenar: number; alasanPilihan: string[]; pembahasan: string; rujukan: string[];
}
export type Hasil =
  | { fitur: 'rapikan'; teks: string }
  | { fitur: 'drafKuis'; draf: DrafKuis }
  | { fitur: 'saran'; saran: string[] };

type Galat = { ok: false; galat: string };

// ─── Permintaan ──────────────────────────────────────────────────────────────

export function bacaPermintaan(json: unknown): { ok: true; permintaan: Permintaan } | Galat {
  const p = json as Record<string, unknown> | null;
  const teks = (nilai: unknown) => typeof nilai === 'string' && nilai.length <= BATAS_PANJANG;
  if (p?.fitur === 'rapikan' && teks(p.teks) && (p.teks as string).trim()) return { ok: true, permintaan: { fitur: 'rapikan', teks: p.teks as string } };
  if (p?.fitur === 'saran' && (p.jenis === 'materi' || p.jenis === 'faq') && teks(p.judul) && teks(p.teks)) {
    return { ok: true, permintaan: { fitur: 'saran', jenis: p.jenis, judul: p.judul as string, teks: p.teks as string } };
  }
  if (p?.fitur === 'drafKuis' && Number.isInteger(p.bab) && teks(p.judulBab) && teks(p.pertanyaan ?? '') && Array.isArray(p.rujukan)
    && p.rujukan.length > 0 && p.rujukan.every(r => typeof r?.kode === 'string' && teks(r.klaim) && teks(r.sumber) && teks(r.kutipan))) {
    return { ok: true, permintaan: {
      fitur: 'drafKuis', bab: p.bab as number, judulBab: p.judulBab as string, pertanyaan: (p.pertanyaan as string | undefined) ?? '',
      rujukan: (p.rujukan as RujukanKonteks[]).map(({ kode, klaim, sumber, kutipan }) => ({ kode, klaim, sumber, kutipan })),
    } };
  }
  return { ok: false, galat: 'Permintaan AI tidak dikenali atau terlalu panjang.' };
}

// ─── Pengunci sisipan ────────────────────────────────────────────────────────
// Rujukan [R09-7] dan istilah [[ashabah|para ashabah]] diganti token ⟦n⟧ sebelum dikirim, supaya AI tidak bisa mengubah
// atau menghapusnya; jawaban yang tokennya hilang/berubah ditolak.

const POLA_SISIPAN = /\[\[[^\]\n]+\]\]|\[R\d{2}-\d+\]/g;

export function kunciSisipan(teks: string): { teks: string; sisipan: string[] } {
  const sisipan: string[] = [];
  return { teks: teks.replace(POLA_SISIPAN, cocok => `⟦${sisipan.push(cocok) - 1}⟧`), sisipan };
}

export function bukaSisipan(teks: string, sisipan: readonly string[]): string | null {
  const token = [...teks.matchAll(/⟦(\d+)⟧/g)].map(c => Number(c[1])).sort((a, b) => a - b);
  if (token.length !== sisipan.length || token.some((n, i) => n !== i)) return null;
  return teks.replace(/⟦(\d+)⟧/g, (_, n: string) => sisipan[Number(n)]!);
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

export interface Prompt { sistem: string; pengguna: string; skema: Record<string, unknown>; suhu: number }

const ATURAN_UMUM = 'Tulis dalam bahasa Indonesia baku yang ramah bagi orang awam. Jangan memakai emoji.';

export function susunPrompt(permintaan: Permintaan): Prompt {
  switch (permintaan.fitur) {
    case 'rapikan': return {
      sistem: `${ATURAN_UMUM} Tugasmu HANYA merapikan ejaan, tata bahasa, dan kejelasan kalimat. Jangan menambah, menghapus, `
        + 'atau mengubah klaim, angka, hukum, dalil, maupun istilah Arab. Pertahankan susunan Markdown (judul, daftar, tabel). '
        + 'Token berbentuk ⟦angka⟧ adalah sisipan yang terkunci: salin persis, jangan dihapus, digabung, atau dipindah ke kalimat lain.',
      pengguna: kunciSisipan(permintaan.teks).teks,
      skema: { type: 'object', properties: { teks: { type: 'string' } }, required: ['teks'] },
      suhu: 0.2,
    };
    case 'saran': return {
      sistem: `${ATURAN_UMUM} Kamu penyunting materi belajar waris (faraidh). Beri paling banyak 6 saran singkat agar `
        + `${permintaan.jenis === 'faq' ? 'jawaban FAQ' : 'materi'} ini lebih jelas bagi orang awam. `
        + 'Konteks aplikasi, JANGAN disarankan ulang: [[istilah]] sudah tertaut ke glosarium (pembaca bisa mengetuknya untuk melihat arti); '
        + '[Rxx-y] adalah rujukan yang sudah tertaut ke dalil lengkap beserta sumber kitab dan perawinya; '
        + 'materi dipecah per pelajaran, jadi topik di luar judul ini sudah dibahas di pelajaran lain dan jangan diminta ditambahkan. '
        + 'Fokus pada isi pelajaran ini saja: bagian yang membingungkan atau terlalu padat, urutan penjelasan, contoh yang kurang tepat '
        + 'untuk poin yang sudah ada, atau klaim hukum yang sama sekali belum diberi [Rxx-y]. Tiap saran menyebut bagian mana yang dimaksud. '
        + 'Bila materi sudah baik, kembalikan daftar kosong; jangan mengarang saran. JANGAN menulis hukum, jawaban, atau dalil baru.',
      pengguna: `Judul: ${permintaan.judul}\n\n${permintaan.teks}`,
      skema: { type: 'object', properties: { saran: { type: 'array', items: { type: 'string' } } }, required: ['saran'] },
      suhu: 0.4,
    };
    case 'drafKuis': return {
      sistem: `${ATURAN_UMUM} Buat SATU soal pilihan ganda (${JUMLAH_PILIHAN} pilihan, tepat satu benar) tentang faraidh madzhab `
        + "Syafi'i yang HANYA bersandar pada daftar dasar hukum yang diberikan; jangan memakai pengetahuan lain. Pilihan salah "
        + 'sebaiknya kesalahan yang sering terjadi. Beri alasan untuk tiap pilihan dan pembahasan singkat. Sisipkan dalil dengan '
        + 'menulis kodenya dalam kurung siku, mis. [R04-2], hanya memakai kode dari daftar.',
      pengguna: `Bab ${permintaan.bab}: ${permintaan.judulBab}\n`
        + (permintaan.pertanyaan.trim() ? `Arah pertanyaan dari penulis: ${permintaan.pertanyaan.trim()}\n` : '')
        + '\nDasar hukum:\n' + permintaan.rujukan.map(r => `[${r.kode}] ${r.klaim} — ${r.sumber}. ${r.kutipan}`).join('\n'),
      skema: {
        type: 'object',
        properties: {
          pertanyaan: { type: 'string' }, pilihan: { type: 'array', items: { type: 'string' } }, indeksBenar: { type: 'integer' },
          alasanPilihan: { type: 'array', items: { type: 'string' } }, pembahasan: { type: 'string' },
          rujukan: { type: 'array', items: { type: 'string' } },
        },
        required: ['pertanyaan', 'pilihan', 'indeksBenar', 'alasanPilihan', 'pembahasan', 'rujukan'],
      },
      suhu: 0.7,
    };
  }
}

// ─── Jawaban ─────────────────────────────────────────────────────────────────

export function olahJawaban(permintaan: Permintaan, teksJson: string): { ok: true; hasil: Hasil } | Galat {
  let json: Record<string, unknown>;
  try { json = JSON.parse(teksJson); } catch { return { ok: false, galat: 'Jawaban AI tidak terbaca. Coba lagi.' }; }
  switch (permintaan.fitur) {
    case 'rapikan': {
      const teks = typeof json.teks === 'string' ? bukaSisipan(json.teks, kunciSisipan(permintaan.teks).sisipan) : null;
      return teks === null
        ? { ok: false, galat: 'AI mengubah atau menghapus rujukan/istilah sisipan, jadi hasilnya dibuang. Coba lagi.' }
        : { ok: true, hasil: { fitur: 'rapikan', teks } };
    }
    case 'saran': {
      const saran = Array.isArray(json.saran) ? json.saran.filter((s): s is string => typeof s === 'string' && !!s.trim()).slice(0, 6) : [];
      return { ok: true, hasil: { fitur: 'saran', saran } };
    }
    case 'drafKuis': return periksaDrafKuis(json, new Set(permintaan.rujukan.map(r => r.kode)));
  }
}

function periksaDrafKuis(json: Record<string, unknown>, kodeBoleh: ReadonlySet<string>): { ok: true; hasil: Hasil } | Galat {
  const teks = (nilai: unknown): nilai is string => typeof nilai === 'string' && nilai.trim().length > 0;
  const { pertanyaan, pilihan, indeksBenar, alasanPilihan, pembahasan, rujukan } = json;
  if (!teks(pertanyaan) || !teks(pembahasan) || !Array.isArray(pilihan) || pilihan.length !== JUMLAH_PILIHAN || !pilihan.every(teks)
    || !Array.isArray(alasanPilihan) || alasanPilihan.length !== JUMLAH_PILIHAN || !alasanPilihan.every(teks)
    || !Number.isInteger(indeksBenar) || (indeksBenar as number) < 0 || (indeksBenar as number) >= JUMLAH_PILIHAN) {
    return { ok: false, galat: 'Draf AI tidak lengkap. Coba lagi.' };
  }
  const semuaTeks = [pertanyaan, pembahasan, ...pilihan, ...alasanPilihan].join('\n');
  const dipakai = [...new Set([...semuaTeks.matchAll(/\[(R\d{2}-\d+)\]/g)].map(c => c[1]!).concat(Array.isArray(rujukan) ? rujukan.filter(teks) : []))];
  const asing = dipakai.filter(kode => !kodeBoleh.has(kode));
  if (asing.length) return { ok: false, galat: `AI memakai rujukan di luar bab ini (${asing.join(', ')}), jadi drafnya dibuang. Coba lagi.` };
  if (dipakai.length === 0) return { ok: false, galat: 'Draf AI tidak menyertakan dalil. Coba lagi.' };
  return { ok: true, hasil: { fitur: 'drafKuis', draf: {
    pertanyaan, pilihan: pilihan as string[], indeksBenar: indeksBenar as number, alasanPilihan: alasanPilihan as string[], pembahasan, rujukan: dipakai,
  } } };
}

/** Awal hari ini menurut WIB (UTC+7), untuk kuota harian. */
export function awalHariWib(sekarang: Date): string {
  const wib = new Date(sekarang.getTime() + 7 * 3_600_000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3_600_000).toISOString();
}
