# Materi Pembelajaran Faraidh

Versi ajar dari `docs/kb` (madzhab Syafi'i). Materi hanya menjelaskan ulang KB; hukum baru tidak ditulis di sini.
Draf disusun Claude (2026-09-25) dan **perlu direview tim keilmuan**; tiap pelajaran bertanda `perluCek: true`
sampai direview.

Cara menulis pelajaran: lihat `README` di bagian bawah berkas ini.

## Daftar Modul
| No | Judul | Ringkas |
|---|---|---|
| 1 | Pengantar | Apa itu faraidh dan apa yang dibereskan sebelum harta dibagi |
| 2 | Siapa ahli waris | Rukun, syarat, sebab, penghalang, dan daftar ahli waris |
| 3 | Bagian pasti (furudh) | Enam bagian dalam Al-Qur'an dan siapa pemiliknya |
| 4 | Sisa (ashabah) | Yang mengambil sisa, jenis-jenisnya, dan urutannya |
| 5 | Penghalang (hajb) | Ahli waris yang terhalang atau berkurang bagiannya |
| 6 | Kakek & saudara | Muqasamah dan akdariyyah |
| 7 | Menghitung | Ashlul mas'alah, 'aul, dan radd |
| 8 | Tashih | Supaya bagian tiap orang jadi bilangan bulat |
| 9 | Pembagian nominal | Dari saham ke rupiah |
| 10 | Munasakhat | Ahli waris wafat sebelum harta dibagi |

## README

Satu berkas = satu pelajaran, nama `<modul>-<urutan>-<slug>.md`. Frontmatter wajib: `judul`, `modul`, `urutan`,
`tujuan`, `perluCek`. Isi memakai Markdown terbatas:

- `##`, `###`, paragraf, daftar `-` / `1.`, catatan `>`, tabel, `**tebal**`, `*miring*`.
- `[[id-istilah]]` atau `[[id-istilah|teks tampil]]`: istilah dari glosarium (bab 15), tampil sebagai tooltip.
- `[R04-2]`: kode rujukan KB, tampil sebagai tautan "dalil". Setiap klaim hukum wajib punya kode.
- Blok contoh yang dihitung engine:

      ```kasus
      pewaris: L
      ahli waris: ISTRI, 2 ANAK_PR, AYAH
      harta: 120.000.000
      harapan: ISTRI 3, ANAK_PR 16, AYAH 5; ashl 24
      ```

  `harapan` tidak ditampilkan; test memastikan angkanya sama dengan hasil engine, jadi angka yang ditulis di
  teks pelajaran harus sama dengan `harapan`.
- Video YouTube (diputar lewat youtube-nocookie):

      ```video
      https://www.youtube.com/watch?v=XXXXXXXXXXX
      judul: Judul video
      ```

- Cek pemahaman dari bank kuis (`docs/soal/kuis.md`), satu atau beberapa kode:

      ```kuis
      K-06, K-07
      ```
