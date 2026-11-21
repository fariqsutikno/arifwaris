# Spec implementasi: revamp hero Hasil + tabel faraidh latihan

Status: **disetujui pemilik 2026-11-19**. Dokumen ini adalah **acuan wajib** untuk menerapkan dua mockup di bawah ke kode.
Riset dan alasan tiap keputusan: `riset-ux-hero-cta-mode-belajar-2026-11-19.md` (bagian 10) dan
`riset-ux-isian-jawaban-latihan-2026-11-19.md` (bagian 11 dan sesudahnya). Spec ini tidak mengulang alasannya, hanya **apa yang
dibangun**.

## 0. Aturan memakai dokumen ini

1. **Mockup adalah kebenaran visual dan perilaku.** Buka mockup di browser **sebelum** menulis kode, dan bandingkan hasil kode
   dengan mockup **berdampingan** sebelum menyatakan selesai (tangkapan layar laptop 1280 px dan HP 375 px).
   - A. Hero Hasil: [mockup-revamp-hero-hasil.html](mockup-revamp-hero-hasil.html), tab **"Usulan: kasus sendiri"** dan
     tab **"Sekarang"** (garis merah = yang dihapus). Tab "Usulan: soal latihan" dan "Usulan: pembahasan" di file itu **sudah
     diganti** oleh mockup B, kecuali tombol "Soal berikutnya" (bagian B8).
   - B. Tabel latihan: [mockup-tabel-faraidh-final.html](mockup-tabel-faraidh-final.html), semua tab.
2. **Teks di layar persis seperti di spec/mockup.** Jangan menulis ulang kalimat. Semua teks lewat `t('…')`; kunci baru ditambah
   dengan `pnpm diksi:tambah <file.json>` (CLAUDE.md prinsip 6). Bahasa Indonesia; istilah fikih sesuai glosarium bab 15.
3. **Fikih hanya dari KB.** Kunci jawaban tabel **diturunkan dari keluaran engine**, tidak diketik di konten soal dan tidak dihitung
   ulang di layar.
4. **Tidak menambah apa pun yang tidak ada di mockup** (kartu, tombol, animasi, ikon, warna). Bila sesuatu tidak tercakup spec maupun
   mockup, **berhenti dan tanya pemilik**, jangan mengarang.
5. Gaya visual mengikuti token yang sudah ada di `apps/web` (Logivo). Bila mockup memakai warna/ukuran yang tidak ada padanannya di
   token, pakai token terdekat dan catat di PR; jangan menambah token baru tanpa tanya.
6. Ikon SVG (bukan emoji). Aksi sekunder = tautan teks; tombol berbingkai hanya untuk aksi utama di form/dialog (CLAUDE.md).
7. Kerjakan berurutan sesuai bagian 4. Commit per tugas.

---

## A. Revamp hero layar Hasil (kasus sendiri)

### A1. Yang dihapus

| Elemen | Lokasi kode sekarang |
|---|---|
| Pil **"Ekspor"** di hero | `layar/Hasil.tsx` (`pil-hero`, `setEksporTerbuka`) |
| Sakelar **"Hitung kasus / Belajar"** | `layar/Hasil.tsx` (`tab-kecil`, `pilihHitungKasus`, `setKonfirmasiBelajar`) |
| Dialog **"Pindah ke mode Belajar?"** | `layar/Hasil.tsx` (`konfirmasiBelajar`) |
| Dialog tahan **"Pindah ke hitung kasus"** (`konfirmasiBuka === 'pindah'`) | `layar/Hasil.tsx`; varian `'lihat'` **tetap** (dipakai B6) |
| Chip **"1 mayit"** | `fakta-hero`; jumlah mayit hanya tampil bila lebih dari satu |
| Ubin hero **"Penerima N orang"** | `ubinHero(...)`; mengulang kalimat "dibagi ke N orang" |
| Aksi **"Coba tebak dulu"** di ubin Pelajari | `DaftarAksi` di `layar/Hasil.tsx` |
| Ubin **"Bagikan dan simpan"** | `UbinBagikan` (isinya pindah ke lembar Bagikan, A3) |
| Aksi **"Simpan, lanjut nanti"** | `aksiBagikan` (diganti simpan otomatis, A4) |
| Dialog Ekspor (`ModalEkspor.tsx`) | diganti lembar Bagikan; pintu ekspor di `PohonLayarPenuh` membuka lembar yang sama |

