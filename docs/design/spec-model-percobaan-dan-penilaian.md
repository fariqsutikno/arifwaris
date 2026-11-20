# Spec: model percobaan, penilaian, XP, nyawa, dan keterlibatan (soal tabel latihan, siap kelas)

Status: **usulan, menunggu pemilik** (2026-11-20). Keputusan pemilik yang sudah ada: tidak ada pengurangan XP per percobaan;
XP berbeda menurut jenis soal; pembelajaran harus terasa seperti game yang menantang tanpa mendorong menebak atau
farming. Ide nyawa dinilai di bagian 4, desain keterlibatan di bagian 4A.

**Dasar:** `riset-ux-model-percobaan-dan-keterlibatan-2026-11-20.md` (selanjutnya "riset"). Tiap keputusan merujuk bagian
riset, mis. *(riset 6, HMW-3)*. Bila spec dan riset berbeda, riset menang sampai spec diperbarui.
Berlaku untuk tabel faraidh soal latihan (spec `spec-hasil-revamp-dan-tabel-latihan.md` bagian B). Kuis konsep (pilihan
ganda, `layar/belajar/KuisKonsep.tsx`) disebut hanya bila terdampak.
Audit pendamping: `audit-arsitektur-kesiapan-kelas.md` (kode temuan `T…` dirujuk di sini).

Cara membaca: tiap butir **Keputusan** punya alasan singkat. Yang ditandai **USULAN** adalah angka/nilai awal yang boleh
diganti pemilik tanpa mengubah desain. Pertanyaan untuk pemilik bernomor di bagian 8.

Bagian ini tidak menyentuh fikih. Kunci jawaban tetap dari engine (spec B1); dokumen ini hanya mengatur **bagaimana
percobaan dicatat, dinilai, dan dihargai**.

---

## 0. Ringkasan keputusan

| # | Keputusan | Alasan singkat |
|---|---|---|
| K1 | Dua mode: **Latihan** dan **Ujian** (bukan "Kuis", bukan "Belajar") | Kosakata pengguna *(riset 1b)*: "Mode latihan / Mode ujian" sudah dipakai Kuis konsep; "Belajar" = menu; "Kuis" = Kuis konsep dan `log_kegiatan.jenis = 'kuis'` |
| K2 | Satu komponen tabel, satu fungsi penilaian per kolom; mode = **kebijakan** yang dioper | Satu sumber aturan penilaian; Ujian dan Latihan hanya berbeda cara menampilkan dan kapan berhenti |
| K3 | Tiap Periksa/Kirim/Lihat jawaban = satu **kejadian percobaan append-only** | Nilai, XP, rekor, kemahiran, nilai kelas, dan semua ukuran keberhasilan *(riset 8)* bisa dihitung ulang dari data yang sama; kebijakan bisa berubah tanpa migrasi |
| K4 | Nilai/XP/rekor/kemahiran = **fungsi murni** atas (kejadian, kebijakan, metadata soal) | Sama dengan engine: deterministik, teruji, bisa dijalankan di klien dan server |
| K5 | XP penuh hanya pada **benar pertama tanpa Lihat jawaban**; tanpa potongan per salah; ulang = 0 XP tapi tetap aktivitas | Keputusan pemilik + anti-farming *(riset 6, HMW-3 ide 3b; 5a E4, E6)* |
| K6 | Lihat jawaban membakar XP soal itu **selamanya**; pemulihan lewat **soal serupa** bertopik sama | Menutup celah buka→ulang→benar *(riset 2 A1)* tanpa membuat pelajar "gagal lalu ditinggal" *(riset 6, HMW-2)* |
| K7 | Bobot XP di **metadata soal** (`bobotXp`), dibaca dari revisi yang dikerjakan | Pemilik: bukan di kode; XP sebanding kerja *(riset 2 A4)*; revisi beku → XP lama tidak bergeser |
| K8 | **Nyawa: jangan dibangun sekarang.** Versi minimal = saran belajar tanpa kunci. Bila tetap diinginkan: hanya di mode Tantangan (Ujian mandiri beruntun), daring, dinilai server | Nyawa per kesalahan merusak Latihan dan mendorong buka-jawaban-sebelum-mencoba *(riset 5c butir 1; 5b P1; 6 HMW-6)* |
| K9 | XP (gamifikasi mandiri) dan **nilai kelas** dipisah total; layar tugas tanpa mekanik game | *(riset 6 HMW-7, riset 9)* |
| K10 | Penugasan kelas **dinilai di server** (edge function menjalankan engine + penilaian yang sama) | Klien tidak dipercaya untuk nilai; engine murni sehingga bisa dijalankan ulang (audit T1, T2, T14) |
| K11 | Komponen tabel mengeluarkan **hasil terstruktur** (mode, isian, hasil per kolom, jangkar, lihatJawaban), bukan `saatBenar()` | Prasyarat semua di atas; perubahan kecil, dikerjakan **sekarang** sebelum jenis soal lain |
| K12 | Umpan Latihan menandai **kolom yang sudah benar** sebelum kolom yang salah | Rasa "hampir" yang jujur dan menunjuk langkah *(riset 2 A3; 6 HMW-1 ide 1b)* |
| K13 | **Kemahiran per topik** (tiga tingkat; **nama belum diputuskan**, usulan Mulai · Bisa · Mahir, riset kelas 13e) menggantikan ide level/rank | Hadiah mengikuti bukti paham yang diulang, tidak bisa dicapai dengan menebak *(riset 6 HMW-3 ide 3c; 5b P7; 5a E2, E4)* |
| K14 | **Soal hari ini** dipilih untuk pengulangan berjarak; streak dipertahankan apa adanya; tanpa bonus XP | Alasan kembali yang juga memperkuat ingatan *(riset 6 HMW-4 ide 4b; 5a E2; 5b P3, P4)* |
| K15 | Kesulitan bertahap = **saran** mengikuti kemahiran, bukan kunci | Pemula diarahkan, yang mahir tidak dihalangi *(riset 6 HMW-5 ide 5b)* |
| K17 | Kelas = **LMS per periode** (kode/tautan, banyak kelas, mengulang = kelas baru, tugas dari semua soal, nilai terlihat pelajar); soal skala besar lewat **pola soal deterministik** `pola@versi#benih` | riset kelas; bagian 5.0 |
| K16 | Daftar **pola gelap terlarang** dan **ukuran keberhasilan** menjadi kriteria terima setiap mekanik | *(riset 7, riset 8)* |

---

## 1. Dua mode: Latihan dan Ujian

### 1.1 Perilaku

| | **Latihan** (bawaan) | **Ujian** |
|---|---|---|
| Aksi utama | Tombol **Periksa** (seperti spec B6) | Tombol **Kirim** |
| Berapa kali | Berulang, sampai benar atau jawaban dibuka | **Sekali**. Sesudah Kirim tabel terkunci |
| Cara menilai | Kolom kiri→kanan, **berhenti di kolom pertama** yang belum lengkap/salah (B6 1–6) | **Semua kolom dinilai sekaligus**; kolom kosong = salah (tidak ada umpan "belum lengkap" yang menghentikan) |
| Umpan | Kuning/merah/hijau seperti B6 | Sesudah Kirim: tiap sel benar/salah ditandai sekaligus, ringkasan `{benar} dari {total} kolom benar` (kalimat baru, lewat diksi), lalu kunci tampil seperti sesudah Lihat jawaban |
| Batas waktu | Tidak ada | **Opsional**: diatur pengajar per tugas (`batasWaktuMenit`, dihitung server); di mandiri pelajar boleh menyalakan **Pakai waktu** sendiri. Hitung mundur hanya tampil bila dipakai *(keputusan pemilik D6; riset kelas 13f)* |
| Kirim saat ada sel kosong | – | Dialog tahan: "Masih ada kotak kosong. Tetap kirim?" (pola dialog tahan yang sudah ada) |
| Lihat jawaban | Tautan merah, dialog tahan, XP hilang (B6) | **Tidak ada sebelum Kirim**. Sesudah Kirim kunci tampil otomatis |
| Kosongkan | Ada | Ada sebelum Kirim |
| Tersimpan | Tiap Periksa yang lolos "belum lengkap" dan tiap Lihat jawaban | Satu kejadian saat Kirim, benar maupun salah |
| XP | Bagian 3 | Bagian 3 (hanya bila semua kolom benar) |

**Keputusan:** Latihan = bawaan untuk soal mandiri. Ujian dipakai (a) bila pelajar memilihnya untuk paket soal, dan
(b) bila penugasan kelas mewajibkannya. *Alasan:* Latihan adalah tempat belajar dari salah (koreksi bertahap); Ujian
adalah tempat mengukur.

**Keputusan:** Ujian menilai **per kolom** (bukan per sel) untuk skor. *Alasan:* kolom berkepala dinilai sebanding
(kepala salah membuat seluruh kolom tidak bermakna); skor per sel akan menghukum dua kali satu kesalahan kepala. Hasil per
sel tetap disimpan untuk penanda di layar dan untuk pengajar.

