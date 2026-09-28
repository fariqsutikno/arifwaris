// Edge Function ai-bantu: satu-satunya jalan portal ke Gemini, supaya GEMINI_API_KEY tidak pernah ada di bundel web/admin.
// Memeriksa sesi + peran (penulis/admin), kuota harian per pengguna (tabel pemakaian_ai), memanggil Gemini dengan
// prompt & skema dari logika.ts, memeriksa jawabannya, lalu mencatat pemakaian. Secret: GEMINI_API_KEY (wajib),
// GEMINI_MODEL (opsional). SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY disediakan Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { awalHariWib, bacaPermintaan, KUOTA_HARIAN, olahJawaban, susunPrompt, type Permintaan } from './logika.ts';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    .eq('user_id', user.id).gte('pada', awalHariWib(new Date()));
  if ((count ?? 0) >= KUOTA_HARIAN) return balas(429, { galat: `Kuota AI hari ini (${KUOTA_HARIAN} kali) sudah habis. Coba lagi besok.` });

  const baca = bacaPermintaan(await req.json().catch(() => null));
  if (!baca.ok) return balas(400, { galat: baca.galat });
  const jawaban = await tanyaGemini(baca.permintaan, kunciGemini);
  const hasil = jawaban.ok ? olahJawaban(baca.permintaan, jawaban.teks) : jawaban;
  await servis.from('pemakaian_ai').insert({
    user_id: user.id, fitur: baca.permintaan.fitur, berhasil: hasil.ok,
    token_masuk: jawaban.ok ? jawaban.tokenMasuk : null, token_keluar: jawaban.ok ? jawaban.tokenKeluar : null,
  });
  const sisaKuota = KUOTA_HARIAN - (count ?? 0) - 1;
  return hasil.ok ? balas(200, { hasil: hasil.hasil, sisaKuota }) : balas(422, { galat: hasil.galat, sisaKuota });
});

async function tanyaGemini(permintaan: Permintaan, kunci: string):
  Promise<{ ok: true; teks: string; tokenMasuk: number | null; tokenKeluar: number | null } | { ok: false; galat: string }> {
  const { sistem, pengguna, skema, suhu } = susunPrompt(permintaan);
  const respons = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': kunci },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistem }] },
      contents: [{ role: 'user', parts: [{ text: pengguna }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: skema, temperature: suhu },
    }),
  }).catch(() => null);
  if (!respons?.ok) {
    console.error('gemini gagal', respons?.status, await respons?.text().catch(() => ''));
    return { ok: false, galat: 'Layanan AI sedang tidak bisa dihubungi. Coba lagi sebentar lagi.' };
  }
  const json = await respons.json();
  const teks = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof teks !== 'string') return { ok: false, galat: 'AI tidak memberi jawaban. Coba lagi.' };
  return { ok: true, teks, tokenMasuk: json.usageMetadata?.promptTokenCount ?? null, tokenKeluar: json.usageMetadata?.candidatesTokenCount ?? null };
}
