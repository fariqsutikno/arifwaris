// Pemasok notifikasi. Prinsip (keputusan 2026-10-02): hanya yang mendesak, bisa ditindaklanjuti, dan belum terlihat di layar,
// dan gudang membatasi kabar biasa satu per hari (yang mendesak, yaitu streak terancam putus, boleh lebih). Yang dikabarkan: modul tamat, tonggak streak, streak terancam putus, ringkasan peringkat
// mingguan, materi baru di modul yang sedang dipelajari, dan kasus yang menggantung (sekali per kasus).
// Pelajaran satu per satu, kenaikan streak harian, dan perubahan peringkat harian sengaja TIDAK dikabarkan.
// Tidak merender apa pun. Streak dan peringkat hanya bisa dicek saat aplikasi dibuka (tidak ada pekerjaan terjadwal di server).

import { useEffect } from 'react';
import type { Sesi } from '@waris/data';
import type { RepoAkun } from '../akun/sinkron';
import { useRingkasanSaya } from '../akun/ringkasan';
import { daftarModul, daftarPelajaran } from '../konten/sumber';
import { PERISTIWA_KONTEN_BARU } from '../konten/sinkron';
import { keJson, muatLokal } from '../kasus';
import { kasusLengkap } from '../layar/KonfirmasiKasusBaru';
import { bacaPelajaranSelesai, PERISTIWA_PELAJARAN_SELESAI } from '../progres';
import { ringkasKasus } from '../riwayat';
import { TAUTAN_KALKULATOR, tautanBelajar, tautanPeringkat } from '../rute';
import { bacaMentah, simpanMentah } from '../penyimpanan';
import { t } from '../terjemah';
import { catatNotifikasi, PERISTIWA_NOTIFIKASI_BARU, type Notifikasi } from './gudang';
import { tampilkanDiPerangkat } from './perangkat';

const KUNCI_STREAK_TERAKHIR = 'arif-waris:streak-terakhir';
const KUNCI_PERINGKAT_PEKAN = 'arif-waris:peringkat-pekan';
const KUNCI_KASUS_TERAKHIR = 'arif-waris:kasus-terakhir-diubah';
const JAM_PENGINGAT_STREAK = 17;
const STREAK_MINIMAL_DIINGATKAN = 3;
// Streak hanya dikabarkan di tonggak ini; kenaikan harian cukup terlihat di kartu streak.
const TONGGAK_STREAK = [7, 14, 30, 60, 100, 200, 365];
const BATAS_PAPAN = 100;
const MS_HARI = 86_400_000;
// Urutan kepentingan bila beberapa kabar jatuh di hari yang sama (gudang menyisakan satu).
const PRIORITAS = { modul: 90, tonggak: 80, streakTerancam: 70, peringkatPekan: 50, materiBaru: 40, kasus: 30 } as const;

const hariIni = (): string => new Date().toISOString().slice(0, 10);
/** Senin pekan ini (tanggal), sebagai penanda pekan. */
const penandaPekan = (sekarang = Date.now()): string => new Date(sekarang - ((new Date(sekarang).getDay() + 6) % 7) * MS_HARI).toISOString().slice(0, 10);

/** Modul yang sudah dimulai tetapi belum tamat. */
function modulSedangDipelajari(): Set<number> {
  const selesai = bacaPelajaranSelesai();
  const sedang = new Set<number>();
  for (const nomor of new Set(daftarPelajaran().map(isi => isi.modul))) {
    const isiModul = daftarPelajaran().filter(isi => isi.modul === nomor);
    const jumlahSelesai = isiModul.filter(isi => selesai.has(isi.slug)).length;
    if (jumlahSelesai > 0 && jumlahSelesai < isiModul.length) sedang.add(nomor);
  }
  return sedang;
}

