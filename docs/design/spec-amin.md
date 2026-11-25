# Spec: AMIN, teman belajar waris (2026-11-25)

Dasar: `riset-ux-amin-2026-11-25.md` (keputusan pemilik bagian 8) dan `mockup-amin.html` revisi 2 (disetujui pemilik
2026-11-25). Dokumen ini mengatur **perilaku, kontrak data, letak kode, uji, dan urutan kerja**. Bila riset dan spec
berbeda, spec menang.
Status: **draf, menunggu persetujuan pemilik**. Kode belum dimulai. Posisi roadmap: G5, setelah G4.
Tanda [Pilihan Claude] = keputusan teknis yang saya ambil tanpa ditanyakan; boleh dibalik pemilik.

---

## 1. Cakupan versi pertama

**Masuk:**
- Panel AMIN (ikon pojok, panel samping di laptop, lembar bawah di HP) di semua halaman **kecuali layar soal**.
- Sorot teks → menu "Salin | Tanya AMIN" di halaman yang mengizinkan AMIN.
- Tiga jenis pertanyaan: waris (dari KB), aplikasi (dari panduan fitur), belajar (saran dari progres).
- Konteks halaman lewat kartu konteks (bagian 3), hanya bila persetujuan `ai_konteks` aktif.
- Contoh berangka: AI menyusun susunan keluarga, engine menghitung (bagian 7).
- Koin dengan jatah gratis harian (bagian 9). Belum ada pembelian.
- Percakapan tersimpan selama akun ada + halaman "Percakapan AMIN" (bagian 10).
- Jempol suka/tidak suka per jawaban.
- Pengaman berlapis + kumpulan uji serangan (bagian 11).

**Tidak masuk (sengaja):**
- Ikon tanya per baris di Hasil (ditolak pemilik: langkah penjelasan sudah menjawab "kenapa dapat/tidak dapat"; AMIN
  di Hasil untuk pertanyaan **lanjutan** lewat sorot atau ikon pojok).
- Top up koin / pembayaran (G8).
- Kasus bertingkat (munasakhat, pohon bebas, kondisi bab 13) sebagai contoh berangka: hanya susunan ahli waris datar.
- Mode cerita AI (memakai ulang penghubung ini nanti).
- Bahasa Arab untuk jawaban AI (jawaban selalu Indonesia; kutipan dalil Arab berasal dari KB, bukan dari AI).

## 2. Alur satu pertanyaan

```
Klien                                  Edge Function `amin`                         Penyedia AI
─────                                  ───────────────────                          ───────────
susun kartu konteks (murni) ─┐
pertanyaan + kartu + idPerc ─┴──────▶  1 sesi login? (401)
                                       2 baca & validasi permintaan (400)
                                       3 penyaring cepat: di luar topik / cocok soal bank → kalimat tetap, 0 koin
                                       4 persetujuan ai_konteks? tidak → buang isi kartu (sisakan halaman+judul)
                                       5 isi ulang jatah harian; saldo ≥ 1? tidak → 402 + kapan terisi
                                       6 kumpulkan sumber: refs kartu → potongan KB + entri rujukan;
                                         pencarian KB + panduan fitur; daftar putih tujuan
                                       7 susun prompt (instruksi server + data bertanda) ──────────────▶ jawaban JSON
                                       8 pemeriksa server (bagian 8); gagal → ulang 1× dengan pengingat ─▶
                                       9 contohKasus? → engine → panggilan ke-2 untuk menjelaskan ───────▶
                                      10 tambah kotak ahli bila perluAhli; potong koin; simpan pesan
tampilkan jawaban  ◀──────────────────  11 balas { jawaban, dalil, tujuan, lanjutan, contoh, biaya, saldo }
```

Langkah 3, 4, 5, 8, 10 adalah kode biasa (bukan AI) dan diuji sendiri.

## 3. Klien

