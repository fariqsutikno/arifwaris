// Langkah 5: kondisi khusus yang didukung engine [SYF] — beda agama, membunuh pewaris [bab 02],
// dan munasakhat [bab 12]. Menerima Kasus; menyerahkan Kasus dengan field mawani' / urutanWafat terisi.
// Hamil & mafqud sengaja tidak ada (blocked, CLAUDE.md).

import { useState, type ReactNode } from 'react';
import type { IdOrang, Orang } from '@waris/engine';
import { hitungIsian } from '../checklist';
import type { Kasus } from '../kasus';
import { Tombol } from '../ui/komponen';
import { LangkahAhliWaris, labelOrangChecklist } from './LangkahAhliWaris';

const TAMPILKAN_MUNASAKHAT = false;

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

export function LangkahKondisi({ kasus, ubah }: Props) {
  // Ahli waris pewaris asal dan tiap mayit munasakhat, masing-masing dinamai relatif ke mayit tempat ia pertama muncul.
  const mayitDari: Record<IdOrang, IdOrang> = {};
  for (const idMayit of [kasus.graf.idPewaris, ...kasus.urutanWafat]) {
    for (const idOrang of Object.values(hitungIsian(kasus.graf, idMayit)).flat() as IdOrang[]) {
      if (idOrang !== kasus.graf.idPewaris && !mayitDari[idOrang]) mayitDari[idOrang] = idMayit;
    }
  }
  const semuaAhliWaris = Object.keys(mayitDari);
  const daftarAhliWaris = Object.values(hitungIsian(kasus.graf, kasus.graf.idPewaris)).flat() as IdOrang[];
  const ubahOrang = (idOrang: IdOrang, perubahan: Partial<Orang>) =>
    ubah(k => ({ ...k, graf: { ...k.graf, orang: { ...k.graf.orang, [idOrang]: { ...k.graf.orang[idOrang]!, ...perubahan } } } }));
  const labelDasar = (idOrang: IdOrang) => labelOrangChecklist(kasus.graf, mayitDari[idOrang] ?? kasus.graf.idPewaris, idOrang);
  const label = (idOrang: IdOrang) => {
    const idMayit = mayitDari[idOrang];
    return idMayit && idMayit !== kasus.graf.idPewaris ? `${labelDasar(idOrang)} (ahli waris ${labelDasar(idMayit)})` : labelDasar(idOrang);
  };

  const adaTerisi = kasus.urutanWafat.length > 0
    || semuaAhliWaris.some(id => kasus.graf.orang[id]!.agama === 'nonIslam' || kasus.graf.orang[id]!.membunuhPewaris);
  const [adaKondisi, setAdaKondisi] = useState(adaTerisi);
  // "Tidak ada" berarti benar-benar tidak ada: kondisi yang sempat dicentang dibersihkan supaya hasil tidak berubah diam-diam.
  const pilihTidakAda = () => {
    setAdaKondisi(false);
    ubah(k => ({
      ...k,
      urutanWafat: [],
      graf: { ...k.graf, orang: Object.fromEntries(Object.entries(k.graf.orang).map(([id, orang]) =>
        [id, id === k.graf.idPewaris ? orang : { ...orang, agama: orang.agama === 'nonIslam' ? 'islam' : orang.agama, membunuhPewaris: false }])) },
    }));
  };

  return (
    <div className="tumpuk">
      <div className="kartu-pilihan-deret ringkas" role="radiogroup" aria-labelledby="pertanyaan-utama">
        <button type="button" role="radio" aria-checked={!adaKondisi} className="kartu-pilihan kecil" onClick={pilihTidakAda}>
          <span>Tidak ada</span><small>Langsung lihat hasil.</small>
        </button>
        <button type="button" role="radio" aria-checked={adaKondisi} className="kartu-pilihan kecil" onClick={() => setAdaKondisi(true)}>
          <span>Ada</span><small>Beda agama atau terlibat dalam kematian almarhum.</small>
        </button>
      </div>
      {adaKondisi && <>
      <Kondisi judul="Ada yang beda agama dengan almarhum" keterangan="Beda agama menggugurkan hak waris."
        akibat="orang itu tidak mendapat bagian, dan pembagian yang lain ikut berubah.">
        {semuaAhliWaris.map(id => (
          <Centang key={id} label={label(id)} tercentang={kasus.graf.orang[id]!.agama === 'nonIslam'}
            saatUbah={tercentang => ubahOrang(id, { agama: tercentang ? 'nonIslam' : 'islam' })} />
        ))}
      </Kondisi>
      <Kondisi judul="Ada yang terlibat dalam kematian almarhum" keterangan="Apa pun bentuknya."
        akibat="orang itu tidak mendapat bagian, dan pembagian yang lain ikut berubah.">
        {daftarAhliWaris.map(id => (
          <Centang key={id} label={label(id)} tercentang={!!kasus.graf.orang[id]!.membunuhPewaris}
            saatUbah={tercentang => ubahOrang(id, { membunuhPewaris: tercentang })} />
        ))}
      </Kondisi>
      {/* Munasakhat disembunyikan sementara dari UI; engine & panel tetap ada. */}
      {TAMPILKAN_MUNASAKHAT && <PanelMunasakhat kasus={kasus} ubah={ubah} daftarAhliWaris={daftarAhliWaris} label={label} />}
      </>}
    </div>
  );
}

