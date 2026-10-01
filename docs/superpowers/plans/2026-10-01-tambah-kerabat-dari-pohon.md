# Tambah Orang dari Pohon (Tahap 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pengguna menambah, mengubah, dan menghapus orang langsung dari pohon di langkah Keluarga, termasuk lewat nama hubungan (mertua, menantu, besan, ipar, anak tiri, dst.), dengan pohon yang seimbang dan tidak melebar ke samping.

**Architecture:** Dua modul fungsi murni di `apps/web/src` (`kerabatPohon.ts` untuk aksi dasar, `hubunganPohon.ts` untuk nama hubungan sebagai jalur aksi) menyusun graf lewat pembangun yang sudah ada di `checklist.ts` dan engine. Engine tidak diubah. Tata letak (`hasil/tataLetak.ts`) diberi invarian keseimbangan yang dites. UI: pohon di panggung wizard menjadi interaktif (menu orang, dialog tambah, konfirmasi hapus, tautan nama hubungan).

**Tech Stack:** TypeScript, React 18, Vitest + Testing Library, `@waris/engine` (graf), diksi via `pnpm diksi:tambah`.

**Spec:** `docs/superpowers/specs/2026-10-01-tambah-kerabat-dari-pohon-design.md` (induk: `2026-10-01-perjalanan-keresahan-design.md` bagian 5).

## Global Constraints

- Engine (`packages/engine`) **tidak diubah**. Tidak ada aturan fikih baru di UI.
- Semua teks tampil lewat `t('kunci.literal')`; **kunci harus literal** dan tanpa teks Indonesia di JSX/atribut (dijaga `__tests__/diksi.test.ts`). Kunci baru diawali `hitung.pohon.` dan ditambah dengan `pnpm diksi:tambah <file.json>` (jangan sunting `snapshot.json` manual).
- Teks baru **tanpa kata "kerabat"**. Pakai "orang", "keluarga", atau nama hubungan konkret.
- Aksi sekunder = teks/tautan, bukan tombol berbingkai. Tombol hanya untuk Simpan/Batal di dialog (`Tombol`).
- Ikon SVG, bukan emoji. Gerak hanya CSS dan mati bila `prefers-reduced-motion`.
- Nama variabel/fungsi/komentar Bahasa Indonesia; istilah fikih sesuai glosarium.
- `exactOptionalPropertyTypes` aktif: properti opsional ditulis `x?: T | undefined` bila perlu diberi nilai `undefined`.
- Batas 4 istri [R04-3] dijaga `opsiRelasi`; jangan menyalinnya.
- Commit tiap task, hanya file milik task. Akhiri pesan commit dengan `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Keputusan yang menyimpang dari spec (tertulis agar bisa dikoreksi)

1. Pada jalur nama hubungan, "orang lain, belum dicatat" **hanya** ditawarkan untuk langkah orang tua (ayah/ibu, dibuat sebagai penghubung, pola yang sudah ada). Untuk langkah anak, pasangan, dan saudara, orangnya harus sudah ada; bila belum, muncul pesan "Tambahkan … dulu". Alasan: jenis kelamin penghubung anak/pasangan tidak diketahui dan memaksa pertanyaan tambahan.
2. Jangkar ditanyakan hanya bila kandidat ≥ 2; kandidat tunggal dipakai otomatis.
3. **Ayah tiri tidak didukung**: `opsiRelasi` melarang suami kedua bagi seorang ibu (janda menikah lagi = fixture Tahap 3). Ibu tiri (istri lain ayah) didukung.
4. Buyut dan cicit memakai langkah yang sama dengan nama lain; saudara kandung/seayah/seibu tidak diulang di daftar nama hubungan karena sudah ada di menu "+ Saudara".
5. Lipat cabang ("+3 orang") dan nol-silang **tidak** dibangun di sini (Tahap 3). Keseimbangan dijaga lewat batas lebar per baris yang bisa diatur, urutan sisi, dan skala.

## Review Focus

- Menghapus orang yang tercatat di `urutanWafat`, `dikandungSetelahWafat`, atau `wafatSesudahDibagi` tidak boleh meninggalkan id menggantung (tes di Task 1 lewat `rapikanKeadaan`, di Task 5 lewat UI).
- Memanggil jalur yang sama dua kali tidak menumpuk penghubung baru (Task 2).
- Pewaris tidak bisa dihapus; penghubung yang masih punya keturunan tidak menampilkan "Hapus" (Task 1, 5).
- Nama hanya spasi pada hubungan yang wajib nama tidak boleh lolos Simpan (Task 5).
- HP 375px: menu tidak keluar layar, pohon di panggung tetap terbaca (Task 4, 6).
- Pohon dengan 4 istri + anak masing-masing, atau 7+ saudara, tidak melebar melewati panggung (Task 3, 6).
- Keyboard: Enter membuka menu, Esc menutup dan fokus kembali ke kotak (Task 4).

## File Structure

| File | Tanggung jawab |
|---|---|
| `apps/web/src/checklist.ts` (ubah) | Hanya menambah `export` pada pembangun yang sudah ada |
| `apps/web/src/kerabatPohon.ts` (baru) | Aksi dasar per orang: `aksiTersedia`, `tambahDariOrang`, `dampakHapus`, `bolehHapus` |
| `apps/web/src/hubunganPohon.ts` (baru) | Tabel nama hubungan + `selesaikanJalur` |
| `apps/web/src/hasil/tataLetak.ts` (ubah) | `jumlahPerBaris`, urutan stabil, konstanta batas |
| `apps/web/src/hasil/Pohon.tsx` (ubah) | Prop `maksPerBaris`, `saatPilih` untuk penghubung, `labelPilih` |
| `apps/web/src/hasil/PratinjauPohon.tsx` (ubah) | Prop `interaktif` (tanpa `inert`) |
| `apps/web/src/ui/Dialog.tsx` (ubah) | Prop `lanjutNonaktif` pada `DialogKonfirmasi` |
| `apps/web/src/layar/wizard/PohonKeluarga.tsx` (baru) | Pohon interaktif + pengelola menu/dialog |
| `apps/web/src/layar/wizard/MenuOrang.tsx` (baru) | Panel tautan yang naik dari kotak |
| `apps/web/src/layar/wizard/DialogTambahOrang.tsx` (baru) | Dialog satu layar tambah orang (menu dan nama hubungan) |
| `apps/web/src/layar/wizard/PanggungPohon.tsx` (ubah) | Memakai `PohonKeluarga` di langkah Keluarga |
| `apps/web/src/gaya/wizard.css` (ubah) | Gaya menu, tautan, orang baru memudar masuk |
| `apps/web/src/__tests__/*.test.ts(x)` | Satu berkas tes per modul |

---

### Task 1: Aksi dasar per orang (`kerabatPohon.ts`)

**Files:**
- Modify: `apps/web/src/checklist.ts` (tambah `export`)
- Create: `apps/web/src/kerabatPohon.ts`
- Create: `apps/web/src/__tests__/kerabatPohon.test.ts`
- Create: `docs/superpowers/plans/diksi-pohon-1.json` (sementara; hapus setelah dipakai)

**Interfaces:**
- Consumes: `opsiRelasi`, `tambahKerabat` (`@waris/engine`); dari `checklist.ts`: `hapusAhliWaris`, `hubungkanAnakTanpaOrangTuaLain`, `idBaru`, `tambahSaudara`, `ubahNama`.
- Produces:
  ```ts
  export const PASANGAN_LAIN = 'PASANGAN_LAIN';
  export type Aksi = 'orangTua' | 'pasangan' | 'anak' | 'saudara';
  export type JalurSaudara = 'kandung' | 'sebapak' | 'seibu';
  export type Masukan =
    | { aksi: 'orangTua'; sebagai: 'ayah' | 'ibu'; nama?: string | undefined }
    | { aksi: 'pasangan'; nama?: string | undefined }
    | { aksi: 'anak'; jenisKelamin: 'L' | 'P'; idPasangan?: IdOrang | undefined; nama?: string | undefined }   // idPasangan === PASANGAN_LAIN: orang tua lain tidak dicatat
    | { aksi: 'saudara'; jenisKelamin: 'L' | 'P'; jalur: JalurSaudara; nama?: string | undefined };
  export const pasanganAktif: (graf: GrafKeluarga, idOrang: IdOrang) => IdOrang[];
  export function aksiTersedia(graf: GrafKeluarga, idOrang: IdOrang): Aksi[];
  export function tambahDariOrang(graf: GrafKeluarga, idOrang: IdOrang, masukan: Masukan): { graf: GrafKeluarga; idBaru: IdOrang };
  export function dampakHapus(graf: GrafKeluarga, idOrang: IdOrang): { menjadiPenghubung: boolean; pasangan: IdOrang[] };
  export function bolehHapus(graf: GrafKeluarga, idOrang: IdOrang): boolean;
  ```

- [ ] **Step 1: Ekspor pembangun yang dibutuhkan dari `checklist.ts`**

Di `apps/web/src/checklist.ts` tambahkan kata `export` pada deklarasi berikut (tanpa mengubah isinya): `function idBaru`, `const ubahOrang`, `function hubungkanAnakTanpaOrangTuaLain`, `function isiOrangTua`, `function tambahSaudara`, `const pastikanOrangTua`.

Run: `cd apps/web && npx tsc --noEmit`
Expected: tanpa galat.

- [ ] **Step 2: Tulis tes yang gagal**

`apps/web/src/__tests__/kerabatPohon.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { GrafKeluarga, KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan } from '../kasus';
import { aksiTersedia, bolehHapus, dampakHapus, pasanganAktif, PASANGAN_LAIN, tambahDariOrang } from '../kerabatPohon';

const bangun = (kunci: KunciAhliWaris[]): GrafKeluarga =>
  kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasusBaru('L').graf);

describe('aksiTersedia', () => {
  it('pewaris kosong: orang tua, pasangan, anak, saudara', () => {
    expect(aksiTersedia(bangun([]), 'PEWARIS')).toEqual(['orangTua', 'pasangan', 'anak', 'saudara']);
  });
  it('ayah dan ibu sudah terisi: orang tua hilang', () => {
    expect(aksiTersedia(bangun(['AYAH', 'IBU']), 'PEWARIS')).not.toContain('orangTua');
  });
  it('empat istri: pasangan hilang [R04-3]', () => {
    expect(aksiTersedia(bangun(['ISTRI', 'ISTRI', 'ISTRI', 'ISTRI']), 'PEWARIS')).not.toContain('pasangan');
  });
});

describe('tambahDariOrang', () => {
  it('pasangan pewaris laki-laki = istri, bernama', () => {
    const { graf, idBaru } = tambahDariOrang(bangun([]), 'PEWARIS', { aksi: 'pasangan', nama: '  Siti ' });
    expect(graf.orang[idBaru]).toMatchObject({ jenisKelamin: 'P', nama: 'Siti' });
    expect(graf.pernikahan).toEqual([{ idSuami: 'PEWARIS', idIstri: idBaru, status: 'utuh' }]);
  });
  it('anak lewat menu = anak lewat daftar ± (graf identik)', () => {
    const awal = bangun(['ISTRI']);
    const lewatMenu = tambahDariOrang(awal, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L' }).graf;
    expect(lewatMenu).toEqual(tambahAhliWaris(awal, 'PEWARIS', 'ANAK_LK'));
  });
  it('dua istri hidup tanpa pilihan: galat; dengan pilihan atau PASANGAN_LAIN: lolos', () => {
    const graf = bangun(['ISTRI', 'ISTRI']);
    const [istri1] = pasanganAktif(graf, 'PEWARIS');
    expect(() => tambahDariOrang(graf, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L' })).toThrow();
    expect(tambahDariOrang(graf, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L', idPasangan: istri1 }).graf.orang).toBeTruthy();
    const lain = tambahDariOrang(graf, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'P', idPasangan: PASANGAN_LAIN });
    expect(lain.graf.orang[lain.idBaru]!.idIbu).toBeUndefined();
  });
  it('orang tua: ayah menempel pada idAyah', () => {
    const { graf, idBaru } = tambahDariOrang(bangun([]), 'PEWARIS', { aksi: 'orangTua', sebagai: 'ayah' });
    expect(graf.orang.PEWARIS!.idAyah).toBe(idBaru);
    expect(() => tambahDariOrang(graf, 'PEWARIS', { aksi: 'orangTua', sebagai: 'ayah' })).toThrow();
  });
  it('saudara sebapak: ayah sama, ibu berbeda', () => {
    const awal = bangun(['AYAH', 'IBU']);
    const { graf, idBaru } = tambahDariOrang(awal, 'PEWARIS', { aksi: 'saudara', jenisKelamin: 'L', jalur: 'sebapak' });
    expect(graf.orang[idBaru]!.idAyah).toBe(awal.orang.PEWARIS!.idAyah);
    expect(graf.orang[idBaru]!.idIbu).not.toBe(awal.orang.PEWARIS!.idIbu);
  });
});

describe('hapus', () => {
  it('pewaris tidak boleh dihapus', () => {
    expect(bolehHapus(bangun([]), 'PEWARIS')).toBe(false);
  });
  it('orang dengan keturunan menjadi penghubung; yang penghubung dan masih punya keturunan tidak menampilkan hapus', () => {
    const awal = tambahDariOrang(bangun(['ANAK_LK']), 'PEWARIS', { aksi: 'pasangan' }).graf;
    const anak = Object.values(awal.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    const dengan = tambahDariOrang(awal, anak, { aksi: 'anak', jenisKelamin: 'L' }).graf;
    expect(dampakHapus(dengan, anak).menjadiPenghubung).toBe(true);
    expect(dampakHapus(dengan, anak).pasangan).toEqual([]);
    expect(bolehHapus(dengan, anak)).toBe(true);
  });
  it('rapikanKeadaan membuang id yang sudah dihapus dari urutan wafat', () => {
    let kasus = { ...kasusBaru('L'), graf: bangun(['ANAK_LK']) };
    const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [anak]: { ...kasus.graf.orang[anak]!, statusHidup: 'hidup' } } }, urutanWafat: [anak] };
    const { [anak]: _hapus, ...sisa } = kasus.graf.orang;
    const rapi = rapikanKeadaan({ ...kasus, graf: { ...kasus.graf, orang: sisa } });
    expect(rapi.urutanWafat).toEqual([]);
  });
});
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `cd apps/web && npx vitest run src/__tests__/kerabatPohon.test.ts`
Expected: FAIL (modul `../kerabatPohon` belum ada).

- [ ] **Step 4: Tambah kunci teks**

`docs/superpowers/plans/diksi-pohon-1.json`:

```json
[
  {"kunci":"hitung.pohon.pilih_pasangan_anak","id":"Pilih dulu anak ini dari pasangan yang mana."}
]
```

Run: `pnpm diksi:tambah docs/superpowers/plans/diksi-pohon-1.json` lalu `rm docs/superpowers/plans/diksi-pohon-1.json`
Expected: `1 kunci ditambahkan`.

- [ ] **Step 5: Tulis implementasi**

`apps/web/src/kerabatPohon.ts`:

```ts
// Aksi menu orang di pohon (spec Tahap 4 bagian 2): menerima graf + satu orang, menyerahkan graf baru.
// Hanya menyusun graf lewat pembangun yang sudah ada (engine graf.ts dan checklist.ts), tanpa aturan fikih.
// Hubungan jauh (mertua, besan, dst.) disusun dari aksi-aksi ini di hubunganPohon.ts.

import { opsiRelasi, tambahKerabat, type GrafKeluarga, type IdOrang } from '@waris/engine';
import { hapusAhliWaris, hubungkanAnakTanpaOrangTuaLain, idBaru, tambahSaudara, ubahNama } from './checklist';
import { t } from './terjemah';

export const PASANGAN_LAIN = 'PASANGAN_LAIN';
export type Aksi = 'orangTua' | 'pasangan' | 'anak' | 'saudara';
export type JalurSaudara = 'kandung' | 'sebapak' | 'seibu';
export type Masukan =
  | { aksi: 'orangTua'; sebagai: 'ayah' | 'ibu'; nama?: string | undefined }
  | { aksi: 'pasangan'; nama?: string | undefined }
  | { aksi: 'anak'; jenisKelamin: 'L' | 'P'; idPasangan?: IdOrang | undefined; nama?: string | undefined }
  | { aksi: 'saudara'; jenisKelamin: 'L' | 'P'; jalur: JalurSaudara; nama?: string | undefined };
type Hasil = { graf: GrafKeluarga; idBaru: IdOrang };

/** Pasangan yang pernikahannya belum talak bain (urutan pernikahan). */
export const pasanganAktif = (graf: GrafKeluarga, idOrang: IdOrang): IdOrang[] =>
  graf.pernikahan
    .filter(nikah => nikah.status !== 'talakBain' && (nikah.idSuami === idOrang || nikah.idIstri === idOrang))
    .map(nikah => (nikah.idSuami === idOrang ? nikah.idIstri : nikah.idSuami));