**Keputusan:** pengali (baris Pengali) dihitung sebagai satu "kolom" tambahan di skor Ujian, dinilai dari kepala isian
pelajar seperti B6 langkah 6. Kolom terkunci tidak dihitung.

### 1.2 Satu komponen, satu penilaian

Sekarang `nilaiTabel` (`apps/web/src/hasil/tabelLatihan.ts:94`) sudah berhenti di kolom pertama yang bermasalah; itu
kebijakan Latihan yang tertanam di fungsi penilaian. Diubah menjadi dua lapis:

```ts
// murni, tanpa kebijakan: nilai SEMUA kolom
function nilaiSemuaKolom(tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar | null): HasilKolom[]
// HasilKolom = { idKolom; status: 'benar' | 'salah' | 'belumLengkap'; kepalaSalah; idBarisSalah; idBarisKosong; bentuk? }

// kebijakan Latihan (perilaku B6 sekarang): ambil yang pertama tidak benar
const putusanLatihan = (kolom: HasilKolom[]): HasilNilai => …
// kebijakan Ujian: belumLengkap dianggap salah, semua ditandai
const putusanUjian = (kolom: HasilKolom[]): { benar: number; total: number; kolom: HasilKolom[] } => …
```

`nilaiTabel` yang ada tetap ada sebagai `putusanLatihan(nilaiSemuaKolom(...))`, jadi uji B10 tidak berubah.

### 1.3 Dampak ke kode yang ada

- `hasil/TabelLatihan.tsx`: prop baru `mode: 'latihan' | 'ujian'`; tombol Periksa ↔ Kirim; Lihat jawaban disembunyikan
  di Ujian sebelum Kirim; status `terkunci` sesudah Kirim. Tidak ada kartu/tombol baru selain yang tercantum di 1.1;
  **tampilan Ujian perlu mockup** sebelum dibangun (aturan spec B bagian 0 butir 4), lihat pertanyaan P2.
- `hasil/KartuTebak.tsx` dan `hasil/tebak.ts`: tidak diberi mode. Keduanya dihapus sesuai spec B langkah 6; selama masih
  hidup, adaptor kecil mengubah `saatBenar/saatMencoba` lama menjadi kejadian (bagian 6.3) supaya data tetap seragam.
- `layar/Hasil.tsx` (`jawabanTerbuka`, `sudahMencoba`, `bukaJawaban`, `jawabBenar`, baris 160–166): logika "XP hanya bila
  belum dibuka" pindah ke fungsi XP (bagian 3). Hasil hanya meneruskan kejadian.
- **Hero B8**: bilah kanan `Soal {i} dari {n} · {bab}` tetap; di Ujian ditambah kata `Ujian` di depannya (mis.
  `Ujian · Soal 2 dari 5 · Bab 9`). Untuk penugasan: tautan kiri `Latihan` diganti nama penugasan dan kembali ke
  daftar penugasan; bila ada tenggat, bilah memuat `Tenggat {tanggal jam}`. "Soal berikutnya" muncul sesudah Kirim (Ujian)
  sama seperti sesudah "Benar semua." (Latihan). Teks baru lewat `pnpm diksi:tambah`.

---

## 2. Model data: kejadian percobaan append-only

### 2.1 Bentuk kejadian

