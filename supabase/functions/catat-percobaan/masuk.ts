// Pintu bundel untuk edge function: satu berkas ESM berisi penilai latihan + pembaca isi soal (lihat scripts/bundel-fungsi.ts).
// Fungsi edge tidak mengimpor paket workspace langsung (runtime Supabase tidak menghormati sloppy-imports; docs/design/.../hasil-spike-edge.md).
export { bacaKiriman, bacaKirimanKegiatan, nilaiKiriman, nilaiKuis, tabelKanonik } from '../../../packages/latihan/src/index.ts';
export { bacaIsi } from '../../../packages/content/src/skema.ts';
