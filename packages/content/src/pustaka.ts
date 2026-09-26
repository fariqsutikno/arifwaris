// Tipe pustaka (isinya konten jenis syahid & kitab di database): syahid = potongan ayat KB bab 1.2 per hukum,
// sumber kitab = tautan/PDF kitab di KB bab 17.2.
export interface Syahid { surah: string; ayat: number; hukum: string; syahid: string; rujukan: string }
export interface SumberKitab { judul: string; tautan?: string; pdf?: string }
