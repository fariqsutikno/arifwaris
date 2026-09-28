import { expect, test } from 'vitest';
import type { AjuanKonten, RingkasanRevisiDiksi } from '@waris/data';
import { jumlahKabarBaru, susunAjuan } from '../editor/ajuanSaya';

const konten = (id: string, entriId: string, status: AjuanKonten['status'], waktu: string, lain: Partial<AjuanKonten> = {}): AjuanKonten => ({
  id, entriId, status, hapus: false, refs: [], isi: { pertanyaan: `Soal ${entriId}` }, dibuatOleh: 'p', diperiksaOleh: status === 'diajukan' ? null : 'r',
  catatanReview: status === 'dikembalikan' ? 'perbaiki' : null, dibuatPada: waktu, diperiksaPada: status === 'diajukan' ? null : waktu,
  jenis: 'faq', slug: entriId, ...lain,
});
const diksi = (id: string, status: RingkasanRevisiDiksi['status'], waktu: string): RingkasanRevisiDiksi => ({
  id, kunci: 'u.a', idTeks: 'Bagikan', arTeks: null, catatan: null, status, dibuatOleh: 'p', diperiksaOleh: 'r', catatanReview: null,
  dibuatPada: waktu, diperiksaPada: status === 'diajukan' ? null : waktu,
});

test('satu butir per entri (terbaru): ajuan yang sudah diperbaiki tidak lagi di Perlu diperbaiki; teks aplikasi ikut', () => {
  const daftar = susunAjuan(
    [konten('r3', 'e1', 'diajukan', '2026-09-28T03:00:00Z'), konten('r1', 'e1', 'dikembalikan', '2026-09-28T01:00:00Z'), konten('r2', 'e2', 'dikembalikan', '2026-09-28T02:00:00Z')],
    [diksi('d1', 'disetujui', '2026-09-28T04:00:00Z')],
  );
  expect(daftar.map(b => [b.id, b.tab, b.judul])).toEqual([
    ['d1', 'disetujui', 'Bagikan'], ['r3', 'menunggu', 'Soal e1'], ['r2', 'perbaiki', 'Soal e2'],
  ]);
  expect(daftar[2]).toMatchObject({ jenis: 'FAQ', catatan: 'perbaiki', pemeriksa: 'r', tujuan: { entriId: 'e2' } });
});

test('kabar baru: dikembalikan/disetujui sejak terakhir dibuka; belum pernah dibuka = yang perlu diperbaiki saja', () => {
  const daftar = susunAjuan(
    [konten('r1', 'e1', 'dikembalikan', '2026-09-28T01:00:00Z'), konten('r2', 'e2', 'disetujui', '2026-09-28T05:00:00Z'), konten('r3', 'e3', 'diajukan', '2026-09-28T06:00:00Z')],
    [],
  );
  expect(jumlahKabarBaru(daftar, null)).toBe(1);
  expect(jumlahKabarBaru(daftar, '2026-09-28T02:00:00Z')).toBe(1);
  expect(jumlahKabarBaru(daftar, '2026-09-28T00:00:00Z')).toBe(2);
});

test('terbitan langsung sendiri (pemeriksa = pembuat) bukan hasil review', () => {
  expect(susunAjuan([konten('r1', 'e1', 'disetujui', '2026-09-28T01:00:00Z', { diperiksaOleh: 'p' })], [])).toEqual([]);
});