export function SumberNotifikasi({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  const ringkasan = useRingkasanSaya();

  useEffect(() => {
    const saatKontenBaru = (kejadian: Event) => {
      const berubah = (kejadian as CustomEvent<{ modul?: number[] } | undefined>).detail?.modul ?? [];
      const sedang = modulSedangDipelajari();
      const nomor = berubah.find(isi => sedang.has(isi));
      if (nomor === undefined) return;
      const modul = daftarModul().find(isi => isi.nomor === nomor);
      catatNotifikasi({ id: `materi-baru-${nomor}-${hariIni()}`, jenis: 'konten', prioritas: PRIORITAS.materiBaru,
        judul: t('notifikasi.konten_modul_judul', { judul: modul?.judul ?? String(nomor) }), isi: t('notifikasi.konten_modul_isi'), tautan: tautanBelajar() });
    };
    // Hanya modul yang tamat (semua pelajarannya selesai) yang dikabarkan.
    const saatPelajaranSelesai = (kejadian: Event) => {
      const slug = (kejadian as CustomEvent<{ slug: string }>).detail.slug;
      const nomorModul = daftarPelajaran().find(isi => isi.slug === slug)?.modul;
      if (nomorModul === undefined) return;
      const selesai = bacaPelajaranSelesai();
      if (!daftarPelajaran().filter(isi => isi.modul === nomorModul).every(isi => selesai.has(isi.slug))) return;
      const modul = daftarModul().find(isi => isi.nomor === nomorModul);
      catatNotifikasi({ id: `modul-${nomorModul}`, jenis: 'belajar', prioritas: PRIORITAS.modul, judul: t('notifikasi.modul_judul'),
        isi: t('notifikasi.modul_isi', { judul: modul?.judul ?? String(nomorModul) }), tautan: tautanBelajar() });
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

  // Kasus menggantung: satu pengingat per kasus, sehari setelah terakhir diubah dan masih belum sampai hasil.
  useEffect(() => {
    const kasus = muatLokal();
    if (!kasus || kasusLengkap(kasus)) return;
    const sidik = String(keJson(kasus).length) + ':' + keJson(kasus).slice(-40);
    const tercatat = JSON.parse(bacaMentah(KUNCI_KASUS_TERAKHIR) ?? 'null') as { sidik: string; waktu: number } | null;
    if (!tercatat || tercatat.sidik !== sidik) {
      simpanMentah(KUNCI_KASUS_TERAKHIR, JSON.stringify({ sidik, waktu: Date.now() }));
      return;
    }
    if (Date.now() - tercatat.waktu < MS_HARI) return;
    catatNotifikasi({ id: `kasus-${tercatat.waktu}`, jenis: 'kasus', prioritas: PRIORITAS.kasus, judul: t('notifikasi.kasus_judul'),
      isi: t('notifikasi.kasus_isi', { judul: ringkasKasus(kasus).judul }), tautan: TAUTAN_KALKULATOR });
  }, []);

  // Tonggak streak, dan pengingat sore bila streak yang lumayan panjang terancam putus hari ini.
  useEffect(() => {
    if (!ringkasan) return;
    const terakhir = Number(bacaMentah(KUNCI_STREAK_TERAKHIR) ?? 0);
    const tonggak = TONGGAK_STREAK.find(batas => ringkasan.streakSekarang >= batas && terakhir < batas);
    if (tonggak && terakhir > 0) {
      catatNotifikasi({ id: `streak-tonggak-${tonggak}`, jenis: 'streak', prioritas: PRIORITAS.tonggak,
        judul: t('notifikasi.streak_tonggak_judul', { jumlah: tonggak }), isi: t('notifikasi.streak_tonggak_isi'), tautan: tautanPeringkat() });
    }
    simpanMentah(KUNCI_STREAK_TERAKHIR, String(ringkasan.streakSekarang));
    if (!ringkasan.aktifHariIni && ringkasan.streakSekarang >= STREAK_MINIMAL_DIINGATKAN && new Date().getHours() >= JAM_PENGINGAT_STREAK) {
      catatNotifikasi({ id: `streak-ingat-${hariIni()}`, jenis: 'streak', prioritas: PRIORITAS.streakTerancam, mendesak: true,
        judul: t('notifikasi.streak_ingat_judul', { jumlah: ringkasan.streakSekarang }), isi: t('notifikasi.streak_ingat_isi'), tautan: tautanBelajar() });
    }
  }, [ringkasan]);

  // Ringkasan peringkat mingguan: saat pekan baru dibuka pertama kali, kabarkan peringkat terakhir pekan lalu
  // (posisi pada kunjungan terakhir) dan selisihnya dari pekan sebelumnya. Tidak ada kabar tiap posisi bergeser.
  useEffect(() => {
    if (!sesi || !repo) return;
    let masihDipakai = true;
    void repo.peringkat.papan('minggu', BATAS_PAPAN).then(papan => {
      const saya = papan.find(baris => baris.saya);
      if (!masihDipakai || !saya) return;
      const pekan = penandaPekan();
      const simpanan = JSON.parse(bacaMentah(KUNCI_PERINGKAT_PEKAN) ?? 'null') as { pekan: string; peringkat: number; sebelum?: number } | null;
      if (simpanan && simpanan.pekan !== pekan) {
        const id = `peringkat-pekan-${pekan}`;
        const judul = t('notifikasi.pekan_judul', { peringkat: simpanan.peringkat });
        const selisih = simpanan.sebelum === undefined ? 0 : simpanan.sebelum - simpanan.peringkat;
        if (simpanan.sebelum === undefined) {
          catatNotifikasi({ id, jenis: 'peringkat', prioritas: PRIORITAS.peringkatPekan, judul, isi: t('notifikasi.pekan_awal'), tautan: tautanPeringkat() });
        } else if (selisih > 0) {
          catatNotifikasi({ id, jenis: 'peringkat', prioritas: PRIORITAS.peringkatPekan, judul, isi: t('notifikasi.pekan_naik', { selisih }), tautan: tautanPeringkat() });
        } else if (selisih < 0) {
          catatNotifikasi({ id, jenis: 'peringkat', prioritas: PRIORITAS.peringkatPekan, judul, isi: t('notifikasi.pekan_turun', { selisih: -selisih }), tautan: tautanPeringkat() });
        } else {
          catatNotifikasi({ id, jenis: 'peringkat', prioritas: PRIORITAS.peringkatPekan, judul, isi: t('notifikasi.pekan_sama'), tautan: tautanPeringkat() });
        }
        simpanMentah(KUNCI_PERINGKAT_PEKAN, JSON.stringify({ pekan, peringkat: saya.peringkat, sebelum: simpanan.peringkat }));
      } else {
        simpanMentah(KUNCI_PERINGKAT_PEKAN, JSON.stringify({ ...(simpanan ?? {}), pekan, peringkat: saya.peringkat }));
      }
    }).catch(() => undefined);
    return () => { masihDipakai = false; };
  }, [sesi?.userId, repo]);

  return null;
}
