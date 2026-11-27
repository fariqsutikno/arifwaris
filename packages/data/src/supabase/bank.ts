// packages/data/src/supabase/bank.ts
// Bank soal di Supabase: baca lewat RPC cari_soal (supabase/migrations/20261127000001_bank_soal.sql), tulis upsert
// ke tabel bank_soal. RLS: baca semua, tulis admin (peran impor).
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  periksaCariSoal, periksaContohSoal, UKURAN_BATCH_SIMPAN_BANK, type BarisBankSoal, type RepositoriAturanPengecoh, type RepositoriBankSoal,
} from '../bank.js';

export function buatBankSupabase(klien: SupabaseClient): RepositoriBankSoal & RepositoriAturanPengecoh {
  return {
    async cariSoal(masukan) {
      periksaCariSoal(masukan);
      const { tingkat, modul, keluarga, label, jumlah, benih, bentuk } = masukan;
      const { data, error } = await klien.rpc('cari_soal', {
        p_jumlah: jumlah, p_benih: benih, p_tingkat: tingkat ?? null, p_modul: modul ?? null, p_keluarga: keluarga ?? null,
        p_label_semua: label?.semua ?? null, p_label_salah_satu: label?.salahSatu ?? null, p_label_tanpa: label?.tanpa ?? null,
        // Tanpa parameter bila hitung: tetap jalan pada basis data yang belum punya migrasi K5.
        ...(bentuk === 'kuis' ? { p_bentuk: bentuk } : {}),
      });
      if (error) throw new Error(error.message);
      return data as string[];
    },
    async daftarDisetujui() {
      const { data, error } = await klien.from('aturan_pengecoh_disetujui').select('aturan').order('aturan');
      if (error) throw new Error(error.message);
      return (data as Array<{ aturan: string }>).map(isi => isi.aturan);
    },
    async setujui(aturan) {
      const { error } = await klien.from('aturan_pengecoh_disetujui').upsert({ aturan }, { onConflict: 'aturan', ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    },
    async cabut(aturan) {
      const { error } = await klien.from('aturan_pengecoh_disetujui').delete().eq('aturan', aturan);
      if (error) throw new Error(error.message);
    },
    async contohSoal(aturan, jumlah, benih) {
      periksaContohSoal(aturan, jumlah, benih);
      const { data, error } = await klien.rpc('contoh_soal_kuis', { p_aturan: aturan, p_jumlah: jumlah, p_benih: benih });
      if (error) throw new Error(error.message);
      return data as string[];
    },
    async simpan(baris) {
      for (let awal = 0; awal < baris.length; awal += UKURAN_BATCH_SIMPAN_BANK) {
        const { error } = await klien.from('bank_soal').upsert(baris.slice(awal, awal + UKURAN_BATCH_SIMPAN_BANK).map(keBaris), { onConflict: 'kode' });
        if (error) throw new Error(error.message);
      }
    },
  };
}

const keBaris = (isi: BarisBankSoal) => ({
  kode: isi.kode, versi_generator: isi.versiGenerator, keluarga: isi.keluarga, tingkat: isi.tingkat, modul: isi.modul,
  label: isi.label, jumlah_mayit: isi.jumlahMayit, jumlah_ahli_waris: isi.jumlahAhliWaris,
  bentuk: isi.bentuk ?? 'hitung', aturan: isi.aturan ?? [],
});
