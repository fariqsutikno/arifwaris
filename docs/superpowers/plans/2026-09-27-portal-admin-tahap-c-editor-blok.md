# Portal Admin Tahap C — Editor Blok (Tiptap) Implementation Plan

**Goal:** Bidang blok dan potongan disunting sebagai rich text (Tiptap) dengan sisipan istilah, rujukan, dan blok
khusus lewat dialog, tanpa mengubah bentuk isi yang disimpan.

**Architecture:** Konversi murni `Blok[] ↔ dokumen Tiptap` di `editor/dokumen.ts`, node kustom di
`editor/ekstensi.ts`, satu komponen `EditorBlok` yang tetap memancarkan Markdown ke `NilaiForm`.

**Spec:** `docs/superpowers/specs/2026-09-27-portal-admin-editor-blok-design.md`

## Global Constraints

- Isi tersimpan identik dengan tahap B (tes bolak-balik); web dan database tidak tersentuh.
- `nilaiForm.ts` dan `FORM_KONTEN` tidak berubah kecuali teks bantuan.
- Rujukan hanya dari `daftar_refs`; istilah hanya dari daftar istilah yang ada.
- Tanpa emoji; ikon lucide dengan label.

## Review Focus

1. Bolak-balik `dariDokumen(keDokumen(b)) = b` untuk semua jenis blok → Task 1.
2. Pemuatan ulang dari luar tidak boleh menimpa ketikan (bandingkan dengan nilai terakhir dipancarkan) → Task 3.
3. Markdown awal rusak tidak boleh hilang: buka di mode Markdown → Task 3.

## Struktur berkas

| Berkas | Tanggung jawab |
|---|---|
| `apps/admin/src/editor/dokumen.ts` | Konversi murni Blok/Potongan ↔ JSONContent |
| `apps/admin/src/editor/ekstensi.ts` | Node istilah, rujukan, blokKhusus; daftar ekstensi per mode |
| `apps/admin/src/components/ui/dialog.tsx` | Dialog shadcn |
| `apps/admin/src/layar/DialogBlok.tsx` | Dialog kasus/video/kuis, pemilih istilah/rujukan |
| `apps/admin/src/layar/EditorBlok.tsx` | Editor + toolbar + mode Markdown |
| `apps/admin/src/layar/FormKonten.tsx` | Memakai EditorBlok |

### Task 1: `dokumen.ts` + tes bolak-balik
### Task 2: `ekstensi.ts` + dialog shadcn
### Task 3: `EditorBlok` + `DialogBlok` + tes
### Task 4: Sambungkan ke `FormKonten`, sesuaikan tes B
### Task 5: Typecheck, seluruh tes admin, build
