# KHI: temuan awal dari bacaan sumber (2026-11-23)

> **Hukum positif, bukan fikih.** Ini catatan kerja Task 1, bukan KB final. Teks pasal ada di `00_teks_khi_terverifikasi.md`
> (salinan lurus dari `KHI.pdf` pemilik). Sumber lain (makalah Djafar, yurisprudensi/SEMA, hukumonline) ada di
> `Referensi Kitab Faraidh/markdown-khi/kumpulan-sumber-khi.md`, di luar repo. Kolom "fikih" hanya merujuk bab `docs/kb`;
> yang belum ada padanannya di KB ditulis **"KB kosong"** dan tidak diisi dari ingatan.

## 1. Tiga dugaan awal sudah dicocokkan ke teks

| Dugaan | Hasil | Isi (ringkas, bunyi lengkap di teks) |
|---|---|---|
| Pasal 185 ahli waris pengganti | benar | (1) ahli waris yang wafat lebih dulu digantikan anaknya, kecuali Pasal 173; (2) bagian pengganti tak boleh melebihi bagian ahli waris yang sederajat dengan yang diganti |
| Pasal 209 wasiat wajibah | benar, tetapi **hanya anak/orang tua angkat** | orang tua angkat ≤ 1/3 dari "harta wasiat anak angkatnya" (sic); anak angkat ≤ 1/3 dari harta warisan orang tua angkatnya; harta anak angkat dibagi Pasal 176–193 |
| Pasal 96–97 harta bersama | benar | 96(1): cerai mati → separuh harta bersama hak pasangan yang hidup lebih lama; 97: janda/duda cerai masing-masing ½ kecuali perjanjian perkawinan |

Pasal terkait harta bersama yang ikut dicakup: 85–95 (khususnya 86, 87, 91, 94 poligami, 95), 171(e) (definisi "harta waris"), 190 (gono-gini istri lebih dari satu).

## 2. Praktik Pengadilan Agama sudah melampaui teks (penting untuk pertanyaan "hasilnya sama di PA?")

Teks KHI saja tidak menjawab; ada lapisan praktik peradilan (yurisprudensi/SEMA, `yurisprudensi-dan-rumusan-kamar-ma.md`):
- **Pengganti** dibatasi sampai **cucu**, lk/pr, dari anak lk/pr (Y2, Rakernas 2010); keponakan (anak saudara kandung) → **wasiat wajibah** (SEMA 3/2015 butir 9).
- **Wasiat wajibah diperluas** ke: ahli waris/istri/anak **non-muslim** (Y1; anak non-muslim bisa sama besar dengan bagian anak muslim: 51 K/Ag/1999), **anak tiri** (SEMA 7/2012 butir 20), **anak dari nikah agama tak dicatat** (SEMA 3/2023). Batas 1/3 pada Pasal 209 tidak otomatis berlaku pada perluasan ini.
- Istri/suami non-muslim juga mendapat **bagian harta bersama** (16 K/Ag/2010; 721 K/Ag/2015).

Konsekuensi desain: ruleset KHI punya **dua lapis berlabel berbeda**: "bunyi KHI" dan "praktik PA (yurisprudensi/SEMA)". Pengguna memilih atau melihat keduanya (pertanyaan terbuka 1).

## 3. Titik beda KHI ↔ fikih [SYF] (calon baris `05_matriks_beda_fikih.md`)

Tingkat keyakinan: **A** = beda jelas dari teks vs KB; **B** = beda atau celah yang perlu dicocokkan ke bab KB dulu; **C** = hanya KHI memuat (tak ada padanan).

