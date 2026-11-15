# Kanvas Silsilah · Rencana 3: Latihan (isian cepat per mayit) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Untuk `jenisKasus: 'latihan'`, langkah 3 menjadi satu layar "Ahli waris" berisi kartu per mayit, isian "− jumlah +", chip untuk menandai "wafat sebelum harta dibagi", dan daftar urutan wafat. Periksa latihan berupa ringkasan per mayit dengan "Ubah" ke kartunya. Alur Babak lama dihapus karena tidak dipakai lagi.

**Architecture:** Logika latihan ada di satu modul murni baru, `latihan.ts`, yang memakai fungsi yang sudah ada (`terapkanKeadaan`, `hitungIsian`, `kerabatDari`, `labelOrangChecklist`). Komponen `LatihanAhliWaris` hanya merender kartu per mayit di atas `LangkahAhliWaris` (komponen "− jumlah +" yang sudah ada) dan memanggil `latihan.ts` lewat `UBAH_KASUS`. Orang yang sama di dua kartu otomatis tercatat sekali, karena graf keluarga satu dan `hitungIsian(graf, mayit)` sudah menghitung kerabat yang ada dari sisi mayit itu.

**Tech Stack:** TypeScript, React, Vitest + Testing Library, `@waris/engine`.

**Spec:** `docs/superpowers/specs/2026-10-16-kanvas-silsilah-design.md` bagian 6, 11.1 (fixture latihan), 12 langkah 7. Mockup: `docs/design/mockup-kanvas-silsilah.html` (pilih "Belajar atau latihan soal").

**Prasyarat:** rencana 2 (`2026-11-04-kanvas-silsilah-2-pintu-dan-kanvas-keluarga.md`) **selesai seluruhnya**. Rencana ini mengubah `Wizard.tsx`, `validasi.ts`, `PeriksaCerita.tsx`, `keadaan.ts`, `rute.ts`, dan `Aplikasi.tsx`, yang juga disentuh rencana 2 tugas 10.

## Global Constraints

- Nama variabel, fungsi, tipe, dan komentar dalam bahasa Indonesia. Istilah fikih memakai glosarium. Cabang kode dari keputusan fikih diberi `[Rxx-y]`. Fikih hanya di engine (CLAUDE.md).
- Fungsi murni untuk logika (tanpa I/O, `Date`, `Math.random`). Engine tidak diubah.
- Tombol utama tidak pernah nonaktif (`BarBawah` baru dari rencana 2). Aksi sekunder berupa teks atau ikon + teks, bukan tombol berbingkai. Ikon SVG, bukan emoji.
- Teks tampilan baru: kunci `hitung.latihan.*` lewat `pnpm diksi:tambah <file.json>`. Teksnya **disalin persis dari mockup v5**. Kalimat yang tidak ada di mockup atau spec: berhenti dan tanya pemilik.
- Istilah fikih boleh tampil di latihan (spec 3), misalnya "munasakhat".
- Commit sesudah tiap tugas, hanya berkas tugas itu, dengan trailer `Co-Authored-By` sesuai sesi. Jangan baca `.env*`.
- Perintah: `pnpm --filter @waris/web exec vitest run <berkas>`, `pnpm test`, `pnpm typecheck`.

## Keputusan rencana ini

| # | Keputusan | Alasan |
|---|---|---|
| L1 | Kartu mayit lanjutan **tidak** meminta pengguna mengetik ulang orang yang sudah tercatat. Penghitung di kartu itu langsung menunjukkan jumlah dari graf (misalnya ibu = istri mayit pertama sudah terhitung 1). Dari kalimat mockup, hanya bagian pertama yang dipakai: "Wafat sesudah mayit sebelumnya, sebelum harta dibagi." | Graf keluarga satu; mengetik ulang akan membuat orang ganda. Kalimat mockup "termasuk yang sudah tercatat di atas" menyesatkan bila angkanya sudah terisi. |
| L2 | Menandai "wafat sebelum dibagi" = `terapkanKeadaan(..., { jenis: 'wafatSesudah', hartaSudahDibagi: false })`, dimasukkan di akhir `urutanWafat`. Melepas tanda = `{ jenis: 'hidup' }`. Keluarga yang hanya tercatat lewat orang itu ikut terhapus (perilaku `terapkanKeadaan` yang ada), dengan konfirmasi. | Memakai jalur data yang sudah diuji. |
| L3 | Alur Babak (`LangkahBabak`, `PertanyaanPenutup`, aksi `KE_BABAK`, field `babak`, `alasanBabak`, segmen babak di URL) **dihapus di rencana ini**, bukan di rencana 4 seperti K1 rencana 2. | Sesudah rencana 2 (nyata → kanvas) dan rencana 3 (latihan → kartu), tidak ada lagi yang memakai Babak. Membiarkan kode mati sampai rencana 4 hanya menambah beban. URL lama `/langkah/3/{babak}` tetap terbaca, segmen babaknya diabaikan. |
| L4 | "Ubah" di Periksa latihan = `KE_LANGKAH 3` dengan `fokus: idMayit`. Kartu mayit itu digulir ke tengah dan diberi fokus. Field `fokus?: IdOrang` ditambahkan ke `KeadaanAplikasi`. **Bila rencana 2 sudah menambah field fokus/sorot serupa, pakai field itu.** | Ganti peran `babak` sebagai penanda posisi, tanpa halaman per mayit. |
| L5 | Mawani' latihan tetap memakai `LangkahKondisi` di Periksa latihan (bukan bagian "Hal lain" kanvas). | Latihan = isian cepat; satu daftar centang cukup. |

