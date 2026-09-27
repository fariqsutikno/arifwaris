// scripts/env.ts
// Diimpor paling awal oleh CLI skrip: muat scripts/.env bila ada, supaya kunci Supabase tidak perlu diketik tiap kali.
// Variabel yang sudah diset di shell tetap menang (process.loadEnvFile tidak menimpa). File tidak ada = diam saja.
import { existsSync } from 'node:fs';

const BERKAS_ENV = new URL('./.env', import.meta.url);
if (existsSync(BERKAS_ENV)) process.loadEnvFile(BERKAS_ENV);
