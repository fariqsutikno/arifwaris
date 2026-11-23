# Spec verifikasi lanjutan: matriks madzhab (Jalur 7) + konten (tahap 6) (2026-11-22)

Menerima: sisa butir terbuka di `docs/rencana-verifikasi.md`, sel bertanda (s)/? di `docs/kb/18_matriks_khilaf.md`,
dan konten terbit (ekspor di `docs/lampiran-konten/`).
Memutuskan: tiap butir/klaim lolos, diperbaiki, atau ⚑ (menyentuh hukum, menunggu pemilik).
Menyerahkan: KB 18 yang lebih bersih, label "sekunder" dicabut bila selnya naik, cabang `TIDAK_DIDUKUNG` yang bisa
dibuka (dengan fixture uji), dan laporan koreksi konten untuk disunting di portal.

Satu spec karena alat, protokol, dan aturan delegasinya sama. Bagian A dan B beda sasaran:
A memeriksa **isi hukum antar-madzhab**, B memeriksa **apakah konten setia pada KB [SYF]**.

## 1. Selesai artinya

- **A**: tiap butir di bagian 3 berstatus **primer** (kutipan diperiksa `verify_quote`, letak Shamela tercatat),
  **tetap (s)/?** dengan catatan "dicari di kitab X, Y, Z (tanggal), tidak ketemu", atau **⚑**.
  Tabel "Keputusan tertunda" di `rencana-verifikasi.md` dan 18.3 diperbarui; jejak koreksi masuk 17.5.
  Butir yang naik dan punya cabang engine: overlay ditulis dengan TDD, `refs.test.ts` hijau.
- **B**: tiap berkas di bagian 4 punya laporan (tabel format `rencana-verifikasi.md`), semua soal hitung dicek engine
  lewat tes permanen, dan koreksi yang disetujui sudah disunting di portal lalu diekspor ulang.
- Tidak ada hukum yang berubah diam-diam (rencana-verifikasi prinsip 3).

## 2. Urutan kerja

