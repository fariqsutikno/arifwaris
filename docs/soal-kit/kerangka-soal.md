# Kerangka jumlah dan sebaran soal awal

Usulan awal, bukan batas. Jumlah soal per modul mengikuti besar dan kesulitan modul; total 136 soal
(36 dasar, 60 menengah, 40 sulit). Kolom topik menyebut **topik yang wajib tercakup** minimal satu soal per butir
(token atau `konsep:`). Satu paket boleh memuat satu modul penuh atau dipecah per subtopik (`hajb-dasar`, `hajb-lanjut`);
nomor kode soal tetap berlanjut dalam satu modul.

Sumber KB dan slug pelajaran mengikuti `docs/materi-kit/kerangka-kurikulum.md`; baca bab KB-nya sebelum menulis.

| Modul | Soal | Dasar / Menengah / Sulit | Topik yang wajib tercakup | Catatan |
|---|---|---|---|---|
| 1 Pengantar | 6 | 4 / 2 / 0 | `konsep:urutan-tirkah`, `konsep:wasiat`, `konsep:hibah-dan-harta-bersama`, `konsep:rukun-faraidh` | Boleh memuat soal pengertian lebih banyak. Angka wasiat 1/3 memakai `tanpa-kasus`. |
| 2 Siapa yang mewarisi | 8 | 4 / 3 / 1 | `konsep:rukun-syarat-sebab`, `konsep:penghalang-waris`, `konsep:daftar-ahli-waris`, `konsep:tiga-cara-mewarisi` | Penghalang: pembunuhan, beda agama, budak, murtad. Soal yang menyebut saham memakai kasus. |
| 3 Bagian pasti | 12 | 5 / 5 / 2 | suami dan istri (1/2, 1/4, 1/8), ibu (tiga keadaan), ayah (tiga keadaan), nenek, anak dan cucu perempuan, saudari dan saudara seibu | Pakai `hajb:<KUNCI>` atau `konsep:bagian-<nama>`; semua soal bersaham berkasus. |
| 4 Ashabah | 10 | 3 / 5 / 2 | `ashabahBilGhair`, `ashabahMaalGhair`, `konsep:urutan-ashabah`, aturan 2:1 dan pengecualiannya | Urutan jihah, derajat, kekuatan kerabat. |
| 5 Hajb | 14 | 5 / 6 / 3 | `hajb:SAUDARA_KANDUNG`, `hajb:SAUDARA_SEIBU`, `hajb:CUCU_LK`, `hajb:CUCU_PR`, `hajb:KAKEK`, `hajb:SAUDARA_SEBAPAK`, `hajb:SAUDARI_SEBAPAK`, `hajb:PAMAN_KANDUNG`, empat pemicu nuqshan, mahjub tetap mengurangi, enam yang tidak pernah gugur | Contoh: `contoh/hajb-dasar.md`. |
| 6 Menghitung | 14 | 4 / 7 / 3 | `aul:6>7` sampai `aul:6>10`, `aul:12>13`, `aul:12>15` atau `aul:12>17`, `aul:24>27`, `radd` tanpa dan dengan pasangan, ashl semua ashabah, angka yang mustahil | Contoh: `contoh/aul-dasar.md`. |
| 7 Tashih | 10 | 2 / 5 / 3 | `tashih`, `inkisar:1`, `inkisar:2`, `inkisar:3`, `konsep:nisab-arba`, kaidah angka 1 | Kasus bab 10.4 sebagai bahan; pengali tashih dari engine. |
| 8 Dari saham ke rupiah | 8 | 3 / 4 / 1 | `konsep:ke-rupiah`, `konsep:pembulatan`, `konsep:takharuj` | Selisih pembulatan dan takharuj tanpa angka saham memakai `tanpa-kasus` atau tanpa angka. |
| 9 Kasus bernama | 6 | 1 / 3 / 2 | `bernama:umariyyatain`, `bernama:musyarrakah` | Termasuk kasus yang membatalkan pola (kakek menggantikan ayah, istri menggantikan suami). |
| 10 Kakek dan saudara | 10 | 1 / 4 / 5 | `kakekSaudara`, `bernama:muaddah`, `bernama:akdariyyah` | Khilaf kakek dan ayah disebut madzhabnya. |
| 11 Munasakhat | 8 | 1 / 3 / 4 | `munasakhat`, `munasakhat:2`, `munasakhat:3`, `keadaan:1`, `keadaan:2`, `keadaan:3`, `ikhtishar` | `kode-bank` lanjutan, tanpa angka pecahan. |
| 12 Dzawil arham | 8 | 1 / 3 / 4 | `dzawilArham`, `tanzil:<KUNCI>`, `dzawilArham:pasangan`, `dzawilArham:duaJalur` | `kode-bank` lanjutan, tanpa angka pecahan; syarat mewarisi dari KB bab 14. |
| 13 Ketidakpastian dan haml | 8 | 0 / 4 / 4 | `haml`, `mauquf`, `kelasD`, `dunia:<n>` | Posisi [SYF]; model enam taqdir [HNB] hanya bila disebut madzhabnya. |
| 14 Mafqud, khuntsa, gharqa | 10 | 0 / 4 / 6 | `mafqud`, `khuntsa`, `gharqa:<keadaan>`, `mayit:<n>` | Gharqa [SYF]: tidak saling mewarisi. Metode [HNB] bermadzhab di kalimat soal. |
| 15 Kasus khusus lain | 4 | 2 / 2 / 0 | `konsep:murtad`, `konsep:lian-dan-zina`, `konsep:laqith` | Hanya yang tertulis di KB 13.5 sampai 13.7; yang `[perlu verifikasi lanjut]` jangan dijadikan soal. |

## Aturan sebaran

- Letak jawaban benar diacak antarsoal (tidak semuanya pilihan yang sama; pemeriksa memperingatkan bila semua sama).
- Dalam satu modul, tidak lebih dari separuh soal yang memakai susunan ahli waris yang sama.
- Setiap token wajib punya soal di tingkat yang cocok; modul dengan kolom sulit nol tidak perlu soal sulit.
- Soal definisi paling banyak seperlima paket, kecuali modul 1 dan 2.
- Soal khilaf menyebut madzhab di kalimat soal dan jawaban benarnya mengikuti madzhab itu; default tanpa sebutan
  berarti [SYF].
