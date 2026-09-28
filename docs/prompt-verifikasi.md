# Prompt Verifikasi & Standarisasi Rujukan

Salin satu blok ke sesi AI yang tersambung ke MCP **Shamela, Hadith, Quran, IslamQA** dan punya akses ke repo ini. Kerjakan berurutan; tiap tahap = satu sesi/commit. Rencana induk: [`rencana-verifikasi.md`](rencana-verifikasi.md).

**Keputusan pengguna (2026-09-29), berlaku untuk semua prompt:**
1. Lafaz/nomor yang salah → langsung dibetulkan, dilaporkan sesudahnya. Yang **mengubah hukum** → berhenti, tanya pengguna.
2. Derajat hadits → sebutkan **semua** penilai yang ditemukan, jangan pilih satu.
3. Konten (`docs/lampiran-konten/*`) yang berkaitan dengan rujukan/dalil → **langsung diubah**.

---

## Prompt 0 — Standar format tautan (kerjakan pertama)

```
Baca CLAUDE.md, docs/kb/00_indeks_dan_konvensi.md, docs/kb/17_daftar_rujukan.md, dan packages/content/src/refs.ts.

Tugas: tetapkan SATU format tautan rujukan yang dipakai seluruh KB dan konten, lalu ajarkan refs.ts membacanya.

Format token (ditulis di kolom "Sumber" tabel "Dasar dan Rujukan" dan di konten):
- Shamela: `shamela:<book_id>/<page_id>` → https://shamela.ws/book/<book_id>/<page_id>
- Hadits: `hadits:<koleksi>:<nomor>` (koleksi: bukhari, muslim, abudawud, tirmidzi, nasai, ibnumajah, ahmad, malik, ...) → URL dari MCP Hadith / sunnah.com
- Al-Qur'an: `quran:<surah>:<ayat>` atau `quran:<surah>:<ayat>-<ayat>` → https://quran.com/<surah>/<ayat>
- IslamQA: `islamqa:<id>` → https://islamqa.info/ar/answers/<id>  (HANYA pendukung, tidak pernah satu-satunya dasar)
Satu baris boleh punya beberapa token. Teks manusiawi (judul kitab, juz/halaman cetak) tetap ada di samping token.

Kerjakan:
1. Tulis konvensi ini di bab 00 (konvensi baru) dan bab 17.1.
2. Di refs.ts: fungsi pengurai token → { jenis, url, label }; tambahkan field `tautan` ke EntriRujukan. Token tidak dikenal = error saat tes.
3. Unit test untuk tiap jenis token + token salah.
4. Ganti label kode kitab: [RDH] tetap untuk Raudhah; tambahkan kode kitab di 17.2 untuk semua kitab yang dipakai (LHM Lahim, ITH Ithraa, MBS Mabsuth, MGN Mughni, BHR al-Bahr ar-Ra'iq/Takmilah ath-Thuri, IQD 'Iqd al-Jawahir, BMZ Bahr al-Madzhab, TSH Tashil, MYS al-Muyassar). Kolom "Jenis" memakai kode ini, bukan "— (nukilan)".
Jangan mengisi token untuk baris mana pun di prompt ini — hanya infrastruktur. Jalankan tes packages/content dan packages/engine; commit.
```

## Prompt 1 — Ayat Al-Qur'an

```
Konteks: docs/prompt-verifikasi.md (keputusan pengguna) dan konvensi token dari Prompt 0.

Panggil fetch_grounding_rules MCP Quran dulu.
Untuk setiap rujukan berjenis [Q] di docs/kb/*.md, teks ayat di bab 1.2, dan setiap ayat yang dikutip di docs/lampiran-konten/*.md:
1. Ambil teks kanonik (fetch_quran) dan cocokkan huruf per huruf dengan teks di repo. Beda → ganti dengan teks kanonik (pertahankan harakat bila sumber kanonik berharakat).
2. Pastikan nomor surah:ayat benar; tambahkan token `quran:s:a`.
3. Terjemah Indonesia yang ada di konten: cocokkan maknanya dengan terjemah resmi (Kemenag bila tersedia di MCP); beda makna → betulkan.
Laporan: tabel Kode | Status (✔ / diperbaiki / ⚑) | Temuan. Commit.
```

## Prompt 2 — Hadits

```
Konteks: docs/prompt-verifikasi.md dan token Prompt 0.

Panggil fetch_grounding_rules MCP Hadith dulu.
Cakupan: tabel 17.3, semua rujukan berjenis [H] di docs/kb/*.md, dan semua hadits yang dikutip di docs/lampiran-konten/*.md.
Untuk tiap hadits:
1. Cari (search_hadith keyword + semantic) dan ambil teks (fetch_hadith). Cocokkan lafaz yang dikutip; beda → betulkan sesuai riwayat yang disebut.
2. Nomor per koleksi (Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i, Ibnu Majah, Ahmad bila ada). Sebutkan edisi penomoran.
3. Derajat: SEMUA penilai yang ditemukan (penulis kitab, al-Albani, Syu'aib al-Arna'uth, dll.). Jangan memilih satu. Hadits dha'if tetap ditandai "dha'if", jangan dihapus.
4. Hadits di luar koleksi MCP Hadith (mis. Ibnu Hibban, al-Hakim) → cari di Shamela, pakai token shamela:.
5. Tambahkan token hadits:/shamela: di kolom Sumber.
Klaim hukum yang ternyata bersandar HANYA pada hadits dha'if → ⚑ laporkan, jangan ubah hukumnya.
Laporan tabel + commit.
```