```ts
interface KejadianPercobaan {
  id: string;                       // uuid buatan klien → kirim ulang tidak dobel (pola log_kegiatan)
  idSesiSoal: string;               // satu "membuka soal" = satu sesi; Periksa berulang berbagi id ini
  soalId: IdSoal;                   // soal kurasi (slug) atau soal pola `${slugPola}@${versi}#${benih}` (riset kelas 5b)
  revisiSoal: string;               // revisi.id konten yang dikerjakan: revisi soal kurasi atau revisi pola (isi + bobotXp beku)
  jenisSoal: JenisSoal;             // 'biasa' | 'munasakhat' | 'dzawilArham' | 'mafqud' | 'khuntsa' | 'haml' | 'gharqa'
  mode: 'latihan' | 'ujian';
  konteks: { jenis: 'mandiri' } | { jenis: 'penugasan'; idPenugasan: string };
  aksi: 'periksa' | 'kirim' | 'lihatJawaban';
  isian: IsianTabel | null;          // null untuk lihatJawaban tanpa isian
  jangkar: Jangkar | null;
  hasilKolom: HasilKolom[] | null;   // putusan klien; server menghitung ulang untuk penugasan
  benarSemua: boolean;
  dimulaiPada: string;              // jam perangkat, hanya informasi (lama mengerjakan); tidak dipercaya
  diterimaPada?: string;            // diisi server (default now()), satu-satunya waktu yang dipercaya
  versi: { engine: string; ruleset: Ruleset; madzhab: string; kunci: string };
}
```

- `versi.kunci` = hash (SHA-256, heksadesimal, 16 karakter cukup) dari `TabelSoal` kanonik (kolom, kunci, kelompok)
  yang dipakai saat menilai. *Alasan:* bila engine berubah (mis. E2 mengubah kunci haml [SYF]), kita tahu percobaan mana
  yang dinilai dengan kunci lama, dan bisa menilai ulang atau membiarkannya.
- `versi.engine` = versi paket engine saat build (bukan `VERSI_KB = '1.0.0-dev'` yang tetap, `apps/web/src/jalankan.ts:11`,
  temuan T9).
- Isian disimpan apa adanya (teks per sel), bukan hanya benar/salah: *alasan*, penilaian ulang dan analisis kesalahan
  umum untuk pengajar butuh isian.
- Ukuran: tabel haml [HNB] ±13 kolom × ±6 baris teks pendek → di bawah 2 KB per kejadian. Batas server
  `pg_column_size(isian) < 16000` (pola `kasus_dibagikan`).

### 2.2 Turunan sebagai fungsi murni

Satu modul murni (lihat 6.2 untuk letaknya) berisi:

```ts
xpSoal(kejadian: KejadianPercobaan[], bobot: (revisi: string) => number): number          // bagian 3
statusSoal(kejadian): 'belum' | 'dicoba' | 'benar' | 'dibuka'                             // daftar soal, centang
rekorUjian(kejadian): { terbaik: Skor; jumlahKirim: number } | null                       // rekor per soal/paket
nilaiPenugasan(kejadian, kebijakan: KebijakanPenugasan): NilaiPenugasan                   // bagian 5
nyawa(kejadian, sekarangServer: string, aturan: AturanNyawa): KeadaanNyawa                 // bagian 4, bila dibangun
```

Server punya padanan SQL untuk XP (sudah ada pola `peristiwa_xp`); bila logika XP makin rumit, server memanggil modul
TS yang sama lewat edge function alih-alih menyalin aturan ke SQL (satu sumber aturan). Untuk sekarang aturan XP cukup
sederhana untuk ditulis di SQL **dan** TS dengan uji fixture yang sama di kedua sisi (pgTAP + vitest membaca satu berkas
JSON kasus uji).

### 2.3 Perbandingan dengan yang ada

| Yang ada | Masalah untuk model ini | Nasib |
|---|---|---|
| `progres_latihan` (`supabase/migrations/20260926000003_pengguna.sql:21-31`): satu baris per (user, jenis, soal), `benar` = **percobaan terakhir**, `jawaban_terakhir`, `jumlah_coba` | Keadaan, bukan riwayat. Benar lalu salah → `benar=false` (`apps/web/src/progres.ts:48-58`); tidak ada lihatJawaban, mode, jangkar, versi | **Tetap** sebagai cache tampilan (centang di daftar soal), diturunkan dari kejadian. Semantik `benar` diubah ke "pernah benar" (lihat 2.4) |
| `log_kegiatan` (`20260927000003_akun.sql:24-39`): append-only, waktu server, `jenis/slug/benar` | Sudah append-only dan dipakai XP/streak. Tidak punya isian/mode/konteks/versi/lihatJawaban; `benar` dari klien | **Dipertahankan** untuk pelajaran dan kuis konsep, dan tetap menjadi sumber hari aktif. Percobaan tabel menulis ke tabel baru dan **satu** baris `log_kegiatan` per sesi soal tetap dikirim (untuk streak) sampai fungsi XP/streak membaca tabel baru |
| `skorKuis.ts` (murni) | Sudah pola yang benar (fungsi murni atas skor). Hanya kuis konsep | Tetap; `predikatDari` dipakai juga untuk skor Ujian tabel (satu tangga predikat) |
| Rekor paket lokal (`progres.ts:62-79`, `arif-waris:rekor-paket`) | Hanya di perangkat; hilang saat ganti perangkat | Untuk tabel: rekor diturunkan dari kejadian (ikut sinkron). Kuis konsep tidak diubah di spec ini |
| Antrean akun (`apps/web/src/akun/antrean.ts`): satu entri per kunci, yang baru **menimpa** | Kejadian tidak boleh saling menimpa | Entri baru `{ tabel: 'percobaan', baris }` berkunci `percobaan:${id}` (sama seperti `kegiatan`), jadi tidak pernah ditimpa |
| `gabung.ts`: progres latihan "terbaru menang", `jumlahCoba` = maksimum dua sisi | Jumlah percobaan dua perangkat hilang (maks, bukan jumlah) | Kejadian digabung dengan **gabungan himpunan berdasarkan id**; tidak ada konflik |

### 2.4 Skema server baru

```sql
create table percobaan_soal (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id_sesi_soal uuid not null,
  soal_id text not null check (char_length(soal_id) <= 200),   -- IdSoal
  revisi_soal uuid not null references revisi,
  jenis_soal text not null check (jenis_soal in ('biasa','munasakhat','dzawil_arham','mafqud','khuntsa','haml','gharqa')),
  mode text not null check (mode in ('latihan','ujian')),
  id_penugasan uuid references penugasan on delete set null,   -- null = mandiri; tabel penugasan menyusul (bagian 5)
  aksi text not null check (aksi in ('periksa','kirim','lihat_jawaban')),
  isian jsonb check (pg_column_size(isian) < 16000),
  jangkar jsonb,
  hasil_kolom_klien jsonb,
  benar_semua_klien boolean not null,
  hasil_kolom_server jsonb,          -- diisi edge function; wajib untuk penugasan
  benar_semua_server boolean,
  dimulai_pada_klien timestamptz,
  diterima_pada timestamptz not null default now(),
  versi jsonb not null
);
create index on percobaan_soal (user_id, soal_id, diterima_pada);
-- RLS: insert & select baris sendiri; tidak ada update/delete untuk authenticated (append-only).
-- Kolom *_server dan diterima_pada tidak di-grant ke authenticated (pola log_kegiatan baris 38-39).
```

Kolom `id_penugasan` baru ditambahkan bersama tabel `penugasan` (fase kelas); di fase sekarang tabel dibuat tanpanya.

### 2.5 Migrasi dari data yang ada

1. **Tidak ada konversi paksa.** Data lama tidak punya isian/mode/versi; memalsukannya lebih berbahaya daripada
   membiarkannya. `log_kegiatan` lama tetap menjadi sumber XP untuk kejadian sebelum tanggal peralihan.
2. Fungsi XP baru = `XP dari log_kegiatan (sebelum peralihan, aturan lama)` ∪ `XP dari percobaan_soal (aturan baru)`,
   dengan aturan "satu kali per soal" diterapkan **lintas keduanya** (soal yang sudah memberi XP di log lama tidak memberi
   lagi). Uji pgTAP memastikan total XP pengguna lama tidak berubah pada hari peralihan.
3. `progres_latihan.benar` diubah semantiknya menjadi "pernah benar tanpa dibuka" dan diisi ulang dari `log_kegiatan`
   (`bool_or(benar)` per soal) sekali. Klien: `catatLatihan` tidak lagi menimpa `benar` true dengan false.
4. Lokal: kunci baru `arif-waris:percobaan` (larik kejadian, dibatasi 500 terakhir per perangkat; server memegang
   semuanya). Tidak ada migrasi lokal; `arif-waris:progres-latihan` tetap dibaca untuk centang lama.
5. Peralihan berlaku per build; kejadian dari build lama (tanpa tabel baru) tetap mengalir lewat `log_kegiatan`.

---

## 3. XP

### 3.1 Aturan (keputusan)

Dasar: hadiah mengikuti usaha jujur, bukan menyalin atau menebak *(riset 6 HMW-3 ide 3b; 5a E4, E6; 2 A1, A5)*.

Untuk satu pengguna dan satu soal (`soal_id`, lintas revisi; soal pola dengan benih berbeda = soal berbeda):

1. Urutkan kejadian menurut `diterima_pada` (server). Kejadian luring yang terkirim belakangan memakai waktu terima;
   urutan di dalam satu antrean terjaga karena antrean dikirim berurutan (`antrean.ts:59-81`).
2. Bila ada kejadian `lihat_jawaban` **sebelum** kejadian benar pertama → **0 XP selamanya** untuk soal itu; status
   `dibuka`. *Alasan:* menutup celah buka→ulang→benar (T3). "Selamanya" juga mencakup revisi soal berikutnya: revisi
   biasanya perbaikan teks, bukan soal baru; soal yang benar-benar baru diberi slug baru.
3. Bila tidak: kejadian benar pertama (`periksa` dengan `benarSemua` di Latihan, atau `kirim` dengan `benarSemua` di
   Ujian) memberi **XP penuh = `bobotXp` revisi yang dikerjakan saat itu**. Jumlah Periksa salah sebelumnya **tidak
   mengurangi** (keputusan pemilik).
4. Kejadian sesudahnya (ulang soal yang sudah benar, Ujian ulang) = **0 XP**, tetapi tetap **aktivitas** untuk hari aktif
   dan streak. *Alasan:* mengulang itu baik untuk belajar; hanya tidak boleh menjadi ladang XP.
5. **Ujian memberi XP parsial** (keputusan pemilik D4): Kirim Ujian **pertama** untuk soal itu memberi
   `bobotXp × skor butir` (skor per sel/kolom/tahapan, 5.1 "Skor parsial"). Sesudahnya, benar penuh tanpa dibuka (Latihan
   atau Ujian) **menambah sisanya** sampai `bobotXp`; total XP per soal tidak pernah melebihi `bobotXp`. Ujian ulang
   tidak menaikkan XP parsial. Lihat jawaban sesudah Kirim pertama membakar sisa XP. Latihan mandiri tetap hanya memberi
   XP pada benar penuh. *Alasan:* menghargai kemajuan langkah di Ujian (tanpa umpan bertahap) tanpa membuka farming:
   Latihan punya umpan per Periksa sehingga skor parsialnya bisa dinaikkan dengan menebak, Ujian tidak.
6. **Penugasan kelas tidak memberi XP berbeda dari mandiri**: percobaan penugasan dihitung ke XP dengan aturan yang sama
   (dinilai server), tidak dobel. *Alasan:* kelas memakai nilai, bukan XP (K9); pelajar tidak perlu memilih antara
   mengerjakan tugas atau mengejar XP.
7. Hari aktif: satu kejadian apa pun (termasuk salah dan lihat jawaban) membuat hari aktif, seperti sekarang
   (`hari_aktif`, `20260927000006_peringkat.sql`).

### 3.2 Bobot per jenis soal (USULAN angka awal)

Bobot disimpan di isi revisi soal: field baru `bobotXp: number` (bulat, 1–200) di skema `soal_hitung`
(`packages/content/src/skema.ts:103-105`). Form portal mengisi otomatis dari tabel usulan di bawah menurut jenis dan
tingkat, dan penulis boleh mengubahnya (portal menampilkan "Poin XP", bukan nama field, sesuai memori "admin tanpa kode
teknis"). Fungsi SQL `xp_konten` dipakai hanya sebagai cadangan untuk revisi lama tanpa `bobotXp`.

Dasar usulan: **sebanding dengan jumlah kolom yang dinilai** (kerja nyata pelajar), dengan soal biasa tetap seperti
sekarang supaya XP pengguna lama tidak bergeser.

| Jenis | Kolom dinilai (kira-kira) | **USULAN bobotXp** |
|---|---|---|
| Biasa | 3 | dasar **10**, menengah **20**, sulit **30** (tetap seperti sekarang) |
| Dzawil arham (tanzil) | 3 + pilihan perantara | **30** |
| Gharqa | keputusan + 0–2 tabel biasa | **30** |
| Munasakhat | 2 mayit ±5 + pengali; 3 mayit ±7 + pengali | **40** (2 mayit), **60** (3 mayit) |
| Mafqud | 5 + pengali + mauquf | **50** |
| Khuntsa | 5 + pengali + mauquf | **50** |
| Haml [SYF] | 9 + pengali + mauquf | **70** |
| Haml [HNB] | 13 + pengali + mauquf | **90** |

Risiko yang diterima: satu soal haml bernilai setara 7–9 soal biasa dasar di papan peringkat. Itu sebanding dengan
kerjanya, dan jumlah soal haml sedikit. Kuis konsep tidak diubah (5/10/15).

**Keputusan:** XP dibaca dari `revisi_soal` yang tersimpan di kejadian, bukan dari revisi terbit saat dihitung.
*Alasan:* aturan lama "tingkat dibaca saat dihitung, XP lama ikut berubah" (spec streak) membuat papan peringkat bergeser
diam-diam saat penulis menyunting; kejadian sudah membawa revisinya, jadi gratis dibekukan.

---

## 4. Sistem nyawa (ide pemilik): penilaian dan rekomendasi

Ide: 5 nyawa; salah mengurangi nyawa; habis → pelajar diarahkan belajar lagi (materi/latihan) dan menunggu 1 jam.

### 4.1 Kapan masuk akal

- **Ujian mandiri beruntun** (paket "Tantangan" beberapa soal, satu Kirim per soal): nyawa memberi taruhan dan
  ritme, seperti mode tantangan di aplikasi belajar bahasa. Satu Kirim salah = satu nyawa, jelas dan adil.
- Sebagai **rem untuk menebak acak**: di Ujian, menebak berulang tidak mungkin (sekali kirim), jadi nyawa di sini hanya
  membatasi jumlah soal salah per jam, bukan menebak.

### 4.2 Kapan merusak

- **Latihan**: alurnya dirancang untuk Periksa berulang dengan koreksi bertahap (B6). Bila tiap Periksa salah memakan
  nyawa, pelajar takut menekan Periksa dan memilih Lihat jawaban; itu kebalikan tujuan. Soal haml [HNB] ±13 kolom:
  5 nyawa bisa habis di **satu soal** padahal pelajar sedang maju kolom demi kolom.
- **Penugasan kelas bernilai**: pengunci 1 jam bisa membuat pelajar melewatkan tenggat karena sistem, bukan karena
  kemampuannya. Pengajar sudah punya alat sendiri (batas percobaan per penugasan, bagian 5). Dua mekanisme pembatas yang
  bertumpuk membingungkan.
- **Pelajar pemula**: kegagalan beruntun di awal + dikunci = alasan berhenti memakai aplikasi. Kalimat "belajar lagi
  sendiri" terdengar menghukum.
- **Streak**: bila dikunci saat streak terancam di malam hari, pelajar merasa dihukum dua kali. Maka belajar materi selama
  terkunci **harus** tetap menghitung hari aktif (sudah begitu: pelajaran selesai = kegiatan).

### 4.3 Syarat teknis bila dibangun

- **Waktu tunggu dihitung server** dari `diterima_pada` kejadian, bukan jam perangkat (jam perangkat bisa dimajukan).
  Klien hanya menampilkan sisa waktu yang dikirim server.
- **Nyawa bukan penghitung yang disimpan**, tetapi fungsi `nyawa(kejadian, sekarangServer, aturan)`: jumlah Kirim salah
  di jendela sejak pemulihan terakhir. Tidak ada keadaan yang bisa diubah klien.
- **Anti-curang**: selama penilaian dilakukan klien, pelajar bisa tidak mengirim kejadian salah (mode pesawat, hapus
  penyimpanan, keluar akun). Nyawa yang jujur karena itu **butuh penilaian di server** dan **wajib daring**: Kirim di mode
  Tantangan = panggilan server yang menilai dan langsung mencatat. Artinya nyawa bergantung pada infrastruktur kelas
  (bagian 5.4), jadi tidak bisa dibangun lebih dulu dengan jujur.
- **Luring**: mode Tantangan tidak tersedia luring (tautannya tampil dengan keterangan "butuh internet"). Latihan dan
  Ujian biasa tetap jalan luring tanpa nyawa.
- **Tanpa akun**: tidak ada nyawa (tidak ada server yang bisa dipercaya).
- **Hubungan dengan XP**: nyawa tidak memengaruhi XP; XP tetap aturan bagian 3. Kehabisan nyawa tidak menghapus XP atau
  streak.

### 4.4 Rekomendasi

**Jangan bangun nyawa di fase ini.** Bangun **versi minimal tanpa kunci** yang memberi manfaat pedagogisnya tanpa
risikonya *(riset 6 HMW-6 ide 6c)*:

- **Saran belajar**: di Latihan, sesudah **3 Periksa salah berturut-turut di kolom yang sama**, di bawah umpan merah
  muncul dua tautan teks: `Pelajari dulu: {judul materi}` (materi bab soal itu) dan `Coba soal serupa` (bila ada soal lain
  bertopik sama, 4A.2). Tanpa penghitung nyawa, tanpa kunci, tanpa menunggu. Diturunkan murni dari kejadian sesi ini
  (tidak butuh server). Kalimat baru lewat diksi; butuh persetujuan mockup.

Alasan dari riset: pembuat pola nyawa paling dikenal meninggalkan nyawa per kesalahan karena menghambat pelajar baru
*(riset 5b P1)*; meminta bantuan sebelum mencoba dan menebak cepat adalah perilaku yang paling merugikan belajar
*(riset 5a E4)*, dan nyawa di Latihan mendorong keduanya *(riset 5c butir 1)*. Ditolak: nyawa di Latihan (6a), Periksa
dinonaktifkan sementara (6d, bertentangan dengan keputusan "tombol tak nonaktif"), nyawa yang dipulihkan dengan membaca
materi (6e).

Bila sesudah itu pemilik tetap ingin nyawa: hanya untuk **mode Tantangan** (Ujian mandiri beruntun, daring, berakun),
dibangun **sesudah** penilaian server (fase P3 di bagian 7), dengan aturan di 4.3. Tidak pernah di Latihan dan tidak
pernah di penugasan kelas. Jeda harus terasa adil *(riset 6 HMW-6)*: sisa waktu tampil sebagai jam selesai
(`Bisa lagi pukul {jam}`), bukan hitung mundur; Latihan, materi, dan Kuis konsep tetap terbuka dan tetap menghitung
streak; tanpa pembelian/iklan pemulihan; tanpa notifikasi "nyawamu sudah penuh".

---

## 4A. Desain keterlibatan (engagement)

Arahan pemilik: belajar harus terasa seperti game yang menantang dan membuat ingin kembali. Batasan dari riset: "game"
berarti **ritme, tantangan, dan umpan instan**, bukan dekorasi game (memori 2026-10-01, *riset 0*); dan setiap mekanik
harus mendorong pemahaman fikih yang benar, bukan menebak atau farming *(riset 5c, prinsip turunan riset 6)*.

Semua mekanik di bawah adalah **fungsi murni atas kejadian percobaan** (bagian 2); tidak ada keadaan game yang disimpan
terpisah.

### 4A.1 Peta mekanik

| Mekanik | Keputusan | Versi minimal (dibangun dulu) | Rujukan |
|---|---|---|---|
| Umpan instan | Pertahankan Periksa (B6); tambah tanda **kolom yang sudah benar** | Centang di kepala kolom benar + `Kolom 1–2 benar. Mulai salah di kolom "{judul}".` | K12; riset HMW-1 1b |
| Rasa "hampir" | Dari umpan kolom benar, bukan persen | sama dengan baris di atas | riset HMW-1 (1c ditolak: persen menyesatkan) |
| Pemulihan sesudah gagal | **Soal serupa** bertopik sama sesudah Lihat jawaban atau 3 salah di kolom sama; soal serupa tetap memberi XP | Tautan `Coba soal serupa` + `Pelajari dulu: {materi}` | K6; riset HMW-2 2b+2d |
| XP | Bagian 3 (benar pertama tanpa dibuka; bobot per jenis; tanpa potongan) | sudah di P0/P1 | K5, K7 |
| Streak | **Tetap apa adanya** (hari aktif dari kegiatan apa pun, notifikasi netral sekali sehari, bisa dimatikan). Tanpa freeze dulu | tidak ada perubahan | riset 2 A9; 5b P3/P4; HMW-4 4e |
| Level/rank | **Ditolak**; diganti **kemahiran per topik** | 4A.3 | K13; riset HMW-3 3c/3d |
| Rekor dan lencana | **Lencana bukti** (mis. tuntas satu bab di tingkat tertinggi) + **rekor** (nilai/waktu Ujian terbaik) di halaman pribadi **Pencapaian**; boleh diperlihatkan ke pengajar kelas tertentu bila pelajar memilih; lencana kebiasaan (streak) tetap pribadi; tanpa XP tambahan, tidak masuk nilai | sesudah kemahiran (P2b) | keputusan pemilik D7; riset kelas 13b |
| Tantangan harian | **Soal hari ini** (pengulangan berjarak), tanpa bonus XP, tanpa papan harian | 4A.4 | K14; riset HMW-4 4b |
| Kesulitan bertahap | **Saran** tingkat/jenis berikutnya mengikuti kemahiran; tanpa kunci | 4A.5 | K15; riset HMW-5 5b |
| Nyawa | Ditunda; saran belajar (4.4); Tantangan daring nanti | 4.4 | K8; riset HMW-6 |
| Jeda tunggu | Hanya bila nyawa Tantangan dibangun; jam selesai, server, tanpa jual pemulihan | – | 4.4; riset HMW-6 |
| Peringkat | Tetap seperti sekarang (publik, opt-out). Tanpa liga, tanpa peringkat kelas | tidak ada perubahan | riset 5b P5; HMW-7 7c |

### 4A.2 Soal serupa

- Soal serupa = soal latihan terbit lain dengan `topik` sama (`packages/content/src/soal.ts:14`), tingkat sama atau satu
  di bawah, yang belum `benar` dan belum `dibuka` oleh pelajar. Dipilih dengan `acak` tersuntik (pola `pilihAcak`).
- Tidak ada soal serupa → tautan tidak dirender (memori "UI hanya yang relevan").
- **Prasyarat konten**: hitung jumlah soal per topik dari konten terbit sebelum membangun; topik dengan satu soal butuh
  soal tambahan dari tim keilmuan (bukan dikarang di kode).

### 4A.3 Kemahiran per topik

```ts
type Kemahiran = 'belum' | 'dicoba' | 'paham' | 'kuasai';   // nama kode; label layar belum diputuskan (riset kelas 13e)
function kemahiranTopik(kejadian: KejadianPercobaan[], topikDari: (slug: string) => string, topik: string): Kemahiran
```

| Status | Syarat (USULAN) |
|---|---|
| `dicoba` | ada kejadian apa pun di soal bertopik itu |
| `paham` | satu soal bertopik itu benar tanpa dibuka (Latihan atau Ujian) |
| `kuasai` | sesudah `paham`: benar di **Ujian** soal bertopik itu, **atau** benar tanpa dibuka di **soal lain** bertopik sama yang dikerjakan **≥ 1 hari** (waktu terima server) sesudah `paham` |
| turun ke `paham` | salah di Ujian soal bertopik itu sesudah `kuasai` |

Alasan: bukti kedua yang berjarak *(riset 5a E2)* membedakan paham dari tebakan beruntung *(riset 5a E4)*, meniru pola
kemahiran Khan Academy *(riset 5b P7)*. Turun status ditampilkan netral (tanpa animasi kehilangan, *riset 7*).
Tampilan (di daftar soal per bab dan ringkasan Belajar) **butuh mockup**; label tiga tingkat dipilih pemilik dari opsi riset kelas 13e (usulan T1 Mulai · Bisa · Mahir) lalu diuji ke pengguna
*(riset 11)*.

### 4A.4 Soal hari ini

`soalHariIni(kejadian, bankSoal, hariIniServer)` memilih satu soal, urutan prioritas:
1. topik yang soalnya **dibuka atau salah ≥ 1 hari** lalu dan belum dipulihkan;
2. topik `paham` yang belum `kuasai` dan sudah ≥ 1 hari sejak `paham`;
3. soal baru berikutnya menurut urutan bab (saran yang sudah ada di `DaftarSoalHitung`).

Satu soal per hari (tetap sama sepanjang hari itu), tampil di Beranda sebagai satu tautan. Mengerjakannya = aktivitas
(streak). XP mengikuti bagian 3 (soal ulang = 0 XP). Tanpa akun: dihitung dari kejadian lokal dan jam perangkat (tidak ada
hadiah yang bisa dicurangi, jadi jam perangkat cukup). Butuh mockup Beranda.

### 4A.5 Saran kesulitan

Saran "berikutnya" di daftar soal: tingkat berikutnya (dasar → menengah → sulit) disarankan sesudah **2 topik `paham`**
di tingkat itu dalam bab yang sama; jenis kasus khusus (munasakhat, taqdir, dzawil arham, gharqa) disarankan sesudah topik
soal biasa di bab prasyaratnya `paham`. Pemetaan prasyarat bab = data konten (bukan kode), diisi tim keilmuan. Semua soal
tetap bisa dibuka (tanpa kunci).

### 4A.6 Pola gelap terlarang (kriteria terima setiap mekanik)

Diambil dari *riset 7*. Setiap PR yang menambah mekanik keterlibatan wajib lolos daftar ini:
- tidak ada kalimat/ilustrasi rasa bersalah, maskot sedih, atau "streak-mu akan hilang" berulang; notifikasi ≤ 1 per hari;
- XP tidak pernah berkurang; materi dan Latihan tidak pernah terkunci;
- tidak ada peringkat di kelas, tidak ada daftar "belum mengerjakan" yang terlihat sesama pelajar;
- keluar sesi satu ketukan (dialog tahan hanya bila ada isian yang akan hilang);
- tidak ada pembelian/iklan untuk nyawa, streak, atau XP; tidak ada hadiah acak;
- tidak ada liga dengan degradasi.

### 4A.7 Ukuran keberhasilan

Dari *riset 8*, semua dihitung dari kejadian (tanpa pelacak pihak ketiga), per pekan, sebelum/sesudah fitur:
retensi D1/D7/D30; penyelesaian jujur (benar tanpa dibuka per sesi soal); rasio lihat-sebelum-mencoba; tanda menebak
(Periksa < 5 detik sesudah Periksa salah dengan ≤ 1 sel berubah); kesalahan berulang per jenis kolom pada soal ke-n
bertopik sama; pemulihan (soal serupa benar sesudah jawaban dibuka); transfer `paham` → benar di Ujian; sinyal bahaya
(berhenti ≤ 2 hari sesudah sesi dengan ≥ 5 salah).
USULAN ambang tinjau ulang: penyelesaian jujur turun > 5 poin atau tanda menebak naik > 5 poin sesudah mekanik dipasang.
Fungsi ukuran ditulis sebagai fungsi murni di modul yang sama dengan XP (2.2) dan dijalankan di server (SQL view atau
edge function terjadwal); hanya agregat yang ditampilkan ke pemilik, tidak per pengguna.

### 4A.8 Kelas tetap netral

Mekanik di 4A hanya di jalur mandiri *(riset 9, HMW-7 7a)*. Layar tugas tidak menampilkan XP, streak, kemahiran, soal
hari ini, saran, atau peringkat; yang tampil hanya aturan tugas (mode, batas percobaan, tenggat). Percobaan tugas tetap
memperbarui XP dan kemahiran pribadi (satu kali per soal) tanpa ditampilkan di layar tugas.

---

## 5. Kelas dan penugasan

Kelas berfungsi sebagai **LMS** untuk perkuliahan (arahan pemilik 2026-11-20). Dasar desain:
`riset-ux-kelas-lms-skala-soal-monetisasi-2026-11-20.md` (selanjutnya "riset kelas").

### 5.0 Keputusan

| # | Keputusan | Rujukan |
|---|---|---|
| KL1 | Gabung lewat **kode kelas** (7 karakter huruf+angka tanpa karakter mirip) dan **tautan undangan**; bisa direset dan dimatikan; opsional persetujuan pengajar. Undangan email menyusul (R7) | riset kelas HMW-1 |
| KL2 | **Kelas melekat pada satu periode** (label bebas + tanggal mulai/selesai). Lewat tanggal selesai → Arsip (bisa dibuka, tidak bisa diberi tugas baru). Pelajar boleh di banyak kelas; mengulang = kelas periode baru; tidak boleh dua kali di kelas yang sama | riset kelas HMW-2 |
| KL3 | Tugas boleh memakai **semua soal**: soal kurasi, **pola soal** (generator, R5), dan soal buatan pengajar dari kalkulator (hanya untuk kelasnya) | riset kelas HMW-3, 5 |
| KL4 | **Soal sama untuk semua** atau **berbeda per pelajar** (benih per pelajar), dipilih pengajar per tugas | riset kelas G3, 5b |
| KL5 | Pelajar melihat **Tugas lintas kelas** terurut tenggat, **nilai**, dan **pembahasan** sesuai waktu rilis yang dipilih pengajar | riset kelas M2, M4, HMW-6 |
| KL6 | Pengajar melihat **ringkasan per kolom** per tugas dan isian tiap pelajar; koreksi nilai beralasan | riset kelas HMW-4; audit 8c butir 5 |
| KL7 | **Sesi langsung** di ruang kelas: layar pengajar agregat tanpa nama, tanpa peringkat kecepatan (R6) | riset kelas HMW-5 |
| KL8 | Peran kelas: **pengajar**, **asisten**, **pelajar** (per kelas, terpisah dari peran portal) | riset kelas 1b; audit T5 |
| KL9 | **Lembaga** sebagai pemilik opsional kelas, disiapkan di skema sejak awal (kolom boleh kosong); paket dan hak akses lewat satu fungsi (R7) | riset kelas 6d |
| KL10 | Login hanya Google | keputusan pemilik |

### 5.1 Bentuk data

```sql
create table kelas (
  id uuid primary key default gen_random_uuid(),
  lembaga_id uuid references lembaga,                      -- boleh kosong; tabel lembaga menyusul (R7)
  nama text not null check (char_length(btrim(nama)) between 1 and 80),   -- mis. "Fiqh Mawaris A"
  periode_label text not null check (char_length(btrim(periode_label)) between 1 and 40),  -- mis. "Ganjil 2026/2027"
  periode_mulai date not null,
  periode_selesai date not null check (periode_selesai >= periode_mulai),
  kode_gabung text unique check (kode_gabung ~ '^[A-HJ-NP-Z2-9]{7}$'),   -- null = gabung dimatikan
  perlu_persetujuan boolean not null default false,
  dibuat_oleh uuid not null default auth.uid() references auth.users,
  dibuat_pada timestamptz not null default now()
);
-- Arsip = turunan (current_date > periode_selesai), bukan kolom yang bisa lupa diperbarui.