### 3.1 Letak kode
| Berkas | Isi |
|---|---|
| `apps/web/src/amin/ketersediaan.ts` | `aminTersedia(rute, keadaan): boolean` murni. **Salah** untuk: rute `kalkulator` dengan `soal`, `latihan` (semua tab, termasuk kuis dan paket), Ujian (G6), blok soal di dalam materi saat sedang dikerjakan. Benar untuk sisanya. |
| `apps/web/src/amin/kartuKonteks.ts` | `susunKartuKonteks(rute, keadaanLayar): KartuKonteks` murni, satu cabang per jenis halaman |
| `apps/web/src/amin/PintuAmin.tsx` | ikon pojok; tidak dirender bila `aminTersedia` salah |
| `apps/web/src/amin/PanelAmin.tsx` | panel/lembar bawah, daftar pesan, kolom tulis; menutup sendiri saat rute berpindah ke layar soal |
| `apps/web/src/amin/MenuSorot.tsx` | menu di atas teks terpilih (`selectionchange`); di layar soal hanya "Salin" bila menu sorot kustom memang dirender, selain itu menu bawaan peramban |
| `apps/web/src/amin/JawabanAmin.tsx` | satu jawaban: teks → kartu contoh → Dalilnya → satu tujuan → lanjutan → kaki (bukan fatwa · biaya · jempol) |
| `apps/web/src/layar/PercakapanAmin.tsx` | halaman `#/amin` (daftar per tanggal, buka, hapus, riwayat koin) |
| `packages/data` | batas ke Supabase: `tanyaAmin`, `bacaPercakapanAmin`, `hapusPercakapanAmin`, `nilaiPesanAmin`, `bacaSaldoKoin`. Komponen tidak memanggil `fetch`/Supabase langsung. |

Rute baru `{ halaman: 'amin' }` = `#/amin` di `rute.ts` (+ `tautanAmin()`).

### 3.2 Kartu konteks
```ts
type KartuKonteks =
  | { halaman: 'hasil' | 'contoh' | 'dibagikan'; judul: string; kasus: RingkasKasus; langkahTerbuka?: number }
  | { halaman: 'materi'; judul: string; slug: string; bagian?: string }
  | { halaman: 'glosarium' | 'rujukan' | 'faq' | 'tanya-jawab'; judul: string; id?: string }
  | { halaman: 'umum'; judul: string; rute: Rute['halaman'] };

interface RingkasKasus {
  madzhab: 'SYF' | 'HNB' | 'HNF' | 'MLK';
  ahliWaris: { peran: string; jumlah: number; status: 'mewarisi' | 'mahjub' | 'mamnu'; bagian?: string }[];
  refs: string[];          // dari LangkahJejak.refs seluruh jejak, unik
  nominal?: never;         // nominal harta tidak pernah dikirim (versi pertama)
}
```
- `peran` = label sebutan yang sudah ada (`sebutan.ts`), **bukan nama orang**. Uji: kartu dari kasus bernama tidak memuat
  nama apa pun yang diketik pengguna.
- `bagian` = teks pecahan hasil engine ("1/8", "sisa").
- Teks sorotan dikirim terpisah sebagai `kutipan` (maks. 500 karakter).

### 3.3 Tampilan (ikut mockup revisi 2)
- Satu jawaban paling banyak: 1 tautan tujuan, 2 tautan lanjutan ("Lebih rinci", "Beri contoh"/"Contoh lain"),
  1 baris kaki kecil "Bukan fatwa · 2 koin" (kata "Bukan fatwa" hanya pada jawaban `cakupan: 'waris'`) + jempol suka/tidak suka (ikon,
  `aria-label` "Membantu"/"Kurang membantu", `aria-pressed`).
- Dalilnya = `<details>` tertutup; isi dari entri rujukan (kutipan Arab, terjemah/klaim, sumber). Kode R tidak tampil.
- Kartu contoh berlabel "Dihitung kalkulator" + madzhab; tautan "Buka di Lab" membuat **kasus baru** milik pengguna
  (sumber `sendiri`), tidak menimpa kasus yang sedang dibuka.
- Saldo koin di kepala panel. Keadaan: belum masuk, belum izin konteks, koin habis, di luar cakupan, arahkan ke ahli
  (teks persis di mockup tab 5, lewat diksi).
- Tanpa proaktif: tidak ada sapaan, lencana, notifikasi, atau animasi menarik perhatian.

## 4. Kontrak

### 4.1 Permintaan klien → `amin`
```ts
interface PermintaanAmin {
  pertanyaan: string;                 // 1..1000 karakter
  kutipan?: string;                   // 0..500
  kartu: KartuKonteks;                // divalidasi skema; field tak dikenal dibuang
  idPercakapan?: string;              // lanjut percakapan yang sama
  lanjutan?: 'lebih_rinci' | 'beri_contoh' | 'contoh_lain';  // tautan lanjutan = pertanyaan siap pakai
}
```

