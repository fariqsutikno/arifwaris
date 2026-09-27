# Portal Admin — Tahap B: Form per Jenis Konten — Desain

Status: draf untuk review (2026-09-27). Branch: `claude/eager-gates-9uxfhz`.
Melanjutkan [Tahap A](2026-09-27-portal-admin-dashboard-design.md). Alur editorial, RLS, dan skema isi
(`packages/content/src/skema.ts`) tidak berubah; tahap ini hanya mengganti cara isi disunting.

## Latar

`EditorEntri` sekarang: field string tingkat atas jadi input (label = nama kunci teknis), blok materi jadi Markdown,
**sisanya textarea JSON** (angka, boolean, enum, `ar`, `pilihan`, `kasus`, `baris` ahwal, dst.). Penulis dan penyusun
soal harus paham skema. Tahap B memberi setiap jenis konten form dengan label manusiawi.

## Keputusan (disetujui 2026-09-27)

| Hal | Keputusan |
|---|---|
| Blok/potongan (pertanyaan/pilihan/pembahasan kuis, jawaban FAQ, kasus/penyelesaian tanya jawab, blok materi) | Textarea **Markdown** memakai `tulisBlok`/`bacaBlok` dan `tulisPotongan`/`bacaPotongan` yang sudah ada. Editor blok = tahap C |
| Kasus soal hitung | Form terstruktur + tombol **Hitung dengan engine** yang mengisi saham & ashl akhir; tetap bisa disunting manual, beda dari engine → peringatan |
| JSON mentah | Tetap tersedia untuk **semua peran** sebagai tab "JSON" di samping tab "Form" |
| Alur | Spec + plan dulu, lalu implementasi |

## Bukan tujuan

