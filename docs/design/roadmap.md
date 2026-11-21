# Roadmap: urutan kerja dan posisi kita (2026-11-21)

Satu halaman untuk menjawab "lanjut, mana dulu?". Rincian tiap gelombang ada di
`rencana-implementasi-penilaian-kelas/00-induk.md` dan dokumen anaknya (01–07).

## Arti kode

| Kode | Artinya | Sumber |
|---|---|---|
| **A** | Revamp layar Hasil (hero, Bagikan, simpan otomatis, Pelajari) | `spec-hasil-revamp-dan-tabel-latihan.md` bagian A |
| **E1–E5** | Prasyarat engine untuk tabel latihan | spec tabel, bagian 4 |
| **B1–B10** | Tabel faraidh di Latihan (komponen, jenis soal, hero, verifikasi) | spec tabel |
| **G0–G8** | Gelombang kerja penilaian → kelas → SaaS | `00-induk.md` |
| **P0–P8** | Fase di spec model penilaian (isi fitur) | `spec-model-percobaan-dan-penilaian.md` |
| **K, T, PDP** | Temuan keamanan, arsitektur, UU PDP | `audit-arsitektur-kesiapan-kelas.md` |

## Posisi hari ini

| Selesai | Status |
|---|---|
| A (Hasil revamp) | selesai, di `main` |
| E1–E5 (engine) | selesai, di `main` |
| B1–B6, B9 (tabel soal biasa) + tinjauan visual | selesai, di `main` |
| G0 keamanan produksi | digabung ke `main` (`24c27e4`); satu langkah dasbor menunggu pemilik, lihat bawah |
| G1 fondasi penilaian | selesai, di `main` (PR #42, lewat #43) |
| Hasil + mode fokus (Langkah demi langkah, Teks \| Sinema) | selesai, di `main` (PR #35); kode fokus lama sudah dibuang |
| G2 jenis soal latihan | **kode selesai**, di `main` (PR #43); sisa: perbandingan layar dengan mockup dan soal terbit tim keilmuan |
| G3 data server + PDP + soal buta | **berjalan** di sesi sendiri, tiga PR berurutan (server+XP / PDP / soal buta) |
| Jalur 7: verifikasi madzhab [HNB]/[HNF]/[MLK] | **sebagian besar jalan**: matriks KB 18 punya 106 baris, hanya 4 baris masih bertanda (s) (K01-2, K02-4, K13a-4, R01-1) dan 1 sel "?" (K04-3); 4 butir masih Terbuka di `docs/rencana-verifikasi.md` (R13-14 laqith, K05-2 [MLK], K13-1 [HNF], dzawil arham dua jalur [HNF]) |
| Jalur 7b: harta sudah dibagi sebagian | **belum mulai**: KB bab 11 baru memuat qismah dan takharuj (R11-2 shulh); belum ada bagian KB, kode engine, maupun UI. Hanya ada bayangan `mockup-sudah-dibagi.html`. Langkah pertama: riset dan verifikasi rujukan ke bab 11 |
| Jalur 8: KHI | **belum mulai**: `docs/kb-khi/` belum ada; baru ada aturan pemisahan (ruleset sendiri, ditandai "hukum positif, bukan fikih") |

## Alur ke depan

```
SEKARANG
  ├─ [kamu] gabung PR #42 (G1) setelah ditinjau
  ├─ [kamu] tunjuk penulis pengecoh soal penalaran (spec 8.30) ── gerbang G4
  └─ [kamu] langkah dasbor G0 yang tersisa (mis. matikan login Email, K1)

G2  jenis soal latihan (B7, B8)         KODE SELESAI (PR #43)
    munasakhat, dzawil arham, mafqud, khuntsa, haml [SYF], haml [HNB], gharqa [SYF]; hero B8; KartuTebak dihapus; B10 otomatis lulus
    sisa: bandingkan layar dengan mockup (laptop + 375 px) begitu soal terbit; rapikan "Cara mengisi" ganda di gharqa;
          buang kunci diksi kartu tebak; [HNB] tilad–tharif belum punya tabel (perlu desain + mockup)

G3  data server + PDP dasar + soal buta  13–20 hari
    percobaan_soal + catat-percobaan + XP dari server; papan peringkat opt-in;
    kebijakan privasi + persetujuan; hapus/unduh akun; soal buta

   ── sejajar sepanjang jalan (berkas beda), urutan sesuai keputusan 2026-11-18, semua sebelum AMIN (G5) ──
      7  verifikasi madzhab   sisa 4 butir Terbuka + 4 sel (s) + 1 sel "?"; cabut label "sekunder" bila cocok
      7b harta sebagian       riset dan verifikasi bab 11 dulu → KB → engine → UI isian
      8  KHI                  `docs/kb-khi/`, ruleset terpisah
      posisi G4 terhadap 7b dan KHI belum ditegaskan (G4 sudah setelah 7 menurut sisipan 2026-11-19)

G4  lengkapi materi & latihan soal       kode 6–9 hari + konten tim keilmuan
    skema soal penalaran → soal bangkitan + katalog → soal kurasi

G5  AMIN                                 syarat: kebijakan privasi sebut penyedia LLM,
                                         persetujuan terpisah, retensi log
G6  Ujian + keterlibatan                 12–18 hari, boleh sejajar G5
    Ujian → kolom benar → soal serupa → kemahiran → soal hari ini → level → profil

G7  kelas                                18–30 hari; syarat: DPIA, keputusan usia & region
    mode tugas → kelas inti → tugas otomatis → sesi langsung
G8  SaaS                                 20–30 hari; uji harga ke dosen dulu
    lembaga & monetisasi → alat ukur → ticketing → mode cerita AI
```

## Yang menunggu keputusanmu

1. **Pertanyaan spec bagian 8**: semua sudah diputuskan 2026-11-20 sesuai rekomendasi, kecuali **30** (siapa penulis
   pengecoh soal penalaran dan daftar kesalahan umum), yang menahan G4.
2. ~~Tab Khuntsa di mockup~~ selesai 2026-11-21 (KB 13c.4 X1); jenis soal khuntsa sudah ada.
3. **Kontak pengendali data + isi kebijakan privasi** (G3), dan apakah proyek `ap-south-1` = produksi (pindah region sebelum G7).
4. **Pilot kelas sebelum AMIN?** Demi kalender semester; biayanya AMIN mundur ±5–7 minggu.
5. **Siapa menulis pengecoh soal penalaran** (G4).
6. **Harga paket** (G8), setelah wawancara dosen/kaprodi.

## Hal kecil yang masih menggantung

- Label item "Ekspor" di menu Bagikan layar penuh pohon.
- Cabang `rencana/munasakhat-arham-gharqa` sudah digabung (PR #46, 2026-11-21); tabel latihan munasakhat tetap hanya untuk munasakhat biasa (kelompok gharqa/dzawil arham di rantai → TIDAK_DIDUKUNG, perlu desain + mockup).
- Indeks graphify diperbarui setelah `main` stabil dan di-push.
- Dua riset (pasar, UX kelas) sudah ada; angka pasar masih asumsi.

## Aturan urutan (ringkas)

1. Yang kerusakannya naik tiap hari (keamanan, PDP, kualitas data) → paling dulu.
2. Kontrak komponen dan modul penilaian → sebelum jenis soal berikutnya.
3. Format yang akan diisi banyak konten (format kasus soal, `IdSoal`, `bobotXp`) → final sebelum konten massal.
4. Fitur yang mengirim data ke pihak ketiga (AMIN) → setelah kebijakan privasi + persetujuan.
5. Kelas dan SaaS → setelah AMIN, kecuali pilot semester.
