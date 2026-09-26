// Layar editor diksi: tabel semua kunci dikelompokkan per halaman, dengan filter Arab kosong/belum terbit/cari.
// Penulis & admin mengubah kolom Indonesia/Arab satu baris lalu "Simpan & ajukan" (buatDraf lalu ajukan langsung);
// reviewer melihat sel baca-saja. Bila buatDraf sukses tapi ajukan gagal, galat ditampilkan dan daftar dimuat ulang
// (draf sudah tersimpan di database walau belum diajukan). Data dari repo.diksi.daftarKunci().
import { useEffect, useState } from 'react';
import type { RingkasanKunciDiksi } from '@waris/data';
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
          <thead><tr><th>Kunci</th><th>Indonesia</th><th>Arab</th><th>Status</th>{bolehEdit ? <th /> : null}</tr></thead>
          <tbody>
            {baris.map(k => (
              <BarisDiksi key={k.kunci} k={k} bolehEdit={bolehEdit} onSimpanSelesai={() => setMuatUlang(n => n + 1)} />
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
  { k, bolehEdit, onSimpanSelesai }: { k: RingkasanKunciDiksi; bolehEdit: boolean; onSimpanSelesai: () => void },
) {
  const { repo } = usePortal();
  const [idTeks, setIdTeks] = useState(idTeksTampil(k));
  const [arTeks, setArTeks] = useState(arTeksTampil(k));
  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const berubah = idTeks !== idTeksTampil(k) || arTeks !== arTeksTampil(k);

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
    </tr>
  );
}

const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));
