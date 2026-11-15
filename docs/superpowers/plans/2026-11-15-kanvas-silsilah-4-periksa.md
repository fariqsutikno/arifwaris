# Kanvas Silsilah · Rencana 4: Periksa sebagai Kisah — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Untuk `jenisKasus: 'nyata'`, langkah Periksa menjadi empat bagian:
- **Belum dipastikan**: dijawab di tempat, dengan salin pertanyaan ke WA dan "Lihat di Keluarga" + "Kembali ke Periksa";
- **Ada yang keliru?**: ubah yang dipandu;
- **Kisah harta {X}**: linimasa per babak dengan pohon kecil keadaan saat itu, jeda waktu, benang "harta masih belum dibagi", dan Ubah dipandu di tiap babak;
- **Tambah peristiwa**.

Sebutan "-mu" dari bagian Kamu dipakai di kisah dan di baris Keluarga.

**Architecture:** Isi kisah dihitung oleh fungsi murni baru `kisah.ts` dari `Kasus` (siapa ditinggalkan, siapa sudah tiada, jeda tahun, peristiwa, catatan khusus). Sebutan "-mu" dari `sebutan.ts`. Jawaban di tempat memakai fungsi rencana 1–2 (`pilihKeadaan`, `jawabLanjutan`, `aturTahunWafat`, `selesaikanUrutan`) dan satu fungsi baru `jawabUrutanTertunda`. Komponen di `layar/periksa/` hanya merender. Pohon kecil memakai `PohonDasar` yang sama dengan pohon lain (spec 8: satu tata letak).

**Tech Stack:** TypeScript, React, Vitest + Testing Library, `@waris/engine`.

**Spec:** `docs/superpowers/specs/2026-10-16-kanvas-silsilah-design.md` bagian 5.8, 5.9 (baris "Datang dari Periksa"), 7, 8, 12 langkah 8. Mockup acuan teks dan tampilan: `docs/design/mockup-kanvas-silsilah.html` v5 (layar 4 Periksa).

**Prasyarat:** rencana 2 dan rencana 3 **selesai seluruhnya**. Rencana 3 sudah menghapus alur Babak dan menambah `KeadaanAplikasi.fokus`. Keputusan K1 rencana 2 (hapus Babak di rencana 4) sudah tidak berlaku.

## Global Constraints

- Nama variabel, fungsi, tipe, dan komentar dalam bahasa Indonesia. Fikih hanya di engine. Cabang dari keputusan fikih diberi `[Rxx-y]` (CLAUDE.md).
- Fungsi murni untuk logika. Engine tidak diubah.
- Aturan tampilan spec 2:
  - tombol utama tidak pernah nonaktif;
  - garis bawah hanya untuk pindah halaman (termasuk "Lihat di Keluarga");
  - penjelasan memakai Details (▸);
  - aksi = ikon + teks;
  - tanpa menu ⋯;
  - halaman isian hanya fakta: kisah **tidak** menyebut siapa mendapat apa;
  - pil hanya untuk pilihan yang bisa diklik.
- Teks tampilan baru: kunci `hitung.periksa.*` lewat `pnpm diksi:tambah <file.json>`, **disalin persis dari mockup v5**. Kalimat yang tidak ada di mockup atau spec: berhenti dan tanya pemilik.
- Pesan WA dan kalimat lain yang masih draf (spec 13) masuk ke `apps/web/src/konten/kanvasDraf.ts` (keputusan K2 rencana 2), bukan ke snapshot.
- Gerak hanya bila tidak dimatikan (`data-gerak`). Ikon SVG.
- Commit sesudah tiap tugas, hanya berkas tugas itu, dengan trailer `Co-Authored-By` sesuai sesi. Jangan baca `.env*`.
- Perintah: `pnpm --filter @waris/web exec vitest run <berkas>`, `pnpm test`, `pnpm typecheck`.

## Keputusan rencana ini

| # | Keputusan | Alasan |
|---|---|---|
| P1 | "Hitung dengan kemungkinan" hanya bila semua hal belum pasti bisa dihitung engine. Status "belum tahu" bisa (taqdir); **urutan yang ditunda belum bisa** karena "Bagaimana kalau" urutan baru ada di Tahap 7. Bila ada urutan tertunda, bar bawah menyebut urutan mana yang harus dipastikan dan menggulir ke barisnya. Tombolnya tetap aktif. | Spec 7.1: "bila tidak bisa dihitung → status menyebut hal mana yang harus dipastikan dulu". |
| P2 | `fokusBagian?: string` (id bagian dari `kelompok.ts`) dan `dariPeriksa: boolean` ditambahkan ke `KeadaanAplikasi`. `fokus?: IdOrang` dari rencana 3 tetap dipakai untuk menyorot baris. | "Lihat di Keluarga" butuh bagian dan baris; "Kembali ke Periksa" butuh tahu asal. |
| P3 | Sebutan "-mu" = label sehari-hari (`LABEL_SEHARI`) dari sisi `saya` + "mu" ("ayahmu", "kakekmu"). Bila hubungan tidak dikenal checklist (misalnya nenek buyut), yang ditulis nama saja, tanpa sebutan. | Tidak mengarang nama hubungan di luar daftar yang ada. |
| P4 | Pohon kecil per babak = subgraf (almarhum babak, orang tuanya, pasangannya, anak-anaknya) yang dirender lewat `PohonDasar` dengan `maksPerBaris` kecil. Kelas simpul: `pusat`, `mati` (sudah tiada saat itu, dicoret), `tahu` (belum pasti), `hidup`. | Spec 8: satu modul tata letak untuk semua pohon. |
| P5 | `geserUrutan` dipindah dari `latihan.ts` ke `antreanUrutan.ts` (latihan mengimpornya dari sana). | Urutan wafat milik `antreanUrutan`; Periksa nyata juga memakainya. |
| P6 | `CeritaKasus` dan `kalimatBabak` di `PeriksaCerita.tsx` dihapus. `PilihanMenunggu` (layar menunggu kelahiran) tetap. | Kisah menggantikan cerita per babak. |

## Review Focus

1. **Menjawab "belum dipastikan" yang membuat orang menjadi almarhum lanjutan** (misalnya ibu yang belum tahu ternyata wafat sesudah pemilik): kisah langsung bertambah babak, dan Keluarga mendapat bagian cabangnya. Bar bawah Periksa menyebut bahwa keluarga orang itu perlu diisi, dengan aksi ke Keluarga. Tidak boleh lanjut ke hasil dengan cabang kosong. Diuji di Tugas 4 ("jawaban yang menambah cabang mengarahkan ke Keluarga").
2. **Urutan wafat diubah di babak** (lebih dulu/lebih akhir) padahal kedua orang punya tahun: tahun menang dan perubahannya tidak bertahan diam-diam. Panel menyebut bahwa urutan mengikuti tahun dan menawarkan ubah tahun. Diuji di Tugas 5 ("urutan bertahun tidak bisa digeser").
3. **Peristiwa yang merujuk orang yang kemudian dihapus dari Keluarga**: hilang dari kisah tanpa galat (`rapikanKeadaan`). Diuji di Tugas 6 ("peristiwa orang terhapus hilang").
4. **Salin ke WA di peramban tanpa izin clipboard**: pesan tetap tampil untuk disalin manual, dan status mengatakan gagal menyalin. Diuji di Tugas 3 ("clipboard ditolak → pratinjau + status").
5. **"Kembali ke Periksa" sesudah mengubah sesuatu yang membuat bagian lain belum lengkap**: tetap kembali ke Periksa, dan Periksa menampilkan status "Keluarga belum lengkap" dengan aksi ke bagian itu. Diuji di Tugas 4 ("kembali ke Periksa dengan keluarga belum lengkap").

