// Edge Function ai-bantu: satu-satunya jalan portal ke layanan AI, supaya kunci API tidak pernah ada di bundel web/admin.
// Memeriksa sesi + peran (penulis/admin), kuota harian per pengguna (tabel pemakaian_ai), memanggil layanan AI berformat
// OpenAI chat completions dengan prompt & skema dari logika.ts, memeriksa jawabannya, lalu mencatat pemakaian.
// Urutan model: Gemini (gratis) dulu, lalu SumoPod (berbayar); model yang gagal langsung diganti model berikutnya.
// Secret: GEMINI_API_KEY + GEMINI_MODELS, SUMOPOD_API_KEY + SUMOPOD_MODELS (daftar dipisah koma; minimal satu kunci).
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY disediakan Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { awalHariWib, bacaPermintaan, KUOTA_HARIAN, olahJawaban, susunPrompt, type Permintaan } from './logika.ts';

interface Kandidat { penyedia: string; alamat: string; kunci: string; model: string }
const daftarModel = (nama: string, bawaan: string) => (Deno.env.get(nama) ?? bawaan).split(',').map(m => m.trim()).filter(Boolean);
function susunKandidat(): Kandidat[] {
  const kunciGemini = Deno.env.get('GEMINI_API_KEY');
  const kunciSumopod = Deno.env.get('SUMOPOD_API_KEY');
  return [
    ...(kunciGemini ? daftarModel('GEMINI_MODELS', 'gemini-3.5-flash,gemini-2.5-flash,gemini-flash-lite-latest').map(model => ({
      penyedia: 'Gemini', alamat: 'https://generativelanguage.googleapis.com/v1beta/openai', kunci: kunciGemini, model,
    })) : []),
    ...(kunciSumopod ? daftarModel('SUMOPOD_MODELS', 'gpt-4o-mini').map(model => ({
      penyedia: 'SumoPod', alamat: 'https://ai.sumopod.com/v1', kunci: kunciSumopod, model,
    })) : []),
  ];
}
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sebab umum kegagalan model terakhir dalam kalimat untuk admin (rincian tiap model ada di log fungsi).
const PESAN_STATUS: Record<number, string> = {
  401: 'kunci API ditolak', 402: 'saldo habis', 403: 'kunci tidak punya akses ke model ini', 404: 'model tidak dikenal',
  429: 'kuota habis atau terlalu banyak permintaan', 503: 'server sedang penuh',
};

const balas = (status: number, isi: unknown) =>
  new Response(JSON.stringify(isi), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = Deno.env.get('SUPABASE_URL')!;
  const kandidat = susunKandidat();
  if (kandidat.length === 0) return balas(503, { galat: 'Fitur AI belum diaktifkan (GEMINI_API_KEY / SUMOPOD_API_KEY belum dipasang).' });

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
  const jawaban = await tanyaAi(baca.permintaan, kandidat);
  const hasil = jawaban.ok ? olahJawaban(baca.permintaan, jawaban.teks) : jawaban;
  await servis.from('pemakaian_ai').insert({
    user_id: user.id, fitur: baca.permintaan.fitur, berhasil: hasil.ok,
    token_masuk: jawaban.ok ? jawaban.tokenMasuk : null, token_keluar: jawaban.ok ? jawaban.tokenKeluar : null,
  });
  // Kuota hanya berkurang bila bantuan berhasil sampai ke pengguna.
  const sisaKuota = KUOTA_HARIAN - (count ?? 0) - (hasil.ok ? 1 : 0);
  return hasil.ok ? balas(200, { hasil: hasil.hasil, sisaKuota }) : balas(422, { galat: hasil.galat, sisaKuota });
});

async function tanyaAi(permintaan: Permintaan, kandidat: readonly Kandidat[]):
  Promise<{ ok: true; teks: string; tokenMasuk: number | null; tokenKeluar: number | null } | { ok: false; galat: string }> {
  const { sistem, pengguna, skema, suhu } = susunPrompt(permintaan);
  // json_object (bukan json_schema) supaya jalan di semua model (Gemini, GPT, DeepSeek); bentuknya dijelaskan di prompt.
  const sistemJson = `${sistem}\nJawab HANYA dengan satu objek JSON sesuai skema berikut, tanpa teks lain:\n${JSON.stringify(skema)}`;
  let gagalTerakhir = '';
  for (const { penyedia, alamat, kunci, model } of kandidat) {
    const respons = await fetch(`${alamat}/chat/completions`, {
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
    const json = respons?.ok ? await respons.json().catch(() => null) : null;
    const isi = json?.choices?.[0]?.message?.content;
    if (typeof isi === 'string' && isi.trim()) {
      // Sebagian model membungkus JSON dengan pagar ```json … ```.
      const teks = isi.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      return { ok: true, teks, tokenMasuk: json.usage?.prompt_tokens ?? null, tokenKeluar: json.usage?.completion_tokens ?? null };
    }
    console.warn('ai gagal, coba model berikutnya', penyedia, model, respons?.status, respons && !respons.ok ? await respons.text().catch(() => '') : 'tanpa isi');
    gagalTerakhir = `${penyedia} ${model}: ${PESAN_STATUS[respons?.status ?? 0] ?? 'tidak bisa dihubungi'}`;
  }
  return { ok: false, galat: `Semua model AI gagal (terakhir ${gagalTerakhir}). Coba lagi beberapa menit lagi.` };
}
