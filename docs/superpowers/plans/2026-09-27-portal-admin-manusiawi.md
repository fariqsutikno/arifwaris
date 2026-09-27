# Portal admin yang manusiawi — rencana

Tujuan: portal bisa dipakai tim keilmuan tanpa tahu kode teknis (kode rujukan `Rxx-y`, kunci teks, JSON).
Keputusan pengguna 2026-09-27: kode rujukan tidak ditampilkan; pembahasan kuis dipecah jadi bidang, penyelesaian
tanya jawab pakai templat; rujukan perlu verifikasi boleh dipilih dengan peringatan; teks aplikasi disunting langsung
di tampilan layar web.

## Fase 1 — Rujukan tanpa kode
- `editor/rujukan.ts`: gabung `daftar_refs` dengan `RUJUKAN` (@waris/content) → opsi {kode, klaim, bab, jenis, peringatan};
  cari lewat kata biasa (klaim, judul bab, sumber), kode tetap cocok diam-diam.
- `PemilihRujukan` satu komponen: daftar per bab, klaim + jenis dalil + peringatan; dipakai panel Info, dialog
  "Sisip rujukan", bidang rujukan Syahid.
- Chip terpilih & node rujukan Tiptap menampilkan klaim, bukan kode.

## Fase 2 — Form yang memandu
- Tab: Bahasa Indonesia / Bahasa Arab / Kode mentah (admin). Label teknis diganti.
- `*` untuk bidang wajib; `petunjuk`, `contoh`, `tampilDi` per bidang; kotak "Standar konten yang baik" per jenis
  (draf dari `docs/panduan-tim-keilmuan.md`).
- Validasi saat blur + daftar Kelengkapan di panel Info. Tautan "Batalkan perubahan".

## Fase 3 — Perbandingan per bidang
- Ganti diff JSON dengan perbandingan per bidang (label form, sorot per kata, rujukan +/−) di Riwayat & Antrean review.

## Fase 4 — Daftar konten tenang
- Satu bilah: Cari · Saring ▾ · Urutkan ▾, chip saring aktif; mode "Pilih beberapa" untuk aksi massal.

## Fase 5 — Teks aplikasi & pratinjau
- Teks aplikasi: layar web asli per kelompok, teks bisa diklik & disunting di tempat.
- Pratinjau di panel samping untuk semua jenis (hitung, kuis, dst. saat ini belum muncul).

## Fase 6 — Kuis & tanya jawab terstruktur
- Pilihan jawaban A/B/C/D dengan tanda "Jawaban benar"; pembahasan kuis jadi bidang terpisah (skema + web);
  penyelesaian tanya jawab diberi templat.
