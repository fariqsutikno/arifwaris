// Tes panel Teks aplikasi (PanelTeks): teks di layar ini tampil, pencarian mencakup semua teks dari dua tempat simpan
// tanpa kunci teknis, label pendek disembunyikan kecuali dicentang, sunting diksi lewat dialog → diajukan, dan riwayat
// diksi bisa menayangkan lagi versi lama.
import { useEffect, useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori, type RingkasanEntri, type RingkasanKunciDiksi } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo, usePortal } from '../repo';
import { PanelTeks } from '../layar/PanelTeks';
import { DialogSunting } from '../layar/EditorTeksAplikasi';
import type { ButirTeks } from '../editor/teksAplikasi';
import { layakDisunting } from '../editor/teksAplikasi';

async function siapkan() {
  const m = buatMemori({ refs: [], sesi: { userId: 'u-a', email: 'a@x.id' }, peran: { 'u-a': 'admin', 'u-p': 'penulis', 'u-r': 'reviewer' } });
  const entriId = await m.editorial.buatEntri('teks_edukasi', 'harta.penjelasan_utang', 10);
  await m.editorial.terbitkanLangsung(await m.editorial.buatDraf(entriId, 'teks_edukasi', { id: 'Utang dilunasi sebelum harta dibagi.' }, []));
  await m.diksi.buatKunci('beranda.judul', 'beranda');
  await m.diksi.buatKunci('umum.kembali', 'umum');
  for (const [kunci, id] of [['beranda.judul', 'Hitung warisan dengan tenang'], ['umum.kembali', 'Kembali']] as const) {
    const r = await m.diksi.buatDraf(kunci, id, null, null);
    await m.diksi.ajukan(r);
  }
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  for (const k of await m.diksi.daftarKunci()) if (k.revisiTerakhir?.status === 'diajukan') await m.diksi.setujui(k.revisiTerakhir.id);
  return m;
}

function tampilkan(m: Awaited<ReturnType<typeof siapkan>>, peran: Peran, userId: string) {
  m.masukSebagai({ userId, email: `${userId}@x.id` });
  render(<KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}><Panel /></KonteksRepo.Provider>);
}

/** Seperti di EditorTeksAplikasi: data dimuat, "Hitung warisan dengan tenang" tampil di layar, dialog sunting di luar panel. */
function Panel() {
  const { repo, peran } = usePortal();
  const [data, setData] = useState<{ entri: RingkasanEntri[]; diksi: RingkasanKunciDiksi[] } | null>(null);
  const [dipilih, setDipilih] = useState<ButirTeks | null>(null);
  const [muat, setMuat] = useState(0);
  useEffect(() => { void Promise.all([repo.konten.daftarEntri('teks_edukasi'), repo.diksi.daftarKunci()]).then(([entri, diksi]) => setData({ entri, diksi })); }, [repo, muat]);
  if (!data) return null;
  return (
    <>
      <PanelTeks data={data} diLayar={['diksi/beranda.judul']} saatSorot={() => {}} saatSunting={setDipilih} saatBerubah={() => setMuat(n => n + 1)} />
      {dipilih ? <DialogSunting pilihan={[dipilih]} data={data} bacaSaja={peran === 'reviewer'} saatTutup={() => setDipilih(null)} saatTersimpan={() => setMuat(n => n + 1)} /> : null}
    </>
  );
}

const cari = (kata: string) => fireEvent.change(screen.getByRole('searchbox', { name: 'Cari teks' }), { target: { value: kata } });

test('layakDisunting: label ≤ 2 kata tidak, kalimat ya, sisipan tidak dihitung', () => {
  expect(layakDisunting('Kembali')).toBe(false);
  expect(layakDisunting('{jumlah} orang')).toBe(false);
  expect(layakDisunting('Harta yang dibagi')).toBe(true);
});

test('tanpa cari: teks di layar ini; cari: semua teks dari dua sumber tanpa kunci, label pendek bisa ditampilkan', async () => {
  tampilkan(await siapkan(), 'penulis', 'u-p');
  await screen.findByText('Teks di layar ini (1)');
  expect(screen.getByText('Hitung warisan dengan tenang')).toBeTruthy();
  expect(screen.queryByText('Utang dilunasi sebelum harta dibagi.')).toBeNull();
  cari('e');
  expect(screen.getByText('Utang dilunasi sebelum harta dibagi.')).toBeTruthy();
  expect(screen.queryByText('Kembali')).toBeNull();
  expect(screen.queryByText(/beranda\.judul|harta\.penjelasan/)).toBeNull();
  fireEvent.click(screen.getByLabelText(/Tampilkan juga label pendek/));
  expect(screen.getByText('Kembali')).toBeTruthy();
});

test('penulis: sunting teks → diajukan untuk review', async () => {
  const m = await siapkan();
  tampilkan(m, 'penulis', 'u-p');
  const butir = await screen.findByRole('article', { name: 'Hitung warisan dengan tenang' });
  fireEvent.click(within(butir).getByRole('button', { name: 'Sunting' }));
  fireEvent.change(await screen.findByLabelText('Bahasa Indonesia'), { target: { value: 'Hitung warisan dengan tenang dan benar' } });
  expect(screen.getByText('Pratinjau:', { exact: false })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & ajukan' }));
  await waitFor(async () => {
    const k = (await m.diksi.daftarKunci()).find(x => x.kunci === 'beranda.judul')!;
    expect(k.revisiTerakhir).toMatchObject({ status: 'diajukan', idTeks: 'Hitung warisan dengan tenang dan benar' });
  });
});

test('reviewer: riwayat teks menayangkan lagi versi lama', async () => {
  const m = await siapkan();
  m.masukSebagai({ userId: 'u-a', email: 'a@x.id' });
  const baru = await m.diksi.buatDraf('beranda.judul', 'Judul baru yang lebih panjang', null, null);
  await m.diksi.ajukan(baru);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.diksi.setujui(baru);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  tampilkan(m, 'reviewer', 'u-r');
  const butir = await screen.findByRole('article', { name: 'Judul baru yang lebih panjang' });
  fireEvent.click(within(butir).getByRole('button', { name: 'Riwayat' }));
  fireEvent.click(await within(butir).findByRole('button', { name: 'Tayangkan lagi' }));
  await waitFor(async () => expect((await m.diksi.bacaTerbit()).find(t => t.kunci === 'beranda.judul')?.id).toBe('Hitung warisan dengan tenang'));
  vi.restoreAllMocks();
});

test('penulis: teks dikembalikan → buang perubahan, kembali ke teks tayang tanpa menyunting', async () => {
  const m = await siapkan();
  m.masukSebagai({ userId: 'u-p', email: 'p@x.id' });
  const revisiId = await m.diksi.buatDraf('beranda.judul', 'Judul salah', null, null);
  await m.diksi.ajukan(revisiId);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.diksi.kembalikan(revisiId, 'terlalu kaku');
  tampilkan(m, 'penulis', 'u-p');
  fireEvent.click(within(await screen.findByRole('article', { name: 'Judul salah' })).getByRole('button', { name: 'Sunting' }));
  expect(await screen.findByText('terlalu kaku', { exact: false })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'buang perubahan ini' }));
  await waitFor(async () => {
    expect((await m.diksi.daftarRevisi('beranda.judul')).find(r => r.id === revisiId)).toMatchObject({ status: 'dikembalikan', diabaikan: true });
  });
  expect(await screen.findByRole('article', { name: 'Hitung warisan dengan tenang' })).toBeTruthy();
});
