// Halaman penerima tautan `#/k/<slug>`: memuat kasus dari server lalu menampilkannya sebagai layar hasil hanya-baca.
// Yang bisa dilakukan penerima: melihat, bermain dengan pembulatan (tidak disimpan), dan menyalin ke riwayatnya sendiri.
// Status dari server menentukan pesan: perlu masuk (akses email), tidak boleh, atau tidak ada.

import { useEffect, useState } from 'react';
import type { BacaBagikan } from '@waris/data';
import type { RepoAkun } from '../akun/sinkron';
import { dariJson, rapikanKeadaan, type Kasus } from '../kasus';
import type { Aksi } from '../keadaan';
import { Hasil } from './Hasil';
import { kasusLengkap } from './KonfirmasiKasusBaru';
import { TAUTAN_BERANDA } from '../rute';
import { t } from '../terjemah';

interface Props { slug: string; repo: RepoAkun | null; /** Repositori akun masih dimuat (async). */ menunggu: boolean; saatMasuk?: (() => void) | undefined; saatSalin: (kasus: Kasus) => void }

type Keadaan = { jenis: 'memuat' } | { jenis: 'galat' } | { jenis: 'terbaca'; hasil: BacaBagikan };

export function KasusDibagikan({ slug, repo, menunggu, saatMasuk, saatSalin }: Props) {
  const [keadaan, setKeadaan] = useState<Keadaan>({ jenis: 'memuat' });
  const [kasus, setKasus] = useState<Kasus | null>(null);
  useEffect(() => {
    if (menunggu) return;
    if (!repo) return setKeadaan({ jenis: 'galat' });
    setKeadaan({ jenis: 'memuat' });
    // Sesi login dipulihkan async oleh klien Supabase; tunggu sekali supaya akses email dibaca dengan sesi yang benar.
    void repo.akun.sesi().catch(() => null).then(() => repo.bagikan.baca(slug)).then(hasil => {
      const sah = hasil.status === 'ok' ? dariJson(JSON.stringify(hasil.kasus)) : null;
      setKasus(sah?.berhasil ? sah.kasus : null);
      setKeadaan({ jenis: 'terbaca', hasil: hasil.status === 'ok' && !sah?.berhasil ? { status: 'tidak_ada' } : hasil });
    }).catch(() => setKeadaan({ jenis: 'galat' }));
  }, [slug, repo, menunggu]);

  if (keadaan.jenis === 'memuat') return <Pesan judul={t('bagikan.memuat')} />;
  if (keadaan.jenis === 'galat') return <Pesan judul={t('bagikan.tidak_terhubung')} isi={t('bagikan.tidak_terhubung_isi')} />;
  const { hasil } = keadaan;
  if (hasil.status === 'perlu_masuk') return <Pesan judul={t('bagikan.perlu_masuk_judul')} isi={t('bagikan.perlu_masuk_isi')} saatMasuk={saatMasuk} />;
  if (hasil.status === 'tidak_boleh') return <Pesan judul={t('bagikan.tidak_boleh_judul')} isi={t('bagikan.tidak_boleh_isi')} />;
  if (hasil.status !== 'ok' || !kasus) return <Pesan judul={t('bagikan.tidak_ada_judul')} isi={t('bagikan.tidak_ada_isi')} />;
  if (!kasusLengkap(kasus)) return <Pesan judul={t('bagikan.belum_lengkap_judul')} isi={t('bagikan.belum_lengkap_isi')} />;

  // Perubahan (mis. pembulatan) hanya berlaku di layar ini; kasus di server tidak tersentuh.
  const kirim = (aksi: Aksi) => { if (aksi.jenis === 'UBAH_KASUS') setKasus(rapikanKeadaan(aksi.ubah(kasus))); };
  return (
    <>
      <p className="catatan-bagikan">
        {hasil.milikSendiri ? t('bagikan.tampilan_pemilik') : t('bagikan.hanya_lihat')}{' '}
        <button type="button" className="tautan-aksi" onClick={() => saatSalin(kasus)}>{t('bagikan.salin_ke_riwayat')}</button>
      </p>
      <Hasil kasus={kasus} idSesi={`dibagikan-${slug}`} tujuan={null} kirim={kirim} hanyaBaca />
    </>
  );
}

function Pesan({ judul, isi, saatMasuk }: { judul: string; isi?: string | undefined; saatMasuk?: (() => void) | undefined }) {
  return (
    <main className="halaman tumpuk">
      <div className="kartu tumpuk">
        <h1 className="judul-langkah">{judul}</h1>
        {isi && <p>{isi}</p>}
        {saatMasuk && <button type="button" className="tautan-aksi" onClick={saatMasuk}>{t('bagikan.masuk_google')}</button>}
        <a className="tautan-aksi" href={TAUTAN_BERANDA}>{t('bagikan.ke_beranda')}</a>
      </div>
    </main>
  );
}
