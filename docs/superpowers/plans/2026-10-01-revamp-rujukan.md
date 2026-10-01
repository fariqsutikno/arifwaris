# Revamp Rujukan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layar Rujukan web (awal, kategori, satu dalil, penampil kitab) jadi tempat menelusuri dalil dengan gaya Belajar/Logivo.

**Architecture:** `layar/belajar/Rujukan.tsx` (211 baris) dipecah per layar ke `layar/rujukan/`. Logika cari/filter/penggunaan dalil = fungsi murni di `layar/rujukan/cari.ts`. Tampilan memakai ulang kelas `.ubin`, `.hero-beranda`, `.panah-bulat` yang sudah ada; CSS baru hanya di `gaya/rujukan.css`.

**Tech Stack:** React 18, TypeScript, vitest + Testing Library, CSS biasa (token di `gaya/token.css`).

**Spec:** `docs/superpowers/specs/2026-10-01-revamp-rujukan-design.md`

## Global Constraints

- Nama, komentar, teks dalam bahasa Indonesia; kunci diksi `rujukan.*`; teks tampil lewat `t(...)`, tidak hardcode.
- Aksi sekunder = teks/tautan, bukan tombol berbingkai. Tombol hanya untuk aksi utama.
- Ikon SVG (`Ikon`), bukan emoji. Tanpa metafora game/kartu remi. Kartu tanpa isi tidak dirender.
- Aturan fikih/KB tidak berubah; arti & tafsir ayat tidak dikarang.
- Rute lama tetap hidup: `#/rujukan`, `#/rujukan/<kategori>`, `#/rujukan/<kode>`, `#/rujukan/kitab/<n>` (`rute.ts` tidak diubah).
- Jangan menyentuh berkas kerja pengguna yang belum di-commit selain berkas tugas ini. `snapshot.json` sudah berubah di working tree; commit-nya pakai `git add -p`.

## Penyimpangan dari spek (data tidak ada)

- **Filter madzhab dicabut:** `EntriRujukan` tidak punya field madzhab, jadi tidak bisa diturunkan tanpa mengarang. Filter hanya per bab KB.
- **Label `sekunder` dicabut:** tidak ada field-nya. Label yang ada: `perlu verifikasi` (`status`) dan `dha'if` (`dhaif`).
- **"Dipakai untuk":** hanya yang ada datanya: bab dalil + hukum `Syahid` yang `rujukan === kode`.

## Review Focus

- Pencarian satu huruf / spasi / tanpa hasil: tidak error, hasil kosong menampilkan pesan.
- Kategori tak dikenal (`#/rujukan/entah`): jatuh ke Awal, bukan halaman kosong.
- Kategori "Masih dikaji" dan "Keterangan" tanpa jenis dalil: tetap tampil dan tertaut.
- Filter bab yang menghasilkan nol dalil di kategori itu: pesan kosong, bukan daftar kosong.
- Kitab tanpa PDF/tautan sumber: aksi tampil nonaktif dengan label (perilaku lama), tidak hilang.
- Mode Arab (RTL): angka lewat `angka()`, panah lewat `panah()`.

---

### Task 1: Kunci diksi dan fungsi cari (`cari.ts`)

**Files:**
- Create: `apps/web/src/layar/rujukan/cari.ts`
- Create: `apps/web/src/__tests__/cariRujukan.test.ts`
- Create (sementara, jangan di-commit): `/tmp/claude-1000/-home-fariqsutikno-Kuliah-0--Tugas-Akhir-projects/084ff144-b0b2-45da-9f11-05222e90b1df/scratchpad/diksi-rujukan.json`
- Modify: `apps/web/src/snapshot.json` (lewat `pnpm diksi:tambah`)

**Interfaces:**
- Produces:
  - `interface HasilCari { judul: string; keterangan: string; tautan: string }`
  - `cariRujukanTeks(kata: string): HasilCari[]` (kurang dari 2 huruf → `[]`)
  - `saringBab(daftar: EntriRujukan[], bab?: number): EntriRujukan[]`
  - `daftarBabDi(daftar: EntriRujukan[]): number[]` (urut naik, unik)
  - `penggunaanDalil(kode: string): { bab: number | undefined; hukum: string[] }`

- [ ] **Step 1: Tulis tes yang gagal**

```ts
import { expect, it } from 'vitest';
import { DAFTAR_KITAB, RUJUKAN } from '@waris/content';
import { daftarSyahid } from '../konten/sumber';
import { daftarBabDi, penggunaanDalil, cariRujukanTeks, saringBab } from '../layar/rujukan/cari';

it('cari: kurang dari dua huruf atau tak cocok → kosong', () => {
  expect(cariRujukanTeks('')).toEqual([]);
  expect(cariRujukanTeks(' a ')).toEqual([]);
  expect(cariRujukanTeks('zzqqxx')).toEqual([]);
});

it('cari: cocok ke klaim dalil, tak peka huruf besar, tautannya ke detail', () => {
  const dalil = RUJUKAN[0]!;
  const hasil = cariRujukanTeks(dalil.klaim.slice(0, 12).toUpperCase());
  expect(hasil.map(isi => isi.tautan)).toContain(`#/rujukan/${dalil.kode}`);
});

