# Dzawil Arham (bab 14) — Desain

Tanggal: 2026-09-30 · Branch: `dzawil-arham` · Sumber hukum: `docs/kb/14_dzawil_arham.md`, `18_matriks_khilaf.md` (K14-1..3)

## Tujuan

Kasus yang sekarang berhenti di `TIDAK_DIDUKUNG` ("fase 3") — hanya dzawil arham yang tersisa, atau hanya
pasangan + dzawil arham — dihitung sampai tuntas, dengan jejak terstruktur dan narasi templat.

Sukses = semua contoh bab 14 dan kasus 16 #24 lulus sebagai regression, invarian dijaga sebagai assertion,
dan `hitung()` (pipeline) tidak berubah perilakunya.

## Cakupan madzhab (keputusan 2026-09-30, opsi A)

| Ruleset | Perilaku | Rujukan |
|---|---|---|
| [SYF] | tanzil, mewarisi hanya bila `kebijakanSisa = 'radd'` (baitul mal tidak tegak); lk:pr 2:1 kecuali cabang saudara seibu (sama rata) | R14-5, R14-6, R14-8 |
| [HNB] | tanzil, sama rata mutlak → jejak `KHILAF_MADZHAB` K14-3 | K14-3 |
| [MLK] | `kebijakanSisa = 'baitulMal'` → harta ke baitul mal (`TIDAK_DIDUKUNG` K14-1); `'radd'` (imam tidak adil) → mewarisi, tetapi metodenya belum ada di matriks → `TIDAK_DIDUKUNG` K14-2 | K14-1, K14-2 |
| [HNF] | `TIDAK_DIDUKUNG`, refs `['K14-2']` (qarabah = fase berikutnya) | K14-2 |

Bila `kebijakanSisa = 'baitulMal'` pada [SYF] dan hanya ada dzawil arham → `TIDAK_DIDUKUNG` "harta ke baitul mal" refs R14-5.
Kasus pasangan + baitul mal tidak pernah diambil alih (pipeline sudah memberi tujuan `baitulMalTeratur`).

**Gerbang 18.4**: hasil [HNB] memakai token R14-4, R14-7, R14-9..13. Baris KB 18.4 untuk token itu harus diputuskan
pengguna dulu (checkpoint Task 1 plan); tanpa itu gerbang yang ada menolak hasil [HNB] — perilaku benar, bukan bug.

**[HNB] K14-3 di engine** (usulan, dikonfirmasi di checkpoint): di bawah satu perantara, penerima dalam **satu kelompok**
dibagi sama rata; khal + khalah (di bawah perantara ibu) tetap 2:1 (Mughni 6/324); penerima di beberapa kelompok
→ `TIDAK_DIDUKUNG` K14-3 (rinciannya belum ada di KB).

## Arsitektur

Orkestrator di atas pipeline, pola sama dengan `munasakhat.ts`. File baru `packages/engine/src/dzawilArham.ts`:

```ts
export function hitungDzawilArham(input: InputEngine): HasilEngine
```

Tanda tangan **sama persis dengan `hitung`** supaya orkestrator bab 13 (taqdir) dan munasakhat kelak cukup menerima
fungsi hitung sebagai argumen: taqdir → dzawil arham → pipeline, tanpa cabang khusus.

Alur:

1. Panggil `hitung(input)`.
2. Ambil alih hanya bila:
   - `TIDAK_DIDUKUNG` dengan `kode: 'FASE_DZAWIL_ARHAM'` (field baru di varian `TIDAK_DIDUKUNG`, menggantikan
     pencocokan teks alasan di `pipeline.ts:106`), atau
   - `OK` dengan `sisaKeluar.tujuan === 'dzawilArham'` (pasangan saja + dzawil arham).
   Selain itu kembalikan hasil `hitung` apa adanya.
3. Gerbang madzhab (tabel di atas).
4. Tiga tahap tanzil (di bawah), lalu gabung dengan mas'alah zaujiyyah bila ada pasangan.

### Tahap 1 — `cariPerantara` [R14-7] [R14-10]

