// scripts/env.ts
// Diimpor paling awal oleh CLI skrip: muat scripts/.env bila ada, supaya kunci Supabase tidak perlu diketik tiap kali.
// Variabel yang sudah diset di shell tetap menang (process.loadEnvFile tidak menimpa). File tidak ada = diam saja.
import { setDefaultResultOrder } from 'node:dns';
import { existsSync } from 'node:fs';

const BERKAS_ENV = new URL('./.env', import.meta.url);
if (existsSync(BERKAS_ENV)) process.loadEnvFile(BERKAS_ENV);

// Beberapa jaringan me-resolve Supabase ke IPv6 (NAT64) yang koneksinya diputus ("fetch failed"); IPv4 lebih dulu.
setDefaultResultOrder('ipv4first');
