# Format kiriman soal

Satu paket = satu berkas Markdown di `konten/soal/modul-NN/<nama-paket>.md`, berisi kepala berkas lalu blok `soal`.
Berkas dibaca parser pemeriksa (`packages/content/src/paketSoal.ts`), jadi sintaksnya **ketat**. Blok `soal`
memakai sintaks yang sama dengan blok `soal` di materi (`docs/materi-kit/format-materi.md` bagian 4), ditambah
beberapa isian untuk pemeriksa. Setelah menulis, jalankan:

```bash
pnpm soal:cek konten/soal/modul-05/hajb-dasar.md
```

Pemeriksa melaporkan sintaks yang salah, kode rujukan yang tidak ada di KB, istilah yang tidak ada di glosarium,
tautan pelajaran yang tidak ada, kode soal ganda, topik yang tidak dihasilkan engine, dan **saham yang tidak sama
dengan engine**.

## 1. Kepala berkas (wajib)

```markdown
---
paket: hajb-dasar
modul: 5
sumber: 06: 6.1-6.6; 04: 4.11; 05: 5.2
---
```

| Kunci | Isi |
|---|---|
| `paket` | Nama paket: huruf kecil, tanda hubung, **sama dengan nama berkas** tanpa `.md`. Menjadi `sumber` soal di bank: `paket:<nama>`. |
| `modul` | Angka 1 sampai 15, sesuai kerangka kurikulum. |
| `sumber` | Bab dan subbab KB yang dipakai (`bab: subbab`), bebas dipisah titik koma. |

