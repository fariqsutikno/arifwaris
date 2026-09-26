// Antrean review: memuat revisi berstatus diajukan dari editorial (konten) & diksi, lalu menampilkan tiap butir
// dengan diff terhadap versi terbitnya (konten: revisi terbit entri; diksi: teks terbit kunci; belum ada → semua
// baris tambah). Tombol Setujui/Kembalikan hanya tampil bila transisiRevisi mengizinkan (UI saja; database tetap
// penjaga); revisi milik sendiri berlabel "revisi Anda". Galat repo ditampilkan di butir yang bersangkutan.
import { useEffect, useState } from 'react';
import { bacaIsi, transisiRevisi, JENIS_KONTEN, type JenisKonten, type StatusRevisi } from '@waris/content';
import type { DiksiTerbit, RingkasanEntri } from '@waris/data';
import { Tombol } from '@waris/web/ui/komponen';
import { diffBaris, teksBanding } from '../editor/diff';
import { usePortal } from '../repo';
import { Pratinjau } from './Pratinjau';

interface Butir {
  id: string;
  judul: string;
  status: StatusRevisi;
  dibuatOleh: string;
  teksLama: string;
  teksBaru: string;
  konten: { jenis: JenisKonten; slug: string; isi: unknown } | null;
  setujui: () => Promise<void>;
  kembalikan: (catatan: string) => Promise<void>;
}

export function AntreanReview() {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<Butir[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      const [revisiKonten, revisiDiksi, kunciDiksi, entri] = await Promise.all([
        repo.editorial.antreanReview(),
        repo.diksi.antreanReview(),
        repo.diksi.daftarKunci(),
        // ponytail: memindai daftarEntri semua jenis untuk menemukan jenis/slug entri (sama seperti EditorEntri).
        Promise.all(JENIS_KONTEN.map(jenis => repo.konten.daftarEntri(jenis))).then(d => d.flat()),
      ]);
      const butirKonten = await Promise.all(revisiKonten.map(async (revisi): Promise<Butir> => {
        const e = entri.find(x => x.entriId === revisi.entriId);
        if (!e) throw new Error(`entri ${revisi.entriId} tidak ditemukan`);
        const basis = await basisTerbit(e);
        return {
          id: revisi.id, judul: `${e.jenis}: ${e.slug}`, status: revisi.status, dibuatOleh: revisi.dibuatOleh,
          teksLama: basis === null ? '' : teksBanding(e.jenis, basis), teksBaru: teksBanding(e.jenis, revisi.isi),
          konten: { jenis: e.jenis, slug: e.slug, isi: revisi.isi },
          setujui: () => repo.editorial.setujui(revisi.id),
          kembalikan: catatan => repo.editorial.kembalikan(revisi.id, catatan),
        };
      }));
      const butirDiksi = revisiDiksi.map((revisi): Butir => {
        const terbit = kunciDiksi.find(k => k.kunci === revisi.kunci)?.terbit ?? null;
        return {
          id: revisi.id, judul: `diksi: ${revisi.kunci}`, status: revisi.status, dibuatOleh: revisi.dibuatOleh,
          teksLama: terbit ? teksDiksi(terbit) : '', teksBaru: teksDiksi({ id: revisi.idTeks, ar: revisi.arTeks }),
          konten: null,
          setujui: () => repo.diksi.setujui(revisi.id),
          kembalikan: catatan => repo.diksi.kembalikan(revisi.id, catatan),
        };
      });
      if (!dibatalkan) setDaftar([...butirKonten, ...butirDiksi]);
    })().catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };

    async function basisTerbit(e: RingkasanEntri): Promise<unknown> {
      const revisi = await repo.konten.daftarRevisi(e.entriId);
      const terbit = revisi.find(r => r.id === e.revisiTerbitId) ?? revisi.filter(r => r.status === 'disetujui').at(-1);
      return terbit?.isi ?? null;
    }
  }, [repo, muatUlang]);

  if (galat) return <p role="alert">{galat}</p>;
  if (!daftar) return null;
  if (daftar.length === 0) return <p>Antrean review kosong.</p>;
  return (
    <div>
      {daftar.map(butir => <ButirReview key={butir.id} butir={butir} saatSelesai={() => setMuatUlang(n => n + 1)} />)}
    </div>
  );
}

function ButirReview({ butir, saatSelesai }: { butir: Butir; saatSelesai: () => void }) {
  const { sesi, peran } = usePortal();
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [pratinjau, setPratinjau] = useState(false);
  const pelaku = { peran, pelakuId: sesi.userId, pembuatId: butir.dibuatOleh, status: butir.status };
  const bolehPeriksa = transisiRevisi({ ...pelaku, aksi: 'setujui' }).ok;
  const bolehKembalikan = transisiRevisi({ ...pelaku, aksi: 'kembalikan', catatan }).ok;
  const idJudul = `review-${butir.id}`;

  async function jalankan(aksi: () => Promise<void>) {
    setGalat(null);
    try {
      await aksi();
      saatSelesai();
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  return (
    <article aria-labelledby={idJudul}>
      <h3 id={idJudul}>{butir.judul}</h3>
      {butir.dibuatOleh === sesi.userId ? <p>revisi Anda</p> : null}
      {galat ? <p role="alert">{galat}</p> : null}
      <pre>
        {diffBaris(butir.teksLama, butir.teksBaru).map((baris, i) => (
          <div key={i} className={`aw-diff-${baris.jenis}`}>{PENANDA_DIFF[baris.jenis]}{baris.teks}</div>
        ))}
      </pre>
      {butir.konten ? <Tombol varian="secondary" onClick={() => setPratinjau(true)}>Pratinjau</Tombol> : null}
      {pratinjau && butir.konten ? <PratinjauButir {...butir.konten} saatTutup={() => setPratinjau(false)} /> : null}
      {bolehPeriksa ? (
        <div>
          <Tombol onClick={() => void jalankan(butir.setujui)}>Setujui</Tombol>
          <label style={{ display: 'block' }}>
            Catatan
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} />
          </label>
          <Tombol varian="secondary" disabled={!bolehKembalikan} onClick={() => void jalankan(() => butir.kembalikan(catatan))}>Kembalikan</Tombol>
        </div>
      ) : null}
    </article>
  );
}

function PratinjauButir({ jenis, slug, isi, saatTutup }: { jenis: JenisKonten; slug: string; isi: unknown; saatTutup: () => void }) {
  const hasil = bacaIsi(jenis, isi);
  if (!hasil.ok) return <p role="alert">isi revisi tidak sah: {hasil.galat}</p>;
  return <Pratinjau jenis={jenis} slug={slug} isi={hasil.isi} saatTutup={saatTutup} />;
}

const PENANDA_DIFF = { sama: '  ', tambah: '+ ', hapus: '- ' } as const;
const teksDiksi = (d: Pick<DiksiTerbit, 'id' | 'ar'>) => `id: ${d.id}\nar: ${d.ar ?? ''}`;
const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));
