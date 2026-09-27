# Portal Admin — Tahap C: Editor Blok (Tiptap) — Desain

Status: disetujui dalam diskusi 2026-09-27. Melanjutkan [tahap B](2026-09-27-portal-admin-form-konten-design.md):
`FORM_KONTEN`, `NilaiForm`, dan tab JSON tetap; yang diganti hanya perender bidang `markdownBlok`, `markdownPotongan`,
dan teks pilihan kuis.

## Latar

Setelah B, isi materi, kasus/penyelesaian tanya jawab, jawaban FAQ, serta pertanyaan/pilihan/pembahasan kuis masih
berupa textarea Markdown terbatas (`**tebal**`, `[[id-istilah]]`, `[R04-2]`, blok ```` ```kasus ````). Penulis harus
hafal sintaks, dan salah ketik baru ketahuan saat simpan.

## Keputusan

| Hal | Keputusan |
|---|---|
| Editor | Tiptap v3 (rich text), khusus `apps/admin` |
| Cakupan | Bidang blok (`markdownBlok`) **dan** bidang potongan (`markdownPotongan`, teks tiap pilihan kuis) |
| Mode potongan | Satu paragraf; hanya tebal, miring, istilah, rujukan; Enter tidak membuat paragraf baru |
| Istilah | Node sebaris atom `istilah {id, teks}`, dipilih dari daftar istilah yang sama dengan dropdown B (`opsi.istilah`) |
| Rujukan | Node sebaris atom `rujukan {kode}`, dipilih dari `repo.konten.daftarRefs()` (DB); tidak ada input bebas |
| Blok khusus | `kasus`, `video`, `kuis` = kartu atom; tombol Ubah membuka dialog (kasus memakai `EditorKasus` dari B) |
| Tabel | Ekstensi tabel Tiptap, disunting langsung; baris pertama = kepala |
| Mode sumber | Tombol "Markdown" per bidang: beralih ke textarea Markdown lama (tulisBlok/bacaBlok) |
| Penyimpanan | Tidak berubah: nilai bidang di `NilaiForm` tetap string Markdown, isi tetap `Blok[]`/`Potongan[]` |

## Bukan tujuan

- Mengubah skema `Blok`/`Potongan` (mis. tebal+miring bertumpuk, daftar bersarang, tautan bebas).
- Mengubah web, database, atau repo.
- Kolaborasi waktu nyata.

## Arsitektur

- `apps/admin/src/editor/dokumen.ts` (murni): `keDokumen(Blok[]) → JSONContent`, `dariDokumen(JSONContent) → Blok[]`,
  `kePotonganDokumen`/`dariPotonganDokumen` untuk mode potongan. Hukum: `dariDokumen(keDokumen(b)) = b` untuk
  semua `Blok` yang sah. Yang tidak terwakili skema `Blok` dipipihkan secara tetap (tidak dibuang diam-diam):
  - tebal + miring pada teks yang sama → tebal;
  - daftar bersarang → butirnya disambung sebagai butir berikutnya;
  - catatan/sel tabel berisi beberapa paragraf → disambung dengan spasi (sama seperti `bacaBlok`);
  - paragraf kosong → dilewati (sama seperti baris kosong di Markdown).
- `apps/admin/src/editor/ekstensi.ts`: node Tiptap `istilah`, `rujukan` (sebaris, atom) dan `blokKhusus`
  (blok, atom, attr `blok: Blok`), plus daftar ekstensi untuk mode blok dan mode potongan. StarterKit dibatasi:
  judul tingkat 2–3; tanpa code, codeBlock, strike, underline, link, horizontalRule, hardBreak.
- `apps/admin/src/layar/EditorBlok.tsx`: satu komponen untuk kedua mode. Props: nilai Markdown, `saatUbah`, mode,
  slug, `arab`, `bacaSaja`, label, daftar istilah. Tiap perubahan: dokumen → `dariDokumen` → `tulisBlok` → `saatUbah`.
  Nilai dari luar (tab JSON → Form) yang berbeda dari yang terakhir dipancarkan memuat ulang dokumen.
  Markdown awal yang gagal dibaca `bacaBlok` → editor langsung terbuka di mode Markdown dengan galatnya.
- `apps/admin/src/layar/DialogBlok.tsx`: dialog kasus / video / kuis, dan pemilih istilah / rujukan (cari + daftar).
- `FormKonten`: bidang `markdownBlok`/`markdownPotongan` dan teks pilihan kuis memakai `EditorBlok`.
  `nilaiForm.ts` tidak berubah.

## Toolbar

Mode blok: Tebal, Miring, Judul 2, Judul 3, Daftar, Daftar bernomor, Catatan, Tabel (sisip / tambah baris / tambah
kolom / hapus tabel), Istilah, Rujukan, Sisip blok (Kasus, Video, Kuis), Markdown.
Mode potongan: Tebal, Miring, Istilah, Rujukan, Markdown. Semua tombol berikon lucide + label (aria/tooltip), tanpa emoji.
Mode baca: tanpa toolbar, `editable = false`; tombol Markdown tetap ada (hanya lihat).

## Blok khusus

- Kasus: kartu menampilkan pewaris, ringkasan ahli waris, harta; dialog = `EditorKasus` (termasuk "Hitung dengan engine").
- Video: dialog tautan YouTube + judul; dibaca dengan `bacaBlok` (```` ```video ````) supaya aturan tautan satu sumber.
- Kuis: dialog kode soal dipisah koma.
- Sisip blok baru membuka dialog dulu; batal = tidak ada yang disisipkan.

## Tes

- `dokumen.test.ts`: bolak-balik semua jenis blok & potongan (termasuk kasus bigint, tabel, istilah dengan teks lain),
  pemipihan yang disebut di atas, dokumen kosong → `[]`.
- `editorBlok.test.tsx`: render nilai awal (chip istilah/rujukan, kartu kasus), mode Markdown bolak-balik,
  Markdown rusak → mode Markdown + galat, mode baca tanpa toolbar, sisip video lewat dialog.
- Tes B yang mengetik ke bidang Markdown beralih ke mode Markdown dulu.
