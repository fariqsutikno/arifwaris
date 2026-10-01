// Dialog tambah orang lewat nama hubungan (mertua, menantu, besan, ipar, ...), spec Tahap 4 bagian 3.
// Menerima Kasus + pusat + hubungan; menanyakan jangkar (lewat selesaikanJalur) hanya bila perlu; menyerahkan graf baru.

import { useState } from 'react';
import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { HUBUNGAN, selesaikanJalur, type KunciHubungan } from '../../hubunganPohon';
import type { Kasus } from '../../kasus';
import { namaSingkat } from '../../keadaanOrang';
import { DialogKonfirmasi } from '../../ui/Dialog';
import { Pilihan } from './DialogTambahOrang';
import { t } from '../../terjemah';

interface Props { kasus: Kasus; idPusat: IdOrang; hubungan: KunciHubungan; saatSelesai: (graf: GrafKeluarga) => void; saatBatal: () => void }

export function DialogTambahHubungan({ kasus, idPusat, hubungan, saatSelesai, saatBatal }: Props) {
  const jalur = HUBUNGAN[hubungan];
  const [nama, setNama] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P' | null>(null);
  const [pilihan, setPilihan] = useState<string[]>([]);
  const hasil = selesaikanJalur(kasus.graf, idPusat, hubungan, { jenisKelamin: jenisKelamin ?? undefined, nama, pilihan });
  // Galat "pilih jenis kelamin" tidak ditampilkan: kelompok pilihannya sudah ada di layar yang sama.
  const menungguKelamin = jalur.tanyaKelamin && !jenisKelamin;
  const galat = 'galat' in hasil && !(menungguKelamin && hasil.galat === t('hitung.pohon.kelamin_wajib')) ? hasil.galat : null;
  const bisaSimpan = 'graf' in hasil && !(jalur.wajibNama && !nama.trim());
  const jawab = (indeks: number, nilai: string) => setPilihan([...pilihan.slice(0, indeks), nilai]);
  return (
    <DialogKonfirmasi judul={t('hitung.pohon.judul_hubungan', { hubungan: jalur.label, nama: namaSingkat(kasus, idPusat) })} labelLanjut={t('hitung.pohon.simpan')} labelBatal={t('hitung.pohon.batal')}
      lanjutNonaktif={!bisaSimpan} saatLanjut={() => { if ('graf' in hasil) saatSelesai(hasil.graf); }} saatBatal={saatBatal}>
      <label className="isian isian-kecil">
        <span>{jalur.wajibNama ? t('hitung.pohon.nama_wajib') : t('hitung.pohon.nama_orang_opsional')}</span>
        <input type="text" value={nama} onChange={e => setNama(e.target.value)} autoComplete="off" />
      </label>
      {jalur.tanyaKelamin && (
        <Pilihan label={t('hitung.pohon.kelamin')} nilai={jenisKelamin} saatPilih={nilai => setJenisKelamin(nilai as 'L' | 'P')}
          daftar={[{ nilai: 'L', label: t('hitung.pohon.laki_laki') }, { nilai: 'P', label: t('hitung.pohon.perempuan') }]} />
      )}
      {'pertanyaan' in hasil && (
        <Pilihan label={hasil.pertanyaan.judul} nilai={pilihan[hasil.pertanyaan.indeks] ?? null} daftar={hasil.pertanyaan.pilihan}
          saatPilih={nilai => jawab(hasil.pertanyaan.indeks, nilai)} />
      )}
      {galat && <p role="alert" className="isian-salah">{galat}</p>}
    </DialogKonfirmasi>
  );
}
