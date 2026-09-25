// Ikon garis milik Arif Waris: satu gaya dengan ikon yang sudah ada di layar hasil (stroke 2.2, ujung bulat,
// 24×24). Dipakai sebagai penanda jenis (pelajaran, soal, kuis, rujukan), bukan hiasan; selalu disertai label teks.

const JALUR = {
  pelajaran: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /><path d="M9 8h7M9 12h5" /></>,
  hitung: <><rect x="4" y="2" width="16" height="20" rx="3" /><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4" /></>,
  kuis: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16.5 9" /></>,
  acak: <><path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6c1.1 1.7 2.3 2.7 4.3 2.7H21" /><path d="M3 17h3.5c1.5 0 2.5-.6 3.4-1.6M13.6 8.6C14.5 7.6 15.5 7 17 7h4" /><path d="M18 4l3 3-3 3M18 14l3 3-3 3" /></>,
  tanya: <><path d="M4 5h16v11H9l-5 4z" /><path d="M9.5 9a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1M12 14h.01" /></>,
  glosarium: <><path d="M5 3h11l3 3v15H5z" /><path d="M9 15l3-7 3 7M10 13h4" /></>,
  rujukan: <><path d="M7 3h11a2 2 0 0 1 2 2v2h-4" /><path d="M16 7v12a2 2 0 0 1-4 0v-1H4v1a2 2 0 0 0 2 2h10" /><path d="M7 3a2 2 0 0 0-2 2v13M9 8h3M9 12h3" /></>,
  rumah: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></>,
  riwayat: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  keluar: <><path d="M14 4h5v16h-5" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  unduh: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 19h16" /></>,
  berkas: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></>,
  gambar: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
  benar: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  salah: <path d="M6 6l12 12M18 6L6 18" />,
  pensil: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></>,
  daftar: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  sampah: <><path d="M4 7h16M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13M10 11v6M14 11v6" /></>,
  tambah: <path d="M12 5v14M5 12h14" />,
  kembali: <path d="M15 5l-7 7 7 7" />,
  bagikan: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 12v8h14v-8" /></>,
  buka: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>,
} as const;

export type NamaIkon = keyof typeof JALUR;

export function Ikon({ nama, ukuran = 20 }: { nama: NamaIkon; ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ikon">{JALUR[nama]}</svg>
  );
}
