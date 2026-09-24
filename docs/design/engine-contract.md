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
- **1a Derivasi peran** dari graf: telusuri jalur tiap orang ke pewaris → `HeirKey` + `darajah` (bab 3.1–3.2).
  Jalur lewat perempuan pada garis ke bawah → `DZAWIL_ARHAM` (bab 14).
- **1b Mawani'** (bab 02): 5 penghalang [SYF]; pembunuhan semua bentuk.
- **1c Hajb hirman** (6.4–6.5), dari hajib terkuat; catat `hajib` + kaidah.
- **1d Hajb nuqshan**: dicatat; yang mahjub tetap dihitung untuk nuqshan ibu (6.7 no. 3).
- Data kurang → `NEEDS_INPUT`.

### Tahap 2 — Bagian per kelompok
Fardh (bab 04) + syaratnya; ashabah (bab 05): bi nafsihi / bil ghair / ma'al ghair,
urutan jihah → darajah → quwwah → isytirak. Deteksi kasus khusus bab 07 dan bab 08 (algoritma 8.6).

### Tahap 3 — Ashlul mas'alah (9.1)
- Semua ashabah → jumlah ru'us (lk = 2, pr = 1) [R09-2].
- Satu fardh → makhraj.
- Beberapa fardh → bandingkan penyebut dengan nisab arba' (`NISAB_COMPARE`, purpose `ashl`);
  cocokkan dengan tabel kelompok A/B 9.1 sebagai assertion.
- 18 dan 36 hanya di bab jadd [R09-1].

### Tahap 4 — Klasifikasi (9.2)
- Σ = ashl → `adilah`.
- Σ > ashl → `ailah`, 'aul (validasi [R09-4]).
- Σ < ashl, tanpa ashabah → radd (9.4):
  - `raddA` tanpa pasangan: ashl = Σ saham ahli radd.
  - `raddB` ada pasangan: zawjiyyah + raddiyyah; bandingkan sisa vs ashl radd (habis / tawafuq / tabayun).
- Tak ada ahli radd selain pasangan → dzawil arham (fase 3; sebelumnya `UNSUPPORTED`).
- Dikendalikan `residuePolicy`.

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
interface RoundingConfig {
  unit: bigint; // 1n = rupiah penuh, 100n = ratusan, 1000n = ribuan — input dari pengguna
}
```

- `unit` dipilih pengguna sesuai cara penyerahan harta: tunai tidak mungkin dibayar sampai satuan
  rupiah (mis. 46.666.666), transfer bank bisa. UI menawarkan 1 / 100 / 1000; engine menerima `bigint > 0`.
- `unit ≤ 0` → `NEEDS_INPUT` (field `rounding`).
- Nominal per orang = floor(saham ÷ tashih × harta ÷ unit) × unit. Selisih = harta − Σ nominal
  (bisa sampai (jumlah ahli waris × unit) − 1); tidak dibagikan diam-diam.
- `unit` bukan khilaf fikih → bukan bagian `MadhhabConfig`.
- Lapis penjelasan (`packages/explain`) wajib memberi tahu pengguna: besar selisih pembulatan, bahwa
  selisih itu tetap milik ahli waris dan perlu disepakati penyalurannya, dan bahwa pembagian bisa pas
  sampai rupiah terakhir bila diserahkan lewat transfer bank (`unit = 1`).

---

## 3. Model data

```ts
type PersonId = string;

interface Person {
  id: PersonId;
  name?: string;
  sex: 'M' | 'F';                    // khuntsa → fase 2
  fatherId?: PersonId;
  motherId?: PersonId;
  life: 'alive' | 'dead' | 'unknown';
  religion: 'islam' | 'nonIslam' | 'unknown';
  killedDeceased?: boolean;          // [SYF] semua bentuk (bab 02)
  isPlaceholder?: boolean;           // node penghubung buatan sistem
}

interface Marriage {
  husbandId: PersonId;
  wifeId: PersonId;
  status: 'intact' | 'talakRajiIddah' | 'talakBain';
  talakInMaradh?: boolean;
}

interface FamilyGraph {
  deceasedId: PersonId;
  persons: Record<PersonId, Person>;
  marriages: Marriage[];
}
```

Jenis saudara/paman diturunkan dari kesamaan `fatherId`/`motherId`, tidak pernah diinput langsung.

```ts
type HeirKey =
  | 'IBN' | 'IBN_IBN' | 'AB' | 'JADD' | 'AKH_SYQ' | 'AKH_AB' | 'AKH_UMM'
  | 'IBN_AKH_SYQ' | 'IBN_AKH_AB' | 'AMM_SYQ' | 'AMM_AB' | 'IBN_AMM_SYQ' | 'IBN_AMM_AB'
  | 'ZAWJ' | 'MUTIQ'
  | 'BINT' | 'BINT_IBN' | 'UMM' | 'JADDAH_UMM' | 'JADDAH_AB'
  | 'UKHT_SYQ' | 'UKHT_AB' | 'UKHT_UMM' | 'ZAWJAH' | 'MUTIQAH';   // bab 3.1–3.2

