# Desain `apps/web` — UI kalkulator + edukasi (MVP)

Tanggal: 2026-09-24 · Status: menunggu review

## Tujuan

Pelajar/awam memasukkan satu kasus waris, mendapat pembagian yang benar menurut engine [SYF],
dan bisa memahami *kenapa* langkah demi langkah. Munasakhat ikut MVP. Semua lokal di browser.

**Sukses bila:** satu kasus bab 16 dan satu kasus munasakhat yang dimasukkan lewat UI
menghasilkan saham dan nominal identik dengan hasil engine di test.

## Keputusan

| Topik | Keputusan |
|---|---|
| Stack | Vite + React 18 + TS, `apps/web` di workspace pnpm. Tanpa backend, tanpa state library (`useReducer`). |
| Design system | Arif Waris (artifact `TAMrFT8QhPmBgB7Ho1gA43`): token → `tokens.css`, `bundle.css` disalin, komponen di-port ke TSX di `apps/web/src/ui/`. Font Google Fonts (Readex Pro, Plus Jakarta Sans). |
| Input ahli waris | Hybrid: checklist +/− (`HeirCard`) relatif ke satu mayit; dipakai ulang per mayit munasakhat. Mode pohon di luar MVP. |
| Edukasi | Hasil langsung tampil + tombol "Pelajari langkah demi langkah" (mode belajar, satu `CalcStep` per layar). |
| Simpan | Autosave `localStorage` + export/import file JSON. Tidak ada link berisi data kasus. |
| Munasakhat | Pertanyaan di langkah 5 "kondisi khusus"; panel munasakhat terbuka di sana. |
| Suara | Copy UI gaya "guru Gen Z" (README Arif Waris). Narasi `packages/explain` dipakai apa adanya; penyesuaian nada = pekerjaan terpisah. |

## Aliran data

```
Wizard (langkah 1–5)
  ↓ checklist → graf via tambahKerabat/opsiRelasi (+ node penghubung untuk saudara dst.)
Kasus { graf, tirkah, pembulatan, urutanWafat, lahirSetelahWafat? }  ⇄ localStorage / JSON
  ↓
urutanWafat kosong ? hitung(input) : hitungMunasakhat(input)
  ↓
PERLU_INPUT    → kembali ke langkah terkait, field disorot, tampilkan `alasan`
TIDAK_DIDUKUNG → kartu peringatan: alasan + chip rujukan (+ mayit ke-berapa untuk munasakhat)
exception      → kartu "kesalahan internal" + tombol salin JSON kasus; tidak ada hasil parsial
OK             → layar hasil
```

UI tidak menghitung bagian apa pun. `ruleset: 'syafii'`, `konfigurasi` default engine, `versiKb` dari engine.

## Layar

**Wizard** — satu pertanyaan per layar, caption "Langkah n dari 5", `Button` Kembali / "Gas, langkah berikutnya".

1. **Pewaris**: nama (opsional), jenis kelamin (`Chip`).
2. **Harta**: tirkah kotor (teks → `bigint`, format ribuan saat diketik), pembulatan 1/100/1000 (`Chip`).
3. **Kewajiban**: tajhiz, hutang, wasiat (default 0). Batas wasiat diputuskan engine.
4. **Ahli waris**: grid `.aw-heirs` berisi `HeirCard` per jenis ahli waris dengan +/−. Kartu turunan
   (cucu, keponakan) hanya muncul bila induknya ada, dengan pilihan "dari yang mana". Status
   pernikahan (utuh/talak) ditanyakan di kartu pasangan bila relevan.
