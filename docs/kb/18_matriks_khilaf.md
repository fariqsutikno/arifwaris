---
bab: 18
judul: Matriks Khilaf Antar-Madzhab
tags: [khilaf, madzhab, syafii, hanbali, hanafi, maliki, ruleset, overlay]
---

# 18. Matriks Khilaf Antar-Madzhab

Sumber tunggal untuk ruleset overlay. **[SYF]** = default dan dasar; [HNB], [HNF], [MLK] hanya mengubah titik yang tercantum di sini. Titik yang tidak ada di tabel ini = sama dengan [SYF] untuk semua madzhab **hanya bila** bab asalnya menyebut ijma'/jumhur; selain itu dianggap **belum dikaji** dan engine mode non-[SYF] mengembalikan `TIDAK_DIDUKUNG` untuk kasus yang menyentuhnya.

## 18.1 Konvensi
- **Kode** `Kxx-y` (xx = bab asal; 13a–13d memakai `K13a-y` dst.). Blok `KHILAF` di bab asal memuat dalil dan kutipan; tabel ini hanya ringkasan keputusan.
- **Status sel**: tanpa tanda = `primer` (dicek ke teks madzhab: untuk [SYF] = Raudhah). **(s)** = `sekunder` (nukilan Lahim, Ithraa, Ibnu 'Utsaimin, Al-Muyassar). **?** = belum ada nukilan; engine → `TIDAK_DIDUKUNG`.
- **Opsi**: bila satu madzhab punya khilaf internal yang wajib menjadi parameter, ditulis `opsi:` dan masuk `KonfigurasiMadzhab`.
- Sel (s) dari Lahim atau Ithraa **cukup sebagai dasar implementasi** (keputusan pengguna 2026-09-29); tidak menunggu teks primer. UI tetap menyebut sumbernya ("menurut Lahim/Ithraa").

## 18.2 Matriks

### Syarat, mawani', hak tirkah
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K01-1 | Ijazah wasiat > 1/3 | hanya setelah wafat (Bahr al-Madzhab) | hanya setelah wafat (Mughni 6/147) | hanya setelah wafat (Mabsuth 27/154) | di masa sehat boleh ditarik; di maradh al-maut mengikat (Mughni) | 01 |
| K02-1 | Pembunuhan yang menghalangi | semua bentuk | tanpa hak yang mewajibkan qishash/diyat/kafarat (Mughni 6/365 · shamela:8463/2687) | yang mewajibkan qawad atau kafarat, atau dianjurkan kafarat (s) | hanya 'amd zalim; khatha' tidak menghalangi dari harta (s) | 02 |
| K02-2 | Beda millah antar kafir | satu millah | beda millah menghalangi (s) | satu millah (s) | beda millah menghalangi (s) | 02 (tidak relevan platform) |
| K02-3 | Istri ditalak ba'in saat maradh al-maut | tidak mewarisi · opsi: qaul qadim mewarisi | mewarisi selama belum menikah lagi (s) | mewarisi bila suami wafat saat ia masih dalam iddah (s) | mewarisi walau sudah menikah lagi (s) | 02 |
| K02-4 | Ikhtilaf ad-dar antar kafir | mani' pada sebagian bentuk (s) | bukan mani' (s) | mani' pada 3 bentuk (s) | bukan mani' (s) | 02 (tidak relevan platform) |
| K02-5 | Iqrar nasab oleh ahli waris yang lalu terhijab (daur hukmi) | nasab tetap, yang diakui **tidak** mewarisi (al-ashah) (s) | nasab tetap, mewarisi, pengaku terhijab (s) | = [HNB] (s) | mewarisi, nasab tidak tetap kecuali 2 saksi adil dari ahli waris (s) | 02 |
| K13-1 | Harta murtad | fai' baitul mal | fai' (Mughni 6/372–373 · shamela:8463/2694 shamela:8463/2695) | Abu Hanifah: harta semasa Islam untuk ahli waris muslim, semasa riddah fai'; harta murtaddah seluruhnya untuk ahli waris muslim (s) | fai' (s) | 13 |
| K13-2 | Ashabah anak li'an/zina | tidak ada; radd ke ibu/saudara seibu | ashabah ibu (satu riwayat) (Mughni 6/340, qaul matan al-Kharaqi · shamela:8463/2662) | ashabah ibu (s) | tidak ada (s) | 13 |

### Ahli waris dan furudh
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K03-1 | Nenek lewat ayah di atas kakek (umm abil jadd) | ahli waris | hanya 3 nenek; ini dzawil arham (Mughni 6/300–301: tiga nenek — ummul umm, ummul ab, ummul jadd; ummu abil jadd tidak mewarisi · shamela:8463/2622 shamela:8463/2623) | ahli waris (Mabsuth 29/167 · shamela:5423/5924) | hanya nenek yang disepakati (ummul umm, ummul ab dan ke atas lewat perempuan); ini dzawil arham (s) | 03 |
| K04-1 | Nenek dekat pihak ayah vs nenek jauh pihak ibu | tidak menghijab (yang dekat pihak ibu menghijab) | dekat menghijab mutlak (Mughni 6/302: satu dari dua riwayat Ahmad, pilihan Ibnu Qudamah · shamela:8463/2624) | dekat menghijab mutlak (s) | = [SYF] (s) | 04 |
| K04-2 | Ummul ab bersama ayah | terhijab | tidak terhijab (zhahir madzhab; riwayat lain: terhijab) (Mughni 6/303 · shamela:8463/2625) | terhijab (s) | terhijab (s) | 04 |
| K07-1 | Musyarrakah | tasyrik | tanpa tasyrik (Mughni 6/280 · shamela:8463/2602) | tanpa tasyrik (s) | tasyrik (s) | 07 |

### Ashabah, jadd, radd
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K05-1 | Urutan jihah; kakek vs saudara | kakek sejajar saudara | = [SYF] (riwayat masyhur) (s) | kakek = ayah, menghijab saudara (s) | = [SYF] (s) | 05, 08 |
| K05-2 | Furudh dalam wala' | tidak ada | ayah mu'tiq 1/6 bersama anak lk mu'tiq (s) | tidak ada — semua untuk anak lk mu'tiq (Mabsuth 30/39; Abu Yusuf akhir: ayah 1/6, marjuh) | tidak ada (Ibnu Syas, 'Iqd al-Jawahir 3/1197) | 05 |
| K08-1 | Rincian muqasamah/akdariyyah | madzhab Zaid (bab 08) | = [SYF] (s) | tidak berlaku (K05-1) | = [SYF] (s) | 08 |
| K09-1 | Sisa harta tanpa ashabah | radd bila baitul mal tidak tegak · opsi: `kebijakanSisa` | radd mutlak, kecuali pasangan (Mughni 6/295 · shamela:8463/2617) | wala' → radd (kecuali pasangan) → dzawil arham (Mabsuth 29/175) | baitul mal mutlak (masyhur) (s) | 09 |

### Kasus khusus
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K13a-1 | Batas maksimal kehamilan | 4 th (s) | 4 th (s) | 2 th (s) | 4 th masyhur; 5 th yang diamalkan (s) | 13a |
| K13a-2 | Dibagi sebelum haml lahir | boleh | boleh (s) | boleh (s) | tidak (s) | 13a |
| K13a-3 | Yang ditahan untuk haml | jumlah tak dibatasi; mitra ashabah haml 0 (s) | terbesar dari 2 lk/2 pr; mitra diberi aqall (s) | fatwa: bagian **1 anak lk** (Abu Yusuf); kafil diambil dari ahli waris lain bila di antara mereka ada anak (Takmilah ath-Thuri 'ala al-Bahr ar-Ra'iq 8/574; Lahim: lk atau pr mana yang lebih besar) | — | 13a |
| K13b-1 | Masa tunggu mafqud | ijtihad hakim | 4 th (binasa) / 90 th dari lahir (selamat) ⚑ (Mughni 6/389–390: untuk yang selamat ada dua riwayat — ijtihad hakim dan 90 th; sel semula hanya memuat 90 th · shamela:8463/2711 shamela:8463/2712) | ijtihad hakim (zhahir) (s) | 70/75/80 th dari lahir (s) | 13b |
| K13b-2 | Ahli waris hadir bersama mafqud | al-aswa' (aqall) | al-aswa' (s) | al-aswa' (s) | al-aswa' (s) | 13b |
| K13c-1 | Khuntsa musykil | aqall semua + mauquf sampai jelas/ishtilah | diharapkan jelas: aqall+mauquf; tidak: setengah-setengah (s) | khuntsa paling rugi, tanpa mauquf (s) | setengah-setengah (s) | 13c |
| K13d-1 | Gharqa keadaan 3–5 | tidak saling mewarisi; keadaan 3 ditahan | saling mewarisi dari tilad (Mughni 6/378 · shamela:8463/2700) | tidak saling mewarisi (s) | tidak saling mewarisi (s) | 13d |
| K14-1 | Dzawil arham mewarisi | bila baitul mal tidak tegak | ya (Mughni 6/318–319 · shamela:8463/2641) | ya (s) | tidak, ke baitul mal (s) | 14 |
| K14-2 | Metode dzawil arham | tanzil | tanzil (Mughni 6/319 · shamela:8463/2641) | qarabah, 7 shinf (14.11; Mabsuth 30/6–7). Satu orang dua jalur belum ada nash | — | 14 |
| K14-3 | lk vs pr dalam dzawil arham | 2:1 kecuali cabang perantara seibu | sama rata bila ayah dan ibunya sama, kecuali khal (2/3) dan khalah (1/3) ⚑ (Mughni 6/324 · shamela:8463/2646; catatan ⚑: pengecualian khal/khalah belum ada di sel semula) | 2:1 dihitung per tingkat ushul (qaul Muhammad, zhahir madzhab) | — | 14 |

## 18.3 Yang Belum Ada (per 2026-09-29, setelah pencarian Shamela)
| Titik | Madzhab | Dampak ke engine |
|---|---|---|
| Satu dzawil arham lewat dua jalur menurut qarabah | [HNF] | kecil — kasus dua jalur mode [HNF] = `TIDAK_DIDUKUNG`, sisanya jalan |
| Posisi baitul mal dalam urutan [HNF] | [HNF] | tidak ada — engine tidak mengirim harta ke baitul mal selama ada dzawil arham |
| Nash eksplisit "tidak ada khilaf" untuk munasakhat/'aul/tashih | semua | tidak ada — dianggap [KH] sama: bab munasakhat/tashih ada di keempat madzhab dengan cara hitung sama ('Iqd al-Jawahir, al-Wasith, al-Hawi, al-Hidayah Abu al-Khaththab), dan 'aul disepakati kecuali Ibnu 'Abbas |
| Contoh kitab gabungan haml + khuntsa + mafqud | semua | 13.0b tetap aturan susunan kita; tidak ditemukan di 8.598 kitab Shamela lokal |

Daftar pencarian lengkap dengan kata kunci Arab: [`docs/referensi-dicari.md`](../referensi-dicari.md).

Rujukan yang bisa menutup: [HNF] *as-Sirajiyyah* + syarahnya; [MLK] *Mukhtashar Khalil* + *Syarh ad-Dardir*; [HNB] *al-Mughni* / *Kasysyaf al-Qina'*.
