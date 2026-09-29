---
bab: 17
judul: Daftar Rujukan dan Metodologi Pengutipan
tags: [rujukan, referensi, takhrij, dalil, metodologi]
---

# 17. Daftar Rujukan dan Metodologi Pengutipan

## 17.1 Hierarki Dalil yang Dipakai
1. **Al-Qur'an** — kode [Q]. Ayat inti: An-Nisa' 11, 12, 176; Al-Anfal 75; Al-Ahzab 6.
2. **Hadits** — kode [H]. Ditulis dengan perawi dan nomor. Hadits yang lemah ditandai *dha'if* dan tidak dijadikan satu-satunya sandaran hukum.
3. **Atsar sahabat** — kode [A]. Terutama putusan 'Umar, 'Ali, Zaid bin Tsabit, Ibnu Mas'ud, Ibnu 'Abbas.
4. **Ijma'** — kode [IJ]. Hanya dipakai jika ada ulama yang **menukil** ijma' tersebut; penukilnya disebutkan.
5. **Pendapat madzhab** — kode [RDH] untuk nash Syafi'iyyah dari Raudhah ath-Thalibin. Tashil al-Fara'idh dan Al-Fara'idh al-Muyassar disebut dengan namanya, hanya sebagai pembanding.
6. **Kaidah hisab** — kode [KH]. Teknik matematika (KPK, FPB, konversi desimal). Ini bukan hukum syar'i dan tidak memerlukan dalil, tetapi hasilnya wajib sesuai hukum yang berdalil.

### Format token tautan rujukan
Kolom "Sumber" boleh menyertakan token berikut di samping teks manusiawi (judul kitab, juz/halaman cetak); satu baris boleh punya lebih dari satu token:
| Token | Contoh | URL |
|---|---|---|
| `shamela:<book_id>/<page_id>` | shamela:5423/5974 | `https://shamela.ws/book/<book_id>/<page_id>` |
| `hadits:<koleksi>:<nomor-standar>` | hadits:bukhari:6732 | `https://sunnah.com/<koleksi>:<nomor>` |
| `quran:<surah>:<ayat>` atau `quran:<surah>:<ayat>-<ayat>` | `quran:4:11`, `quran:4:11-12` | `https://quran.com/<surah>/<ayat>` (rentang: `.../<ayat>-<ayat>`) |
| `islamqa:<id>` | `islamqa:12345` | `https://islamqa.info/ar/answers/<id>` |

Koleksi hadits yang dikenal (slug sunnah.com): `bukhari, muslim, abudawud, tirmidhi, nasai, ibnmajah, ahmad, malik`. Nomor standar = penomoran Fu'ad 'Abdul Baqi (Bukhari/Muslim) atau penomoran umum (Sunan) sebagaimana bab 17.3 — **bukan** id internal MCP Hadith. Token IslamQA hanya pendukung, tidak pernah satu-satunya dasar (bab 00 konvensi 5). Token tidak dikenal atau salah format ditolak oleh `packages/content/src/refs.ts` (error saat tes), bukan diabaikan diam-diam.