Kasus sendiri **tidak pernah** masuk mode tebak lagi. `tujuan: 'belajar'` hanya dipasang oleh `kerjakanSoal` (soal latihan).

### A2. Hero baru

Urutan dan teks (laptop: dua kolom seperti sekarang; HP: satu kolom):

- **Bilah atas**, kiri: tautan "Periksa" (ikon panah kiri) seperti sekarang. Kanan, berurutan:
  1. Status simpan (A4): ikon centang + `Tersimpan di riwayat · {jam.menit}`, atau `Tidak disimpan`.
  2. Status hasil (`Pasti` / `Ditahan`) seperti sekarang.
  3. Tautan **"Bagikan"** (ikon bagikan) → membuka lembar Bagikan (A3). Disembunyikan bila `hanyaBaca`.
- **Nama kasus** + tombol pensil (ubah nama), seperti sekarang. Nama awal dibuat otomatis (A4).
- `h1`: judul hero yang sekarang (`hero.judul`, mis. "Nah, ini pembagiannya").
- Kalimat: `Menurut madzhab {madzhab}, dibagi ke {n} orang.` (lokasi madzhab pindah dari bilah ke kalimat ini).
- Ubin kanan: ubin "Bagianmu" (bila ada `kasus.saya`) + ubin **"Harta dibagi"** lebar penuh. Tanpa ubin "Penerima".
- **Tidak ada tombol/pil apa pun di hero.**

### A3. Lembar Bagikan

Dialog (HP: lembar dari bawah; laptop: dialog tengah), menggantikan `ModalEkspor`.

- Judul `Bagikan hasil ini`, tautan `Tutup`. Esc dan ketuk latar menutup. Fokus pindah ke dialog saat dibuka, kembali ke tautan
  Bagikan saat ditutup.
- `Pratinjau pesan untuk grup keluarga` + kotak pratinjau berisi teks ringkasan (A3.1).
- Daftar aksi (ikon bulat + judul + keterangan), urutan tetap:
  | Judul | Keterangan | Perilaku |
  |---|---|---|
  | Kirim ke WhatsApp atau aplikasi lain | Teks di atas, siap ditempel | `navigator.share({ text })` bila ada; bila tidak, salin teks + toast "Teks disalin" (pakai pola `ui/Bagikan.tsx`) |
  | Salin teks | Untuk ditempel di mana saja | `navigator.clipboard.writeText` + toast "Teks disalin" |
  | Bagikan tautan | Keluarga membuka hasil yang sama, lengkap dengan alasannya | `DialogBagikan` yang sudah ada; hanya bila `bagikan && bolehUbah` (judul "Kelola" bila sudah dibagikan, seperti sekarang) |
  | Unduh file kasus | Untuk dibuka lagi di aplikasi ini | `unduhKasus(kasus)` |
- Garis pemisah, lalu tautan merah `Jangan simpan kasus ini` + keterangan
  `Untuk HP pinjaman atau sekadar coba-coba. Kasus dihapus dari riwayat; bisa diurungkan.` (perilaku A4).
- PDF dan PNG **tidak dirender** sampai benar-benar ada (bukan "Segera hadir").

#### A3.1 Teks ringkasan
Fungsi murni baru `susunTeksRingkasan(ringkasan, kasus, { sembunyiNominal }): string` di `hasil/ringkasanTeks.ts` (teks dari
templat diksi). Bentuk:

```
Pembagian waris {nama almarhum} (madzhab {madzhab})
Harta yang dibagi: {rupiah}

• {nama/peran}: {pecahan} = {rupiah}
• …

Alasan tiap bagian: buka tautan hasil. Mohon dicek ulang ke ustadz.
```
- Pecahan sesuai `pengaturan.bentuk` yang sedang dipakai. Urutan baris = urutan daftar "Siapa dapat berapa".
- `sembunyiNominal` → baris rupiah dihapus, baris orang hanya `• nama: pecahan`, dan baris harta diganti `Nominal disembunyikan`.
- Kasus ditahan/taqdir: tambah baris `Ditahan: {rupiah}` sesudah daftar penerima.
- Uji: snapshot teks untuk kasus biasa, nominal tersembunyi, dan ditahan.

### A4. Simpan otomatis

Model: **setiap kasus yang sampai di layar Hasil otomatis tersimpan** ke `tersimpan.ts` (yang disinkron ke akun).
`riwayat.ts` ("Terakhir dibuka") tidak diubah.

- Kapan: saat Hasil pertama dibuka dan setiap kali `kasus` berubah di Hasil (debounce 800 ms), lewat `simpanKasus(idSesi, kasus)`.
  Judul kosong → ringkasan otomatis dari `bersihkanJudul`/`ringkasKasus` yang sudah ada (mis. "Istri, Anak laki-laki, Anak
  perempuan"). Nama "Almarhum · istri, 2 anak" di mockup hanya ilustrasi: **jangan** membuat format judul baru.
- **Tidak** disimpan otomatis: `sumber.jenis === 'latihan'`, `hanyaBaca`, dan sesi yang ditandai "Jangan simpan".
- Status di bilah: `Tersimpan di riwayat · {jam.menit}` (jam dari `disimpanPada`, zona lokal). Saat simpan gagal (penyimpanan
  penuh/terblokir): `Tidak disimpan` tanpa ikon centang.
- "Jangan simpan kasus ini": `hapusTersimpan(idSesi)`, tandai sesi `janganSimpan = true` (state sesi, bukan disimpan), status bilah
  `Tidak disimpan`, toast `Kasus dihapus dari riwayat` + tautan `Urungkan` (4 detik). Urungkan → `simpanKasus` lagi dan cabut tanda.
- Tombol "Simpan, lanjut nanti" dan dialog nama-saat-simpan dihapus; ubah nama lewat pensil di hero (`ubahJudul`).
- Kasus menunggu kelahiran: perilaku lama (`simpanKasus` saat dibuka) tercakup oleh aturan umum ini; hapus efek khususnya.

### A5. Ubin Pelajari (kasus sendiri)
Judul `Pelajari cara menghitungnya`, sub `Untuk dicocokkan dengan ustadz, atau belajar`. Isi: `KartuLangkah` seperti sekarang, lalu
`DaftarAksi` berisi **hanya** "Bandingkan madzhab" (bila `bolehUbah`). "Langkah demi langkah" tetap lewat `KartuLangkah`.

### A6. Kriteria terima A
- [ ] Hero kasus sendiri tidak memuat tombol/pil, sakelar, chip "1 mayit", atau ubin "Penerima" (laptop dan HP).
- [ ] Tautan Bagikan membuka lembar dengan pratinjau teks yang benar; Kirim memakai menu bagikan perangkat (atau menyalin).
- [ ] Teks ringkasan mengikuti nominal tersembunyi.
- [ ] Hasil baru → muncul di Tersimpan tanpa menekan apa pun; status bilah menampilkan jamnya.
- [ ] Jangan simpan → hilang dari Tersimpan; Urungkan → kembali. Perubahan kasus sesudah "Jangan simpan" tidak menyimpan ulang.
- [ ] Soal latihan tidak masuk Tersimpan.
- [ ] Tidak ada lagi jalan dari kasus sendiri ke mode tebak.
- [ ] Uji `hasil.test.tsx` diperbarui: elemen yang dihapus tidak ada; lembar Bagikan; simpan otomatis; jangan simpan + urungkan.

---

## B. Tabel faraidh untuk soal latihan

Menggantikan `hasil/KartuTebak.tsx` dan `hasil/tebak.ts` (isian pecahan akhir). Hanya untuk `tujuan === 'belajar'`
(soal latihan). Cakupan jenis soal: biasa ('aul, radd, tashih), munasakhat, dzawil arham, mafqud, khuntsa, haml, gharqa.

### B1. Model data (fungsi murni, `hasil/tabelLatihan.ts`)

```ts
type JenisSel = 'pilih' | 'bulat';
interface KolomSoal {
  id: string;
  judul: string;                 // teks kepala kolom, mis. "Asal masalah", "Bagian · janin wafat", "Jami'ah · diberikan sekarang"
  jenis: JenisSel;
  pilihan?: string[];            // untuk 'pilih' (B2)
  kepala?: bigint;               // asal masalah/jami'ah kunci; diisi pelajar di kepala kolom
  terkunci?: boolean;            // kolom ditampilkan terisi, tidak dinilai (mas'alah 1 munasakhat)
  gabungDari?: string;           // id kolom pilihan acuan untuk menggabungkan sel kelompok (B4)
}
interface BarisSoal {
  id: IdOrang | 'pengali' | 'mauquf';
  nama: string;
  peran: 'orang' | 'pengali' | 'mauquf';
  kunci: Record<string, string>;      // id kolom → jawaban ('1/8', 'Ashabah', '24'); tidak ada = sel "–"
  kelompok?: Record<string, string>;  // id kolom → id kelompok engine, untuk sel bersama
}
interface TabelSoal { kolom: KolomSoal[]; baris: BarisSoal[]; pengaliHarusnya?: (...) => bigint; cara: string[] /* kunci diksi */ }

function susunTabelSoal(hasilEngine, kasus, ruleset): TabelSoal | { status: 'TIDAK_DIDUKUNG' }
function nilaiTabel(tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar): HasilNilai
function pilihJangkar(tabel: TabelSoal, acak: () => number): Jangkar   // acak disuntikkan (uji deterministik)
```

- **Semua kunci dari engine.** Pemetaan untuk soal biasa dari `TabelMasalah`:
  - Kolom **Bagian** ← `baris.fardh` (pecahan) dan/atau `baris.ashabah`: fardh saja → `'1/8'`; ashabah saja → `'Ashabah'`;
    keduanya → `'1/6 + Ashabah'`; orang di `dikecualikan` karena hajb → `'Terhalang'`.
  - Kolom **Asal masalah** ← kepala `totalKolom.ashl`; sel = `baris.sel.ashl` per **kelompok** (sel bersama bila anggota > 1).
  - Kolom **Asal masalah akhir** ← kepala = kolom terakhir yang ada dari `tashih`/`aul`/`radd` (bila tidak ada, sama dengan `ashl`);
    sel = `perOrang[id].saham`. Kolom ini **selalu ada**, walau sama dengan asal masalah (supaya tidak membocorkan ada/tidaknya tashih).
- Kunci kasus khusus: dari keluaran orkestrator yang sesuai (B7). Bila data yang dibutuhkan belum ada di keluaran engine, **tambahkan
  ke engine** (bagian 3), jangan dihitung di web.
- Soal yang `susunTabelSoal` tidak dukung (laqith R13-14, `PERLU_INPUT`, blocked, kombinasi di luar B7) tidak masuk bank soal latihan
  tabel; layar menampilkan `TIDAK_DIDUKUNG` biasa.

### B2. Jenis sel dan aturan isian

| Sel | Jenis | Aturan |
|---|---|---|
| Bagian / Didudukkan sebagai / Bagian · {kemungkinan} | `<select>` daftar tertutup | Bagian: `1/2, 1/4, 1/8, 2/3, 1/3, 1/6, Ashabah, 1/6 + Ashabah, Terhalang`. Didudukkan sebagai: daftar perantara yang mungkin untuk soal itu (dari engine tanzil). Opsi kosong pertama `–`. |
| Saham, asal masalah (kepala kolom), jami'ah, pengali, mauquf | `<input inputmode="numeric" pattern="[0-9]*">` | **Hanya bilangan bulat**: setiap ketikan yang menghasilkan isi selain `^\d{0,6}$` **ditolak utuh** (isi kembali ke nilai terakhir yang sah) dan memunculkan keterangan `Kotak ini hanya menerima bilangan bulat. Pecahan dipilih di kolom Bagian.` (kuning, di bawah tabel, `role="status"`). Angka Arab-Hindi diubah ke Latin (`angkaLatin`). Tanpa placeholder. |
| Sel tidak dipakai | teks `–` | tidak bisa diisi, tidak dinilai |
| Sel terisi (jangkar, B5) | teks angka, latar abu muda | tidak bisa diisi; **tanpa label** "sudah terisi" (`title` boleh) |
| Saham orang yang dipilih Terhalang | teks `0` | otomatis, dihitung 0, tidak bisa diisi. Acuannya kolom pilihan **terdekat di kiri** |

**Semua asal masalah diketik** (tidak ada daftar usul).

### B3. Tata letak tabel
- Satu `<table>`; kolom pertama "Ahli waris" **lengket** (`position: sticky; left: 0`). Tabel dalam wadah `overflow-x: auto`;
  halaman sendiri tidak boleh tergeser ke samping di HP 375 px.
- Baris kepala 1: judul kolom (abu, kecil) + kotak asal masalah/jami'ah di bawahnya bila kolom punya `kepala`.
- **Baris Pengali ada di kepala tabel**, tepat di bawah baris kepala 1 (seperti juz'us sahm di kitab, ditulis di atas mas'alah).
  Nama barisnya miring: `Pengali`.
- Baris badan: tiap orang, lalu baris `Ditahan (mauquf)` (miring, latar abu) bila ada.
- Urutan kolom kiri→kanan = urutan hitung. Untuk taqdir: pasangan `Bagian · {kemungkinan}` lalu `{kemungkinan}` untuk tiap
  kemungkinan, lalu `Jami'ah · diberikan sekarang`.
- Sel keliru: latar merah muda. Kotak "Cara mengisi" di kanan (laptop) / di bawah (HP).
- Tidak ada teks "Angka kunci: KB …" di layar.

### B4. Sel bersama (gabung)
- Berlaku pada kolom yang punya `gabungDari` (kolom saham **sebelum** saham per orang, yaitu kolom asal masalah; dan pada haml [SYF]
  kolom kemungkinan "laki-laki" dan "perempuan berbilang").
- Sel bergabung (`rowspan`) **langsung saat pelajar memilih**, tanpa menunggu Periksa, bila baris berurutan dipilih dengan bagian yang
  membentuk satu kelompok: sama-sama `Ashabah`/`1/6 + Ashabah`, atau bagian tetap yang sama untuk ahli waris berjenis sama
  (mis. dua istri 1/8). Pilihan lain → sel tetap terpisah.
- **Tidak terlihat dari awal**: sebelum dipilih, semua sel terpisah.
- Saat sel baru bergabung: sorotan latar mint memudar 1,2 detik (`prefers-reduced-motion` → tanpa animasi). Di bawah kotak tertulis
  `bersama` (kecil, abu).
- Kunci sel bersama = `sel.ashl` kelompok engine; dinilai sekali (baris pertama kelompok).

### B5. Satu sel terisi (jangkar)
- Satu sel per soal, **dipilih acak** saat soal dibuka (tetap sama sampai soal ditutup; "Kosongkan" tidak mengacak ulang).
- Calon: sel **saham** (kolom `bulat`) yang punya kunci. **Bukan**: kolom pilihan, kepala kolom (asal masalah/jami'ah), baris
  pengali, sel berkunci `0`, sel bersama, kolom terkunci.
- Sel jangkar di sebuah kolom **menetapkan skala kolom itu**: asal masalah kolom tersebut harus persis sama dengan kunci.

### B6. Aksi dan penilaian
Di bawah tabel: tombol **Periksa**, tautan **Kosongkan**, tautan merah **Lihat jawaban** (ikon mata).

**Periksa** (semua kolom terbuka; tidak ada mode kolom-demi-kolom):
1. Periksa kolom berurutan kiri→kanan, lewati kolom terkunci. Berhenti di kolom pertama yang bermasalah.
2. Kolom belum lengkap (sel atau kepala kosong) → umpan kuning `Kolom "{judul}" belum lengkap.`, tandai sel kosong.
3. Kolom pilihan: tiap sel harus sama dengan kunci.
4. Kolom bulat dengan kepala `H` (kunci) dan isian kepala `h`: **sebanding** diterima. Sel benar bila `isi × H = kunci × h`;
   kepala salah bila `h` bukan kelipatan `H`, atau bila ada jangkar di kolom itu dan `h ≠ H`.
5. Ada yang salah → umpan merah `Mulai salah di kolom "{judul}". Kolom sesudahnya belum diperiksa.`, tandai sel/kepala yang salah.
6. Baris **Pengali** diperiksa paling akhir; nilainya diturunkan dari kepala yang **diisi pelajar** (`pengaliHarusnya`), supaya
   kelipatan tetap konsisten. Kosong → `Baris Pengali belum lengkap.`; salah → `Baris Pengali belum tepat.`
7. Semua benar → umpan hijau `Benar semua.`; bila ada kolom yang memakai kelipatan:
   `Benar semua. Bentuk terkecil: {judul} {h} (terkecilnya {H}), …`. Lalu jalankan `saatBenar()` (XP, confetti) seperti sekarang.
8. Setiap Periksa yang lolos langkah 2 memanggil `saatMencoba()` seperti sekarang.

**Kosongkan**: hapus semua isian, umpan, tanda salah, dan keadaan terbuka. Jangkar tetap.

**Lihat jawaban**: dialog tahan yang sudah ada (`konfirmasiBuka === 'lihat'`, termasuk poin XP). Sesudah dibuka: semua sel dan kepala
menampilkan kunci (bentuk terkecil), isian pelajar yang berbeda **dicoret** di depan kunci, tombol Periksa hilang, umpan abu
`Jawaban dibuka. Isianmu yang berbeda dicoret. Soal ini tidak memberi XP.`

### B7. Kolom per jenis soal

Contoh angka = kunci uji (dari KB), dipakai juga sebagai fixture tes `tabelLatihan.test.ts`.

| Jenis | Kolom (kiri→kanan) | Baris tambahan | Contoh kunci |
|---|---|---|---|
| Biasa | Bagian · Asal masalah (`gabungDari: bagian`) · Asal masalah akhir | – | 16.1: 8 → 24; istri 1/8: 1 → 3; anak lk + pr Ashabah: 7 bersama → 14, 7 |
| Munasakhat | Mas'alah 1 (terkunci, dari soal sebelumnya) · Bagian · {mayit 2} · Mas'alah 2 · … · Jami'ah | Pengali (per mas'alah) | 12.6 contoh 2: 24; ibu 1/3, saudara Ashabah; 3: 1, 2; pengali 3, 7; jami'ah 72: 16, 56 |
| Dzawil arham (tanzil, [SYF]) | Didudukkan sebagai · Bagian perantara · Asal masalah | – | 14.6 baris 1: saudara kandung Ashabah 5, saudara seibu 1/6 1, saudara sebapak Terhalang 0; asal masalah 6 |
| Mafqud | per kemungkinan (ia hidup, ia wafat): Bagian · saham; lalu Jami'ah · diberikan sekarang | Pengali, Ditahan (mauquf) | 13b.6 F1: hidup 12 (ibu 1/6 2, saudara 5, hilang 5), wafat 3 (ibu 1/3 1, saudara 2); pengali 1, 4; jami'ah 12: 2, 5; mauquf 5 |
| Khuntsa | sama dengan mafqud, kemungkinan "ia laki-laki" / "ia perempuan" | Pengali, Ditahan (mauquf) | dari 13c.4 |
| Haml [SYF] | empat kemungkinan: janin wafat · laki-laki · 1 perempuan · perempuan berbilang (Bagian · saham tiap kemungkinan; `gabungDari` pada laki-laki dan perempuan berbilang) · Jami'ah | Pengali, Ditahan (mauquf) | 13a.7 H1 [SYF]: 3 (1, 2) · 6 (1, 5 bersama) · 18 (3, 10, 5) · 6 (1, 5 bersama); pengali 6, 3, 1, 3; jami'ah 18: ibu 3, saudara 0; mauquf 15 |
| Haml [HNB] | enam kemungkinan: janin wafat · 1 lk · 1 pr · 2 lk · 2 pr · lk + pr · Jami'ah | Pengali, Ditahan (mauquf) | 13a.7 H1: 3, 12, 18, 18, 24, 6; pengali 24, 6, 4, 4, 3, 12; jami'ah 72: ibu 12, saudara 20; mauquf 40 |
| Gharqa | langkah keputusan: pilihan `Yang terakhir mewarisi` / `Tidak saling mewarisi` / `Ditahan sampai jelas`, lalu satu tabel biasa per harta (bila tidak saling mewarisi) atau tanpa angka (bila ditahan) | – | 13d.2: tidak diketahui sama sekali → Tidak saling mewarisi |

Batas soal latihan: munasakhat ≤ 3 mayit, mafqud/khuntsa ≤ 1 orang, haml satu janin-kandungan. Soal haml [SYF] dipilih yang bagian
tetapnya sama di semua kemungkinan lahir hidup yang digabung (lihat KB 13a.5).

### B8. Hero soal latihan
- Bilah: tautan `Latihan` (panah kiri, kembali ke daftar soal) · kanan `Soal {i} dari {n} · {bab}` (bab + madzhab bila bukan Syafi'i).
- `h1`: `Isi tabel pembagiannya` (gharqa: `Putuskan dulu, lalu isi tabel tiap harta`). Kalimat: teks soal.
- Tanpa sakelar, tanpa tombol. Sesudah "Benar semua." atau jawaban dibuka: tombol utama **"Soal berikutnya"** (ikon panah kanan) di
  bawah umpan (acuan: tab "Usulan: pembahasan" di mockup A).

### B9. Cara mengisi (kotak kanan)
Judul `Cara mengisi`, daftar bernomor, kalimat pendek, **kata kunci tebal**. Teks persis seperti mockup B per jenis soal, ditambah
butir umum `Asal masalah **boleh bukan yang terkecil**, asal sahamnya sebanding.` Tidak berisi petunjuk jawaban.

### B10. Kriteria terima B
- [ ] Setiap tab di mockup B bisa dibangun dari data engine untuk soal yang sama, dan tampil identik (bandingkan berdampingan).
- [ ] Kunci tiap soal bank latihan dihasilkan `susunTabelSoal` dari engine; tidak ada kunci yang diketik di konten soal.
- [ ] Mengetik `/`, `,`, `½`, `1/8` di kotak angka tidak mengubah isinya dan memunculkan keterangan; `٢٤` menjadi `24`.
- [ ] Sel bersama muncul saat Ashabah dipilih untuk baris kelompok, tidak sebelumnya; tidak muncul bila pilihannya berbeda.
- [ ] Terhalang → saham 0 otomatis.
- [ ] Jangkar acak tidak pernah di kolom pilihan atau kepala kolom; diuji 100 kali dengan `acak` tersuntik.
- [ ] Penilaian: kunci = benar; kelipatan sebanding = benar + keterangan bentuk terkecil; salah berhenti di kolom pertama; pengali
      dihitung dari kepala pelajar.
- [ ] Lihat jawaban lewat dialog tahan; sesudahnya kunci tampil dan isian berbeda dicoret; XP tidak diberikan.
- [ ] HP 375 px: tabel bergeser di wadahnya, kolom nama tetap terlihat, halaman tidak bergeser.
- [ ] Uji unit `tabelLatihan.test.ts`: `susunTabelSoal` untuk tiap baris tabel B7, `nilaiTabel` untuk tiap aturan B6, `pilihJangkar`.
- [ ] Uji komponen: alur isi → Periksa → benar; salah; Lihat jawaban; Kosongkan.

---

## 3. Prasyarat engine

| Kode | Perubahan | Alasan |
|---|---|---|
| E1 | Taqdir haml [SYF] = empat kemungkinan | **Selesai** (commit 302f898, R13-20) |
| E2 | Untuk [SYF], pada kemungkinan "laki-laki" dan "perempuan berbilang", kelompok ashabah yang memuat haml **tidak ditashih per kepala**: mas'alah berhenti di asal masalah dan saham kelompok ditulis bersama. Sekarang engine menghitung dengan 1 lk / 2 pr konkret (mas'alah 12 dan 24, jami'ah 72), padahal tabel B7 menuntut 6 dan 6 (jami'ah 18). Hasil "diberikan sekarang" tidak berubah | KB 13a.5 catatan koreksi; tabel B7 haml [SYF] |
| E3 | `DuniaTaqdir` membawa tabel per kemungkinan (fardh/ashabah per orang, kelompok, saham sebelum dikali pengali), bukan hanya `saham` di skala jami'ah | kolom "Bagian · {kemungkinan}" dan sel bersama di B7 |
| E4 | Keluaran munasakhat membawa, per mas'alah: tabel (bagian, saham), pengali, dan jami'ah | kolom munasakhat B7 |
| E5 | Keluaran dzawil arham (tanzil) membawa perantara tiap kerabat ("didudukkan sebagai") dan tabel perantara | kolom dzawil arham B7 |

Tiap perubahan engine: anotasi rujukan `[Rxx-y]`, uji di `packages/engine`, dan uji regresi bab 16 tetap lulus.

## 4. Urutan kerja
1. **A** (tidak bergantung engine): A1 → A2 → A3 (+A3.1) → A4 → A5 → uji A6. Commit per butir.
2. **E2–E5** di engine, masing-masing dengan ujinya.
3. **B1** `tabelLatihan.ts` + uji (biasa dulu, lalu jenis lain sesuai E yang sudah selesai).
4. **B2–B6, B9** komponen tabel untuk soal biasa → bandingkan dengan tab "Soal biasa" mockup B.
5. Tambah jenis soal satu per satu (munasakhat, dzawil arham, mafqud/khuntsa, haml [SYF], haml [HNB], gharqa), tiap kali bandingkan
   dengan tab mockup-nya.
6. **B8** hero latihan + "Soal berikutnya". Hapus `KartuTebak.tsx`, `tebak.ts`, dan `__tests__/tebak.test.ts` setelah semua
   soal pindah.
7. Verifikasi akhir: tangkapan layar laptop + HP tiap tab, berdampingan dengan mockup; seluruh uji `packages/engine` dan `apps/web`.

## 5. Jangan
- Menambah kartu, tombol, warna, ikon, animasi, atau teks yang tidak ada di mockup/spec.
- Menghitung kunci di web atau mengetiknya di konten soal.
- Menampilkan "Segera hadir", "sudah terisi", "Angka kunci", atau kode rujukan di layar.
- Memakai `number` di jalur hitung kunci (pakai `bigint`, CLAUDE.md prinsip 2).
- Mengembalikan mode kolom-demi-kolom, daftar usul, atau sakelar Belajar.
- Menganggap pekerjaan selesai tanpa perbandingan berdampingan dengan mockup.

## 6. Pertanyaan terbuka (tanya pemilik bila sampai di sini)
- XP untuk soal tabel: sama dengan sekarang, atau berbeda menurut jenis soal?
- Teks ringkasan untuk munasakhat panjang (banyak penerima): dipotong atau penuh?
- Khuntsa: angka contoh dari 13c.4 belum dimasukkan ke mockup; tampilan mengikuti tab Mafqud.
