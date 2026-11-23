// Catatan pembanding "kalau menurut KHI" (hukum positif, bukan fikih). Konten untuk dibaca pengguna, bukan hasil hitung:
// tidak ada angka bagian untuk kasus tertentu; hanya bunyi ketentuan, praktik Pengadilan Agama, padanan fikih, dan jalan keluar.
// Sumber isi: docs/kb-khi/10–13 dan 20; kode sumber (S01, F01, …): docs/kb-khi/02_daftar_sumber.md.
// Tahap berikutnya: pilihCatatanKhi (engine) memilih catatan yang relevan; narasi akhir lewat diksi (explain).

export type Madzhab = 'syafii' | 'hanbali' | 'hanafi' | 'maliki';

export const ID_CATATAN_KHI = [
  'pengganti', 'wasiatWajibah', 'hartaBersama', 'penghalang', 'saudaraSeibu', 'kerabatJauh',
  'anakLuarKawin', 'wasiatAhliWaris', 'hibahOrtuAnak', 'ayah', 'saudariKandungSeayah',
] as const;
export type IdCatatanKhi = (typeof ID_CATATAN_KHI)[number];

export type JalanKeluar = 'wasiatSukarela' | 'perdamaian' | 'hibahSerahTerima' | 'kesepakatanTertulis' | 'persetujuanSetelahWafat';

/** Jalan keluar fikih yang sudah terverifikasi di KB; tidak boleh ditambah dari pengetahuan umum. Kalimatnya ada di diksi narasi.khi.jalan.* (explain). */
export const JALAN_KELUAR: Record<JalanKeluar, { rujukanKb: readonly string[]; terverifikasi: true }> = {
  wasiatSukarela: { rujukanKb: ['R01-4', 'R01-5'], terverifikasi: true },
  perdamaian: { rujukanKb: ['R11-2', 'R11-3'], terverifikasi: true },
  hibahSerahTerima: { rujukanKb: ['R01-10', 'R01-11'], terverifikasi: true },
  kesepakatanTertulis: { rujukanKb: ['R19-5'], terverifikasi: true },
  persetujuanSetelahWafat: { rujukanKb: ['R01-7', 'K01-1'], terverifikasi: true },
};

export interface SumberKhi {
  /** Kode di docs/kb-khi/02_daftar_sumber.md (S = hukum positif atau praktik PA, F = fikih, H = ulasan). */
  kode: string;
  lokasi: string;
}

export interface ButirPraktikPa {
  teks: string;
  /** pegangan = dipakai sebagai acuan; catatan = ditampilkan tetapi tidak dijadikan acuan. */
  peran: 'pegangan' | 'catatan';
}

export interface CatatanKhi {
  id: IdCatatanKhi;
  judul: string;
  /** Nomor pasal untuk ditampilkan ("Pasal 185 KHI"); nomor pasal boleh tampil, kode internal tidak. */
  pasal: string;
  hukumPositif: true;
  /** beda = berbeda dari fikih; sama = selaras; celah = KHI diam; */
  tingkat: 'beda' | 'sama' | 'celah';
  bunyiKhi: readonly string[];
  praktikPa: readonly ButirPraktikPa[];
  /** Padanan fikih menurut madzhab; madzhab tanpa isi jatuh ke Syafi'i dengan keterangan (diatur di narasi). */
  fikih: { syafii: readonly string[]; hanbali?: readonly string[]; hanafi?: readonly string[]; maliki?: readonly string[] };
  /** Kode KB yang mendasari kolom fikih (untuk tautan "Lihat dasar fikihnya"; tidak ditampilkan sebagai kode). */
  rujukanFikih: readonly string[];
  padananFikih: 'ada' | 'sebagian';
  /** Bagian yang padanan fikihnya belum tersedia di KB; wajib terisi bila padanan sebagian. */
  belumTersedia: readonly string[];
  jalanKeluar: readonly JalanKeluar[];
  peringatan?: string;
  sumber: readonly SumberKhi[];
}