5. **Kondisi khusus** (checklist, hanya yang didukung engine):
   - Beda agama → pilih orang (`agama: 'nonIslam'`).
   - Terlibat dalam kematian pewaris → pilih orang (`membunuhPewaris`).
   - **Ada ahli waris yang wafat sebelum harta dibagi** → panel munasakhat:
     pilih orang (hanya ahli waris yang sudah diisi), urutkan ↑↓ waktu wafat, tiap orang
     punya kartu "Ahli waris [nama]" berisi checklist langkah 4 relatif ke orang itu. Kerabat yang
     sudah ada di graf dikenali lewat graf, tidak diisi ulang.
   - Tidak ditampilkan: hamil, mafqud (blocked), sengketa, KHI (di luar ruleset).

**Hasil**
- Ringkasan tirkah: kotor → tajhiz → hutang → wasiat → bersih.
- `ResultCard` (+ `ShareBar`, `FractionBadge`, stiker "Fix!"): nama, bagian, saham, nominal;
  baris terpisah **selisih pembulatan**.
- Yang mahjub/terhalang: `HeirCard blocked` dengan alasan.
- Munasakhat: tab per mayit, tab jami'ah, tabel akhir.
- Penjelasan per bab (`jelaskan` / `jelaskanMunasakhat`) sebagai `CalcStep` yang bisa dibuka;
  `refs` di kotak **Kenapa?**, `Potongan` istilah → tooltip glosarium (`packages/content`).
- Tombol: "Pelajari langkah demi langkah", Ubah (kembali ke wizard), Export JSON.
- Setelah hasil pertama, perubahan input menghitung ulang otomatis.

**Mode belajar** — layar penuh, satu bab per layar, Lanjut/Kembali, tabel terbentuk bertahap;
bab yang sudah dibaca → centang lime + stiker "Kelar". Data sama dengan layar hasil.

**Beranda** — `Motif`, judul, tombol mulai, Import JSON, lanjutkan kasus tersimpan.

## Unit

| File | Tanggung jawab |
|---|---|
| `src/kasus.ts` | Tipe `Kasus`; serialisasi JSON (bigint ↔ string); autosave; import tervalidasi (file rusak/versi lain ditolak dengan pesan). |
| `src/checklist.ts` | Jenis ahli waris ↔ graf: tambah/kurangi via `tambahKerabat`, hitung isi checklist dari graf, kelompok warna. |
| `src/jalankan.ts` | Pilih `hitung` vs `hitungMunasakhat`, tangkap exception jadi status `GALAT`. |
| `src/ui/*` | Port komponen Arif Waris (Button, Chip, Sticker, Highlight, FractionBadge, HeirCard, ShareBar, CalcStep, ResultCard, NavBar, Logo, Motif). |
| `src/layar/*` | Wizard, LangkahN, PanelMunasakhat, Hasil, ModeBelajar, Beranda. |

Pemetaan kelompok warna: suami/istri → `pasangan`; anak/cucu → `keturunan`;
ayah/ibu/kakek/nenek → `leluhur`; saudara/keponakan/paman/sepupu → `saudara`.

`ShareBar.weight` (`number`) hanya untuk lebar visual, dihitung dari saham/tashih di layer tampilan.

## Error & aksesibilitas

- Input uang: hanya digit; nilai negatif/kosong ditolak di form.
- Import JSON = trust boundary: validasi bentuk penuh sebelum dipakai.
- Target sentuh ≥ 44px, fokus keyboard (`focus` token), kontras sesuai token, tanpa scroll horizontal < 720px.

## Test

- `kasus.test.ts`: round-trip JSON; import rusak ditolak.
- `checklist.test.ts`: checklist → graf → checklist stabil; cucu via anak lk vs pr beda node.
- `integrasi.test.ts`: fixture bab 16 dan munasakhat (`packages/engine/src/__tests__/fixtures`)
  dibangun lewat `checklist.ts` sebagai `Kasus`, hasil identik dengan engine.
- UI: satu smoke test render wizard → hasil (vitest + testing-library).

## Di luar MVP

Mode pohon, donut, halaman dalil lengkap, checklist "langkah selanjutnya", PWA, animasi beranda,
penyesuaian nada `packages/explain`, KHI (fase 4), dzawil arham (fase 3).