### 4.2 Jawaban AI (wajib JSON, diperiksa server)
```ts
interface JawabanMentahAi {
  cakupan: 'waris' | 'aplikasi' | 'belajar' | 'luar';
  jawaban: string;                    // ≤ 120 kata; tanpa URL, tanpa blok kode
  rujukan: string[];                  // token ⟦n⟧ dari sumber yang dikirim
  tujuan: { id: IdTujuan; param?: string } | null;
  lanjutan: ('lebih_rinci' | 'beri_contoh' | 'contoh_lain')[];   // ≤ 2
  contohKasus: ContohKasusAi | null;
  perluAhli: null | 'sengketa' | 'harta_sudah_dibagi' | 'wasiat_hibah' | 'utang' | 'luar_negeri' | 'beda_agama' | 'lainnya';
}
interface ContohKasusAi { pewaris: 'laki-laki' | 'perempuan'; ahliWaris: { kunci: KunciAhliWaris; jumlah: number }[] }
```

### 4.3 Balasan `amin` → klien
```ts
type BalasanAmin =
  | { ok: true; idPercakapan: string; idPesan: string; jenis: 'jawaban';
      jawaban: string; cakupan: 'waris' | 'aplikasi' | 'belajar';
      dalil: { klaim: string; kutipan?: string; sumber: string }[];
      tujuan: { id: IdTujuan; param?: string } | null;      // klien membuat tautan dengan pembuat tautan rute.ts
      lanjutan: string[]; contoh: TabelContoh | null; perluAhli: boolean;
      biaya: number; saldo: number }
  | { ok: true; jenis: 'luar_cakupan' | 'soal_latihan'; biaya: 0; saldo: number }   // klien menampilkan kalimat tetap dari diksi
  | { ok: false; galat: 'BELUM_MASUK' | 'KOIN_HABIS' | 'TIDAK_SAH' | 'GAGAL_AI'; terisiPada?: string; saldo?: number };
```

### 4.4 Daftar putih tujuan
`IdTujuan` = `beranda | lab | riwayat | latihan | materi | glosarium | rujukan | faq | tanya-jawab | privasi | amin | izin-konteks`.
`param` wajib untuk `materi` (slug), `glosarium` (id), `rujukan` (kode), opsional untuk `faq`, `tanya-jawab`. Server
memeriksa param ada di snapshot konten (bundel `packages/content`); tidak ada → tujuan dibuang (jawaban tetap tampil).
Satu sumber kebenaran: daftar ini didefinisikan sekali di `packages/content` (dipakai fungsi dan klien).

## 5. Edge Function `amin`

- Letak: `supabase/functions/amin/` dengan pola `ai-bantu`: `index.ts` (I/O: sesi, database, penyedia) dan `logika.ts`
  (murni, dites vitest): `bacaPermintaan`, `saringCepat`, `susunPrompt`, `periksaJawaban`, `hitungBiaya`,
  `tambahKotakAhli`. Engine + konten dibundel lewat `scripts/bundel-fungsi.ts` seperti `catat-percobaan/masuk.ts`.
- Penyedia: daftar kandidat berformat OpenAI chat completions dari secret `AMIN_PENYEDIA` (url, kunci, model, dipisah).
  **Gemini tier gratis dilarang** (dicek: url `generativelanguage.googleapis.com` ditolak saat start). Pilihan final
  ditetapkan di F0 setelah membandingkan harga dan kualitas bahasa Indonesia [Pilihan Claude: uji 30 pertanyaan dari
  kumpulan uji bagian 11 ke tiap kandidat].
- `pemakaian_ai.fitur` ditambah nilai `amin` dan `amin_contoh` (migrasi ubah check).
- Suhu rendah (0,2) [Pilihan Claude]; `response_format: json_object`.

## 6. Sumber jawaban

### 6.1 Potongan KB
- Tabel `kb_potongan (id text pk, bab text, judul text, isi text, refs text[], tsv tsvector generated)` + indeks GIN.
  Satu potongan = satu sub-bab `##`/`###` di `docs/kb/*.md` (tanpa tabel "Dasar dan Rujukan", yang masuk lewat entri
  rujukan). Diisi skrip `pnpm amin:kb` (baca KB, potong, upsert lewat service role); dijalankan saat KB berubah.
  Uji: tiap kode `[Rxx-y]` di KB muncul di `refs` tepat satu potongan atau lebih; tidak ada potongan kosong.
