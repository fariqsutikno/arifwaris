// Dialog satu layar untuk menambah satu orang dari orang yang diketuk (spec Tahap 4 bagian 2).
// Menerima Kasus + orang + aksi dasar; menyerahkan graf baru lewat saatSelesai. Pertanyaan tambahan muncul di layar yang sama
// hanya bila perlu (jenis kelamin anak/saudara, pasangan bila > 1, jalur saudara, ayah/ibu untuk orang tua).

import { useState } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { pasanganAktif, PASANGAN_LAIN, tambahDariOrang, type Aksi, type JalurSaudara, type Masukan } from '../../kerabatPohon';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; idOrang: IdOrang; aksi: Aksi; saatSelesai: (graf: GrafKeluarga) => void; saatBatal: () => void }

export function DialogTambahOrang({ kasus, idOrang, aksi, saatSelesai, saatBatal }: Props) {
  const { graf } = kasus;
  const orang = graf.orang[idOrang]!;
  const [nama, setNama] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P' | null>(null);
  const [sebagai, setSebagai] = useState<'ayah' | 'ibu' | null>(orang.idAyah ? 'ibu' : orang.idIbu ? 'ayah' : null);
  const [jalur, setJalur] = useState<JalurSaudara>('kandung');
  const hidup = pasanganAktif(graf, idOrang).filter(id => graf.orang[id]!.statusHidup !== 'wafat');
  const [pasangan, setPasangan] = useState<string | null>(hidup.length > 1 ? null : hidup[0] ?? null);
  const perluKelamin = aksi === 'anak' || aksi === 'saudara';
  const perluPasangan = aksi === 'anak' && hidup.length > 1;
  const lengkap = (!perluKelamin || !!jenisKelamin) && (aksi !== 'orangTua' || !!sebagai) && (!perluPasangan || !!pasangan);
  const simpan = () => {
    const masukan: Masukan = aksi === 'orangTua' ? { aksi, sebagai: sebagai!, nama }
      : aksi === 'pasangan' ? { aksi, nama }
      : aksi === 'anak' ? { aksi, jenisKelamin: jenisKelamin!, nama, ...(perluPasangan ? { idPasangan: pasangan! } : {}) }
      : { aksi, jenisKelamin: jenisKelamin!, jalur, nama };
    saatSelesai(tambahDariOrang(graf, idOrang, masukan).graf);
  };
  return (
    <DialogKonfirmasi judul={judul(aksi, namaSingkat(kasus, idOrang))} labelLanjut={t('hitung.pohon.simpan')} labelBatal={t('hitung.pohon.batal')}
      lanjutNonaktif={!lengkap} saatLanjut={simpan} saatBatal={saatBatal}>
      <label className="isian isian-kecil">
        <span>{t('hitung.pohon.nama_orang_opsional')}</span>
        <input type="text" value={nama} onChange={e => setNama(e.target.value)} autoComplete="off" />
      </label>
      {aksi === 'orangTua' && (
        <Pilihan label={t('hitung.pohon.sebagai')} nilai={sebagai} saatPilih={v => setSebagai(v as 'ayah' | 'ibu')}
          daftar={[...(orang.idAyah ? [] : [{ nilai: 'ayah', label: t('hitung.pohon.ayah') }]), ...(orang.idIbu ? [] : [{ nilai: 'ibu', label: t('hitung.pohon.ibu') }])]} />
      )}
      {perluKelamin && (
        <Pilihan label={t('hitung.pohon.kelamin')} nilai={jenisKelamin} saatPilih={v => setJenisKelamin(v as 'L' | 'P')}
          daftar={[{ nilai: 'L', label: t('hitung.pohon.laki_laki') }, { nilai: 'P', label: t('hitung.pohon.perempuan') }]} />
      )}
      {perluPasangan && (
        <Pilihan label={t('hitung.pohon.dari_pasangan_mana')} nilai={pasangan} saatPilih={setPasangan}
          daftar={[...hidup.map(id => ({ nilai: id, label: namaSingkat(kasus, id) })), { nilai: PASANGAN_LAIN, label: t('hitung.pohon.pasangan_lain_tidak_dicatat') }]} />
      )}
      {aksi === 'saudara' && (
        <Pilihan label={t('hitung.pohon.jalur_saudara')} nilai={jalur} saatPilih={v => setJalur(v as JalurSaudara)}
          daftar={[{ nilai: 'kandung', label: t('hitung.pohon.jalur_kandung') }, { nilai: 'sebapak', label: t('hitung.pohon.jalur_sebapak') }, { nilai: 'seibu', label: t('hitung.pohon.jalur_seibu') }]} />
      )}
    </DialogKonfirmasi>
  );
}

// Kunci t() harus literal (dijaga tes diksi), jadi tiap aksi punya pemanggilan t() sendiri.
function judul(aksi: Aksi, nama: string): string {
  switch (aksi) {
    case 'orangTua': return t('hitung.pohon.judul_tambah_orang_tua', { nama });
    case 'pasangan': return t('hitung.pohon.judul_tambah_pasangan', { nama });
    case 'anak': return t('hitung.pohon.judul_tambah_anak', { nama });
    case 'saudara': return t('hitung.pohon.judul_tambah_saudara', { nama });
  }
}

export function Pilihan({ label, nilai, daftar, saatPilih }: { label: string; nilai: string | null; daftar: Array<{ nilai: string; label: string }>; saatPilih: (nilai: string) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="pilihan-dialog">
      <span className="label-pilihan">{label}</span>
      {daftar.map(butir => (
        <button key={butir.nilai} type="button" role="radio" aria-checked={nilai === butir.nilai} className={nilai === butir.nilai ? 'pilih-dialog terpilih' : 'pilih-dialog'}
          onClick={() => saatPilih(butir.nilai)}>{butir.label}</button>
      ))}
    </div>
  );
}