| # | Pasal / praktik | KHI | Padanan fikih (KB) | Tingkat |
|---|---|---|---|---|
| 1 | 185 + Y2 | cucu (juga dari anak pr) menggantikan orang tua yang wafat lebih dulu | bab 06 hajb (anak lk menghijab cucu); bab 14 (cucu dari anak pr = dzawil arham); fikih mengenal wasiat dan ridha, bukan "pengganti" | A |
| 2 | 209 + Y1, SEMA | wasiat wajibah anak/orang tua angkat; praktik meluas (non-muslim, tiri, keponakan, nikah tak tercatat) | bab 01: wasiat tak untuk ahli waris, ≤ 1/3; tak ada "wajibah" di KB; beda agama menghalangi (bab 02, K02-2) | A / KB kosong untuk "wajibah" |
| 3 | 96, 97, 94, 190, 171(e) | separuh harta bersama dipisah dulu sebelum tirkah; poligami: tiap perkawinan terpisah | KB kosong (tidak ada bab harta pasangan) | C / KB kosong |
| 4 | 173 | penghalang hanya bila **putusan hakim berkekuatan tetap**: membunuh/mencoba/menganiaya berat; **memfitnah** (kejahatan ≥ 5 th). Murtad/perbudakan tak disebut | bab 02: pembunuhan semua bentuk menghalangi (K02-1), tanpa syarat putusan; fitnah bukan mani' | A |
| 5 | 171(c), 172 | ahli waris harus muslim; status muslim dari KTP/pengakuan/amalan/kesaksian | bab 02 (beda agama); K02-2 beda millah antar kafir | B |
| 6 | 177 | ayah **1/3** bila tak ada anak, 1/6 bila ada anak (tanpa menyebut ashabah) | bab 04/05: ayah ashabah bila tak ada anak lk; 1/6 + sisa bila hanya anak pr | B (dugaan beda; footnote "*" pada PDF tak terbaca) |
| 7 | 176 | anak pr ½ / ⅔; anak lk 2:1 | sama | sama |
| 8 | 178(2) | ibu 1/3 **sisa** bersama ayah + janda/duda | bab 07 (Umariyyatain, default [SYF]) | sama |
| 9 | 181, 182 | saudara seibu 1/6, 1/3; saudari kandung **atau seayah** satu rumusan (½, ⅔, 2:1) | bab 04/05/06: kandung dan seayah dibedakan (hijab, takmilah); musyarrakah K07-1 | B (KHI menyatukan kandung/seayah; musyarrakah tak diatur. Makalah Djafar menyebut yurisprudensi MA menyamakan seibu dengan kandung sebagai ashabah 2:1; nomor putusan pada makalah tak terbaca jelas) |
| 10 | 174, 176–182 | tak memuat kakek, nenek, cucu sebagai furudh/ashabah; kakek hanya disebut pada daftar 174 | bab 03–08 | B (celah, bukan beda) |
| 11 | 186 | anak luar kawin saling mewarisi dengan ibu dan keluarga ibu | bab 13.6 (K13-2: [SYF] tanpa ashabah, radd ke ibu/saudara seibu; [HNB] ibu dan ashabah ibu) | B |
| 12 | 192 | 'aul: penyebut dinaikkan | bab 09 | sama |
| 13 | 193 | radd bila tak ada ashabah, "dibagi berimbang di antara mereka" | bab 09 K09-1: default [SYF] radd tanpa pasangan | B (apakah janda/duda ikut radd menurut KHI tak tegas) |
| 14 | 191 | tanpa ahli waris → Baitul Mal atas putusan PA | bab 14 (dzawil arham mewarisi bila baitul mal tak tegak) | B (KHI tak menyebut dzawil arham) |
| 15 | 195(2)(3), 201, 213 | wasiat ≤ 1/3 kecuali semua ahli waris setuju; wasiat ke ahli waris asal semua setuju; hibah saat sakit dekat kematian perlu persetujuan ahli waris | bab 01 K01-1 (ijazah hanya setelah wafat; wasiat ke ahli waris batal tanpa ijazah) | B (KHI tak menyebut waktu persetujuan) |
| 16 | 211, 212 | hibah ortu→anak **dapat diperhitungkan sebagai warisan**; hibah tak bisa ditarik kecuali ortu→anak | KB kosong (hibah tak ada di KB) | C / KB kosong |
| 17 | 183 | ahli waris boleh berdamai "setelah masing-masing menyadari bagiannya" | bab 11 (R11-2 shulh/tawahub; takharuj) | sama arah, bisa jadi jalan keluar callout |
| 18 | 189 | lahan pertanian < 2 ha dipertahankan utuh | KB kosong | C |
| 19 | 175(2), 171(e), 187 | tanggung jawab utang sebatas harta peninggalan; urutan pengeluaran; pelaksana pembagian | bab 01 (urutan hak tirkah) | B |

Hal di luar hitungan (abaikan di engine, mungkin materi belajar): hukum acara (Y4, SEMA 5/2021, 1/2017, 2/2019, 3/2023 selain wasiat wajibah, 1/2022), waris adat (Y3), KUHPerdata.

## 4. Salah ketik pada PDF (jangan diperbaiki diam-diam)

- 174(1): "saudara perempuan **dari nenek**" (kemungkinan: "dan nenek"; hukumonline mengutipnya "dan nenek").
- 175(1)d: "wahli waris"; 192: "menutu"; 193: "pembarian"; 197(1)b: "memfitrnah"; 87–95: "dikuasi", "dikakukan".
- 209(1): "1/3 dari **harta wasiat** anak angkatnya", sedangkan ayat (2) memakai "harta warisan".
- 177: tanda `*` tanpa catatan kaki di PDF.
- Penjelasan: "Pasal 149 s/d 185" (kemungkinan 186).
Perlu satu edisi KHI lain untuk menjawab; sampai itu jelas, tandai `perlu verifikasi lanjut` dan jangan dipakai sebagai angka tetap.

## 5. Yang dipetakan tapi belum diverifikasi

Pernyataan di artikel hukumonline (tersier), mis. "janda dalam iddah talak raj'i mewarisi", "poligami: 1/2 + 1/3 dari harta bersama" (kutipan Pedoman Pelaksanaan Tugas Buku II, 2013), "wasiat wajibah ≤ 1/3 pada perluasan", bukan teks KHI. Dipakai sebagai petunjuk arah riset, bukan dasar aturan.

## 6. Pembaruan setelah edisi KHI lain, Pedoman Buku II (2010), dan putusan MK 46

