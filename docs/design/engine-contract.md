# Engine Contract — Faraidh Engine [SYF]

Status: disepakati (desain A + B). Simpan di `docs/design/engine-contract.md`.
Semua rujukan bab/kode `[Rxx-y]` mengacu ke `docs/kb/`.

---

## 1. Cakupan per fase

| Fase | Cakupan | Bab KB |
|---|---|---|
| 1 | Tirkah, mawani', ahli waris, hajb, furudh, ashabah, 'Umariyyatain, Musyarrakah, jadd wal ikhwah, ashl, 'aul/radd, tashih, nominal, takharuj | 01–11 |
| 2 | Munasakhat; haml, mafqud, khuntsa, gharqa, murtad, li'an/zina, laqith (status `MAUQUF`) | 12, 13 |
| 3 | Dzawil arham (tanzil) | 14 |
| 4 | Ruleset KHI (terpisah, ditandai hukum positif) | `docs/kb-khi/` |

Edukasi: (a) pembahasan per kasus dari trace + dalil; (b) modul belajar per bab + glosarium + kuis
(kunci jawaban dihitung oleh engine).

---

## 2. Algoritma (pipeline)

### Tahap 0 — Tirkah (bab 01)
Keluarkan hak 'ain tirkah → biaya jenazah → hutang → wasiat (≤ 1/3). Hasil: harta yang dibagi.

### Tahap 1 — Ahli waris
- **1a Derivasi peran** dari graf: telusuri jalur tiap orang ke pewaris → `KunciAhliWaris` + `darajah` (bab 3.1–3.2).
  Jalur lewat perempuan pada garis ke bawah → `DZAWIL_ARHAM` (bab 14).
- **1b Mawani'** (bab 02): 5 penghalang [SYF]; pembunuhan semua bentuk.
- **1c Hajb hirman** (6.4–6.5), dari hajib terkuat; catat `hajib` + kaidah.
- **1d Hajb nuqshan**: dicatat; yang mahjub tetap dihitung untuk nuqshan ibu (6.7 no. 3).
- Data kurang → `PERLU_INPUT`.

### Tahap 2 — Bagian per kelompok
Fardh (bab 04) + syaratnya; ashabah (bab 05): bi nafsihi / bil ghair / ma'al ghair,
urutan jihah → darajah → quwwah → isytirak. Deteksi kasus khusus bab 07 dan bab 08 (algoritma 8.6).

### Tahap 3 — Ashlul mas'alah (9.1)
- Semua ashabah → jumlah ru'us (lk = 2, pr = 1) [R09-2].
- Satu fardh → makhraj.
- Beberapa fardh → bandingkan penyebut dengan nisab arba' (`PERBANDINGAN_NISAB`, purpose `ashl`);
  cocokkan dengan tabel kelompok A/B 9.1 sebagai assertion.
- 18 dan 36 hanya di bab jadd [R09-1].

### Tahap 4 — Klasifikasi (9.2)
- Σ = ashl → `adilah`.
- Σ > ashl → `ailah`, 'aul (validasi [R09-4]).
- Σ < ashl, tanpa ashabah → radd (9.4):
  - `raddA` tanpa pasangan: ashl = Σ saham ahli radd.
  - `raddB` ada pasangan: zawjiyyah + raddiyyah; bandingkan sisa vs ashl radd (habis / tawafuq / tabayun).
- Tak ada ahli radd selain pasangan → dzawil arham (fase 3; sebelumnya `TIDAK_DIDUKUNG`).
- Dikendalikan `kebijakanSisa`.