## Review Focus

1. **Melepas tanda "wafat sebelum dibagi"** pada orang yang kartunya sudah berisi ahli waris: konfirmasi menyebut siapa yang ikut terhapus, `urutanWafat` bersih, tidak ada orang yatim di graf. Diuji di Tugas 1 ("lepas tanda menghapus keluarga yang hanya tercatat lewatnya") dan Tugas 2 ("lepas tanda meminta konfirmasi").
2. **Mengurangi jumlah (−) pada peran yang orangnya sudah ditandai wafat**: orang itu keluar dari `urutanWafat` dan kartunya hilang. Diuji di Tugas 1 ("kurangi orang bertanda wafat").
3. **Kasus latihan lama (v3, alur Babak) dibuka sesudah Babak dihapus**: tetap tampil sebagai kartu per mayit dengan urutan yang sama, dan URL `/langkah/3/2` membuka langkah 3 tanpa galat. Diuji di Tugas 4 ("tautan babak lama tetap terbuka").
4. **Mayit lanjutan tanpa ahli waris yang hidup**: Lanjut tertahan, status menyebut kartu mana, kartu itu digulir. Diuji di Tugas 3 ("kartu tanpa ahli waris menahan lanjut").
5. **Satu orang terhitung di dua kartu** (ibu dari Anak laki-laki 1 = Istri 1): input engine tidak memuat orang ganda. Diuji di Tugas 1 (fixture latihan A).

---

## Peta berkas