Untuk tiap orang berperan `DZAWIL_ARHAM` yang hidup: naik satu derajat menyusuri graf (ke orang tua pada jalur
kekerabatannya) sampai posisi itu berperan ahli waris menurut `derivasi` yang ada (dianggap hidup). Keluaran per orang:
`{ perantara, jihah: 'bunuwwah' | 'ubuwwah' | 'umumah', langkah, jalur }`.

- Pengecualian R14-7: khal & khalah → didudukkan sebagai **ibu**; 'ammah & paman seibu → sebagai **ayah**.
- Jihah menurut 14.7 (Lahim hlm. 192–193).
- Lintasan selalu memuat orang tua/anak/saudara pewaris (semuanya ahli waris), jadi "tidak sampai ke perantara" mustahil
  → throw invarian, bukan cabang `TIDAK_DIDUKUNG`.
- Mawani' tetap berlaku bagi dzawil arham sendiri (bab 02): agama belum diisi → `PERLU_INPUT`; beda agama / pembunuh →
  dikeluarkan sebelum tahap 1 (supaya tidak menempati kursi perantara). Aturan diambil dari `mawani.ts` (fungsi bersama).

### Tahap 1b — `saringJihah` [R14-10] [R14-7]

Dalam jihah yang sama, yang **langkahnya paling sedikit** ke ahli waris menghijab yang lain (walau yang lain lebih dekat
ke mayit) → jejak `DZAWIL_ARHAM_TERHIJAB_JIHAH`. Lintas jihah: tidak saling menghijab di tahap ini; hajb antar-perantara
diurus tahap 2.

### Tahap 2 — bagi antar-perantara [R14-9] [R14-10] [R14-13]

Bangun graf virtual berisi para perantara (hidup, satu orang per perantara unik) dan panggil `hitung()` dengan
`kebijakanSisa: 'radd'` dan tirkah nol. Hajb antar-perantara, furudh, 'aul, radd diperoleh dari pipeline yang sudah diuji.
Satu dzawil arham tunggal otomatis mengambil semua (R14-9) lewat jalur ini.

Invarian: ashl mas'alah perantara yang ber-'aul hanya 6 → 7 (R14-13); selain itu throw.

### Tahap 3 — `turunkanBagian` [R14-8] [R14-11]

Bagian tiap perantara diberikan kepada dzawil arham yang bernasab melaluinya **seolah perantara wafat meninggalkan
mereka** (14.5 langkah 4): `hitungDzawilArham` dipanggil **rekursif** dengan perantara sebagai pewaris dan penerimanya sebagai
satu-satunya yang hidup. Hubungan mereka ke perantara diturunkan `derivasi` (anak → ashabah 2:1; ayahnya ibu menghijab
khalah di bawah perantara ibu; cucu lewat perempuan → dzawil arham perantara → rekursi). Hasil tiap perantara digabung
ke mas'alah perantara dengan `gabungkan` (nisab saham vs mas'alah, R12-2), satu perantara per langkah:

- [SYF]: hasil rekursi apa adanya (2:1 lewat ashabah bil ghair); **kecuali** perantara saudara/saudari seibu → penerima
  dalam satu kelompok sama rata (R14-8).
- [HNB]: aturan K14-3 di atas + jejak `KHILAF_MADZHAB`.
- Satu orang lewat dua jalur (R14-11): kedua jalur tidak saling menghijab → dijumlahkan; salah satu menghijab → hanya jalur
  penghijab.

Saham tetap bulat karena tiap penggabungan memakai wafq (seperti jami'ah munasakhat).

### Pasangan [R14-12]

Pasangan mengambil fardh penuh dari makhrajnya sendiri, tanpa hijab dan tanpa 'aul (hasil `hitung()` sudah begitu:
`sisaKeluar`). Mas'alah dzawil arham diperlakukan sebagai mas'alah kedua **munasakhat keadaan 3**: sisa = saham "mayit kedua",
nisab sisa vs mas'alah dzawil arham → inqisam / tawafuq / tabayun. Fungsi `gabungkan` + `periksaInvarian` di `munasakhat.ts`
diangkat ke modul bersama (`packages/engine/src/gabung.ts`), dipakai munasakhat dan dzawil arham — tidak disalin.

## Keluaran