/** Aksi yang boleh ditawarkan di menu; yang tidak mungkin (slot terisi, batas istri) tidak tampil. */
export function aksiTersedia(graf: GrafKeluarga, idOrang: IdOrang): Aksi[] {
  const orang = graf.orang[idOrang]!;
  const aksi: Aksi[] = [];
  if (!orang.idAyah || !orang.idIbu) aksi.push('orangTua');
  if (opsiRelasi(graf, idOrang).some(relasi => relasi === 'suami' || relasi === 'istri')) aksi.push('pasangan');
  aksi.push('anak', 'saudara');
  return aksi;
}

export function tambahDariOrang(graf: GrafKeluarga, idOrang: IdOrang, masukan: Masukan): Hasil {
  const hasil = bangunDari(graf, idOrang, masukan);
  return masukan.nama?.trim() ? { ...hasil, graf: ubahNama(hasil.graf, hasil.idBaru, masukan.nama) } : hasil;
}

function bangunDari(graf: GrafKeluarga, idOrang: IdOrang, masukan: Masukan): Hasil {
  const id = idBaru(graf);
  switch (masukan.aksi) {
    case 'orangTua':
      return { graf: tambahKerabat(graf, idOrang, masukan.sebagai, { id }), idBaru: id };
    case 'pasangan': {
      const relasi = graf.orang[idOrang]!.jenisKelamin === 'L' ? 'istri' : 'suami';
      return { graf: hubungkanAnakTanpaOrangTuaLain(tambahKerabat(graf, idOrang, relasi, { id }), idOrang), idBaru: id };
    }
    case 'anak': {
      const hidup = pasanganAktif(graf, idOrang).filter(pasangan => graf.orang[pasangan]!.statusHidup !== 'wafat');
      if (hidup.length > 1 && masukan.idPasangan === undefined) throw new Error(t('hitung.pohon.pilih_pasangan_anak'));
      const orangTuaLain = masukan.idPasangan === PASANGAN_LAIN ? undefined : masukan.idPasangan ?? hidup[0];
      const relasi = masukan.jenisKelamin === 'L' ? 'anakLaki' : 'anakPerempuan';
      return { graf: tambahKerabat(graf, idOrang, relasi, { id }, orangTuaLain ? { idOrangTuaLain: orangTuaLain } : {}), idBaru: id };
    }
    case 'saudara': {
      const hasil = tambahSaudara(graf, idOrang, masukan.jalur, masukan.jenisKelamin, {});
      return { graf: hasil.graf, idBaru: hasil.idOrang };
    }
  }
}

/** Dampak menghapus: yang punya keturunan tetap di graf sebagai penghubung (garis keturunan utuh); pernikahannya putus. */
export function dampakHapus(graf: GrafKeluarga, idOrang: IdOrang): { menjadiPenghubung: boolean; pasangan: IdOrang[] } {
  return {
    menjadiPenghubung: Object.values(graf.orang).some(orang => orang.idAyah === idOrang || orang.idIbu === idOrang),
    pasangan: graf.pernikahan.flatMap(nikah => (nikah.idSuami === idOrang ? [nikah.idIstri] : nikah.idIstri === idOrang ? [nikah.idSuami] : [])),
  };
}

/** Pewaris tidak bisa dihapus; penghubung yang masih punya keturunan sudah "terhapus" dan tidak perlu tautan hapus. */
export const bolehHapus = (graf: GrafKeluarga, idOrang: IdOrang): boolean =>
  idOrang !== graf.idPewaris && !(graf.orang[idOrang]!.penghubung && dampakHapus(graf, idOrang).menjadiPenghubung);

export { hapusAhliWaris };
```

- [ ] **Step 6: Jalankan, pastikan lolos**

Run: `cd apps/web && npx vitest run src/__tests__/kerabatPohon.test.ts && npx tsc --noEmit`
Expected: semua lolos, tanpa galat tipe. Bila tes "graf identik" gagal karena urutan properti atau id, bandingkan dengan `toEqual` (urutan kunci tidak berpengaruh); bila beda isi, samakan `kerabatPohon` dengan `tambahAnakDariMayit` di `checklist.ts`, bukan sebaliknya.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/checklist.ts apps/web/src/kerabatPohon.ts apps/web/src/__tests__/kerabatPohon.test.ts apps/web/src/snapshot.json
git commit -m "feat(web): kerabatPohon: aksi tambah orang tua/pasangan/anak/saudara dan dampak hapus dari satu orang" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Nama hubungan sebagai jalur (`hubunganPohon.ts`)

**Files:**
- Create: `apps/web/src/hubunganPohon.ts`
- Create: `apps/web/src/__tests__/hubunganPohon.test.ts`
- Create: `docs/superpowers/plans/diksi-pohon-2.json` (sementara)

**Interfaces:**
- Consumes: Task 1 (`tambahDariOrang`, `pasanganAktif`, `PASANGAN_LAIN`, `JalurSaudara`); `checklist.ts`: `pastikanOrangTua`, `isiOrangTua`.
- Produces:
  ```ts
  export type KunciHubungan = keyof typeof HUBUNGAN;
  export interface Jawaban { jenisKelamin?: 'L' | 'P' | undefined; nama?: string | undefined; pilihan?: string[] | undefined }
  export interface Pilihan { nilai: string; label: string }
  export type HasilJalur =
    | { graf: GrafKeluarga; idBaru: IdOrang }
    | { pertanyaan: { indeks: number; judul: string; pilihan: Pilihan[] } }
    | { galat: string };
  export const HUBUNGAN: Record<string, { label: string; perantara: Langkah[]; akhir: Akhir; tanyaKelamin: boolean; wajibNama: boolean; kecualiOrangTuaPusat?: true }>;
  export function selesaikanJalur(graf: GrafKeluarga, idPusat: IdOrang, kunci: KunciHubungan, jawaban?: Jawaban): HasilJalur;
  ```
  `wajibNama` = hasil bukan jenis di daftar ± (`hitungIsian`), dites terhadap `hitungIsian` di Step 2.

- [ ] **Step 1: Tambah kunci teks**

`docs/superpowers/plans/diksi-pohon-2.json`:

```json
[
  {"kunci":"hitung.pohon.hub_kakek_dari_ayah","id":"Kakek dari ayah"},
  {"kunci":"hitung.pohon.hub_nenek_dari_ayah","id":"Nenek dari ayah"},
  {"kunci":"hitung.pohon.hub_kakek_dari_ibu","id":"Kakek dari ibu"},
  {"kunci":"hitung.pohon.hub_nenek_dari_ibu","id":"Nenek dari ibu"},
  {"kunci":"hitung.pohon.hub_buyut","id":"Buyut"},
  {"kunci":"hitung.pohon.hub_cucu","id":"Cucu"},
  {"kunci":"hitung.pohon.hub_cicit","id":"Cicit"},
  {"kunci":"hitung.pohon.hub_paman","id":"Paman"},
  {"kunci":"hitung.pohon.hub_bibi","id":"Bibi"},
  {"kunci":"hitung.pohon.hub_keponakan","id":"Keponakan"},
  {"kunci":"hitung.pohon.hub_sepupu","id":"Sepupu"},
  {"kunci":"hitung.pohon.hub_mertua","id":"Mertua"},
  {"kunci":"hitung.pohon.hub_menantu","id":"Menantu"},
  {"kunci":"hitung.pohon.hub_besan","id":"Besan"},
  {"kunci":"hitung.pohon.hub_ipar_saudara_pasangan","id":"Ipar: saudara dari pasangan"},
  {"kunci":"hitung.pohon.hub_ipar_pasangan_saudara","id":"Ipar: pasangan dari saudara"},
  {"kunci":"hitung.pohon.hub_cucu_menantu","id":"Cucu menantu"},
  {"kunci":"hitung.pohon.hub_anak_tiri","id":"Anak tiri"},
  {"kunci":"hitung.pohon.hub_ibu_tiri","id":"Ibu tiri"},
  {"kunci":"hitung.pohon.hub_saudara_tiri","id":"Saudara tiri (tidak seayah dan tidak seibu)"},
  {"kunci":"hitung.pohon.hub_mantan","id":"Mantan istri atau suami"},
  {"kunci":"hitung.pohon.tanya_orang_tua","id":"Dari pihak ayah atau ibu?"},
  {"kunci":"hitung.pohon.tanya_pasangan","id":"Pasangan yang mana?"},
  {"kunci":"hitung.pohon.tanya_anak","id":"Anak yang mana?"},
  {"kunci":"hitung.pohon.tanya_saudara","id":"Saudara yang mana?"},
  {"kunci":"hitung.pohon.ayah","id":"Ayah"},
  {"kunci":"hitung.pohon.ibu","id":"Ibu"},
  {"kunci":"hitung.pohon.belum_ada_pasangan","id":"Tambahkan pasangannya dulu."},
  {"kunci":"hitung.pohon.belum_ada_anak","id":"Tambahkan anaknya dulu."},
  {"kunci":"hitung.pohon.belum_ada_saudara","id":"Tambahkan saudaranya dulu."},
  {"kunci":"hitung.pohon.sudah_terisi","id":"Orang ini sudah tercatat. Ketuk namanya di pohon untuk mengubah."},
  {"kunci":"hitung.pohon.tanpa_nama","id":"Orang {nomor} (belum bernama)"},
  {"kunci":"hitung.pohon.kelamin_wajib","id":"Pilih laki-laki atau perempuan."}
]
```

Run: `pnpm diksi:tambah docs/superpowers/plans/diksi-pohon-2.json && rm docs/superpowers/plans/diksi-pohon-2.json`
Expected: `33 kunci ditambahkan`.

- [ ] **Step 2: Tulis tes yang gagal**

`apps/web/src/__tests__/hubunganPohon.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { jalankan } from '../jalankan';
import { kasusBaru } from '../kasus';
import { HUBUNGAN, selesaikanJalur, type KunciHubungan } from '../hubunganPohon';
import { pasanganAktif } from '../kerabatPohon';

