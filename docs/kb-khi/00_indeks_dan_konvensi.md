# KB KHI: indeks dan konvensi

> **Hukum positif, bukan fikih.** Folder ini adalah ruleset terpisah (bukan overlay madzhab). Semua isi ditandai "hukum positif" di jejak, narasi, dan UI.
> Sumber hukum fikih tetap `docs/kb/00–18`. Folder ini hanya mencatat ketentuan KHI dan praktik Pengadilan Agama, lalu membandingkannya dengan fikih.

## Isi
| Berkas | Isi |
|---|---|
| `00_teks_khi_terverifikasi.md` | salinan lurus teks KHI (Pasal 85–97, 170–214, Penjelasan) |
| `00_temuan_awal.md` | catatan kerja: daftar titik beda KHI ↔ [SYF] (bahan matriks) |
| `01_riset_fikih_pembanding.md` | riset Shamela: syirkah, hibah, harta pasangan |
| `02_daftar_sumber.md` | kode sumber (S01…, F01…), sha256, peta klaim → sumber |
| `10_ahli_waris_pengganti.md` | Pasal 185 dan praktik PA |
| `11_wasiat_wajibah.md` | Pasal 209 dan perluasan praktik PA |
| `20_matriks_beda_fikih.md` | per butir: KHI, praktik PA, fikih, jalan keluar, sumber |
| (menyusul) `12_harta_bersama.md`, butir lain | Task 1 lanjutan dan Task 5 |

## Dua lapis
1. **Bunyi KHI** (S01–S04): teks pasal, token `KHI-<pasal>-<ayat atau huruf>`; contoh `KHI-185-2`.
2. **Praktik PA**: pedoman, SEMA, yurisprudensi yang dipakai hakim. Token:
   - `PA-PED-<halaman cetak>-<butir>` (Pedoman Buku II 2010, S05); contoh `PA-PED-168-8d`.
   - `PA-SEMA-<nomor>-<tahun>-<butir>` (S07); contoh `PA-SEMA-3-2015-9`.
   - `PA-Y<nomor>` (yurisprudensi, S06); contoh `PA-Y1`, `PA-Y2`, dengan nomor putusan di teks.
Lapis praktik PA dapat dimatikan pengguna. Bila pedoman dan SEMA bertentangan, **SEMA yang lebih baru dipakai**, pedoman jadi catatan (keputusan pemilik 2026-11-23).

## Status tiap klaim
- `teks`: dikutip langsung dari pasal/pedoman/SEMA.
- `tafsir`: penafsiran penulis sekunder (mis. makalah Djafar, S09): **bukan dasar aturan engine**, hanya penjelas.
- `titik keputusan`: sumber tidak menentukan; **tidak boleh jadi default tanpa keputusan pemilik** (aturan CLAUDE.md: jangan mengarang).
- `KB kosong`: tidak ada padanan fikih di `docs/kb`; callout menyebut "sedang disiapkan", tanpa angka.

## Aturan rujukan
Setiap klaim memakai `[kode sumber + lokasi]` dari `02_daftar_sumber.md`. Padanan fikih memakai kode KB (`R06-3`, `K07-1`, dst.). Teks yang dikutip dari bahan tempelan pemilik (bukan berkas PDF) diberi tanda `(teks tempel)`.

## Kebijakan KHI diam
Bila KHI dan praktik PA tidak mengatur suatu titik, hitungan ikut **madzhab pilihan pengguna** dengan catatan tampak: "KHI tidak mengatur; hakim merujuk fikih". Dasar: Penjelasan Umum KHI butir 3–4 (rujukan 13 kitab madzhab Syafi'i, diperluas ke madzhab lain) [S01 Penjelasan Umum].
