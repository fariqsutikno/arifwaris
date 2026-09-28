// Edge Function ai-bantu: satu-satunya jalan portal ke Gemini, supaya GEMINI_API_KEY tidak pernah ada di bundel web/admin.
// Memeriksa sesi + peran (penulis/admin), kuota harian per pengguna (tabel pemakaian_ai), memanggil Gemini dengan
// prompt & skema dari logika.ts, memeriksa jawabannya, lalu mencatat pemakaian. Secret: GEMINI_API_KEY (wajib),
// GEMINI_MODEL & GEMINI_MODEL_CADANGAN (opsional). SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY disediakan Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { awalHariWib, bacaPermintaan, KUOTA_HARIAN, olahJawaban, susunPrompt, type Permintaan } from './logika.ts';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
// Dipakai bila model utama sibuk (503/429) setelah dicoba ulang; kosongkan secret = sama dengan model utama.
const MODEL_CADANGAN = Deno.env.get('GEMINI_MODEL_CADANGAN') ?? 'gemini-2.5-flash';
const STATUS_SIBUK = new Set([429, 500, 503]);
const JEDA_ULANG_MS = 1500;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sebab umum dari Gemini dalam kalimat yang bisa ditindaklanjuti admin (rincian lengkap ada di log fungsi).
const PESAN_STATUS_GEMINI: Record<number, string> = {
  400: `Permintaan ditolak Gemini. Periksa GEMINI_MODEL (sekarang "${MODEL}") dan GEMINI_API_KEY.`,
  403: 'GEMINI_API_KEY ditolak (tidak sah atau tidak punya akses ke model ini).',
  404: `Model "${MODEL}" tidak dikenal Gemini. Periksa secret GEMINI_MODEL.`,
  429: 'Kuota Gemini (dari Google) habis atau terlalu banyak permintaan. Coba lagi nanti.',
  503: 'Server Gemini sedang penuh. Coba lagi beberapa menit lagi.',
};

const balas = (status: number, isi: unknown) =>
  new Response(JSON.stringify(isi), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = Deno.env.get('SUPABASE_URL')!;
  const kunciGemini = Deno.env.get('GEMINI_API_KEY');
  if (!kunciGemini) return balas(503, { galat: 'Fitur AI belum diaktifkan (GEMINI_API_KEY belum dipasang).' });

  const klien = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false },
  });
  const { data: { user } } = await klien.auth.getUser();
  if (!user) return balas(401, { galat: 'Masuk dulu untuk memakai AI.' });
  const { data: peran } = await klien.rpc('peran_saya');
  if (peran !== 'admin' && peran !== 'penulis') return balas(403, { galat: 'AI hanya untuk penulis dan admin.' });

  const servis = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { count } = await servis.from('pemakaian_ai').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('berhasil', true).gte('pada', awalHariWib(new Date()));
  if ((count ?? 0) >= KUOTA_HARIAN) return balas(429, { galat: `Kuota AI hari ini (${KUOTA_HARIAN} kali) sudah habis. Coba lagi besok.` });

  const baca = bacaPermintaan(await req.json().catch(() => null));
  if (!baca.ok) return balas(400, { galat: baca.galat });
  const jawaban = await tanyaGemini(baca.permintaan, kunciGemini);
  const hasil = jawaban.ok ? olahJawaban(baca.permintaan, jawaban.teks) : jawaban;
  await servis.from('pemakaian_ai').insert({
    user_id: user.id, fitur: baca.permintaan.fitur, berhasil: hasil.ok,
    token_masuk: jawaban.ok ? jawaban.tokenMasuk : null, token_keluar: jawaban.ok ? jawaban.tokenKeluar : null,
  });
  // Kuota hanya berkurang bila bantuan berhasil sampai ke pengguna.
  const sisaKuota = KUOTA_HARIAN - (count ?? 0) - (hasil.ok ? 1 : 0);
  return hasil.ok ? balas(200, { hasil: hasil.hasil, sisaKuota }) : balas(422, { galat: hasil.galat, sisaKuota });
});

async function tanyaGemini(permintaan: Permintaan, kunci: string):
  Promise<{ ok: true; teks: string; tokenMasuk: number | null; tokenKeluar: number | null } | { ok: false; galat: string }> {
  const { sistem, pengguna, skema, suhu } = susunPrompt(permintaan);
  const panggil = (model: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': kunci },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistem }] },
      contents: [{ role: 'user', parts: [{ text: pengguna }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: skema, temperature: suhu },
    }),
  }).catch(() => null);
  // Model utama dicoba dua kali, lalu cadangan sekali; hanya galat "sibuk" yang dicoba ulang.
  const urutan = [MODEL, MODEL, ...(MODEL_CADANGAN !== MODEL ? [MODEL_CADANGAN] : [])];
  let respons: Response | null = null;
  for (const [i, model] of urutan.entries()) {
    if (i > 0) await new Promise(selesai => setTimeout(selesai, JEDA_ULANG_MS));
    respons = await panggil(model);
    if (respons?.ok || !STATUS_SIBUK.has(respons?.status ?? 503)) break;
    console.warn('gemini sibuk', model, respons?.status);
  }
  if (!respons?.ok) {
    console.error('gemini gagal', respons?.status, await respons?.text().catch(() => ''));
    return { ok: false, galat: PESAN_STATUS_GEMINI[respons?.status ?? 0] ?? 'Layanan AI sedang tidak bisa dihubungi. Coba lagi sebentar lagi.' };
  }
  const json = await respons.json();
  const teks = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof teks !== 'string') return { ok: false, galat: 'AI tidak memberi jawaban. Coba lagi.' };
  return { ok: true, teks, tokenMasuk: json.usageMetadata?.promptTokenCount ?? null, tokenKeluar: json.usageMetadata?.candidatesTokenCount ?? null };
}
