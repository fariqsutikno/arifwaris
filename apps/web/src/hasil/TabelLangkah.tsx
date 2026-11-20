// Tabel faraidh yang dibangun bertahap untuk mode Langkah demi langkah: hanya kolom yang sudah dibahas yang tampil, sel yang
// belum terisi "?", sel yang baru terisi di langkah ini menyala (`kini`) dan menunggu angka terbang. Susunan sel sama dengan
// TabelFaraidh (sel kelompok digabung, baris terhalang diarsir); angka dari tabel engine, bukan dihitung ulang di sini.

import type { IdOrang } from '@waris/engine';
import type { KodeSel, KolomLinimasa, KolomTabel } from '@waris/explain';
import { formatRupiah } from '../format';
import type { HasilOk } from '@waris/latihan';
import { adalahDzawilArham, urutkanBaris, type RingkasanHasil } from './ringkasan';
import { warnaOrang } from './warnaOrang';
import { angka, t } from '../terjemah';

interface Props {
  kolom: KolomTabel[];
  hasil: HasilOk;
  ringkasan: RingkasanHasil;
  sembunyiNominal: boolean;
  /** Sel yang sudah terisi sampai langkah ini, dan yang baru terisi di langkah ini. */
  terbuka: ReadonlySet<KodeSel>;
  kini: ReadonlySet<KodeSel>;
}

const JUDUL_KOLOM: Record<KolomLinimasa, () => string> = {
  bagian: () => t('hitung.bagian'), ashl: () => t('hitung.asal_masalah'), aul: () => t('hitung.aul'),
  radd: () => t('hitung.radd'), tashih: () => t('hitung.tashih'), nominal: () => t('hitung.nominal'),
};
const kodeSel = (kolom: KolomLinimasa, id: IdOrang): KodeSel => `${kolom}:${id}`;

export function TabelLangkah({ kolom, hasil, ringkasan, sembunyiNominal, terbuka, kini }: Props) {
  const tampil = kolom.filter(satu => [...terbuka].some(kode => kode.startsWith(`${satu.kolom}:`)));
  if (tampil.length === 0) return <p className="tabel-kosong">{t('langkah.tabel_bertambah')}</p>;
  const nama = (id: IdOrang) => ringkasan.penerima.find(orang => orang.id === id)?.nama ?? id;
  const judul = (satu: KolomTabel) => JUDUL_KOLOM[satu.kolom]();

  const isiSel = (satu: KolomLinimasa, baris: HasilOk['tabel']['baris'][number], id: IdOrang): string => {
    if (satu === 'nominal') return sembunyiNominal ? t('hitung.rp') : formatRupiah(baris.perOrang[id]!.nominal);
    if (satu === 'bagian') {
      if (adalahDzawilArham(ringkasan.statusOrang[id])) return t('hitung.dzawil_arham');
      return baris.fardh ? angka(`${baris.fardh.n}/${baris.fardh.d}`) : t('hitung.ashabah');
    }
    return angka(String(baris.sel[satu]));
  };
  const terisi = (satu: KolomLinimasa, anggota: IdOrang[]) => anggota.some(id => terbuka.has(kodeSel(satu, id)));
  const menyala = (satu: KolomLinimasa, anggota: IdOrang[]) => anggota.some(id => kini.has(kodeSel(satu, id)));
  const kolomAktif = new Set([...kini].map(kode => kode.split(':')[0]));

  return (
    <table className="tabel-langkah">
      <thead>
        <tr>
          <th>{t('hitung.ahli_waris')}</th>
          {tampil.map(satu => (
            <th key={satu.kolom} className={kolomAktif.has(satu.kolom) ? 'aktif' : undefined}>
              {judul(satu)}{satu.total !== undefined && <big>{angka(String(satu.total))}</big>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {urutkanBaris(hasil.tabel.baris, ringkasan.statusOrang).flatMap(baris => baris.anggota.map((id, urut) => (
          <tr key={id}>
            <td><span className="sw" style={{ background: warnaOrang(ringkasan, id) }} />{nama(id)}</td>
            {tampil.map(satu => {
              const satuPerOrang = satu.kolom === 'nominal';
              if (!satuPerOrang && urut > 0) return null;
              const anggota = satuPerOrang ? [id] : baris.anggota;
              const isi = terisi(satu.kolom, anggota);
              return (
                <td key={satu.kolom} rowSpan={satuPerOrang ? 1 : baris.anggota.length} data-orang={id}
                  className={[satu.kolom === 'nominal' && 'rp', menyala(satu.kolom, anggota) && 'kini'].filter(Boolean).join(' ') || undefined}>
                  {isi ? <span>{isiSel(satu.kolom, baris, id)}</span> : <span className="rahasia" aria-label={t('hitung.disembunyikan')}>?</span>}
                </td>
              );
            })}
          </tr>
        )))}
        {ringkasan.terhalang.map(orang => (
          <tr key={orang.id} className="halang">
            <td><span className="sw" />{orang.nama}</td>
            <td colSpan={tampil.length}>{orang.alasan}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