it('cari: cocok ke judul kitab, tautannya ke daftar kitab', () => {
  const hasil = cariRujukanTeks(DAFTAR_KITAB[0]!.judul);
  expect(hasil.map(isi => isi.tautan)).toContain('#/rujukan/kitab');
});

it('saringBab dan daftarBabDi', () => {
  const bab = daftarBabDi(RUJUKAN);
  expect(bab).toEqual([...bab].sort((a, b) => a - b));
  expect(new Set(bab).size).toBe(bab.length);
  expect(saringBab(RUJUKAN, bab[0]).every(isi => isi.bab === bab[0])).toBe(true);
  expect(saringBab(RUJUKAN)).toBe(RUJUKAN);
});

it('penggunaanDalil: bab dalil + hukum syahid yang merujuknya; kode asing → kosong', () => {
  const syahid = daftarSyahid().find(isi => RUJUKAN.some(dalil => dalil.kode === isi.rujukan));
  if (syahid) expect(penggunaanDalil(syahid.rujukan).hukum).toContain(syahid.hukum);
  expect(penggunaanDalil('R99-9')).toEqual({ bab: undefined, hukum: [] });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/cariRujukan.test.ts`
Expected: FAIL, modul `../layar/rujukan/cari` tidak ada.

- [ ] **Step 3: Implementasi**

```ts
// Pencarian dan penyaringan layar Rujukan: fungsi murni atas konten KB. Menerima kata cari atau daftar dalil,
// menyerahkan hasil yang siap dirender oleh Awal, Kategori, dan DetailDalil.

import { DAFTAR_AYAT, DAFTAR_KITAB, RUJUKAN, cariRujukan, type EntriRujukan } from '@waris/content';
import { daftarSyahid } from '../../konten/sumber';
import { namaSurah } from '../../konten/judulBab';
import { tautanRujukan } from '../../rute';

export interface HasilCari { judul: string; keterangan: string; tautan: string }

const HURUF_MINIMAL = 2;
const TAUTAN_KITAB = tautanRujukan('kitab');
const TAUTAN_QURAN = tautanRujukan('quran');

const baku = (teks: string) => teks.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function cariRujukanTeks(kata: string): HasilCari[] {
  const kunci = baku(kata);
  if (kunci.length < HURUF_MINIMAL) return [];
  const dalil = RUJUKAN.filter(isi => baku(`${isi.klaim} ${isi.sumber}`).includes(kunci))
    .map(isi => ({ judul: isi.klaim, keterangan: isi.sumber, tautan: tautanRujukan(isi.kode) }));
  const ayat = DAFTAR_AYAT.filter(isi => baku(`${namaSurah(isi.surah)} ${isi.ayat}`).includes(kunci))
    .map(isi => ({ judul: `${namaSurah(isi.surah)} : ${isi.ayat}`, keterangan: isi.teks, tautan: TAUTAN_QURAN }));
  const kitab = DAFTAR_KITAB.filter(isi => baku(`${isi.judul} ${isi.penulis}`).includes(kunci))
    .map(isi => ({ judul: isi.judul, keterangan: isi.penulis, tautan: TAUTAN_KITAB }));
  return [...dalil, ...ayat, ...kitab];
}

export const saringBab = (daftar: EntriRujukan[], bab?: number): EntriRujukan[] =>
  (bab === undefined ? daftar : daftar.filter(isi => isi.bab === bab));

export const daftarBabDi = (daftar: EntriRujukan[]): number[] => [...new Set(daftar.map(isi => isi.bab))].sort((a, b) => a - b);

/** Tempat dalil dipakai: babnya dan hukum syahid ayat yang bersandar padanya. */
export function penggunaanDalil(kode: string): { bab: number | undefined; hukum: string[] } {
  return { bab: cariRujukan(kode)?.bab, hukum: daftarSyahid().filter(isi => isi.rujukan === kode).map(isi => isi.hukum) };
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/cariRujukan.test.ts`
Expected: PASS. Bila `syahid.rujukan` ternyata bukan kode `R..-..`, tes tidak memeriksa hukum (guard `if`); catat itu dan sesuaikan `penggunaanDalil` ke bentuk field yang sebenarnya sebelum lanjut.

- [ ] **Step 5: Tambah kunci diksi** (satu berkas untuk seluruh rencana)

Tulis berkas JSON di scratchpad:

```json
[
 {"kunci":"rujukan.cari_label","id":"Cari dalil, surah, atau kitab"},
 {"kunci":"rujukan.hasil_cari","id":"{jumlah} hasil"},
 {"kunci":"rujukan.tidak_ada_hasil","id":"Tidak ada yang cocok. Coba kata lain."},
 {"kunci":"rujukan.semua_bab","id":"Semua bab"},
 {"kunci":"rujukan.saring_bab","id":"Bab KB"},
 {"kunci":"rujukan.bab_kosong","id":"Tidak ada dalil di bab ini."},
 {"kunci":"rujukan.dipakai_di","id":"Dipakai di"},
 {"kunci":"rujukan.hukum_bergantung","id":"Hukum yang bersandar pada dalil ini"},
 {"kunci":"rujukan.label_dhaif","id":"dha'if"},
 {"kunci":"rujukan.label_perlu_verifikasi","id":"perlu verifikasi"},
 {"kunci":"rujukan.jelajah_kategori","id":"Jelajahi menurut jenis dalil"},
 {"kunci":"rujukan.jumlah_dalil","id":"{jumlah} dalil"}
]
```

Run: `pnpm diksi:tambah <jalur berkas itu>`
Expected: `12 kunci ditambahkan`.

- [ ] **Step 6: Commit**

```bash
cd "/home/fariqsutikno/Kuliah/0. Tugas Akhir/projects"
git add apps/web/src/layar/rujukan/cari.ts apps/web/src/__tests__/cariRujukan.test.ts
git add -p apps/web/src/snapshot.json   # pilih hanya hunk kunci rujukan.* baru
git commit -m "feat(web): fungsi cari/saring Rujukan dan kunci diksi baru

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Pecah `Rujukan.tsx` per layar (tanpa ubah perilaku)

**Files:**
- Create: `apps/web/src/layar/rujukan/Rujukan.tsx` (pintu masuk), `KartuDalil.tsx` (KartuAyat, KartuHadits, KartuKitab), `DetailDalil.tsx`, `PenampilKitab.tsx`, `Kategori.tsx` (IsiKategori + DalilPerBab + `DAFTAR_KATEGORI`)
- Delete: `apps/web/src/layar/belajar/Rujukan.tsx`
- Modify: `apps/web/src/Aplikasi.tsx:32`, `apps/web/src/__tests__/belajar.test.tsx:6`, `apps/web/package.json` (`exports`: `"./belajar/*"` tetap; tambah `"./rujukan/*": "./src/layar/rujukan/*.tsx"` hanya bila ada pemakai paket lain; cek `grep -rn "belajar/Rujukan" apps packages`)

**Interfaces:**
- Consumes: isi `Rujukan.tsx` lama (dipindah apa adanya).
- Produces: `layar/rujukan/Rujukan.tsx` mengekspor `Rujukan({ kode, kategori, kitab })` dan `KATEGORI_RUJUKAN: string[]` (sama persis dengan yang lama); `Kategori.tsx` mengekspor `DAFTAR_KATEGORI: Kategori[]`, `interface Kategori { id: string; judul: string; jenis?: JenisDalil }`, `dalilKategori(kategori)`, `jumlahDi(kategori)`, `IsiKategori`.

- [ ] **Step 1: Cari semua pemakai**

Run: `grep -rn "belajar/Rujukan" "/home/fariqsutikno/Kuliah/0. Tugas Akhir/projects" --include=*.ts --include=*.tsx --include=*.json -l | grep -v node_modules`
Expected: `Aplikasi.tsx`, `belajar.test.tsx` (dan mungkin satu lagi; perbarui semuanya).

- [ ] **Step 2: Pindahkan kode** dengan potongan persis seperti di berkas lama: `DAFTAR_KATEGORI`, `TEKS_TAB`, `dalilKategori`, `jumlahDi`, `IsiKategori`, `DalilPerBab` → `Kategori.tsx`; `KartuAyat`, `KartuKitab` → `KartuDalil.tsx`; `PenampilKitab` → `PenampilKitab.tsx`; `DetailRujukan` → `DetailDalil.tsx` (ekspor `DetailDalil`); `Rujukan` + `KATEGORI_RUJUKAN` → `Rujukan.tsx`. Perbaiki path impor relatif (`../../ui/..` tetap sama karena kedalaman folder sama). Header komentar tiap berkas mengikuti standar CLAUDE.md (menerima apa, memutuskan apa).

- [ ] **Step 3: Perbarui impor** di `Aplikasi.tsx` dan `belajar.test.tsx` ke `./layar/rujukan/Rujukan` / `../layar/rujukan/Rujukan`; hapus berkas lama dengan `git rm apps/web/src/layar/belajar/Rujukan.tsx`.

- [ ] **Step 4: Verifikasi tidak ada perubahan perilaku**

Run: `pnpm --filter @waris/web exec tsc --noEmit -p . && pnpm --filter @waris/web exec vitest run src/__tests__/belajar.test.tsx src/__tests__/rute.test.ts`
Expected: tsc bersih, semua tes lulus.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar/rujukan apps/web/src/Aplikasi.tsx apps/web/src/__tests__/belajar.test.tsx
git add -u apps/web/src/layar/belajar/Rujukan.tsx
git commit -m "refactor(web): pecah layar Rujukan per berkas di layar/rujukan

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Awal Rujukan (hero + cari + ubin kategori)

**Files:**
- Create: `apps/web/src/layar/rujukan/Awal.tsx`, `apps/web/src/gaya/rujukan.css`
- Modify: `apps/web/src/layar/rujukan/Rujukan.tsx`, `apps/web/src/main.tsx` (impor `./gaya/rujukan.css` setelah `lab.css`), `apps/web/src/__tests__/belajar.test.tsx`

**Interfaces:**
- Consumes: `cariRujukanTeks`, `HasilCari` (Task 1); `DAFTAR_KATEGORI`, `jumlahDi` (Task 2); `pisahKataAkhir`, `useCahayaIkutKursor` dari `ui/sorotan`.
- Produces: `Awal()` tanpa props. `Rujukan` memakai `Awal` bila `kode` kosong, `kitab` kosong, dan `kategori` tidak dikenal/kosong (kategori tak dikenal tidak lagi diam-diam jadi Al-Qur'an).

- [ ] **Step 1: Ubah tes lama jadi tes Awal**

Ganti tes `'rujukan tanpa kategori membuka Al-Qur\'an dengan teks ayat'` di `belajar.test.tsx` dengan:

```tsx
it('rujukan tanpa kategori membuka Awal: ubin tiap kategori dan kolom cari', () => {
  render(<Rujukan />);
  expect(screen.getByRole('searchbox', { name: 'Cari dalil, surah, atau kitab' })).toBeTruthy();
  for (const kategori of KATEGORI_RUJUKAN) expect(document.querySelector(`a[href="#/rujukan/${kategori}"]`), kategori).toBeTruthy();
});

it('rujukan: kata cari menampilkan hasil bertaut; tanpa hasil → pesan', () => {
  render(<Rujukan />);
  const kolom = screen.getByRole('searchbox');
  fireEvent.change(kolom, { target: { value: 'zzqqxx' } });
  expect(screen.getByText('Tidak ada yang cocok. Coba kata lain.')).toBeTruthy();
  fireEvent.change(kolom, { target: { value: RUJUKAN[0]!.klaim.slice(0, 12) } });
  expect(document.querySelector(`a[href="#/rujukan/${RUJUKAN[0]!.kode}"]`)).toBeTruthy();
});

it('rujukan: kategori tak dikenal jatuh ke Awal', () => {
  render(<Rujukan kategori="entah" />);
  expect(screen.getByRole('searchbox')).toBeTruthy();
});
```

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/belajar.test.tsx -t rujukan`
Expected: FAIL (tidak ada searchbox).

- [ ] **Step 2: Implementasi `Awal.tsx`**

```tsx
// Awal Rujukan: hero gelap dengan kolom cari, lalu ubin per jenis dalil. Menerima tidak ada props; memutuskan hasil cari
// dari kata yang diketik; menyerahkan pembaca ke #/rujukan/<kategori> atau #/rujukan/<kode>.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { angka, panah, t } from '../../terjemah';
import { Ikon } from '../../ui/Ikon';
import { pisahKataAkhir, useCahayaIkutKursor } from '../../ui/sorotan';
import { tautanRujukan } from '../../rute';
import { cariRujukanTeks } from './cari';
import { DAFTAR_KATEGORI, jumlahDi } from './Kategori';

export function Awal() {
  useEffect(() => { document.body.classList.add('layar-beranda'); return () => document.body.classList.remove('layar-beranda'); }, []);
  const hero = useRef<HTMLElement>(null);
  useCahayaIkutKursor(hero);
  const [kata, setKata] = useState('');
  const hasil = cariRujukanTeks(kata);
  const [judulAwal, kataTekanan] = pisahKataAkhir(t('umum.rujukan'));
  return (
    <main className="halaman-beranda halaman-rujukan">
      <header className="hero-beranda hero-pusat" ref={hero}>
        <div className="sapa-pusat">
          <h1>{judulAwal} <span className="tekanan">{kataTekanan}</span></h1>
          <p className="lead">{t('rujukan.al_qur_an_sunnah_atsar_ijma')}</p>
        </div>
        <div className="panel-cari-rujukan">
          <input type="search" className="kolom-cari-rujukan" aria-label={t('rujukan.cari_label')} placeholder={t('rujukan.cari_label')}
            value={kata} onChange={event => setKata(event.target.value)} />
          {kata.trim().length >= 2 && (
            <div role="status" className="hasil-cari-rujukan">
              {hasil.length === 0 ? <p>{t('rujukan.tidak_ada_hasil')}</p> : (
                <>
                  <p>{t('rujukan.hasil_cari', { jumlah: angka(String(hasil.length)) })}</p>
                  <ul className="daftar-polos">
                    {hasil.slice(0, JUMLAH_HASIL).map(isi => (
                      <li key={`${isi.tautan}-${isi.judul}`}><a href={isi.tautan}><b>{isi.judul}</b><span>{isi.keterangan}</span></a></li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <h2 className="judul-bagian">{t('rujukan.jelajah_kategori')}</h2>
      <ul className="daftar-polos deret-ubin-rujukan">
        {DAFTAR_KATEGORI.map((kategori, urutan) => (
          <li key={kategori.id}>
            <a className="ubin ubin-rujukan" style={{ '--i': urutan } as CSSProperties} href={tautanRujukan(kategori.id)}>
              <Ikon nama="rujukan" ukuran={28} />
              <b className="judul-ubin">{kategori.judul}</b>
              <span className="keterangan">{t('rujukan.jumlah_dalil', { jumlah: angka(String(jumlahDi(kategori))) })}</span>
              <span className="panah-bulat" aria-hidden="true">{panah()}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

const JUMLAH_HASIL = 12;
```

(Letakkan `JUMLAH_HASIL` di atas komponen bila lint mengeluh tentang TDZ; konstanta modul dipakai saat render sehingga aman.)

- [ ] **Step 3: CSS `rujukan.css`** (impor di `main.tsx`)

```css
/* Awal Rujukan: memakai kerangka Beranda/Belajar. Di sini hanya kolom cari di hero dan ubin kategori berwarna. */
.halaman-rujukan .deret-ubin-rujukan{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin:0;padding:0}
.halaman-rujukan .deret-ubin-rujukan>li{display:flex}
.ubin-rujukan{flex:1;min-height:170px;border-color:transparent;background:radial-gradient(240px 180px at 100% 0%,rgba(255,255,255,.6),transparent 70%),linear-gradient(135deg,var(--a),var(--b))}
li:nth-child(5n+1)>.ubin-rujukan{--a:#d3ebaa;--b:#b7de80}
li:nth-child(5n+2)>.ubin-rujukan{--a:#fde6d8;--b:#f8c7a6}
li:nth-child(5n+3)>.ubin-rujukan{--a:#d6e2fb;--b:#b4c8f1}
li:nth-child(5n+4)>.ubin-rujukan{--a:#fbdbe4;--b:#f1b4c6}
li:nth-child(5n+5)>.ubin-rujukan{--a:#fde7c9;--b:#f6c68a}
.ubin-rujukan .judul-ubin{margin-top:auto}
.ubin-rujukan .keterangan{color:color-mix(in srgb,var(--ink) 74%,transparent)}
.panel-cari-rujukan{display:flex;flex-direction:column;gap:10px;min-width:0;padding:18px;border-radius:28px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px)}
.kolom-cari-rujukan{width:100%;padding:14px 18px;border:0;border-radius:999px;font:inherit;background:#fff;color:#0e0f10}
.kolom-cari-rujukan:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.hasil-cari-rujukan{color:#fff;max-height:280px;overflow:auto}
.hasil-cari-rujukan p{margin:0 0 6px}
.hasil-cari-rujukan li a{display:flex;flex-direction:column;padding:8px 4px;color:#fff;text-decoration:none;border-top:1px solid rgba(255,255,255,.14)}
.hasil-cari-rujukan li a span{font-size:14px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (prefers-reduced-motion:reduce){.ubin-rujukan{transition:none}}
```

- [ ] **Step 4: Sambungkan di `Rujukan.tsx`**

Kerangka lama (hero mini + `Laci` + `main`) dipakai hanya bila `kode` atau `kitab` ada atau kategori dikenal. Tambah di atas `return`:

```tsx
const dikenal = DAFTAR_KATEGORI.some(isi => isi.id === kategori);
if (!kode && kitab === undefined && !dikenal) return <Awal />;
```

(`aktif` tidak lagi jatuh ke `DAFTAR_KATEGORI[0]` — hapus fallback itu.) Task 4 mengganti sisa kerangka lama.

- [ ] **Step 5: Verifikasi**

Run: `pnpm --filter @waris/web exec tsc --noEmit -p . && pnpm --filter @waris/web exec vitest run src/__tests__/belajar.test.tsx`
Expected: lulus, termasuk tiga tes baru.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/layar/rujukan apps/web/src/gaya/rujukan.css apps/web/src/main.tsx apps/web/src/__tests__/belajar.test.tsx
git commit -m "feat(web): Awal Rujukan dengan kolom cari dan ubin kategori

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Kategori: baris tab dan filter bab

**Files:**
- Create: `apps/web/src/layar/rujukan/BarisKategori.tsx`
- Modify: `Rujukan.tsx`, `Kategori.tsx`, `gaya/rujukan.css`, `__tests__/belajar.test.tsx`
- Delete dari `komponen.css`: `.isi-sidebar-rujukan` (baris 638-639) setelah tidak terpakai

**Interfaces:**
- Consumes: `DAFTAR_KATEGORI`, `jumlahDi`, `saringBab`, `daftarBabDi` (Task 1/2); `judulBab(bab: number)` dari `konten/judulBab`.
- Produces: `BarisKategori({ aktif }: { aktif: string })`; `DalilPerBab({ daftar, bab })` menerima filter `bab?: number` dari `IsiKategori` (state lokal `useState<number | undefined>`).

- [ ] **Step 1: Tes gagal**

```tsx
it('rujukan: kategori memakai baris tab; filter bab menyempitkan daftar; bab tanpa dalil → pesan', () => {
  const { container } = render(<Rujukan kategori="sunnah" />);
  expect(screen.getByRole('navigation', { name: 'Jenis dalil' }).querySelector('[aria-current="page"]')?.textContent).toMatch(/Sunnah/);
  expect(container.querySelector('aside, .modul-sidebar')).toBeNull();
  const semua = container.querySelectorAll('a[href^="#/rujukan/R"]').length;
  fireEvent.click(screen.getAllByRole('button', { name: /^Bab / })[0]!);
  expect(container.querySelectorAll('a[href^="#/rujukan/R"]').length).toBeLessThanOrEqual(semua);
});
```

Run: `pnpm --filter @waris/web exec vitest run src/__tests__/belajar.test.tsx -t "baris tab"` → FAIL.

- [ ] **Step 2: `BarisKategori.tsx`**

```tsx
// Baris tab kategori di atas isi kategori: pindah antarjenis dalil tanpa kembali ke Awal.
import { angka, t } from '../../terjemah';
import { tautanRujukan } from '../../rute';
import { DAFTAR_KATEGORI, jumlahDi } from './Kategori';

export function BarisKategori({ aktif }: { aktif: string }) {
  return (
    <nav className="baris-kategori" aria-label="Jenis dalil">
      {DAFTAR_KATEGORI.map(isi => (
        <a key={isi.id} href={tautanRujukan(isi.id)} aria-current={isi.id === aktif ? 'page' : undefined}>
          {isi.judul} <small>{angka(String(jumlahDi(isi)))}</small>
        </a>
      ))}
    </nav>
  );
}
```

Label `"Jenis dalil"` → pakai kunci diksi `rujukan.kategori_dalil` (sudah ada, `t('rujukan.kategori_dalil')`); sesuaikan nama di tes ke teks kunci itu.

- [ ] **Step 3: Filter bab di `DalilPerBab`** (state lokal, tautan teks, bukan tombol berbingkai)

```tsx
function DalilPerBab({ daftar }: { daftar: EntriRujukan[] }) {
  const [bab, setBab] = useState<number | undefined>();
  const tampil = saringBab(daftar, bab);
  const babTersedia = daftarBabDi(tampil);
  if (daftar.length === 0) return null;
  return (
    <section className="blok-rujukan">
      <h2>{t('rujukan.dipakai_untuk')}</h2>
      <div className="saring-bab" role="group" aria-label={t('rujukan.saring_bab')}>
        <button type="button" className="tautan-teks" aria-pressed={bab === undefined} onClick={() => setBab(undefined)}>{t('rujukan.semua_bab')}</button>
        {daftarBabDi(daftar).map(isi => (
          <button key={isi} type="button" className="tautan-teks" aria-pressed={bab === isi} onClick={() => setBab(isi)}>{`Bab ${angka(String(isi))}`}</button>
        ))}
      </div>
      {tampil.length === 0 && <p className="keterangan">{t('rujukan.bab_kosong')}</p>}
      {babTersedia.map(isi => ( /* details per bab seperti sebelumnya, memakai `tampil` */ ))}
    </section>
  );
}
```

Isi `details` per bab disalin dari versi lama dengan `daftar` diganti `tampil`; tambahkan label `perlu verifikasi` memakai `t('rujukan.label_perlu_verifikasi')` menggantikan `t('rujukan.masih_dikaji_2')` hanya bila kedua teks sama maknanya, jika tidak biarkan kunci lama. Cek `.tautan-teks` sudah ada: `grep -n "tautan-teks" apps/web/src/gaya/*.css`; bila belum, tambahkan `.tautan-teks{border:0;background:none;padding:0;font:inherit;color:var(--aksen-teks,var(--ink));text-decoration:underline;cursor:pointer}` dan `.tautan-teks[aria-pressed=true]{font-weight:700;text-decoration:none}` di `rujukan.css`.

- [ ] **Step 4: Ganti kerangka lama di `Rujukan.tsx`**

Hapus `HeroMini`, `Laci`, `ol.modul-sidebar`; tampilkan `<main className="konten-materi konten-rujukan"><BarisKategori aktif={...}/>…</main>` untuk kategori. Detail dan penampil kitab tetap di `<main>`.

- [ ] **Step 5: CSS baris kategori**

```css
.baris-kategori{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;scroll-behavior:smooth;padding:2px;mask-image:linear-gradient(90deg,transparent,#000 14px,#000 calc(100% - 14px),transparent)}
.baris-kategori::-webkit-scrollbar{display:none}
.baris-kategori a{flex:none;padding:8px 14px;border-radius:999px;text-decoration:none;color:var(--ink);background:var(--surface-raised)}
.baris-kategori a[aria-current=page]{background:var(--ink);color:#fff}
.saring-bab{display:flex;flex-wrap:wrap;gap:6px 14px}
```

- [ ] **Step 6: Verifikasi + commit**

Run: `pnpm --filter @waris/web exec tsc --noEmit -p . && pnpm --filter @waris/web exec vitest run src/__tests__/belajar.test.tsx`
Expected: lulus (tes "tiap dalil KB bisa dicapai" tetap lulus).

```bash
git add apps/web/src/layar/rujukan apps/web/src/gaya/rujukan.css apps/web/src/gaya/komponen.css apps/web/src/__tests__/belajar.test.tsx
git commit -m "feat(web): kategori Rujukan dengan baris tab dan filter bab

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Kartu dalil (ayat, hadits, kitab)

**Files:**
- Modify: `apps/web/src/layar/rujukan/KartuDalil.tsx`, `Kategori.tsx` (hadits memakai `KartuHadits`), `gaya/rujukan.css`, `__tests__/belajar.test.tsx`

**Interfaces:**
- Consumes: `Ayat`, `Hadits`, `Kitab` dari `@waris/content`; `daftarSyahid`, `sumberKitab`.
- Produces: `KartuAyat({ ayat })`, `KartuHadits({ hadits })`, `KartuKitab({ nomor })` (ketiganya diekspor).

- [ ] **Step 1: Ubah tes ayat** (placeholder lama dihapus; tab Arti/Tafsir tidak ada selama konten belum ada)

Ganti dua baris terakhir tes `"rujukan Al-Qur'an: memilih hukum…"` dengan:

```tsx
expect(screen.queryByRole('tab', { name: 'Arti' })).toBeNull();
expect(screen.queryByText(/belum diisi/)).toBeNull();
```

dan ubah judul tesnya jadi `"rujukan Al-Qur'an: memilih hukum menyorot syahidnya; tab kosong tidak dirender"`. Tambah:

```tsx
it('rujukan sunnah: status hadits tampil sebagai label', () => {
  const { container } = render(<Rujukan kategori="sunnah" />);
  expect(container.querySelectorAll('.label-status').length).toBeGreaterThan(0);
});
```

Run → FAIL.

- [ ] **Step 2: `KartuAyat`**: hapus `tab`, `TEKS_TAB`, tab-kecil, dan paragraf placeholder; hukum (daftar tombol sorot) langsung tampil tanpa `role="tabpanel"`. Tambah komentar: `// Arti dan tafsir ayat belum punya sumber di konten; dirender hanya bila sumbernya ada (diisi lewat MCP Qur'an terverifikasi).` Hapus kunci diksi `rujukan.arti_ayat_ini_belum_diisi_akan` / `tafsir…` dari pemakaian (kunci di snapshot dibiarkan).

- [ ] **Step 3: `KartuHadits`**

```tsx
export function KartuHadits({ hadits }: { hadits: Hadits }) {
  return (
    <li className="kartu kartu-rujukan">
      <p lang={/[؀-ۿ]/.test(hadits.hadits) ? 'ar' : undefined} dir="auto" className="teks-hadits">{hadits.hadits.replace(/[«»]/g, '')}</p>
      <p className="sumber-rujukan">{hadits.takhrij} <span className="label-status">{hadits.status.replace(/`/g, '')}</span></p>
    </li>
  );
}
```

Pakai di `IsiKategori` menggantikan `<li>` inline.

- [ ] **Step 4: `KartuKitab`**: "Baca di sini" tetap tombol utama (`aw-btn-primary`); "Situs sumber" jadi tautan teks (`<a className="tautan-teks">`), bukan `aw-btn-secondary`; bila tak ada tautan: teks redup `<span className="keterangan">{t('rujukan.situs_sumber_belum_tersedia')}</span>` bukan tombol nonaktif. Perbarui tes `'kitab tanpa sumber…'`: tombol `Baca di sini` nonaktif tetap diharapkan; hapus asersi untuk "Situs sumber".

Ubah tes menjadi:

```tsx
it('kitab tanpa berkas: aksi baca nonaktif berlabel; tanpa tautan sumber: teks redup', () => {
  render(<Rujukan kategori="kitab" />);
  for (const tombol of screen.getAllByRole('button', { name: /Baca di sini/ })) expect((tombol as HTMLButtonElement).disabled).toBe(true);
});
```

- [ ] **Step 5: CSS** `.label-status{display:inline-block;padding:2px 10px;border-radius:999px;background:var(--primary-soft);font-size:13px;font-weight:700}` dan sampul kitab (kartu dengan `border-inline-start:6px solid var(--b)`, warna berputar 5n seperti ubin) di `rujukan.css`.

- [ ] **Step 6: Verifikasi + commit**

Run: `pnpm --filter @waris/web exec tsc --noEmit -p . && pnpm --filter @waris/web exec vitest run src/__tests__/belajar.test.tsx`
Expected: lulus.

```bash
git add apps/web/src/layar/rujukan apps/web/src/gaya/rujukan.css apps/web/src/__tests__/belajar.test.tsx
git commit -m "feat(web): kartu ayat/hadits/kitab Rujukan; tab kosong tidak dirender

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Halaman satu dalil

**Files:**
- Modify: `apps/web/src/layar/rujukan/DetailDalil.tsx`, `gaya/rujukan.css`, `__tests__/belajar.test.tsx`

**Interfaces:**
- Consumes: `penggunaanDalil(kode)` (Task 1); `cariRujukan`; `Dalil` dari `layar/Penjelasan`; `judulBab`.
- Produces: `DetailDalil({ kode })`.

- [ ] **Step 1: Tes gagal**

```tsx
it('detail dalil: label status, dan "Dipakai di" memuat bab dalil', () => {
  const dalil = RUJUKAN.find(isi => isi.status === 'perluVerifikasi') ?? RUJUKAN[0]!;
  render(<Rujukan kode={dalil.kode} />);
  expect(screen.getByText('Dipakai di')).toBeTruthy();
  if (dalil.status === 'perluVerifikasi') expect(screen.getByText('perlu verifikasi')).toBeTruthy();
});
```

Run → FAIL.

- [ ] **Step 2: Implementasi** (menggantikan isi `DetailDalil`; kode tak dikenal tetap menampilkan `role="alert"` seperti sekarang)

```tsx
export function DetailDalil({ kode }: { kode: string }) {
  const rujukan = cariRujukan(kode);
  if (!rujukan) return <><a href={tautanRujukan()}>{t('rujukan.kembali_ke_rujukan')}</a><p role="alert">{t('rujukan.rujukan_kode_tidak_ada_di_daftar', { kode })}</p></>;
  const { hukum } = penggunaanDalil(kode);
  return (
    <>
      <p className="label-langkah">{judulBab(rujukan.bab)}</p>
      <h1>{rujukan.klaim}</h1>
      <p className="baris-label">
        {rujukan.status === 'perluVerifikasi' && <span className="label-status">{t('rujukan.label_perlu_verifikasi')}</span>}
        {rujukan.dhaif && <span className="label-status">{t('rujukan.label_dhaif')}</span>}
      </p>
      <div className="kartu kartu-rujukan"><Dalil daftarKode={[rujukan.kode]} diHalamanRujukan /></div>
      {rujukan.arab.map(teks => <blockquote key={teks} lang="ar" dir="rtl" className="kutipan-arab">{teks}</blockquote>)}
      {rujukan.arab.length === 0 && rujukan.kutipan && <p>{rujukan.kutipan}</p>}
      <section className="blok-rujukan">
        <h2>{t('rujukan.dipakai_di')}</h2>
        <p><a href={tautanRujukan(String(rujukan.bab) /* ganti ke tautan bab bila rutenya ada */)}>{judulBab(rujukan.bab)}</a></p>
        {hukum.length > 0 && (
          <>
            <p className="keterangan">{t('rujukan.hukum_bergantung')}</p>
            <ul>{hukum.map(isi => <li key={isi}>{isi}</li>)}</ul>
          </>
        )}
      </section>
    </>
  );
}
```

Catatan untuk pelaksana: tidak ada rute tautan-bab di Rujukan; jangan buat. Tampilkan `judulBab(rujukan.bab)` sebagai teks biasa (bukan `<a>`) kecuali `grep -n "tautanBab\|babRoute" apps/web/src/rute.ts` menemukan yang ada. Bagian "Dipakai di" dirender selalu (bab selalu ada); daftar hukum hanya bila tidak kosong.

- [ ] **Step 3: Verifikasi + commit**

Run: `pnpm --filter @waris/web exec tsc --noEmit -p . && pnpm --filter @waris/web exec vitest run src/__tests__/belajar.test.tsx`
Expected: lulus.

```bash
git add apps/web/src/layar/rujukan apps/web/src/gaya/rujukan.css apps/web/src/__tests__/belajar.test.tsx
git commit -m "feat(web): halaman satu dalil dengan label status dan tempat dipakai

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Penampil kitab, pembersihan CSS, verifikasi akhir

**Files:**
- Modify: `apps/web/src/layar/rujukan/PenampilKitab.tsx`, `gaya/rujukan.css`, `gaya/komponen.css` (hapus kelas rujukan yang tak terpakai)

**Interfaces:**
- Consumes: `DAFTAR_KITAB`, `sumberKitab`.
- Produces: `PenampilKitab({ nomor })` dengan bilah atas; iframe mengisi layar.

- [ ] **Step 1: Bilah atas + iframe penuh**

```tsx
export function PenampilKitab({ nomor }: { nomor: number }) {
  const kitab = DAFTAR_KITAB[nomor];
  const sumber = kitab && sumberKitab().find(isi => isi.judul === kitab.judul);
  if (!kitab || !sumber?.pdf) return <><a href={tautanRujukan('kitab')}>{t('rujukan.kembali_ke_daftar_kitab')}</a><p role="alert">{t('rujukan.berkas_kitab_ini_belum_tersedia')}</p></>;
  return (
    <div className="penampil-penuh">
      <header className="bilah-penampil">
        <a href={tautanRujukan('kitab')}>{t('rujukan.kembali_ke_daftar_kitab')}</a>
        <cite>{kitab.judul}</cite>
        {sumber.tautan && <a href={sumber.tautan} target="_blank" rel="noopener noreferrer">{t('rujukan.situs_sumber')}</a>}
      </header>
      <iframe className="penampil-kitab" src={`/kitab/${encodeURIComponent(sumber.pdf)}`} title={kitab.judul} />
    </div>
  );
}
```

CSS: `.penampil-penuh{display:flex;flex-direction:column;gap:8px;height:calc(100dvh - 120px)}` `.bilah-penampil{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}` `.penampil-penuh .penampil-kitab{flex:1;width:100%;border:0;border-radius:var(--radius-lg)}`.

- [ ] **Step 2: Hapus kelas mati.** Untuk tiap kelas di `komponen.css` baris ~638-699 yang berkaitan dengan Rujukan lama (`isi-sidebar-rujukan`, `kartu-ayat` bila tak dipakai lagi, dll.), jalankan `grep -rn "<kelas>" apps/web/src --include=*.tsx`; hapus hanya yang nol pemakai. Kelas yang masih dipakai (`kartu-rujukan`, `kutipan-arab`, `sumber-rujukan`, `blok-rujukan`, `konten-rujukan`) dibiarkan.

- [ ] **Step 3: Tes penuh**

Run: `pnpm --filter @waris/web exec tsc --noEmit -p . && pnpm --filter @waris/web test`
Expected: semua lulus (termasuk `diksi.test.ts`, yang menangkap kunci `t()` tak dikenal).

- [ ] **Step 4: Verifikasi di browser** (preview dev server dari `.claude/launch.json`)

Buka dan periksa: `#/rujukan` (hero, cari, ubin), `#/rujukan/quran`, `#/rujukan/sunnah`, `#/rujukan/kitab`, `#/rujukan/R09-4`, `#/rujukan/kitab/0` bila ada PDF; lebar 375px; mode gelap; bahasa Arab (RTL). Tidak ada error konsol; tautan lama (`#/rujukan/<kode>` dari Chip Dalil di Materi) masih terbuka.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/layar/rujukan apps/web/src/gaya/rujukan.css apps/web/src/gaya/komponen.css
git commit -m "feat(web): penampil kitab penuh layar; bersihkan CSS Rujukan lama

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
