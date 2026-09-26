// Riwayat revisi satu entri: daftar semua revisi (terbaru di atas) dengan status, pembuat, tanggal, catatan
// review, dan diff terhadap revisi yang sedang terbit. Rollback (terbitkanUlang) hanya ditawarkan untuk revisi
// berstatus disetujui yang bukan revisi terbit sekarang, mencerminkan penjaga SQL terbitkan_ulang_revisi
// (peran reviewer/admin) — database tetap penjaga sebenarnya, tombol ini cuma sinyal UI.
import { useEffect, useState } from 'react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanRevisi } from '@waris/data';
import { Tombol } from '@waris/web/ui/komponen';
import { diffBaris, teksBanding } from '../editor/diff';
import { usePortal, type RepoPortal } from '../repo';

export function RiwayatRevisi(props: { entriId: string; jenis: JenisKonten; revisiTerbitId: string | null; saatBerubah: () => void }) {
  const { repo, peran } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanRevisi[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    repo.konten.daftarRevisi(props.entriId)
      .then(hasil => { if (!dibatalkan) setDaftar(hasil); })
      .catch(e => { if (!dibatalkan) setGalat(pesan(e)); });
    return () => { dibatalkan = true; };
  }, [repo, props.entriId]);

  if (galat) return <p role="alert">{galat}</p>;
  if (!daftar) return null;
  const terbit = daftar.find(r => r.id === props.revisiTerbitId) ?? null;
  const bolehRollback = peran === 'reviewer' || peran === 'admin';

  return (
    <section>
      <h3>Riwayat revisi</h3>
      {[...daftar].reverse().map(revisi => (
        <BarisRiwayat
          key={revisi.id}
          revisi={revisi}
          jenis={props.jenis}
          terbit={terbit}
          sedangTerbit={revisi.id === props.revisiTerbitId}
          bolehRollback={bolehRollback}
          repo={repo}
          saatBerubah={props.saatBerubah}
        />
      ))}
    </section>
  );
}

function BarisRiwayat(props: {
  revisi: RingkasanRevisi; jenis: JenisKonten; terbit: RingkasanRevisi | null; sedangTerbit: boolean;
  bolehRollback: boolean; repo: RepoPortal; saatBerubah: () => void;
}) {
  const { revisi, jenis, terbit, sedangTerbit, bolehRollback } = props;
  const [tampilDiff, setTampilDiff] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const bolehTombolRollback = bolehRollback && revisi.status === 'disetujui' && !sedangTerbit;

  async function rollback() {
    if (!window.confirm(`Terbitkan ulang revisi ${revisi.id.slice(0, 8)}? Ini akan menggantikan revisi yang sedang terbit.`)) return;
    setGalat(null);
    try {
      await props.repo.editorial.terbitkanUlang(revisi.id);
      props.saatBerubah();
    } catch (e) {
      setGalat(pesan(e));
    }
  }

  return (
    <article aria-label={`revisi ${revisi.id.slice(0, 8)}`}>
      <p>
        {sedangTerbit ? 'terbit' : revisi.status} · {revisi.dibuatOleh.slice(0, 8)} · {revisi.dibuatPada}
      </p>
      {revisi.catatanReview ? <p>Catatan review: {revisi.catatanReview}</p> : null}
      {galat ? <p role="alert">{galat}</p> : null}
      <Tombol varian="secondary" onClick={() => setTampilDiff(v => !v)}>Lihat beda dengan terbit</Tombol>
      {tampilDiff ? (
        <pre>
          {diffBaris(terbit ? teksBanding(jenis, terbit.isi) : '', teksBanding(jenis, revisi.isi)).map((baris, i) => (
            <div key={i} className={`aw-diff-${baris.jenis}`}>{PENANDA_DIFF[baris.jenis]}{baris.teks}</div>
          ))}
        </pre>
      ) : null}
      {bolehTombolRollback ? <Tombol onClick={() => void rollback()}>Terbitkan ulang</Tombol> : null}
    </article>
  );
}

const PENANDA_DIFF = { sama: '  ', tambah: '+ ', hapus: '- ' } as const;
const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e));