### Tahap 5 — Tashih (bab 10)
Per kelompok: saham vs ru'us → habis / tawafuq (simpan wafq ru'us) / tabayun (simpan ru'us).
Gabung 2–4 simpanan dengan nisab arba' → juz' as-sahm. Tashih = ashl × juz'.

> **Implementasi** [R10-2]: langkah "saham vs ru'us per kelompok" BUKAN `nisab()` generik dari
> `packages/math` — itu fungsi tersendiri di `packages/engine` (habis / tawafuq / tabayun saja, tanpa
> tadakhul), karena arahnya searah (habis = ru'us membagi saham) dan nilai yang disimpan (wafq ru'us /
> ru'us) beda dari `result` (KPK) milik `nisab()`. Contoh pembeda: `nisab(2n, 4n)` = tadakhul, result 4;
> tapi bab 10.3(b) (ibu, 4 paman: saham paman 2 vs ru'us 4) = **tawafuq**, simpan **2** (wafq ru'us).
> `nisab()` generik tetap dipakai apa adanya untuk: ashl dari beberapa fardh (9.1), radd vs sisa (9.4),
> dan gabung simpanan antar 2–4 kelompok (10.3.4) — semua itu perbandingan dua bilangan sejajar yang
> memang butuh tadakhul.

### Tahap 6 — Pembagian
Saham individu = saham kelompok × juz' ÷ ru'us; validasi 10.5; nominal = saham ÷ tashih × harta,
dibulatkan ke bawah per orang ke kelipatan `unit`, sisa dilaporkan sebagai selisih pembulatan.

```ts
interface KonfigurasiPembulatan {
  satuan: bigint; // 1n = rupiah penuh, 100n = ratusan, 1000n = ribuan — input dari pengguna
}
```

- `unit` dipilih pengguna sesuai cara penyerahan harta: tunai tidak mungkin dibayar sampai satuan
  rupiah (mis. 46.666.666), transfer bank bisa. UI menawarkan 1 / 100 / 1000; engine menerima `bigint > 0`.
- `unit ≤ 0` → `PERLU_INPUT` (field `rounding`).
- Nominal per orang = floor(saham ÷ tashih × harta ÷ unit) × unit. Selisih = harta − Σ nominal
  (bisa sampai (jumlah ahli waris × unit) − 1); tidak dibagikan diam-diam.
- `unit` bukan khilaf fikih → bukan bagian `KonfigurasiMadzhab`.
- Lapis penjelasan (`packages/explain`) wajib memberi tahu pengguna: besar selisih pembulatan, bahwa
  selisih itu tetap milik ahli waris dan perlu disepakati penyalurannya, dan bahwa pembagian bisa pas
  sampai rupiah terakhir bila diserahkan lewat transfer bank (`unit = 1`).

---

## 3. Model data

```ts
type IdOrang = string;

interface Orang {
  id: IdOrang;
  nama?: string;
  jenisKelamin: 'L' | 'P';                    // khuntsa → fase 2
  idAyah?: IdOrang;
  idIbu?: IdOrang;
  statusHidup: 'hidup' | 'wafat' | 'tidakDiketahui';
  agama: 'islam' | 'nonIslam' | 'tidakDiketahui';
  membunuhPewaris?: boolean;          // [SYF] semua bentuk (bab 02)
  penghubung?: boolean;           // node penghubung buatan sistem
}

interface Pernikahan {
  idSuami: IdOrang;
  idIstri: IdOrang;
  status: 'utuh' | 'talakRajiIddah' | 'talakBain';
  talakSaatMaradh?: boolean;
}

interface GrafKeluarga {
  idPewaris: IdOrang;
  orang: Record<IdOrang, Orang>;
  pernikahan: Pernikahan[];
}
```

Jenis saudara/paman diturunkan dari kesamaan `idAyah`/`idIbu`, tidak pernah diinput langsung.

```ts
type KunciAhliWaris =
  | 'ANAK_LK' | 'CUCU_LK' | 'AYAH' | 'KAKEK' | 'SAUDARA_KANDUNG' | 'SAUDARA_SEBAPAK' | 'SAUDARA_SEIBU'
  | 'KEPONAKAN_KANDUNG' | 'KEPONAKAN_SEBAPAK' | 'PAMAN_KANDUNG' | 'PAMAN_SEBAPAK' | 'SEPUPU_KANDUNG' | 'SEPUPU_SEBAPAK'
  | 'SUAMI' | 'MUTIQ'
  | 'ANAK_PR' | 'CUCU_PR' | 'IBU' | 'NENEK_DARI_IBU' | 'NENEK_DARI_AYAH'
  | 'SAUDARI_KANDUNG' | 'SAUDARI_SEBAPAK' | 'SAUDARI_SEIBU' | 'ISTRI' | 'MUTIQAH';   // bab 3.1–3.2

interface PeranAhliWaris {
  idOrang: IdOrang;
  kunci: KunciAhliWaris | 'DZAWIL_ARHAM' | 'BUKAN_AHLI_WARIS';
  kekerabatan: PosisiKekerabatan;
  lintasan: IdOrang[];
}

// Posisi kekerabatan relatif ke mayit, diturunkan dari graf (tidak diinput).
// Dipakai untuk urutan ashabah bab 5.3 (jihah → darajah → quwwah) dan urutan tanzil bab 14.5.
interface PosisiKekerabatan {
  generasiLeluhur: number;   // generasi leluhur bersama: 0 = mayit sendiri, 1 = ayah/ibu, 2 = kakek/nenek, 3 = buyut ...
  kedalamanKeturunan: number;         // turun berapa generasi dari leluhur bersama itu ke orang ini
  jalur: 'kandung' | 'sebapak' | 'seibu';   // di titik percabangan: kandung / sebapak / seibu (quwwah, bab 5.3)
  lewatPerempuan: boolean;       // ada perempuan di jalur (selain awlad al-umm) → calon dzawil arham (bab 14.2)
}

type StatusOrang =
  | { jenis: 'ahliWaris'; peran: PeranAhliWaris }
  | { jenis: 'mahjub'; peran: PeranAhliWaris; oleh: IdOrang[]; rujukanAturan: RefCode }        // peran: untuk narasi jelaskan
  | { jenis: 'mamnu'; peran: PeranAhliWaris; mani: 'qatl' | 'ikhtilafDin' | 'riqq' | 'istibham' | 'daur'; rujukanAturan: RefCode }
  | { jenis: 'bukanAhliWaris'; alasan: string; rujukanAturan?: RefCode };
```

Contoh `PosisiKekerabatan` (generasiLeluhur, kedalamanKeturunan):

| Orang | Koordinat | Jihah [SYF] (bab 5.3) |
|---|---|---|
| Anak lk / cucu lk | (0,1) / (0,2) | Bunuwwah |
| Ayah / kakek | (1,0) / (2,0) | Ubuwwah / Juduwwah |
| Saudara lk | (1,1) | Ukhuwwah (sejajar kakek, bab 08) |
| Anak / cucu saudara lk | (1,2) / (1,3) | Bani al-Ikhwah |
| Paman / anak paman | (2,1) / (2,2) | 'Umumah (paman mayit) |
| Paman ayah / anak paman ayah | (3,1) / (3,2) | 'Umumah (paman ayah) |
| Paman kakek | (4,1) | 'Umumah (paman kakek) |

Aturan urutan yang diturunkan dari koordinat:
- **Ukhuwwah vs Bani al-Ikhwah**: `generasiLeluhur` sama (1); `kedalamanKeturunan` lebih kecil didahulukan
  (darajah), baru `lineage` full > paternal (quwwah). Karena itu anak lk saudara kandung (1,2,full)
  kalah dari saudara lk sebapak (1,1,paternal) [bab 5.3 "konsekuensi penting"].
- **'Umumah**: `generasiLeluhur` lebih kecil didahulukan dulu (paman mayit beserta anak-anaknya
  sebelum paman ayah), baru `kedalamanKeturunan`, lalu `lineage` [bab 5.3 (1)–(3)].
- `lineage: 'maternal'` pada hawasyi → saudara seibu (fardh, bab 4.9) atau dzawil arham
  (paman seibu, anak saudara seibu; bab 14.2).
- Dzawil arham (khal, khalah, 'ammah, saudara nenek, dst.) memakai koordinat yang sama untuk tanzil fase 3.

Kedalaman graf tidak dibatasi; leluhur yang tidak diisi pengguna dibuat sebagai placeholder.

Angka: `Fraction` (bigint, immutable, branded), `Money = bigint`, saham/ashl = `bigint`.

### Konfigurasi

```ts
type Ruleset = 'syafii';               // 'khi' ditambahkan fase 4

interface KonfigurasiMadzhab {              // internal Syafi'iyyah saja; UI: "pengaturan lanjutan"
  kebijakanSisa: 'radd' | 'baitulMal';           // default 'radd'   [R09-8] [R14-5]
  talakBainSaatMaradh: 'qaulJadid' | 'qaulQadim';  // default 'qaulJadid' [R02-3]
}
```

Khilaf antar-madzhab lain di KB = hardcoded [SYF] + anotasi rujukan.
Setiap tahap menerima `ruleset` sebagai parameter (colokan untuk KHI).

### Mode input daftar cepat ⇄ pohon
- Daftar = tampilan dari graf, bukan data terpisah.
- Daftar → graf: tiap baris punya templat jalur tetap; placeholder (ayah, anak lk wafat, dsb.) dipakai bersama.
- Graf → daftar: derivasi peran (1a) lalu agregasi per baris.
- Jika round-trip graf → daftar → graf tidak identik → tampilkan banner
  "Kasus Anda cukup rumit, lihat versi pohon keluarga (direkomendasikan)"; baris terkait read-only di daftar.

---

## 4. Kontrak output

```ts
type HasilEngine =
  | { status: 'PERLU_INPUT'; pertanyaan: Pertanyaan[] }
  | { status: 'TIDAK_DIDUKUNG'; alasan: string; refs: RefCode[] }
  | { status: 'OK';
      statusOrang: Record<IdOrang, StatusOrang>;
      tabel: TabelMasalah;
      jejak: LangkahJejak[];
      pembulatan: { satuan: bigint; sisaPembulatan: Money };
      ruleset: Ruleset; konfigurasi: KonfigurasiMadzhab; versiKb: string };
// fase 2: tambah { status: 'MAUQUF'; scenarios: ...; held: ... }
```

```ts
type Nisab = 'tamatsul' | 'tadakhul' | 'tawafuq' | 'tabayun';

type LangkahJejak = { tahap: Tahap; refs: RefCode[] } & (
  | { jenis: 'MANI'; idOrang: IdOrang; mani: string }
  | { jenis: 'HAJB_HIRMAN'; mahjub: IdOrang; hajib: IdOrang[] }
  | { jenis: 'HAJB_NUQSHAN'; terdampak: IdOrang; dari: Fraction; menjadi: Fraction; penyebab: IdOrang[] }
  | { jenis: 'FARDH'; kelompok: IdKelompok; fardh: Fraction; alasan: AlasanFardh }
  | { jenis: 'ASHABAH'; kelompok: IdKelompok; jenisAshabah: 'binNafsi' | 'bilGhair' | 'maalGhair'; pilihanJadd?: ... }
  | { jenis: 'KASUS_KHUSUS'; nama: 'umariyyatain' | 'musyarrakah' | 'akdariyyah' | 'muaddah' }
  | { jenis: 'TIRKAH'; kotor; tajhiz; hutang; wasiatDiminta; wasiatBatas; wasiatDipakai; wasiatButuhIjazah; bersih }
  // ashl & juzSahm: nisab arba' penuh (10.2). inkisar & raddVsSisa: hanya FPB → 'habis' | 'tawafuq' | 'tabayun' (9.4, 10.3).
  | { jenis: 'PERBANDINGAN_NISAB'; tujuan: 'ashl' | 'raddVsSisa' | 'inkisar' | 'juzSahm'; kelompok?: IdKelompok;
      a: bigint; b: bigint; hubungan: Nisab | 'habis'; fpb: bigint; hasil: bigint }
  | { jenis: 'KELAS_MASALAH'; kelas: 'adilah' | 'ailah' | 'raddA' | 'raddB'; jumlahSaham: bigint; ashl: bigint }
  | { jenis: 'AUL'; dari: bigint; menjadi: bigint }
  | { jenis: 'RADD'; zawjiyyah?: { kelompok; ashl; sahamPasangan; sisa }; raddiyyah: { saham; ashl }; hasil: bigint }
  | { jenis: 'TASHIH'; dasar: bigint; juzSahm: bigint; hasil: bigint }
  | { jenis: 'DISTRIBUSI'; idOrang: IdOrang; saham: bigint; dariTashih: bigint; besaran: Uang }
);
```

```ts
interface TabelMasalah {
  kolom: Array<'fardh' | 'ashl' | 'aul' | 'radd' | 'tashih' | 'perOrang' | 'nominal'>; // dinamis
  totalKolom: Partial<Record<'ashl' | 'aul' | 'radd' | 'tashih', bigint>>;                  // penyebut tiap kolom
  baris: Array<{ kelompok: IdKelompok; anggota: IdOrang[];
                fardh?: Fraction; ashabah?: boolean; sel: Record<string, bigint>;    // saham kelompok per kolom
                perOrang: Record<IdOrang, { saham: bigint; nominal: Money }> }>;     // kelompok 2:1 → beda per orang
  dikecualikan: IdOrang[];   // mahjub/mamnu, tampil dengan alasan
}

interface RefEntry {       // packages/content, dibangun dari tabel "Dasar dan Rujukan" KB bab 01–14, 16
  kode: RefCode; bab: number;
  claim: string;
  jenis: string;           // kolom Jenis apa adanya ("Q + RDH", "H (dha'if)", "—")
  types: Array<'Q' | 'H' | 'A' | 'IJ' | 'RDH' | 'KH'>;   // jenis gabungan dipecah
  source: string;
  kutipan: string;
  arab: string[];          // teks «…» dari kolom Kutipan — teks Arab dari KB, bukan dari luar
  status: 'verified' | 'needsVerification';   // tercantum di tabel bab 17.4
  dhaif: boolean;
}
// dalilFor(line.refs) → { entries: DalilView[] (label jenis, sumber, teks Arab, peringatan), notes }
// Peringatan: KH saja → "kaidah hisab, bukan dalil syar'i"; 17.4 → belum dicek; dha'if; "—" → bukan dalil.
// Baris tanpa refs / kode tak ada di KB → notes.
```

**Trace = data, bukan kalimat.** Alasan setiap keputusan disimpan terstruktur (`AlasanFardh`: kode + id
orang penyebab + angka pembanding, lihat `packages/engine/src/types.ts`), mis.
`{ kode: 'ADA_FARU_WARITS', by: ['D1'] }` atau `{ kode: 'JADD_WAL_IKHWAH', options: [...], chosen }`.
Setiap perbandingan angka (ashl, radd, inkisar, juz' as-sahm) wajib memancarkan `PERBANDINGAN_NISAB` —
termasuk yang hasilnya habis/tamatsul — supaya `explain` bisa menulis "diketahui 2 dan 4 → tadakhul →
ambil yang besar". Teks bebas di trace dilarang.

`packages/explain` (`explain(result, graph, { mode })`) menghasilkan lapis 2 sebagai langkah → baris → potongan
berjenis: `text`, `person` (sebutan orang; id internal tidak pernah tampil), `term` (id glosarium bab 15 + contoh dari
kasus itu, untuk tooltip bergaris bawah) — plus `refs` per baris untuk lapis 3 (dalil, `packages/content`).
- Mode `cerita` (default, awam): masalahnya → caranya → istilahnya → hasilnya. Mode `ringkas`: istilah dulu, angka.
- Nama opsional: bernama → "Fatimah (anak perempuan)" lalu "Fatimah"; tanpa nama → "anak perempuan", atau
  "anak perempuan kedua" bila berbilang; seluruh anggota satu peran → "kedua anak perempuan". Nama berubah → panggil
  `explain` lagi (murah, tanpa engine).
- Tooltip mengambil `artiAwam` glosarium (`@waris/content`, dibaca langsung dari KB bab 15).

Output ke pengguna = 3 lapis dari trace yang sama:
1. **Tabel mas'alah** (kolom 'aul/radd/tashih muncul hanya bila terjadi; yang mahjub tetap tampil).
2. **Langkah perhitungan** (narasi `explain`, lengkap label nisab & klasifikasi).
3. **Dalil per langkah**; `KH` dilabeli "kaidah hisab, bukan dalil syar'i"; `needsVerification` diberi peringatan;
   langkah tanpa rujukan KB ditandai "rujukan belum tersedia".

> **Catatan untuk fase UI (belum dikerjakan sekarang):** istilah teknis di kode/trace tetap
> transliterasi baku (bab 15), tapi lapis 2–3 di atas untuk pengguna awam butuh padanan bahasa
> sehari-hari per istilah (`ashl` → "penyebut bersama", `mahjub` → "terhalang karena …"), istilah
> aslinya tetap ditampilkan berdampingan. Ini pekerjaan `packages/explain`, bukan glosarium mentah,
> dan idealnya diuji ke pengguna awam sungguhan sebelum dianggap selesai.

### Contoh jejak — suami, anak pr, cucu pr (dari anak lk)
1. Ketiganya ahli waris (1 anak pr → cucu pr tidak terhijab).
2. Suami 1/4, anak pr 1/2, cucu pr 1/6 (takmilah ats-tsulutsain).
3. PERBANDINGAN_NISAB ashl: 4 & 6 tawafuq → 12. Saham 3, 6, 2; Σ 11.
4. KELAS_MASALAH raddB: zawjiyyah 4 (suami 1, sisa 3); raddiyyah 3:1 → 4; PERBANDINGAN_NISAB raddVsSisa 3 vs 4 tabayun → 16.
5. Tanpa inkisar.
6. Suami 4/16, anak pr 9/16, cucu pr 3/16.

---

## 5. Urutan kerja di Claude Code
1. **C** — fixture kasus bab 16 (input graf + jenisKelaminSeharusnya table/trace kunci), termasuk uji negatif.
2. `packages/math` + test.
3. **D** — tahap 1–2 (derivasi peran, mawani', hajb, ashabah, bab 07/08).
4. Tahap 3–6, sampai seluruh fixture bab 16 lolos.
5. `packages/content` (parser tabel rujukan KB) + `packages/explain`.

## 6. Blocked
R13-5, R13-14, R01-7, R11-3; haml & mafqud [SYF] (bab 13) — tunggu KB dilengkapi.