- RPC `cari_kb(q text, batas int default 5)` memakai `websearch_to_tsquery('simple', q)` atas `tsv`. Pertanyaan diperluas
  dulu di `logika.ts` dengan sinonim dari glosarium (mis. "anak angkat" → tabanni, "tidak dapat" → hajb/mahjub)
  [ponytail: pencarian teks, embedding bila pengukuran menunjukkan pencarian sering meleset].
- Untuk kartu berjejak (`hasil`, `contoh`, `dibagikan`): potongan yang `refs`-nya beririsan dengan `kartu.kasus.refs`
  diambil langsung, lalu ditambah hasil `cari_kb` sampai batas.
- Batas isi sumber per panggilan: 6 potongan atau ±3.000 token, mana dulu.
- Madzhab: potongan [HNB]/[HNF]/[MLK] hanya dikirim bila madzhab kartu itu, dengan penanda sekunder; instruksi melarang
  menyebut pendapat itu sebagai [SYF].

### 6.2 Entri rujukan
Kode dari potongan terpilih dipetakan ke entri rujukan (`packages/content`) → dikirim ke AI sebagai token `⟦n⟧` (pola
`kunciSisipan` di `ai-bantu`), dan dikembalikan ke klien sebagai `dalil` (klaim, kutipan, sumber). AI tidak pernah
menulis dalil sendiri.

### 6.3 Panduan fitur
Jenis konten baru `panduan_fitur` di `entri_konten` (migrasi ubah check jenis; tampil di portal seperti `faq`):
`judul`, `isi`, `tujuan` (IdTujuan + param). Diikutkan ke pencarian sebagai sumber `aplikasi`. Isi awal ditulis Claude
dari kode hari ini (±15 entri: simpan kasus, riwayat, bagikan, madzhab, Latihan vs Ujian, tangga bantuan, XP,
glosarium, rujukan, Lab, materi, akun, koin AMIN, percakapan AMIN, privasi) dan ditinjau pemilik.

### 6.4 Saran belajar
`cakupan: 'belajar'` tidak meminta AI memilih pelajaran. Klien menambahkan tujuan "berikutnya" dari `progres.ts` /
`rekomendasiKuis.ts` **hanya bila** jawaban AI tidak membawa tujuan (aturan satu tujuan per jawaban).

## 7. Contoh berangka

1. AI mengisi `contohKasus` (hanya bila diminta lewat `beri_contoh`/`contoh_lain` atau pertanyaan "kalau …?").
2. Server: `kunci` harus anggota `KunciAhliWaris`, jumlah 1..10, total orang ≤ 15, tanpa kondisi bab 13
   [Pilihan Claude: batas mencegah kasus raksasa]. Susun `Kasus` dengan pembantu yang sama dengan blok kasus materi
   (`kasusDariSoal`), madzhab = madzhab kartu (bawaan SYF), harta tetap (tidak ditampilkan; contoh hanya pecahan).
3. `jalankan(kasus)` dari `packages/latihan`. Status bukan OK (`PERLU_INPUT`, `TIDAK_DIDUKUNG`, galat) → contoh dibuang;
   jawaban pertama dipakai tanpa contoh (biaya hanya panggilan pertama).
4. OK → panggilan kedua: sumber = jejak engine + potongan KB dari `refs`-nya; AI menjelaskan, aturan angka bagian 8
   berlaku dengan himpunan angka dari hasil engine.
5. Balasan `contoh: TabelContoh` = baris (peran, bagian atau "terhalang <penghalang>") dari engine, + `kasus` untuk
   tautan "Buka di Lab".

## 8. Pemeriksa server (`periksaJawaban`, murni)

Menolak jawaban bila:
- bukan JSON sesuai 4.2;
- `cakupan` di luar enum (`luar` bukan penolakan: diganti kalimat tetap, 0 koin);
- `rujukan` memuat token yang tidak dikirim, atau jawaban `waris` tanpa satu pun rujukan;
- pecahan (`\d+/\d+`) di `jawaban` yang tidak ada di himpunan sah = pecahan di kartu ∪ potongan terkirim ∪ hasil engine;
- nominal rupiah atau bilangan ≥ 1.000 apa pun (versi pertama tidak membahas nominal);
- URL (`https?://`, `www.`), pagar kode, atau tag HTML;
- `tujuan.id` di luar daftar putih (tujuan dibuang, tidak menolak seluruh jawaban);
- lebih dari 160 kata (batas lunak 120 di instruksi).
Ditolak → ulang sekali dengan pengingat alasan; gagal lagi → `GAGAL_AI`, 0 koin. Uji: satu kasus uji per aturan,
masing-masing lolos dan ditolak.