interface HeirRole {
  personId: PersonId;
  key: HeirKey | 'DZAWIL_ARHAM' | 'NON_HEIR';
  kinship: KinshipPosition;
  path: PersonId[];
}

// Posisi kekerabatan relatif ke mayit, diturunkan dari graf (tidak diinput).
// Dipakai untuk urutan ashabah bab 5.3 (jihah → darajah → quwwah) dan urutan tanzil bab 14.5.
interface KinshipPosition {
  ancestorGeneration: number;   // generasi leluhur bersama: 0 = mayit sendiri, 1 = ayah/ibu, 2 = kakek/nenek, 3 = buyut ...
  descentDepth: number;         // turun berapa generasi dari leluhur bersama itu ke orang ini
  lineage: 'full' | 'paternal' | 'maternal';   // di titik percabangan: kandung / sebapak / seibu (quwwah, bab 5.3)
  throughFemale: boolean;       // ada perempuan di jalur (selain awlad al-umm) → calon dzawil arham (bab 14.2)
}

type PersonStatus =
  | { kind: 'heir'; role: HeirRole }
  | { kind: 'mahjub'; role: HeirRole; by: PersonId[]; ruleRef: RefCode }        // role: untuk narasi explain
  | { kind: 'mamnu'; role: HeirRole; mani: 'qatl' | 'ikhtilafDin' | 'riqq' | 'istibham' | 'daur'; ruleRef: RefCode }
  | { kind: 'nonHeir'; reason: string; ruleRef?: RefCode };
```

Contoh `KinshipPosition` (ancestorGeneration, descentDepth):

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
- **Ukhuwwah vs Bani al-Ikhwah**: `ancestorGeneration` sama (1); `descentDepth` lebih kecil didahulukan
  (darajah), baru `lineage` full > paternal (quwwah). Karena itu anak lk saudara kandung (1,2,full)
  kalah dari saudara lk sebapak (1,1,paternal) [bab 5.3 "konsekuensi penting"].
- **'Umumah**: `ancestorGeneration` lebih kecil didahulukan dulu (paman mayit beserta anak-anaknya
  sebelum paman ayah), baru `descentDepth`, lalu `lineage` [bab 5.3 (1)–(3)].
- `lineage: 'maternal'` pada hawasyi → saudara seibu (fardh, bab 4.9) atau dzawil arham
  (paman seibu, anak saudara seibu; bab 14.2).
- Dzawil arham (khal, khalah, 'ammah, saudara nenek, dst.) memakai koordinat yang sama untuk tanzil fase 3.

Kedalaman graf tidak dibatasi; leluhur yang tidak diisi pengguna dibuat sebagai placeholder.

Angka: `Fraction` (bigint, immutable, branded), `Money = bigint`, saham/ashl = `bigint`.

### Konfigurasi

```ts
type Ruleset = 'syafii';               // 'khi' ditambahkan fase 4