function PanelMunasakhat({ kasus, ubah, daftarAhliWaris, label }: Props & { daftarAhliWaris: IdOrang[]; label: (id: IdOrang) => string }) {
  const urutan = kasus.urutanWafat;
  const aturUrutan = (urutanBaru: IdOrang[]) => ubah(k => ({ ...k, urutanWafat: urutanBaru }));
  const geser = (indeks: number, arah: -1 | 1) => {
    const baru = [...urutan];
    [baru[indeks], baru[indeks + arah]] = [baru[indeks + arah]!, baru[indeks]!];
    aturUrutan(baru);
  };
  return (
    <Kondisi judul="Ada ahli waris yang wafat sebelum harta dibagi" keterangan="Ini namanya munasakhat."
      akibat="bagian orang itu diteruskan ke ahli warisnya sendiri, dihitung bertingkat."
      terbukaAwal={urutan.length > 0}>
      {daftarAhliWaris.map(id => (
        <Centang key={id} label={label(id)} tercentang={urutan.includes(id)}
          saatUbah={tercentang => aturUrutan(tercentang ? [...urutan, id] : urutan.filter(idLain => idLain !== id))} />
      ))}
      {urutan.length > 1 && <p className="keterangan">Urutin dari yang wafat duluan.</p>}
      {urutan.map((idMayit, indeks) => (
        <section key={idMayit} className="kartu tumpuk">
          <div className="chip-deret" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="judul-langkah" style={{ fontSize: 20 }}>{indeks + 1}. Ahli waris {label(idMayit)}</h2>
            {urutan.length > 1 && (
              <span className="chip-deret">
                <Tombol varian="secondary" kecil disabled={indeks === 0} onClick={() => geser(indeks, -1)} aria-label={`Naikkan ${label(idMayit)}`}>↑</Tombol>
                <Tombol varian="secondary" kecil disabled={indeks === urutan.length - 1} onClick={() => geser(indeks, 1)} aria-label={`Turunkan ${label(idMayit)}`}>↓</Tombol>
              </span>
            )}
          </div>
          <LangkahAhliWaris graf={kasus.graf} idMayit={idMayit} ubahGraf={ubahGraf => ubah(k => ({ ...k, graf: ubahGraf(k.graf) }))} />
        </section>
      ))}
    </Kondisi>
  );
}

function Kondisi({ judul, keterangan, akibat, terbukaAwal = false, children }: {
  judul: string; keterangan: string; akibat: string; terbukaAwal?: boolean; children: ReactNode;
}) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);
  return (
    <div className={terbuka ? 'kondisi terbuka' : 'kondisi'}>
      <label className="kondisi-kepala">
        <input type="checkbox" checked={terbuka} onChange={event => setTerbuka(event.target.checked)} />
        <span><b>{judul}</b><small>{keterangan}</small><span className="akibat"><em>Akibatnya:</em> {akibat}</span></span>
      </label>
      {terbuka && <div className="kondisi-isi">{children}</div>}
    </div>
  );
}

function Centang({ label, tercentang, saatUbah }: { label: string; tercentang: boolean; saatUbah: (tercentang: boolean) => void }) {
  return (
    <label className="centang">
      <input type="checkbox" checked={tercentang} onChange={event => saatUbah(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
