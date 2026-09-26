// Layar editor diksi: tabel semua kunci dikelompokkan per halaman, dengan filter Arab kosong/belum terbit/cari.
// Penulis & admin mengubah kolom Indonesia/Arab satu baris lalu "Simpan & ajukan" (buatDraf lalu ajukan langsung);
// reviewer melihat sel baca-saja. Bila buatDraf sukses tapi ajukan gagal, galat ditampilkan dan daftar dimuat ulang
// (draf sudah tersimpan di database walau belum diajukan). Data dari repo.diksi.daftarKunci(). Tiap baris juga
// punya toggle "Riwayat" (repo.diksi.daftarRevisi) dengan rollback (terbitkanUlang) untuk reviewer/admin, mengikuti
// pola RiwayatRevisi.tsx.
import { useEffect, useState } from 'react';
import type { Peran } from '@waris/content';
import type { DiksiTerbit, RingkasanKunciDiksi, RingkasanRevisiDiksi } from '@waris/data';
import { Tombol } from '@waris/web/ui/komponen';
import { usePortal } from '../repo';

type StatusTampil = 'terbit' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit + draf';

interface SaringDiksi { halaman?: string; arKosong?: boolean; belumTerbit?: boolean; cari?: string }

/** Status ringkas satu kunci untuk ditampilkan, sama semantiknya dengan statusTampil di DaftarKonten. `DiksiTerbit.id`
 * adalah teks id yang terbit (bukan id revisi), jadi "terbit" dikenali dari status revisi terakhir, bukan dari
 * membandingkan id. */
function statusTampilDiksi(k: RingkasanKunciDiksi): StatusTampil {
  const { terbit, revisiTerakhir } = k;
  if (!revisiTerakhir) return terbit ? 'terbit' : 'draf';
  if (revisiTerakhir.status === 'disetujui') return 'terbit';
  if (terbit) return 'terbit + draf';
  if (revisiTerakhir.status === 'diajukan') return 'diajukan';
  if (revisiTerakhir.status === 'draf') return 'draf';
  return 'dikembalikan';
}

const idTeksTampil = (k: RingkasanKunciDiksi): string => k.revisiTerakhir?.idTeks ?? k.terbit?.id ?? '';
const arTeksTampil = (k: RingkasanKunciDiksi): string => k.revisiTerakhir?.arTeks ?? k.terbit?.ar ?? '';

/** Filter murni dipakai layar & tes. `arKosong`: teks Arab terbit kosong/null. `belumTerbit`: belum pernah terbit
 * sama sekali, atau revisi terakhirnya bukan yang disetujui. `cari`: cocok di kunci atau teks Indonesia. */
export function saringDiksi(daftar: RingkasanKunciDiksi[], saring: SaringDiksi): RingkasanKunciDiksi[] {
  const cari = saring.cari?.trim().toLowerCase();
  return daftar.filter(k => {
    if (saring.halaman && k.halaman !== saring.halaman) return false;
    if (saring.arKosong && k.terbit?.ar) return false;
    if (saring.belumTerbit) {
      const belumTerbit = !k.terbit || (k.revisiTerakhir != null && k.revisiTerakhir.status !== 'disetujui');
      if (!belumTerbit) return false;
    }
    if (cari && !k.kunci.toLowerCase().includes(cari) && !idTeksTampil(k).toLowerCase().includes(cari)) return false;
    return true;
  });
}