const bangun = (kunci: KunciAhliWaris[]): GrafKeluarga =>
  kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasusBaru('L').graf);
const anakDari = (g: GrafKeluarga, id: IdOrang) => Object.values(g.orang).filter(o => o.idAyah === id || o.idIbu === id).map(o => o.id);
const saudaraDari = (g: GrafKeluarga, id: IdOrang) => Object.values(g.orang).filter(o => o.id !== id &&
  ((o.idAyah && o.idAyah === g.orang[id]!.idAyah) || (o.idIbu && o.idIbu === g.orang[id]!.idIbu))).map(o => o.id);
const ortuDari = (g: GrafKeluarga, id: IdOrang) => [g.orang[id]!.idAyah, g.orang[id]!.idIbu].filter((x): x is IdOrang => !!x);

// Keluarga dasar: pewaris (L), 1 istri, 2 anak (L, P), 1 saudara kandung, ayah dan ibu.
const dasar = () => bangun(['ISTRI', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG', 'AYAH', 'IBU']);
const anakLk = (g: GrafKeluarga) => Object.values(g.orang).find(o => o.idAyah === 'PEWARIS' && o.jenisKelamin === 'L')!.id;

/** Syarat jalur dari sudut pandang graf hasil: orang baru memang terhubung ke pusat lewat langkah yang dimaksud. */
const SYARAT: Record<KunciHubungan, (g: GrafKeluarga, baru: IdOrang) => boolean> = {
  kakekDariAyah: (g, b) => ortuDari(g, g.orang.PEWARIS!.idAyah!).includes(b) && g.orang[b]!.jenisKelamin === 'L',
  nenekDariAyah: (g, b) => ortuDari(g, g.orang.PEWARIS!.idAyah!).includes(b) && g.orang[b]!.jenisKelamin === 'P',
  kakekDariIbu: (g, b) => ortuDari(g, g.orang.PEWARIS!.idIbu!).includes(b) && g.orang[b]!.jenisKelamin === 'L',
  nenekDariIbu: (g, b) => ortuDari(g, g.orang.PEWARIS!.idIbu!).includes(b) && g.orang[b]!.jenisKelamin === 'P',
  buyut: (g, b) => ortuDari(g, g.orang.PEWARIS!.idAyah!).some(kakek => ortuDari(g, kakek).includes(b)),
  cucu: (g, b) => anakDari(g, 'PEWARIS').some(a => anakDari(g, a).includes(b)),
  cicit: (g, b) => anakDari(g, 'PEWARIS').some(a => anakDari(g, a).some(c => anakDari(g, c).includes(b))),
  paman: (g, b) => ortuDari(g, 'PEWARIS').some(o => saudaraDari(g, o).includes(b)) && g.orang[b]!.jenisKelamin === 'L',
  bibi: (g, b) => ortuDari(g, 'PEWARIS').some(o => saudaraDari(g, o).includes(b)) && g.orang[b]!.jenisKelamin === 'P',
  keponakan: (g, b) => saudaraDari(g, 'PEWARIS').some(s => anakDari(g, s).includes(b)),
  sepupu: (g, b) => ortuDari(g, 'PEWARIS').some(o => saudaraDari(g, o).some(p => anakDari(g, p).includes(b))),
  mertua: (g, b) => pasanganAktif(g, 'PEWARIS').some(p => ortuDari(g, p).includes(b)),
  menantu: (g, b) => anakDari(g, 'PEWARIS').some(a => pasanganAktif(g, a).includes(b)),
  besan: (g, b) => anakDari(g, 'PEWARIS').some(a => pasanganAktif(g, a).some(m => ortuDari(g, m).includes(b))),
  iparSaudaraPasangan: (g, b) => pasanganAktif(g, 'PEWARIS').some(p => saudaraDari(g, p).includes(b)),
  iparPasanganSaudara: (g, b) => saudaraDari(g, 'PEWARIS').some(s => pasanganAktif(g, s).includes(b)),
  cucuMenantu: (g, b) => anakDari(g, 'PEWARIS').some(a => anakDari(g, a).some(c => pasanganAktif(g, c).includes(b))),
  anakTiri: (g, b) => pasanganAktif(g, 'PEWARIS').some(p => anakDari(g, p).includes(b) && g.orang[b]!.idAyah !== 'PEWARIS'),
  ibuTiri: (g, b) => pasanganAktif(g, g.orang.PEWARIS!.idAyah!).includes(b) && b !== g.orang.PEWARIS!.idIbu,
  saudaraTiri: (g, b) => !saudaraDari(g, 'PEWARIS').includes(b) && ortuDari(g, b).some(o => pasanganAktif(g, g.orang.PEWARIS!.idAyah!).includes(o)),
  mantan: (g, b) => g.pernikahan.some(n => n.status === 'talakBain' && (n.idSuami === b || n.idIstri === b)),
};

/** Jawaban untuk tiap hubungan pada keluarga dasar (+ persiapan bila jalurnya melewati orang yang belum ada). */
function skenario(kunci: KunciHubungan): { graf: GrafKeluarga; jawaban: Parameters<typeof selesaikanJalur>[3] } {
  const g = dasar();
  const lk = anakLk(g);
  const jk = { jenisKelamin: 'L' as const, nama: 'Zaid' };
  switch (kunci) {
    case 'buyut': return { graf: g, jawaban: { ...jk, pilihan: ['ayah', 'ayah'] } };
    case 'paman': case 'bibi': return { graf: g, jawaban: { ...jk, jenisKelamin: kunci === 'paman' ? 'L' : 'P', pilihan: ['ayah'] } };
    case 'sepupu': return { graf: g, jawaban: { ...jk, pilihan: ['ayah'] } };
    case 'cucu': return { graf: g, jawaban: { ...jk, pilihan: [lk] } };
    case 'cicit': return { graf: tambahAhliWaris(g, lk, 'ANAK_LK'), jawaban: { ...jk, pilihan: [lk] } };
    case 'menantu': return { graf: g, jawaban: { ...jk, pilihan: [lk] } };
    case 'besan': return { graf: selesaikanJalurAtauGagal(g, 'menantu', { ...jk, pilihan: [lk] }), jawaban: { ...jk, nama: 'Besan', pilihan: [lk] } };
    case 'cucuMenantu': return { graf: tambahAhliWaris(g, lk, 'ANAK_LK'), jawaban: { ...jk, pilihan: [lk, anakDari(tambahAhliWaris(g, lk, 'ANAK_LK'), lk)[0]!] } };
    case 'keponakan': return { graf: g, jawaban: { ...jk } };
    case 'anakTiri': return { graf: g, jawaban: { ...jk } };
    case 'saudaraTiri': return { graf: selesaikanJalurAtauGagal(g, 'ibuTiri', { nama: 'Ibu tiri' }), jawaban: { ...jk } };
    default: return { graf: g, jawaban: { ...jk, ...(HUBUNGAN[kunci].tanyaKelamin ? {} : {}) } };
  }
}
function selesaikanJalurAtauGagal(g: GrafKeluarga, kunci: KunciHubungan, jawaban: Parameters<typeof selesaikanJalur>[3]): GrafKeluarga {
  const hasil = selesaikanJalur(g, 'PEWARIS', kunci, jawaban);
  if (!('graf' in hasil)) throw new Error(`persiapan ${kunci} gagal: ${JSON.stringify(hasil)}`);
  return hasil.graf;
}

describe('tiap nama hubungan menghasilkan graf yang benar dan engine tetap OK', () => {
  for (const kunci of Object.keys(HUBUNGAN) as KunciHubungan[]) {
    it(kunci, () => {
      const { graf, jawaban } = skenario(kunci);
      const hasil = selesaikanJalur(graf, 'PEWARIS', kunci, jawaban);
      if (!('graf' in hasil)) throw new Error(JSON.stringify(hasil));
      expect(hasil.graf.orang[hasil.idBaru]!.nama).toBe((jawaban as { nama?: string }).nama ?? 'Zaid');
      expect(SYARAT[kunci](hasil.graf, hasil.idBaru)).toBe(true);
      const kasus = { ...kasusBaru('L'), graf: hasil.graf, tirkah: { ...kasusBaru('L').tirkah, kotor: 1_000_000n } };
      const tampil = jalankan(kasus);
      expect(tampil.jenis === 'galat' ? tampil.pesan : 'ok').toBe('ok');
    });
    it(`${kunci}: wajibNama sama dengan "bukan jenis di daftar ±"`, () => {
      const { graf, jawaban } = skenario(kunci);
      const hasil = selesaikanJalur(graf, 'PEWARIS', kunci, jawaban);
      if (!('graf' in hasil)) throw new Error(JSON.stringify(hasil));
      const dalamDaftar = Object.values(hitungIsian(hasil.graf, 'PEWARIS')).some(ids => ids!.includes(hasil.idBaru));
      expect(HUBUNGAN[kunci].wajibNama).toBe(!dalamDaftar);
    });
  }
});

describe('pertanyaan, galat, dan penghubung', () => {
  it('dua anak: menantu menanyakan anak yang mana; sebelum dijawab graf tidak berubah', () => {
    const g = dasar();
    const hasil = selesaikanJalur(g, 'PEWARIS', 'menantu', { jenisKelamin: 'P' });
    expect('pertanyaan' in hasil && hasil.pertanyaan.pilihan).toHaveLength(2);
  });
  it('satu anak: dipakai otomatis tanpa bertanya', () => {
    const g = bangun(['ISTRI', 'ANAK_LK']);
    expect('graf' in selesaikanJalur(g, 'PEWARIS', 'menantu', { jenisKelamin: 'P' })).toBe(true);
  });
  it('tanpa anak: pesan "Tambahkan anaknya dulu"', () => {
    const hasil = selesaikanJalur(bangun([]), 'PEWARIS', 'menantu', { jenisKelamin: 'P' });
    expect('galat' in hasil && hasil.galat).toMatch(/anak/i);
  });
  it('jalur yang sama dua kali tidak menumpuk penghubung', () => {
    const g0 = bangun([]);
    const jawab = { jenisKelamin: 'L' as const, nama: 'A' };
    const g1 = (selesaikanJalur(g0, 'PEWARIS', 'kakekDariAyah', jawab) as { graf: GrafKeluarga }).graf;
    const hasil2 = selesaikanJalur(g1, 'PEWARIS', 'nenekDariAyah', { jenisKelamin: 'P', nama: 'B' });
    const g2 = (hasil2 as { graf: GrafKeluarga }).graf;
    expect(Object.values(g2.orang).filter(o => o.penghubung)).toHaveLength(1);
  });
  it('slot yang sudah berisi orang nyata: galat, graf tidak berubah', () => {
    const g1 = (selesaikanJalur(bangun([]), 'PEWARIS', 'kakekDariAyah', { nama: 'A' }) as { graf: GrafKeluarga }).graf;
    const lagi = selesaikanJalur(g1, 'PEWARIS', 'kakekDariAyah', { nama: 'C' });
    expect('galat' in lagi).toBe(true);
  });
});
```

Catatan untuk pelaksana: kerangka `SYARAT` dan `skenario` di atas adalah **kontrak** tiap baris tabel spec; bila sebuah skenario perlu persiapan lain (mis. `saudaraTiri` butuh ibu tiri lebih dulu), ubah `skenario`, bukan `SYARAT`. `selesaikanJalur(..., kunci, { jenisKelamin })` untuk hubungan yang jenis kelaminnya tetap (kakek, paman, dst.) mengabaikan `jenisKelamin` di jawaban.

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `cd apps/web && npx vitest run src/__tests__/hubunganPohon.test.ts`
Expected: FAIL (modul belum ada).

- [ ] **Step 4: Tulis implementasi**

`apps/web/src/hubunganPohon.ts`:

```ts
// Nama hubungan (mertua, menantu, besan, ipar, anak tiri, ...) sebagai jalur dari satu orang (pusat).
// Menerima graf + pusat + nama hubungan + jawaban; menyerahkan graf baru, atau satu pertanyaan jangkar, atau pesan galat.
// Semua langkah memakai aksi dasar kerabatPohon.ts; langkah orang tua yang belum ada dibuat sebagai penghubung (pola checklist).

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { hitungIsian, isiOrangTua, pastikanOrangTua } from './checklist';
import { PASANGAN_LAIN, pasanganAktif, tambahDariOrang, type JalurSaudara } from './kerabatPohon';
import { t } from './terjemah';

type Langkah = 'ayah' | 'ibu' | 'orangTua' | 'pasangan' | 'anak' | 'saudara';
type Akhir =
  | { aksi: 'orangTua'; sebagai?: 'ayah' | 'ibu' }
  | { aksi: 'pasangan'; mantan?: true }
  | { aksi: 'anak'; tiri?: true }
  | { aksi: 'saudara'; jalur: JalurSaudara; jenisKelamin?: 'L' | 'P' };
interface Jalur {
  label: string;
  perantara: Langkah[];
  akhir: Akhir;
  /** Jenis kelamin orang baru ditanyakan di dialog. */
  tanyaKelamin: boolean;
  /** Penyajian saja: hasilnya bukan jenis di daftar ± (hitungIsian), jadi tanpa nama kotaknya tidak bisa disebut. Dites terhadap hitungIsian. */
  wajibNama: boolean;
  /** Langkah pasangan tidak boleh memilih orang tua pusat sendiri (saudara tiri: istri ayah selain ibu pusat). */
  kecualiOrangTuaPusat?: true;
}

export const HUBUNGAN = {
  kakekDariAyah: { label: t('hitung.pohon.hub_kakek_dari_ayah'), perantara: ['ayah'], akhir: { aksi: 'orangTua', sebagai: 'ayah' }, tanyaKelamin: false, wajibNama: false },
  nenekDariAyah: { label: t('hitung.pohon.hub_nenek_dari_ayah'), perantara: ['ayah'], akhir: { aksi: 'orangTua', sebagai: 'ibu' }, tanyaKelamin: false, wajibNama: false },
  kakekDariIbu: { label: t('hitung.pohon.hub_kakek_dari_ibu'), perantara: ['ibu'], akhir: { aksi: 'orangTua', sebagai: 'ayah' }, tanyaKelamin: false, wajibNama: true },
  nenekDariIbu: { label: t('hitung.pohon.hub_nenek_dari_ibu'), perantara: ['ibu'], akhir: { aksi: 'orangTua', sebagai: 'ibu' }, tanyaKelamin: false, wajibNama: false },
  buyut: { label: t('hitung.pohon.hub_buyut'), perantara: ['orangTua', 'orangTua'], akhir: { aksi: 'orangTua' }, tanyaKelamin: true, wajibNama: true },
  cucu: { label: t('hitung.pohon.hub_cucu'), perantara: ['anak'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: false },
  cicit: { label: t('hitung.pohon.hub_cicit'), perantara: ['anak', 'anak'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: true },
  paman: { label: t('hitung.pohon.hub_paman'), perantara: ['orangTua'], akhir: { aksi: 'saudara', jalur: 'kandung', jenisKelamin: 'L' }, tanyaKelamin: false, wajibNama: false },
  bibi: { label: t('hitung.pohon.hub_bibi'), perantara: ['orangTua'], akhir: { aksi: 'saudara', jalur: 'kandung', jenisKelamin: 'P' }, tanyaKelamin: false, wajibNama: true },
  keponakan: { label: t('hitung.pohon.hub_keponakan'), perantara: ['saudara'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: false },
  sepupu: { label: t('hitung.pohon.hub_sepupu'), perantara: ['orangTua', 'saudara'], akhir: { aksi: 'anak' }, tanyaKelamin: true, wajibNama: false },
  mertua: { label: t('hitung.pohon.hub_mertua'), perantara: ['pasangan'], akhir: { aksi: 'orangTua' }, tanyaKelamin: true, wajibNama: true },
  menantu: { label: t('hitung.pohon.hub_menantu'), perantara: ['anak'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  besan: { label: t('hitung.pohon.hub_besan'), perantara: ['anak', 'pasangan'], akhir: { aksi: 'orangTua' }, tanyaKelamin: true, wajibNama: true },
  iparSaudaraPasangan: { label: t('hitung.pohon.hub_ipar_saudara_pasangan'), perantara: ['pasangan'], akhir: { aksi: 'saudara', jalur: 'kandung' }, tanyaKelamin: true, wajibNama: true },
  iparPasanganSaudara: { label: t('hitung.pohon.hub_ipar_pasangan_saudara'), perantara: ['saudara'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  cucuMenantu: { label: t('hitung.pohon.hub_cucu_menantu'), perantara: ['anak', 'anak'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  anakTiri: { label: t('hitung.pohon.hub_anak_tiri'), perantara: ['pasangan'], akhir: { aksi: 'anak', tiri: true }, tanyaKelamin: true, wajibNama: true },
  ibuTiri: { label: t('hitung.pohon.hub_ibu_tiri'), perantara: ['ayah'], akhir: { aksi: 'pasangan' }, tanyaKelamin: false, wajibNama: true },
  saudaraTiri: { label: t('hitung.pohon.hub_saudara_tiri'), perantara: ['ayah', 'pasangan'], akhir: { aksi: 'anak', tiri: true }, tanyaKelamin: true, wajibNama: true, kecualiOrangTuaPusat: true },
  mantan: { label: t('hitung.pohon.hub_mantan'), perantara: [], akhir: { aksi: 'pasangan', mantan: true }, tanyaKelamin: false, wajibNama: true },
} satisfies Record<string, Jalur>;
export type KunciHubungan = keyof typeof HUBUNGAN;

export interface Jawaban { jenisKelamin?: 'L' | 'P' | undefined; nama?: string | undefined; pilihan?: string[] | undefined }
export interface Pilihan { nilai: string; label: string }
export type HasilJalur =
  | { graf: GrafKeluarga; idBaru: IdOrang }
  | { pertanyaan: { indeks: number; judul: string; pilihan: Pilihan[] } }
  | { galat: string };

const JUDUL_TANYA = { orangTua: t('hitung.pohon.tanya_orang_tua'), pasangan: t('hitung.pohon.tanya_pasangan'), anak: t('hitung.pohon.tanya_anak'), saudara: t('hitung.pohon.tanya_saudara') };
const GALAT_BELUM_ADA = { pasangan: t('hitung.pohon.belum_ada_pasangan'), anak: t('hitung.pohon.belum_ada_anak'), saudara: t('hitung.pohon.belum_ada_saudara') };

export function selesaikanJalur(graf: GrafKeluarga, idPusat: IdOrang, kunci: KunciHubungan, jawaban: Jawaban = {}): HasilJalur {
  const jalur: Jalur = HUBUNGAN[kunci];
  let grafKini = graf;
  let sekarang = idPusat;
  for (const [indeks, langkah] of jalur.perantara.entries()) {
    if (langkah === 'ayah' || langkah === 'ibu' || langkah === 'orangTua') {
      const sebagai = langkah === 'orangTua' ? jawaban.pilihan?.[indeks] : langkah;
      if (sebagai !== 'ayah' && sebagai !== 'ibu') {
        return { pertanyaan: { indeks, judul: JUDUL_TANYA.orangTua, pilihan: [{ nilai: 'ayah', label: t('hitung.pohon.ayah') }, { nilai: 'ibu', label: t('hitung.pohon.ibu') }] } };
      }
      const orangTua = pastikanOrangTua(grafKini, sekarang, sebagai === 'ayah' ? 'L' : 'P');
      grafKini = orangTua.graf;
      sekarang = orangTua.idOrang;
      continue;
    }
    const kandidat = kandidatLangkah(grafKini, sekarang, langkah, jalur.kecualiOrangTuaPusat ? idPusat : undefined);
    if (kandidat.length === 0) return { galat: GALAT_BELUM_ADA[langkah] };
    const dipilih = kandidat.length === 1 ? kandidat[0]!.nilai : jawaban.pilihan?.[indeks];
    if (!dipilih || !kandidat.some(pilihan => pilihan.nilai === dipilih)) {
      return { pertanyaan: { indeks, judul: JUDUL_TANYA[langkah], pilihan: kandidat } };
    }
    sekarang = dipilih;
  }
  return akhiri(grafKini, sekarang, jalur, jawaban);
}

function kandidatLangkah(graf: GrafKeluarga, idOrang: IdOrang, langkah: 'pasangan' | 'anak' | 'saudara', kecualiOrangTuaDari: IdOrang | undefined): Pilihan[] {
  const kecuali = new Set(kecualiOrangTuaDari ? [graf.orang[kecualiOrangTuaDari]!.idAyah, graf.orang[kecualiOrangTuaDari]!.idIbu] : []);
  const ids = langkah === 'pasangan' ? pasanganAktif(graf, idOrang).filter(id => !kecuali.has(id))
    : langkah === 'anak' ? Object.values(graf.orang).filter(o => o.idAyah === idOrang || o.idIbu === idOrang).map(o => o.id)
    : Object.values(graf.orang).filter(o => o.id !== idOrang && ((o.idAyah && o.idAyah === graf.orang[idOrang]!.idAyah) || (o.idIbu && o.idIbu === graf.orang[idOrang]!.idIbu))).map(o => o.id);
  return ids.map((id, urutan) => ({ nilai: id, label: graf.orang[id]!.nama ?? t('hitung.pohon.tanpa_nama', { nomor: urutan + 1 }) }));
}

function akhiri(graf: GrafKeluarga, dari: IdOrang, jalur: Jalur, jawaban: Jawaban): HasilJalur {
  const { akhir } = jalur;
  const jenisKelamin = (akhir.aksi === 'saudara' ? akhir.jenisKelamin : undefined) ?? jawaban.jenisKelamin;
  const perluKelamin = akhir.aksi === 'anak' || akhir.aksi === 'saudara' || (akhir.aksi === 'orangTua' && !akhir.sebagai);
  if (perluKelamin && !jenisKelamin) return { galat: t('hitung.pohon.kelamin_wajib') };
  try {
    switch (akhir.aksi) {
      case 'orangTua': {
        const sebagai = akhir.sebagai ?? (jenisKelamin === 'L' ? 'ayah' : 'ibu');
        // Penghubung di slot itu dihidupkan (bukan dibuat kedua); orang nyata = sudah terisi.
        const hasil = isiOrangTua(graf, dari, sebagai === 'ayah' ? 'L' : 'P', {});
        return { graf: beriNama(hasil.graf, hasil.idOrang, jawaban.nama), idBaru: hasil.idOrang };
      }
      case 'pasangan': {
        const hasil = tambahDariOrang(graf, dari, { aksi: 'pasangan', nama: jawaban.nama });
        return akhir.mantan ? { graf: talakBain(hasil.graf, hasil.idBaru), idBaru: hasil.idBaru } : hasil;
      }
      case 'anak':
        return tambahDariOrang(graf, dari, { aksi: 'anak', jenisKelamin: jenisKelamin!, nama: jawaban.nama, ...(akhir.tiri ? { idPasangan: PASANGAN_LAIN } : {}) });
      case 'saudara':
        return tambahDariOrang(graf, dari, { aksi: 'saudara', jenisKelamin: jenisKelamin!, jalur: akhir.jalur, nama: jawaban.nama });
    }
  } catch (galat) {
    return { galat: galat instanceof Error && !/sudah terisi/.test(galat.message) ? galat.message : t('hitung.pohon.sudah_terisi') };
  }
}

const talakBain = (graf: GrafKeluarga, idPasangan: IdOrang): GrafKeluarga =>
  ({ ...graf, pernikahan: graf.pernikahan.map(nikah => (nikah.idSuami === idPasangan || nikah.idIstri === idPasangan ? { ...nikah, status: 'talakBain' as const } : nikah)) });

function beriNama(graf: GrafKeluarga, idOrang: IdOrang, nama: string | undefined): GrafKeluarga {
  const bersih = nama?.trim();
  return bersih ? { ...graf, orang: { ...graf.orang, [idOrang]: { ...graf.orang[idOrang]!, nama: bersih } } } : graf;
}

export { hitungIsian };
```

(Bila `export { hitungIsian }` tidak dibutuhkan, hapus; baris itu hanya mencegah impor tak terpakai selama Step 5. Hapus bersama impor `hitungIsian` bila `tsc`/lint mengeluh.)

- [ ] **Step 5: Jalankan, pelaksana memperbaiki sampai lolos**

Run: `cd apps/web && npx vitest run src/__tests__/hubunganPohon.test.ts`
Expected: semua lolos. Bila sebuah baris gagal, periksa dua hal bergantian: (a) jalur di `HUBUNGAN` salah langkah; (b) `skenario` kurang persiapan. **Jangan** melonggarkan `SYARAT`. Bila `wajibNama` tidak cocok dengan `hitungIsian` pada sebuah baris, ubah nilai `wajibNama` pada baris itu (nilai di atas adalah tebakan awal dari tabel `jenisDari`).

- [ ] **Step 6: Tes menyeluruh dan tipe**

Run: `cd apps/web && npx tsc --noEmit && npx vitest run src/__tests__/diksi.test.ts src/__tests__/hubunganPohon.test.ts src/__tests__/kerabatPohon.test.ts`
Expected: lolos (tes diksi memastikan semua kunci `t()` ada di snapshot).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/hubunganPohon.ts apps/web/src/__tests__/hubunganPohon.test.ts apps/web/src/snapshot.json
git commit -m "feat(web): hubunganPohon: nama hubungan (mertua, menantu, besan, ipar, tiri, dst.) sebagai jalur aksi dasar" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Keseimbangan tata letak (B1–B5)

**Files:**
- Modify: `apps/web/src/hasil/tataLetak.ts`
- Modify: `apps/web/src/hasil/Pohon.tsx` (pakai `jumlahPerBaris`, prop `maksPerBaris`)
- Create: `apps/web/src/__tests__/tataLetakSeimbang.test.ts`

**Interfaces:**
- Consumes: `tataLetak(graf)` yang sudah ada; `tambahDariOrang`, `selesaikanJalur` (Task 1, 2) untuk membangun fixture.
- Produces:
  ```ts
  export const BATAS_PER_BARIS = 6;
  /** Jumlah node per baris tampilan setelah pembungkus rata (7 → 4+3 dengan maks 6). */
  export function jumlahPerBaris(jumlah: number, maks?: number): number;
  ```
  `PohonDasar` mendapat prop `maksPerBaris?: number` (bawaan `BATAS_PER_BARIS`).

- [ ] **Step 1: Tulis tes (karakterisasi dulu)**

`apps/web/src/__tests__/tataLetakSeimbang.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { BATAS_PER_BARIS, jumlahPerBaris, tataLetak } from '../hasil/tataLetak';
import { selesaikanJalur } from '../hubunganPohon';
import { tambahDariOrang } from '../kerabatPohon';

const bangun = (kunci: KunciAhliWaris[]): GrafKeluarga =>
  kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasusBaru('L').graf);
const ambil = (h: ReturnType<typeof selesaikanJalur>): GrafKeluarga => { if (!('graf' in h)) throw new Error(JSON.stringify(h)); return h.graf; };
const indeksDi = (baris: IdOrang[][], id: IdOrang) => { const b = baris.findIndex(r => r.includes(id)); return { baris: b, kolom: baris[b]!.indexOf(id) }; };

describe('B1: pembungkus baris', () => {
  it.each([[1, 6, 1], [6, 6, 6], [7, 6, 4], [12, 6, 6], [7, 4, 4], [9, 4, 3], [13, 4, 4]])('%i node, maks %i → %i per baris', (jumlah, maks, harapan) => {
    expect(jumlahPerBaris(jumlah, maks)).toBe(harapan);
  });
  it('maks bawaan = BATAS_PER_BARIS', () => { expect(jumlahPerBaris(7)).toBe(jumlahPerBaris(7, BATAS_PER_BARIS)); });
});

describe('B2: keluarga asal pasangan di sisi pasangannya', () => {
  it('mertua berada di kanan orang tua pewaris', () => {
    let g = bangun(['ISTRI', 'AYAH', 'IBU']);
    g = ambil(selesaikanJalur(g, 'PEWARIS', 'mertua', { jenisKelamin: 'L', nama: 'Bapak Mertua' }));
    g = ambil(selesaikanJalur(g, 'PEWARIS', 'mertua', { jenisKelamin: 'P', nama: 'Ibu Mertua' }));
    const { baris } = tataLetak(g);
    const kolomMertua = Object.values(g.orang).filter(o => o.nama?.includes('Mertua')).map(o => indeksDi(baris, o.id).kolom);
    const kolomOrtu = [g.orang.PEWARIS!.idAyah!, g.orang.PEWARIS!.idIbu!].map(id => indeksDi(baris, id).kolom);
    expect(Math.min(...kolomMertua)).toBeGreaterThan(Math.max(...kolomOrtu));
  });
});

describe('B3: anak satu keluarga berdampingan', () => {
  it('poligami 2 istri: anak tiap istri satu blok', () => {
    let g = bangun(['ISTRI', 'ISTRI']);
    const [istri1, istri2] = g.pernikahan.map(n => n.idIstri);
    for (const [istri, jumlah] of [[istri1!, 2], [istri2!, 2]] as const) {
      for (let i = 0; i < jumlah; i++) g = tambahDariOrang(g, 'PEWARIS', { aksi: 'anak', jenisKelamin: i % 2 ? 'P' : 'L', idPasangan: istri }).graf;
    }
    const { baris, keluarga } = tataLetak(g);
    for (const { anak } of keluarga.filter(k => k.anak.length > 1)) {
      const kolom = anak.map(id => indeksDi(baris, id).kolom).sort((a, b) => a - b);
      expect(kolom[kolom.length - 1]! - kolom[0]!).toBe(kolom.length - 1);
    }
  });
});

describe('B5: menambah satu orang tidak mengacak urutan orang lain', () => {
  const kasusUji: Array<[string, GrafKeluarga, (g: GrafKeluarga) => GrafKeluarga]> = [
    ['anak baru', bangun(['ISTRI', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG', 'AYAH', 'IBU']), g => tambahDariOrang(g, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L' }).graf],
    ['istri baru', bangun(['ISTRI', 'ANAK_LK', 'AYAH', 'IBU']), g => tambahDariOrang(g, 'PEWARIS', { aksi: 'pasangan' }).graf],
    ['saudara baru', bangun(['ISTRI', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'AYAH', 'IBU']), g => tambahDariOrang(g, 'PEWARIS', { aksi: 'saudara', jenisKelamin: 'P', jalur: 'kandung' }).graf],
    ['mertua baru', bangun(['ISTRI', 'ANAK_LK', 'AYAH', 'IBU']), g => ambil(selesaikanJalur(g, 'PEWARIS', 'mertua', { jenisKelamin: 'L' }))],
  ];
  it.each(kasusUji)('%s', (_nama, awal, tambah) => {
    const sebelum = tataLetak(awal).baris;
    const sesudah = tataLetak(tambah(awal)).baris;
    for (const barisLama of sebelum) {
      const sisa = sesudah.map(r => r.filter(id => barisLama.includes(id))).find(r => r.length === barisLama.length);
      expect(sisa).toEqual(barisLama);
    }
  });
});
```

- [ ] **Step 2: Jalankan, lihat mana yang gagal**

Run: `cd apps/web && npx vitest run src/__tests__/tataLetakSeimbang.test.ts`
Expected: B1 gagal (`jumlahPerBaris` belum ada). B2, B3, B5 mungkin sebagian sudah lolos; **catat mana yang gagal**: itu pekerjaan Step 4.

- [ ] **Step 3: Pindahkan logika pembungkus ke `tataLetak.ts`**

Di `apps/web/src/hasil/tataLetak.ts` tambahkan (di bawah antarmuka, di atas fungsi `tataLetak`):

```ts
/** Satu baris generasi dibungkus rata bila melebihi batas (7 → 4+3, 12 → 6+6) supaya pohon tumbuh ke bawah, bukan ke samping. */
export const BATAS_PER_BARIS = 6;
export function jumlahPerBaris(jumlah: number, maks: number = BATAS_PER_BARIS): number {
  return jumlah <= maks ? jumlah : Math.ceil(jumlah / Math.ceil(jumlah / maks));
}
```

Di `apps/web/src/hasil/Pohon.tsx`: hapus konstanta `BATAS_PER_BARIS` dan perhitungan `perBaris` di `lebarMaksBaris`; ubah menjadi:

```ts
import { BATAS_PER_BARIS, jumlahPerBaris, tataLetak, type TataLetak } from './tataLetak';
// ...
function lebarMaksBaris(jumlah: number, maks: number): CSSProperties | undefined {
  if (jumlah <= maks) return undefined;
  const perBaris = jumlahPerBaris(jumlah, maks);
  return { maxWidth: perBaris * LEBAR_NODE + (perBaris - 1) * JARAK_NODE };
}
```

Tambahkan prop `maksPerBaris = BATAS_PER_BARIS` ke `PohonDasar` (dan tipe propsnya) dan pakai `style={lebarMaksBaris(baris.length, maksPerBaris)}`.

Run: `cd apps/web && npx tsc --noEmit && npx vitest run src/__tests__/tataLetakSeimbang.test.ts src/__tests__/tataLetak.test.ts`
Expected: B1 lolos; tes tata letak lama tetap lolos.

- [ ] **Step 4: Perbaiki B2/B3/B5 yang gagal di Step 2**

Hanya untuk yang gagal. Pegangan:
- **B2 gagal:** di loop "Ke atas" urutan memakai `rataRataIndeks(anakDari(id), bawah)`. Tambahkan pemecah seri kedua: orang tua yang anaknya (di baris bawah) adalah **pasangan pusat** diurutkan setelah orang tua pusat. Cara: kunci = rata-rata indeks anak; bila sama, urut menurut apakah anaknya `pasanganPewaris` (setelah).
- **B3 gagal:** ganti pengurutan baris anak dari per-orang menjadi per-blok keluarga. Kelompokkan baris generasi `g` menurut kunci orang tua (`keluarga`), urutkan blok menurut rata-rata indeks orang tuanya di baris atas, simpan anak dalam blok berurutan id.
- **B5 gagal:** pastikan pemecah seri di `urutkanMenurut` memakai urutan pembuatan (`id` numerik) sebagai kunci terakhir, dan orang baru (id terbesar) ditempatkan di ujung bloknya.

Run: `cd apps/web && npx vitest run src/__tests__/tataLetakSeimbang.test.ts src/__tests__/tataLetak.test.ts`
Expected: semua lolos. **Jangan** melonggarkan tes; bila sebuah invarian ternyata mustahil untuk fixture tertentu, hentikan dan laporkan ke pemilik proyek.

- [ ] **Step 5: Regresi hasil dan Lab**

Run: `cd apps/web && npx vitest run`
Expected: hanya kegagalan lama (`belajar.test.tsx`, "kitab tanpa berkas") yang tersisa.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hasil/tataLetak.ts apps/web/src/hasil/Pohon.tsx apps/web/src/__tests__/tataLetakSeimbang.test.ts
git commit -m "feat(web): tata letak seimbang: pembungkus baris bisa diatur, blok keluarga, sisi pasangan, urutan stabil (B1-B5)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Pohon interaktif di panggung + menu orang

**Files:**
- Modify: `apps/web/src/hasil/PratinjauPohon.tsx` (prop `interaktif`)
- Modify: `apps/web/src/hasil/Pohon.tsx` (`PohonDasar`: `pilihPenghubung`, `labelPilih`)
- Modify: `apps/web/src/layar/lab/PohonSusunan.tsx` (terima prop opsional)
- Create: `apps/web/src/layar/wizard/MenuOrang.tsx`
- Create: `apps/web/src/layar/wizard/PohonKeluarga.tsx`
- Modify: `apps/web/src/layar/wizard/PanggungPohon.tsx`, `apps/web/src/layar/Wizard.tsx`
- Modify: `apps/web/src/gaya/wizard.css`
- Create: `apps/web/src/__tests__/pohonKeluarga.test.tsx`
- Create: `docs/superpowers/plans/diksi-pohon-4.json` (sementara)

**Interfaces:**
- Consumes: Task 1 (`aksiTersedia`, `bolehHapus`), `labelOrangChecklist`, `useTutupDiLuar` (`ui/tutupDiLuar.ts`), `Kasus`.
- Produces:
  ```ts
  // PratinjauPohon: interaktif?: boolean  → tanpa inert; isi tetap diskalakan.
  // PohonDasar: pilihPenghubung?: boolean; labelPilih?: (nama: string) => string
  export type AksiMenu = Aksi | 'ubah' | 'hapus';
  export function MenuOrang(props: { jangkar: HTMLElement; aksi: AksiMenu[]; judul: string; saatPilih: (a: AksiMenu) => void; saatTutup: () => void }): JSX.Element;
  export function PohonKeluarga(props: { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void }): JSX.Element;
  ```
  Task 5 mengisi penanganan tiap `AksiMenu` (dialog); di task ini `PohonKeluarga` hanya membuka menu dan mengirim pilihan ke callback `saatAksi(id, aksi)` yang masih no-op.

- [ ] **Step 1: Kunci teks**

`docs/superpowers/plans/diksi-pohon-4.json`:

```json
[
  {"kunci":"hitung.pohon.menu_untuk","id":"Menu untuk {nama}"},
  {"kunci":"hitung.pohon.buka_menu","id":"Buka menu {nama}"},
  {"kunci":"hitung.pohon.tambah_orang_tua","id":"+ Orang tua"},
  {"kunci":"hitung.pohon.tambah_pasangan","id":"+ Pasangan"},
  {"kunci":"hitung.pohon.tambah_anak","id":"+ Anak"},
  {"kunci":"hitung.pohon.tambah_saudara","id":"+ Saudara"},
  {"kunci":"hitung.pohon.ubah","id":"Ubah"},
  {"kunci":"hitung.pohon.hapus","id":"Hapus"},
  {"kunci":"hitung.pohon.tautan_hubungan","id":"Tambah mertua, menantu, ipar, dll."}
]
```

Run: `pnpm diksi:tambah docs/superpowers/plans/diksi-pohon-4.json && rm docs/superpowers/plans/diksi-pohon-4.json`

- [ ] **Step 2: Tulis tes yang gagal**

`apps/web/src/__tests__/pohonKeluarga.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { PohonKeluarga } from '../layar/wizard/PohonKeluarga';

const kasusAnak = (): Kasus => { const k = kasusBaru('L'); return { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }; };

describe('PohonKeluarga: menu orang', () => {
  it('mengetuk kotak membuka menu berisi aksi dasar; Esc menutup dan fokus kembali ke kotak', () => {
    render(<PohonKeluarga kasus={kasusAnak()} ubah={() => {}} />);
    const kotak = screen.getAllByRole('button', { name: /Buka menu/ })[0]!;
    kotak.focus();
    fireEvent.click(kotak);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /\+ Anak/ })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: /\+ Saudara/ })).toBeTruthy();
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(kotak);
  });
  it('pewaris tidak punya Hapus', () => {
    render(<PohonKeluarga kasus={kasusAnak()} ubah={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Buka menu/ })[0]!);
    expect(within(screen.getByRole('menu')).queryByRole('menuitem', { name: /Hapus/ })).toBeNull();
  });
  it('anak punya Ubah dan Hapus', () => {
    render(<PohonKeluarga kasus={kasusAnak()} ubah={() => {}} />);
    const tombol = screen.getAllByRole('button', { name: /Buka menu/ });
    fireEvent.click(tombol[tombol.length - 1]!);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /Ubah/ })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: /Hapus/ })).toBeTruthy();
  });
});
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `cd apps/web && npx vitest run src/__tests__/pohonKeluarga.test.tsx`
Expected: FAIL (komponen belum ada).