interface MadhhabConfig {              // internal Syafi'iyyah saja; UI: "pengaturan lanjutan"
  residuePolicy: 'radd' | 'baitulMal';           // default 'radd'   [R09-8] [R14-5]
  talakBainInMaradh: 'qaulJadid' | 'qaulQadim';  // default 'qaulJadid' [R02-3]
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
type EngineResult =
  | { status: 'NEEDS_INPUT'; questions: Question[] }
  | { status: 'UNSUPPORTED'; reason: string; refs: RefCode[] }
  | { status: 'OK';
      statuses: Record<PersonId, PersonStatus>;
      table: MasalahTable;
      trace: TraceStep[];
      rounding: { unit: bigint; remainder: Money };
      ruleset: Ruleset; config: MadhhabConfig; kbVersion: string };
// fase 2: tambah { status: 'MAUQUF'; scenarios: ...; held: ... }
```

```ts
type Nisab = 'tamatsul' | 'tadakhul' | 'tawafuq' | 'tabayun';

type TraceStep = { stage: Stage; refs: RefCode[] } & (
  | { kind: 'MANI'; personId: PersonId; mani: string }
  | { kind: 'HAJB_HIRMAN'; mahjub: PersonId; hajib: PersonId[] }
  | { kind: 'HAJB_NUQSHAN'; affected: PersonId; from: Fraction; to: Fraction; cause: PersonId[] }
  | { kind: 'FARDH'; group: GroupId; fardh: Fraction; reason: FardhReason }
  | { kind: 'ASHABAH'; group: GroupId; type: 'binNafsi' | 'bilGhair' | 'maalGhair'; jaddChoice?: ... }
  | { kind: 'SPECIAL_CASE'; name: 'umariyyatain' | 'musyarrakah' | 'akdariyyah' | 'muaddah' }
  | { kind: 'TIRKAH'; gross; tajhiz; hutang; wasiatDiminta; wasiatBatas; wasiatDipakai; wasiatButuhIjazah; bersih }
  // ashl & juzSahm: nisab arba' penuh (10.2). inkisar & raddVsSisa: hanya FPB → 'habis' | 'tawafuq' | 'tabayun' (9.4, 10.3).
  | { kind: 'NISAB_COMPARE'; purpose: 'ashl' | 'raddVsSisa' | 'inkisar' | 'juzSahm'; group?: GroupId;
      a: bigint; b: bigint; relation: Nisab | 'habis'; gcd: bigint; result: bigint }
  | { kind: 'MASALAH_CLASS'; cls: 'adilah' | 'ailah' | 'raddA' | 'raddB'; sumSaham: bigint; ashl: bigint }
  | { kind: 'AUL'; from: bigint; to: bigint }
  | { kind: 'RADD'; zawjiyyah?: { group; ashl; spouseSaham; sisa }; raddiyyah: { saham; ashl }; result: bigint }
  | { kind: 'TASHIH'; base: bigint; juzSahm: bigint; result: bigint }
  | { kind: 'DISTRIBUTE'; personId: PersonId; saham: bigint; of: bigint; amount: Money }
);
```

```ts
interface MasalahTable {
  columns: Array<'fardh' | 'ashl' | 'aul' | 'radd' | 'tashih' | 'perPerson' | 'nominal'>; // dinamis
  totals: Partial<Record<'ashl' | 'aul' | 'radd' | 'tashih', bigint>>;                  // penyebut tiap kolom
  rows: Array<{ group: GroupId; members: PersonId[];
                fardh?: Fraction; ashabah?: boolean; cells: Record<string, bigint>;    // saham kelompok per kolom
                perPerson: Record<PersonId, { saham: bigint; nominal: Money }> }>;     // kelompok 2:1 → beda per orang
  excluded: PersonId[];   // mahjub/mamnu, tampil dengan alasan
}

interface RefEntry {       // packages/content, dibangun dari tabel "Dasar dan Rujukan" KB
  code: RefCode;
  type: 'Q' | 'H' | 'A' | 'IJ' | 'RDH' | 'KH';
  claim: string;
  source: string;
  text?: string;           // teks Arab dari KB, bukan dari luar
  highlight?: [number, number];
  status: 'verified' | 'needsVerification';   // bab 17.4
}
```

**Trace = data, bukan kalimat.** Alasan setiap keputusan disimpan terstruktur (`FardhReason`: kode + id
orang penyebab + angka pembanding, lihat `packages/engine/src/types.ts`), mis.
`{ code: 'ADA_FARU_WARITS', by: ['D1'] }` atau `{ code: 'JADD_WAL_IKHWAH', options: [...], chosen }`.
Setiap perbandingan angka (ashl, radd, inkisar, juz' as-sahm) wajib memancarkan `NISAB_COMPARE` —
termasuk yang hasilnya habis/tamatsul — supaya `explain` bisa menulis "diketahui 2 dan 4 → tadakhul →
ambil yang besar". Teks bebas di trace dilarang.

`packages/explain` (`explain(result, graph)`) menghasilkan lapis 2 sebagai bagian → baris teks + `refs`;
lapis 3 (dalil) nanti menempelkan teks dari `packages/content` berdasarkan `refs` tiap baris.

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
3. NISAB_COMPARE ashl: 4 & 6 tawafuq → 12. Saham 3, 6, 2; Σ 11.
4. MASALAH_CLASS raddB: zawjiyyah 4 (suami 1, sisa 3); raddiyyah 3:1 → 4; NISAB_COMPARE raddVsSisa 3 vs 4 tabayun → 16.
5. Tanpa inkisar.
6. Suami 4/16, anak pr 9/16, cucu pr 3/16.

---

## 5. Urutan kerja di Claude Code
1. **C** — fixture kasus bab 16 (input graf + expected table/trace kunci), termasuk uji negatif.
2. `packages/math` + test.
3. **D** — tahap 1–2 (derivasi peran, mawani', hajb, ashabah, bab 07/08).
4. Tahap 3–6, sampai seluruh fixture bab 16 lolos.
5. `packages/content` (parser tabel rujukan KB) + `packages/explain`.

## 6. Blocked
R13-5, R13-14, R01-7, R11-3; haml & mafqud [SYF] (bab 13) — tunggu KB dilengkapi.