| Berkas | Tugas | Tanggung jawab |
|---|---|---|
| `apps/web/src/latihan.ts` (baru) | 1 | `mayitLatihan`, `orangDiKartu`, `tandaiWafatSebelumDibagi`, `geserUrutan`, `labelMayit`, `mayitTanpaAhliWaris` |
| `apps/web/src/__tests__/latihan.test.ts` (baru) | 1 | Logika + fixture latihan A (jami'ah 72) |
| `apps/web/src/layar/latihan/LatihanAhliWaris.tsx`, `KartuMayit.tsx`, `UrutanWafatLatihan.tsx` (baru), `apps/web/src/gaya/latihanIsian.css` (baru) | 2 | Layar kartu per mayit |
| `apps/web/src/layar/wizard/validasi.ts`, `apps/web/src/layar/Wizard.tsx`, `apps/web/src/keadaan.ts` | 3 | Sambungan langkah 3 dan Periksa latihan, `fokus` |
| `apps/web/src/layar/latihan/RingkasanLatihan.tsx` (baru) | 3 | Periksa latihan per mayit |
| `LangkahBabak.tsx`, `PertanyaanPenutup.tsx`, `keadaan.ts`, `rute.ts`, `Aplikasi.tsx`, `PeriksaCerita.tsx`, tes terkait | 4 | Hapus Babak |

---

### Task 1: `latihan.ts` dan fixture latihan A

**Files:**
- Create: `apps/web/src/latihan.ts`
- Test: `apps/web/src/__tests__/latihan.test.ts`

**Interfaces:**
- Consumes: `terapkanKeadaan`, `kerabatDari`, `daftarAlmarhum`, `babakAsal`, `namaSingkat` (`keadaanOrang.ts`); `hitungIsian`, `labelOrangChecklist` (`checklist.ts`); `keInputEngine` (`jalankan.ts`).
- Produces:
  ```ts
  export function mayitLatihan(kasus: Kasus): IdOrang[];                       // [pewaris, ...urutanWafat]
  export function orangDiKartu(kasus: Kasus, idMayit: IdOrang): IdOrang[];     // orang nyata yang dihitung di kartu mayit itu, kecuali mayit sebelumnya
  export function tandaiWafatSebelumDibagi(kasus: Kasus, idOrang: IdOrang, wafat: boolean): Kasus;
  export function geserUrutan(kasus: Kasus, idOrang: IdOrang, arah: -1 | 1): Kasus;
  export function labelMayit(kasus: Kasus, idMayit: IdOrang): string;          // "Mbah Karto" | "Anak laki-laki 1 dari Mbah Karto" (memakai nama bila ada)
  export function mayitTanpaAhliWaris(kasus: Kasus): IdOrang | null;           // kartu pertama tanpa ahli waris hidup
  ```

- [ ] **Step 1: Tulis tes yang gagal**

```ts
import { describe, expect, it } from 'vitest';
import { hitungMunasakhat } from '@waris/engine';
import { hitungIsian, kurangiAhliWaris, tambahAhliWaris } from '../checklist';
import { keInputEngine } from '../jalankan';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { namaSingkat } from '../keadaanOrang';
import { geserUrutan, labelMayit, mayitLatihan, mayitTanpaAhliWaris, orangDiKartu, tandaiWafatSebelumDibagi } from '../latihan';

const tambah = (kasus: Kasus, idMayit: string, ...kunci: Parameters<typeof tambahAhliWaris>[2][]) =>
  kunci.reduce((k, satu) => ({ ...k, graf: tambahAhliWaris(k.graf, idMayit, satu) }), kasus);
const pertama = (kasus: Kasus, idMayit: string, kunci: Parameters<typeof tambahAhliWaris>[2]) => hitungIsian(kasus.graf, idMayit)[kunci]![0]!;
const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));

/** Soal kitab: suami wafat (istri, anak lk, anak pr) → istri wafat → anak lk wafat (istri, anak lk, anak pr). */
function soalA() {
  let k = tambah(kasusBaru('L', 'latihan'), 'PEWARIS', 'ISTRI', 'ANAK_LK', 'ANAK_PR');
  const istri = pertama(k, 'PEWARIS', 'ISTRI'), anakLk = pertama(k, 'PEWARIS', 'ANAK_LK'), anakPr = pertama(k, 'PEWARIS', 'ANAK_PR');
  k = tandaiWafatSebelumDibagi(k, istri, true);
  k = tandaiWafatSebelumDibagi(k, anakLk, true);
  k = tambah(k, anakLk, 'ISTRI', 'ANAK_LK', 'ANAK_PR');
  return { k, istri, anakLk, anakPr };
}

describe('latihan (spec kanvas 6)', () => {
  it('menandai wafat sebelum dibagi menambah kartu mayit, urut sesuai urutan menandai', () => {
    const { k, istri, anakLk } = soalA();
    expect(mayitLatihan(k)).toEqual(['PEWARIS', istri, anakLk]);
  });

  it('kartu mayit lanjutan menghitung orang yang sudah tercatat (ibu = istri mayit pertama), tanpa orang ganda', () => {
    const { k, istri, anakLk, anakPr } = soalA();
    expect(hitungIsian(k.graf, anakLk).IBU).toEqual([istri]);   // ibunya = istri mayit pertama, satu orang di graf
    expect(orangDiKartu(k, istri)).toEqual(expect.arrayContaining([anakLk, anakPr]));
    expect(orangDiKartu(k, anakLk)).not.toContain(istri);
  });

  it('fixture latihan A: Rina 1/3, istri mayit 3 1/12, anak lk 7/18, anak pr 7/36; jami\'ah 72 [R12-2]', () => {
    const { k, anakPr, anakLk } = soalA();
    const hasil = hitungMunasakhat({ dasar: keInputEngine(k), urutanWafat: k.urutanWafat });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    const pecahan = Object.fromEntries(Object.entries(hasil.saham).filter(([, s]) => s > 0n).map(([id, s]) => { const g = fpb(s, hasil.jamiah); return [id, `${s / g}/${hasil.jamiah / g}`]; }));
    const istriB = pertama(k, anakLk, 'ISTRI'), cucuLk = pertama(k, anakLk, 'ANAK_LK'), cucuPr = pertama(k, anakLk, 'ANAK_PR');
    expect(pecahan).toEqual({ [anakPr]: '1/3', [istriB]: '1/12', [cucuLk]: '7/18', [cucuPr]: '7/36' });
    expect(hasil.jamiah).toBe(72n);
  });

  it('lepas tanda menghapus keluarga yang hanya tercatat lewatnya', () => {
    const { k, anakLk } = soalA();
    const lepas = tandaiWafatSebelumDibagi(k, anakLk, false);
    expect(lepas.urutanWafat).not.toContain(anakLk);
    expect(hitungIsian(lepas.graf, anakLk).ISTRI).toBeUndefined();
  });

  it('kurangi orang bertanda wafat: keluar dari urutan wafat', () => {
    const { k, anakLk } = soalA();
    // anakLk punya keturunan → jadi penghubung; rapikanKeadaan (dipanggil reducer) membuangnya dari urutan wafat
    const kurang = rapikanKeadaan({ ...k, graf: kurangiAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') });
    expect(mayitLatihan(kurang)).not.toContain(anakLk);
  });

  it('geserUrutan menukar posisi di urutan wafat; batas tidak berubah', () => {
    const { k, istri, anakLk } = soalA();
    expect(geserUrutan(k, anakLk, -1).urutanWafat).toEqual([anakLk, istri]);
    expect(geserUrutan(k, istri, -1)).toBe(k);
  });

  it('labelMayit: nama bila ada, selain itu peran dari sisi mayit sebelumnya', () => {
    const { k, anakLk } = soalA();
    expect(labelMayit(k, 'PEWARIS')).toBe(namaSingkat(k, 'PEWARIS'));
    expect(labelMayit(k, anakLk).toLowerCase()).toContain('anak laki-laki');
  });

  it('mayitTanpaAhliWaris: kartu tanpa ahli waris hidup ditemukan', () => {
    let k = tambah(kasusBaru('L', 'latihan'), 'PEWARIS', 'ANAK_LK', 'ANAK_LK');
    const [a1] = hitungIsian(k.graf, 'PEWARIS').ANAK_LK!;
    k = tandaiWafatSebelumDibagi(k, a1!, true);
    expect(mayitTanpaAhliWaris(k)).toBeNull();   // a1 punya saudara a2 yang hidup
    expect(mayitTanpaAhliWaris(tambah(kasusBaru('L', 'latihan'), 'PEWARIS'))).toBe('PEWARIS');
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/latihan.test.ts`
Expected: FAIL (`../latihan` tidak ada).

Bila tes fixture gagal karena angka (bukan karena modul belum ada), bandingkan dengan `docs/kb/12_munasakhat.md` 12.3. Bila KB yang benar, laporkan dan jangan ubah angka.

- [ ] **Step 3: Implementasi `latihan.ts`**

```ts
// Latihan soal (spec kanvas 6): kartu per mayit seperti di kitab. Menerima Kasus latihan; menyerahkan daftar mayit,
// orang di tiap kartu, dan perubahan "wafat sebelum harta dibagi" / urutan wafat. Graf keluarga satu, jadi orang yang sama
// di dua kartu tercatat sekali (hitungIsian menghitungnya dari sisi mayit masing-masing).

import type { IdOrang } from '@waris/engine';
import { hitungIsian, labelOrangChecklist } from './checklist';
import type { Kasus } from './kasus';
import { babakAsal, daftarAlmarhum, kerabatDari, namaSingkat, terapkanKeadaan } from './keadaanOrang';

export const mayitLatihan = (kasus: Kasus): IdOrang[] => daftarAlmarhum(kasus);

export function orangDiKartu(kasus: Kasus, idMayit: IdOrang): IdOrang[] {
  const sebelumnya = new Set(mayitLatihan(kasus).slice(0, mayitLatihan(kasus).indexOf(idMayit)));
  const dihitung = Object.values(hitungIsian(kasus.graf, idMayit)).flatMap(daftar => daftar ?? []);
  return dihitung.filter(id => !sebelumnya.has(id) && !kasus.graf.orang[id]!.penghubung);
}

/** [R12-1] wafat sesudah mayit sebelumnya dan sebelum harta dibagi → masuk urutan wafat (di akhir). */
export function tandaiWafatSebelumDibagi(kasus: Kasus, idOrang: IdOrang, wafat: boolean): Kasus {
  if (wafat === kasus.urutanWafat.includes(idOrang)) return kasus;
  return terapkanKeadaan(kasus, idOrang, wafat ? { jenis: 'wafatSesudah', hartaSudahDibagi: false } : { jenis: 'hidup' });
}

export function geserUrutan(kasus: Kasus, idOrang: IdOrang, arah: -1 | 1): Kasus {
  const i = kasus.urutanWafat.indexOf(idOrang), j = i + arah;
  if (i < 0 || j < 0 || j >= kasus.urutanWafat.length) return kasus;
  const urutanWafat = [...kasus.urutanWafat];
  [urutanWafat[i], urutanWafat[j]] = [urutanWafat[j]!, urutanWafat[i]!];
  return { ...kasus, urutanWafat, urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), idOrang])] };
}

export function labelMayit(kasus: Kasus, idMayit: IdOrang): string {
  if (idMayit === kasus.graf.idPewaris || kasus.graf.orang[idMayit]!.nama) return namaSingkat(kasus, idMayit);
  const asal = babakAsal(kasus, idMayit) ?? kasus.graf.idPewaris;
  return `${labelOrangChecklist(kasus.graf, asal, idMayit)} ${namaSingkat(kasus, asal)}`;
}

/** Kartu pertama yang tidak punya ahli waris hidup saat mayitnya wafat (tidak termasuk mayit sebelumnya). */
export function mayitTanpaAhliWaris(kasus: Kasus): IdOrang | null {
  const almarhum = mayitLatihan(kasus);
  return almarhum.find((idMayit, i) => {
    const sebelumnya = new Set(almarhum.slice(0, i));
    return !kerabatDari(kasus, idMayit).some(id => !sebelumnya.has(id) && kasus.graf.orang[id]!.statusHidup !== 'wafat');
  }) ?? null;
}
```

Catatan untuk `labelMayit`: format "{peran} {mayit asal}" menghasilkan "Anak laki-laki Mbah Karto". Bila mockup memakai "Anak laki-laki 1 dari Mbah Karto", tambahkan kunci diksi `hitung.latihan.peran_dari` (`"{peran} dari {mayit}"`) di Tugas 2 dan pakai di sini lewat `t`. Nomor urut peran sudah ada di `labelOrangChecklist` bila ada lebih dari satu.

- [ ] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/latihan.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/latihan.ts apps/web/src/__tests__/latihan.test.ts
git commit -m "feat(web): latihan.ts: mayit per kartu, tanda wafat sebelum dibagi, urutan wafat; fixture latihan A (jami'ah 72)"
```

---

### Task 2: Layar kartu per mayit

**Files:**
- Create: `apps/web/src/layar/latihan/LatihanAhliWaris.tsx`, `KartuMayit.tsx`, `UrutanWafatLatihan.tsx`, `apps/web/src/gaya/latihanIsian.css`
- Create (sementara, tidak di-commit): berkas diksi `hitung-latihan.json` untuk `pnpm diksi:tambah`
- Modify: `apps/web/src/snapshot.json` (lewat skrip)
- Test: `apps/web/src/__tests__/latihanAhliWaris.test.tsx`

**Interfaces:**
- Consumes: `latihan.ts` (Tugas 1), `LangkahAhliWaris` (`graf`, `idMayit`, `ubahGraf`), `PertanyaanHamil` (`kasus`, `idMayit`, `ubah`), `DialogKonfirmasi` (`ui/Dialog`), `orangTerputus`.
- Produces: `<LatihanAhliWaris kasus ubah fokus? />`. Kartu diberi `id={`mayit-${idMayit}`}` dan `tabIndex={-1}` supaya bisa digulir dan difokus.

- [ ] **Step 1: Tambah diksi (teks dari mockup v5)**

Tulis `hitung-latihan.json` di direktori kerja:

```json
[
  { "kunci": "hitung.latihan.ketuk_tandai", "id": "Ketuk nama orang untuk menandainya wafat sebelum harta dibagi. Kartu ahli warisnya muncul di bawah." },
  { "kunci": "hitung.latihan.mayit_pertama", "id": "Mayit pertama: {nama}" },
  { "kunci": "hitung.latihan.mayit_ke", "id": "Mayit ke-{nomor}: {nama}" },
  { "kunci": "hitung.latihan.wafat_sesudah_sebelumnya", "id": "Wafat sesudah mayit sebelumnya, sebelum harta dibagi." },
  { "kunci": "hitung.latihan.wafat_sebelum_dibagi", "id": "wafat sebelum dibagi" },
  { "kunci": "hitung.latihan.urutan_judul", "id": "Urutan wafat (munasakhat)" },
  { "kunci": "hitung.latihan.urutan_keterangan", "id": "Dari yang paling dulu, sesudah mayit pertama." },
  { "kunci": "hitung.latihan.naikkan", "id": "Naikkan {nama}" },
  { "kunci": "hitung.latihan.turunkan", "id": "Turunkan {nama}" },
  { "kunci": "hitung.latihan.lepas_tanda_judul", "id": "Batalkan tanda wafat {nama}?" },
  { "kunci": "hitung.latihan.lepas_tanda_isi", "id": "Ahli waris yang hanya tercatat lewat {nama} ikut terhapus: {daftar}." },
  { "kunci": "hitung.latihan.kartu_tanpa_ahli_waris", "id": "Isi ahli waris {nama} dulu." }
]
```

Run: `pnpm diksi:tambah hitung-latihan.json && rm hitung-latihan.json`
Expected: "12 kunci ditambahkan".

Dua kunci terakhir (`lepas_tanda_*`, `kartu_tanpa_ahli_waris`) tidak ada di mockup. Kalimatnya disusun mengikuti pola dialog konfirmasi hapus dan pesan validasi yang sudah ada di snapshot. **Tunjukkan dua kalimat ini ke pemilik di laporan akhir.**

- [ ] **Step 2: Tulis tes yang gagal** (`latihanAhliWaris.test.tsx`)

Render `LatihanAhliWaris` dengan state lokal (`useState<Kasus>`, `ubah = f => setKasus(k => rapikanKeadaan(f(k)))`). Tes:
- `'awal: satu kartu "Mayit pertama", baris jumlah tampil, tanpa daftar urutan'`
- `'tambah anak laki-laki lalu ketuk chip-nya: muncul kartu "Mayit ke-2", chip bertanda "wafat sebelum dibagi" (aria-pressed=true)'`
- `'dua mayit lanjutan: daftar urutan tampil; tombol naikkan pada yang kedua menukar urutan'`
- `'lepas tanda meminta konfirmasi bila kartunya sudah berisi; Batal tidak mengubah apa pun'`
- `'kartu fokus (prop fokus) digulir dan menerima fokus'` (mock `scrollIntoView` di jsdom: `Element.prototype.scrollIntoView = vi.fn()`)
- `'chip berupa tombol berlabel, bukan teks bergaris bawah'` (`getByRole('button', { name: /Anak laki-laki 1/ })`)

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/latihanAhliWaris.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implementasi**

`KartuMayit.tsx` berisi:
- judul `mayit_pertama` / `mayit_ke`, dan untuk mayit ke-2 dst. keterangan `wafat_sesudah_sebelumnya`;
- `<LangkahAhliWaris graf idMayit ubahGraf />`;
- deretan chip `orangDiKartu(kasus, idMayit)`. Tiap chip adalah `<button aria-pressed>` dengan label `labelOrangChecklist(graf, idMayit, id)` + nama. Bila bertanda, tampil teks kecil `wafat_sebelum_dibagi`;
- `<PertanyaanHamil kasus idMayit ubah />` di kaki kartu.

Ketuk chip:
- belum bertanda → `ubah(k => tandaiWafatSebelumDibagi(k, id, true))`;
- sudah bertanda → hitung `orangTerputus(kasus, tandaiWafatSebelumDibagi(kasus, id, false))`. Bila kosong, langsung lepas. Bila ada, `DialogKonfirmasi` dengan `lepas_tanda_*`.

`UrutanWafatLatihan.tsx` tampil bila `kasus.urutanWafat.length >= 2`. Isinya daftar bernomor dengan tombol ikon naik/turun (`aria-label` `naikkan`/`turunkan`) yang memanggil `geserUrutan`. Pola visual mengikuti `.urutan-wafat` di mockup.

`LatihanAhliWaris.tsx` = keterangan `ketuk_tandai` + `mayitLatihan(kasus).map(KartuMayit)` + `UrutanWafatLatihan`. `useEffect` pada `fokus`: `document.getElementById(`mayit-${fokus}`)?.scrollIntoView({ block: 'center', behavior: gerakMati ? 'auto' : 'smooth' })` lalu `.focus()`. Pakai helper gerak yang sudah dipakai rencana 2 untuk `data-gerak`.

CSS di `latihanIsian.css` (diimpor dari komponen) memakai token yang ada: kartu `.kartu`, chip seperti `.chip-orang` di mockup, daftar seperti `.urutan-wafat`.

- [ ] **Step 5: Jalankan tes**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/latihanAhliWaris.test.tsx src/__tests__/diksi.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/layar/latihan apps/web/src/gaya/latihanIsian.css apps/web/src/snapshot.json apps/web/src/__tests__/latihanAhliWaris.test.tsx
git commit -m "feat(web): layar latihan: kartu per mayit (jumlah + chip wafat sebelum dibagi), urutan wafat naik/turun, fokus ke kartu"
```

---

### Task 3: Sambungan wizard dan Periksa latihan

**Files:**
- Modify: `apps/web/src/keadaan.ts` (field `fokus?: IdOrang`; `KE_LANGKAH` menerima `fokus?`; `UBAH_KASUS`/`KE_LANGKAH` lain mengosongkan `fokus`)
- Modify: `apps/web/src/layar/wizard/validasi.ts` (`alasanBelumLengkap` langkah 3 untuk `latihan` memakai `mayitTanpaAhliWaris`)
- Modify: `apps/web/src/layar/Wizard.tsx` (langkah 3 latihan → `LatihanAhliWaris`; langkah 4 latihan → `RingkasanLatihan` + `LangkahKondisi` + `NamaKasus`; aksi bar bawah tertahan → gulir ke kartu yang kurang)
- Create: `apps/web/src/layar/latihan/RingkasanLatihan.tsx`
- Test: `apps/web/src/__tests__/wizardLatihan.test.tsx`, `apps/web/src/__tests__/validasi.test.ts`, `apps/web/src/__tests__/keadaan.test.ts`

**Interfaces:**
- Consumes: `LatihanAhliWaris` (Tugas 2), `mayitLatihan`, `labelMayit`, `orangDiKartu`, `mayitTanpaAhliWaris` (Tugas 1), `BarBawah`/status dari rencana 2.
- Produces: `KeadaanAplikasi.fokus?: IdOrang`; `Aksi` `{ jenis: 'KE_LANGKAH'; langkah: number; fokus?: IdOrang }`.

- [ ] **Step 1: Tulis tes yang gagal**

`keadaan.test.ts`: `'KE_LANGKAH dengan fokus menyimpan fokus; UBAH_KASUS mengosongkannya'`.

`validasi.test.ts`: `'latihan: langkah 3 tertahan selama ada kartu tanpa ahli waris, alasannya menyebut kartu itu'` (pakai `t('hitung.latihan.kartu_tanpa_ahli_waris', { nama: labelMayit(...) })`).

`wizardLatihan.test.tsx`:
- `'latihan langkah 3 merender kartu "Mayit pertama", bukan kanvas dan bukan babak'`
- `'kartu tanpa ahli waris menahan lanjut: status menyebut kartunya, kartu digulir'`
- `'Periksa latihan: satu baris per mayit dengan daftar ahli waris; "Ubah" membuka langkah 3 dengan fokus ke kartu itu'`
- `'Periksa latihan menampilkan LangkahKondisi'`

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/wizardLatihan.test.tsx src/__tests__/validasi.test.ts src/__tests__/keadaan.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

`RingkasanLatihan.tsx` membuat satu baris per mayit:
- label `Mayit {k}`;
- `labelMayit`;
- daftar ahli waris dari `orangDiKartu` (sebutan + nama, yang ditandai wafat diberi `wafat_sebelum_dibagi`);
- aksi ikon pensil + teks "Ubah" (kunci yang ada `hitung.cerita.ubah` atau setara di snapshot; cek dengan `grep '"hitung.cerita' apps/web/src/snapshot.json`) → `kirim({ jenis: 'KE_LANGKAH', langkah: 3, fokus: idMayit })`.

Di `Wizard.tsx`, cabang langkah 3 dan 4 menurut `kasus.jenisKasus`. Jalur `nyata` dari rencana 2 tidak disentuh. Aksi bar bawah latihan yang tertahan menggulir ke `#mayit-${mayitTanpaAhliWaris(kasus)}`.

- [ ] **Step 4: Jalankan seluruh tes web dan typecheck**

Run: `pnpm --filter @waris/web test && pnpm typecheck`
Expected: PASS. Tes lama yang mengasumsikan latihan memakai Babak disesuaikan ke kartu.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/keadaan.ts apps/web/src/layar apps/web/src/__tests__
git commit -m "feat(web): wizard latihan: langkah Ahli waris berupa kartu per mayit, Periksa ringkasan per mayit dengan Ubah ke kartunya"
```

---

### Task 4: Hapus alur Babak

**Files:**
- Delete: `apps/web/src/layar/LangkahBabak.tsx`, `apps/web/src/layar/keadaan/PertanyaanPenutup.tsx`, `apps/web/src/__tests__/langkahBabak.test.tsx`, `apps/web/src/__tests__/pertanyaanPenutup.test.tsx`
- Modify: `apps/web/src/keadaan.ts` (hapus `babak` dari `KeadaanAplikasi`, aksi `KE_BABAK`, `babakTerakhir`)
- Modify: `apps/web/src/layar/wizard/validasi.ts` (hapus `alasanBabak`)
- Modify: `apps/web/src/rute.ts` (`PosisiKasus` tanpa `babak`; pembaca tetap menerima segmen ke-5 dan mengabaikannya; `tautanKasus` tidak menulis babak)
- Modify: `apps/web/src/Aplikasi.tsx` (tanpa `KE_BABAK` saat pulih URL; efek tautan tanpa babak)
- Modify: `apps/web/src/layar/PeriksaCerita.tsx` (tautan "ubah" `KE_BABAK` dihapus; `CeritaKasus` hanya dipakai jalur yang masih ada)
- Test: `apps/web/src/__tests__/rute.test.ts`, `apps/web/src/__tests__/pulihUrl.test.ts`, `apps/web/src/__tests__/keadaan.test.ts`

**Interfaces:**
- Consumes: tidak ada yang baru.
- Produces: `KeadaanAplikasi` tanpa `babak`; `PosisiKasus` tanpa `babak`.

- [ ] **Step 1: Pastikan tidak ada pemakai lagi**

Run: `grep -rn "KE_BABAK\|LangkahBabak\|PertanyaanPenutup\|alasanBabak\|\.babak\b" apps/web/src --include=*.ts --include=*.tsx | grep -v __tests__`
Expected: hanya berkas yang tercantum di Files. Bila ada pemakai lain yang tidak terduga (misalnya rencana 2 masih memakai `PertanyaanPenutup` untuk jalur tertentu), berhenti dan laporkan.

- [ ] **Step 2: Tulis tes yang gagal**

`rute.test.ts`: `'tautan lama /langkah/3/2 tetap terbaca sebagai langkah 3'` dan `'tautanKasus tidak menulis segmen babak'`.
`pulihUrl.test.ts`: `'tautan babak lama tetap terbuka'` (kasus latihan v3 dengan dua mayit lanjutan, hash `#/hitung/<id>/langkah/3/2` → `layar: 'wizard'`, `langkah: 3`, tanpa galat).

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/rute.test.ts src/__tests__/pulihUrl.test.ts`
Expected: FAIL (`tautanKasus` masih menulis babak).

- [ ] **Step 4: Hapus dan sesuaikan**

Hapus berkas dan rujukan sesuai daftar Files. Hapus import yang tidak terpakai. Kunci diksi `hitung.babak.*` dan `hitung.penutup.*` dibiarkan di snapshot; menghapus kunci perlu `konten:pulihkan` dan bukan bagian rencana ini.

- [ ] **Step 5: Jalankan seluruh tes dan typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A apps/web/src
git commit -m "refactor(web): hapus alur Babak (LangkahBabak, PertanyaanPenutup, KE_BABAK, babak di URL); tautan lama tetap terbuka"
```

---

### Task 5: Verifikasi di browser dan laporan

- [ ] **Step 1: Jalankan dev server dan uji manual alur latihan**

Run (lewat preview, bukan Bash): server `web` dari `.claude/launch.json`. Bila belum ada, buat konfigurasi `pnpm --filter @waris/web dev`.

Uji alurnya:
1. Lab → "Belajar atau latihan soal" → isi mayit pertama (laki-laki, istri 1, anak lk 1, anak pr 1).
2. Ketuk Istri 1, lalu Anak laki-laki 1.
3. Isi kartu Anak laki-laki 1 (istri 1, anak lk 1, anak pr 1).
4. Periksa → Hitung.

Pastikan:
- ada tiga kartu;
- daftar urutan tampil dan bisa ditukar;
- "Ubah" di Periksa menggulir ke kartu yang benar;
- tidak ada galat di console;
- tampilan HP (lebar 390) tidak terpotong.

- [ ] **Step 2: Laporan**

Laporkan:
- commit per tugas;
- penyimpangan dari rencana;
- dua kalimat diksi yang perlu disetujui pemilik (Tugas 2 Step 1);
- tangkapan layar latihan di desktop dan HP.