- [ ] **Step 4: `PratinjauPohon` interaktif dan `PohonDasar` untuk penghubung**

`PratinjauPohon.tsx`: tambah `interaktif = false` pada props, dan ubah efek `inert`:

```tsx
useEffect(() => { if (!interaktif) isi.current?.setAttribute('inert', ''); }, [interaktif]);
```

`Pohon.tsx` (`PohonDasar`): tambah props `pilihPenghubung?: boolean` dan `labelPilih?: (nama: string) => string`; ganti dua baris:

```tsx
const bisaDipilih = !!saatPilih && (node.kelas !== 'penghubung' || !!pilihPenghubung);
// ...
aria-label={bisaDipilih ? (labelPilih ?? ((nama: string) => t('hitung.nama_lihat_penjelasan', { nama })))(node.nama) : node.nama}
```

`PohonSusunan.tsx`: tambah props opsional `saatPilih?: (id: IdOrang) => void` dan `maksPerBaris?: number` yang diteruskan ke `PratinjauPohon interaktif={!!saatPilih}` dan `PohonDasar` (dengan `pilihPenghubung`, `labelPilih={nama => t('hitung.pohon.buka_menu', { nama })}`).

Run: `cd apps/web && npx tsc --noEmit`
Expected: tanpa galat.

- [ ] **Step 5: `MenuOrang.tsx`**

