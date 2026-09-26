// Tanya jawab: kasus waris dan penyelesaiannya menurut ustadz atau fatwa. Beda dengan FAQ (pertanyaan konsep umum):
// di sini tiap entri adalah satu cerita kasus. `#/tanya-jawab/<id>` membuka satu kasus supaya bisa dibagikan.

import { useEffect } from 'react';
import { DAFTAR_TANYA_JAWAB } from '../../konten/tanyaJawab';
import { tautanTanyaJawab } from '../../rute';
import { Bagikan } from '../../ui/Bagikan';

export function TanyaJawab({ id }: { id?: string | undefined }) {
  useEffect(() => {
    if (id) document.getElementById(`tj-${id}`)?.scrollIntoView?.({ block: 'start' });
  }, [id]);

  return (
    <main className="halaman tumpuk halaman-faq">
      <h1>Tanya jawab</h1>
      <p className="lencana-draf">Contoh kasus masih placeholder</p>
      <p className="keterangan">Kasus waris sungguhan, seperti sengketa keluarga, beserta penyelesaiannya dari ustadz atau lembaga fatwa.</p>
      {DAFTAR_TANYA_JAWAB.map(entri => (
        <details key={entri.id} id={`tj-${entri.id}`} className="kartu-lipat entri-faq" open={entri.id === id}>
          <summary><b>{entri.judul}</b><span className="keterangan"> · {entri.jenis}</span></summary>
          <div className="isi-materi isi-lipat-faq">
            <h3>Kasus</h3><p>{entri.kasus}</p>
            <h3>Penyelesaian</h3><p>{entri.penyelesaian}</p>
            <p className="keterangan">Sumber: {entri.sumber}</p>
            <Bagikan judul={entri.judul} tautan={tautanTanyaJawab(entri.id)} label="Bagikan kasus ini" kecil />
          </div>
        </details>
      ))}
    </main>
  );
}