## 17.2 Sumber Primer
| Kode | Judul | Penulis | Keterangan |
|---|---|---|---|
| [RDH] | *Raudhah ath-Thalibin wa 'Umdah al-Muftin* | Imam Yahya bin Syaraf an-Nawawi (w. 676 H) | Al-Maktab al-Islami, Beirut, cet. 3, 1412 H/1991 M, tahqiq Zuhair asy-Syawisy. Dipakai: **Kitab al-Fara'idh** (juz 6), bab 1–10. Kitab pokok madzhab Syafi'i dalam furu'. |
| TSH | *Tashil al-Fara'idh* | Syaikh Muhammad bin Shalih al-'Utsaimin (w. 1421 H) | Hanbali dengan tarjih mandiri. Pembanding saja, tidak dipakai sistem. |
| MYS | *Al-Fara'idh al-Muyassar* | 'Abdusy-Syakur Mu'allim 'Abd Farah | Syabakah al-Alukah, 2019. Menyertakan Matn ar-Rahbiyyah. Sumber struktur dan contoh; pendapatnya pembanding saja. |
| LHM | *Kitab al-Fara'idh* | Dr. 'Abdul Karim bin Muhammad al-Lahim | Dipakai untuk bab 12 (munasakhat), 13a–d (haml, mafqud, khuntsa, gharqa), 14 (dzawil arham). Penerbit dan edisi belum dicatat; nomor halaman mengikuti cetakan milik pemilik project. **Tarjih-nya condong Hanbali**; nukilannya atas madzhab lain berstatus `sekunder` di bab 18. |
| MBS | *Al-Mabsuth* | Syamsul A'immah as-Sarakhsi (w. 483 H) | Hanafi primer. Kitab al-Fara'idh juz 29–30 (Shamela 5423). Dipakai: qarabah dzawil arham, urutan ashabah, wala'. |
| MGN | *Al-Mughni* | Ibnu Qudamah (w. 620 H) | Hanbali primer; ed. Maktabah al-Qahirah (Shamela 8463). Dipakai: ijazah wasiat. |
| BHR | *Al-Bahr ar-Ra'iq Syarh Kanz ad-Daqa'iq* (juga *Takmilah ath-Thuri 'ala al-Bahr ar-Ra'iq*) | Ibnu Nujaim (w. 970 H) | Hanafi primer (Shamela 12227). Dipakai: haml. |
| IQD | *'Iqd al-Jawahir ats-Tsaminah* | Ibnu Syas (w. 616 H) | Maliki primer (Shamela 14594). Dipakai: wala'. |
| BMZ | *Bahr al-Madzhab* | ar-Ruyani (w. 502 H) | Syafi'i (Shamela 16934). Dipakai: ijazah wasiat. |
| ITH | *Al-'Urudh at-Taqdimiyyah li Muqarrar al-Fara'idh* | Syarikah Ithraa al-Mutun (Riyadh) | Slide kuliah berbasis *Hasyiyah ar-Rahbiyyah*. Dipakai sebagai nukilan posisi 4 madzhab (bab 18). Teks hasil ekstrak PDF rusak di beberapa tempat; angka tabelnya tidak dipakai. |
| IMN | *Al-Ijma'* | Ibnu al-Mundzir (w. 319 H) | Penukil ijma' fara'idh no. 277–324; ed. Fu'ad 'Abdul Mun'im (Shamela 12445). Nomor = nomor butir dalam kitab. |
| IQN | *Al-Iqna' fi Masa'il al-Ijma'* | Ibnu al-Qaththan (w. 628 H) | Penukil ijma' (Shamela 13624), ed. ash-Sha'idi. |
| BHQ | *As-Sunan al-Kubra* | al-Baihaqi (w. 458 H) | Atsar sahabat. Nomor mengikuti ed. 'Ilmiyyah (Shamela 7861) kecuali disebut ed. Turki (148486). |
| SSM | *Sunan Sa'id bin Manshur* | Sa'id bin Manshur (w. 227 H) | Atsar, ed. A'zhami (Shamela 13122). |
| MAR | *Al-Mushannaf* | 'Abdurrazzaq ash-Shan'ani (w. 211 H) | Atsar, ed. A'zhami (Shamela 13174). |
| MIS | *Al-Mushannaf* | Ibnu Abi Syaibah (w. 235 H) | Atsar, ed. al-Haut (Shamela 9944). |

## 17.3 Sumber Hadits
Penomoran mengikuti edisi standar yang lazim dipakai (Shahih al-Bukhari dan Shahih Muslim cetakan dengan penomoran Muhammad Fu'ad 'Abdul Baqi; Sunan at-Tirmidzi, Abu Dawud, Ibnu Majah penomoran umum). Nomor bisa berbeda antar cetakan; cocokkan dengan **lafaz**, bukan hanya nomor.

