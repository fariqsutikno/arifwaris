# Portal Admin Tahap B — Form per Jenis Konten Implementation Plan

**Goal:** Setiap jenis konten disunting lewat form berlabel (bukan textarea JSON), dengan tab JSON tetap tersedia
untuk semua peran dan kasus soal hitung bisa diisi dari engine.

**Architecture:** Deskripsi form deklaratif `FORM_KONTEN` + fungsi murni `keNilaiForm`/`dariNilaiForm`
(selalu berakhir di `bacaIsi`), satu perender `FormKonten`, satu `EditorKasus`. Tidak ada perubahan skema,
database, atau repo.

**Spec:** `docs/superpowers/specs/2026-09-27-portal-admin-form-konten-design.md`

## Global Constraints

- Tanpa emoji; komponen shadcn yang sudah ada (+ `checkbox`, `radio-group`, `switch` lewat CLI bila perlu).
- Isi yang disimpan harus identik bentuknya dengan sekarang (tes bolak-balik) — web tidak boleh terdampak.
- Angka saham/harta tetap `bigint` / string digit; tidak ada `number` untuk uang.
- Harapan soal hitung hanya dari engine atau input manual penulis; admin tidak menghitung fikih sendiri.
- Commit per task; pesan diakhiri trailer Co-Authored-By.

## Review Focus

1. **Bolak-balik tidak lossless** (field opsional hilang/muncul, `null` vs tanpa field, urutan kunci) → Task 2.
2. **Tautan cheatsheet**: kosong harus `null`, bukan `""` (Zod `url()` menolak `""`) → Task 2.
3. **JSON → Form gagal** tidak boleh membuang teks JSON → Task 6.
4. **Hitung engine** untuk kasus munasakhat/`PERLU_INPUT` → galat, bukan throw → Task 4.

## Struktur berkas

| Berkas | Tanggung jawab |
|---|---|
| `apps/admin/src/editor/formulir.ts` (baru) | tipe `Bagian`/`Bidang`, `FORM_KONTEN` |
| `apps/admin/src/editor/nilaiForm.ts` (baru) | `keNilaiForm`, `dariNilaiForm`, `petakanGalat` |
| `apps/admin/src/editor/kasus.ts` (baru) | `hitungHarapan`, `bandingkanHarapan` |
| `apps/web/src/layar/belajar/contoh.ts`, `apps/web/package.json` | ekspor `./contoh` + `hitungHarapan` |
| `apps/admin/src/layar/FormKonten.tsx` (baru) | perender bidang |
| `apps/admin/src/layar/EditorKasus.tsx` (baru) | form kasus + Hitung |
| `apps/admin/src/layar/EditorEntri.tsx` | tab Form/JSON, pakai nilaiForm |
| `apps/admin/src/editor/bentuk.ts` + tes | dihapus di Task 7 |

### Task 1: `FORM_KONTEN` dan tipe bidang
- [x] Tes: mencakup semua `JENIS_KONTEN`; jalur bidang unik per jenis.
- [x] Tulis `formulir.ts` sesuai tabel spec.

### Task 2: `keNilaiForm` / `dariNilaiForm`
- [x] Tes bolak-balik semua jenis (contoh admin + snapshot web), sakelar Arab, tautan kosong → `null`,
      Markdown rusak → galat pada jalur bidang, Zod `path` → jalur bidang.
- [x] Implementasi murni; akhir selalu `bacaIsi`.

### Task 3: `hitungHarapan` di web
- [x] Pindah logika penjumlahan saham dari `materi.test.tsx` ke `hitungHarapan(contoh)` →
      `{ ok: true; harapan } | { ok: false; galat }`; tes materi web memakai fungsi ini.
- [x] Tambah ekspor `"./contoh"` di `apps/web/package.json`.

### Task 4: `editor/kasus.ts` + `EditorKasus`
- [x] Tes unit `bandingkanHarapan`; tes komponen: ± ahli waris, Hitung mengisi harapan, ubah manual → peringatan,
      kasus tak didukung → galat.
- [x] Implementasi.

### Task 5: `FormKonten`
- [x] Tes komponen: soal kuis (tambah/hapus pilihan, radio benar), ahwal (tambah baris), sakelar Versi Arab,
      mode baca tanpa input yang bisa diubah, galat bidang tampil di bawah bidang.
- [x] Implementasi dengan komponen shadcn; Arab `dir="rtl" lang="ar"`.

### Task 6: `EditorEntri` tab Form / JSON
- [x] Tes: simpan dari form memanggil `buatDraf`/`ubahDraf` dengan isi benar; Form → JSON → Form; JSON rusak →
      tetap di tab JSON + galat; pratinjau tetap jalan; entri baru mendapat slug seperti sebelumnya.
- [x] Implementasi; sesuaikan `editor.test.tsx`, `pratinjau.test.tsx`.

### Task 7: Bersih-bersih
- [x] Hapus `bentuk.ts` + `bentuk.test.ts` bila tak dipakai lagi.
- [x] `pnpm -r test`, typecheck, build admin.