---

## Peta berkas

| Berkas | Tugas | Tanggung jawab |
|---|---|---|
| `apps/web/src/kisah.ts` (baru) | 1 | `babakKisah`, `kematianSebelum`, `jedaTahun`, `hidupSekarang`, `keadaanSaat`, `catatanKhusus` |
| `apps/web/src/sebutan.ts` (baru) | 1 | `sebutanDariSaya` |
| `apps/web/src/antreanUrutan.ts` | 2 | `jawabUrutanTertunda`, `geserUrutan` (dipindah dari `latihan.ts`), `urutanDariTahun` |
| `apps/web/src/belumPasti.ts` (baru) | 2 | `daftarBelumPasti`, `bisaDihitungDenganKemungkinan` |
| `apps/web/src/konten/kanvasDraf.ts` | 3 | `pesanTanyaKeluarga` (DRAF) |
| `apps/web/src/layar/periksa/BelumPasti.tsx` (baru) | 3 | Daftar belum pasti, jawab di tempat, salin WA |
| `apps/web/src/keadaan.ts`, `layar/keluarga/KanvasKeluarga.tsx`, `statusKeluarga.ts`, `layar/Wizard.tsx` | 4 | `fokusBagian`, `dariPeriksa`, "Kembali ke Periksa", status Periksa |
| `apps/web/src/layar/periksa/KisahHarta.tsx`, `BabakKisah.tsx`, `PohonKecil.tsx`, `UbahDipandu.tsx`, `apps/web/src/gaya/periksa.css` (baru) | 5 | Kisah, Ubah dipandu |
| `apps/web/src/layar/periksa/FormPeristiwa.tsx` (baru) | 6 | Tambah peristiwa |
| `apps/web/src/layar/keluarga/BarisOrang.tsx`, `apps/web/src/layar/PeriksaCerita.tsx` | 7 | Sebutan "-mu" di baris; hapus `CeritaKasus` |

---

### Task 1: `kisah.ts` dan `sebutan.ts`

**Files:**
- Create: `apps/web/src/kisah.ts`, `apps/web/src/sebutan.ts`
- Test: `apps/web/src/__tests__/kisah.test.ts`, `apps/web/src/__tests__/sebutan.test.ts`

**Interfaces:**
- Consumes: `daftarAlmarhum`, `kerabatDari` (`keadaanOrang.ts`); `bandingTanggal` (`silsilah.ts`); `hitungIsian` (`checklist.ts`); `LABEL_SEHARI` (`konten/ahliWaris.ts`); graf contoh `keluargaKarto`, `keluargaBudi` (`__tests__/fixtures/kanvas.ts`).
- Produces:
  ```ts
  export type KeadaanSaat = 'pusat' | 'hidup' | 'mati' | 'tahu';
  export interface BabakKisah {
    idMayit: IdOrang;
    nomor: number;                         // 0 = pemilik harta
    tahun?: TanggalKira;
    urutanBelumPasti: boolean;             // ada di belumPasti 'urutan'
    pasangan: IdOrang[]; anak: IdOrang[]; orangTua: IdOrang[];   // yang masih ada saat itu
    sudahTiada: IdOrang[];                 // anak/pasangan/orang tua yang wafat lebih dulu
    belumPasti: IdOrang[];                 // keadaan "belum tahu" / hilang / janin
    peristiwaSesudah: Peristiwa[];
  }
  export function babakKisah(kasus: Kasus): BabakKisah[];
  export function kematianSebelum(kasus: Kasus): IdOrang[];       // keluarga dekat pemilik yang wafat sebelum pemilik
  export function jedaTahun(a?: TanggalKira, b?: TanggalKira): number | null;
  export function hidupSekarang(kasus: Kasus): IdOrang[];
  export function keadaanSaat(kasus: Kasus, id: IdOrang, idMayitBabak: IdOrang): KeadaanSaat;
  export function catatanKhusus(kasus: Kasus): Array<{ jenis: 'bersamaan' | 'hilang' | 'janin' | 'sesudahDibagi'; orang: IdOrang[] }>;
  // sebutan.ts
  export function sebutanDariSaya(kasus: Kasus, id: IdOrang): string | null;   // "ayahmu" | null
  ```

- [ ] **Step 1: Tulis tes yang gagal**

`kisah.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Kasus } from '../kasus';
import { babakKisah, catatanKhusus, hidupSekarang, jedaTahun, keadaanSaat, kematianSebelum } from '../kisah';
import { keluargaKarto } from './fixtures/kanvas';

const t = (tahun: number) => ({ wafat: { tahun, kiraKira: false } });

describe('kisah (spec kanvas 7.3)', () => {
  it('babak = pemilik lalu urutan wafat; Slamet wafat lebih dulu di luar babak', () => {
    const { kasus, sumi, budi, slamet, ayah } = keluargaKarto();
    expect(babakKisah(kasus).map(b => b.idMayit)).toEqual(['PEWARIS', sumi, budi]);
    expect(kematianSebelum(kasus)).toEqual(expect.arrayContaining([slamet, ayah]));
  });

  it('babak Karto: ditinggalkan istri dan anak Budi, Rina; Slamet sudah tiada', () => {
    const { kasus, sumi, budi, rina, slamet } = keluargaKarto();
    const [karto] = babakKisah(kasus);
    expect(karto!.pasangan).toEqual([sumi]);
    expect(new Set(karto!.anak)).toEqual(new Set([budi, rina]));
    expect(karto!.sudahTiada).toContain(slamet);
  });

  it('babak Budi: Mbah Sumi sudah tiada saat Budi wafat (wafat lebih dulu di urutan)', () => {
    const { kasus, sumi, budi, dewi, andi, sari } = keluargaKarto();
    const babakBudi = babakKisah(kasus).find(b => b.idMayit === budi)!;
    expect(babakBudi.pasangan).toEqual([dewi]);
    expect(new Set(babakBudi.anak)).toEqual(new Set([andi, sari]));
    expect(babakBudi.sudahTiada).toContain(sumi);
    expect(keadaanSaat(kasus, sumi, budi)).toBe('mati');
    expect(keadaanSaat(kasus, budi, budi)).toBe('pusat');
    expect(keadaanSaat(kasus, budi, 'PEWARIS')).toBe('hidup');
  });

  it('urutan tertunda ditandai di babaknya', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k: Kasus = { ...kasus, belumPasti: [{ jenis: 'urutan', a: sumi, b: budi, bersamaan: false }] };
    expect(babakKisah(k).find(b => b.idMayit === sumi)!.urutanBelumPasti).toBe(true);
  });

  it('jedaTahun hanya bila dua tahun ada', () => {
    expect(jedaTahun(t(1975).wafat, t(1998).wafat)).toBe(23);
    expect(jedaTahun(t(1975).wafat, undefined)).toBeNull();
  });

  it('hidupSekarang: Rina, Dewi, Andi, Sari', () => {
    const { kasus, rina, dewi, andi, sari } = keluargaKarto();
    expect(new Set(hidupSekarang(kasus))).toEqual(new Set([rina, dewi, andi, sari]));
  });

  it('peristiwa ditempel ke babak almarhum sesudahnya', () => {
    const { kasus, sumi, sari } = keluargaKarto();
    const k: Kasus = { ...kasus, peristiwa: [{ jenis: 'lahir', idOrang: sari, sesudahWafat: sumi }] };
    expect(babakKisah(k).find(b => b.idMayit === sumi)!.peristiwaSesudah).toHaveLength(1);
  });

  it('catatanKhusus kosong pada kasus A', () => {
    expect(catatanKhusus(keluargaKarto().kasus)).toEqual([]);
  });
});
```

