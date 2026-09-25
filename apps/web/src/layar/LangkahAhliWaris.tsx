// Langkah 4: isian ahli waris relatif ke satu mayit, berupa daftar baris "− jumlah +".
// Keluarga inti selalu tampil; kerabat lain bisa dilipat, dan selalu terbuka bila sudah ada isinya supaya tidak ada yang tersembunyi.
// Menyerahkan graf baru lewat ubahGraf.

import { useState } from 'react';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { daftarInduk, hitungIsian, INDUK_BARU_WAFAT, jenisDari, kurangiAhliWaris, tambahAhliWaris, ubahNama } from '../checklist';
import { INFO_TIDAK_ADA, KELUARGA_INTI, KERABAT_LAIN, KETERANGAN_HUBUNGAN, LABEL_SEHARI, sebutAlmarhum } from '../konten/ahliWaris';
import { TombolIkon } from '../ui/Tooltip';

interface Props { graf: GrafKeluarga; idMayit: IdOrang; ubahGraf: (ubah: (graf: GrafKeluarga) => GrafKeluarga) => void }

export function LangkahAhliWaris({ graf, idMayit, ubahGraf }: Props) {
  const [pesan, setPesan] = useState<string | null>(null);
  const [kerabatLainDibuka, setKerabatLainDibuka] = useState(false);
  const isian = hitungIsian(graf, idMayit);
  const jenisKelaminMayit = graf.orang[idMayit]!.jenisKelamin;
  const adaKerabatLain = KERABAT_LAIN.some(kelompok => kelompok.pilihan.some(kunci => (isian[kunci]?.length ?? 0) > 0));
  const kerabatLainTerbuka = kerabatLainDibuka || adaKerabatLain;

  const coba = (ubah: (graf: GrafKeluarga) => GrafKeluarga) => {
    try {
      ubahGraf(ubah);
      setPesan(null);
    } catch (galat) {
      setPesan(galat instanceof Error ? galat.message : String(galat));
    }
  };
  const baris = (kunci: KunciAhliWaris) => (
    <BarisJumlah key={kunci} kunci={kunci} graf={graf} idMayit={idMayit} daftarOrang={isian[kunci] ?? []}
      saatTambah={idInduk => coba(g => tambahAhliWaris(g, idMayit, kunci, idInduk ? { idInduk } : {}))}
      saatKurang={() => coba(g => kurangiAhliWaris(g, idMayit, kunci))}
      saatUbahNama={(idOrang, nama) => coba(g => ubahNama(g, idOrang, nama))} />
  );
  const tampilUntukMayit = (kunci: KunciAhliWaris) => {
    const hanyaUntuk = jenisDari(kunci)?.hanyaUntuk;
    return !hanyaUntuk || hanyaUntuk === jenisKelaminMayit;
  };

  return (
    <div className="isian-ahli-waris">
      {pesan && <p className="isian-salah" role="alert">{pesan}</p>}

      <section className="kelompok-kerabat" aria-labelledby={`judul-inti-${idMayit}`}>
        <h3 id={`judul-inti-${idMayit}`} className="judul-bagian-kecil">Keluarga inti</h3>
        <ul className="daftar-jumlah">{KELUARGA_INTI.filter(tampilUntukMayit).map(baris)}</ul>
      </section>

      <button type="button" className="buka-kerabat" aria-expanded={kerabatLainTerbuka} disabled={adaKerabatLain}
        onClick={() => setKerabatLainDibuka(!kerabatLainDibuka)}>
        Kerabat lain {kerabatLainTerbuka ? '▴' : '▾'}
        <small>{adaKerabatLain ? 'Tetap terbuka karena sudah ada yang diisi' : 'kakek-nenek, cucu, kakak/adik, paman, keponakan'}</small>
      </button>

      {kerabatLainTerbuka && KERABAT_LAIN.map(kelompok => (
        <section key={kelompok.judul} className="kelompok-kerabat" aria-label={sebutAlmarhum(kelompok.judul, jenisKelaminMayit)}>
          <h3 className="judul-bagian-kecil">{sebutAlmarhum(kelompok.judul, jenisKelaminMayit)}</h3>
          <ul className="daftar-jumlah">{kelompok.pilihan.map(baris)}</ul>
        </section>
      ))}

      {kerabatLainTerbuka && (
        <details className="info-tidak-ada">
          <summary>{INFO_TIDAK_ADA.judul}</summary>
          <p>{INFO_TIDAK_ADA.isi}</p>
        </details>
      )}
    </div>
  );
}

/** Contoh di placeholder isian nama, bergantian supaya tiap baris terasa beda. */
const CONTOH_NAMA = { L: ['Ahmad', 'Hasan', 'Umar'], P: ['Fatimah', 'Aisyah', 'Khadijah'] } as const;

/** Satu baris: label + keterangan hubungan, lalu "− jumlah +". Ikon pensil membuka isian nama per orang.
 * Kerabat bertingkat (cucu, keponakan, sepupu): pilih "dari siapa" sebelum menambah, termasuk induk lain yang sudah wafat. */