create table anggota_kelas (
  kelas_id uuid references kelas on delete cascade,
  user_id uuid references auth.users on delete cascade,
  peran text not null check (peran in ('pengajar', 'asisten', 'pelajar')),
  status text not null check (status in ('menunggu', 'aktif', 'keluar')),
  nomor_induk text check (char_length(nomor_induk) <= 30),   -- NIM/NIS opsional, hanya terlihat pengajar/asisten kelas itu
  bergabung_pada timestamptz not null default now(),
  primary key (kelas_id, user_id)
);

create table tugas (
  id uuid primary key default gen_random_uuid(),
  kelas_id uuid not null references kelas on delete cascade,
  judul text not null,
  butir jsonb not null,          -- ButirTugas[]; revisi dikunci saat diterbitkan
  kebijakan jsonb not null,      -- KebijakanTugas
  diterbitkan_pada timestamptz,  -- null = draf, tidak terlihat pelajar
  dibuat_oleh uuid not null default auth.uid() references auth.users
);

create table sesi_soal (         -- satu pelajar membuka satu butir tugas; benih dan jangkar dari server
  id uuid primary key default gen_random_uuid(),
  tugas_id uuid not null references tugas on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  indeks_butir int not null,
  soal_id text not null,         -- IdSoal yang benar-benar diberikan (benih per pelajar bila variasi)
  revisi_soal uuid not null,
  jangkar jsonb,
  benih_jangkar uuid not null,
  dibuat_pada timestamptz not null default now(),
  unique (tugas_id, user_id, indeks_butir)
);

