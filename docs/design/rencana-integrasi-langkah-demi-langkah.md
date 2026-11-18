# Rencana integrasi: Langkah demi langkah (Teks | Sinema)

Acuan desain: `docs/design/mockup-langkah-demi-langkah.html` (disetujui pemilik 2026-11-18) dan riset `riset-ux-hasil-2026-11-17.md` bagian 26–30.
Tujuan: mengganti modal "Pelajari langkah perhitungan" (`KartuLangkah` + `FokusLangkah`) dengan mode fokus dua tampilan dari satu sumber data.
Engine dan aturan fikih **tidak** berubah.

## 1. Prinsip

1. **Tidak ada angka atau narasi yang ditulis tangan per kasus.** Mockup menulis data per kasus; aplikasi menurunkannya dari `HasilOk` (tabel + `jejak`) dan graf. Semua kalimat lewat templat diksi `narasi.*` (kamus diberikan lewat argumen), kalimat baru ditambah dengan `pnpm diksi:tambah`.
2. **Satu sumber data.** Fungsi murni baru di `packages/explain` menghasilkan *linimasa*; tampilan Teks, Sinema, dan rekaman memakai linimasa yang sama.
3. **Ketertelusuran.** Tiap langkah membawa `refs` dari jejak engine, supaya Teks bisa menampilkan dalil dan reviewer syariah bisa mencocokkan.
4. Bila jejak tidak cukup untuk menurunkan sebuah adegan, adegan itu dilewati (tidak dikarang).

## 2. Bentuk data (packages/explain)

```ts
// packages/explain/src/linimasa.ts
export type BagianLangkah = 'tanya' | 'dasar' | 'keluarga' | 'logika' | 'hitung' | 'jembatan';
export type Visual =
  | { jenis: 'harta'; baris: { label: Potongan[]; nilai: bigint; akhir?: boolean }[] }
  | { jenis: 'pohon'; sorot: Record<IdOrang, PeranSorot> }
  | { jenis: 'dasar'; refs: string[] }
  | { jenis: 'tabel'; isi: KodeSel[] }                 // 'kolom:idOrang'
  | { jenis: 'kotak'; jumlah: number; potong: number; bingkai?: number; isi: IsiKotak[]; sorot?: IdOrang | string }
  | { jenis: 'meja'; dunia: DuniaTaqdir[]; sorot?: 'terkecil' };
export interface Langkah { bagian: BagianLangkah; narasi: BarisPenjelasan; papan: BarisPenjelasan; visual?: Visual; refs: string[] }
export interface Tahap { id: IdTahap; judul: BarisPenjelasan; langkah: Langkah[] }
export interface Linimasa { tahap: Tahap[]; tabel: KolomTabel[] }
export function susunLinimasa(hasil: HasilOk, graf: GrafKeluarga, opsi: { kamus: Kamus }): Linimasa;
```

`narasi` dan `papan` tetap `BarisPenjelasan` (potongan berjenis: teks, sebutan orang, istilah bertooltip), jadi popover istilah dan nama orang ikut gratis. Angka ditulis sebagai angka; pembaca suara mengucapkannya.

## 3. Pemetaan tahap → sumber engine