- Editor blok visual, sisipan istilah/rujukan (tahap C).
- Blok ```` ```kasus ```` di dalam Markdown materi tetap ditulis sebagai Markdown (tahap C).
- Perubahan skema Zod, database, atau repo.

## Arsitektur

Deskripsi form deklaratif per jenis, satu komponen perender:

```
apps/admin/src/editor/formulir.ts     FORM_KONTEN: Record<JenisKonten, Bagian[]>  (data, bukan JSX)
apps/admin/src/editor/nilaiForm.ts    keNilaiForm(jenis, isi) / dariNilaiForm(jenis, slug, nilai) — murni
apps/admin/src/editor/kasus.ts        hitungHarapan(contoh) — bungkus engine lewat @waris/web
apps/admin/src/layar/FormKonten.tsx   merender Bagian[] → komponen shadcn
apps/admin/src/layar/EditorKasus.tsx  form ContohKasus + tombol Hitung
```

- `Bagian` = judul bagian (mis. "Versi Arab") + daftar `Bidang`. Jenis bidang:
  `teks`, `teksPanjang`, `angka`, `pilihan` (enum), `centang`, `markdownBlok`, `markdownPotongan`,
  `pilihanKuis` (daftar Markdown potongan + radio jawaban benar), `kasus`, `barisAhwal` (baris berulang),
  `tautan` (URL, boleh kosong → `null`/tanpa field sesuai skema).
- Tiap bidang punya `jalur` (mis. `['ar','judul']`), `label` Indonesia, `bantuan` opsional, `wajib`/`opsional`.
- Bagian opsional (`ar` pada modul/materi/tanya_jawab) punya sakelar "Ada versi Arab"; mati → field `ar` dihapus.
  Field Arab ditampilkan `dir="rtl" lang="ar"`.
- `NilaiForm` = objek datar `Record<jalurTeks, string | boolean | ...>`; Markdown disimpan sebagai string sampai
  `dariNilaiForm` memanggil `bacaBlok`/`bacaPotongan`, lalu hasil akhirnya **selalu** lewat `bacaIsi` (Zod) —
  satu penjaga, sama seperti sekarang.
- `BentukEditor` + `keBentuk`/`dariBentuk` lama dihapus setelah semua jenis punya form (tes `bentuk.test.ts`
  dipindah ke `nilaiForm.test.ts`).

## Form per jenis

| Jenis | Bidang |
|---|---|
| `modul` | Nomor (angka), Judul, Ringkasan (panjang); Versi Arab: Judul, Ringkasan |
| `materi` | Judul, Slug, Modul (pilihan dari daftar modul yang ada), Tujuan (panjang), Perlu dicek (centang), Isi (Markdown blok); Versi Arab: Judul, Tujuan, Isi (Markdown blok, opsional → "isi masih Indonesia") |
| `soal_kuis` | Kode, Bab (angka), Pertanyaan (Markdown potongan), Pilihan (≥ 2, tambah/hapus, radio benar), Pembahasan (Markdown potongan) |
| `soal_hitung` | Kode, Bab, Tingkat (dasar/menengah/sulit), Judul, Topik, Sumber, Kasus (EditorKasus) |
| `tanya_jawab` | Slug, Judul, Jenis (Saran ustadz/Fatwa), Ringkasan, Kasus (Markdown blok), Penyelesaian (Markdown blok), Sumber; Versi Arab: Judul, Ringkasan, Sumber, Kasus & Penyelesaian (opsional) |
| `faq` | Id, Kelompok (pilihan dari kelompok yang ada + ketik baru), Pertanyaan, Jawaban (Markdown blok) |
| `kitab` | Judul, Tautan (opsional), PDF (opsional) |
| `syahid` | Surah, Ayat (angka), Hukum, Syahid (panjang, rtl), Rujukan |
| `glosarium_ar` | Istilah (pilihan dari glosarium), Makna, Arti awam (opsional), Contoh (opsional) |
| `ahwal` | Kunci, Baris berulang: Bagian, Syarat, Cocok (fardh teks/kosong, ashabah, terhalang, kode alasan), Arab: Bagian, Syarat |
| `teks_edukasi` | Id, Teks Arab (panjang, rtl, opsional) |
| `cheatsheet` | Judul, Judul Arab (opsional), Deskripsi, Tautan (URL atau kosong → `null`) |

Label yang dipakai layar sebelumnya (`FIELD_CALON_JUDUL` untuk slug entri baru) tetap bekerja karena `dariNilaiForm`
menghasilkan isi yang sama bentuknya.

## Editor kasus (soal hitung)

- Pewaris: Laki-laki / Perempuan.
- Ahli waris: baris per kunci `KunciAhliWaris` dengan jumlah orang (± ), label dari nama tampilan web; disimpan
  sebagai `ahliWaris: string[]` satu entri per orang (skema tidak berubah).
- Harta: input angka rupiah (bigint, pakai `bacaInputUang` web bila diekspor, kalau tidak parser lokal digit saja).
- Harapan: tabel saham per kunci + ashl akhir, input angka.
- **Hitung dengan engine**: `hitungHarapan(contoh)` = `kasusDariContoh` → `jalankan` → `ringkas` (jalur yang sama
  dengan tes `apps/web/src/__tests__/materi.test.tsx`), mengisi tabel harapan. Hasil engine bukan `OK` (mis.
  `PERLU_INPUT`, `TIDAK_DIDUKUNG`, munasakhat) → pesan galat, harapan tidak diubah. Admin tidak mengarang hukum:
  angka berasal dari engine [SYF].
- Harapan diisi manual dan berbeda dari engine → peringatan kuning "Harapan berbeda dari hasil engine" (tidak
  memblokir simpan; reviewer melihat peringatan yang sama).
- Untuk ini `apps/web` mengekspor `./contoh` (`kasusDariContoh` + `hitungHarapan` baru di `layar/belajar/contoh.ts`),
  dan tes materi web memakai `hitungHarapan` supaya jalurnya satu.

## Tab Form / JSON

- Tab "Form" (bawaan) dan "JSON". Pindah Form → JSON: `dariNilaiForm` lalu `keJson`, indentasi 2; kalau form belum
  sah, JSON dibentuk dari nilai apa adanya yang bisa dibentuk dan galat ditampilkan.
- Pindah JSON → Form: `bacaIsi`; gagal (JSON rusak/Zod) → tetap di tab JSON + galat, tidak kehilangan teks.
- Simpan dari tab mana pun memakai isi tab aktif, lewat `bacaIsi`.
- Mode baca: kedua tab hanya-baca.

## Galat

- Galat Zod dipetakan ke bidang lewat `path` (mis. `pilihan.1` → bidang Pilihan) dan tampil di bawah bidang; galat
  yang tidak cocok bidang mana pun tampil di Alert atas. Galat Markdown (`bacaBlok`) tampil di bidang Markdown-nya.
- Galat repo tetap di Alert atas seperti sekarang.

## Tes

- Unit `nilaiForm`: tiap jenis bolak-balik `isi → keNilaiForm → dariNilaiForm = isi` memakai contoh di
  `apps/admin/src/__tests__/contoh.ts` + konten asli dari snapshot web; sakelar Versi Arab mati → `ar` hilang;
  `tautan` kosong → `null` (cheatsheet); galat Zod terpetakan ke jalur bidang.
- Unit `FORM_KONTEN`: mencakup semua `JENIS_KONTEN`; setiap field wajib di skema punya bidang (tes membandingkan
  kunci objek hasil `dariNilaiForm` dengan kunci contoh).
- Unit `hitungHarapan`: contoh materi yang ada menghasilkan harapan yang tersimpan; kasus tak didukung → galat.
- Komponen: editor soal kuis (tambah pilihan, pilih jawaban benar, simpan memanggil `buatDraf` dengan isi benar);
  soal hitung (tombol Hitung mengisi harapan; ubah manual → peringatan); tab JSON ↔ Form termasuk JSON rusak;
  mode baca tanpa input yang bisa diubah; reviewer tetap tanpa tombol simpan.
- Tes lama `editor.test.tsx` disesuaikan dengan label baru.