## Prompt 3 — Atsar & ijma'

```
Konteks: docs/prompt-verifikasi.md dan token Prompt 0.

Cakupan: semua rujukan berjenis [A] dan [IJ] di docs/kb/*.md, plus R11-3 (atsar takharuj Tumadhir; coba ejaan "تماضر"/"طماضر", cari juga di Nashb ar-Rayah az-Zaila'i).
- Atsar: temukan di Mushannaf 'Abdurrazzaq, Mushannaf Ibnu Abi Syaibah, Sunan al-Baihaqi, Sunan Sa'id bin Manshur. Lafaz + nomor + token shamela:.
- Ijma': siapa penukilnya dan di kitab mana (mis. Ibnu al-Mundzir al-Ijma', Ibnu Hazm Maratib al-Ijma', an-Nawawi). Token shamela: ke halaman penukilan. Ijma' tanpa penukil yang bisa ditunjuk → ⚑.
Laporan tabel + commit.
```

## Prompt 4 — Nash Raudhah [RDH] (88 baris)

```
Konteks: docs/prompt-verifikasi.md dan token Prompt 0.

Resolve book_id Raudhah ath-Thalibin di Shamela (shamela_resolve). Untuk setiap baris di docs/kb/*.md yang jenisnya memuat RDH:
1. Setiap kutipan «…» → shamela_verify_quote dengan book_id Raudhah. Catat page_id dan juz/halaman cetak.
   - verbatim / beda harakat → tambahkan token shamela:<id>/<page>.
   - partial → ganti kutipan dengan lafaz kitab (ambil dari shamela_get_page around_phrase), tambahkan token.
   - not_found → cari di seluruh Raudhah dengan shamela_search_phrase; masih tidak ada → ⚑.
2. Pastikan kutipan berasal dari BODY (matn), bukan footnote muhaqqiq.
3. Kolom Sumber: ganti keterangan "Bab 6, sabab 3" dsb. dengan "Raudhah juz/hal cetak" + token.
Kalau isi kitab ternyata berlawanan dengan klaim KB → ⚑, jangan diubah. Kerjakan per bab (01–14), commit per 2–3 bab.
```

## Prompt 5 — Nukilan madzhab bab 18 dan sumber sekunder

```
Konteks: docs/prompt-verifikasi.md, token Prompt 0, docs/kb/18_matriks_khilaf.md.

A. Setiap rujukan yang bersumber Lahim (LHM) atau Ithraa (ITH): Lahim dan Ithraa tidak ada di Shamela → cukup cantumkan halaman cetak; JANGAN menandainya salah. Bila klaim yang sama ditemukan di kitab primer madzhabnya, tambahkan token shamela: sebagai rujukan kedua.
B. Setiap sel "(s)" di bab 18: cari posisi madzhab itu di kitab primernya, scope madhhab:
   [HNB] al-Mughni, Kasysyaf al-Qina', al-Inshaf · [HNF] al-Mabsuth, Hasyiyah Ibn 'Abidin, al-Bahr ar-Ra'iq, as-Sirajiyyah bila ada · [MLK] Mukhtashar Khalil, asy-Syarh al-Kabir ad-Dardir, 'Iqd al-Jawahir · [SYF] Raudhah, al-Majmu', Mughni al-Muhtaj.
   Ketemu dan cocok → hapus "(s)", tambahkan kitab + token. Ketemu dan BERBEDA → ⚑.
C. Sel kosong yang tersisa: "satu orang dua jalur menurut qarabah [HNF]" (Ibn 'Abidin bab dzawil arham), R13-14 laqith [SYF] (Raudhah Kitab al-Laqith).
Laporan tabel per kode Kxx-y + commit.
```

## Prompt 6 — Konten edukasi

```
Konteks: docs/prompt-verifikasi.md, token Prompt 0, hasil Prompt 1–5 sudah di KB.

Cakupan: docs/lampiran-konten/*.md (materi, teks_edukasi, faq, syahid, ahwal, cheatsheet, modul, kitab, soal_kuis, soal_hitung).
Untuk setiap berkas:
1. Setiap klaim fikih harus punya [Rxx-y] dan isinya sesuai KB (termasuk koreksi terbaru: haml [SYF] bab 13a, multi-madzhab bab 18). Tidak sesuai → betulkan sesuai KB.
2. Ayat & hadits yang dikutip → samakan dengan hasil Prompt 1–2 (lafaz, nomor, token).
3. soal_hitung.md: hitung ulang tiap soal dengan packages/engine; jawaban beda → selidiki, betulkan yang salah (engine atau kunci). Engine yang salah → ⚑, jangan ubah engine di prompt ini.
4. Istilah sesuai docs/kb/15_glosarium.md.
5. kitab.md: samakan dengan 17.2 + token shamela: ke halaman judul kitab.
Jalankan tes packages/content (ada tes konsistensi). Laporan per berkas + commit.
```

## Prompt 7 — Penutup

```
Konteks: docs/prompt-verifikasi.md.

1. Kumpulkan semua ⚑ dari commit Prompt 1–6 ke satu tabel di docs/rencana-verifikasi.md bagian "Keputusan tertunda".
2. Perbarui 17.4 (hapus yang selesai), 17.5 (jejak koreksi), bab 18.3, docs/referensi-dicari.md.
3. Tes: setiap baris rujukan punya minimal satu token ATAU alasan tertulis kenapa tidak (mis. Lahim tidak ada di Shamela). Tambahkan tes itu di packages/content.
Commit.
```