export function EditorDiksi() {
  const { repo, peran } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanKunciDiksi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [halaman, setHalaman] = useState('');
  const [arKosong, setArKosong] = useState(false);
  const [belumTerbit, setBelumTerbit] = useState(false);
  const [cari, setCari] = useState('');
  const bolehEdit = peran === 'penulis' || peran === 'admin';

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    repo.diksi.daftarKunci()
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, muatUlang]);

  if (galat) return <p role="alert">{galat}</p>;
  if (!daftar) return null;

  const tampil = saringDiksi(daftar, halaman ? { halaman, arKosong, belumTerbit, cari } : { arKosong, belumTerbit, cari });
  const daftarHalaman = [...new Set(daftar.map(k => k.halaman))];
  const kelompok = kelompokkanPerHalaman(tampil);

  return (
    <div>
      <h2>Diksi</h2>
      <label>
        Halaman{' '}
        <select value={halaman} onChange={e => setHalaman(e.target.value)}>
          <option value="">Semua</option>
          {daftarHalaman.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </label>{' '}
      <label>
        <input type="checkbox" checked={arKosong} onChange={e => setArKosong(e.target.checked)} /> Arab kosong
      </label>{' '}
      <label>
        <input type="checkbox" checked={belumTerbit} onChange={e => setBelumTerbit(e.target.checked)} /> Belum terbit
      </label>{' '}
      <label>
        Cari{' '}
        <input value={cari} onChange={e => setCari(e.target.value)} />
      </label>
      {kelompok.map(([h, baris]) => (
        <table key={h}>
          <caption>{h}</caption>
          <thead><tr><th>Kunci</th><th>Indonesia</th><th>Arab</th><th>Status</th>{bolehEdit ? <th /> : null}<th /></tr></thead>
          <tbody>
            {baris.map(k => (
              <BarisDiksi
                key={k.kunci} k={k} bolehEdit={bolehEdit} peran={peran}
                onSimpanSelesai={() => setMuatUlang(n => n + 1)}
              />
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}

function kelompokkanPerHalaman(daftar: RingkasanKunciDiksi[]): [string, RingkasanKunciDiksi[]][] {
  const peta = new Map<string, RingkasanKunciDiksi[]>();
  for (const k of daftar) {
    const kelompok = peta.get(k.halaman) ?? [];
    kelompok.push(k);
    peta.set(k.halaman, kelompok);
  }
  return [...peta.entries()];
}

function BarisDiksi(
  { k, bolehEdit, peran, onSimpanSelesai }:
  { k: RingkasanKunciDiksi; bolehEdit: boolean; peran: Peran; onSimpanSelesai: () => void },
) {
  const { repo } = usePortal();
  const [idTeks, setIdTeks] = useState(idTeksTampil(k));
  const [arTeks, setArTeks] = useState(arTeksTampil(k));
  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [riwayatTerbuka, setRiwayatTerbuka] = useState(false);
  const berubah = idTeks !== idTeksTampil(k) || arTeks !== arTeksTampil(k);
  const jumlahKolom = 4 + (bolehEdit ? 1 : 0) + 1;

  async function simpanDanAjukan() {
    setGalat(null);
    setMenyimpan(true);
    let idRevisi: string;
    try {
      idRevisi = await repo.diksi.buatDraf(k.kunci, idTeks, arTeks || null, null);
    } catch (e) {
      setGalat(pesan(e));
      setMenyimpan(false);
      return;
    }
    try {
      await repo.diksi.ajukan(idRevisi);
    } catch (e) {
      setGalat(pesan(e));
    } finally {
      setMenyimpan(false);
      onSimpanSelesai(); // draf sudah tersimpan meski ajukan gagal → muat ulang agar daftar mencerminkannya.
    }
  }

  return (
    <>
      <tr className={berubah ? 'aw-baris-berubah' : undefined}>
        <td>{k.kunci}</td>
        <td>{bolehEdit ? <input aria-label={`Indonesia ${k.kunci}`} value={idTeks} onChange={e => setIdTeks(e.target.value)} /> : idTeks}</td>
        <td>{bolehEdit ? <input aria-label={`Arab ${k.kunci}`} dir="rtl" value={arTeks} onChange={e => setArTeks(e.target.value)} /> : arTeks}</td>
        <td>{statusTampilDiksi(k)}</td>
        {bolehEdit ? (
          <td>
            {galat ? <span role="alert">{galat}</span> : null}
            <Tombol disabled={!berubah || menyimpan} onClick={() => void simpanDanAjukan()}>Simpan &amp; ajukan</Tombol>
          </td>
        ) : null}
        <td>
          <Tombol varian="secondary" onClick={() => setRiwayatTerbuka(v => !v)}>Riwayat</Tombol>
        </td>
      </tr>
      {riwayatTerbuka ? (
        <tr>
          <td colSpan={jumlahKolom}>
            <RiwayatDiksi kunci={k.kunci} terbit={k.terbit} peran={peran} saatBerubah={onSimpanSelesai} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Riwayat revisi satu kunci diksi, terbaru di atas, dengan rollback (terbitkanUlang) untuk reviewer/admin.
 * `DiksiTerbit` cuma menyimpan teks yang terbit (bukan id revisi, beda dari `RingkasanEntri.revisiTerbitId`),
 * jadi revisi yang sedang "terbit" dikenali sebagai revisi *disetujui terbaru* yang idTeks & arTeks-nya persis
 * sama dengan teks terbit sekarang — bukan pencarian id, karena id itu tidak tersedia di sini. */
function RiwayatDiksi(
  { kunci, terbit, peran, saatBerubah }:
  { kunci: string; terbit: DiksiTerbit | null; peran: Peran; saatBerubah: () => void },
) {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanRevisiDiksi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    repo.diksi.daftarRevisi(kunci)
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, kunci]);

  if (galat) return <p role="alert">{galat}</p>;
  if (!daftar) return null;
  const bolehRollback = peran === 'reviewer' || peran === 'admin';
  const idTerbit = terbit
    ? [...daftar].reverse().find(r => r.status === 'disetujui' && r.idTeks === terbit.id && (r.arTeks ?? null) === terbit.ar)?.id ?? null
    : null;

  return (
    <div>
      {[...daftar].reverse().map(revisi => (
        <BarisRiwayatDiksi
          key={revisi.id} revisi={revisi} sedangTerbit={revisi.id === idTerbit}
          bolehRollback={bolehRollback} saatBerubah={saatBerubah}
        />
      ))}
    </div>
  );
}

function BarisRiwayatDiksi(
  { revisi, sedangTerbit, bolehRollback, saatBerubah }:
  { revisi: RingkasanRevisiDiksi; sedangTerbit: boolean; bolehRollback: boolean; saatBerubah: () => void },
) {
  const { repo } = usePortal();
  const [galat, setGalat] = useState<string | null>(null);
  const bolehTombolRollback = bolehRollback && revisi.status === 'disetujui' && !sedangTerbit;

  async function rollback() {
    if (!window.confirm(`Terbitkan ulang revisi ${revisi.id.slice(0, 8)}? Ini akan menggantikan revisi yang sedang terbit.`)) return;
    setGalat(null);
    try {
      await repo.diksi.terbitkanUlang(revisi.id);
      saatBerubah();
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  return (
    <article aria-label={`revisi ${revisi.id.slice(0, 8)}`}>
      <p>
        {sedangTerbit ? 'terbit' : revisi.status} · id: {revisi.idTeks} · ar: {revisi.arTeks ?? ''}
      </p>
      {revisi.catatanReview ? <p>Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert">{galat}</p> : null}
      {bolehTombolRollback ? <Tombol onClick={() => void rollback()}>Terbitkan ulang</Tombol> : null}
    </article>
  );
}

const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));
