// Panel tautan teks yang naik dari kotak orang yang diketuk. Menerima elemen jangkar + daftar aksi; menyerahkan aksi terpilih.
// Posisi dihitung dari kotak jangkar di dalam panggung (tidak ikut skala pohon); berbalik ke atas bila tidak muat di bawah.

import { useLayoutEffect, useRef, useState } from 'react';
import type { Aksi } from '../../kerabatPohon';
import { useTutupDiLuar } from '../../ui/tutupDiLuar';
import { t } from '../../terjemah';

export type AksiMenu = Aksi | 'ubah' | 'hapus';
const LABEL: Record<AksiMenu, string> = {
  orangTua: t('hitung.pohon.tambah_orang_tua'), pasangan: t('hitung.pohon.tambah_pasangan'), anak: t('hitung.pohon.tambah_anak'),
  saudara: t('hitung.pohon.tambah_saudara'), ubah: t('hitung.pohon.ubah'), hapus: t('hitung.pohon.hapus'),
};
const JARAK = 6;

interface Props { jangkar: HTMLElement; aksi: AksiMenu[]; judul: string; saatPilih: (aksi: AksiMenu) => void; saatTutup: () => void }

export function MenuOrang({ jangkar, aksi, judul, saatPilih, saatTutup }: Props) {
  const akar = useRef<HTMLDivElement>(null);
  const [posisi, setPosisi] = useState<{ kiri: number; atas: number }>({ kiri: 0, atas: 0 });
  useTutupDiLuar(akar, true, saatTutup);
  useLayoutEffect(() => {
    const panggung = jangkar.closest<HTMLElement>('.panggung-pohon');
    const menu = akar.current;
    if (!panggung || !menu) return;
    const dasar = panggung.getBoundingClientRect();
    const kotak = jangkar.getBoundingClientRect();
    const muatDiBawah = kotak.bottom + JARAK + menu.offsetHeight <= dasar.bottom;
    const atas = (muatDiBawah ? kotak.bottom + JARAK : kotak.top - JARAK - menu.offsetHeight) - dasar.top;
    const kiri = Math.min(Math.max(kotak.left - dasar.left, 0), Math.max(dasar.width - menu.offsetWidth, 0));
    setPosisi({ kiri, atas });
    menu.querySelector<HTMLElement>('[role=menuitem]')?.focus();
  }, [jangkar]);
  const kunciPanah = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.stopPropagation(); saatTutup(); return; }
    const butir = [...event.currentTarget.querySelectorAll<HTMLElement>('[role=menuitem]')];
    const sekarang = butir.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); butir[(sekarang + 1) % butir.length]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); butir[(sekarang - 1 + butir.length) % butir.length]?.focus(); }
  };
  return (
    <div ref={akar} className="menu-orang" role="menu" aria-label={t('hitung.pohon.menu_untuk', { nama: judul })}
      style={{ insetInlineStart: posisi.kiri, top: posisi.atas }} onKeyDown={kunciPanah}>
      {aksi.map(item => (
        <button key={item} type="button" role="menuitem" className={item === 'hapus' ? 'menu-orang-butir bahaya' : 'menu-orang-butir'} onClick={() => saatPilih(item)}>
          {LABEL[item]}
        </button>
      ))}
    </div>
  );
}