```tsx
// Panel tautan teks yang naik dari kotak orang yang diketuk. Menerima elemen jangkar + daftar aksi; menyerahkan aksi terpilih.
// Posisi dihitung dari kotak jangkar di dalam panggung (tidak ikut skala pohon); berbalik ke atas bila tidak muat di bawah.

import { useLayoutEffect, useRef, useState } from 'react';
import type { Aksi } from '../../kerabatPohon';
import { useTutupDiLuar } from '../../ui/tutupDiLuar';
import { t } from '../../terjemah';

export type AksiMenu = Aksi | 'ubah' | 'hapus';
const LABEL: Record<AksiMenu, string> = {
  orangTua: t('hitung.pohon.tambah_orang_tua'), pasangan: t('hitung.pohon.tambah_pasangan'), anak: t('hitung.pohon.tambah_anak'),
  saudara: t('hitung.pohon.tambah_saudara'), ubah: t('hitung.pohon.ubah'), hapus: t('hitung.pohon.hapus'),
};
const JARAK = 6;

interface Props { jangkar: HTMLElement; aksi: AksiMenu[]; judul: string; saatPilih: (aksi: AksiMenu) => void; saatTutup: () => void }

export function MenuOrang({ jangkar, aksi, judul, saatPilih, saatTutup }: Props) {
  const akar = useRef<HTMLDivElement>(null);
  const [posisi, setPosisi] = useState<{ kiri: number; atas: number }>({ kiri: 0, atas: 0 });
  useTutupDiLuar(akar, true, saatTutup);
  useLayoutEffect(() => {
    const panggung = jangkar.closest<HTMLElement>('.panggung-pohon');
    const menu = akar.current;
    if (!panggung || !menu) return;
    const dasar = panggung.getBoundingClientRect();
    const kotak = jangkar.getBoundingClientRect();
    const muatDiBawah = kotak.bottom + JARAK + menu.offsetHeight <= dasar.bottom;
    const atas = (muatDiBawah ? kotak.bottom + JARAK : kotak.top - JARAK - menu.offsetHeight) - dasar.top;
    const kiri = Math.min(Math.max(kotak.left - dasar.left, 0), Math.max(dasar.width - menu.offsetWidth, 0));
    setPosisi({ kiri, atas });
    menu.querySelector<HTMLElement>('[role=menuitem]')?.focus();
  }, [jangkar]);
  const kunciPanah = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); saatTutup(); return; }
    const butir = [...event.currentTarget.querySelectorAll<HTMLElement>('[role=menuitem]')];
    const sekarang = butir.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); butir[(sekarang + 1) % butir.length]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); butir[(sekarang - 1 + butir.length) % butir.length]?.focus(); }
  };
  return (
    <div ref={akar} className="menu-orang" role="menu" aria-label={t('hitung.pohon.menu_untuk', { nama: judul })}
      style={{ insetInlineStart: posisi.kiri, top: posisi.atas }} onKeyDown={kunciPanah}>
      {aksi.map(item => (
        <button key={item} type="button" role="menuitem" className={item === 'hapus' ? 'menu-orang-butir bahaya' : 'menu-orang-butir'} onClick={() => saatPilih(item)}>
          {LABEL[item]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: `PohonKeluarga.tsx` (menu saja; dialog di Task 5)**

```tsx
// Pohon keluarga interaktif di panggung langkah Keluarga: mengetuk kotak membuka menu orang (spec Tahap 4).
// Menerima Kasus + ubah; menyerahkan perubahan graf lewat ubah. Dialog tambah/ubah/hapus ditangani di Task 5.