`perluAhli` ≠ null → server menambah kotak "Sebaiknya konsultasikan ke ahli" (teks dari diksi/konten), bukan AI.

## 9. Koin

```sql
create table saldo_koin (user_id uuid primary key references auth.users on delete cascade,
                         saldo int not null check (saldo >= 0), jatah_terakhir date);
create table mutasi_koin (id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  jumlah int not null check (jumlah <> 0),
  jenis text not null check (jenis in ('jatah','pakai','koreksi')),   -- 'beli' ditambah di G8
  pemakaian_id bigint references pemakaian_ai, pada timestamptz not null default now());
```
- `isi_jatah(user)` (security definer, dipanggil fungsi): bila `jatah_terakhir < hari ini WIB`, naikkan saldo sampai
  `JATAH_HARIAN` (tidak menumpuk melebihi jatah) dan catat mutasi `jatah`.
- `pakai_koin(user, jumlah, pemakaian_id)`: `update saldo_koin set saldo = saldo - least(jumlah, saldo) …` dalam satu
  pernyataan + mutasi `pakai`; tidak pernah minus; mengembalikan saldo baru.
- Biaya = `ceil((token_masuk + token_keluar) / TOKEN_PER_KOIN)`, minimal 1, dijumlah untuk semua panggilan satu jawaban.
  Konstanta bernama di `logika.ts`; **angka ditetapkan F0** (usulan awal `TOKEN_PER_KOIN = 2000`, `JATAH_HARIAN = 20`).
- Syarat sebelum memanggil AI: saldo ≥ 1. Jawaban terakhir boleh menghabiskan sisa (tidak ada utang koin).
- RLS: pengguna hanya membaca saldo dan mutasinya sendiri; tulis hanya lewat fungsi.
- Uji pgTAP: dua pemakaian serentak tidak membuat saldo minus; jatah tidak terisi dua kali sehari; gagal = 0 mutasi.

## 10. Percakapan

```sql
create table percakapan_amin (id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  halaman text not null, judul_halaman text not null,
  dibuat_pada timestamptz not null default now(), diperbarui_pada timestamptz not null default now());
create table pesan_amin (id uuid primary key default gen_random_uuid(),
  percakapan_id uuid not null references percakapan_amin on delete cascade,
  peran text not null check (peran in ('pengguna','amin')),
  isi jsonb not null,            -- pengguna: {pertanyaan, kutipan?}; amin: BalasanAmin tanpa saldo
  biaya int not null default 0, nilai smallint check (nilai in (-1, 1)),
  pada timestamptz not null default now());
```
- Percakapan baru tiap kali panel dibuka di halaman (`halaman` + `judul`) yang berbeda dari percakapan terakhir; di
  halaman yang sama dalam 1 jam = lanjut [Pilihan Claude].
- Yang dikirim ulang ke AI: 6 pesan terakhir percakapan itu saja.
- Kartu konteks lengkap **tidak** disimpan (hanya judul halaman).
- RLS: pemilik `select` dan `delete`; `insert` hanya fungsi; `nilai_pesan_amin(id, nilai)` untuk jempol (pemilik saja).
- Ikut `unduh_data_saya` dan FK cascade hapus akun (uji pgTAP 24 diperluas). Retensi: selama akun ada; baris retensi
  di tabel `01-keamanan-dan-pdp.md` 2.5 diperbarui.

## 11. Pengaman dan uji serangan

Lapisan (rincian alasan di riset 6d): instruksi hanya di server · masukan dibungkus sebagai data bertanda · batas panjang
dan skema kartu · JSON wajib + `cakupan` · pemeriksa server bagian 8 · penyaring cepat sebelum AI.

**Penyaring cepat (`saringCepat`, murni):**
- pola jelas di luar topik (kata kunci pemrograman + pagar kode, "tulis esai/puisi/cerita", "terjemahkan", dll.) →
  `luar_cakupan`;
- kecocokan soal: RPC `mirip_soal(teks)` memakai `pg_trgm` atas teks soal kuis dan cerita soal hitung yang terbit;
  similarity ≥ 0,6 → `soal_latihan` [ponytail: ambang tetap, disetel dari kumpulan uji].