export const CATATAN_KHI: readonly CatatanKhi[] = [
  {
    id: 'pengganti', judul: 'Cucu menggantikan orang tuanya', pasal: '185', hukumPositif: true, tingkat: 'beda',
    bunyiKhi: [
      'Ahli waris yang meninggal lebih dahulu dari pewaris dapat digantikan oleh anaknya, kecuali yang terhalang karena putusan hakim.',
      'Bagian ahli waris pengganti tidak boleh melebihi bagian ahli waris yang sederajat dengan yang diganti.',
    ],
    praktikPa: [
      { peran: 'pegangan', teks: 'Menurut rumusan kamar Mahkamah Agung (hasil Rakernas 2010), penggantian hanya sampai derajat cucu; anak perempuan dari saudara kandung diberi wasiat wajibah.' },
      { peran: 'pegangan', teks: 'Putusan Mahkamah Agung (yurisprudensi 2018) menerima cucu laki-laki dan perempuan, dari anak laki-laki maupun perempuan, sebagai ahli waris pengganti.' },
      { peran: 'catatan', teks: 'Pedoman Buku II (2010) memuat cakupan yang lebih luas (keturunan saudara, kakek-nenek, paman-bibi); tidak dijadikan acuan karena bertentangan dengan rumusan kamar yang lebih baru.' },
    ],
    fikih: {
      syafii: ['Cucu dari anak laki-laki terhalang oleh anak laki-laki.', 'Cucu dari anak perempuan termasuk dzawil arham; mewarisi bila tidak ada ahli waris lain yang berhak, dengan metode tanzil.', 'Fikih tidak mengenal ahli waris pengganti.'],
      hanbali: ['Cucu dari anak laki-laki terhalang oleh anak laki-laki.', 'Cucu dari anak perempuan termasuk dzawil arham yang mewarisi, dengan metode tanzil.'],
      hanafi: ['Cucu dari anak laki-laki terhalang oleh anak laki-laki.', 'Cucu dari anak perempuan termasuk dzawil arham yang mewarisi, dengan metode qarabah.'],
      maliki: ['Cucu dari anak laki-laki terhalang oleh anak laki-laki.', 'Cucu dari anak perempuan (dzawil arham) tidak mewarisi bila baitul mal diurus imam yang adil.'],
    },
    rujukanFikih: ['R06-3', 'R04-12', 'K14-1', 'K14-2', 'R01-4', 'R01-5'],
    padananFikih: 'sebagian', belumTersedia: ['konsep ahli waris pengganti dalam fikih (tidak ada; yang ada hanya jalan keluar wasiat dan perdamaian)'],
    jalanKeluar: ['wasiatSukarela', 'perdamaian', 'hibahSerahTerima'],
    peringatan: 'Pembagian antara pengganti dan ahli waris lain ditentukan hakim menurut kasus; di sini tidak dihitung.',
    sumber: [
      { kode: 'S01', lokasi: 'Pasal 185 dan Pasal 173' }, { kode: 'S06', lokasi: 'Yurisprudensi 2/Yur/Ag/2018' },
      { kode: 'S07', lokasi: 'Rumusan Kamar SEMA 3/2015 butir 9 (teks tempel)' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 163–168' },
    ],
  },
  {
    id: 'wasiatWajibah', judul: 'Wasiat wajibah', pasal: '209', hukumPositif: true, tingkat: 'beda',
    bunyiKhi: [
      'Anak angkat yang tidak menerima wasiat diberi wasiat wajibah paling banyak sepertiga dari harta warisan orang tua angkatnya.',
      'Orang tua angkat yang tidak menerima wasiat diberi wasiat wajibah paling banyak sepertiga (pasal menulis "harta wasiat anak angkatnya").',
      'Wasiat biasa paling banyak sepertiga dari harta warisan kecuali semua ahli waris menyetujui.',
    ],
    praktikPa: [
      { peran: 'pegangan', teks: 'Praktik Pengadilan Agama memperluas wasiat wajibah kepada ahli waris non-muslim (termasuk istri atau suami), anak tiri yang dipelihara sejak kecil, anak dari pernikahan agama yang tidak dicatat, dan anak perempuan dari saudara kandung bila pewaris tidak punya anak.' },
      { peran: 'pegangan', teks: 'Besarnya bervariasi menurut putusan hakim: pedoman Mahkamah Agung menyebut paling banyak sepertiga dan tidak melebihi bagian ahli waris yang sederajat; ada putusan yang menyamakannya dengan bagian anak muslim.' },
      { peran: 'catatan', teks: 'Wasiat wajibah ditetapkan hakim (dapat diberikan secara jabatan); bukan hak yang pasti.' },
    ],
    fikih: {
      syafii: ['Tidak ada wasiat yang wajib bagi kerabat atau anak angkat; yang ada wasiat sukarela paling banyak sepertiga untuk yang bukan ahli waris.', 'Wasiat kepada ahli waris tidak berlaku tanpa persetujuan ahli waris lain sesudah pewaris wafat.', 'Beda agama menghalangi waris.'],
    },
    rujukanFikih: ['R01-4', 'R01-5', 'K01-1', 'R02-4', 'R11-2', 'R11-3'],
    padananFikih: 'sebagian',
    belumTersedia: ['kedudukan anak angkat dalam fikih', 'kebolehan berwasiat kepada non-muslim', 'kedudukan anak tiri', 'anak dari pernikahan agama yang tidak dicatat'],
    jalanKeluar: ['wasiatSukarela', 'perdamaian', 'hibahSerahTerima'],
    peringatan: 'Ini ketentuan hukum positif Indonesia; menurut fikih tidak ada wasiat wajibah selain yang diwasiatkan pewaris.',
    sumber: [
      { kode: 'S01', lokasi: 'Pasal 209, 195, 201' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 165' },
      { kode: 'S06', lokasi: 'Yurisprudensi 1/Yur/Ag/2018' }, { kode: 'S07', lokasi: 'SEMA 7/2012 butir 20, SEMA 3/2023 butir 3, SEMA 3/2015 butir 9' },
    ],
  },
  {
    id: 'hartaBersama', judul: 'Harta bersama suami-istri', pasal: '85–97', hukumPositif: true, tingkat: 'beda',
    bunyiKhi: [
      'Harta yang diperoleh selama perkawinan menjadi harta bersama; harta bawaan serta harta hadiah atau warisan tetap milik masing-masing.',
      'Bila salah satu pasangan wafat, separuh harta bersama menjadi hak pasangan yang hidup.',
      'Harta waris adalah harta bawaan ditambah bagian pewaris dari harta bersama, setelah dikurangi keperluan selama sakit, biaya jenazah, utang, dan pemberian untuk kerabat.',
    ],
    praktikPa: [
      { peran: 'pegangan', teks: 'Pasangan non-muslim yang tidak mewarisi tetap mendapat bagian harta bersama menurut putusan Mahkamah Agung.' },
      { peran: 'catatan', teks: 'Pada suami beristri lebih dari satu, Pasal 94 menyebut harta bersama terpisah per perkawinan, tetapi pedoman Mahkamah Agung memahaminya bertumpuk dengan istri-istri terdahulu.' },
    ],
    fikih: {
      syafii: ['Tidak ada harta bersama otomatis karena pernikahan; harta suami dan istri terpisah.', 'Kerja sama usaha yang sah hanya syirkah \'inan (modal); kerja sama tenaga (abdan) dan atas nama baik (wujuh) batal.', 'Pembagian harta yang bercampur menurut kesepakatan atau bukti sumbangan (keputusan lembaga fatwa modern 2022, bukan nukilan madzhab klasik).'],
      hanbali: ['Kerja sama tenaga (abdan) boleh bila disepakati; tidak ada pencampuran harta otomatis karena pernikahan.'],
      hanafi: ['Kerja sama tenaga (abdan) sah pada pekerjaan tangan bila disepakati; tidak ada pencampuran harta otomatis karena pernikahan.'],
      maliki: ['Kerja sama tenaga (abdan) boleh bila sejenis pekerjaan dan satu tempat, dan disepakati; tidak ada pencampuran harta otomatis karena pernikahan.'],
    },
    rujukanFikih: ['R19-1', 'R19-2', 'R19-3', 'R19-4', 'R19-5', 'K19-1', 'R11-2', 'R11-3', 'R01-10', 'R01-11'],
    padananFikih: 'ada', belumTersedia: [],
    jalanKeluar: ['kesepakatanTertulis', 'perdamaian', 'hibahSerahTerima'],
    peringatan: 'Angka harta yang dimasukkan di kalkulator fikih adalah harta milik pewaris saja; bagian pasangan dipisah lebih dulu menurut kepemilikan atau kesepakatan, bukan otomatis separuh.',
    sumber: [
      { kode: 'S01', lokasi: 'Pasal 85–97, 171, 190' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 139–140' },
      { kode: 'S06', lokasi: 'Yurisprudensi 1/Yur/Ag/2018' }, { kode: 'F01', lokasi: 'Raudhah 4/275, 4/279, 4/280' },
      { kode: 'F04', lokasi: 'Keputusan lembaga fatwa 3/1444 H, hlm. 581–583' },
    ],
  },
  {
    id: 'penghalang', judul: 'Penghalang waris', pasal: '173, 197', hukumPositif: true, tingkat: 'beda',
    bunyiKhi: [
      'Ahli waris terhalang bila dengan putusan hakim berkekuatan tetap dihukum karena membunuh, mencoba membunuh, atau menganiaya berat pewaris.',
      'Ahli waris juga terhalang bila dihukum karena memfitnah pewaris melakukan kejahatan yang diancam lima tahun penjara atau lebih.',
      'Ahli waris harus beragama Islam; status itu dilihat dari kartu identitas, pengakuan, amalan, atau kesaksian.',
    ],
    praktikPa: [],
    fikih: {
      syafii: ['Pembunuh tidak mewarisi; semua bentuk pembunuhan menghalangi, tanpa syarat putusan hakim.', 'Beda agama, murtad, dan perbudakan menghalangi waris.', 'Fitnah bukan penghalang waris.'],
      hanbali: ['Hanya pembunuhan tanpa hak yang mewajibkan qishash, diyat, atau kafarat yang menghalangi.'],
      hanafi: ['Hanya pembunuhan yang mewajibkan qishash atau kafarat, atau yang dianjurkan kafarat, yang menghalangi.'],
      maliki: ['Hanya pembunuhan sengaja dan zalim yang menghalangi dari harta.'],
    },
    rujukanFikih: ['R02-8', 'R02-9', 'K02-1', 'R02-4', 'R02-6', 'R02-7'],
    padananFikih: 'ada', belumTersedia: [], jalanKeluar: [],
    peringatan: 'Percobaan pembunuhan dan penganiayaan berat tidak dibahas di KB fikih; sistem fikih tetap menandai kasus pembunuhan untuk diperiksa hakim.',
    sumber: [{ kode: 'S01', lokasi: 'Pasal 171, 172, 173, 197' }],
  },
  {
    id: 'saudaraSeibu', judul: 'Saudara seibu bersama saudara kandung', pasal: '181–182', hukumPositif: true, tingkat: 'beda',
    bunyiKhi: [
      'Saudara laki-laki dan perempuan seibu masing-masing mendapat seperenam; dua orang atau lebih bersama-sama mendapat sepertiga, bila pewaris tidak meninggalkan anak dan ayah.',
      'KHI tidak mengatur saudara seibu yang berkumpul dengan saudara kandung atau seayah.',
    ],
    praktikPa: [
      { peran: 'pegangan', teks: 'Menurut pedoman Mahkamah Agung, saudara seibu disamakan dengan saudara kandung atau seayah: mereka bersama-sama menjadi ashabah, laki-laki mendapat dua kali perempuan.' },
    ],
    fikih: {
      syafii: ['Saudara seibu hanya mendapat seperenam atau sepertiga dan bukan ashabah.', 'Pada kasus musyarrakah (suami, ibu atau nenek, dua atau lebih saudara seibu, saudara kandung), saudara kandung digabungkan dalam sepertiga (tasyrik).'],
      hanbali: ['Saudara seibu hanya mendapat bagian tetap dan bukan ashabah.', 'Pada kasus musyarrakah tidak ada tasyrik: saudara kandung gugur.'],
      hanafi: ['Saudara seibu hanya mendapat bagian tetap dan bukan ashabah.', 'Pada kasus musyarrakah tidak ada tasyrik: saudara kandung gugur.'],
      maliki: ['Saudara seibu hanya mendapat bagian tetap dan bukan ashabah.', 'Pada kasus musyarrakah saudara kandung digabungkan dalam sepertiga (tasyrik).'],
    },
    rujukanFikih: ['R06-5', 'K07-1', 'R11-2'],
    padananFikih: 'ada', belumTersedia: [], jalanKeluar: ['perdamaian'],
    peringatan: 'Pedoman tidak menyebut nomor putusan yang dirujuknya.',
    sumber: [{ kode: 'S01', lokasi: 'Pasal 181, 182' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, butir 6 tentang kerabat' }],
  },
  {
    id: 'kerabatJauh', judul: 'Kerabat jauh (dzawil arham)', pasal: '174, 191', hukumPositif: true, tingkat: 'beda',
    bunyiKhi: [
      'Ahli waris menurut hubungan darah: ayah, anak laki-laki, saudara laki-laki, paman, dan kakek; ibu, anak perempuan, saudara perempuan, dan nenek. (Teks resmi menulis "saudara perempuan dari nenek".)',
      'Bila pewaris tidak meninggalkan ahli waris sama sekali, harta diserahkan kepada Baitul Mal atas putusan Pengadilan Agama.',
    ],
    praktikPa: [
      { peran: 'pegangan', teks: 'Pedoman Mahkamah Agung: KHI tidak mengenal dzawil arham; kakek, nenek, paman, bibi, dan keturunannya masuk kelompok ashabah atau pengganti, berurutan dari derajat pertama sampai keempat.' },
    ],
    fikih: {
      syafii: ['Dzawil arham mewarisi bila baitul mal tidak tegak, dengan metode tanzil.'],
      hanbali: ['Dzawil arham mewarisi, dengan metode tanzil.'],
      hanafi: ['Dzawil arham mewarisi, dengan metode qarabah.'],
      maliki: ['Dzawil arham tidak mewarisi bila baitul mal diurus imam yang adil.'],
    },
    rujukanFikih: ['K14-1', 'K14-2', 'R01-4', 'R11-2'],
    padananFikih: 'ada', belumTersedia: [], jalanKeluar: ['wasiatSukarela', 'perdamaian'],
    sumber: [{ kode: 'S01', lokasi: 'Pasal 174, 191' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 163, 166–168' }],
  },
  {
    id: 'anakLuarKawin', judul: 'Anak di luar perkawinan', pasal: '186', hukumPositif: true, tingkat: 'sama',
    bunyiKhi: ['Anak yang lahir di luar perkawinan hanya saling mewarisi dengan ibunya dan keluarga ibunya.'],
    praktikPa: [
      { peran: 'pegangan', teks: 'Anak kandung dari pernikahan menurut agama Islam yang tidak dicatat dapat ditetapkan menerima wasiat wajibah (rumusan kamar 2023).' },
      { peran: 'catatan', teks: 'Putusan Mahkamah Konstitusi 46/PUU-VIII/2010: anak di luar perkawinan punya hubungan perdata dengan ayah yang dapat dibuktikan; bahan yang tersedia tidak menjelaskan akibatnya pada waris Islam.' },
    ],
    fikih: {
      syafii: ['Anak zina atau li\'an saling mewarisi dengan ibu dan kerabat ibu, tidak dengan ayah biologis.', 'Tidak ada ashabah baginya; sisa dikembalikan kepada ibu atau saudara seibu.'],
      hanbali: ['Anak zina atau li\'an saling mewarisi dengan ibu dan kerabat ibu; ibu dan ashabah ibu mewarisinya.'],
      hanafi: ['Anak zina atau li\'an saling mewarisi dengan ibu dan kerabat ibu; kerabat dari pihak ibu mewarisinya.'],
    },
    rujukanFikih: ['R13-11', 'K13-2', 'R01-4'],
    padananFikih: 'sebagian', belumTersedia: ['status anak dari pernikahan agama yang tidak dicatat'], jalanKeluar: ['wasiatSukarela'],
    sumber: [{ kode: 'S01', lokasi: 'Pasal 186 dan Penjelasan' }, { kode: 'S07', lokasi: 'SEMA 3/2023 butir 3' }, { kode: 'S08', lokasi: 'Putusan MK 46/PUU-VIII/2010, amar' }],
  },
  {
    id: 'wasiatAhliWaris', judul: 'Wasiat lebih dari sepertiga atau kepada ahli waris', pasal: '195, 201, 207', hukumPositif: true, tingkat: 'sama',
    bunyiKhi: [
      'Wasiat paling banyak sepertiga dari harta warisan kecuali semua ahli waris menyetujui.',
      'Wasiat kepada ahli waris berlaku bila disetujui semua ahli waris; persetujuan dibuat lisan atau tertulis di depan dua saksi atau notaris.',
      'Bila wasiat lebih dari sepertiga dan ada ahli waris yang tidak setuju, wasiat hanya dilaksanakan sampai sepertiga.',
      'Wasiat tidak boleh kepada orang yang merawat atau memberi tuntunan rohani selama pewaris sakit, kecuali dengan tegas untuk membalas jasa.',
    ],
    praktikPa: [
      { peran: 'pegangan', teks: 'Pedoman Mahkamah Agung: hibah dan wasiat kepada ahli waris diperhitungkan sebagai warisan; ahli waris dapat menggugat bila melebihi sepertiga.' },
    ],
    fikih: {
      syafii: ['Wasiat paling banyak sepertiga dan tidak untuk ahli waris tanpa persetujuan.', 'Persetujuan ahli waris baru sah bila diberikan sesudah pewaris wafat; sebelum itu hanya janji.'],
      hanbali: ['Wasiat kepada bukan ahli waris sah dalam batas sepertiga tanpa persetujuan.', 'Persetujuan ahli waris baru sah sesudah pewaris wafat.'],
      hanafi: ['Persetujuan ahli waris baru sah sesudah pewaris wafat.'],
    },
    rujukanFikih: ['R01-4', 'R01-5', 'R01-7', 'K01-1', 'R11-2'],
    padananFikih: 'ada', belumTersedia: [], jalanKeluar: ['persetujuanSetelahWafat', 'perdamaian'],
    peringatan: 'KHI tidak menyebut kapan persetujuan ahli waris sah; fikih Syafi\'i mensyaratkannya sesudah pewaris wafat.',
    sumber: [{ kode: 'S01', lokasi: 'Pasal 195, 201, 207' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 165 dan 171' }],
  },
  {
    id: 'hibahOrtuAnak', judul: 'Hibah orang tua kepada anak', pasal: '210–213', hukumPositif: true, tingkat: 'beda',
    bunyiKhi: [
      'Hibah orang tua kepada anaknya dapat diperhitungkan sebagai warisan.',
      'Hibah tidak dapat ditarik kembali, kecuali hibah orang tua kepada anaknya.',
      'Hibah paling banyak sepertiga harta kepada orang lain atau lembaga, di depan dua saksi.',
      'Hibah dalam keadaan sakit yang dekat dengan kematian memerlukan persetujuan ahli waris.',
    ],
    praktikPa: [],
    fikih: {
      syafii: ['Menyamakan hibah antar anak sunnah; melebihkan makruh. Hibah tidak otomatis dihitung sebagai warisan.', 'Hibah berlaku setelah diserahterimakan; hibah orang sakit maut dihitung dari sepertiga.', 'Ayah boleh menarik hibah kepada anaknya.'],
      hanbali: ['Wajib menyamakan hibah antar anak, ukurannya seperti pembagian waris (laki-laki dua kali perempuan).'],
      hanafi: ['Sepatutnya menyamakan: menurut Muhammad seperti waris, menurut Abu Yusuf sama rata; kewajiban penuh hanya pada wasiat sesudah wafat.'],
      maliki: ['Melebihkan satu anak makruh, tetapi pemberiannya tidak dibatalkan.'],
    },
    rujukanFikih: ['K01-3', 'R01-10', 'R01-11'],
    padananFikih: 'sebagian', belumTersedia: ['batas sepertiga untuk hibah semasa sehat'], jalanKeluar: ['hibahSerahTerima'],
    sumber: [{ kode: 'S01', lokasi: 'Pasal 210–213' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 165 butir 3' }, { kode: 'F01', lokasi: 'Raudhah 5/375, 3/429' }, { kode: 'F02', lokasi: 'Ujalat al-Muhtaj 2/987–988' }],
  },
  {
    id: 'ayah', judul: 'Bagian ayah', pasal: '177', hukumPositif: true, tingkat: 'sama',
    bunyiKhi: ['Ayah mendapat sepertiga bila pewaris tidak meninggalkan anak, dan seperenam bila ada anak.'],
    praktikPa: [
      { peran: 'pegangan', teks: 'Menurut penjelasan Mahkamah Agung (surat edaran 1994) dan pedoman, ayah menjadi ashabah bila pewaris tidak meninggalkan anak atau keturunan.' },
    ],
    fikih: {
      syafii: ['Ayah mendapat seperenam bila ada anak laki-laki; seperenam ditambah sisa bila hanya ada anak perempuan; ashabah bila tidak ada keturunan yang mewarisi.'],
    },
    rujukanFikih: ['R04-5'],
    padananFikih: 'ada', belumTersedia: [], jalanKeluar: [],
    peringatan: 'Bunyi pasal tampak berbeda, tetapi penjelasan resmi Mahkamah Agung menyelaraskannya dengan fikih.',
    sumber: [{ kode: 'S01', lokasi: 'Pasal 177' }, { kode: 'S03', lokasi: 'catatan kaki Pasal 177' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 165 butir 4' }],
  },
  {
    id: 'saudariKandungSeayah', judul: 'Saudari kandung dan seayah', pasal: '182', hukumPositif: true, tingkat: 'celah',
    bunyiKhi: ['Satu saudari kandung atau seayah mendapat setengah; dua atau lebih bersama-sama dua pertiga; bersama saudara laki-laki, laki-laki mendapat dua kali perempuan, bila pewaris tidak meninggalkan anak dan ayah.'],
    praktikPa: [
      { peran: 'pegangan', teks: 'Pedoman Mahkamah Agung menambah syarat: tidak bersama ayah, dan tidak ada saudara laki-laki atau keturunan laki-laki dari saudara laki-laki.' },
    ],
    fikih: {
      syafii: ['Saudari kandung dan saudari seayah dibedakan; saudari seayah dapat terhalang oleh saudara kandung dan mendapat seperenam sebagai penyempurna dua pertiga bila bersama satu saudari kandung.'],
    },
    rujukanFikih: ['R04-14', 'R04-15'],
    padananFikih: 'ada', belumTersedia: [], jalanKeluar: [],
    sumber: [{ kode: 'S01', lokasi: 'Pasal 182' }, { kode: 'S05', lokasi: 'Pedoman Buku II 2010, hlm. 166 butir 4a(7)' }],
  },
];

export const cariCatatanKhi = (id: IdCatatanKhi): CatatanKhi => {
  const catatan = CATATAN_KHI.find(entri => entri.id === id);
  if (!catatan) throw new Error(`catatan KHI tidak ditemukan: ${id}`);
  return catatan;
};

/** Semua kalimat yang bisa sampai ke layar pengguna (dipakai tes agar tidak ada kode teknis atau angka hasil). */
export const teksTampil = (catatan: CatatanKhi): string[] => [
  catatan.judul, catatan.pasal,
  ...catatan.bunyiKhi,
  ...catatan.praktikPa.map(butir => butir.teks),
  ...Object.values(catatan.fikih).flat(),
  ...catatan.belumTersedia,
  ...(catatan.peringatan ? [catatan.peringatan] : []),
];
