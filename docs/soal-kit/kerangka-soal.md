# Kerangka jumlah dan sebaran soal konsep

Target sekitar **990 soal** (295 dasar, 420 menengah, 275 sulit). Angka per modul adalah sasaran, bukan batas keras;
selisih ±10% per modul tidak apa-apa. Kolom topik menyebut **topik yang wajib tercakup**, minimal tiga soal per butir
di tingkat yang cocok (token atau `konsep:`).

**Pembagian kerja dengan mesin.** Soal angka sederhana ("berapa bagian ibu?", "siapa yang gugur?", "berapa ashl
akhirnya?", "siapa penerima ashabah?") untuk kasus satu mayit dibuat mesin dalam jumlah puluhan ribu
(`docs/design/spec-soal-kuis-ribuan.md`). Jangan menulis soal yang hanya menanyakan satu angka itu. Fokus pada yang
tidak bisa dibuat mesin:

| Jenis soal konsep | Contoh | Porsi |
|---|---|---|
| Alasan hukum | "Mengapa saudara seibu gugur oleh kakek?" | ±25% |
| Mengenali keadaan | "Kasus mana yang termasuk 'aul?" (pilihan berupa susunan ahli waris) | ±20% |
| Langkah berikutnya | "Setelah ashl 6 dan jumlah saham 8, apa langkah berikutnya?" | ±15% |
| Cari kesalahan | "Seorang siswa menghitung seperti ini. Di langkah mana ia keliru?" | ±15% |
| Pengertian dan syarat | "Apa syarat cucu laki-laki menjadi ashabah?" | paling banyak ±15% (modul 1–2 boleh lebih) |
| Khilaf dan kasus lanjutan | munasakhat, dzawil arham, haml, mafqud, khuntsa, gharqa; khilaf bermadzhab | sisanya |

**Ukuran paket.** Satu berkas paket paling banyak 30 soal (mis. `hajb-dasar-1.md`, `hajb-dasar-2.md`) supaya mudah
diperiksa dan ditinjau tim. Nomor kode soal berlanjut dalam satu modul (`P-05-001` sampai `P-05-090`).

**Bergelombang.** Tulis per modul setelah materi modul itu selesai. Kirim gelombang pertama satu modul (±30 soal),
tunggu catatan tim, baru lanjutkan sisa modul itu.

Sumber KB dan slug pelajaran mengikuti `docs/materi-kit/kerangka-kurikulum.md`; baca bab KB-nya sebelum menulis.

| Modul | Soal | Dasar / Menengah / Sulit | Topik yang wajib tercakup | Catatan |
|---|---|---|---|---|
| 1 Pengantar | 70 | 40 / 25 / 5 | `konsep:urutan-tirkah`, `konsep:wasiat`, `konsep:hibah-dan-harta-bersama`, `konsep:rukun-faraidh` | Boleh memuat soal pengertian lebih banyak. Angka wasiat 1/3 memakai `tanpa-kasus`. |
| 2 Siapa yang mewarisi | 90 | 45 / 35 / 10 | `konsep:rukun-syarat-sebab`, `konsep:penghalang-waris`, `konsep:daftar-ahli-waris`, `konsep:tiga-cara-mewarisi` | Penghalang: pembunuhan, beda agama, budak, murtad. Soal yang menyebut saham memakai kasus. |
| 3 Bagian pasti | 80 | 35 / 35 / 10 | suami dan istri (1/2, 1/4, 1/8), ibu (tiga keadaan), ayah (tiga keadaan), nenek, anak dan cucu perempuan, saudari dan saudara seibu | Pakai `hajb:<KUNCI>` atau `konsep:bagian-<nama>`; semua soal bersaham berkasus. |
| 4 Ashabah | 70 | 25 / 35 / 10 | `ashabahBilGhair`, `ashabahMaalGhair`, `konsep:urutan-ashabah`, aturan 2:1 dan pengecualiannya | Urutan jihah, derajat, kekuatan kerabat. |
| 5 Hajb | 90 | 30 / 40 / 20 | `hajb:SAUDARA_KANDUNG`, `hajb:SAUDARA_SEIBU`, `hajb:CUCU_LK`, `hajb:CUCU_PR`, `hajb:KAKEK`, `hajb:SAUDARA_SEBAPAK`, `hajb:SAUDARI_SEBAPAK`, `hajb:PAMAN_KANDUNG`, empat pemicu nuqshan, mahjub tetap mengurangi, enam yang tidak pernah gugur | Contoh: `contoh/hajb-dasar.md`. |
| 6 Menghitung | 60 | 20 / 30 / 10 | `aul:6>7` sampai `aul:6>10`, `aul:12>13`, `aul:12>15` atau `aul:12>17`, `aul:24>27`, `radd` tanpa dan dengan pasangan, ashl semua ashabah, angka yang mustahil | Contoh: `contoh/aul-dasar.md`. |
| 7 Tashih | 50 | 10 / 25 / 15 | `tashih`, `inkisar:1`, `inkisar:2`, `inkisar:3`, `konsep:nisab-arba`, kaidah angka 1 | Kasus bab 10.4 sebagai bahan; pengali tashih dari engine. |
| 8 Dari saham ke rupiah | 50 | 20 / 25 / 5 | `konsep:ke-rupiah`, `konsep:pembulatan`, `konsep:takharuj` | Selisih pembulatan dan takharuj tanpa angka saham memakai `tanpa-kasus` atau tanpa angka. |
| 9 Kasus bernama | 50 | 10 / 25 / 15 | `bernama:umariyyatain`, `bernama:musyarrakah` | Termasuk kasus yang membatalkan pola (kakek menggantikan ayah, istri menggantikan suami). |
| 10 Kakek dan saudara | 70 | 10 / 30 / 30 | `kakekSaudara`, `bernama:muaddah`, `bernama:akdariyyah` | Khilaf kakek dan ayah disebut madzhabnya. |
| 11 Munasakhat | 70 | 10 / 25 / 35 | `munasakhat`, `munasakhat:2`, `munasakhat:3`, `keadaan:1`, `keadaan:2`, `keadaan:3`, `ikhtishar` | `kode-bank` lanjutan, tanpa angka pecahan. |
| 12 Dzawil arham | 70 | 10 / 25 / 35 | `dzawilArham`, `tanzil:<KUNCI>`, `dzawilArham:pasangan`, `dzawilArham:duaJalur` | `kode-bank` lanjutan, tanpa angka pecahan; syarat mewarisi dari KB bab 14. |
| 13 Ketidakpastian dan haml | 60 | 5 / 25 / 30 | `haml`, `mauquf`, `kelasD`, `dunia:<n>` | Posisi [SYF]; model enam taqdir [HNB] hanya bila disebut madzhabnya. |
| 14 Mafqud, khuntsa, gharqa | 70 | 5 / 25 / 40 | `mafqud`, `khuntsa`, `gharqa:<keadaan>`, `mayit:<n>` | Gharqa [SYF]: tidak saling mewarisi. Metode [HNB] bermadzhab di kalimat soal. |
| 15 Kasus khusus lain | 40 | 20 / 15 / 5 | `konsep:murtad`, `konsep:lian-dan-zina`, `konsep:laqith` | Hanya yang tertulis di KB 13.5 sampai 13.7; yang `[perlu verifikasi lanjut]` jangan dijadikan soal. |

## Aturan sebaran

- Letak jawaban benar diacak antarsoal (tidak semuanya pilihan yang sama; pemeriksa memperingatkan bila semua sama).
- Dalam satu modul, tidak lebih dari separuh soal yang memakai susunan ahli waris yang sama.
- Setiap token wajib punya soal di tingkat yang cocok; modul dengan kolom sulit nol tidak perlu soal sulit.
- Soal pengertian paling banyak sekitar 15% paket, kecuali modul 1 dan 2.
- Soal yang hanya menanyakan satu angka bagian/ashl untuk kasus satu mayit tidak ditulis (sudah dibuat mesin).
- Satu salah paham dari `pengecoh.md` boleh dipakai di banyak soal, tetapi kalimat dan kasusnya harus berbeda.
- Soal khilaf menyebut madzhab di kalimat soal dan jawaban benarnya mengikuti madzhab itu; default tanpa sebutan
  berarti [SYF].