`sebutan.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sebutanDariSaya } from '../sebutan';
import { keluargaKarto } from './fixtures/kanvas';

describe('sebutanDariSaya (spec kanvas 5.8)', () => {
  it('saya = Andi: Budi ayahmu, Dewi ibumu, Karto kakekmu', () => {
    const { kasus, andi, budi, dewi } = keluargaKarto();
    const k = { ...kasus, saya: andi };
    expect(sebutanDariSaya(k, budi)).toBe('ayahmu');
    expect(sebutanDariSaya(k, dewi)).toBe('ibumu');
    expect(sebutanDariSaya(k, 'PEWARIS')).toMatch(/^kakek/);
    expect(sebutanDariSaya(k, andi)).toBeNull();
  });

  it('tanpa saya, atau saya null → null', () => {
    const { kasus, budi } = keluargaKarto();
    expect(sebutanDariSaya(kasus, budi)).toBeNull();
    expect(sebutanDariSaya({ ...kasus, saya: null }, budi)).toBeNull();
  });
});
```

Catatan: label `KAKEK` di `LABEL_SEHARI` adalah "Kakek dari ayah". `sebutanDariSaya` memakai kata pertama label + "mu" untuk label bertingkat. Bila hasilnya "kakekmu", tes `toMatch(/^kakek/)` lolos.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kisah.test.ts src/__tests__/sebutan.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`kisah.ts`:

```ts
// Isi "Kisah harta {X}" di Periksa (spec kanvas 7.3). Menerima Kasus; menyerahkan babak per kematian (pemilik lalu
// urutan wafat) beserta siapa yang masih ada, siapa yang sudah tiada, yang belum pasti, dan peristiwa sesudahnya.
// Hanya fakta isian: tidak ada siapa-mendapat-apa di sini.

import type { IdOrang } from '@waris/engine';
import type { Kasus, Peristiwa, TanggalKira } from './kasus';
import { daftarAlmarhum } from './keadaanOrang';

export type KeadaanSaat = 'pusat' | 'hidup' | 'mati' | 'tahu';
export interface BabakKisah {
  idMayit: IdOrang; nomor: number; tahun?: TanggalKira; urutanBelumPasti: boolean;
  pasangan: IdOrang[]; anak: IdOrang[]; orangTua: IdOrang[]; sudahTiada: IdOrang[]; belumPasti: IdOrang[];
  peristiwaSesudah: Peristiwa[];
}

const nyata = (kasus: Kasus, id: IdOrang | undefined): id is IdOrang => !!id && !!kasus.graf.orang[id] && !kasus.graf.orang[id]!.penghubung;
const pasanganDari = (kasus: Kasus, id: IdOrang) =>
  kasus.graf.pernikahan.flatMap(n => (n.idSuami === id ? [n.idIstri] : n.idIstri === id ? [n.idSuami] : [])).filter(x => nyata(kasus, x));
const anakDari = (kasus: Kasus, id: IdOrang) =>
  Object.values(kasus.graf.orang).filter(o => (o.idAyah === id || o.idIbu === id) && !o.penghubung).map(o => o.id);
const orangTuaDari = (kasus: Kasus, id: IdOrang) =>
  [kasus.graf.orang[id]?.idAyah, kasus.graf.orang[id]?.idIbu].filter((x): x is IdOrang => nyata(kasus, x));
const belumPastiOrang = (kasus: Kasus, id: IdOrang) => {
  const o = kasus.graf.orang[id]!;
  return o.statusHidup === 'tidakDiketahui' || o.statusHidup === 'mafqud' || o.statusHidup === 'dalamKandungan' || !!o.khuntsa;
};

/** Keadaan `id` pada saat `idMayitBabak` wafat. Wafat sebelum pemilik (`statusHidup: 'wafat'`) = sudah tiada di semua babak. */
export function keadaanSaat(kasus: Kasus, id: IdOrang, idMayitBabak: IdOrang): KeadaanSaat {
  if (id === idMayitBabak) return 'pusat';
  if (kasus.graf.orang[id]!.statusHidup === 'wafat') return 'mati';
  const almarhum = daftarAlmarhum(kasus);
  const i = almarhum.indexOf(id);
  if (i >= 0 && i < almarhum.indexOf(idMayitBabak)) return 'mati';
  return belumPastiOrang(kasus, id) ? 'tahu' : 'hidup';
}

export function babakKisah(kasus: Kasus): BabakKisah[] {
  const tertunda = new Set((kasus.belumPasti ?? []).flatMap(h => (h.jenis === 'urutan' ? [h.a, h.b] : [])));
  return daftarAlmarhum(kasus).map((idMayit, nomor) => {
    const kerabat = [...pasanganDari(kasus, idMayit), ...anakDari(kasus, idMayit), ...orangTuaDari(kasus, idMayit)];
    const ada = (id: IdOrang) => ['hidup', 'tahu'].includes(keadaanSaat(kasus, id, idMayit));
    const tahun = kasus.waktu?.[idMayit]?.wafat;
    return {
      idMayit, nomor, ...(tahun ? { tahun } : {}),
      urutanBelumPasti: tertunda.has(idMayit),
      pasangan: pasanganDari(kasus, idMayit).filter(ada),
      anak: anakDari(kasus, idMayit).filter(ada),
      orangTua: orangTuaDari(kasus, idMayit).filter(ada),
      sudahTiada: kerabat.filter(id => keadaanSaat(kasus, id, idMayit) === 'mati'),
      belumPasti: kerabat.filter(id => keadaanSaat(kasus, id, idMayit) === 'tahu'),
      peristiwaSesudah: (kasus.peristiwa ?? []).filter(e => e.sesudahWafat === idMayit),
    };
  });
}

export function kematianSebelum(kasus: Kasus): IdOrang[] {
  const P = kasus.graf.idPewaris;
  return [...pasanganDari(kasus, P), ...anakDari(kasus, P), ...orangTuaDari(kasus, P)].filter(id => kasus.graf.orang[id]!.statusHidup === 'wafat');
}

export function jedaTahun(a?: TanggalKira, b?: TanggalKira): number | null {
  return a && b ? b.tahun - a.tahun : null;
}

export function hidupSekarang(kasus: Kasus): IdOrang[] {
  const almarhum = new Set(daftarAlmarhum(kasus));
  return Object.values(kasus.graf.orang).filter(o => !o.penghubung && !almarhum.has(o.id) && o.statusHidup === 'hidup').map(o => o.id);
}

export function catatanKhusus(kasus: Kasus): Array<{ jenis: 'bersamaan' | 'hilang' | 'janin' | 'sesudahDibagi'; orang: IdOrang[] }> {
  const orang = Object.values(kasus.graf.orang);
  const daftar: Array<{ jenis: 'bersamaan' | 'hilang' | 'janin' | 'sesudahDibagi'; orang: IdOrang[] }> = [
    { jenis: 'bersamaan', orang: kasus.gharqa?.anggota ?? [] },
    { jenis: 'hilang', orang: orang.filter(o => o.statusHidup === 'mafqud').map(o => o.id) },
    { jenis: 'janin', orang: orang.filter(o => o.statusHidup === 'dalamKandungan').map(o => o.id) },
    { jenis: 'sesudahDibagi', orang: kasus.wafatSesudahDibagi ?? [] },
  ];
  return daftar.filter(c => c.orang.length > 0);
}
```

`sebutan.ts`:

```ts
// Sebutan dari sudut pandang "Kamu" (spec kanvas 5.8): "ayahmu", "kakekmu". Hanya hubungan yang dikenal checklist;
// selain itu null dan pemanggil menulis nama saja (keputusan P3 rencana 4).

import type { IdOrang } from '@waris/engine';
import { hitungIsian } from './checklist';
import type { Kasus } from './kasus';
import { LABEL_SEHARI } from './konten/ahliWaris';

export function sebutanDariSaya(kasus: Kasus, id: IdOrang): string | null {
  const saya = kasus.saya;
  if (!saya || saya === id || !kasus.graf.orang[saya]) return null;
  const kunci = Object.entries(hitungIsian(kasus.graf, saya)).find(([, ids]) => ids?.includes(id))?.[0];
  const label = kunci ? LABEL_SEHARI[kunci as keyof typeof LABEL_SEHARI] : undefined;
  return label ? `${label.split(' ')[0]!.toLowerCase()}mu` : null;
}
```

Catatan: `hitungIsian(graf, saya)` menghitung peran dari sisi `saya` sebagai "mayit". Ini memang yang dibutuhkan (Budi = AYAH bagi Andi), dan tidak menyentuh fikih. Bila tes menunjukkan kunci untuk pasangan dari sisi perempuan (`SUAMI`) atau label dua kata yang kata pertamanya bukan sebutan ("Saudara laki-laki kandung" → "saudaramu"), hasil itu diterima.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kisah.test.ts src/__tests__/sebutan.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/kisah.ts apps/web/src/sebutan.ts apps/web/src/__tests__/kisah.test.ts apps/web/src/__tests__/sebutan.test.ts
git commit -m "feat(web): kisah.ts (babak per kematian, keadaan saat itu, jeda tahun, yang hidup sekarang) dan sebutan '-mu' dari Kamu"
```

---

### Task 2: Belum pasti dan urutan tertunda

**Files:**
- Modify: `apps/web/src/antreanUrutan.ts` (tambah `jawabUrutanTertunda`, `urutanDariTahun`; pindahkan `geserUrutan` dari `latihan.ts`)
- Modify: `apps/web/src/latihan.ts` (impor `geserUrutan` dari `antreanUrutan.ts`, re-ekspor supaya pemanggil lama tidak berubah)
- Create: `apps/web/src/belumPasti.ts`
- Test: `apps/web/src/__tests__/antreanUrutan.test.ts`, `apps/web/src/__tests__/belumPasti.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // antreanUrutan.ts
  export function jawabUrutanTertunda(kasus: Kasus, a: IdOrang, b: IdOrang, jawaban: 'sebelum' | 'sesudah'): Kasus;
  export function urutanDariTahun(kasus: Kasus, a: IdOrang, b: IdOrang): boolean;   // true = urutan a–b ditentukan tahun
  export function geserUrutan(kasus: Kasus, idOrang: IdOrang, arah: -1 | 1): Kasus;  // dipindah; perilaku sama
  // belumPasti.ts
  export type HalBelumPastiTampil =
    | { jenis: 'keadaan'; orang: IdOrang; milik: IdOrang }            // statusHidup tidakDiketahui
    | { jenis: 'urutan'; a: IdOrang; b: IdOrang };
  export function daftarBelumPasti(kasus: Kasus): HalBelumPastiTampil[];
  export function bisaDihitungDenganKemungkinan(kasus: Kasus): boolean;   // false bila ada urutan tertunda (P1)
  ```
- `milik` = almarhum yang menjadi rujukan sebelum/sesudah orang itu: orang tua almarhum, anak almarhum, dan seterusnya. Diturunkan dari bagian `kelompok.ts` yang memuat orang itu (`daftarBagian` + `anggotaBagian`).

- [ ] **Step 1: Tulis tes yang gagal**

`antreanUrutan.test.ts` (tambahan):

```ts
it('jawabUrutanTertunda: menghapus entri, menempatkan a terhadap b, menandai dijawab', () => {
  const { kasus, sumi, budi } = keluargaKarto();
  const tunda = tundaUrutan({ ...kasus, urutanWafat: [budi, sumi] }, sumi, budi);
  const jawab = jawabUrutanTertunda(tunda, sumi, budi, 'sebelum');
  expect(jawab.urutanWafat).toEqual([sumi, budi]);
  expect(jawab.belumPasti).toBeUndefined();
  expect(jawab.urutanDijawab).toContain(sumi);
});

it('urutan bertahun tidak bisa digeser: urutanDariTahun true, geserUrutan tidak mengubah', () => {
  const { kasus, sumi, budi } = keluargaKarto();
  const k: Kasus = { ...kasus, waktu: { [sumi]: { wafat: { tahun: 1990, kiraKira: false } }, [budi]: { wafat: { tahun: 1998, kiraKira: false } } } };
  expect(urutanDariTahun(k, sumi, budi)).toBe(true);
  expect(geserUrutan(k, budi, -1)).toBe(k);
});
```

Perubahan perilaku `geserUrutan`: menolak tukar bila kedua orang yang ditukar punya tahun yang bisa dibandingkan, karena tahun menang (Review Focus 2). Tes latihan yang lama tetap lolos karena kasus latihan tidak bertahun.

`belumPasti.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { tundaUrutan } from '../antreanUrutan';
import { bisaDihitungDenganKemungkinan, daftarBelumPasti } from '../belumPasti';
import { keluargaKarto, tambah } from './fixtures/kanvas';