import { useRef, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { aksiTersedia, bolehHapus } from '../../kerabatPohon';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { PohonSusunan } from '../lab/PohonSusunan';
import { MenuOrang, type AksiMenu } from './MenuOrang';

export interface Props { kasus: Kasus; ubah: (f: (k: Kasus) => Kasus) => void; maksPerBaris?: number }

export function PohonKeluarga({ kasus, ubah: _ubah, maksPerBaris }: Props) {
  const [terbuka, setTerbuka] = useState<{ id: IdOrang; jangkar: HTMLElement } | null>(null);
  const [aksiDipilih, setAksiDipilih] = useState<{ id: IdOrang; aksi: AksiMenu } | null>(null);
  const pemicu = useRef<HTMLElement | null>(null);
  const tutup = () => { setTerbuka(null); pemicu.current?.focus(); };
  const bukaMenu = (id: IdOrang) => {
    const kotak = document.querySelector<HTMLElement>(`.panggung-pohon [data-orang="${id}"]`);
    if (!kotak) return;
    pemicu.current = kotak;
    setTerbuka({ id, jangkar: kotak });
  };
  const aksiUntuk = (id: IdOrang): AksiMenu[] => [
    ...aksiTersedia(kasus.graf, id),
    ...(id === kasus.graf.idPewaris ? [] : ['ubah' as const]),
    ...(bolehHapus(kasus.graf, id) ? ['hapus' as const] : []),
  ];
  return (
    <div className="panggung-pohon pohon-keluarga">
      <PohonSusunan kasus={kasus} skalaMaks={1} saatPilih={bukaMenu} {...(maksPerBaris ? { maksPerBaris } : {})} />
      {terbuka && (
        <MenuOrang jangkar={terbuka.jangkar} aksi={aksiUntuk(terbuka.id)} judul={namaSingkat(kasus, terbuka.id)}
          saatPilih={aksi => { setAksiDipilih({ id: terbuka.id, aksi }); setTerbuka(null); }} saatTutup={tutup} />
      )}
      {aksiDipilih && null}
    </div>
  );
}
```

(Catatan: `aksiDipilih` sengaja belum dipakai; Task 5 menggantinya dengan dialog. Tambahkan `void aksiDipilih;` bila lint mengeluh tentang variabel tak terpakai.)

Catatan penting: `.panggung-pohon` sudah dipakai kelas pembungkus di `PanggungPohon`; di Step 7 `PanggungPohon` menaruh `PohonKeluarga` **menggantikan** pembungkusnya, supaya tidak ada dua `.panggung-pohon` bersarang (`MenuOrang` memakai `closest('.panggung-pohon')`).

- [ ] **Step 7: Sambungkan ke wizard**

`PanggungPohon.tsx`:

```tsx
export function PanggungPohon({ kasus, ubah, maksPerBaris }: { kasus: Kasus | null; ubah?: (f: (k: Kasus) => Kasus) => void; maksPerBaris?: number }) {
  const adaKerabat = !!kasus && Object.keys(kasus.graf.orang).length > 1;
  return (
    <>
      {kasus && ubah && <PohonKeluarga kasus={kasus} ubah={ubah} {...(maksPerBaris ? { maksPerBaris } : {})} />}
      {kasus && !ubah && adaKerabat && <div className="panggung-pohon"><PohonSusunan kasus={kasus} skalaMaks={1} /></div>}
      <RingkasanSamping kasus={kasus} />
    </>
  );
}
```

`Wizard.tsx` baris `ringkasan={<PanggungPohon kasus={kasus} />}` menjadi:

```tsx
ringkasan={<PanggungPohon kasus={kasus} {...(langkah === 3 ? { ubah } : {})} maksPerBaris={4} />}
```

(`maksPerBaris` 4 adalah nilai awal untuk panggung sempit; disetel di Task 6 setelah dilihat di layar.) Pohon di langkah Keluarga harus tampil walau baru ada pewaris, supaya "+ Anak" bisa diketuk dari awal: karena itu `PohonKeluarga` selalu dirender saat `ubah` ada.

- [ ] **Step 8: Gaya**

Tambahkan di `apps/web/src/gaya/wizard.css`:

```css
.panggung-pohon{position:relative}
.menu-orang{position:absolute;z-index:5;min-width:170px;display:flex;flex-direction:column;padding:6px;border:var(--border-w) solid var(--outline);border-radius:14px;background:var(--surface-raised);box-shadow:var(--shadow-pop);animation:menu-naik .14s ease-out both}
.menu-orang-butir{appearance:none;border:0;background:none;font:inherit;text-align:start;padding:9px 10px;border-radius:10px;color:var(--on-fill);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.menu-orang-butir:hover,.menu-orang-butir:focus-visible{background:rgba(0,0,0,.06)}
.menu-orang-butir.bahaya{color:var(--danger,#b3261e)}
@keyframes menu-naik{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.menu-orang{animation:none}}
```

(Bila token `--on-fill`/`--danger` tidak ada, pakai token sejenis di `gaya/token.css`.)

- [ ] **Step 9: Jalankan tes dan tipe**

Run: `cd apps/web && npx tsc --noEmit && npx vitest run src/__tests__/pohonKeluarga.test.tsx src/__tests__/diksi.test.ts`
Expected: lolos.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/hasil apps/web/src/layar apps/web/src/gaya/wizard.css apps/web/src/__tests__/pohonKeluarga.test.tsx apps/web/src/snapshot.json
git commit -m "feat(web): pohon di langkah Keluarga bisa diketuk: menu orang (+ orang tua, pasangan, anak, saudara, ubah, hapus)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Dialog tambah, ubah, dan hapus

**Files:**
- Modify: `apps/web/src/ui/Dialog.tsx` (prop `lanjutNonaktif`)
- Create: `apps/web/src/layar/wizard/DialogTambahOrang.tsx`
- Modify: `apps/web/src/layar/wizard/PohonKeluarga.tsx`
- Modify: `apps/web/src/__tests__/pohonKeluarga.test.tsx`
- Create: `docs/superpowers/plans/diksi-pohon-5.json` (sementara)

**Interfaces:**
- Consumes: Task 1 (`tambahDariOrang`, `dampakHapus`, `pasanganAktif`, `PASANGAN_LAIN`, `hapusAhliWaris`), Task 4 (`PohonKeluarga`, `AksiMenu`), `DialogKonfirmasi`, `DialogKeadaan`, `rapikanKeadaan`, `bolehUbahJenisKelamin` (engine), `ubahNama`.
- Produces:
  ```tsx
  // DialogKonfirmasi: lanjutNonaktif?: boolean
  export function DialogTambahOrang(props: { kasus: Kasus; idOrang: IdOrang; aksi: Aksi; saatSelesai: (graf: GrafKeluarga) => void; saatBatal: () => void }): JSX.Element;
  ```
  `DialogTambahOrang` hanya menangani empat aksi dasar; nama hubungan ditangani Task 6 lewat komponen yang sama dengan prop `hubungan` baru (ditambahkan di Task 6).

- [ ] **Step 1: Kunci teks**

`docs/superpowers/plans/diksi-pohon-5.json`:

```json
[
  {"kunci":"hitung.pohon.judul_tambah_orang_tua","id":"Tambah orang tua {nama}"},
  {"kunci":"hitung.pohon.judul_tambah_pasangan","id":"Tambah pasangan {nama}"},
  {"kunci":"hitung.pohon.judul_tambah_anak","id":"Tambah anak {nama}"},
  {"kunci":"hitung.pohon.judul_tambah_saudara","id":"Tambah saudara {nama}"},
  {"kunci":"hitung.pohon.judul_ubah","id":"Ubah {nama}"},
  {"kunci":"hitung.pohon.nama_orang","id":"Nama"},
  {"kunci":"hitung.pohon.nama_orang_opsional","id":"Nama (boleh dikosongkan)"},
  {"kunci":"hitung.pohon.kelamin","id":"Jenis kelamin"},
  {"kunci":"hitung.pohon.laki_laki","id":"Laki-laki"},
  {"kunci":"hitung.pohon.perempuan","id":"Perempuan"},
  {"kunci":"hitung.pohon.sebagai","id":"Sebagai"},
  {"kunci":"hitung.pohon.dari_pasangan_mana","id":"Dari pasangan yang mana?"},
  {"kunci":"hitung.pohon.pasangan_lain_tidak_dicatat","id":"Pasangan lain, tidak dicatat"},
  {"kunci":"hitung.pohon.jalur_saudara","id":"Saudara ini"},
  {"kunci":"hitung.pohon.jalur_kandung","id":"Satu ayah dan satu ibu"},
  {"kunci":"hitung.pohon.jalur_sebapak","id":"Satu ayah saja"},
  {"kunci":"hitung.pohon.jalur_seibu","id":"Satu ibu saja"},
  {"kunci":"hitung.pohon.simpan","id":"Simpan"},
  {"kunci":"hitung.pohon.batal","id":"Batal"},
  {"kunci":"hitung.pohon.hapus_judul","id":"Hapus {nama}?"},
  {"kunci":"hitung.pohon.hapus_biasa","id":"{nama} dihapus dari keluarga ini."},
  {"kunci":"hitung.pohon.hapus_penghubung","id":"{nama} masih punya keturunan di pohon, jadi tetap ada sebagai orang yang sudah wafat tanpa nama supaya garis keturunannya tidak putus."},
  {"kunci":"hitung.pohon.hapus_pasangan","id":"Pernikahannya dengan {pasangan} ikut dilepas; {pasangan} tetap ada."},
  {"kunci":"hitung.pohon.ubah_keadaan","id":"Ubah keadaan (wafat, hilang, dll.)"}
]
```

Run: `pnpm diksi:tambah docs/superpowers/plans/diksi-pohon-5.json && rm docs/superpowers/plans/diksi-pohon-5.json`

- [ ] **Step 2: Tambah tes yang gagal** (di `pohonKeluarga.test.tsx`)

```tsx
import { useState } from 'react';
import { PASANGAN_LAIN } from '../kerabatPohon';
import { fireEvent, render, screen, within } from '@testing-library/react';

function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  (globalThis as { __kasus?: Kasus }).__kasus = kasus;
  return <PohonKeluarga kasus={kasus} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
const kasusTerakhir = () => (globalThis as { __kasus?: Kasus }).__kasus!;
const bukaMenuPewaris = () => fireEvent.click(screen.getAllByRole('button', { name: /Buka menu/ })[0]!);
const pilihMenu = (nama: RegExp) => fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: nama }));

describe('PohonKeluarga: dialog', () => {
  it('+ Anak: pilih laki-laki, isi nama, simpan → anak bernama masuk graf', () => {
    render(<Uji awal={kasusBaru('L')} />);
    bukaMenuPewaris(); pilihMenu(/\+ Anak/);
    fireEvent.click(screen.getByRole('radio', { name: 'Laki-laki' }));
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Budi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(Object.values(kasusTerakhir().graf.orang).some(o => o.nama === 'Budi' && o.idAyah === 'PEWARIS')).toBe(true);
  });
  it('+ Anak tanpa memilih jenis kelamin: Simpan nonaktif', () => {
    render(<Uji awal={kasusBaru('L')} />);
    bukaMenuPewaris(); pilihMenu(/\+ Anak/);
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('+ Pasangan tanpa pertanyaan tambahan: langsung bisa Simpan', () => {
    render(<Uji awal={kasusBaru('L')} />);
    bukaMenuPewaris(); pilihMenu(/\+ Pasangan/);
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(kasusTerakhir().graf.pernikahan).toHaveLength(1);
  });
  it('dua istri: + Anak menanyakan pasangan dan Simpan menunggu jawaban', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI'), 'PEWARIS', 'ISTRI') };
    render(<Uji awal={k} />);
    bukaMenuPewaris(); pilihMenu(/\+ Anak/);
    fireEvent.click(screen.getByRole('radio', { name: 'Laki-laki' }));
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Pasangan lain, tidak dicatat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(Object.values(kasusTerakhir().graf.orang).filter(o => o.idAyah === 'PEWARIS' && !o.idIbu)).toHaveLength(1);
    void PASANGAN_LAIN;
  });
  it('Hapus anak yang punya cucu menyebut bahwa ia tetap sebagai penghubung', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') };
    const anak = Object.values(k.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'CUCU_LK', { idInduk: anak }) };
    render(<Uji awal={k} />);
    const tombol = screen.getAllByRole('button', { name: /Buka menu/ });
    fireEvent.click(tombol.find(t => /Anak|anak/.test(t.getAttribute('aria-label') ?? ''))!);
    pilihMenu(/Hapus/);
    expect(screen.getByRole('alertdialog').textContent).toMatch(/tetap ada sebagai orang yang sudah wafat/);
  });
  it('Hapus menjalankan rapikanKeadaan: id yang hilang tidak tersisa di urutan wafat', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') };
    const anak = Object.values(k.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    k = { ...k, urutanWafat: [anak], graf: { ...k.graf, orang: { ...k.graf.orang, [anak]: { ...k.graf.orang[anak]!, statusHidup: 'hidup' } } } };
    render(<Uji awal={k} />);
    const tombol = screen.getAllByRole('button', { name: /Buka menu/ });
    fireEvent.click(tombol[tombol.length - 1]!);
    pilihMenu(/Hapus/);
    fireEvent.click(screen.getByRole('button', { name: /Hapus/ }));
    expect(kasusTerakhir().graf.orang[anak]).toBeUndefined();
    expect(kasusTerakhir().urutanWafat).toEqual([]);
  });
});
```

Tambahkan impor `rapikanKeadaan` dari `../kasus` dan, bila `tambahAhliWaris` untuk `CUCU_LK` butuh induk, ikuti pola `LangkahBabak.test.tsx`. Bila `getByRole('radio', …)` tidak cocok dengan kontrol yang Anda bangun, ubah **kontrol**, bukan tes: jenis kelamin dan pilihan pasangan harus berupa kelompok `role="radio"` berlabel.

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `cd apps/web && npx vitest run src/__tests__/pohonKeluarga.test.tsx`
Expected: tes dialog FAIL.

- [ ] **Step 4: `DialogKonfirmasi` bisa menonaktifkan Simpan**

`ui/Dialog.tsx`: tambah `lanjutNonaktif?: boolean` pada `Props`, ambil di parameter, dan ubah tombol lanjut menjadi `disabled={!cocok || lanjutNonaktif}`.

- [ ] **Step 5: `DialogTambahOrang.tsx`**

```tsx
// Dialog satu layar untuk menambah satu orang dari orang yang diketuk (spec Tahap 4 bagian 2).
// Menerima Kasus + orang + aksi dasar; menyerahkan graf baru lewat saatSelesai. Pertanyaan tambahan muncul di layar yang sama
// hanya bila perlu (jenis kelamin anak/saudara, pasangan bila > 1, jalur saudara, ayah/ibu untuk orang tua).

