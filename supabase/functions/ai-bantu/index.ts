// Edge Function ai-bantu: satu-satunya jalan portal ke layanan AI, supaya AI_API_KEY tidak pernah ada di bundel web/admin.
// Memeriksa sesi + peran (penulis/admin), kuota harian per pengguna (tabel pemakaian_ai), memanggil layanan AI berformat
// OpenAI chat completions (bawaan SumoPod) dengan prompt & skema dari logika.ts, memeriksa jawabannya, lalu mencatat
// pemakaian. Secret: AI_API_KEY (wajib), AI_MODEL, AI_MODEL_CADANGAN, AI_BASE_URL (opsional). SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY disediakan Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { awalHariWib, bacaPermintaan, KUOTA_HARIAN, olahJawaban, susunPrompt, type Permintaan } from './logika.ts';

const BASE_URL = Deno.env.get('AI_BASE_URL') ?? 'https://ai.sumopod.com/v1';
const MODEL = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini';
// Dipakai bila model utama sibuk (setelah dicoba ulang); sama dengan model utama = tanpa cadangan.
const MODEL_CADANGAN = Deno.env.get('AI_MODEL_CADANGAN') ?? MODEL;
const STATUS_SIBUK = new Set([429, 500, 502, 503]);
const JEDA_ULANG_MS = 1500;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sebab umum dari layanan AI dalam kalimat yang bisa ditindaklanjuti admin (rincian lengkap ada di log fungsi).
const PESAN_STATUS: Record<number, string> = {
  400: `Permintaan ditolak layanan AI. Periksa AI_MODEL (sekarang "${MODEL}").`,
  401: 'AI_API_KEY ditolak (tidak sah).',
  402: 'Saldo layanan AI habis.',
  403: 'AI_API_KEY tidak punya akses ke model ini.',
  404: `Model "${MODEL}" tidak dikenal layanan AI. Periksa secret AI_MODEL.`,
  429: 'Layanan AI kehabisan kuota atau terlalu banyak permintaan. Coba lagi nanti.',
  503: 'Layanan AI sedang penuh. Coba lagi beberapa menit lagi.',
};

const balas = (status: number, isi: unknown) =>
  new Response(JSON.stringify(isi), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = Deno.env.get('SUPABASE_URL')!;
  const kunciAi = Deno.env.get('AI_API_KEY');
  if (!kunciAi) return balas(503, { galat: 'Fitur AI belum diaktifkan (AI_API_KEY belum dipasang).' });

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
  const jawaban = await tanyaAi(baca.permintaan, kunciAi);
  const hasil = jawaban.ok ? olahJawaban(baca.permintaan, jawaban.teks) : jawaban;
  await servis.from('pemakaian_ai').insert({
    user_id: user.id, fitur: baca.permintaan.fitur, berhasil: hasil.ok,
    token_masuk: jawaban.ok ? jawaban.tokenMasuk : null, token_keluar: jawaban.ok ? jawaban.tokenKeluar : null,
  });
  // Kuota hanya berkurang bila bantuan berhasil sampai ke pengguna.
  const sisaKuota = KUOTA_HARIAN - (count ?? 0) - (hasil.ok ? 1 : 0);
  return hasil.ok ? balas(200, { hasil: hasil.hasil, sisaKuota }) : balas(422, { galat: hasil.galat, sisaKuota });
});

async function tanyaAi(permintaan: Permintaan, kunci: string):
  Promise<{ ok: true; teks: string; tokenMasuk: number | null; tokenKeluar: number | null } | { ok: false; galat: string }> {
  const { sistem, pengguna, skema, suhu } = susunPrompt(permintaan);
  // json_object (bukan json_schema) supaya jalan di semua model (GPT, DeepSeek); bentuknya dijelaskan di prompt sistem.
  const sistemJson = `${sistem}\nJawab HANYA dengan satu objek JSON sesuai skema berikut, tanpa teks lain:\n${JSON.stringify(skema)}`;
  const panggil = (model: string) => fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${kunci}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: sistemJson }, { role: 'user', content: pengguna }],
      response_format: { type: 'json_object' },
      // Model penalaran (gpt-5*) hanya menerima suhu bawaan.
      ...(model.startsWith('gpt-5') ? {} : { temperature: suhu }),
    }),
  }).catch(() => null);
  // Model utama dicoba dua kali, lalu cadangan sekali; hanya galat "sibuk" yang dicoba ulang.
  const urutan = [MODEL, MODEL, ...(MODEL_CADANGAN !== MODEL ? [MODEL_CADANGAN] : [])];
  let respons: Response | null = null;
  for (const [i, model] of urutan.entries()) {
    if (i > 0) await new Promise(selesai => setTimeout(selesai, JEDA_ULANG_MS));
    respons = await panggil(model);
    if (respons?.ok || !STATUS_SIBUK.has(respons?.status ?? 503)) break;
    console.warn('ai sibuk', model, respons?.status);
  }
  if (!respons?.ok) {
    console.error('ai gagal', respons?.status, await respons?.text().catch(() => ''));
    return { ok: false, galat: PESAN_STATUS[respons?.status ?? 0] ?? 'Layanan AI sedang tidak bisa dihubungi. Coba lagi sebentar lagi.' };
  }
  const json = await respons.json();
  const isi = json?.choices?.[0]?.message?.content;
  if (typeof isi !== 'string') return { ok: false, galat: 'AI tidak memberi jawaban. Coba lagi.' };
  // Sebagian model membungkus JSON dengan pagar ```json … ```.
  const teks = isi.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return { ok: true, teks, tokenMasuk: json.usage?.prompt_tokens ?? null, tokenKeluar: json.usage?.completion_tokens ?? null };
}
