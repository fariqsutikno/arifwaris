-- Awal Lab (spek 2026-10-01): kasus bernama bisa disematkan di rak. Baris lama tidak disematkan.
alter table riwayat_hitung add column disematkan boolean not null default false;