import { useState } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { pasanganAktif, PASANGAN_LAIN, tambahDariOrang, type Aksi, type JalurSaudara, type Masukan } from '../../kerabatPohon';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; idOrang: IdOrang; aksi: Aksi; saatSelesai: (graf: GrafKeluarga) => void; saatBatal: () => void }

export function DialogTambahOrang({ kasus, idOrang, aksi, saatSelesai, saatBatal }: Props) {
  const { graf } = kasus;
  const orang = graf.orang[idOrang]!;
  const [nama, setNama] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P' | null>(null);
  const [sebagai, setSebagai] = useState<'ayah' | 'ibu' | null>(orang.idAyah ? 'ibu' : orang.idIbu ? 'ayah' : null);
  const [jalur, setJalur] = useState<JalurSaudara>('kandung');
  const hidup = pasanganAktif(graf, idOrang).filter(id => graf.orang[id]!.statusHidup !== 'wafat');
  const [pasangan, setPasangan] = useState<string | null>(hidup.length > 1 ? null : hidup[0] ?? null);
  const perluKelamin = aksi === 'anak' || aksi === 'saudara';
  const perluPasangan = aksi === 'anak' && hidup.length > 1;
  const lengkap = (!perluKelamin || !!jenisKelamin) && (aksi !== 'orangTua' || !!sebagai) && (!perluPasangan || !!pasangan);
  const simpan = () => {
    const masukan: Masukan = aksi === 'orangTua' ? { aksi, sebagai: sebagai!, nama }
      : aksi === 'pasangan' ? { aksi, nama }
      : aksi === 'anak' ? { aksi, jenisKelamin: jenisKelamin!, nama, ...(perluPasangan ? { idPasangan: pasangan! } : {}) }
      : { aksi, jenisKelamin: jenisKelamin!, jalur, nama };
    saatSelesai(tambahDariOrang(graf, idOrang, masukan).graf);
  };
  return (
    <DialogKonfirmasi judul={judul(aksi, namaSingkat(kasus, idOrang))} labelLanjut={t('hitung.pohon.simpan')} labelBatal={t('hitung.pohon.batal')}
      lanjutNonaktif={!lengkap} saatLanjut={simpan} saatBatal={saatBatal}>
      <label className="isian isian-kecil">
        <span>{t('hitung.pohon.nama_orang_opsional')}</span>
        <input type="text" value={nama} onChange={e => setNama(e.target.value)} autoComplete="off" />
      </label>
      {aksi === 'orangTua' && (
        <Pilihan label={t('hitung.pohon.sebagai')} nilai={sebagai} saatPilih={v => setSebagai(v as 'ayah' | 'ibu')}
          daftar={[...(orang.idAyah ? [] : [{ nilai: 'ayah', label: t('hitung.pohon.ayah') }]), ...(orang.idIbu ? [] : [{ nilai: 'ibu', label: t('hitung.pohon.ibu') }])]} />
      )}
      {perluKelamin && (
        <Pilihan label={t('hitung.pohon.kelamin')} nilai={jenisKelamin} saatPilih={v => setJenisKelamin(v as 'L' | 'P')}
          daftar={[{ nilai: 'L', label: t('hitung.pohon.laki_laki') }, { nilai: 'P', label: t('hitung.pohon.perempuan') }]} />
      )}
      {perluPasangan && (
        <Pilihan label={t('hitung.pohon.dari_pasangan_mana')} nilai={pasangan} saatPilih={setPasangan}
          daftar={[...hidup.map(id => ({ nilai: id, label: namaSingkat(kasus, id) })), { nilai: PASANGAN_LAIN, label: t('hitung.pohon.pasangan_lain_tidak_dicatat') }]} />
      )}
      {aksi === 'saudara' && (
        <Pilihan label={t('hitung.pohon.jalur_saudara')} nilai={jalur} saatPilih={v => setJalur(v as JalurSaudara)}
          daftar={[{ nilai: 'kandung', label: t('hitung.pohon.jalur_kandung') }, { nilai: 'sebapak', label: t('hitung.pohon.jalur_sebapak') }, { nilai: 'seibu', label: t('hitung.pohon.jalur_seibu') }]} />
      )}
    </DialogKonfirmasi>
  );
}

// Kunci t() harus literal (dijaga tes diksi), jadi tiap aksi punya pemanggilan t() sendiri.
function judul(aksi: Aksi, nama: string): string {
  switch (aksi) {
    case 'orangTua': return t('hitung.pohon.judul_tambah_orang_tua', { nama });
    case 'pasangan': return t('hitung.pohon.judul_tambah_pasangan', { nama });
    case 'anak': return t('hitung.pohon.judul_tambah_anak', { nama });
    case 'saudara': return t('hitung.pohon.judul_tambah_saudara', { nama });
  }
}

