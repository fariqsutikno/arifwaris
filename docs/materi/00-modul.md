# Materi Pembelajaran Faraidh

Versi ajar dari `docs/kb` (madzhab Syafi'i). Materi hanya menjelaskan ulang KB; hukum baru tidak ditulis di sini.
Draf disusun Claude (2026-09-25) dan **perlu direview tim keilmuan**; tiap pelajaran bertanda `perluCek: true`
sampai direview.

Cara menulis pelajaran: lihat `README` di bagian bawah berkas ini.

## Daftar Modul
| No | Judul | Ringkas | Judul (ar) | Ringkas (ar) |
|---|---|---|---|---|
| 1 | Pengantar | Apa itu faraidh dan apa yang dibereskan sebelum harta dibagi | مقدمة | ما الفرائض وما الذي يقدم قبل قسمة المال |
| 2 | Siapa ahli waris | Rukun, syarat, sebab, penghalang, dan daftar ahli waris | من هم الورثة | الأركان والشروط والأسباب والموانع وقائمة الورثة |
| 3 | Bagian pasti (furudh) | Enam bagian dalam Al-Qur'an dan siapa pemiliknya | الأنصبة المقدرة (الفروض) | الفروض الستة في القرآن ومن يستحقها |
| 4 | Sisa (ashabah) | Yang mengambil sisa, jenis-jenisnya, dan urutannya | الباقي (العصبة) | من يأخذ الباقي وأنواعه وترتيبه |
| 5 | Penghalang (hajb) | Ahli waris yang terhalang atau berkurang bagiannya | الحجب | الوارث المحجوب أو الذي ينقص نصيبه |
| 6 | Kakek & saudara | Muqasamah dan akdariyyah | الجد والإخوة | المقاسمة والأكدرية |
| 7 | Menghitung | Ashlul mas'alah, 'aul, dan radd | الحساب | أصل المسألة والعول والرد |
| 8 | Tashih | Supaya bagian tiap orang jadi bilangan bulat | التصحيح | ليصير نصيب كل واحد عددا صحيحا |
| 9 | Pembagian nominal | Dari saham ke rupiah | القسمة بالمبالغ | من السهام إلى الروبية |
| 10 | Munasakhat | Ahli waris wafat sebelum harta dibagi | المناسخات | موت الوارث قبل قسمة التركة |

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
