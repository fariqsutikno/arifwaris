// Pemasok notifikasi: mengamati kejadian di aplikasi (konten baru, pelajaran selesai, streak, peringkat, kasus belum selesai)
// dan mencatatnya ke kotak masuk lewat gudang. Tidak merender apa pun. Semua kalimat dari diksi `notifikasi.*`.
// Streak dan peringkat hanya bisa dicek saat aplikasi dibuka (tidak ada pekerjaan terjadwal di server).

import { useEffect } from 'react';
import type { Sesi } from '@waris/data';
import type { RepoAkun } from '../akun/sinkron';
import { useRingkasanSaya } from '../akun/ringkasan';
import { daftarPelajaran } from '../konten/sumber';
import { PERISTIWA_KONTEN_BARU } from '../konten/sinkron';
import { muatLokal } from '../kasus';
import { kasusLengkap } from '../layar/KonfirmasiKasusBaru';
import { PERISTIWA_PELAJARAN_SELESAI } from '../progres';
import { ringkasKasus } from '../riwayat';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanPeringkat } from '../rute';
import { bacaMentah, simpanMentah } from '../penyimpanan';
import { t } from '../terjemah';
import { catatNotifikasi, PERISTIWA_NOTIFIKASI_BARU, type Notifikasi } from './gudang';
import { tampilkanDiPerangkat } from './perangkat';

const KUNCI_STREAK_TERAKHIR = 'arif-waris:streak-terakhir';
const KUNCI_PERINGKAT_TERAKHIR = 'arif-waris:peringkat-terakhir';
const JAM_PENGINGAT_STREAK = 17;
const BATAS_PAPAN = 100;

const hariIni = (): string => new Date().toISOString().slice(0, 10);

export function SumberNotifikasi({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  const ringkasan = useRingkasanSaya();

  useEffect(() => {
    const saatKontenBaru = () => catatNotifikasi({ id: `konten-${hariIni()}`, jenis: 'konten', judul: t('notifikasi.konten_judul'), isi: t('notifikasi.konten_isi') });
    const saatPelajaranSelesai = (kejadian: Event) => {
      const slug = (kejadian as CustomEvent<{ slug: string }>).detail.slug;
      const pelajaran = daftarPelajaran().find(isi => isi.slug === slug);
      catatNotifikasi({ id: `belajar-${slug}`, jenis: 'belajar', judul: t('notifikasi.belajar_judul'),
        isi: t('notifikasi.belajar_isi', { judul: pelajaran?.judul ?? slug }), tautan: tautanBelajar() });
    };
    const saatNotifikasiBaru = (kejadian: Event) => void tampilkanDiPerangkat((kejadian as CustomEvent<Notifikasi>).detail);
    window.addEventListener(PERISTIWA_KONTEN_BARU, saatKontenBaru);
    window.addEventListener(PERISTIWA_PELAJARAN_SELESAI, saatPelajaranSelesai);
    window.addEventListener(PERISTIWA_NOTIFIKASI_BARU, saatNotifikasiBaru);
    return () => {
      window.removeEventListener(PERISTIWA_KONTEN_BARU, saatKontenBaru);
      window.removeEventListener(PERISTIWA_PELAJARAN_SELESAI, saatPelajaranSelesai);
      window.removeEventListener(PERISTIWA_NOTIFIKASI_BARU, saatNotifikasiBaru);
    };
  }, []);

  // Kasus yang tersimpan di perangkat tetapi belum sampai hasil: satu pengingat per hari.
  useEffect(() => {
    const kasus = muatLokal();
    if (!kasus || kasusLengkap(kasus)) return;
    catatNotifikasi({ id: `kasus-${hariIni()}`, jenis: 'kasus', judul: t('notifikasi.kasus_judul'),
      isi: t('notifikasi.kasus_isi', { judul: ringkasKasus(kasus).judul }), tautan: TAUTAN_KALKULATOR });
  }, []);

  // Streak naik (dibanding terakhir dilihat) dan pengingat sore bila hari ini belum aktif.
  useEffect(() => {
    if (!ringkasan) return;
    const terakhir = Number(bacaMentah(KUNCI_STREAK_TERAKHIR) ?? 0);
    if (ringkasan.streakSekarang > terakhir && terakhir > 0) {
      catatNotifikasi({ id: `streak-naik-${ringkasan.streakSekarang}-${hariIni()}`, jenis: 'streak',
        judul: t('notifikasi.streak_naik_judul', { jumlah: ringkasan.streakSekarang }), isi: t('notifikasi.streak_naik_isi'), tautan: tautanPeringkat() });
    }
    simpanMentah(KUNCI_STREAK_TERAKHIR, String(ringkasan.streakSekarang));
    if (!ringkasan.aktifHariIni && ringkasan.streakSekarang > 0 && new Date().getHours() >= JAM_PENGINGAT_STREAK) {
      catatNotifikasi({ id: `streak-ingat-${hariIni()}`, jenis: 'streak',
        judul: t('notifikasi.streak_ingat_judul', { jumlah: ringkasan.streakSekarang }), isi: t('notifikasi.streak_ingat_isi'), tautan: tautanBelajar() });
    }
  }, [ringkasan]);

  // Naik/turun peringkat pekan ini dibanding terakhir dibuka; pertama kali hanya mencatat posisi awal.
  useEffect(() => {
    if (!sesi || !repo) return;
    let masihDipakai = true;
    void repo.peringkat.papan('minggu', BATAS_PAPAN).then(papan => {
      const saya = papan.find(baris => baris.saya);
      if (!masihDipakai || !saya) return;
      const dulu = Number(bacaMentah(KUNCI_PERINGKAT_TERAKHIR) ?? 0);
      simpanMentah(KUNCI_PERINGKAT_TERAKHIR, String(saya.peringkat));
      if (!dulu || dulu === saya.peringkat) return;
      const id = `peringkat-${saya.peringkat}-${hariIni()}`;
      if (saya.peringkat < dulu) {
        catatNotifikasi({ id, jenis: 'peringkat', judul: t('notifikasi.peringkat_naik_judul', { peringkat: saya.peringkat }),
          isi: t('notifikasi.peringkat_naik_isi', { dulu }), tautan: tautanPeringkat() });
      } else {
        catatNotifikasi({ id, jenis: 'peringkat', judul: t('notifikasi.peringkat_turun_judul', { peringkat: saya.peringkat }),
          isi: t('notifikasi.peringkat_turun_isi', { dulu }), tautan: tautanPeringkat() });
      }
    }).catch(() => undefined);
    return () => { masihDipakai = false; };
  }, [sesi?.userId, repo]);

  return null;
}