`HasilEngine` varian `OK` biasa: `statusOrang` untuk orang asli (dzawil arham kini `ahliWaris` dengan peran
dzawil arham, atau tetap `bukanAhliWaris` bila terhijab jihah), `tabel` dengan saham per orang asli, `sisaKeluar` hilang
karena sudah terbagi. Hasil `hitung()` virtual disematkan di jejak, bukan di tabel.

Jejak baru (`LangkahJejak`, data, masing-masing dengan refs):

| Jenis | Isi | Refs |
|---|---|---|
| `DZAWIL_ARHAM_TANZIL` | idOrang, perantara, jihah, langkah | R14-7, R14-10 |
| `DZAWIL_ARHAM_TERHIJAB_JIHAH` | idOrang, oleh | R14-7, R14-10 |
| `DZAWIL_ARHAM_MASALAH_PERANTARA` | ringkasan hasil `hitung()` virtual | R14-9, R14-13 |
| `DZAWIL_ARHAM_TURUN` | perantara, tingkat, rasio `'2:1' \| 'samaRata'`, bagian | R14-8 / K14-3 |
| `DZAWIL_ARHAM_DUA_JALUR` | idOrang, jalur dipakai | R14-11 |
| `DZAWIL_ARHAM_GABUNG_PASANGAN` | keadaan nisab, jami'ah | R14-12 |

Narasi: templat `narasi.dzawilArham.*` (id + ar) ditambah lewat `pnpm diksi:tambah`; tidak ada kalimat hardcode
(tes cakupan narasi yang ada harus tetap lulus).

## Galat & invarian

- 'Aul mas'alah perantara > 7 atau ashl ≠ 6 saat 'aul → throw (R14-13).
- Σ saham = jami'ah; semua saham bulat → throw bila dilanggar.
- Graf putus → `TIDAK_DIDUKUNG`. [HNF] → `TIDAK_DIDUKUNG` K14-2.
- Tidak ada aturan di luar KB bab 14; kasus yang tak tercakup → `TIDAK_DIDUKUNG`, bukan dikarang.

## Tes (ditulis sebelum logika)

Regression (fixture, [SYF] kecuali disebut):

| Sumber | Kasus | Hasil |
|---|---|---|
| 16 #24, 14.6 | khalah, 'ammah | 3: 1, 2 |
| 14.6 | anak pr saudara lk kandung / seibu / sebapak | 6: 5, 1, 0 |
| 14.6 | anak pr dari anak pr dari anak pr; anak pr dari bint ibn ibn | semua ke yang kedua |
| 14.6 | ayahnya ibu, anak pr saudari seibu / kandung / sebapak | 6: 1, 1, 3, 1 |
| 14.4 | cicit pr dari anak pr + anak pr saudara lk | masing-masing 1/2 |
| 14.7 | 'ammah kandung, anak lk saudari kandung, anak lk anak pr | 'ammah 1, anak lk anak pr 1, anak lk saudari 0 |
| 14.8 | satu orang dua jalur + cucu saudari sebapak | 5: 4, 1 |
| 14.9 | suami + anak lk anak pr | 2: 1, 1 |
| 14.9 | istri + anak saudari kandung | 4: 1, 3 |
| 14.9 | 4 istri + anak pr saudara | 16: 1×4, 12 |
| K14-3 | kasus 2:1 di atas dijalankan [HNB] | sama rata + `KHILAF_MADZHAB` |
| K14-1/2 | [MLK] → baitul mal; [HNF] → `TIDAK_DIDUKUNG` | |

Unit: `cariPerantara`, `saringJihah`, `turunkanBagian`, `gabung` (setelah diangkat, tes munasakhat tetap lulus).
Property: Σ saham = jami'ah; 'aul mas'alah perantara ≤ 7.

## Di luar cakupan

- Qarabah [HNF] (14.11) — fase berikutnya.
- Munasakhat yang memanggil `hitungDzawilArham` — tindak lanjut (cukup menerima fungsi hitung sebagai argumen).
- Bab 13 (taqdir) — langsung setelah bab 14, membungkus `hitungDzawilArham`.
- UI — sesuai urutan kerja, setelah semua logika selesai.
