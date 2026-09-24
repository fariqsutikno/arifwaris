// Langkah 5: kondisi khusus yang didukung engine [SYF] — beda agama, membunuh pewaris [bab 02],
// dan munasakhat [bab 12]. Menerima Kasus; menyerahkan Kasus dengan field mawani' / urutanWafat terisi.
// Hamil & mafqud sengaja tidak ada (blocked, CLAUDE.md).

import { useState, type ReactNode } from 'react';
import type { IdOrang, Orang } from '@waris/engine';
import { hitungIsian } from '../checklist';
import type { Kasus } from '../kasus';
import { Tombol } from '../ui/komponen';
import { LangkahAhliWaris, labelOrangChecklist } from './LangkahAhliWaris';

interface Props { kasus: Kasus; ubah: (fungsiUbah: (kasus: Kasus) => Kasus) => void }

export function LangkahKondisi({ kasus, ubah }: Props) {
  const daftarAhliWaris = Object.values(hitungIsian(kasus.graf, kasus.graf.idPewaris)).flat() as IdOrang[];
  const ubahOrang = (idOrang: IdOrang, perubahan: Partial<Orang>) =>
    ubah(k => ({ ...k, graf: { ...k.graf, orang: { ...k.graf.orang, [idOrang]: { ...k.graf.orang[idOrang]!, ...perubahan } } } }));
  const label = (idOrang: IdOrang) => labelOrangChecklist(kasus.graf, kasus.graf.idPewaris, idOrang);

  return (
    <div className="tumpuk">
      <p className="keterangan">Nggak ada? Langsung aja gas hitung.</p>
      <Kondisi judul="Ada yang beda agama dengan almarhum" keterangan="Beda agama menggugurkan hak waris.">
        {daftarAhliWaris.map(id => (
          <Centang key={id} label={label(id)} tercentang={kasus.graf.orang[id]!.agama === 'nonIslam'}
            saatUbah={tercentang => ubahOrang(id, { agama: tercentang ? 'nonIslam' : 'islam' })} />
        ))}
      </Kondisi>
      <Kondisi judul="Ada yang terlibat dalam kematian almarhum" keterangan="Pembunuh nggak dapat warisan, apa pun bentuknya.">
        {daftarAhliWaris.map(id => (
          <Centang key={id} label={label(id)} tercentang={!!kasus.graf.orang[id]!.membunuhPewaris}
            saatUbah={tercentang => ubahOrang(id, { membunuhPewaris: tercentang })} />
        ))}
      </Kondisi>
      <PanelMunasakhat kasus={kasus} ubah={ubah} daftarAhliWaris={daftarAhliWaris} label={label} />
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
    <Kondisi judul="Ada ahli waris yang wafat sebelum harta dibagi" keterangan="Ini namanya munasakhat. Bagiannya diterusin ke ahli warisnya sendiri."
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

function Kondisi({ judul, keterangan, terbukaAwal = false, children }: { judul: string; keterangan: string; terbukaAwal?: boolean; children: ReactNode }) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);
  return (
    <div className="kartu tumpuk">
      <Centang label={judul} tercentang={terbuka} saatUbah={setTerbuka} />
      <p className="keterangan">{keterangan}</p>
      {terbuka && <div className="tumpuk">{children}</div>}
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