export function BarisJumlah({ kunci, graf, idMayit, daftarOrang, saatTambah, saatKurang, saatUbahNama }: {
  kunci: KunciAhliWaris; graf: GrafKeluarga; idMayit: IdOrang; daftarOrang: IdOrang[];
  saatTambah: (idInduk?: string) => void; saatKurang: () => void; saatUbahNama: (idOrang: IdOrang, nama: string) => void;
}) {
  const jenis = jenisDari(kunci);
  const jenisKelaminMayit = graf.orang[idMayit]!.jenisKelamin;
  const label = sebutAlmarhum(LABEL_SEHARI[kunci] ?? jenis?.label ?? kunci, jenisKelaminMayit);
  const keterangan = KETERANGAN_HUBUNGAN[kunci];
  const calonInduk = jenis?.kunciInduk ? daftarInduk(graf, idMayit, jenis.kunciInduk) : [];
  const [idInduk, setIdInduk] = useState<string | undefined>(undefined);
  const [namaTerbuka, setNamaTerbuka] = useState(false);
  const indukTerpilih = idInduk === INDUK_BARU_WAFAT || (idInduk && calonInduk.includes(idInduk)) ? idInduk : calonInduk[0] ?? INDUK_BARU_WAFAT;
  const jumlah = daftarOrang.length;
  const penuh = jenis?.maksimal !== undefined && jumlah >= jenis.maksimal;
  const labelInduk = jenis?.kunciInduk && LABEL_SEHARI[jenis.kunciInduk]!.toLowerCase();
  return (
    <li className={jumlah > 0 ? 'kontrol-jumlah ada' : 'kontrol-jumlah'} role="group" aria-label={label}>
      <div className="baris-kontrol">
        <span className="nama-kontrol">{label}
          {keterangan && <small>{sebutAlmarhum(keterangan, jenisKelaminMayit)}</small>}
          {jenis?.kunciInduk && (
            <select aria-label={`${label} dari siapa?`} value={indukTerpilih} onChange={e => setIdInduk(e.target.value)}>
              {calonInduk.map(id => <option key={id} value={id}>dari {labelOrangChecklist(graf, idMayit, id, jenis.kunciInduk!)}</option>)}
              <option value={INDUK_BARU_WAFAT}>dari {labelInduk} lain (sudah wafat)</option>
            </select>
          )}
        </span>
        {jumlah > 0 && (
          <TombolIkon className="tombol-nama" label={`Beri nama ${label} (opsional)`} aria-expanded={namaTerbuka} onClick={() => setNamaTerbuka(!namaTerbuka)}>
            {/* kartu identitas: menandai "nama", bukan "ubah" */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="9" cy="11" r="2.2" /><path d="M5.8 16.2c.6-1.5 1.8-2.3 3.2-2.3s2.6.8 3.2 2.3" /><path d="M15 10h3M15 13.5h3" />
            </svg>
            <span>Nama</span>
          </TombolIkon>
        )}
        <button type="button" aria-label={`Kurangi ${label}`} disabled={jumlah === 0} onClick={saatKurang}>−</button>
        <span className="angka-kontrol" aria-live="polite">{jumlah}</span>
        <button type="button" aria-label={`Tambah ${label}`} disabled={penuh} onClick={() => saatTambah(jenis?.kunciInduk ? indukTerpilih : undefined)}>+</button>
      </div>
      {namaTerbuka && jumlah > 0 && (
        <ul className="daftar-nama">
          {daftarOrang.map((idOrang, indeks) => {
            const orang = graf.orang[idOrang]!;
            const labelKe = jumlah > 1 ? `${label} ${indeks + 1}` : label;
            return (
              <li key={idOrang}>
                <label className="isian-nama">
                  <span>{labelKe}</span>
                  <input type="text" aria-label={`Nama ${labelKe}`} placeholder={`Nama, misal ${CONTOH_NAMA[orang.jenisKelamin][indeks % 3]}`}
                    defaultValue={orang.nama ?? ''} onBlur={e => saatUbahNama(idOrang, e.target.value)} />
                </label>
                {jenis?.kunciInduk && orang.idAyah && <small>dari {labelOrangChecklist(graf, idMayit, orang.idAyah, jenis.kunciInduk)}</small>}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/** "Anak laki-laki 2", "Ahmad (Anak laki-laki)", atau "Anak laki-laki (sudah wafat)" untuk penghubung. Dipakai juga di langkah 5. */
export function labelOrangChecklist(graf: GrafKeluarga, idMayit: IdOrang, idOrang: IdOrang, kunci?: KunciAhliWaris): string {
  const orang = graf.orang[idOrang]!;
  const isian = hitungIsian(graf, idMayit);
  const kunciOrang = kunci ?? (Object.entries(isian).find(([, ids]) => ids!.includes(idOrang))?.[0] as KunciAhliWaris | undefined);
  const label = kunciOrang ? LABEL_SEHARI[kunciOrang] ?? jenisDari(kunciOrang)?.label ?? 'Kerabat' : 'Kerabat';
  if (orang.nama) return `${orang.nama} (${label}${orang.penghubung ? ', sudah wafat' : ''})`;
  if (orang.penghubung) return `${label} (sudah wafat)`;
  const sePeran = kunciOrang ? isian[kunciOrang] ?? [] : [];
  return sePeran.length > 1 ? `${label} ${sePeran.indexOf(idOrang) + 1}` : label;
}