| Tahap (mockup) | Sumber | Visual |
|---|---|---|
| Harta yang dibagi | jejak `TIRKAH` | harta |
| Siapa mewarisi | `MANI`, `HAJB_HIRMAN` (+ `dataPeranDari` di web) | pohon |
| Bagian awal | `FARDH`, `ASHABAH`, `HAJB_NUQSHAN` | tabel kolom fardh |
| Asal masalah | `PERBANDINGAN_NISAB`, `KELAS_MASALAH`, tabel ashl | kotak `jumlah = ashl` |
| 'Aul / radd | `AUL`, `RADD`, `SISA_KELUAR` | kotak dengan `bingkai` (lebih / kosong) |
| Tashih | `TASHIH` (+ nisab kepala) | kotak `potong = pengali` |
| Rupiah | `DISTRIBUSI` + pembulatan | kotak + tabel kolom rupiah |
| Munasakhat | `MUNASAKHAT`, `jelaskanMunasakhat` | tahap per mayit + "menyambung bagian" (kotak `potong` = pengali jami'ah) |
| Hamil / hilang | `TAQDIR_DUNIA`, `TAQDIR_LEBUR`, `TAQDIR_PEMBERIAN`, `MAUQUF`, `jelaskanTaqdir` | meja; satu dunia contoh dihitung lengkap |
| Meninggal bersamaan | `jelaskanGharqa` | tahap per harta + digabung |
| Dzawil arham | `DZAWIL_ARHAM_*` | **fase berikut**: tetap memakai bab penjelasan lama sampai templatnya dirancang |

Aturan kotak wakil (riset 29e): `jumlah` = ashl bila ≤ 24, selebihnya kotak dasar terkecil yang masuk akal, dan pengali menjadi `potong` (dibelah garis bila ≤ 12, label "tiap kotak = n potong" bila lebih).

Langkah `tanya`, `logika`, dan `jembatan` adalah templat diksi per jenis tahap (bukan per kasus), diisi angka dari jejak. Contoh: `narasi.logika.tashih.potongUlang` = "Supaya adil, setiap kotak dipotong {pengali} …".

## 4. Komponen web (apps/web/src/hasil)

| Berkas | Isi |
|---|---|
| `LangkahDemiLangkah.tsx` | Lapisan penuh: kepala (Tahap/Langkah, Teks \| Sinema, Lainnya, tutup), badan, bar bawah B. Menyimpan posisi `{tahap, langkah}` dan tampilan (localStorage, dibungkus try/catch). |
| `TampilanTeks.tsx` | Kartu tahap dikelompokkan per bagian; pohon + tabel di samping; "Tampilkan semua langkah". |
| `TampilanSinema.tsx` | Panggung satu adegan + takarir; putar otomatis mengikuti `speechSynthesis` (id-ID); bar memudar 3 detik. |
| `KotakHarta.tsx`, `MejaTaqdir.tsx` | Visual kotak dan meja (dipakai kedua tampilan). |
| `TabelLangkah.tsx` | Tabel gaya layar Hasil (kepala gelap berangka, warna orang, baris terhalang diarsir, sel gabungan). Menggantikan pemakaian `TabelFaraidh` di mode fokus saja. |
| `terbangAngka.ts` | Angka terbang dari keterangan kotak/rumus ke sel (Web Animations API, hormati `prefers-reduced-motion`). |
| `rekamVideo.ts` | Region Capture (`CropTarget`) + `MediaRecorder`, berhenti sendiri di akhir, unduh `.webm`. |

Dibuang setelah pengganti stabil: `FokusLangkah.tsx`, bagian mode fokus di `KartuLangkah.tsx`, `ketukan.ts`/`peraga.ts` bila tidak dipakai lagi. Kartu "Langkah demi langkah" di panel "Pelajari cara menghitungnya" tetap; subjudul → "Dari 1 sampai selesai · teks atau sinema bersuara".

Warna orang: satu peta warna per orang dipakai pohon, kotak, tabel, dan meja (sekarang tersebar di `sorot.tsx` dan `AvatarOrang.tsx`; disatukan di satu modul).

## 5. Urutan kerja (tiap butir = satu PR kecil)

1. **explain: `susunLinimasa` untuk kasus biasa** (harta, siapa mewarisi, bagian awal, asal, tashih, rupiah) + templat diksi + unit test terhadap kasus bab 16. Property test: jumlah isi kotak = ashl × potong; sel tabel yang diisi = baris tabel engine.
2. **'aul dan radd** (bingkai lebih/kosong, radd dengan pasangan).
3. **web: `LangkahDemiLangkah` tampilan Teks + `TabelLangkah` + angka terbang**, menggantikan modal lama di balik kartu yang sama.
4. **Sinema**: panggung, takarir, suara, bar B, menu Lainnya.
5. **Munasakhat** (linimasa + adegan menyambung bagian).
6. **Taqdir dan gharqa** (meja, dunia contoh, dua harta).
7. **Rekam video** (Region Capture, berhenti otomatis).
8. Bersih-bersih komponen lama; uji di HP dan laptop; dzawil arham menyusul.

## 6. Pengujian

- Unit test `susunLinimasa` per tahap memakai kasus bab 16 (termasuk 'aul, radd, munasakhat, taqdir, gharqa). Angka di visual harus sama dengan tabel engine.
- Snapshot diksi untuk templat baru.
- Uji komponen: maju/mundur, pindah tampilan menjaga posisi, "Tampilkan semua", bar memudar hanya di sinema.
- Uji manual browser: 375 px dan laptop; Chrome/Edge untuk suara dan rekaman.

## 7. Terbuka

- Suara `speechSynthesis` id-ID berbeda per perangkat; bila suara Indonesia tidak ada, sinema tetap jalan dengan takarir dan durasi baca.
- Rantai panjang (12 generasi): babak berpola sama diringkas, seperti mockup-mode-fokus.html.
- Bahasa Arab (`bahasa: 'ar'`): linimasa mengikuti kamus; tata letak RTL perlu dicek di fase 3.