**Salah ketik (bagian 4) dijawab.** Tiga edisi KHI sama persis pada Pasal 174(1) ("saudara perempuan dari nenek") dan 209(1) ("harta wasiat anak angkatnya"), jadi itu bunyi resmi, bukan salah cetak lokal; dikutip apa adanya. Tanda `*` Pasal 177 adalah catatan kaki: "Berdasarkan Surat Edaran Mahkamah Agung Nomor 2 Tahun 1994, maksud pasal tersebut ialah: ayah mendapat sepertiga bagian bila pewaris tidak meninggalkan anak, tetapi meninggalkan suami dan ibu, bila ada anak, ayah mendapat seperenam bagian" (KHI Ed Lain, OCR; urutan baris pada OCR terbalik). Salah ketik huruf di PDF pertama (menutu, pembarian, memfitrnah, dst.) tetap kesalahan cetak PDF itu.

**Pedoman Buku II Edisi Revisi 2010 (MA RI, Ditjen Badilag, 2011)** ternyata merumuskan hukum kewarisan yang dipakai hakim PA secara lengkap (hlm. 163–168, kutipan di `markdown-khi/pedoman-buku-ii-kutipan.md`). Ini mengubah beberapa baris tabel bagian 3:

| Baris | Perubahan |
|---|---|
| 6 (Pasal 177) | Pedoman: ayah 1/6 bila ada anak/keturunan, **ashabah** bila tidak (Pasal 177 jo SEMA 2/1994). Jadi **sama dengan fikih**, bukan beda. |
| 9 (181–182) | Pedoman butir 6: yurisprudensi MA menyamakan saudara seibu dengan kandung/seayah, **ashabah bersama, laki-laki 2:1** (tanpa nomor putusan). Tetap **beda** dari [SYF] (K07-1, tasyrik). Pedoman butir 4(a)(6)–(7) juga memperlakukan semua jenis saudara dalam satu rumusan. |
| 10 (celah) | **Terjawab sebagian**: Pedoman memberi kelompok ashabah (anak, saudara, kakek-nenek, paman-bibi dan keturunannya), prinsip hijab (butir 5), empat derajat kelompok (butir 7), dan urutan hitung (butir 8). KHI "diam" lebih sedikit daripada dugaan; pertanyaan 2 rencana berubah (lihat rencana). |
| 13 (Pasal 193) | Pedoman 8(h): radd **tidak berlaku untuk janda dan duda** → **sama dengan** default [SYF]. |
| 14 (Pasal 191, dzawil arham) | Pedoman 2(a): asas bilateral, **"tidak mengenal kerabat dzawil arham"**; kerabat jauh masuk sebagai ahli waris pengganti atau ashabah (kakek-nenek, paman-bibi). **Beda besar** dari bab 14 (tanzil). |
| 1 (pengganti) | Pedoman memperluas pengganti ke keturunan **saudara** serta paman/bibi dan kakek/nenek (butir 2(a)(2), 4(c)); sedangkan **SEMA 3/2015 (Rakernas 2010)** dan makalah Djafar membatasi sampai cucu, keponakan → wasiat wajibah. **Dua sumber bertentangan**; SEMA lebih baru (2015). Perlu keputusan pemilik. |
| 2 (wasiat wajibah non-muslim) | Pedoman 2(i): kerabat sedarah non-muslim mendapat wasiat wajibah **maksimal 1/3 dan tidak melebihi bagian ahli waris yang sederajat**. 51 K/Ag/1999 menyamakan dengan bagian anak muslim. Usul default: aturan Pedoman, dengan label "bervariasi menurut putusan hakim". |
| 3 (harta bersama poligami) | Pedoman hlm. 139–140: Pasal 94 dinilai tidak adil dan "harus dipahami" lain: harta tiap perkawinan menjadi harta bersama dengan **semua istri sebelumnya**; rumus istri pertama ½ + 1/3 + 1/4 + 1/5; harta yang diperuntukkan istri ke-2–4 (rumah, perabot, pakaian) tidak melebihi 1/3. |
| 16 (hibah) | Pedoman butir 3: hibah dan wasiat kepada ahli waris **diperhitungkan sebagai warisan** (disebut "Pasal 210", kemungkinan 211/195(3)). |

**MK 46/PUU-VIII/2010.** Pasal 43(1) UU Perkawinan dibaca: anak di luar perkawinan punya hubungan perdata dengan ibu dan keluarga ibunya **serta dengan laki-laki yang dapat dibuktikan (IPTEK/alat bukti lain) sebagai ayah biologisnya**. KHI Pasal 186 hanya menyebut ibu dan keluarga ibu. Bahan yang ada tidak menjelaskan akibat MK pada waris Islam di PA; **tidak dihitung** di engine, hanya dicatat di materi/callout sebagai "ada putusan MK; hubungan perdata, belum otomatis waris".

**Di luar cakupan:** artikel IJISK 3(4) 2026 (waris BW non-muslim, putusan PN Medan; verstek/voluntair).
