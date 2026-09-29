# Narasi explain sebagai templat diksi — desain

Tanggal: 2026-09-29 · Langkah 2 urutan kerja engine (setelah multi-madzhab waris dasar).

## Tujuan
Kalimat narasi `packages/explain` (kini hardcode, ±1.400 baris) pindah ke tabel `diksi` yang sudah ada, sehingga:
- diksinya sama dengan teks UI dan bisa diedit admin lewat portal (alur revisi/review yang ada) tanpa deploy;
- satu set kunci melayani Indonesia (`id_teks`) dan Arab (`ar_teks`);
- narasi bab 13/14 berikutnya langsung ditulis sebagai templat.

Kriteria berhasil: keluaran narasi semua kasus bab 16 × semua mode identik dengan sebelum migrasi.

## Keputusan (disetujui pengguna 2026-09-29)
1. **Varian tata bahasa Arab = kunci terpisah** (`….mufrad`, `….mutsanna`, `….jamak`, dst.). Explain yang memilih
   kunci; admin melihat kolom teks biasa, tanpa sintaks ICU.
2. **Potongan non-teks = sisipan `{nama}`** (istilah bertooltip, sebutan orang, rupiah, pecahan). Explain mengisi
   sisipan dengan `Potongan`; editor admin menampilkan sisipan sebagai chip terkunci.
3. **Sumber tunggal = DB → `snapshot.json`**, jalur yang sama dengan `t()`. Tidak ada templat bawaan kedua di repo.

## Arsitektur
```ts
// packages/explain
export type Kamus = (kunci: string) => { id: string; ar?: string } | undefined;
jelaskan(hasil, graf, { gaya?: 'cerita' | 'ringkas'; bahasa?: 'id' | 'ar'; kamus: Kamus })
```
- Mode lama `arab` = `gaya: 'ringkas', bahasa: 'ar'`; `arab.ts` dilebur ke templat ringkas. Kunci tanpa `ar_teks`
  → fallback Indonesia (aturan sama dengan `t()`). Angka Arab tetap diterapkan explain saat `bahasa: 'ar'`.
- Helper `susun(kamus, bahasa, kunci, sisipan)` menggantikan `kalimat\`…\``: parse `{nama}`, sisipkan `Potongan`,
  gabung teks bersebelahan. Kunci tidak ada, sisipan di templat tidak disediakan, atau sisipan disediakan tapi tidak
  dipakai → `throw` (tidak diam-diam).
- Logika pemilihan kalimat (kondisi, varian, `gabungDan`, kapitalisasi, penomoran langkah) tetap di kode explain;
  hanya kalimat yang pindah.
- `LABEL_ARAB`, `NAMA_FARDH`, penghubung daftar ("dan", "atau", "و") juga menjadi diksi.
- Explain tetap murni dan tidak mengimpor `@waris/data`; web membangun `kamus` dari `cariDiksi`.

## Penamaan kunci
`narasi.<gaya>.<bab>.<kalimat>[.<varian>]`, contoh `narasi.cerita.harta.hutang`, `narasi.ringkas.furudh.fardh.mutsanna`.
Kata bersama lintas gaya: `narasi.umum.*` (label ahli waris, nama fardh, penghubung). Halaman diksi: `narasi`.
Pola kunci wajib cocok dengan check constraint `diksi.kunci`.

## Migrasi teks
Urutan per file: `cerita.ts` → `ringkas.ts` → `arab.ts` → `munasakhat.ts` (plus `nisab.ts`, `people.ts`, `terms.ts`
bila memuat kalimat). Teks dimasukkan ke seed diksi dan `snapshot.json`. Kalimat Arab dari `arab.ts` menjadi `ar_teks`
kunci ringkas yang sepadan; yang tanpa padanan mendapat `id_teks` terjemahan. Redaksi Arab tetap draf (`PERLU_CEK_ARAB`).
**Tidak ada perubahan redaksi** di langkah ini.

## Pengujian
1. **Snapshot keluaran (dibuat sebelum migrasi):** `keTeksBiasa` + `refs` + `subjek` + `penekanan` per baris, untuk
   semua kasus bab 16 × {cerita, ringkas, arab}, dibekukan. Setiap file yang dimigrasi harus menghasilkan output identik.
2. **Cakupan:** semua kunci `narasi.*` yang dipakai kode ada di snapshot; sisipan templat cocok dengan yang disediakan
   kode (dua arah). Perluas tes cakupan diksi web yang ada.
3. Tes explain yang ada tetap hijau dengan kamus dari `snapshot.json`.

## Web & admin
- Web: `jelaskan(…, { gaya, bahasa: bacaBahasa(), kamus })`; pilihan mode `arab` jadi gaya ringkas + bahasa Arab.
- Admin: tidak ada perubahan kode di luar yang dibutuhkan agar halaman `narasi` tampil dan sisipan tampil sebagai chip.

## Di luar cakupan
Narasi bab 13/14 (langkah 3), perbaikan redaksi, tabel baru.
