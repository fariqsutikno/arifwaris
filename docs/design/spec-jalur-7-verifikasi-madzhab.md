# Spec Jalur 7: menutup sisa verifikasi madzhab (2026-11-22)

Menerima: sisa butir terbuka di `docs/rencana-verifikasi.md` dan sel bertanda (s)/? di `docs/kb/18_matriks_khilaf.md`.
Memutuskan: tiap butir naik ke primer, tetap sekunder dengan jejak pencarian, atau berbalik (⚑ keputusan pemilik).
Menyerahkan: KB 18 yang lebih bersih, label "sekunder" dicabut di UI bila selnya naik, dan cabang `TIDAK_DIDUKUNG`
di engine yang bisa dibuka (dengan fixture uji) bila nashnya ketemu.

## 1. Selesai artinya

- Tiap butir di bagian 2 berstatus salah satu dari: **primer** (kutipan diperiksa `verify_quote`, letak Shamela tercatat),
  **tetap (s)/?** dengan catatan "dicari di kitab X, Y, Z (tanggal), tidak ketemu", atau **⚑** menunggu pemilik.
- Tabel "Keputusan tertunda" di `rencana-verifikasi.md` dan 18.3 diperbarui; jejak koreksi masuk 17.5.
- Butir yang naik dan punya cabang engine: overlay ditulis dengan TDD (fixture `packages/engine/src/__tests__/fixtures/madzhab.ts`),
  `refs.test.ts` hijau.
- Tidak ada hukum yang berubah diam-diam (rencana-verifikasi prinsip 3).

## 2. Inventaris butir, urut dampak

