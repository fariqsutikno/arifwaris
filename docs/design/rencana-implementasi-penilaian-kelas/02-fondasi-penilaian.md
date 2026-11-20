# 02. Fondasi penilaian (G1, sebelum jenis soal latihan berikutnya)

Induk: `00-induk.md` bagian 4 G1. Isi perilaku: spec 1.2, 2.1, 4A.11, 6.1–6.3; spec tabel B1–B6; audit T1, T3, T4, T7–T10, T14.
Perkiraan: 6–9 orang-hari. Satu commit per langkah; tiap commit lulus `pnpm test` dan `pnpm -r typecheck` (bila ada).

**Selesai bila:**
- [ ] Jalur soal → kasus → engine → tabel → nilai seluruhnya di paket `@waris/latihan`, tanpa React, diksi, localStorage,
      `Date`, atau `Math.random`, dan terbukti jalan di edge function lokal (spike).
- [ ] `nilaiSemuaKolom` mengembalikan hasil per sel dengan `benar` dan `benarEcf`; `nilaiTabel` lama tetap lulus semua uji B10.
- [ ] `TabelLatihan` menerima `mode` dan `jangkar` dari luar dan mengeluarkan `PercobaanTabel` (spec 6.1).
- [ ] Setiap Periksa/Lihat jawaban menyimpan `KejadianPercobaan` lokal dan mengantre (belum dikirim sampai `04`).
- [ ] `benar` tidak pernah mundur; Lihat jawaban selalu tercatat; versi engine bermakna.
- [ ] Soal hitung bisa memuat kasus jenis apa pun (format berkas), soal lama tetap terbaca tanpa migrasi.
- [ ] Tampilan soal biasa tidak berubah (bandingkan tangkapan layar sebelum/sesudah).

---

## 1. Langkah 1: spike edge function (1 hari, dikerjakan pertama)

Tujuan: membuktikan engine dan penilaian tabel bisa berjalan di Supabase Edge Functions (Deno), sebelum paket dibuat.

1. Fungsi lokal sementara `supabase/functions/uji-engine/` (tidak di-deploy). Masukan JSON: satu kasus bab 16 (mis. 16.1)
   dan satu isian tabel. Keluaran: hasil engine ringkas + `HasilNilai`.
2. Coba dua cara impor, catat mana yang jalan:
   a. **Impor langsung** lewat `deno.json` `imports` yang memetakan `@waris/math` dan `@waris/engine` ke `packages/*/src/index.ts`.
      Risiko yang diketahui [Fakta]: engine mengimpor dengan akhiran `.js` (`packages/engine/src/index.ts:1-5`) padahal
      berkasnya `.ts`; Deno tidak memetakan itu tanpa *sloppy imports*.
   b. **Bundel esbuild** satu berkas ESM (`esbuild packages/... --bundle --format=esm --platform=neutral`) yang diimpor fungsi.
3. Ukur: ukuran bundel, waktu respons pertama dan berikutnya di `supabase functions serve`, dan bahwa `bigint` serta hasil
   sama persis dengan vitest untuk kasus yang sama.
4. Petakan impor tidak murni di jalur yang akan dipindah (langkah 2), cukup dengan `grep` impor:
   `apps/web/src/kasus.ts`, `checklist.ts`, `jalankan.ts`, `hasil/tabelLatihan.ts`, `layar/belajar/contoh.ts`.
5. Tulis hasilnya di `docs/design/rencana-implementasi-penilaian-kelas/hasil-spike-edge.md` (setengah halaman: cara impor
   yang dipakai, angka ukuran/waktu, daftar impor tidak murni). Hapus fungsi `uji-engine` dari repo sesudahnya, atau simpan
   sebagai uji bila murah.

**Bila spike gagal** (tidak bisa dibundel atau terlalu lambat): berhenti, laporkan ke pemilik dengan dua cadangan
(fungsi Node di penyedia lain; atau penilaian server hanya untuk kelas dengan antrean). Langkah 2–6 tetap berguna karena
memurnikan kode, tetapi letak paket mungkin berubah.

---

## 2. Langkah 2: paket `@waris/latihan` (S2) (2 hari)

Keputusan yang diusulkan untuk audit pertanyaan 6.3: **paket baru**, bukan di `packages/engine`. Alasan: engine = aturan
fikih murni; paket ini = cara aplikasi memakai engine untuk soal (format kasus, pemanggil orkestrator, tabel, penilaian,
kejadian). Pola soal (`06`) membangkitkan daftar ahli waris yang harus diubah menjadi graf **di server**, jadi pembangun
graf murni harus ikut pindah juga.

