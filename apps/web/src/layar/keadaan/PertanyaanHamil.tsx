// Pertanyaan hamil (spec 1.1, 1.3): bawaan "Tidak". "Ya" → dialog janin:
// siapa → dari siapa → sudah lahir? Di kanvas ia ditanya per kartu calon ibu (`kartu`, siapa sudah jelas, jadi langkah "siapa" dilewati);
// pertanyaan umum (tanpa `kartu`) hanya untuk calon di luar `kecuali`, dan di Latihan untuk semua calon. Janin tersimpan sebagai satu node dalamKandungan per ibu [R13-3].
// Bayi yang lahir lalu wafat diteruskan ke DialogKeadaan supaya masuk urutan wafat lewat jalur yang sama.

import { useEffect, useId, useRef, useState } from 'react';
import type { IdOrang } from '@waris/engine';
import { hapusAhliWaris } from '../../checklist';
import type { Kasus } from '../../kasus';
import { calonIbuJanin, janinLahir, namaSingkat, tambahJanin } from '../../keadaanOrang';
import { Tombol } from '../../ui/komponen';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { DialogKeadaan } from './DialogKeadaan';
import { t } from '../../terjemah';

interface Props {
  kasus: Kasus; idMayit: IdOrang; ubah: (f: (k: Kasus) => Kasus) => void;
  /** Tanya hamil hanya untuk orang ini, di kartunya. */
  kartu?: IdOrang;
  /** Calon yang sudah punya kartu sendiri; tidak ikut pertanyaan umum. Bila tak ada calon tersisa, tidak ada yang dirender. */
  kecuali?: IdOrang[];
}

type LayarJanin =
  | { jenis: 'siapa' }
  | { jenis: 'dariSiapa'; idIbu: IdOrang }
  | { jenis: 'lahir'; idJanin: IdOrang }
  | { jenis: 'jenisKelamin'; idJanin: IdOrang; wafat: boolean; anak: Array<'L' | 'P'> };