| # | Butir | Madzhab | Sekarang | Dampak bila tertutup | Kitab target (urut) |
|---|---|---|---|---|---|
| 1 | K04-3 nenek dua qarabah | [HNF] | ? (nukilan Mughni) | buka `TIDAK_DIDUKUNG` di `pipeline.ts:105` untuk [HNF] (khilaf Abu Yusuf vs Muhammad → kemungkinan `opsi:`) | Mabsuth (bab jaddat), Bada'i', Tabyin, Ibnu 'Abidin |
| 2 | K04-3 nenek dua qarabah | [MLK] | ? (tersirat) | idem untuk [MLK] | Mukhtashar Khalil + Syarh ad-Dardir/Dasuqi, Mawahib, Minah al-Jalil |
| 3 | K05-2 furudh dalam wala' | [MLK] | belum terverifikasi | buka `TIDAK_DIDUKUNG` kasus ayah mu'tiq | Mudawwanah, Dardir/Dasuqi (bab wala'), Mawahib |
| 4 | Satu dzawil arham dua jalur (qarabah) | [HNF] | belum ada nash | buka `TIDAK_DIDUKUNG` dua jalur [HNF] | Mabsuth 30 (dzawil arham), Sirajiyyah + syarahnya, Ibnu 'Abidin |
| 5 | R13-14 laqith: «merdeka», «penemu tidak mewarisi» | [SYF] | blocked | cabut titik blocked di CLAUDE.md | Raudhah bab laqith, Tuhfah, Nihayah, Mughni al-Muhtaj |
| 6 | K13a-4 tanda hidup janin | [MLK] | (s) | cabut label sekunder | Mudawwanah, Dardir/Dasuqi, Mawahib |
| 7 | K01-2 / R01-1 urutan tajhiz | [HNB] | (s) | cabut label sekunder | Kasysyaf al-Qina', Syarh Muntaha, Inshaf |
| 8 | K01-2 rahn vs tajhiz | [HNF] | ? sebagian | catatan saja (tidak dimodelkan engine) | Ibnu 'Abidin, Bada'i' |
| 9 | K02-4 ikhtilaf ad-dar | [MLK] | (s) | tidak ada (bukan lingkup platform) | Dardir/Dasuqi |
| 10 | K13-1 harta murtaddah | [HNF] | belum diperiksa | tidak ada (bukan lingkup platform) | Mabsuth 10/101–107 (baca utuh) |

Butir 9–10 dikerjakan terakhir dan boleh ditutup "tidak dicari, bukan lingkup" bila pemilik setuju.

## 3. Protokol per butir

1. **Cari** di kategori madzhab yang benar (Shamela membagi per kategori; jangan cari [MLK] di kategori Hanafi).
   Pakai `shamela_search_phrase` untuk frasa kunci Arab, `shamela_search_pages` untuk tema. Catat semua kitab yang dicari,
   juga yang hasilnya nol.
2. **Baca** halaman kandidat utuh (`get_page`, matan vs hasyiyah dipisah: hasyiyah bukan kata pengarang matan).
3. **Nilai**: apakah ini pendapat mu'tamad madzhab, satu riwayat, atau nukilan pihak lain? Nukilan dari kitab madzhab lain
   (mis. Mughni tentang Malik) tetap (s).
4. **Kunci**: `verify_quote` untuk kutipan yang akan masuk KB, `get_citation` untuk letaknya.
5. **Putuskan** salah satu: primer / tetap / ⚑. Berbalik dari isi sel sekarang = berhenti, laporkan, jangan sunting.
6. **Catat**: sel KB 18, blok KHILAF di bab asal bila perlu, `rencana-verifikasi.md`, 17.5.
7. **Engine** (hanya butir 1–4, setelah 6 dan bila primer): fixture dulu, lalu overlay di ruleset, anotasi `// [K04-3] ...`.

Larangan: tidak mengisi dari ingatan; IslamQA hanya penunjuk kitab; tarjih Lahim/Ithraa tidak pernah jadi posisi [SYF];
`TIDAK_DIDUKUNG` tidak dibuka tanpa kutipan primer atau sekunder yang diizinkan (CLAUDE.md).

## 4. Aturan delegasi ke agen

Prinsip: penilaian fikih (langkah 3 dan 5) tidak didelegasikan ke model kecil. Agen kecil mencari dan memeriksa;
penyunting (Opus, sesi utama) menilai dan menulis ke KB.

| Pekerjaan | Model | Alasan |
|---|---|---|
| Langkah 1: menyisir Shamela, daftar halaman kandidat + potongan teks + id, tanpa kesimpulan | **haiku** | murni pencarian; keluarannya data |
| Langkah 4: `verify_quote` + `get_citation` atas kutipan yang sudah dipilih | **haiku** | mekanis, hasilnya lolos/gagal |
| Langkah 2: membaca kandidat, menyusun draf temuan (kutipan, letak, klaim yang didukung, keraguan) | **sonnet** | perlu membaca Arab fikih dengan teliti, tapi belum memutuskan |
| Langkah 3 + 5: menilai mu'tamad/riwayat, merumuskan isi sel, menandai ⚑ | **opus** (sesi utama) | keputusan fikih; salah di sini = hukum keliru di engine |
| Langkah 6: menyunting KB 18, bab asal, rencana-verifikasi, 17.5 | **opus** (sesi utama) | kecil, tapi butuh ketertelusuran |
| Langkah 7: fixture + overlay engine dari rumusan yang sudah final | **sonnet** (TDD) | implementasi dari spec jelas |
| Review diff engine | **opus** | logika fikih inti |
| Cek tes, `refs.test.ts`, rapikan tabel | **haiku** | mekanis |

Aturan jalan:
- Satu agen = satu butir (paling banyak dua yang satu kitab target). Agen baru per butir, supaya konteks tidak menumpuk.
- Panggilan MCP Shamela serentak **≤ 4 total** di semua agen (rate limit). Praktisnya: paling banyak dua agen cari bersamaan,
  masing-masing ≤ 2 panggilan paralel.
- Agen pencari dan pembaca **tidak menyunting berkas repo**. Mereka melapor dengan format di bawah; penyunting yang menulis.
- Agen engine bekerja di worktree sendiri, satu butir satu commit.
- Commit per 2–3 butir (pola verifikasi sebelumnya).

### Format laporan agen (wajib)

```
BUTIR: K04-3 [HNF]
DICARI: <kitab · kategori · kata kunci · jumlah hasil>, satu baris per pencarian (termasuk yang nol)
KANDIDAT:
  - shamela:<buku>/<halaman> · <kitab juz/hlm> · matan|hasyiyah · «kutipan Arab persis»
    mendukung: <klaim sel yang didukung, satu kalimat>
    ragu: <apa yang belum jelas: riwayat? nukilan? konteks bab lain?>
TIDAK KETEMU: <yang dicari tapi tidak ada>
```

### Templat prompt agen pencari (haiku)

> Kamu menyisir Shamela untuk butir {kode} madzhab {madzhab}: {titik}. Klaim sel sekarang: "{isi sel}".
> Cari di kategori {kategori} pada kitab: {daftar kitab}. Kata kunci awal: {frasa Arab}. Maksimal 2 panggilan MCP paralel.
> Jangan menyimpulkan hukum dan jangan menyunting berkas. Kembalikan laporan persis dengan format di
> `docs/design/spec-jalur-7-verifikasi-madzhab.md` bagian 4, termasuk pencarian yang hasilnya nol.

### Templat prompt agen pembaca (sonnet)

> Baca utuh halaman kandidat berikut untuk butir {kode} {madzhab}: {daftar shamela id}. Pisahkan matan dan hasyiyah.
> Untuk tiap halaman: kutip lafaz yang relevan persis, sebut pendapat siapa (pengarang, riwayat, nukilan), dan apakah
> mendukung, menyelisihi, atau tidak menyentuh klaim "{isi sel}". Jangan menyunting berkas. Format laporan: bagian 4 spec.

## 5. Urutan kerja

1. Butir 1–2 (K04-3) bersama: satu agen pencari [HNF], satu [MLK]. Hasilnya menentukan apakah K04-3 jadi `opsi:` di [HNF].
2. Butir 3–4.
3. Butir 5 (laqith [SYF]).
4. Butir 6–8 (label sekunder).
5. Butir 9–10 bila pemilik tidak menutupnya.
6. Engine untuk butir yang naik, lalu satu review opus.

Perkiraan: verifikasi 2–3 sesi; engine 1 sesi per butir yang terbuka.