### 2.1 Isi paket

```
packages/latihan/
  package.json            name @waris/latihan; dependencies: @waris/engine, @waris/math; @waris/content hanya tipe
  src/index.ts
  src/kasus.ts            tipe Kasus, kasusBaru, bacaBerkasKasus (validasi), tulisBerkasKasus
  src/grafAhliWaris.ts    bagian murni checklist: DAFTAR_JENIS tanpa label, tambahAhliWaris dan pembantunya
  src/jalankan.ts         jalankan, keInputEngine, HasilTampil (versi engine dioper, langkah 5)
  src/soal.ts             KasusSoal, kasusDariSoal, IdSoal, bacaIdSoal, tulisIdSoal, muatSoal (langkah 6)
  src/tabel/model.ts      KolomSoal, BarisSoal, TabelSoal, IsianTabel, Jangkar, HasilKolom, HasilSel
  src/tabel/susun.ts      susunTabelSoal: memilih fungsi per jenis
  src/tabel/susunBiasa.ts pindahan isi tabelLatihan.ts sekarang
  src/tabel/nilai.ts      nilaiSemuaKolom, putusanLatihan, putusanUjian, nilaiTabel
  src/tabel/ecf.ts        nilai turunan dari isian pelajar sendiri [KH]
  src/tabel/qMatriks.ts   kolom → tahapan → dimensi (satu sumber)
  src/tabel/jangkar.ts    pilihJangkar
  src/tabel/kanonik.ts    tabelKanonik(tabel): string (untuk versi.kunci)
  src/kejadian.ts         KejadianPercobaan, PercobaanTabel, JenisSoal
  src/angka.ts            angkaLatin (salinan fungsi murni kecil dari terjemah.ts)
  src/__tests__/          pindahan tabelLatihan.test.ts + uji baru
```

Fungsi turunan (XP, status soal, kemahiran, profil, nilai tugas) masuk paket ini di `04`/`05`/`06`, bukan sekarang.

### 2.2 Yang dipindah dan yang tetap di web

| Dari (web) | Ke (paket) | Yang tertinggal di web |
|---|---|---|
| `kasus.ts`: tipe, `kasusBaru`, validasi berkas | `kasus.ts`; galat dikembalikan sebagai **kode** (`'VERSI_TIDAK_DIKENAL'`, `'BENTUK_RUSAK'`, …) | baca/tulis localStorage `arif-waris:kasus`, pesan galat lewat `t()` (sekarang `kasus.ts:101,181`) |
| `checklist.ts`: `DAFTAR_JENIS` (tanpa label), `tambahAhliWaris` + fungsi graf yang dipanggilnya | `grafAhliWaris.ts` | `LABEL_SEHARI`, `labelOrangChecklist`, `peranDariMayit`, semua fungsi berlabel (`checklist.ts:252-352`) |
| `jalankan.ts` | `jalankan.ts` | – (web mengimpor dari paket) |
| `hasil/tabelLatihan.ts` | `tabel/*` | – |
| `layar/belajar/contoh.ts`: `kasusDariContoh` | `soal.ts`: `kasusDariSoal` | `hitungHarapan` untuk uji materi |

Aturan pindah:
- Pindah dulu **tanpa mengubah perilaku** (satu commit), baru ubah perilaku di langkah berikutnya.
- Web mengimpor dari `@waris/latihan`; jangan tinggalkan berkas pembungkus yang hanya meneruskan ekspor kecuali dipakai
  banyak tempat (lebih sedikit berkas).
- Nama orang: `susunTabelSoal(hasil, graf, namaDari: (id: IdOrang) => string)`. Web mengoper `id => namaOrang(graf,
  hasil.statusOrang, id)`; server mengoper id apa adanya (nama tidak dinilai).
- Judul kolom (`'Bagian'`, `'Asal masalah'`, …) sekarang teks literal di `tabelLatihan.ts:68-70`. Di paket diganti **id
  judul** (`'bagian'`, `'asalMasalah'`, `'asalMasalahAkhir'`, `'bagianKemungkinan'`, `'jamiah'`, …) plus parameter
  (`{ kemungkinan: 'janinWafat' }`); komponen web menerjemahkannya lewat kunci diksi (aturan narasi: tidak hardcode).
- `apps/admin` boleh mengimpor paket ini (validasi berkas kasus dan pratinjau soal di portal, langkah 6).

Uji: semua uji web yang ada lulus tanpa diubah selain jalur impor; `packages/latihan` lulus `vitest` sendiri.

---