export function PertanyaanHamil({ kasus, idMayit, ubah, kartu, kecuali }: Props) {
  const id = useId();
  const calon = calonIbuJanin(kasus, idMayit).filter(c => (kartu ? c.idIbu === kartu : !kecuali?.includes(c.idIbu)));
  const janinBabak = Object.values(kasus.graf.orang)
    .filter(o => o.statusHidup === 'dalamKandungan' && calon.some(c => c.idIbu === o.idIbu)).map(o => o.id);
  const [ada, setAda] = useState(janinBabak.length > 0);
  const [layar, setLayar] = useState<LayarJanin | null>(null);
  const [pilihan, setPilihan] = useState<string | null>(null);
  const [bayiWafat, setBayiWafat] = useState<IdOrang | null>(null);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => { wadah.current?.querySelector<HTMLElement>('[role=radio]')?.focus(); }, [layar?.jenis]);
  const mayit = namaSingkat(kasus, idMayit);

  const hapusJanin = (daftar: IdOrang[]) => ubah(k => ({ ...k, graf: daftar.reduce((graf, idJanin) => hapusAhliWaris(graf, idJanin), k.graf) }));
  const ke = (berikut: LayarJanin | null) => { setLayar(berikut); setPilihan(null); };

  const lanjut = () => {
    if (!layar) return;
    switch (layar.jenis) {
      case 'siapa': return pilihan ? ke({ jenis: 'dariSiapa', idIbu: pilihan }) : undefined;
      case 'dariSiapa': {
        if (!pilihan) return;
        const baru = tambahJanin(kasus, layar.idIbu, pilihan === 'lain' ? undefined : pilihan);
        const idJanin = Object.keys(baru.graf.orang).find(idLain => !kasus.graf.orang[idLain])!;
        ubah(() => baru);
        return ke({ jenis: 'lahir', idJanin });
      }
      case 'lahir':
        if (pilihan === 'belum') return ke(null);
        if (pilihan === 'tanpaKehidupan') { ubah(k => janinLahir(k, layar.idJanin, { jenis: 'tanpaKehidupan' }).kasus); return ke(null); }   // [R13-2]
        if (pilihan) return ke({ jenis: 'jenisKelamin', idJanin: layar.idJanin, wafat: pilihan === 'lahirLaluWafat', anak: [] });
        return;
      case 'jenisKelamin': {
        const anak = pilihan ? [...layar.anak, pilihan as 'L' | 'P'] : layar.anak;
        if (anak.length === 0) return;
        if (layar.wafat) {
          const hasil = janinLahir(kasus, layar.idJanin, { jenis: 'lahirLaluWafat', jenisKelamin: anak[0]! });
          ubah(() => hasil.kasus);
          ke(null);
          if (hasil.idBayiWafat) setBayiWafat(hasil.idBayiWafat);
          return;
        }
        ubah(k => janinLahir(k, layar.idJanin, { jenis: 'hidup', anak }).kasus);
        return ke(null);
      }
    }
  };
  const tambahKembar = () => {
    if (layar?.jenis !== 'jenisKelamin' || !pilihan) return;
    setLayar({ ...layar, anak: [...layar.anak, pilihan as 'L' | 'P'] });
    setPilihan(null);
  };
  const mulaiDariKartu = () => (janinBabak.length === 0 && kartu ? ke({ jenis: 'dariSiapa', idIbu: kartu }) : undefined);
  const pilihAda = () => { setAda(true); mulaiDariKartu(); };
  const pilihTidakAda = () => (janinBabak.length > 0 ? setKonfirmasiHapus(true) : setAda(false));

  const opsi = (daftar: Array<[string, string, string?]>) => (
    <div className="pilihan-dialog" role="radiogroup" aria-labelledby={`${id}-tanya`}>
      {daftar.map(([nilai, label, keterangan]) => (
        <button key={nilai} type="button" role="radio" aria-checked={pilihan === nilai} className="opsi-dialog" onClick={() => setPilihan(nilai)}>
          <span>{label}</span>{keterangan && <small>{keterangan}</small>}
        </button>
      ))}
    </div>
  );
  const isiDialog = (): { tanya: string; keterangan?: string; badan: React.ReactNode } => {
    if (!layar) return { tanya: '', badan: null };
    switch (layar.jenis) {
      case 'siapa':
        return { tanya: t('hitung.janin.siapa'), keterangan: t('hitung.janin.siapa_ket', { mayit }), badan: opsi(calon.map(c => [c.idIbu, namaSingkat(kasus, c.idIbu)])) };
      case 'dariSiapa': {
        const suami = calon.find(c => c.idIbu === layar.idIbu)?.idAyahSah;
        return { tanya: t('hitung.janin.dari_siapa', { ibu: namaSingkat(kasus, layar.idIbu) }),
          badan: opsi([...(suami ? [[suami, namaSingkat(kasus, suami)] as [string, string]] : []), ['lain', t('hitung.janin.suami_lain')]]) };
      }
      case 'lahir':
        return { tanya: t('hitung.janin.sudah_lahir'), badan: opsi([
          ['belum', t('hitung.janin.belum_lahir')], ['hidup', t('hitung.janin.lahir_hidup')],
          ['lahirLaluWafat', t('hitung.janin.lahir_lalu_wafat'), t('hitung.janin.lahir_lalu_wafat_ket')],
          ['tanpaKehidupan', t('hitung.janin.tanpa_kehidupan'), t('hitung.janin.tanpa_kehidupan_ket')]]) };
      case 'jenisKelamin':
        return { tanya: t('hitung.janin.jenis_kelamin'), badan: <>
          {opsi([['L', t('hitung.janin.laki_laki')], ['P', t('hitung.janin.perempuan')]])}
          {!layar.wafat && <button type="button" className="tautan" disabled={!pilihan} onClick={tambahKembar}>{t('hitung.janin.tambah_kembar')}</button>}
        </> };
    }
  };
  const dialog = layar && (() => {
    const isi = isiDialog();
    const bisaLanjut = pilihan !== null || (layar.jenis === 'jenisKelamin' && layar.anak.length > 0);
    return (
      <div className="konfirmasi" role="dialog" aria-modal="true" aria-labelledby={`${id}-tanya`} ref={wadah}
        onKeyDown={event => { if (event.key === 'Escape') ke(null); }}>
        <div className="konfirmasi-isi dialog-langkah">
          <h2 id={`${id}-tanya`}>{isi.tanya}</h2>
          {isi.keterangan && <p className="keterangan">{isi.keterangan}</p>}
          {isi.badan}
          <div className="aksi-konfirmasi">
            <button type="button" className="tautan" onClick={() => ke(null)}>{t('umum.batal')}</button>
            <Tombol disabled={!bisaLanjut} onClick={lanjut}>{t('umum.lanjut')}</Tombol>
          </div>
        </div>
      </div>
    );
  })();

  if ((kartu || kecuali) && calon.length === 0) return null;
  return (
    <>
      {dialog}
      {bayiWafat && <DialogKeadaan kasus={kasus} idOrang={bayiWafat} saatBatal={() => setBayiWafat(null)}
        saatSelesai={kasusBaru => { setBayiWafat(null); ubah(() => kasusBaru); }} />}
      {konfirmasiHapus && (
        <DialogKonfirmasi judul={t('hitung.janin.hapus_judul')} labelLanjut={t('hitung.penutup.ya_hapus')}
          saatBatal={() => setKonfirmasiHapus(false)} saatLanjut={() => { hapusJanin(janinBabak); setAda(false); setKonfirmasiHapus(false); }}>
          <p>{t('hitung.janin.hapus_isi')}</p>
        </DialogKonfirmasi>
      )}
      <section className="penutup-babak" aria-labelledby={`${id}-hamil`}>
        <h3 id={`${id}-hamil`} className="pertanyaan-bagian">
          {kartu ? t('hitung.janin.tanya_kartu', { mayit, nama: namaSingkat(kasus, kartu) }) : t('hitung.janin.tanya', { mayit })}
        </h3>
        <p className="keterangan">{kartu ? t('hitung.janin.tanya_kartu_ket') : t('hitung.janin.tanya_ket')}</p>
        <div className="ya-tidak" role="radiogroup" aria-labelledby={`${id}-hamil`}>
          <button type="button" role="radio" aria-checked={!ada} onClick={pilihTidakAda}>{kartu ? t('hitung.kanvas.tidak') : t('hitung.janin.tidak_ada')}</button>
          <button type="button" role="radio" aria-checked={ada} onClick={pilihAda}>{kartu ? t('hitung.kanvas.ya') : t('hitung.janin.ada')}</button>
        </div>
        {ada && (
          <>
            <ul className="daftar-keadaan">
              {janinBabak.map(idJanin => (
                <li key={idJanin} className="baris-kerabat">
                  <b>{t('hitung.janin.baris', { ibu: namaSingkat(kasus, kasus.graf.orang[idJanin]!.idIbu!) })}</b>
                  <span className="chip-deret">
                    <button type="button" className="tautan" onClick={() => ke({ jenis: 'lahir', idJanin })}>{t('hitung.janin.ubah')}</button>
                    <button type="button" className="tautan" onClick={() => hapusJanin([idJanin])}>{t('hitung.janin.hapus')}</button>
                  </span>
                </li>
              ))}
            </ul>
            {kartu
              ? null   // "Ya" sendiri membuka dialog; tak ada yang perlu ditambah
              : calon.length > 0
                ? <button type="button" className="tautan" onClick={() => ke({ jenis: 'siapa' })}>{t('hitung.janin.tambah')}</button>
                : <p className="keterangan">{t('hitung.janin.tidak_ada_calon')}</p>}
          </>
        )}
      </section>
    </>
  );
}
