// Modul virtual dari plugin lokasiTeks (vite.config.ts): kunci teks aplikasi → nama layar tempatnya tampil.
declare module 'virtual:lokasi-teks' {
  const lokasi: Record<string, string[]>;
  export default lokasi;
}

// Modul virtual dari plugin refsEngine (vite.config.ts): kode rujukan KB → jumlah tempat dipakai aturan kalkulator.
declare module 'virtual:refs-engine' {
  const jumlah: Record<string, number>;
  export default jumlah;
}