describe('belumPasti (spec kanvas 7.1)', () => {
  it('ibu Karto belum tahu → satu hal keadaan dengan milik = PEWARIS; masih bisa dihitung dengan kemungkinan', () => {
    const { kasus: dasar } = keluargaKarto();
    const { kasus, id: ibu } = tambah(dasar, 'PEWARIS', 'IBU', { statusHidup: 'tidakDiketahui' });
    expect(daftarBelumPasti(kasus)).toEqual([{ jenis: 'keadaan', orang: ibu, milik: 'PEWARIS' }]);
    expect(bisaDihitungDenganKemungkinan(kasus)).toBe(true);
  });

  it('urutan tertunda → tidak bisa dihitung dengan kemungkinan (P1)', () => {
    const { kasus, sumi, budi } = keluargaKarto();
    const k = tundaUrutan(kasus, sumi, budi);
    expect(daftarBelumPasti(k)).toEqual([{ jenis: 'urutan', a: sumi, b: budi }]);
    expect(bisaDihitungDenganKemungkinan(k)).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/antreanUrutan.test.ts src/__tests__/belumPasti.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

Di `antreanUrutan.ts`:

```ts
export function urutanDariTahun(kasus: Kasus, a: IdOrang, b: IdOrang): boolean {
  return bandingTanggal(kasus.waktu?.[a]?.wafat, kasus.waktu?.[b]?.wafat) !== null;
}

export function jawabUrutanTertunda(kasus: Kasus, a: IdOrang, b: IdOrang, jawaban: 'sebelum' | 'sesudah'): Kasus {
  const tanpaA = kasus.urutanWafat.filter(id => id !== a);
  const posisiB = tanpaA.indexOf(b);
  tanpaA.splice(jawaban === 'sebelum' ? posisiB : posisiB + 1, 0, a);
  const belumPasti = (kasus.belumPasti ?? []).filter(h => !(h.jenis === 'urutan' && ((h.a === a && h.b === b) || (h.a === b && h.b === a))));
  const { belumPasti: _lama, ...tanpaBelumPasti } = kasus;
  return {
    ...tanpaBelumPasti, urutanWafat: tanpaA,
    urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), a])],
    ...(belumPasti.length ? { belumPasti } : {}),
  };
}

/** Tukar dengan tetangga di urutan wafat. Ditolak bila keduanya bertahun: tahun menentukan urutan (spec kanvas 9.1). */
export function geserUrutan(kasus: Kasus, idOrang: IdOrang, arah: -1 | 1): Kasus {
  const i = kasus.urutanWafat.indexOf(idOrang), j = i + arah;
  if (i < 0 || j < 0 || j >= kasus.urutanWafat.length) return kasus;
  if (urutanDariTahun(kasus, idOrang, kasus.urutanWafat[j]!)) return kasus;
  const urutanWafat = [...kasus.urutanWafat];
  [urutanWafat[i], urutanWafat[j]] = [urutanWafat[j]!, urutanWafat[i]!];
  return { ...kasus, urutanWafat, urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), idOrang])] };
}
```

Di `latihan.ts`: hapus definisi `geserUrutan`, ganti dengan `export { geserUrutan } from './antreanUrutan';`.

`belumPasti.ts`:

```ts
// Daftar "Belum dipastikan" di Periksa (spec kanvas 7.1). Menerima Kasus; menyerahkan hal yang masih belum pasti
// (keadaan orang "belum tahu", urutan wafat yang ditunda) dan apakah hasil bisa dihitung sebagai beberapa kemungkinan.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';
import { anggotaBagian, daftarBagian } from './kelompok';

export type HalBelumPastiTampil =
  | { jenis: 'keadaan'; orang: IdOrang; milik: IdOrang }
  | { jenis: 'urutan'; a: IdOrang; b: IdOrang };

export function daftarBelumPasti(kasus: Kasus): HalBelumPastiTampil[] {
  const bagian = daftarBagian(kasus);
  const milikDari = (id: IdOrang) => bagian.find(b => anggotaBagian(kasus, b).includes(id))?.milik ?? kasus.graf.idPewaris;
  const keadaan = Object.values(kasus.graf.orang)
    .filter(o => !o.penghubung && o.statusHidup === 'tidakDiketahui')
    .map(o => ({ jenis: 'keadaan' as const, orang: o.id, milik: milikDari(o.id) }));
  const urutan = (kasus.belumPasti ?? []).flatMap(h => (h.jenis === 'urutan' ? [{ jenis: 'urutan' as const, a: h.a, b: h.b }] : []));
  return [...keadaan, ...urutan];
}

// Urutan wafat yang ditunda belum bisa dihitung sebagai kemungkinan; "Bagaimana kalau" urutan = Tahap 7 (keputusan P1).
export const bisaDihitungDenganKemungkinan = (kasus: Kasus): boolean =>
  !(kasus.belumPasti ?? []).some(h => h.jenis === 'urutan');
```

- [ ] **Step 4: Jalankan tes, termasuk latihan**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/antreanUrutan.test.ts src/__tests__/belumPasti.test.ts src/__tests__/latihan.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/antreanUrutan.ts apps/web/src/latihan.ts apps/web/src/belumPasti.ts apps/web/src/__tests__
git commit -m "feat(web): belum pasti di Periksa: daftar keadaan/urutan tertunda, jawab urutan tertunda, geser urutan ditolak bila bertahun"
```

---

### Task 3: Bagian "Belum dipastikan" dan salin ke WA

**Files:**
- Modify: `apps/web/src/konten/kanvasDraf.ts` (tambah `pesanTanyaKeluarga`)
- Create: `apps/web/src/layar/periksa/BelumPasti.tsx`, `apps/web/src/gaya/periksa.css`
- Modify: `apps/web/src/snapshot.json` (lewat `pnpm diksi:tambah`)
- Test: `apps/web/src/__tests__/periksaBelumPasti.test.tsx`

**Interfaces:**
- Consumes: `daftarBelumPasti` (Tugas 2), `pilihKeadaan(kasus, id, pilihan, milik)` dan `jawabLanjutan(kasus, id, milik, jawaban)` (`keadaanBaris.ts`), `jawabUrutanTertunda`, `namaSingkat`.
- Produces: `<BelumPasti kasus ubah saatLihatDiKeluarga={(id: IdOrang) => void} />`. Tidak dirender bila `daftarBelumPasti` kosong.

- [ ] **Step 1: Teks**

Kunci diksi dari mockup v5 layar Periksa. Isi `hitung-periksa.json` lalu `pnpm diksi:tambah hitung-periksa.json && rm hitung-periksa.json`:

```json
[
  { "kunci": "hitung.periksa.belum_judul", "id": "Belum dipastikan ({jumlah})" },
  { "kunci": "hitung.periksa.belum_keterangan", "id": "Jawab di sini kalau sudah tahu. Kalau belum, hasil ditampilkan sebagai beberapa kemungkinan." },
  { "kunci": "hitung.periksa.tanya_keadaan", "id": "Waktu {almarhum} wafat, apakah {nama} masih hidup?" },
  { "kunci": "hitung.periksa.tanya_urutan", "id": "{a} wafat sebelum atau sesudah {b}?" },
  { "kunci": "hitung.periksa.masih_hidup", "id": "Masih hidup" },
  { "kunci": "hitung.periksa.wafat_sebelum", "id": "Wafat sebelum {nama}" },
  { "kunci": "hitung.periksa.wafat_sesudah", "id": "Wafat sesudah {nama}" },
  { "kunci": "hitung.periksa.sebelum_nama", "id": "Sebelum {nama}" },
  { "kunci": "hitung.periksa.sesudah_nama", "id": "Sesudah {nama}" },
  { "kunci": "hitung.periksa.lihat_di_keluarga", "id": "Lihat di Keluarga" },
  { "kunci": "hitung.periksa.salin_wa", "id": "Salin pertanyaan untuk keluarga" },
  { "kunci": "hitung.periksa.tersalin", "id": "Pertanyaan disalin. Tempel di WhatsApp keluarga." },
  { "kunci": "hitung.periksa.tersimpan", "id": "Tersimpan: {nama}. Kisah ikut berubah." }
]
```

"Gagal menyalin" tidak ada di mockup. Tampilkan pratinjau pesan saja tanpa status gagal, dan catat di laporan akhir supaya pemilik bisa memberi kalimatnya.

`kanvasDraf.ts`, tambahkan:

```ts
/** DRAF (spec kanvas 13): pesan WA "Salin pertanyaan untuk keluarga". Disalin dari mockup v5. */
const PESAN_TANYA_KELUARGA = "Assalamu'alaikum. Aku sedang menghitung warisan {almarhum}. Ada yang belum aku tahu:\n{daftar}\nTerima kasih.";
export const pesanTanyaKeluarga = (almarhum: string, pertanyaan: string[]): string =>
  sisipkan(PESAN_TANYA_KELUARGA, { almarhum, daftar: pertanyaan.map((p, i) => `${i + 1}. ${p}`).join('\n') });
```

- [ ] **Step 2: Tulis tes yang gagal** (`periksaBelumPasti.test.tsx`)

- `'tidak dirender bila tidak ada yang belum pasti'`
- `'keadaan belum tahu: tiga pilihan; "Masih hidup" menyimpan dan hal itu hilang dari daftar'`
- `'urutan tertunda: "Sebelum Budi" menyimpan urutan dan hal itu hilang'`
- `'"Lihat di Keluarga" memanggil saatLihatDiKeluarga dengan id orang; berupa tautan (role link atau tombol bergaya tautan dengan teks bergaris bawah)'`
- `'salin WA memanggil navigator.clipboard.writeText dengan pesan berisi semua pertanyaan, lalu pratinjau tampil'`
- `'clipboard ditolak → pratinjau tetap tampil'` (`writeText` mengembalikan `Promise.reject`)

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/periksaBelumPasti.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implementasi**

`BelumPasti.tsx` merender kartu berisi judul, keterangan, dan satu baris per hal:
- **keadaan**: radiogroup tiga pilihan.
  - "Masih hidup" → `pilihKeadaan(k, orang, 'hidup', milik)`.
  - "Wafat sebelum/sesudah {milik}" → `pilihKeadaan(k, orang, 'wafat', milik)` lalu `jawabLanjutan(k, orang, milik, <jawaban wafat sebelum/sesudah>)`. Bentuk `JawabanLanjutan` untuk wafat dibaca dari `keadaanBaris.ts` (`type JawabanLanjutan`).
  - Tautan "Lihat di Keluarga".
- **urutan**: dua pilihan → `jawabUrutanTertunda`.

Sesudah menyimpan, umumkan `tersimpan` lewat live region. Aksi ikon pesan + teks `salin_wa`: `navigator.clipboard?.writeText(pesan).then(() => status tersalin).catch(() => {})`. Pratinjau pesan (`.wa` di mockup) selalu tampil sesudah diklik. Gaya di `periksa.css` mengikuti mockup (`.belum-baris`, `.wa`).

- [ ] **Step 5: Jalankan tes dan tes diksi**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/periksaBelumPasti.test.tsx src/__tests__/diksi.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/konten/kanvasDraf.ts apps/web/src/layar/periksa apps/web/src/gaya/periksa.css apps/web/src/snapshot.json apps/web/src/__tests__/periksaBelumPasti.test.tsx
git commit -m "feat(web): Periksa: belum dipastikan dijawab di tempat, salin pertanyaan ke WA (draf)"
```

---

### Task 4: "Lihat di Keluarga" dan "Kembali ke Periksa"

**Files:**
- Modify: `apps/web/src/keadaan.ts` (`fokusBagian?: string`, `dariPeriksa: boolean`; `KE_LANGKAH` menerima `fokusBagian?`, `dariPeriksa?`; pindah ke langkah 4 mengosongkan keduanya)
- Modify: `apps/web/src/layar/keluarga/KanvasKeluarga.tsx` (bila `fokusBagian` ada, bagian itu yang terbuka; bila `fokus` ada, barisnya disorot dan digulir)
- Modify: `apps/web/src/statusKeluarga.ts` / pemakai bar bawah di `Wizard.tsx` (baris spec 5.9 "Datang dari Periksa": status "Kamu sedang mengubah dari Periksa." + tombol "Kembali ke Periksa")
- Modify: `apps/web/src/layar/Wizard.tsx` (Periksa nyata: status bar bawah dari `daftarBelumPasti`, `bisaDihitungDenganKemungkinan`, dan kelengkapan Keluarga)
- Modify: `apps/web/src/kelompok.ts` (tambah `bagianDariOrang(kasus, id): Bagian | null`)
- Test: `apps/web/src/__tests__/keadaan.test.ts`, `apps/web/src/__tests__/wizardPeriksa.test.tsx`, `apps/web/src/__tests__/kelompok.test.ts`

**Interfaces:**
- Produces: `Aksi` `{ jenis: 'KE_LANGKAH'; langkah: number; fokus?: IdOrang; fokusBagian?: string; dariPeriksa?: boolean }`; `bagianDariOrang`.
- Teks (diksi, dari spec 5.9 dan mockup): `hitung.periksa.sedang_dari_periksa` = "Kamu sedang mengubah dari Periksa.", `hitung.periksa.kembali_ke_periksa` = "Kembali ke Periksa", `hitung.periksa.hitung_kemungkinan` = "Hitung dengan kemungkinan", `hitung.periksa.hitung` = "Ya, benar. Hitung", `hitung.periksa.n_belum` = "{jumlah} hal belum dipastikan.", `hitung.periksa.pastikan_urutan` = "Pastikan dulu urutan wafat {a} dan {b}.", `hitung.periksa.keluarga_belum_lengkap` = "Keluarga belum lengkap: {bagian}." Tiga kunci terakhir tidak ada di mockup, jadi **catat di laporan untuk disetujui pemilik**.

- [ ] **Step 1: Tulis tes yang gagal**

- `keadaan.test.ts`: `'KE_LANGKAH 3 dari Periksa menyimpan fokusBagian, fokus, dariPeriksa; KE_LANGKAH 4 mengosongkannya'`.
- `kelompok.test.ts`: `'bagianDariOrang: Dewi → pasangan:{budi}'`.
- `wizardPeriksa.test.tsx`:
  - `'Lihat di Keluarga membuka bagian orang itu dengan barisnya disorot; bar bawah "Kembali ke Periksa"'`
  - `'Kembali ke Periksa membuka langkah 4'`
  - `'kembali ke Periksa dengan keluarga belum lengkap: status menyebut bagiannya, aksi membuka bagian itu'`
  - `'jawaban yang menambah cabang mengarahkan ke Keluarga'`: menjawab "Wafat sesudah {X}" untuk orang yang belum tahu membuat bagian cabang belum lengkap, sehingga status Periksa = keluarga belum lengkap.
  - `'urutan tertunda: tombol "Hitung dengan kemungkinan" tidak tampil; tombol utama menggulir ke baris urutan dan status menyebut pasangan urutannya'`
  - `'hanya belum tahu: tombol "Hitung dengan kemungkinan" membuka hasil'`

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/keadaan.test.ts src/__tests__/kelompok.test.ts src/__tests__/wizardPeriksa.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`bagianDariOrang = (kasus, id) => daftarBagian(kasus).find(b => anggotaBagian(kasus, b).includes(id)) ?? null`.

Urutan prioritas status bar bawah Periksa nyata:
1. Keluarga belum lengkap (`statusKeluarga(kasus).pertama`) → status `keluarga_belum_lengkap` + aksi `KE_LANGKAH 3 { fokusBagian, dariPeriksa: true }`;
2. ada urutan tertunda → `pastikan_urutan`, aksi gulir ke baris urutan pertama;
3. ada keadaan belum tahu → `n_belum` + tombol `hitung_kemungkinan` → hasil;
4. tidak ada → tombol `hitung` → hasil (tetap lewat `PilihanMenunggu` bila ada janin, seperti sekarang).

- [ ] **Step 4: Jalankan seluruh tes web dan typecheck**

Run: `pnpm --filter @waris/web test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/keadaan.ts apps/web/src/kelompok.ts apps/web/src/statusKeluarga.ts apps/web/src/layar apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): Lihat di Keluarga (bagian + baris disorot) dan Kembali ke Periksa; status bar bawah Periksa menurut kelengkapan dan belum pasti"
```

---

### Task 5: Kisah per babak, pohon kecil, dan Ubah dipandu

**Files:**
- Create: `apps/web/src/layar/periksa/KisahHarta.tsx`, `BabakKisah.tsx`, `PohonKecil.tsx`, `UbahDipandu.tsx`
- Modify: `apps/web/src/gaya/periksa.css`, `apps/web/src/snapshot.json`
- Test: `apps/web/src/__tests__/kisahHarta.test.tsx`, `apps/web/src/__tests__/ubahDipandu.test.tsx`

**Interfaces:**
- Consumes: `babakKisah`, `kematianSebelum`, `jedaTahun`, `hidupSekarang`, `keadaanSaat`, `catatanKhusus` (Tugas 1); `sebutanDariSaya`; `PohonDasar` + `IsiNode` (`hasil/Pohon.tsx`); `IsianTahun` (`layar/keluarga/IsianTahun.tsx`, props `{ label, petunjuk, contoh, nilai, saatUbah }`); `aturTahunWafat(kasus, id, tahun)` (`silsilah.ts`); `geserUrutan`, `urutanDariTahun` (Tugas 2); `pilihKeadaan`, `jawabLanjutan`; `bagianDariOrang`, `daftarBagian` (Tugas 4).
- Produces:
  ```tsx
  <KisahHarta kasus ubah kirim />   // kirim untuk KE_LANGKAH ke Keluarga
  <UbahDipandu kasus ubah kirim saatBukaBabak={(id) => void} saatBukaPeristiwa={() => void} />
  ```
- Teks, disalin dari mockup v5 (kunci `hitung.periksa.*`):
  - `kisah_judul` "Kisah harta {nama}"
  - `babak_wafat` "{nama} wafat"
  - `tahun_kosong` "Tahun ?"
  - `urutan_belum_pasti` "urutan belum pasti"
  - `babak_pembuka_pertama` "{nama} wafat."
  - `babak_pembuka_lanjut` "Lalu {nama} wafat, sebelum harta {pemilik} dibagi."
  - `meninggalkan` "Ia meninggalkan {daftar}."
  - `sudah_tiada` "{daftar} sudah lebih dulu tiada."
  - `belum_dipastikan_hidup` "{daftar}: belum dipastikan masih hidup atau tidak."
  - `bagian_jadi_milik` "Bagian {nama} dari harta {pemilik} kini menjadi milik keluarganya."
  - `jeda_tahun` "{n} tahun kemudian"
  - `jeda_tanpa_tahun` "Beberapa waktu kemudian"
  - `harta_belum_dibagi` "Harta {nama} masih belum dibagi"
  - `sampai_hari_ini` "Sampai hari ini"
  - `hari_ini` "Hari ini"
  - `yang_masih_hidup` "Yang masih hidup"
  - `hari_ini_isi` "{daftar}. Harta {pemilik} akan dihitung untuk mereka, mengikuti urutan kisah di atas."
  - `sebelum_pemilik` "{tahun} · {nama} wafat, sebelum {pemilik}."
  - `keliru_judul` "Ada yang keliru?"
  - `keliru_keterangan` "Pilih yang mau diubah, kami antar ke tempatnya."
  - `ubah_sesuatu` "Ubah sesuatu"
  - `langkah_apa` "Langkah 1 dari 2 · Apa yang mau diubah?"
  - `apa_keadaan` "Keadaan seseorang"
  - `apa_waktu` "Tahun atau urutan wafat"
  - `apa_orang` "Anggota keluarga"
  - `apa_peristiwa` "Peristiwa"
  - `babak_keliru` "Apa yang keliru di babak ini?"
  - `pilih_lain` "Pilih yang lain"
  - `selesai` "Selesai"
  - `lebih_dulu` "Lebih dulu"
  - `lebih_akhir` "Lebih akhir"
  - `catatan_harta` "Yang dibagi di sini harta {nama}. Harta milik orang lain di kisah ini (kalau ada) dihitung terpisah."
  - Catatan khusus (bersamaan, hilang, janin, sesudah dibagi): pakai kunci `hitung.cerita.*` yang sudah ada.
  - Satu kalimat baru tanpa mockup: `urutan_ikut_tahun` "Urutannya mengikuti tahun wafat. Ubah tahunnya bila keliru." **Catat untuk persetujuan pemilik.**

- [ ] **Step 1: Tulis tes yang gagal**

`kisahHarta.test.tsx` (kasus A):
- `'tiga babak dengan tahun besar; babak Mbah Sumi "Tahun ?"'`
- `'jeda: "23 tahun kemudian" bila dua tahun ada, selain itu "Beberapa waktu kemudian"; tiap jeda membawa "Harta Mbah Karto masih belum dibagi"'`
- `'babak Budi menyebut Dewi dan anak-anaknya; Mbah Sumi "sudah lebih dulu tiada"'`
- `'kisah tidak menyebut angka atau "mendapat"'` (cari `/\d+\/\d+|Rp|mendapat/`, harus kosong kecuali tahun)
- `'pohon kecil babak Budi: simpul Mbah Sumi berkelas mati'`
- `'saya = Andi: babak menyebut "ayahmu" untuk Budi'`
- `'Ubah di babak → pilihan "Apa yang keliru di babak ini?"; Tahun → IsianTahun mengubah tahun; Selesai menutup'`
- `'urutan bertahun tidak bisa digeser'`: di babak yang bertahun, pilihan Urutan menampilkan `urutan_ikut_tahun` dan tidak menampilkan tombol lebih dulu/akhir.

`ubahDipandu.test.tsx`:
- `'langkah 1 empat pilihan; Keadaan → pilih orang → jawab di tempat menyimpan'`
- `'Tahun atau urutan → pilih orang → saatBukaBabak dipanggil'`
- `'Anggota keluarga → pilih bagian → KE_LANGKAH 3 dengan fokusBagian dan dariPeriksa'`
- `'Peristiwa → saatBukaPeristiwa'`
- `'Pilih yang lain kembali ke langkah 1; Tutup menutup panel'`

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kisahHarta.test.tsx src/__tests__/ubahDipandu.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`PohonKecil.tsx`: subgraf = `{ idPewaris: idMayit, orang: pilih(idMayit, orangTua, pasangan semua, anak semua), pernikahan: yang kedua pihaknya ada }`, dirender lewat `<PohonDasar graf={subgraf} maksPerBaris={3} isiNode={id => ({ kelas: `m ${keadaanSaat(kasus, id, idMayit)}`, peran: '', nama: sebutanDariSaya(kasus, id) ?? namaSingkat(kasus, id) })} />`. Ini sesuai keputusan P4. Gaya `.m.mati` (dicoret), `.m.tahu` (putus-putus), `.m.pusat` (tebal) mengikuti mockup.

`BabakKisah.tsx`:
- kepala: tahun besar + judul + lencana `urutan_belum_pasti` + aksi pensil "Ubah";
- tubuh: paragraf (kalimat disusun dari `BabakKisah` dengan `gabung` daftar dan sebutan "-mu" bila ada) + `PohonKecil`;
- panel sunting bertahap. Pilihan Tahun/Urutan/Keadaan/Orang mengikuti mockup (`.sunting-babak`). Urutan memakai `geserUrutan`; bila `urutanDariTahun` dengan tetangganya, tampil `urutan_ikut_tahun`. Keadaan → daftar orang di babak → radiogroup jawab di tempat. Orang → bagian `daftarBagian` dengan `milik === idMayit` → `kirim KE_LANGKAH 3 { fokusBagian, dariPeriksa: true }`.

`KisahHarta.tsx`: garis waktu (`.linimasa`), baris `sebelum_pemilik` untuk `kematianSebelum`, babak berselang jeda, peristiwa sesudah babak (baris kecil, teks dari Tugas 6), penutup "Hari ini", lalu catatan khusus (`hitung.cerita.*`). Babak yang sedang disunting dikontrol dari luar (`babakDisunting`, `saatBukaBabak`) supaya `UbahDipandu` bisa membukanya dan menggulir ke sana.

`UbahDipandu.tsx`: panel dua langkah sesuai mockup (`.ubah-panel`).

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/kisahHarta.test.tsx src/__tests__/ubahDipandu.test.tsx src/__tests__/diksi.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar/periksa apps/web/src/gaya/periksa.css apps/web/src/snapshot.json apps/web/src/__tests__
git commit -m "feat(web): Periksa: kisah harta per babak (pohon kecil saat itu, jeda waktu, benang harta belum dibagi, sebutan -mu) dan ubah dipandu"
```

---

### Task 6: Tambah peristiwa

**Files:**
- Create: `apps/web/src/layar/periksa/FormPeristiwa.tsx`
- Modify: `apps/web/src/layar/periksa/KisahHarta.tsx` (tautan-aksi "Tambah peristiwa" + baris peristiwa), `apps/web/src/snapshot.json`
- Test: `apps/web/src/__tests__/formPeristiwa.test.tsx`

**Interfaces:**
- Consumes: `Peristiwa` (`kasus.ts`), `babakKisah`. Penurunan ke engine sudah otomatis lewat `turunkanDariWaktu` di reducer.
- Teks (mockup v5): `tambah_peristiwa` "Tambah peristiwa: lahir, menikah, atau bercerai di antara kematian", `peristiwa_judul` "Tambah peristiwa", `peristiwa_apa` "Peristiwa apa?", `peristiwa_lahir` "Kelahiran", `peristiwa_nikah` "Pernikahan", `peristiwa_cerai` "Perceraian", `peristiwa_siapa` "Siapa?", `peristiwa_kapan` "Terjadi sesudah siapa wafat?", `peristiwa_sesudah` "Sesudah {nama} wafat", `peristiwa_keterangan` "Dipakai untuk menentukan siapa yang sudah ada pada tiap kematian.", `simpan_peristiwa` "Simpan peristiwa", `peristiwa_baris_lahir` "{nama} lahir, sesudah {almarhum} wafat.", `peristiwa_baris_nikah` "{nama} menikah dengan {pasangan}, sesudah {almarhum} wafat.", `peristiwa_baris_cerai` "{nama} bercerai dengan {pasangan}, sesudah {almarhum} wafat.", ditambah kunci `pasangan_siapa` "Dengan siapa?".
  - Dua kalimat baris nikah/cerai dan `pasangan_siapa` diperluas dari mockup, yang hanya punya baris lahir. **Catat untuk persetujuan pemilik.**

- [ ] **Step 1: Tulis tes yang gagal**

- `'form: jenis, siapa, kapan; Simpan menambah peristiwa dan baris tampil di bawah babak yang dipilih'`
- `'nikah/cerai menanyakan pasangan; pilihan pasangan tidak memuat orang itu sendiri'`
- `'pilihan "sesudah siapa wafat" tidak memuat salah satu dari pasangan itu untuk nikah'` (nikah sesudah salah satu pasangan wafat tidak mungkin)
- `'peristiwa lahir mengisi dikandungSetelahWafat lewat reducer'`
- `'peristiwa orang terhapus hilang'`: hapus orangnya dari graf lalu `rapikanKeadaan`; baris peristiwa tidak tampil dan tidak ada galat.
- `'Batal menutup tanpa perubahan'`

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/formPeristiwa.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`FormPeristiwa.tsx` berisi `<select>` berlabel untuk jenis, orang (bukan pemilik), pasangan (bila nikah/cerai), dan "sesudah siapa wafat" (pemilik + `urutanWafat`). Simpan → `ubah(k => ({ ...k, peristiwa: [...(k.peristiwa ?? []), baru] }))`. Tombol "Simpan peristiwa" adalah aksi utama form, jadi boleh tombol. "Batal" berupa tautan.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/formPeristiwa.test.tsx src/__tests__/diksi.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar/periksa apps/web/src/snapshot.json apps/web/src/__tests__/formPeristiwa.test.tsx
git commit -m "feat(web): Periksa: tambah peristiwa (lahir, nikah, cerai) di antara kematian, tampil di kisah"
```

---

### Task 7: Rangkai Periksa nyata, sebutan di Keluarga, hapus cerita lama

**Files:**
- Modify: `apps/web/src/layar/Wizard.tsx` (langkah 4 nyata: `BelumPasti` → `UbahDipandu` → `KisahHarta` (+ `FormPeristiwa`) → `NamaKasus`)
- Modify: `apps/web/src/layar/keluarga/BarisOrang.tsx` (peran ditambah sebutan "-mu" bila ada, misalnya "Anak laki-laki 2 · ayahmu")
- Modify: `apps/web/src/layar/PeriksaCerita.tsx` (hapus `CeritaKasus`, `kalimatBabak`, `gabungDaftar`; `PilihanMenunggu` tetap)
- Test: `apps/web/src/__tests__/periksaCerita.test.tsx` (hapus tes `CeritaKasus`), `apps/web/src/__tests__/wizardPeriksa.test.tsx`, tes baris orang dari rencana 2

**Interfaces:**
- Consumes: semua komponen Tugas 3–6.
- Produces: tidak ada API baru.

- [ ] **Step 1: Pastikan `CeritaKasus` tidak dipakai di tempat lain**

Run: `grep -rn "CeritaKasus\|kalimatBabak" apps/web/src --include=*.ts --include=*.tsx | grep -v __tests__`
Expected: hanya `PeriksaCerita.tsx` dan `Wizard.tsx`. Bila ada pemakai lain (misalnya halaman hasil atau lembar), berhenti dan laporkan.

- [ ] **Step 2: Tulis tes yang gagal**

- `wizardPeriksa.test.tsx`: `'Periksa nyata: urutan bagian Belum dipastikan → Ada yang keliru? → Kisah → nama kasus'`, dan `'Ada yang keliru? → Tahun atau urutan → Budi: babak Budi terbuka dalam mode ubah dan digulir'`.
- Tes baris orang: `'saya = Andi: baris Budi menampilkan "ayahmu"'`.

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/wizardPeriksa.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implementasi, lalu hapus `CeritaKasus` beserta tesnya**

- [ ] **Step 5: Jalankan seluruh tes dan typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A apps/web/src
git commit -m "feat(web): Periksa nyata dirangkai (belum pasti, ubah dipandu, kisah, peristiwa); sebutan -mu di baris Keluarga; cerita per babak lama dihapus"
```

---

### Task 8: Verifikasi di browser dan laporan

- [ ] **Step 1: Uji manual**

Lewat `preview_start` (server web di `.claude/launch.json`):
1. Lab → Kasus keluarga sungguhan → isi kasus A (Mbah Karto ±1975; istri Mbah Sumi wafat sesudah, tanpa tahun; Slamet wafat ±1970; Budi wafat 1998 dengan istri Dewi, anak Andi, Sari; Rina hidup; ayah wafat sebelum; ibu belum tahu). Pada bagian Kamu, pilih Andi.
2. Di Periksa, pastikan:
   - "Belum dipastikan" berisi ibu Mbah Karto dan urutan Mbah Sumi–Budi (bila dijawab "Belum tahu" di Keluarga);
   - salin WA menampilkan pratinjau;
   - kisah memuat tiga babak dengan pohon kecil, jeda "23 tahun kemudian" antara 1975 dan 1998, dan sebutan "ayahmu"/"kakekmu";
   - "Ubah" di babak Budi → Tahun mengubah kisah;
   - "Ada yang keliru?" → Anggota keluarga → Keluarga Budi → bar bawah "Kembali ke Periksa" → kembali;
   - Tambah peristiwa "Sari lahir sesudah Mbah Sumi wafat" tampil di kisah;
   - console tanpa galat;
   - lebar HP 390 tidak terpotong.

- [ ] **Step 2: Laporan**

Laporkan:
- commit per tugas;
- penyimpangan dari rencana;
- **kalimat baru yang perlu disetujui pemilik**: `keluarga_belum_lengkap`, `pastikan_urutan`, `urutan_ikut_tahun`, baris peristiwa nikah/cerai, `pasangan_siapa`, dan kalimat untuk clipboard gagal (Tugas 3);
- tangkapan layar Periksa di desktop dan HP;
- hal yang tidak sempat diperiksa.