| Hadits | Takhrij | Status |
|---|---|---|
| «ألحقوا الفرائض بأهلها، فما بقي فلأولى رجل ذكر» | Al-Bukhari 6732; Muslim 1615 · hadits:bukhari:6732 hadits:muslim:1615 | Muttafaq 'alaih |
| «لا يرث المسلم الكافر، ولا الكافر المسلم» | Al-Bukhari 6764; Muslim 1614 · hadits:bukhari:6764 hadits:muslim:1614 | Muttafaq 'alaih |
| «للابنة النصف، ولابنة ابن السدس تكملة الثلثين...» | Al-Bukhari 6736 · hadits:bukhari:6736 | Shahih |
| «الثلث، والثلث كثير» | Al-Bukhari 2742; Muslim 1628 · hadits:bukhari:2742 hadits:muslim:1628 | Muttafaq 'alaih |
| «إنما الولاء لمن أعتق» | Al-Bukhari 2156; Muslim 1504 · hadits:bukhari:2156 hadits:muslim:1504 | Muttafaq 'alaih |
| «ابن أخت القوم منهم» | Al-Bukhari 3528; Muslim 1059 · hadits:bukhari:3528 hadits:muslim:1059 | Muttafaq 'alaih |
| «فلا وصية لوارث» | Abu Dawud 2870; at-Tirmidzi 2120; Ibnu Majah 2713 · hadits:abudawud:2870 hadits:tirmidhi:2120 hadits:ibnmajah:2713 | Hasan shahih (at-Tirmidzi) |
| Nenek diberi 1/6 (hadits Qabishah) | Abu Dawud 2894; at-Tirmidzi 2100; Ibnu Majah 2724 · hadits:abudawud:2894 hadits:tirmidhi:2100 hadits:ibnmajah:2724 | Diperselisihkan sanadnya; diamalkan ahli ilmu |
| «الخال وارث من لا وارث له» | Abu Dawud 2899; at-Tirmidzi 2103; Ibnu Majah 2737 · hadits:abudawud:2899 hadits:tirmidhi:2103 hadits:ibnmajah:2737 | Hasan (at-Tirmidzi); dilemahkan Ibnu Ma'in dan al-Baihaqi (dinukil Ibnu 'Utsaimin) |
| «القاتل لا يرث» | At-Tirmidzi 2109; Ibnu Majah 2645 · hadits:tirmidhi:2109 hadits:ibnmajah:2645 | Dibicarakan sanadnya; dikuatkan riwayat lain dan amal |
| «إذا استهل المولود ورث» | Abu Dawud 2920 · hadits:abudawud:2920 | Shahih menurut sebagian muhaddits |
| «قضى رسول الله ﷺ بالدين قبل الوصية» | At-Tirmidzi 2094; Ibnu Majah 2715 · hadits:tirmidhi:2094 hadits:ibnmajah:2715 | Sanad lemah; hukumnya tetap berdasar ijma' |
| «الولاء لحمة كلحمة النسب» | Ibnu Hibban 4950; al-Hakim 4/341 · shamela:148486/7081 (as-Sunan al-Kubra al-Baihaqi) | Marfu'-nya diperselisihkan; al-Baihaqi: yang benar mursal dari al-Hasan |
| «تعلموا الفرائض...» | Ibnu Majah 2719 · hadits:ibnmajah:2719 | Dha'if |
| «وأفرضهم زيد بن ثابت» | At-Tirmidzi 3790; Ibnu Majah 154 · hadits:tirmidhi:3790 hadits:ibnmajah:154 | Hasan gharib (at-Tirmidzi); shahih (Darussalam, sunnah.com) |

## 17.4 Titik yang Masih Ditandai `[perlu verifikasi lanjut]`
Titik-titik ini **tidak** mengubah hasil hitungan pada kasus umum, tetapi dasarnya belum dicek ke teks asli:
| Kode | Topik | Yang dibutuhkan |
|---|---|---|
| R13-14 | Hukum laqith (dua butir: «merdeka», «penemu tidak mewarisi») | Raudhah, Kitab al-Laqith |
| K05-2 [MLK] | Tidak ada fardh dalam wala' | Halaman 'Iqd al-Jawahir yang menyatakannya eksplisit |

## 17.5 Koreksi yang Terjadi Setelah Verifikasi ke Raudhah
Dicatat agar jejak audit transparan:
1. **Urutan hak tirkah (bab 01)**: hak yang terkait 'ain tirkah didahulukan atas biaya jenazah menurut [SYF], bukan sebaliknya.
2. **Sebab dan penghalang (bab 02)**: [SYF] menghitung 4 sebab (termasuk jihat al-Islam) dan 5 penghalang (termasuk istibham waqt al-maut dan daur).
3. **Talak ba'in di maradh al-maut (bab 02)**: qaul jadid [SYF] = tidak mewarisi. Versi sebelumnya keliru karena bersandar pada fatwa Dar al-Ifta yang mengikuti hukum positif Mesir.
4. **Urutan jihah ashabah (bab 05)**: [SYF] menempatkan kakek sejajar dengan saudara setelah ayah, bukan di jihah ubuwwah.
5. **Musyarrakah (bab 07)**: dihapus klaim tanpa dasar bahwa Syafi'i secara ushul tidak menyetujui tasyrik; diganti nash Raudhah.
6. **Wala' (bab 05)** dan **rasio 2:1 dzawil arham (bab 14)**: dikonfirmasi dari teks.
7. **Audit 2026-09-29 (Prompt 6.5)**, koreksi lafaz/nomor/token: lihat `docs/audit-verifikasi.md`.
8. **Koreksi isi sel overlay bab 18 (commit 5ca162f, dikonfirmasi pengguna 2026-09-29)**: K13-2 [HNF] kerabat ibu saja (bukan «ashabah ibu»); K09-1 dan K14-1 [MLK] bersyarat imam adil (bukan «mutlak»/«tidak»); K13b-1 [HNB] dua riwayat untuk yang umumnya selamat, [MLK] 70/80/90 th; K14-3 [HNB] pengecualian khal 2/3 dan khalah 1/3; bab 14.3 atribusi «غلط الشيخ أبو حامد» ke Ibnu Suraqah. Semuanya mengikuti isi kitab.
9. **Ijazah wasiat (konten, Prompt 6)**: menurut [SYF] (Bahr al-Madzhab, R01-7) persetujuan baru sah setelah wafat; mekanismenya tetap tidak dihitung engine.
