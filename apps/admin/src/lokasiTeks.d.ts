// Modul virtual dari plugin lokasiTeks (vite.config.ts): kunci teks aplikasi → nama layar tempatnya tampil.
declare module 'virtual:lokasi-teks' {
  const lokasi: Record<string, string[]>;
  export default lokasi;
}