create table koreksi_nilai (     -- append-only; nilai efektif = koreksi terakhir atau hasil server
  id uuid primary key default gen_random_uuid(),
  percobaan_id uuid not null references percobaan_soal,
  nilai_baru numeric not null check (nilai_baru between 0 and 1),
  alasan text not null check (char_length(btrim(alasan)) between 3 and 500),
  oleh uuid not null default auth.uid() references auth.users,
  pada timestamptz not null default now()
);
```

```ts
type ButirTugas =
  | { jenis: 'kurasi'; slug: string; revisi: string }
  | { jenis: 'pola'; slugPola: string; versi: number; benih: 'sama' | 'perPelajar'; benihSama?: string }
  | { jenis: 'buatan'; idSoalBuatan: string };   // dari kalkulator pengajar, hanya untuk kelasnya

interface KebijakanTugas {
  mode: 'latihan' | 'ujian';                // wajib; pelajar tidak bisa mengganti
  batasPercobaan: number | null;            // jumlah Kirim (Ujian) atau sesi soal (Latihan); null = bebas
  batasWaktuMenit: number | null;           // opsional; dihitung server sejak sesi_soal dibuat (D6)
  bobotTahapan: Record<string, number> | null;   // null = rata per tahapan (riset kelas 13d)
  nilaiTurunan: boolean;                    // error carried forward [KH]; bawaan false, menyusul
  mulai: string | null; tenggat: string | null;   // waktu server
  terlambat: 'tolak' | 'terima_ditandai';
  bobot: number[];                          // per butir (bawaan rata)
  ambilNilai: 'pertama' | 'terbaik' | 'terakhir';
  bolehLihatJawaban: boolean;               // Latihan saja; Lihat jawaban → nilai butir itu 0
  rilisNilai: 'segera' | 'sesudahTenggat' | 'manual';
  rilisPembahasan: 'segera' | 'sesudahTenggat' | 'manual';
}