## 3. Langkah 3: `nilaiSemuaKolom` per sel, ECF, Q-matriks (S1) (1,5–2 hari)

### 3.1 Tipe
```ts
type Tahapan = 'keputusanFikih' | 'hisabDasar' | 'penyatuan';
type Dimensi = 'kaidah' | 'hisab' | 'prosedur' | 'kelancaran' | 'penalaran';
interface KolomSoal { /* yang ada */ idJudul: string; tahapan: Tahapan; dimensi: Dimensi }

interface HasilSel { idBaris: IdOrang | 'pengali' | 'mauquf' | 'kepala'; benar: boolean; benarEcf: boolean; kosong: boolean }
interface HasilKolom {
  idKolom: string;
  status: 'benar' | 'salah' | 'belumLengkap';
  sel: HasilSel[];                       // termasuk sel kepala; sel bersama sekali (baris pertama kelompok)
  bentuk?: { diisi: bigint; terkecil: bigint };   // bila kepala kelipatan
}
function nilaiSemuaKolom(tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar | null): HasilKolom[]
function putusanLatihan(kolom: HasilKolom[]): HasilNilai          // perilaku B6 sekarang: kolom pertama yang tidak benar
function putusanUjian(kolom: HasilKolom[]): { benar: number; total: number; kolom: HasilKolom[] }  // belumLengkap = salah
const nilaiTabel = (tabel, isian, jangkar) => putusanLatihan(nilaiSemuaKolom(tabel, isian, jangkar));
```
`HasilNilai` tetap seperti sekarang (`tabelLatihan.ts:39-42`) supaya komponen tidak berubah di langkah ini.
Baris Pengali dinilai sebagai kolom tambahan terakhir (`idKolom: 'pengali'`), dari kepala isian pelajar (B6 langkah 6).

### 3.2 Q-matriks (`qMatriks.ts`, satu sumber; spec 4A.11)

| Kolom | Tahapan | Dimensi |
|---|---|---|
| Bagian, Didudukkan sebagai, Bagian per kemungkinan, keputusan gharqa | keputusanFikih | kaidah |
| Asal masalah, Bagian perantara (dzawil arham) | hisabDasar | hisab |
| Asal masalah akhir | hisabDasar | hisab |
| Saham per kemungkinan, Mas'alah 2…n, Pengali, Jami'ah, Ditahan (mauquf) | penyatuan | prosedur |

Bobot tahapan 40 · 30 · 30 (D13) **tidak** di sini; itu kebijakan tugas (`06`).

### 3.3 ECF (`ecf.ts`)
`benarEcf` = sel benar bila dinilai terhadap isian pelajar sendiri di kolom sebelumnya. Aturannya:
- **Keputusan fikih selalu dari kunci engine**: siapa terhalang, siapa satu kelompok, bobot kepala dalam kelompok
  (2:1 bab 10.5), siapa ikut radd. ECF tidak pernah memutuskan fikih sendiri.
