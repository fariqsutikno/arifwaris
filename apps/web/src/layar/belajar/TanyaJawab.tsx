// Tanya jawab: kasus waris dan penyelesaiannya menurut ustadz atau fatwa, dibaca sebagai artikel. Beda dengan FAQ
// (pertanyaan konsep umum): tiap entri adalah satu cerita kasus.
// `#/tanya-jawab` = daftar (cari + chip kategori); `#/tanya-jawab/<id>` = artikel, bisa dibagikan dan diatur ukuran hurufnya.

import { useState } from 'react';
import { DAFTAR_TANYA_JAWAB, JENIS_TANYA_JAWAB, type JenisTanyaJawab, type KasusTanyaJawab } from '../../konten/tanyaJawab';
import { UKURAN_BACA, bacaUkuranBaca, simpanUkuranBaca } from '../../preferensi';
import { tautanTanyaJawab } from '../../rute';
import { Bagikan } from '../../ui/Bagikan';

export function TanyaJawab({ id }: { id?: string | undefined }) {
  if (!id) return <DaftarTanyaJawab />;
  const entri = DAFTAR_TANYA_JAWAB.find(kasus => kasus.id === id);
  if (!entri) return <main className="halaman tumpuk"><p role="alert">Kasus ini tidak ditemukan.</p><a href={tautanTanyaJawab()}>Semua kasus</a></main>;
  return <ArtikelTanyaJawab entri={entri} />;
}

function DaftarTanyaJawab() {
  const [kataKunci, setKataKunci] = useState('');
  const [jenis, setJenis] = useState<JenisTanyaJawab | null>(null);
  const cari = normal(kataKunci.trim());
  const cocok = DAFTAR_TANYA_JAWAB.filter(entri => (!jenis || entri.jenis === jenis) && normal(teksCari(entri)).includes(cari));
  return (
    <main className="halaman tumpuk halaman-faq">
      <h1>Tanya jawab</h1>
      <p className="lead">Kasus waris sungguhan, seperti sengketa keluarga, beserta penyelesaiannya dari ustadz atau lembaga fatwa.</p>
      <p className="lencana-draf">Contoh kasus masih placeholder</p>
      <label className="isian">
        Cari kasus
        <input type="search" value={kataKunci} onChange={event => setKataKunci(event.target.value)} placeholder="mis. rumah, sengketa, anak tiri" />
      </label>
      <div className="chip-deret" role="group" aria-label="Kategori">
        <button type="button" className="chip-kecil" aria-pressed={jenis === null} onClick={() => setJenis(null)}>Semua</button>
        {JENIS_TANYA_JAWAB.map(pilihan => (
          <button key={pilihan} type="button" className="chip-kecil" aria-pressed={jenis === pilihan} onClick={() => setJenis(pilihan)}>{pilihan}</button>
        ))}
      </div>
      {cocok.length === 0 && <p className="keterangan">Belum ada kasus yang cocok. Coba kata atau kategori lain.</p>}
      <ul className="daftar-polos tumpuk-rapat">
        {cocok.map(entri => (
          <li key={entri.id}>
            <a className="kartu-artikel" href={tautanTanyaJawab(entri.id)}>
              <span className="chip-jenis">{entri.jenis}</span>
              <b>{entri.judul}</b>
              <span className="keterangan">{entri.ringkasan}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

function ArtikelTanyaJawab({ entri }: { entri: KasusTanyaJawab }) {
  const [ukuran, setUkuran] = useState(bacaUkuranBaca);
  const posisi = UKURAN_BACA.indexOf(ukuran as (typeof UKURAN_BACA)[number]);
  const ubahUkuran = (arah: -1 | 1) => {
    const baru = UKURAN_BACA[posisi + arah];
    if (baru) { setUkuran(baru); simpanUkuranBaca(baru); }
  };
  return (
    <main className="halaman artikel-tj">
      <span className="chip-jenis">{entri.jenis}</span>
      <h1>{entri.judul}</h1>
      <div className="meta-artikel">
        <span className="keterangan">Sumber: {entri.sumber}</span>
        <span className="pengisi" />
        <div className="atur-huruf" role="group" aria-label="Ukuran huruf">
          <button type="button" className="chip-kecil" onClick={() => ubahUkuran(-1)} disabled={posisi <= 0} aria-label="Perkecil huruf">A−</button>
          <button type="button" className="chip-kecil" onClick={() => ubahUkuran(1)} disabled={posisi >= UKURAN_BACA.length - 1} aria-label="Perbesar huruf">A+</button>
        </div>
      </div>
      <p className="lencana-draf">Contoh kasus masih placeholder</p>
      <article className="isi-materi isi-artikel" style={{ fontSize: ukuran }}>
        <h2>Kasus</h2>
        {entri.kasus.map(paragraf => <p key={paragraf}>{paragraf}</p>)}
        <h2>Penyelesaian</h2>
        {entri.penyelesaian.map(paragraf => <p key={paragraf}>{paragraf}</p>)}
      </article>
      <Bagikan judul={entri.judul} tautan={tautanTanyaJawab(entri.id)} label="Bagikan kasus ini" />
    </main>
  );
}

const normal = (teks: string) => teks.toLowerCase().replace(/['’]/g, '');
const teksCari = (entri: KasusTanyaJawab) => [entri.judul, entri.ringkasan, ...entri.kasus, ...entri.penyelesaian].join(' ');