type StatusTugasPelajar = 'belum' | 'sedang' | 'dikirim' | 'terlambat' | 'dinilai' | 'tertutup';
// statusTugas(kejadian, sesi, kebijakan, sekarangServer) — fungsi murni (riset kelas 7)
```

Istilah: kode dan UI memakai **tugas** (kosakata pengguna, riset kelas 1b); kata "penugasan" di bagian lain dokumen ini
berarti hal yang sama.

- **Revisi soal/pola dikunci saat diterbitkan.** *Alasan:* bila penulis menyunting soal di tengah penugasan, nilai pelajar
  pertama dan terakhir harus dihitung dari soal yang sama. Kunci = `susunTabelSoal(engine(revisi.kasus))` di versi engine
  saat dinilai; `versi.kunci` di kejadian menandai bila engine berubah di tengah jalan (pengajar diberi tahu, tidak
  dinilai ulang otomatis; P7).
- **Skor parsial** (keputusan pemilik D4; riset kelas 13d): sel = satu baris di satu kolom, ditambah kepala kolom;
  skor kolom = sel benar / sel dinilai (aturan sebanding B6); kolom dikelompokkan ke **tahapan** pipeline (soal biasa:
  Bagian → Asal masalah → Asal masalah akhir; jenis lain menambah pengali, jami'ah, kemungkinan, mauquf); skor butir =
  Σ bobot tahapan × rata-rata skor kolom tahapan itu. Pemetaan kolom → tahapan ditulis di `susunTabelSoal` (satu sumber).
  Berlaku untuk **Latihan dalam tugas** (semua kolom dinilai di belakang layar setiap Periksa, layar tetap berhenti di
  kolom pertama yang salah) dan **Ujian**.
- Nilai tugas = `nilaiTugas(kejadian, kebijakan)` murni: per butir, skor parsial dari kejadian yang dipilih
  (`pertama/terbaik/terakhir`) memakai **hasil_kolom_server**, dikali bobot butir, dijumlah. Lihat jawaban → butir 0
  kecuali `bolehLihatJawaban`. Pelajar melihat rincian per tahapan sesudah nilai dirilis.
- **Variasi per pelajar**: benih soal pola diturunkan server dari (tugas, pelajar, butir) dan disimpan di `sesi_soal`.
  Varian pola bisa berbeda tingkat kesulitan (riset kelas 5a); statistik per pola dari kejadian menandai pola yang
  variannya terlalu beragam supaya tim keilmuan meninjaunya.
- **Salin ke periode baru**: menyalin tugas sebagai draf ke kelas baru; butir pola memakai benih baru.
- **Ekspor rekap**: CSV/XLSX per kelas (nama tampilan, nomor induk bila diisi, nilai per tugas, nilai akhir), hanya
  pengajar/asisten.
- **Peran pengajar per kelas, bukan peran global.** Enum `peran` yang ada (`admin, penulis, reviewer`,
  `20260926000001_konten.sql:7`) milik portal konten; mencampur pengajar ke sana memberi pengajar akses portal lewat
  `peran_saya()`. *Keputusan:* `anggota_kelas.peran`, terpisah dari `peran_pengguna`.

### 5.2 Siapa melihat apa

**Asisten** melihat yang dilihat pengajar kelas itu (nilai, isian, ringkasan, nomor induk) dan boleh mengoreksi nilai,
tetapi tidak menghapus kelas, tidak mengubah kebijakan tugas yang sudah terbit, dan tidak mengelola anggota.
Pelajar melihat nilai dan pembahasan **miliknya** sesuai `rilisNilai`/`rilisPembahasan`.

| Data | Pelajar | Pengajar kelas itu | Pelajar lain | Admin portal |
|---|---|---|---|---|
| Kejadian mandiri (`id_penugasan` null) | milik sendiri | **tidak** | tidak | tidak (kecuali lewat service role untuk pemeliharaan) |
| Kejadian penugasan | milik sendiri | semua di penugasan kelasnya | tidak | tidak |
| Nilai penugasan | milik sendiri | semua anggota | tidak | tidak |
| XP, streak, peringkat | milik sendiri; papan publik sesuai profil | **tidak ada tampilan khusus** (sama seperti publik) | papan publik | sama |
| Kasus tersimpan, riwayat | milik sendiri | tidak | tidak | tidak |
| Daftar anggota | nama tampilan sesama anggota (P5) | nama + email anggota | – | – |

*Alasan:* pengajar hanya perlu data yang ia minta (penugasan). Latihan mandiri pelajar adalah ruang aman untuk salah;
bila pengajar bisa melihatnya, pelajar berhenti berlatih bebas.

RLS mengikuti pola `peran_saya()`: fungsi `security definer` `peran_di_kelas(kelas_id)` mengembalikan peran pemanggil,
dipakai kebijakan `percobaan_soal` (`select` bila `user_id = auth.uid()` atau
`id_penugasan` milik kelas tempat pemanggil pengajar). Fungsi ini **wajib** diuji pgTAP untuk: pelajar A tidak bisa
membaca pelajar B; pengajar kelas X tidak bisa membaca kelas Y; pengajar tidak bisa membaca kejadian mandiri.

### 5.3 Pemisahan XP dan nilai kelas

- XP: aturan bagian 3, dihitung dari semua kejadian (mandiri + penugasan), satu kali per soal.
- Nilai kelas: aturan penugasan, hanya kejadian ber-`id_penugasan`, hanya hasil server.
- Keduanya tidak pernah saling membaca. Pengajar tidak bisa memberi/mencabut XP; XP tidak masuk nilai.

### 5.4 Penilaian di server

- Edge function `nilai-percobaan`: menerima `{ idPercobaan, idPenugasan, soalId, isian, idSesiSoal }`. Ia:
  1. memeriksa keanggotaan, jendela waktu (`mulai`/`tenggat` terhadap `now()` server) dan `batasPercobaan`;
  2. memuat revisi soal yang dikunci di penugasan;
  3. menjalankan engine → `susunTabelSoal` → `nilaiSemuaKolom` dengan **jangkar yang tersimpan di server**;
  4. menulis baris `percobaan_soal` lengkap dengan `hasil_kolom_server` (klien tidak menulis langsung untuk penugasan).
- **Jangkar penugasan dipilih server** saat pelajar membuka soal (`mulai_sesi_soal(id_penugasan, slug)` → `{ idSesiSoal,
  jangkar }`), disimpan di tabel kecil `sesi_soal`. *Alasan:* jangkar memengaruhi penilaian (B5: jangkar menetapkan skala
  kolom); bila klien memilih, klien bisa memilih jangkar yang memudahkan. Acak server memakai `gen_random_uuid()` sebagai
  benih; benih disimpan sehingga `pilihJangkar(tabel, acakDariBenih(benih))` bisa diulang.
- Mandiri tetap dinilai di klien (luring jalan). Kejadian mandiri juga menyimpan isian + jangkar + versi, jadi bisa dinilai
  ulang server nanti (P6).
- Engine bisa berjalan di edge function karena murni, tanpa I/O/`Date`/`Math.random` (CLAUDE.md prinsip 1). **Tetapi**
  dua hal yang dibutuhkan server sekarang ada di `apps/web` dan menyentuh I/O: pemilihan orkestrator (`jalankan.ts`) dan
  `susunTabelSoal` yang mengimpor `format.ts`/`terjemah.ts` (diksi + preferensi `localStorage`). Lihat 6.2 dan audit T1.

### 5.4b Akses mode pengajar (keputusan pemilik D9; riset kelas 13c)

- Membuat kelas butuh status akun **pengajar terverifikasi**. Pengajuan lewat formulir "Ajukan akses pengajar" (nama,
  lembaga, jabatan/mata kuliah, tautan profil resmi, unggah surat keterangan atau kartu dosen); jalur cepat bila email
  Google berdomain lembaga mitra; **admin portal meninjau** (Menunggu/Disetujui/Ditolak + alasan). Paket Lembaga (P6):
  admin lembaga menyetujui pengajarnya sendiri.
- Asisten tidak perlu verifikasi; diundang pengajar per kelas.
- Dokumen di penyimpanan privat (hanya peninjau), dihapus 30 hari sesudah keputusan (USULAN); yang tersisa hanya status,
  peninjau, dan waktu. Persetujuan pemrosesan diminta di formulir (audit 9c).
- Status pengajar terpisah dari `anggota_kelas.peran` dan dari `peran_pengguna` portal (audit T5).

```sql
create table pengajuan_pengajar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lembaga text not null, jabatan text not null, tautan_profil text,
  berkas_path text,              -- objek di bucket privat; dihapus 30 hari sesudah diputuskan
  status text not null default 'menunggu' check (status in ('menunggu', 'disetujui', 'ditolak')),
  alasan text, ditinjau_oleh uuid references auth.users, ditinjau_pada timestamptz,
  dibuat_pada timestamptz not null default now()
);
-- Pengajar boleh membuat kelas bila ada baris 'disetujui' miliknya (fungsi boleh_membuat_kelas()).
```

### 5.4c Data untuk memilih perlakuan (keputusan pemilik D10; riset kelas 13a)

Konsep inti: pengajar **diberi data dan statistik yang bisa ditindaklanjuti** untuk memilih perlakuan yang tepat.

| Lapis | Isi | Fase |
|---|---|---|
| Data per tugas | status kiriman, skor per tahapan/kolom, isian tiap pelajar | P4 |
| Tingkat tiap pelajar | matriks pelajar × topik (kemahiran, 4A.3) dari kejadian tugas; ringkasan per pelajar "{n} topik tingkat 3 · {m} tingkat 2 · {k} tingkat 1 dari {t} topik yang ditugaskan"; tren per pekan | P4c |
| Kelompok kesalahan | pelajar dikelompokkan menurut kolom/topik yang sama-sama salah | P4c |
| Rekomendasi perlakuan | per kelompok: materi, tugas susulan dari pola sama, soal untuk sesi langsung; diterapkan pengajar dengan satu langkah; tiap saran menampilkan alasannya | P7 (roadmap akhir) |

Aturan: berbasis aturan yang terbaca, pengajar yang memutuskan (UU PDP Pasal 10), sumber data bawaan hanya tugas kelas
itu, kemajuan mandiri ikut **hanya dengan izin pelajar per kelas**, tanpa label bernada vonis.

### 5.5 Privasi, akun, luring

- Kelas wajib akun (Google, seperti sekarang). Tanpa akun tidak ada kelas.
- **Syarat keamanan dan UU PDP yang mengikat bagian ini** ada di audit bagian 8c (anti-IDOR, nilai append-only dengan
  `koreksi_nilai`, batas percobaan tahan balapan, idempoten, waktu dan jangkar dari server, batas laju, kode gabung) dan
  9c (persetujuan terekam, data anak, retensi, hapus akun/unduh data, DPIA). Keduanya kriteria terima P3–P4.
- Penugasan diperlakukan *open book*: aplikasi ini juga kalkulator, jadi kunci selalu bisa diturunkan di perangkat
  (audit 8c butir 12). Layar pembuatan tugas memberi tahu pengajar.
- Pengajar melihat email anggota hanya di kelasnya (butuh untuk mencocokkan siswa); pelajar sesama anggota hanya nama
  tampilan. Email tidak masuk ke tabel kelas; dibaca lewat fungsi `security definer` yang memeriksa peran pengajar (pola
  `daftar_peran`).
- Keluar kelas: keanggotaan dihapus; kejadian penugasan tetap ada untuk nilai pengajar (P5). Hapus akun: kaskade
  `on delete cascade` menghapus semuanya, seperti tabel lain.
- Data pelajar di bawah umur mungkin ikut (madrasah/pesantren). USULAN: minimalkan data (nama tampilan + email Google),
  tanpa nomor induk/kelas sekolah; kebijakan privasi diperbarui sebelum kelas dibuka (P8).
- **Luring untuk penugasan**: membuka dan mengisi boleh luring (isian disimpan lokal per sesi), **Kirim** butuh daring.
  Bila Kirim dilakukan luring: isian masuk antrean dengan status "menunggu dinilai"; server menilai saat terkirim dan
  memakai **waktu terima server** untuk tenggat. *Alasan:* jam perangkat tidak bisa dipercaya untuk tenggat; pelajar
  diberi tahu di layar bahwa kiriman belum sampai (`Belum terkirim, akan dikirim saat tersambung`).

---

## 6. Kontrak komponen UI dan perubahan yang dikerjakan **sekarang**

### 6.1 Kontrak keluaran komponen tabel

```ts
interface PercobaanTabel {
  mode: 'latihan' | 'ujian';
  aksi: 'periksa' | 'kirim' | 'lihatJawaban';
  isian: IsianTabel;
  jangkar: Jangkar | null;
  hasilKolom: HasilKolom[];       // hasil SEMUA kolom (nilaiSemuaKolom), apa pun modenya
  benarSemua: boolean;
}
// Props TabelLatihan:
//   mode, jangkar (diberikan dari luar), saatPercobaan(p: PercobaanTabel) => void, terbuka, terkunci
```

- **Jangkar diberikan dari luar** (prop), tidak lagi dibuat di komponen (`useState(() => pilihJangkar(tabel,
  Math.random))`, `TabelLatihan.tsx:39`). *Alasan:* untuk penugasan jangkar datang dari server; untuk mandiri pemanggil
  (Hasil) memilihnya sekali per sesi soal dan mencatatnya.
- `saatPercobaan` menggantikan `saatMencoba` + `saatBenar`. Hasil (layar) yang memutuskan XP, confetti, dan pencatatan,
  memakai fungsi murni bagian 2.2.
- Lihat jawaban: dialog tahan tetap milik Hasil; sesudah dikonfirmasi Hasil memanggil `saatPercobaan` dengan
  `aksi: 'lihatJawaban'` dan isian saat itu.

### 6.2 Perubahan kecil sekarang (sebelum jenis soal lain dibangun)

| # | Perubahan | Kenapa sekarang |
|---|---|---|
| S1 | `nilaiTabel` → `nilaiSemuaKolom` + `putusanLatihan` (1.2); `nilaiTabel` tetap sebagai pembungkus | Tiap jenis soal baru menambah kolom; lebih murah memisah sebelum ada 7 jenis |
| S2 | `susunTabelSoal`/`nilaiSemuaKolom` tidak mengimpor `format.ts`/`terjemah.ts`: nama orang dan `angkaLatin` dioper dari luar (`namaDari: (id) => string`), atau nama diisi oleh komponen | Membuat modul penilaian murni dan bisa dipindah ke paket bersama untuk server (audit T1). `angkaLatin` cukup disalin ke modul (fungsi kecil murni) atau dipindah ke `@waris/math`/paket bersama |
| S3 | Jangkar jadi prop; `TabelLatihan` mengeluarkan `PercobaanTabel` lewat `saatPercobaan` (6.1) | Jenis soal lain akan meniru kontrak ini; mengubah 1 komponen sekarang lebih murah daripada 7 nanti |
| S4 | Hasil menyimpan kejadian lokal (`arif-waris:percobaan`) dengan `soalId` (format `IdSoal`, siap untuk soal pola), `revisiSoal`, `jenisSoal`, `versi`; antrean entri `percobaan` (berkunci id) | Data yang terkumpul mulai sekarang sudah bisa dinilai ulang; tidak perlu migrasi nanti |
| S5 | `catatLatihan` tidak menimpa `benar: true` dengan `false`; Lihat jawaban dicatat walau belum pernah mencoba | Memperbaiki T3/T4 di sisi klien sekarang; status daftar soal benar |
| S6 | `versi.engine` dari versi paket saat build (bukan `VERSI_KB` tetap) | Tanpa ini, versi di kejadian tidak bermakna (T9) |

Tabel `percobaan_soal` dan perubahan fungsi XP SQL boleh menyusul (S4 sudah menyimpan lokal dan mengantre; entri antrean
menunggu sampai repositori punya `simpanPercobaan`). Bila menunggu terlalu lama, batasi antrean `percobaan` agar tidak
membengkak di localStorage (500 entri terakhir).

### 6.3 Adaptor untuk `KartuTebak` lama

Selama `KartuTebak` masih dipakai soal yang belum pindah ke tabel, `saatMencoba/saatBenar/saatLihatJawaban`-nya
dibungkus Hasil menjadi kejadian dengan `isian: null`, `hasilKolom: null`, `mode: 'latihan'`. Tidak ada perubahan di
komponen lama.

---

## 7. Urutan pengerjaan

| Fase | Isi | Prasyarat |
|---|---|---|
| **P0 (sekarang)** | S1–S6; mode Latihan saja; XP masih lewat `log_kegiatan` seperti sekarang ditambah perbaikan klien S5 | – |
| **P1** | Tabel `percobaan_soal` + RLS + pgTAP; repositori `simpanPercobaan`/`bacaPercobaan`; `gabung` kejadian per id; fungsi XP SQL membaca `percobaan_soal` (aturan bagian 3, bobot dari revisi); `bobotXp` di skema + form portal | P0; perbaiki T2 (log_kegiatan bisa dipalsukan) sekaligus |
| **P2** | Mode Ujian (mockup dulu), rekor Ujian dari kejadian; umpan kolom benar (K12); saran belajar + soal serupa (4.4, 4A.2) | P0; hitung soal per topik |
| **P2b (keterlibatan)** | Kemahiran per topik (4A.3), soal hari ini (4A.4), saran kesulitan (4A.5); fungsi ukuran keberhasilan (4A.7) | P1 (kejadian di server), mockup disetujui |
| **P3 (fondasi kelas)** | Paket bersama penilaian (engine dispatcher + tabel latihan) yang bisa diimpor web dan edge function; edge function `nilai-percobaan`; `sesi_soal` (jangkar server) | P1, audit T1 |
| **P4 (kelas inti, R4)** | `kelas` (periode), `anggota_kelas`, `tugas`, `sesi_soal`, `koreksi_nilai`, `peran_di_kelas()`, RLS + pgTAP lintas peran (audit 8c); pengajar: buat kelas, kode/tautan, tugas dari soal kurasi, pantau, ringkasan per kolom, koreksi, rilis, ekspor; pelajar: gabung, Tugas lintas kelas, kerjakan, nilai, arsip | P3, audit R0 (K1, UU PDP dasar) |
| **P4b (pola soal, R5)** | Pola soal + `bangkitkanSoal`/`verifikasiSoal` di paket bersama; katalog pola; variasi per pelajar; tinjauan pola di portal | P3; tim keilmuan menulis pola |
| **P4c (R6)** | Sesi langsung (Realtime), asisten, salin ke periode baru | P4 |
| **P5 (opsional)** | Nyawa untuk mode Tantangan, bila pemilik tetap menginginkan sesudah melihat saran belajar | P3 |
| **P6 (R7)** | Lembaga, admin lembaga, paket dan `hakFitur()`, pembayaran lewat gerbang (halaman bayar penyedia), invoice, DPA, undangan email | P4; keputusan model monetisasi |
| **P7 (R8)** | Alat ukur keberhasilan: dasbor internal ukuran belajar (4A.7) + ukuran bisnis | P1 (data sejak awal) |
| **P8 (R9)** | Ticketing dan dukungan dalam aplikasi, basis pengetahuan, halaman status | P6 |

Roadmap lengkap dan alasannya: riset kelas bagian 8.

---

## 8. Pertanyaan terbuka untuk pemilik

1. **Nama mode**: setuju "Latihan" dan "Ujian" (sama dengan Kuis konsep), bukan "Kuis"?
2. **Mockup Ujian**: boleh dibuat mockup tab "Ujian" di `mockup-tabel-faraidh-final.html` (tombol Kirim, dialog kotak
   kosong, tampilan sesudah kirim dengan skor kolom) sebelum dibangun?
3. **Bobot XP**: setuju angka USULAN di 3.2 (biasa tetap 10/20/30; haml [SYF] 70, [HNB] 90, dst.)?
4. **Nyawa**: setuju ditunda dan diganti saran belajar tanpa kunci (4.4)? Bila tidak, setuju dibatasi ke mode Tantangan
   daring saja?
5. **Kelas**: siapa boleh membuat kelas: siapa pun yang login, atau hanya akun yang diberi izin admin? Dan apakah
   pelajar sesama kelas boleh melihat nama satu sama lain?
6. **Latihan mandiri dinilai server juga** (supaya XP tidak bisa dipalsukan, T2), atau cukup penugasan saja? Yang
   pertama membuat XP jujur tetapi mewajibkan daring untuk mendapat XP.
7. **Engine berubah di tengah penugasan** (kunci berbeda): nilai dibiarkan dengan kunci lama dan pengajar diberi tahu
   (usulan), atau dinilai ulang otomatis?
8. **Pengguna di bawah umur**: apakah kelas akan dipakai madrasah/pesantren dengan murid di bawah 17 tahun? Bila ya,
   perlu persetujuan wali dan pembaruan kebijakan privasi sebelum P4.
9. ~~Latihan di penugasan~~ → **diputuskan**: skor parsial per sel/kolom/tahapan (D4).
10. ~~Ujian parsial~~ → **diputuskan**: Ujian memberi XP parsial dengan batas `bobotXp` (3.1 butir 5) dan nilai parsial.

Pilihan keterlibatan (riset bagian 10; mockup menyusul di sesi lain sesudah dipilih):

11. **Umpan "hampir"** (O1): tandai kolom yang sudah benar saat Latihan salah (usulan), atau biarkan seperti B6?
12. **Sesudah jawaban dibuka** (O2): tautan soal serupa + materi (usulan), atau materi saja?
13. **Nama tiga tingkat kemahiran**: "Paham/Kuasai" ditolak (D5). Pilih dari riset kelas 13e: T1 Mulai · Bisa · Mahir
    (usulan), T2 Mubtadi' · Mutawassith · Muntahi, T3 bintang 0–3, T4 Perlu latihan · Cukup · Kuat, T5 bilah bukti.
14. **Tantangan harian** (O4): soal hari ini tanpa bonus XP (usulan), atau dengan bonus kecil (mis. 5 XP)?
15. ~~Batas waktu~~ → **diputuskan**: opsional per tugas oleh pengajar; di mandiri pelajar boleh memasang sendiri (D6).

Kelas, skala soal, dan monetisasi (riset kelas bagian 10):

16. **Cara gabung** (O1): kode + tautan sekarang, undangan email nanti?
17. **Periode** (O2): kelas melekat pada satu periode dengan arsip otomatis?
18. **Variasi soal per pelajar** (O4): pilihan pengajar per tugas?
19. **Sesi langsung** (O5): tanpa peringkat kecepatan, agregat tanpa nama di proyektor?
20. **Monetisasi** (O6): publik dan pengajar dasar gratis; Pengajar Pro per semester; Lembaga per pelajar aktif per
    semester; tanpa iklan? Angka harga diuji dulu ke pengajar dan kaprodi.
21. **Nama peran** (O7): Pengajar / Asisten / Pelajar untuk semua jenjang?

Status 2026-11-20 malam: pertanyaan 16–21 disetujui sesuai usulan (riset kelas D1), dengan Pengajar Gratis maksimal
20 pelajar (D2).

22. **Retensi dokumen verifikasi pengajar**: 30 hari sesudah keputusan cukup?
23. **Bobot tahapan bawaan**: rata per tahapan (usulan), atau ditetapkan per jenis soal oleh tim keilmuan?
24. **Lencana yang diperlihatkan ke pengajar**: hanya bila pelajar memilih per kelas (usulan), atau selalu?
