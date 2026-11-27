-- supabase/migrations/20261127000002_review_dua_tahap_enum.sql
-- K1 (spec-soal-kuis-ribuan 5.1): status 'diperiksa' dan peran 'keilmuan'. Dipisah dari migrasi aturannya karena nilai
-- enum baru tidak boleh dipakai dalam transaksi yang sama dengan ALTER TYPE ADD VALUE.
alter type status_revisi add value 'diperiksa' before 'disetujui';
alter type peran add value 'keilmuan';