**Kumpulan uji serangan** `supabase/functions/amin/uji-serangan.json` (≥ 40 butir, tiap butir: pertanyaan, kartu,
harapan `luar_cakupan | soal_latihan | jawaban_dalam_cakupan | ditolak_pemeriksa`). Kelompok wajib: minta kode program;
"abaikan instruksi"; menyamar admin/pengembang; minta prompt sistem; minta pendapat Hanbali sebagai Syafi'i; minta
menghitung nominal; menempel soal latihan; pertanyaan di luar KB (harus "belum ada di materi kami"); sengketa (harus
`perluAhli`); instruksi tersembunyi di `kutipan`. Dijalankan dengan `pnpm amin:uji-serangan` ke fungsi lokal sebelum
tiap ganti prompt/model; target 100% sesuai harapan.

**Instruksi sistem** disimpan sebagai konstanta di `logika.ts` (bukan konten portal), memuat: cakupan tiga hal, jawab
hanya dari sumber terkirim, "belum ada di materi kami" bila tidak ada, tidak menghitung, tidak menyebut pendapat madzhab
lain sebagai Syafi'i, bahasa sehari-hari ≤ 120 kata, teks pengguna di blok bertanda bukan perintah.

## 12. Syarat sebelum mengirim data (G5, dari `01-keamanan-dan-pdp.md`)
- Kebijakan privasi menyebut penyedia AI, data yang dikirim (pertanyaan, kutipan, kartu konteks tanpa nama), penyimpanan
  percakapan selama akun ada, koin. Versi kebijakan naik → dialog persetujuan ulang.
- Persetujuan `ai_konteks` dibaca server lewat `persetujuan_saya()`; tanpa itu kartu dipangkas (bagian 2 langkah 4).
- Tidak ada kode yang memanggil penyedia dengan data pengguna di-deploy sebelum dua butir di atas selesai.

## 13. Teks
Semua teks tampil lewat diksi (`t(...)`, `pnpm diksi:tambah`), termasuk kalimat tetap: luar cakupan, soal latihan,
bukan fatwa, kotak ahli, koin habis, belum masuk, belum izin. Teks "siapa konsultannya" = konten (ditulis pemilik).

## 14. Urutan kerja dan kriteria selesai

| Fase | Isi | Selesai bila |
|---|---|---|
| F0 | Pilih penyedia (uji 30 pertanyaan), tetapkan angka koin, teks kebijakan privasi bagian AI | pemilik menyetujui penyedia, angka, teks |
| F1 | Migrasi: `kb_potongan` + `cari_kb`, `saldo_koin`/`mutasi_koin` + fungsi, `percakapan_amin`/`pesan_amin`, `panduan_fitur`, check `pemakaian_ai.fitur`, `mirip_soal` | `pnpm db:reset && pnpm db:tes` lulus dengan uji pgTAP baru (koin serentak, RLS, cascade, unduh data) |
| F2 | `pnpm amin:kb`; `logika.ts` (permintaan, penyaring, prompt, pemeriksa, biaya) + vitest | uji unit tiap aturan bagian 8 dan 11 lulus |
| F3 | `index.ts` + bundel engine/konten; contoh berangka | fungsi lokal menjawab kumpulan uji serangan 100% sesuai harapan |
| F4 | Klien: ketersediaan, kartu konteks, pintu, panel, menu sorot, jawaban, `packages/data` | uji unit `aminTersedia` (semua rute soal = salah) dan kartu (tanpa nama); diverifikasi di browser laptop + 375 px sesuai mockup |
| F5 | Halaman Percakapan AMIN, jempol, saldo/riwayat koin, isi awal panduan fitur | diverifikasi di browser; panduan ditinjau pemilik |
| F6 | Pilot terbatas | ukuran sukses riset bagian 9 dipantau 2 minggu |

Deploy produksi (migrasi, secret, fungsi) hanya oleh pemilik, per langkah, seperti G3.

## 15. Masih terbuka
1. Penyedia final, `TOKEN_PER_KOIN`, `JATAH_HARIAN` (F0).
2. Teks konsultan dan daftar akhir pemicu `perluAhli` (pemilik).
3. Ambang `mirip_soal` (disetel dari kumpulan uji).
4. Cek regulasi koin sebelum top up dibuka (G8, konsultan hukum).