Setelah kepala hanya boleh ada blok ` ```soal ` dan baris kosong. Tidak ada judul, paragraf, atau blok lain.

## 2. Blok soal

````markdown
```soal
kode: P-05-001
tingkat: dasar
topik: hajb:SAUDARA_KANDUNG
tanya: Seorang laki-laki wafat dan meninggalkan ayah, ibu, dan dua saudara kandung. Berapa bagian ibu?
- 1/3 | Belum tepat. Dua saudara itu memang gugur oleh ayah, tetapi tetap dihitung ([[>5-1-hajb#6]]).
* 1/6 | Tepat. Dua saudara menurunkan ibu dari 1/3 ke 1/6 walaupun mereka sendiri tidak mendapat bagian.
- Tidak mendapat bagian | Belum tepat. Ibu termasuk enam ahli waris yang tidak pernah gugur ([[>5-1-hajb#3]]).
pembahasan: Ahli waris yang gugur karena ada ahli waris lain tetap dapat mengurangi bagian orang lain.
rujukan: R06-6, R04-4
pewaris: L
ahli waris: AYAH, IBU, 2 SAUDARA_KANDUNG
harapan: IBU 1, AYAH 5; ashl 6
```
````

| Kunci | Wajib | Isi |
|---|---|---|
| `kode` | ya | `P-<modul 2 angka>-<nomor 3 angka>`, mis. `P-05-001`. Unik di seluruh `konten/soal`; angka modul sama dengan `modul` di kepala. Berbeda dari kode soal materi `K-...` dan kode generator `G...`. Nomor tidak dipakai ulang walau soalnya dihapus. |
| `tingkat` | ya | `dasar`, `menengah`, atau `sulit` (`konsep-soal.md` bagian 3). |
| `topik` | ya | Satu sampai tiga token label dipisah koma (bagian 5). |
| `tanya` | ya | Kalimat soal. |
| `- pilihan \| alasan` | ya | Pilihan salah dan alasannya. `* pilihan \| alasan` = satu-satunya pilihan benar. 3 sampai 4 pilihan, letak jawaban benar diacak antarsoal. |
| `pembahasan` | ya | Mengapa jawaban benar itu benar. |
| `rujukan` | ya | Kode rujukan KB dipisah koma (minimal satu; contoh `R06-6, R04-4`), dari tabel "Dasar dan Rujukan". |
| `pewaris`, `ahli waris`, `harapan` | bila ada angka | Kasus untuk verifikasi (bagian 3). |
| `kode-bank` | pilihan | Kode soal bank sebagai ganti `pewaris` + `ahli waris` (bagian 3). |
| `tanpa-kasus` | pilihan | Alasan bila soal memuat angka yang bukan saham waris (bagian 3). |

Teks sebaris di `tanya`, pilihan, alasan, dan pembahasan mengikuti `format-materi.md` bagian 3: `**tebal**`,
`*miring*`, `[[istilah]]` dari glosarium, dan tautan ke pelajaran `[[>slug]]` atau `[[>slug#4b]]`. **Tidak boleh**:
`[[#4b]]` (paket tidak punya bagian sendiri), tautan web, HTML, emoji, kode `[R06-2]` di teks, tanda pisah panjang.
Kode rujukan hanya di baris `rujukan`.

## 3. Kasus untuk verifikasi angka

Soal yang menyebut bagian, saham, atau penyebut **wajib** punya kasus. Dua cara:

**a. Menulis susunan sendiri** (satu mayit):

```
pewaris: P
ahli waris: SUAMI, 2 SAUDARI_KANDUNG
harapan: SUAMI 3, SAUDARI_KANDUNG 4; ashl 7
```

`ahli waris` memakai kunci yang sama dengan blok `kasus` materi (`format-materi.md` bagian 4; jumlah di depan
kunci: `2 ANAK_PR`). `harapan` = saham akhir per kunci yang lebih dari nol, lalu `; ashl N` dengan N penyebut
akhir (sesudah 'aul, radd, atau tashih). Ahli waris yang gugur tidak ditulis di `harapan`. Susunan harus sah
menurut checklist bank soal (misalnya istri paling banyak 4, ayah satu).

**b. Memakai kode bank** (`kode-bank: G1-B-...`): kode soal generator yang dipilih dari bank, untuk soal yang
ingin membahas kasus yang sama dengan soal hitung. Boleh bersama `harapan` untuk kasus satu mayit. Kode bank
**lanjutan** (munasakhat, gharqa, mafqud, khuntsa, haml, dzawil arham) dicek labelnya saja: tulis tanpa
`harapan` dan jangan menaruh angka pecahan di soalnya (saham keluarga ini belum dicek mesin).

Satu soal satu kasus. Kalau soal ingin membandingkan dua keadaan, pecah menjadi dua soal.

**Angka yang bukan saham waris** (batas wasiat 1/3, bagian hutang, dan sejenisnya) tidak punya kasus engine. Tulis
`tanpa-kasus: <alasan singkat>`. Pemeriksa menampilkannya sebagai peringatan untuk peninjau; jangan memakainya
untuk menghindari verifikasi saham.

Pemeriksa memastikan: kasus sah dan bisa dihitung engine; setiap token `topik` yang berasal dari label bank
(bukan `konsep:`) memang dihasilkan engine untuk kasus itu; `harapan` sama dengan engine (bila tidak sama, pesan
galat memuat angka engine).

## 4. Soal tanpa angka

Soal yang murni tentang siapa gugur, urutan, atau kaidah tidak menyebut pecahan atau saham, jadi tidak wajib
kasus. Tetap disarankan memberi kasus dan `harapan` kalau susunannya satu mayit, karena itu memverifikasi topik
dan memastikan jawaban "gugur" benar menurut engine (ahli waris yang gugur tidak muncul di `harapan`).

## 5. Token topik

Token bentuk dan arti ada di `ARTI_TOKEN_LABEL` (`packages/latihan/src/bank/labelSoal.ts`). Yang paling sering dipakai
penulis soal:

| Token | Dipakai untuk |
|---|---|
| `hajb:<KUNCI>` | ahli waris berjenis KUNCI gugur (mis. `hajb:SAUDARA_SEIBU`, `hajb:CUCU_PR`) |
| `aul`, `aul:<dari>><menjadi>` | 'aul, mis. `aul:6>7`, `aul:12>13`, `aul:24>27` |
| `radd` | harta bersisa dikembalikan |
| `tashih`, `inkisar:<n>` | koreksi saham; jumlah kelompok inkisar |
| `ashabahBilGhair`, `ashabahMaalGhair` | dua jenis ashabah karena yang lain |
| `kakekSaudara` | kakek bersama saudara kandung atau sebapak |
| `bernama:umariyyatain`, `bernama:musyarrakah`, `bernama:akdariyyah`, `bernama:muaddah` | kasus bernama |
| `munasakhat`, `munasakhat:<n>`, `keadaan:<1\|2\|3>`, `ikhtishar` | munasakhat |
| `gharqa`, `gharqa:<keadaan>`, `mayit:<n>` | wafat bersamaan |
| `mafqud`, `khuntsa`, `haml`, `mauquf`, `kelasD`, `dunia:<n>`, `sasaran:<KUNCI>` | ketidakpastian |
| `dzawilArham`, `tanzil:<KUNCI>`, `dzawilArham:pasangan`, `dzawilArham:duaJalur` | dzawil arham |
| `konsep:<kata>` | pokok bahasan tanpa token engine (tirkah, penghalang waris, nuqshan, takharuj, ...) |

Token bentuk lain ditolak. `bernama:minbariyyah` belum ada (engine belum menandainya); soal Minbariyyah memakai
`aul:24>27`. Butuh token yang belum ada: tulis di `LAPORAN.md`, jangan membuat sendiri.

## 6. Kunci ahli waris

Sama dengan `format-materi.md` bagian 4: `ANAK_LK`, `ANAK_PR`, `CUCU_LK`, `CUCU_PR`, `AYAH`, `IBU`, `KAKEK`,
`NENEK_DARI_IBU`, `NENEK_DARI_AYAH`, `SUAMI`, `ISTRI`, `SAUDARA_KANDUNG`, `SAUDARI_KANDUNG`, `SAUDARA_SEBAPAK`,
`SAUDARI_SEBAPAK`, `SAUDARA_SEIBU`, `SAUDARI_SEIBU`, `KEPONAKAN_KANDUNG`, `KEPONAKAN_SEBAPAK`, `PAMAN_KANDUNG`,
`PAMAN_SEBAPAK`, `SEPUPU_KANDUNG`, `SEPUPU_SEBAPAK`. (`MUTIQ` dan `MUTIQAH` belum bisa dipakai di soal bank.)

## 7. Laporan kiriman

Setiap kali menyelesaikan satu modul, tambahkan `konten/soal/modul-NN/LAPORAN.md`:

```markdown
# Modul 5: laporan soal

## Paket
- hajb-dasar: 6 soal (3 dasar, 2 menengah, 1 sulit), `pnpm soal:cek` lolos
- hajb-lanjut: 8 soal, lolos

## Cakupan terhadap kerangka
- topik wajib tercakup: hajb:SAUDARA_KANDUNG, hajb:SAUDARA_SEIBU, ... (sebutkan)
- topik wajib belum tercakup: (kosong, atau sebutkan alasannya)

## Soal dengan peringatan
- P-01-003: angka wasiat 1/3 (tanpa-kasus), dasar R01-4

## Token topik atau kasus yang dibutuhkan tetapi belum ada
- (kosong, atau sebutkan)

## Hal yang tidak ditemukan di KB
- (kosong, atau sebutkan apa yang ingin ditulis tetapi tidak ada dasarnya)
```
