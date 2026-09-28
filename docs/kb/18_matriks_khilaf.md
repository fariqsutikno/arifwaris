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
- UI wajib menampilkan sel (s) sebagai "menurut nukilan <kitab>".

## 18.2 Matriks

### Syarat, mawani', hak tirkah
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K01-1 | Ijazah wasiat > 1/3 | hanya setelah wafat `[perlu verifikasi]` | ? | ? | sah juga saat maradh al-maut (s) | 01 |
| K02-1 | Pembunuhan yang menghalangi | semua bentuk | tanpa hak yang mewajibkan qishash/diyat/kafarat (s) | ? | hanya 'amd zalim; khatha' tidak menghalangi dari harta (s) | 02 |
| K02-2 | Beda millah antar kafir | satu millah | beda millah menghalangi (s) | satu millah (s) | beda millah menghalangi (s) | 02 (tidak relevan platform) |
| K02-3 | Istri ditalak ba'in saat maradh al-maut | tidak mewarisi · opsi: qaul qadim mewarisi | mewarisi selama belum menikah lagi (s) | ? | mewarisi walau sudah menikah lagi (s) | 02 |
| K13-1 | Harta murtad | fai' baitul mal | fai' (s) | harta semasa Islam untuk ahli waris muslim (s) | fai' (s) | 13 |
| K13-2 | Ashabah anak li'an/zina | tidak ada; radd ke ibu/saudara seibu | ashabah ibu (satu riwayat) (s) | ashabah ibu (s) | tidak ada (s) | 13 |

### Ahli waris dan furudh
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K03-1 | Nenek lewat ayah di atas kakek (umm abil jadd) | ahli waris | hanya 3 nenek; ini dzawil arham (s) | ahli waris (s) | ? | 03 |
| K04-1 | Nenek dekat pihak ayah vs nenek jauh pihak ibu | tidak menghijab (yang dekat pihak ibu menghijab) | dekat menghijab mutlak (s) | dekat menghijab mutlak (s) | = [SYF] (s) | 04 |
| K04-2 | Ummul ab bersama ayah | terhijab | tidak terhijab (satu riwayat) (s) | terhijab (s) | terhijab (s) | 04 |
| K07-1 | Musyarrakah | tasyrik | tanpa tasyrik (s) | tanpa tasyrik (s) | tasyrik (s) | 07 |

### Ashabah, jadd, radd
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K05-1 | Urutan jihah; kakek vs saudara | kakek sejajar saudara | = [SYF] (riwayat masyhur) (s) | kakek = ayah, menghijab saudara (s) | = [SYF] (s) | 05, 08 |
| K05-2 | Furudh dalam wala' | tidak ada | ayah mu'tiq 1/6 bersama anak lk mu'tiq (s) | ? | ? | 05 |
| K08-1 | Rincian muqasamah/akdariyyah | madzhab Zaid (bab 08) | = [SYF] (s) | tidak berlaku (K05-1) | = [SYF] (s) | 08 |
| K09-1 | Sisa harta tanpa ashabah | radd bila baitul mal tidak tegak · opsi: `kebijakanSisa` | radd mutlak, kecuali pasangan (s) | radd mutlak, kecuali pasangan (s) | baitul mal (s) | 09 |

### Kasus khusus
| Kode | Titik | [SYF] | [HNB] | [HNF] | [MLK] | Bab |
|---|---|---|---|---|---|---|
| K13a-1 | Batas maksimal kehamilan | input hakim | 4 th (s) | 2 th (s) | 4–5 th (s) | 13a |
| K13a-2 | Dibagi sebelum haml lahir | boleh | boleh (s) | boleh (s) | tidak (s) | 13a |
| K13a-3 | Yang ditahan untuk haml | jumlah tak dibatasi; mitra ashabah haml 0 `[perlu verifikasi]` | terbesar dari 2 lk/2 pr; mitra diberi aqall (s) | 1 anak + kafil (s) | — | 13a |
| K13b-1 | Masa tunggu mafqud | ijtihad hakim | 4 th (binasa) / 90 th dari lahir (selamat) (s) | ijtihad hakim (zhahir) (s) | 70/75/80 th dari lahir (s) | 13b |
| K13b-2 | Ahli waris hadir bersama mafqud | al-aswa' (aqall) | al-aswa' (s) | al-aswa' (s) | al-aswa' (s) | 13b |
| K13c-1 | Khuntsa musykil | aqall semua + mauquf sampai jelas/ishtilah | diharapkan jelas: aqall+mauquf; tidak: setengah-setengah (s) | khuntsa paling rugi, tanpa mauquf (s) | setengah-setengah (s) | 13c |
| K13d-1 | Gharqa keadaan 3–5 | tidak saling mewarisi; keadaan 3 ditahan | saling mewarisi dari tilad (s) | tidak saling mewarisi (s) | tidak saling mewarisi (s) | 13d |
| K14-1 | Dzawil arham mewarisi | bila baitul mal tidak tegak | ya (s) | ya (s) | tidak, ke baitul mal (s) | 14 |
| K14-2 | Metode dzawil arham | tanzil | tanzil (s) | qarabah (s) — rincian belum cukup → `TIDAK_DIDUKUNG` | — | 14 |
| K14-3 | lk vs pr dalam dzawil arham | 2:1 kecuali cabang perantara seibu | sama rata (s) | 2:1 (s) | — | 14 |

## 18.3 Yang Belum Dikaji
Sel `?` di atas, ditambah: rincian 'aul/tashih yang berbeda antar-madzhab (diduga tidak ada — [KH] sama), rincian urutan ashabah [HNF] di luar kakek, seluruh rincian qarabah [HNF], munasakhat (tata kerja [KH] sama; perbedaan hanya lewat titik-titik di atas pada tiap mas'alah).

Rujukan primer yang dibutuhkan untuk mengubah (s) menjadi primer: [HNB] *al-Mughni* / *Kasysyaf al-Qina'*; [HNF] *as-Sirajiyyah* + syarahnya; [MLK] *Mukhtashar Khalil* + *Syarh ad-Dardir*.