function Pilihan({ label, nilai, daftar, saatPilih }: { label: string; nilai: string | null; daftar: Array<{ nilai: string; label: string }>; saatPilih: (nilai: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="pilihan-dialog">
      <span className="label-pilihan">{label}</span>
      {daftar.map(butir => (
        <button key={butir.nilai} type="button" role="radio" aria-checked={nilai === butir.nilai} className={nilai === butir.nilai ? 'pilih-dialog terpilih' : 'pilih-dialog'}
          onClick={() => saatPilih(butir.nilai)}>{butir.label}</button>
      ))}
    </div>
  );
}
```


- [ ] **Step 6: `PohonKeluarga` menangani aksi**

Ganti `{aksiDipilih && null}` dengan penanganan berikut (ubah `_ubah` menjadi `ubah`):

```tsx
{aksiDipilih && aksiDipilih.aksi !== 'ubah' && aksiDipilih.aksi !== 'hapus' && (
  <DialogTambahOrang kasus={kasus} idOrang={aksiDipilih.id} aksi={aksiDipilih.aksi}
    saatBatal={() => setAksiDipilih(null)}
    saatSelesai={graf => { ubah(k => ({ ...k, graf })); setAksiDipilih(null); }} />
)}
{aksiDipilih?.aksi === 'hapus' && <KonfirmasiHapus kasus={kasus} idOrang={aksiDipilih.id} saatBatal={() => setAksiDipilih(null)}
  saatLanjut={() => { ubah(k => ({ ...k, graf: hapusAhliWaris(k.graf, aksiDipilih.id) })); setAksiDipilih(null); }} />}
{aksiDipilih?.aksi === 'ubah' && <DialogUbahOrang kasus={kasus} idOrang={aksiDipilih.id} saatBatal={() => setAksiDipilih(null)}
  saatSelesai={perbarui => { ubah(perbarui); setAksiDipilih(null); }} />}
```

`ubah` dari wizard sudah melewati `UBAH_KASUS`, yang memanggil `rapikanKeadaan` (lihat `kasus.ts:65` dan `keadaan.ts:46`), jadi id yang dihapus ikut dibersihkan dari `urutanWafat` dst.

`KonfirmasiHapus` (di berkas yang sama):

```tsx
function KonfirmasiHapus({ kasus, idOrang, saatBatal, saatLanjut }: { kasus: Kasus; idOrang: IdOrang; saatBatal: () => void; saatLanjut: () => void }) {
  const nama = namaSingkat(kasus, idOrang);
  const { menjadiPenghubung, pasangan } = dampakHapus(kasus.graf, idOrang);
  return (
    <DialogKonfirmasi judul={t('hitung.pohon.hapus_judul', { nama })} labelLanjut={t('hitung.pohon.hapus')} labelBatal={t('hitung.pohon.batal')} saatLanjut={saatLanjut} saatBatal={saatBatal}>
      <p>{menjadiPenghubung ? t('hitung.pohon.hapus_penghubung', { nama }) : t('hitung.pohon.hapus_biasa', { nama })}</p>
      {pasangan.map(id => <p key={id}>{t('hitung.pohon.hapus_pasangan', { pasangan: namaSingkat(kasus, id) })}</p>)}
    </DialogKonfirmasi>
  );
}
```

`DialogUbahOrang` (berkas yang sama): isian nama, pilihan jenis kelamin hanya bila `bolehUbahJenisKelamin(kasus.graf, id)` (dari `@waris/engine`), dan tautan teks "Ubah keadaan (wafat, hilang, dll.)" yang membuka `DialogKeadaan` (pola `PertanyaanPenutup.tsx`: `<DialogKeadaan kasus idOrang saatSelesai={k => saatSelesai(() => k)} saatBatal />`). Simpan memanggil `saatSelesai(k => ({ ...k, graf: ubahNama(k.graf, id, nama) }))` dan, bila jenis kelamin berubah, menulis `jenisKelamin` pada orang itu. Tombol hanya Simpan/Batal; tautan keadaan berupa `<button className="tautan-teks">`.

- [ ] **Step 7: Jalankan tes dan tipe**

Run: `cd apps/web && npx tsc --noEmit && npx vitest run src/__tests__/pohonKeluarga.test.tsx src/__tests__/diksi.test.ts`
Expected: lolos. Perbaiki **kontrol** bila selektor tes tidak cocok, bukan sebaliknya.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/ui/Dialog.tsx apps/web/src/layar/wizard apps/web/src/__tests__/pohonKeluarga.test.tsx apps/web/src/snapshot.json
git commit -m "feat(web): dialog tambah orang, konfirmasi hapus yang menyebut dampak, dan ubah nama/keadaan dari pohon" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Tautan nama hubungan, penyetelan tampilan, dan teks

**Files:**
- Modify: `apps/web/src/layar/wizard/DialogTambahOrang.tsx` (prop `hubungan`)
- Modify: `apps/web/src/layar/wizard/PohonKeluarga.tsx` (tautan + alur pilih hubungan)
- Modify: `apps/web/src/gaya/wizard.css`
- Modify: `apps/web/src/__tests__/pohonKeluarga.test.tsx`

**Interfaces:**
- Consumes: Task 2 (`HUBUNGAN`, `selesaikanJalur`, `KunciHubungan`, `Jawaban`), Task 5 (`DialogTambahOrang`).
- Produces: `DialogTambahOrang` menerima salah satu dari `aksi` atau `hubungan: KunciHubungan` (union terpisah; bukan dua prop opsional) dan bekerja dengan loop "pertanyaan → jawab → selesaikanJalur ulang".

- [ ] **Step 1: Tes yang gagal**

Tambahkan di `pohonKeluarga.test.tsx`:

```tsx
describe('PohonKeluarga: nama hubungan', () => {
  it('Tambah mertua: pilih Mertua, Ayah, beri nama, simpan; nama wajib', () => {
    let k = kasusBaru('L');
    k = { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI') };
    render(<Uji awal={k} />);
    fireEvent.click(screen.getByRole('button', { name: /Tambah mertua, menantu, ipar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mertua' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Laki-laki' }));
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: '   ' } });
    expect((screen.getByRole('button', { name: 'Simpan' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Pak Harjo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(Object.values(kasusTerakhir().graf.orang).some(o => o.nama === 'Pak Harjo')).toBe(true);
  });
  it('Menantu tanpa anak: pesan "Tambahkan anaknya dulu", tanpa perubahan graf', () => {
    render(<Uji awal={kasusBaru('L')} />);
    fireEvent.click(screen.getByRole('button', { name: /Tambah mertua, menantu, ipar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Menantu' }));
    expect(screen.getByText(/Tambahkan anaknya dulu/)).toBeTruthy();
  });
  it('kata "kerabat" tidak muncul di menu, tautan, atau dialog', () => {
    render(<Uji awal={kasusBaru('L')} />);
    expect(document.body.textContent).not.toMatch(/kerabat/i);
  });
});
```

Run: `cd apps/web && npx vitest run src/__tests__/pohonKeluarga.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Kunci teks**

`docs/superpowers/plans/diksi-pohon-6.json`:

```json
[
  {"kunci":"hitung.pohon.pilih_hubungan","id":"Pilih hubungannya"},
  {"kunci":"hitung.pohon.nama_wajib","id":"Nama (wajib, supaya bisa disebut di pohon)"},
  {"kunci":"hitung.pohon.judul_hubungan","id":"Tambah {hubungan} untuk {nama}"},
  {"kunci":"hitung.pohon.tutup","id":"Tutup"}
]
```

Run: `pnpm diksi:tambah docs/superpowers/plans/diksi-pohon-6.json && rm docs/superpowers/plans/diksi-pohon-6.json`

- [ ] **Step 3: Implementasi**

1. `PohonKeluarga`: di bawah pohon, render `<button type="button" className="tautan-teks" onClick={...}>{t('hitung.pohon.tautan_hubungan')}</button>`. Mengetuknya membuka daftar `HUBUNGAN` (tombol teks `className="tautan-teks"` per nama, label dari `HUBUNGAN[k].label`) dengan tautan "Tutup". Pusatnya `terbuka?.id ?? kasus.graf.idPewaris`; bila pengguna terakhir mengetuk orang lain, daftar memakai orang itu.
2. Memilih satu hubungan membuka `DialogTambahOrang` varian hubungan: judul `t('hitung.pohon.judul_hubungan', { hubungan: label, nama })`, isian nama berlabel `t('hitung.pohon.nama_wajib')` bila `wajibNama` else `nama_orang_opsional`, kelompok jenis kelamin hanya bila `tanyaKelamin`.
3. Loop jawaban: simpan `pilihan: string[]` di state. Panggil `selesaikanJalur(graf, pusat, kunci, { jenisKelamin, nama, pilihan })` tiap render untuk menentukan layar: `pertanyaan` → tampilkan `Pilihan` (radio) dan, saat dipilih, tulis `pilihan[indeks]`; `galat` → tampilkan teks galat (peran `alert`) dan nonaktifkan Simpan; `graf` → Simpan aktif (nonaktif bila `wajibNama` dan `nama.trim()` kosong).
4. Simpan memanggil `saatSelesai(hasil.graf)`.

Ekspor `DialogTambahOrang` sebagai union props: `{ aksi } | { hubungan }`; jangan menggandakan komponen. Pertahankan `Pilihan` dan pola `role=radio`.

- [ ] **Step 4: Gaya tautan dan dialog**

Tambahkan di `wizard.css` kelas `.tautan-teks` (tombol tanpa bingkai bergaris bawah, sama dengan `.tautan-hero`), `.pilihan-dialog`, `.label-pilihan`, `.pilih-dialog`, `.pilih-dialog.terpilih` (pilihan segmen kecil, bukan tombol berbingkai besar), dan `.pohon-keluarga .node-baru` memudar masuk (opacity 0 → 1, 0.25 dtk) yang dimatikan oleh `prefers-reduced-motion`. Gunakan token di `gaya/token.css`.

- [ ] **Step 5: Jalankan tes**

Run: `cd apps/web && npx tsc --noEmit && npx vitest run src/__tests__/pohonKeluarga.test.tsx src/__tests__/hubunganPohon.test.ts src/__tests__/diksi.test.ts`
Expected: lolos.

- [ ] **Step 6: Lihat di browser dan setel keseimbangan**

Jalankan dev server (`preview_start`, lihat `.claude/launch.json`), buka wizard sampai langkah Keluarga, lalu **bangun keluarga uji lewat pohon**: istri, 4 anak, ayah, ibu, saudara, lalu mertua dan seorang menantu. Ambil tangkapan layar di lebar **375** dan **1280** (`resize_window`), periksa:
- pohon di panggung tidak lebih lebar dari panggungnya dan masih terbaca (skala ≥ 0,6);
- menu tidak keluar layar dan terbaca;
- tidak ada tumpang tindih kotak.

Bila terlalu lebar, kecilkan `maksPerBaris` di `Wizard.tsx` (mulai dari 4, coba 3) sampai pas; catat nilai akhir dan alasannya di pesan commit. Bila masih terlalu lebar pada 7+ saudara, hentikan dan laporkan: itu kebutuhan lipat-cabang (Tahap 3), bukan di luar rencana.

- [ ] **Step 7: Jalankan seluruh tes web dan commit**

Run: `cd apps/web && npx tsc --noEmit && npx vitest run`
Expected: hanya kegagalan lama (`belajar.test.tsx` "kitab tanpa berkas").

```bash
git add apps/web/src docs/superpowers
git commit -m "feat(web): tautan tambah mertua/menantu/ipar dst. di bawah pohon, nama wajib untuk non-ahli-waris, tampilan disetel" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Teks ke database dan pemeriksaan akhir

**Files:** tidak ada kode baru.

- [ ] **Step 1: Pastikan semua kunci ada di snapshot**

Run: `cd apps/web && npx vitest run src/__tests__/diksi.test.ts`
Expected: lolos (kunci `hitung.pohon.*` ada di `snapshot.json`).

- [ ] **Step 2: Isi database dari snapshot**

Minta persetujuan pemilik sebelum menjalankan (menimpa DB). Setelah disetujui, **jalankan satu proses saja**:

```bash
pnpm konten:pulihkan
```
Expected: baris progres tiap 100 baris, lalu `{ dibuat: N, dilewati: M }` dengan `N` = jumlah kunci `hitung.pohon.*` baru. Peringatan "dibuang … rujukan" tidak berbahaya.

- [ ] **Step 3: Pemeriksaan akhir**

Run: `pnpm -r exec tsc --noEmit` (atau `cd apps/web && npx tsc --noEmit`) dan `cd apps/web && npx vitest run`.
Expected: hanya kegagalan lama yang tersisa. Catat hasilnya apa adanya.

- [ ] **Step 4: Catat di rencana tahap**

Di `docs/design/rencana-pengalaman-dan-fitur.md`, pada baris Tahap 4, tambahkan catatan satu kalimat: "Dibangun sebagian: menu orang + nama hubungan; anak angkat (5.3), lipat cabang, dan P1–P9 formal menunggu Tahap 3/5" lalu commit:

```bash
git add docs/design/rencana-pengalaman-dan-fitur.md
git commit -m "docs: catat cakupan Tahap 4 yang sudah dibangun" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-Review (sudah dijalankan)

**Cakupan spec:** 5.1 menu (Task 4–5) · 5.2 nama hubungan (Task 2, 6) · keseimbangan B1–B5 (Task 3; B4 lipat-cabang dikeluarkan dan dicatat di "Keputusan" no. 5) · kata tanpa "kerabat" (Task 6 tes + Global Constraints) · wajib nama (Task 2 `wajibNama`, Task 6) · hapus dengan dampak (Task 1, 5) · diksi + pulihkan (Task 7) · anak angkat dan P1–P9 formal: di luar cakupan sesuai spec.

**Placeholder:** Task 3 Step 4 dan Task 5 Step 6 (`DialogUbahOrang`) memberi arah, bukan kode penuh, karena bergantung pada hasil tes yang gagal dan pola komponen yang sudah ada; keduanya memuat kriteria lolos yang tepat. Tidak ada "TBD".

**Konsistensi tipe:** `Aksi`, `Masukan`, `PASANGAN_LAIN`, `pasanganAktif`, `tambahDariOrang` (Task 1) dipakai sama di Task 2, 5. `selesaikanJalur(graf, idPusat, kunci, jawaban)` dan `HasilJalur` (Task 2) dipakai sama di Task 6. `maksPerBaris` (Task 3) dipakai di Task 4 dan 6. `AksiMenu` didefinisikan di `MenuOrang.tsx` (Task 4) dan dipakai di `PohonKeluarga` (Task 4, 5).

**Risiko yang diketahui:** (a) tebakan awal `wajibNama` mungkin salah pada beberapa baris, dites terhadap `hitungIsian`; (b) tebakan `skenario` untuk `cucuMenantu`/`saudaraTiri` perlu disetel; (c) `maksPerBaris` perlu disetel dari tangkapan layar nyata.