- **Hanya hitungan [KH] yang diulang dengan angka pelajar** (`@waris/math`: `kpk`, `fpb`, nisab arba'):
  - Asal masalah: dari pilihan Bagian pelajar → kepala = kpk penyebut fardh yang dipilih; saham fardh = fardh × kepala;
    sel bersama ashabah = kepala − Σ saham fardh (bila negatif, ECF tidak berlaku → `benarEcf = benar`).
  - Asal masalah akhir: dari saham pelajar di kolom Asal masalah → 'aul bila Σ > kepala; tashih/radd memakai bobot kepala
    dan daftar radd dari kunci.
- Bila kolom sebelumnya benar, `benarEcf = benar`.
- Jenis soal lain (munasakhat, taqdir, dzawil arham) di G2: ECF hanya untuk kolom Asal masalah per mas'alah/kemungkinan;
  kolom lain `benarEcf = benar`.
  `// ponytail: ECF penuh hanya soal biasa; jenis lain menyalin benar, perluas bila profil prosedur terlihat timpang`.
- Uji: tabel kasus kecil di `ecf.test.ts` (pilih 1/6 alih-alih 1/3 untuk ibu → Asal masalah salah tapi `benarEcf` benar
  bila konsisten); property test dengan `fast-check`: bila isian = kunci, semua `benarEcf = benar = true`.

### 3.4 Uji
- Semua uji B10 di `tabelLatihan.test.ts` lulus lewat `nilaiTabel`.
- Baru: `putusanUjian` menghitung `belumLengkap` sebagai salah; `nilaiSemuaKolom` tetap menilai kolom sesudah kolom salah;
  sel bersama dinilai sekali; jangkar ikut sebagai benar.

---

## 4. Langkah 4: kontrak komponen dan jangkar dari luar (S3) (1 hari)

Mengikuti spec 6.1. Perubahan:
- `hasil/TabelLatihan.tsx`: props baru `mode: 'latihan' | 'ujian'` (hanya `'latihan'` dipakai sampai `05`), `jangkar`,
  `saatPercobaan(p: PercobaanTabel)`, `terbuka`, `terkunci`. Hapus `saatBenar`/`saatMencoba` dan
  `useState(() => pilihJangkar(tabel, Math.random))` (`TabelLatihan.tsx:39`).
- `layar/Hasil.tsx`: memilih jangkar sekali per sesi soal (`pilihJangkar(tabel, Math.random)` di pemanggil, disimpan di
  state bersama `idSesiSoal = crypto.randomUUID()`), menerima `PercobaanTabel`, lalu:
  - memutuskan confetti/XP seperti sekarang (`Hasil.tsx:160-166`), dan
  - mencatat kejadian (langkah 5).
  Lihat jawaban: setelah dialog tahan dikonfirmasi, Hasil memanggil pencatatan dengan `aksi: 'lihatJawaban'` dan isian
  saat itu (komponen perlu mengekspos isian terakhir lewat `saatPercobaan` setiap Periksa, atau lewat callback
  `saatIsianBerubah`; pilih yang lebih sedikit kode saat mengerjakan).
- `KartuTebak` lama tidak diubah; Hasil membungkus callback lamanya menjadi kejadian dengan `isian: null`,
  `hasilKolom: null` (spec 6.3) sampai dihapus di `03`.
- Uji komponen yang ada (`TabelLatihan.test.tsx`) disesuaikan ke props baru; tambah uji: jangkar dari prop tidak berubah
  saat Kosongkan; `saatPercobaan` dipanggil sekali per Periksa yang lolos "belum lengkap".

---

## 5. Langkah 5: data percobaan (S5, S6, S4) (1–2 hari)

### 5.1 S5: `benar` tidak mundur, Lihat jawaban selalu tercatat (T3, T4)
- `catatLatihan` (`apps/web/src/progres.ts:48`): bila catatan lama `benar: true`, tetap `true`; hanya `jumlahCoba` dan
  `jawabanTerakhir` yang berubah.
- `bukaJawaban` (`Hasil.tsx:164`) sekarang hanya mencatat bila `sudahMencoba`; ubah supaya Lihat jawaban **selalu**
  menulis kejadian `lihatJawaban` (langkah 5.3). `log_kegiatan` tetap seperti sekarang sampai `04`.
- Uji: benar lalu salah → tetap benar; buka tanpa mencoba → kejadian tercatat.

### 5.2 S6: versi engine bermakna (T9)
- Saat build, `vite.config` web dan skrip bundel edge function menyuntik `__VERSI_ENGINE__` = hash commit terakhir yang
  mengubah `packages/engine` atau `packages/math` (`git log -1 --format=%h -- packages/engine packages/math`). Versi paket
  `0.0.1` tidak pernah naik, jadi tidak dipakai.
- `jalankan(kasus, versiEngine)` mengoper ke `InputEngine.versiKb`; `VERSI_KB` tetap di `jalankan.ts:11` dihapus.
- `versi.kunci` = SHA-256 (16 karakter heks pertama) dari `tabelKanonik(tabel)`; hash dihitung pemanggil dengan
  `crypto.subtle.digest` (ada di peramban dan Deno), supaya paket tetap sinkron dan murni.

### 5.3 S4: kejadian lokal (T7, T10)
- Bentuk: `KejadianPercobaan` spec 2.1, dengan `soalId: IdSoal` (langkah 6) dan `revisiSoal`. Tipe `aksi` sudah memuat
  `'buka'` (dicatat saat soal dibuka; dipakai untuk waktu pengerjaan, `05` bagian 2), walau belum dipakai tampilan.
- **Perbaiki T7 dulu**: `apps/web/src/konten/sumber.ts` membuang `revisiId` dari snapshot (audit T7); simpan `revisiId` per
  soal supaya kejadian bisa menyebut revisi yang dikerjakan.
- Penyimpanan: `arif-waris:percobaan` (larik, **500 kejadian terakhir**), modul baru `apps/web/src/percobaan.ts`
  (`catatPercobaan(k)`, `bacaPercobaan()`), memakai `penyimpanan.ts` yang ada.
- Antrean: entri baru `{ tabel: 'percobaan'; baris: KejadianPercobaan }` di `EntriAntrean`
  (`apps/web/src/akun/antrean.ts:9-16`), berkunci id-nya sendiri seperti `kegiatan`. Sampai `04` selesai, pengirim
  **melewati** entri `percobaan` (tetap di antrean). Batas antrean `percobaan` juga 500.
- `gabung` saat login (`akun/gabung.ts`): kejadian digabung per `id` (gabungan himpunan), bukan "terbaru menang".
- Uji: kejadian tercatat untuk Periksa, Lihat jawaban, dan kartu lama; batas 500 memotong yang tertua; gabung dua perangkat
  tidak menggandakan.

---

## 6. Langkah 6: format kasus soal, `IdSoal`, `muatSoal` (1–2 hari)

### 6.1 Format kasus soal
```ts
// packages/content/src/soal.ts
type KasusSoal =
  | ContohKasus                                   // bentuk lama tanpa penanda: pewaris + daftar kunci + harta (+ harapan untuk uji)
  | { bentuk: 'berkas'; berkas: BerkasKasus };    // format "Simpan ke berkas" (versi ≥ 4): graf, urutan wafat, gharqa,
                                                  // status hidup (janin, mafqud), khuntsa, madzhab
interface SoalHitung { /* yang ada */ kasus: KasusSoal }
```
- 23 soal lama tetap sah tanpa diubah (tidak ada penanda `bentuk` = bentuk lama).
- `BerkasKasus` = bentuk JSON yang sudah divalidasi `bacaBerkasKasus` (langkah 2). Skema zod di
  `packages/content/src/skema.ts` (`soal_hitung`, baris ±103) menerima kedua bentuk; validasi isi berkas tetap oleh
  `bacaBerkasKasus` di uji konten (konten tidak bergantung paket latihan saat runtime, hanya di uji).
- `kasusDariSoal(kasus: KasusSoal): Kasus` di `@waris/latihan`.
- Madzhab soal: di dalam berkas (`kasus.madzhab`). Bentuk lama tetap [SYF].

### 6.2 Menulis soal berkas di portal (aturan: portal tanpa JSON/kode di layar)
- Penulis menyusun kasus di kalkulator web → **Simpan ke berkas** → di portal pilih **Unggah berkas kasus**.
- Portal memvalidasi dengan `bacaBerkasKasus`, lalu menampilkan **ringkasan manusiawi** (pewaris, ahli waris, urutan wafat,
  yang belum pasti, madzhab) dan **status soal**: dapat dipakai, atau alasannya dalam kalimat (engine `PERLU_INPUT` /
  `TIDAK_DIDUKUNG` / tabel belum didukung). Tidak ada JSON yang tampil.
- Teks soal (`judul`) tetap diketik penulis. Kunci tidak diketik (spec tabel B1).

### 6.3 `IdSoal` dan `muatSoal`
```ts
type IdSoal = string;   // kurasi: slug ('H-01'); pola: `${slugPola}@${versi}#${benih}`
function bacaIdSoal(id: string): { jenis: 'kurasi'; slug: string } | { jenis: 'pola'; slugPola: string; versi: number; benih: number } | null
function tulisIdSoal(...): IdSoal
function muatSoal(id: IdSoal, cari: { soal: (slug: string) => { kasus: KasusSoal; revisiId: string } | undefined })
  : { ok: true; kasus: Kasus; revisiId: string } | { ok: false; alasan: 'TIDAK_ADA' | 'TIDAK_DIDUKUNG' }
```
Cabang `pola` mengembalikan `TIDAK_DIDUKUNG` sampai katalog soal bangkitan dibangun di G4 (`06` bagian 3). Pencarian soal disuntikkan (`cari`), jadi
web memakai snapshot/konten dan server memakai basis data.

### 6.4 Uji konten
`packages/content` (atau uji di `packages/latihan` yang membaca snapshot): setiap soal hitung terbit
(a) terbaca `kasusDariSoal`, (b) engine `OK`, (c) `susunTabelSoal` mendukung. Soal yang gagal membuat uji gagal dengan nama
soal dan alasannya (pola `hitungHarapan`, `contoh.ts:22`).

---

## 7. Jangan
- Mengubah tampilan soal biasa di G1 (perubahan tampilan = mockup dulu).
- Menghitung kunci atau keputusan fikih di `ecf.ts`; ECF hanya mengulang hitungan [KH].
- Menambah `number` di jalur hitung kunci/ECF (`bigint`).
- Mengirim kejadian ke server sebelum `04` (belum ada tabel dan RLS-nya).
- Mengerjakan G1 langkah 4–5 bersamaan dengan sesi lain yang mengubah `Hasil.tsx` di folder yang sama.