1. **A1–A2** (K04-3 [HNF]/[MLK]): satu-satunya yang langsung membuka kasus engine.
2. **B0** (cek mesin) dan **B1** (tes soal hitung): murah, sekali jalan, menangkap kesalahan kasar lebih dulu.
3. **B2–B4** (materi, teks_edukasi, soal_kuis): yang paling sering tampil ke pengguna.
4. **A3–A5** (wala' [MLK], dua jalur [HNF], laqith [SYF]).
5. **B5** (sisa berkas konten).
6. **A6–A10** (label sekunder, butir di luar lingkup).
7. Engine untuk butir A yang naik, lalu satu review opus.

A dan B menyunting berkas berbeda (`docs/kb/` vs portal konten), jadi boleh berselang-seling. Batas MCP tetap berlaku
bersama (bagian 5).

## 3. Bagian A: matriks madzhab (Jalur 7)

| # | Butir | Madzhab | Sekarang | Dampak bila tertutup | Kitab target (urut) |
|---|---|---|---|---|---|
| A1 | K04-3 nenek dua qarabah | [HNF] | ? (nukilan Mughni) | buka `TIDAK_DIDUKUNG` di `pipeline.ts:105` untuk [HNF] (khilaf Abu Yusuf vs Muhammad → kemungkinan `opsi:`) | Mabsuth (bab jaddat), Bada'i', Tabyin, Ibnu 'Abidin |
| A2 | K04-3 nenek dua qarabah | [MLK] | ? (tersirat) | idem untuk [MLK] | Mukhtashar Khalil + Syarh ad-Dardir/Dasuqi, Mawahib, Minah al-Jalil |
| A3 | K05-2 furudh dalam wala' | [MLK] | belum terverifikasi | buka `TIDAK_DIDUKUNG` kasus ayah mu'tiq | Mudawwanah, Dardir/Dasuqi (bab wala'), Mawahib |
| A4 | Satu dzawil arham dua jalur (qarabah) | [HNF] | belum ada nash | buka `TIDAK_DIDUKUNG` dua jalur [HNF] | Mabsuth 30 (dzawil arham), Sirajiyyah + syarahnya, Ibnu 'Abidin |
| A5 | R13-14 laqith: «merdeka», «penemu tidak mewarisi» | [SYF] | blocked | cabut titik blocked di CLAUDE.md | Raudhah bab laqith, Tuhfah, Nihayah, Mughni al-Muhtaj |
| A6 | K13a-4 tanda hidup janin | [MLK] | (s) | cabut label sekunder | Mudawwanah, Dardir/Dasuqi, Mawahib |
| A7 | K01-2 / R01-1 urutan tajhiz | [HNB] | (s) | cabut label sekunder | Kasysyaf al-Qina', Syarh Muntaha, Inshaf |
| A8 | K01-2 rahn vs tajhiz | [HNF] | ? sebagian | catatan saja (tidak dimodelkan engine) | Ibnu 'Abidin, Bada'i' |
| A9 | K02-4 ikhtilaf ad-dar | [MLK] | (s) | tidak ada (bukan lingkup platform) | Dardir/Dasuqi |
| A10 | K13-1 harta murtaddah | [HNF] | belum diperiksa | tidak ada (bukan lingkup platform) | Mabsuth 10/101–107 (baca utuh) |

A9–A10 boleh ditutup "tidak dicari, bukan lingkup" bila pemilik setuju.

### Protokol per butir A

1. **Cari** di kategori madzhab yang benar (jangan cari [MLK] di kategori Hanafi). `shamela_search_phrase` untuk frasa
   kunci Arab, `shamela_search_pages` untuk tema. Catat semua kitab yang dicari, juga yang hasilnya nol.
2. **Baca** halaman kandidat utuh; matan dan hasyiyah dipisah (hasyiyah bukan kata pengarang matan).
3. **Nilai**: pendapat mu'tamad madzhab, satu riwayat, atau nukilan pihak lain? Nukilan dari kitab madzhab lain
   (mis. Mughni tentang Malik) tetap (s).
4. **Kunci**: `verify_quote` untuk kutipan yang masuk KB, `get_citation` untuk letaknya.
5. **Putuskan**: primer / tetap / ⚑. Berbalik dari isi sel sekarang = berhenti, laporkan, jangan sunting.
6. **Catat**: sel KB 18, blok KHILAF di bab asal bila perlu, `rencana-verifikasi.md`, 17.5.
7. **Engine** (A1–A4, setelah 6 dan bila primer): fixture dulu (`packages/engine/src/__tests__/fixtures/madzhab.ts`),
   lalu overlay di ruleset, anotasi `// [K04-3] ...`.

## 4. Bagian B: konten (tahap 6)

Sumber kebenaran konten = basis data (disunting di portal admin). `docs/lampiran-konten/` hanya hasil `pnpm konten:ekspor`;
**jangan menyunting berkas md itu**, karena ekspor berikutnya menimpanya. Mulai tiap sesi B dengan ekspor ulang
(pemilik menjalankan; skrip butuh `scripts/.env`, yang tidak dibuka Claude).

Yang sudah dijaga mesin (`packages/content/src/konsistensi.ts`, dijalankan `snapshot.test.ts`): kode `Rxx-y` ada di KB,
istilah ada di glosarium, syahid persis teks ayat, kitab ada di 17.2, kuis sisipan ada di bank. Bagian B **tidak mengulang**
itu; B memeriksa yang tidak bisa dicek mesin: apakah kalimatnya benar-benar sesuai aturan yang dirujuk.

| # | Pekerjaan | Cakupan | Keluaran |
|---|---|---|---|
| B0 | Jalankan `snapshot.test.ts` + konsistensi atas ekspor terbaru | semua | daftar galat mesin (harusnya kosong) |
| B1 | Tes permanen: tiap `soal_hitung` dijalankan engine, jawabannya dibandingkan | 23 soal (audit 2026-09-29: cocok) | satu berkas tes di `apps/web/src/__tests__/` atau `packages/content` |
| B2 | Klaim fikih ↔ KB | `materi.md` (542 baris, 70 bagian) | laporan |
| B3 | Klaim fikih ↔ KB | `teks_edukasi.md` (1.025 baris, 114 bagian) | laporan |
| B4 | Kunci + alasan jawaban ↔ KB | `soal_kuis.md` (707 baris) | laporan |
| B5 | Klaim fikih ↔ KB; ayat/hadits dalam prosa | `faq`, `ahwal`, `modul`, `cheatsheet`; `syahid`/`kitab` cukup B0 | laporan |

### Protokol per bagian konten

1. **Pecah** berkas per judul bagian (`##`/`###`). Satu agen = paling banyak ±150 baris.
2. **Tiap klaim fikih** (siapa mendapat apa, syarat, hijab, angka): cari kode `Rxx-y` yang dirujuk atau seharusnya dirujuk,
   buka baris KB-nya, bandingkan. Klaim tanpa kode = temuan "terlewat".
3. **Kutipan ayat/hadits dalam prosa** (yang bukan syahid): cek seperti tahap 1–2 (`fetch_quran`; hadits pakai nomor standar,
   bukan nomor MCP Hadith yang tidak standar, lihat audit butir 16).
4. **Istilah** yang lolos glosarium tapi dipakai keliru maknanya = temuan.
5. **Golongkan**: ✔ cocok · ⚠ lafaz/nomor/kode salah (hukum tetap) · ⚑ hukum berbeda dari KB.
6. **Koreksi**: ⚠ boleh langsung diusulkan sebagai teks pengganti; ⚑ tidak diubah. Konten dipegang tim keilmuan:
   semua koreksi **dilaporkan dulu**, disunting di portal setelah pemilik setuju (usulan rencana-verifikasi butir 3).
   Bila klaim konten benar tetapi KB yang keliru, itu masuk bagian A/17.5, bukan koreksi konten.

## 5. Aturan delegasi ke agen

Prinsip: penilaian fikih tidak didelegasikan ke model kecil. Agen kecil mencari dan memeriksa; penyunting (Opus, sesi
utama) menilai dan menulis.

"Langkah" merujuk ke protokol bagian 3 (A) dan bagian 4 (B), bukan nomor butir.

| Pekerjaan | Model | Alasan |
|---|---|---|
| A langkah 1: menyisir Shamela, daftar halaman kandidat + potongan teks + id, tanpa kesimpulan | **haiku** | murni pencarian; keluarannya data |
| A langkah 4, B langkah 3: `verify_quote`/`get_citation`/`fetch_quran` atas kutipan yang sudah dipilih | **haiku** | mekanis, hasilnya lolos/gagal |
| Butir B0: jalankan tes dan konsistensi, laporkan galat | **haiku** | mekanis |
| A langkah 2: membaca kandidat, draf temuan (kutipan, letak, klaim yang didukung, keraguan) | **sonnet** | membaca Arab fikih dengan teliti, belum memutuskan |
| B langkah 1–2, 4: memetakan tiap klaim konten ke baris KB dan menandai yang tampak tidak cocok | **sonnet** | membaca dua teks dan membandingkan |
| Butir B1 (tes soal hitung); A langkah 7 (fixture + overlay engine dari rumusan final) | **sonnet** (TDD) | implementasi dari spec jelas |
| A langkah 3 + 5, B langkah 5–6: menilai mu'tamad/riwayat, memutuskan ✔/⚠/⚑, merumuskan sel dan teks pengganti | **opus** (sesi utama) | keputusan fikih; salah di sini = hukum keliru |
| A langkah 6: menyunting KB 18, bab asal, rencana-verifikasi, 17.5 | **opus** (sesi utama) | kecil, butuh ketertelusuran |
| Review diff engine | **opus** | logika fikih inti |

Aturan jalan:
- Satu agen = satu butir A, atau satu potongan konten (±150 baris). Agen baru tiap kali, supaya konteks tidak menumpuk.
- Panggilan MCP serentak **≤ 4 total** di semua agen (rate limit). Praktisnya: paling banyak dua agen ber-MCP bersamaan,
  masing-masing ≤ 2 panggilan paralel. Agen B2 yang hanya membaca KB dan konten tidak memakai MCP, jadi tidak dihitung.
- Agen pencari, pembaca, dan pemeta **tidak menyunting berkas repo**. Mereka melapor dengan format di bawah.
- Agen engine/tes bekerja di worktree sendiri, satu butir satu commit.
- Commit per 2–3 butir A atau per berkas konten.

### Format laporan agen A (wajib)

```
BUTIR: K04-3 [HNF]
DICARI: <kitab · kategori · kata kunci · jumlah hasil>, satu baris per pencarian (termasuk yang nol)
KANDIDAT:
  - shamela:<buku>/<halaman> · <kitab juz/hlm> · matan|hasyiyah · «kutipan Arab persis»
    mendukung: <klaim sel yang didukung, satu kalimat>
    ragu: <apa yang belum jelas: riwayat? nukilan? konteks bab lain?>
TIDAK KETEMU: <yang dicari tapi tidak ada>
```

### Format laporan agen B (wajib)

```
BERKAS: materi.md · bagian <judul> · baris <a>–<b>
| baris | klaim (kutip pendek) | kode dirujuk | baris KB yang cocok | dugaan | catatan |
dugaan: cocok | kode salah | terlewat (tanpa kode) | beda dengan KB | kutipan ayat/hadits perlu dicek
```

### Templat prompt

**Agen pencari A (haiku)**
> Kamu menyisir Shamela untuk butir {kode} madzhab {madzhab}: {titik}. Klaim sel sekarang: "{isi sel}".
> Cari di kategori {kategori} pada kitab: {daftar kitab}. Kata kunci awal: {frasa Arab}. Maksimal 2 panggilan MCP paralel.
> Jangan menyimpulkan hukum dan jangan menyunting berkas. Kembalikan laporan persis dengan format agen A di
> `docs/design/spec-verifikasi-madzhab-dan-konten.md` bagian 5, termasuk pencarian yang hasilnya nol.

**Agen pembaca A (sonnet)**
> Baca utuh halaman kandidat berikut untuk butir {kode} {madzhab}: {daftar shamela id}. Pisahkan matan dan hasyiyah.
> Untuk tiap halaman: kutip lafaz yang relevan persis, sebut pendapat siapa (pengarang, riwayat, nukilan), dan apakah
> mendukung, menyelisihi, atau tidak menyentuh klaim "{isi sel}". Jangan menyunting berkas. Format: agen A, bagian 5.

**Agen pemeta B (sonnet)**
> Baca `docs/lampiran-konten/{berkas}` baris {a}–{b}. Untuk tiap klaim fikih (siapa mendapat apa, syarat, hijab, angka),
> buka baris KB yang dirujuk kodenya (`docs/kb/`, cari `| Rxx-y |`) dan bandingkan isinya. Klaim tanpa kode: cari baris KB
> yang seharusnya. Sumber hukum hanya `docs/kb/`; jangan menilai dari pengetahuan umum. Jangan menyunting berkas.
> Format: agen B, bagian 5.
