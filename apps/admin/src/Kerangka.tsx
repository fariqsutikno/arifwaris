// Kerangka portal (spec tahap A "Kerangka & navigasi") di atas Sidebar shadcn: menu berkelompok dari MENU_PORTAL,
// lencana antrean review, email + peran + Keluar di kaki sidebar, isi layar di kanan. Layar sempit: sidebar jadi
// laci (Sheet) lewat tombol Menu dan menutup setelah memilih menu. Layar entri menyorot menu jenis entri itu (jenisEntri
// dilaporkan editor setelah entri dimuat, jadi tautan langsung ke entri juga menyala). Lencana antrean = revisi yang
// boleh diperiksa pengguna ini (transisiRevisi; penulis tidak mendapat lencana, reviewer tidak menghitung revisinya
// sendiri), dimuat ulang tiap rute berubah. Lencana Ajuan saya = kabar review baru sejak menu itu terakhir dibuka
// (editor/ajuanSaya.ts; penulis & admin). Kepala menampilkan judul halaman aktif.
import { useEffect, useState, type ReactNode } from 'react';
import { transisiRevisi, type JenisKonten, type StatusRevisi } from '@waris/content';
import { House, Inbox, LogOut, Menu as IkonMenu, Send, Users, type LucideIcon } from 'lucide-react';
import { bacaTerakhirDibuka, jumlahKabarBaru, susunAjuan } from './editor/ajuanSaya';
import { Button } from '@/components/ui/button';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar,
} from '@/components/ui/sidebar';
import { MENU_PORTAL, menuUntukJenis, type GrupMenu, type KunciMenu } from './navigasi';
import { usePortal } from './repo';
import { tulisRute, type Rute } from './rute';

type KunciAktif = 'beranda' | 'review' | 'ajuan' | 'peran' | KunciMenu | null;
const URUTAN_GRUP: GrupMenu[] = ['Belajar', 'Bank soal', 'Tanya jawab', 'Pustaka', 'Aplikasi'];
const LABEL_PERAN = { admin: 'Admin', penulis: 'Penulis', reviewer: 'Reviewer' } as const;

export function menuAktif(rute: Rute, jenisEntri: JenisKonten | null): KunciAktif {
  switch (rute.layar) {
    case 'beranda': case 'review': case 'ajuan': case 'peran': return rute.layar;
    case 'menu': return rute.menu;
    case 'entriBaru': return menuUntukJenis(rute.jenis).kunci;
    case 'entri': return jenisEntri ? menuUntukJenis(jenisEntri).kunci : null;
  }
}

export function Kerangka({ rute, jenisEntri = null, onKeluar, children }: {
  rute: Rute; jenisEntri?: JenisKonten | null; onKeluar: () => void; children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <SisiPortal rute={rute} jenisEntri={jenisEntri} onKeluar={onKeluar} />
      <SidebarInset>
        <KepalaPortal judul={judulHalaman(menuAktif(rute, jenisEntri))} />
        <main className="w-full max-w-6xl p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Tombol Menu tampil di semua lebar: laci di layar sempit, ciut/buka sidebar di layar lebar (juga lewat Ctrl+B).
function KepalaPortal({ judul }: { judul: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2">
      <Button variant="outline" size="sm" onClick={toggleSidebar}><IkonMenu />Menu</Button>
      <b className="md:hidden">Arif Waris</b>
      <span className="hidden text-sm text-muted-foreground md:inline">{judul}</span>
    </header>
  );
}

const JUDUL_TETAP = { beranda: 'Beranda', review: 'Antrean review', ajuan: 'Ajuan saya', peran: 'Peran' } as const;
function judulHalaman(aktif: KunciAktif): string {
  if (!aktif) return '';
  if (aktif in JUDUL_TETAP) return JUDUL_TETAP[aktif as keyof typeof JUDUL_TETAP];
  const menu = MENU_PORTAL.find(calon => calon.kunci === aktif);
  return menu ? `${menu.grup} / ${menu.label}` : '';
}

function SisiPortal({ rute, jenisEntri, onKeluar }: { rute: Rute; jenisEntri: JenisKonten | null; onKeluar: () => void }) {
  const { repo, sesi, peran } = usePortal();
  const { setOpenMobile } = useSidebar();
  const bolehPeriksa = (revisi: { dibuatOleh: string; status: StatusRevisi }) =>
    transisiRevisi({ peran, pelakuId: sesi.userId, pembuatId: revisi.dibuatOleh, status: revisi.status, aksi: 'setujui' }).ok;
  const [jumlahAntrean, setJumlahAntrean] = useState(0);
  const [kabarBaru, setKabarBaru] = useState(0);
  const menulis = peran !== 'reviewer';

  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.editorial.antreanReview(), repo.diksi.antreanReview()])
      .then(([konten, diksi]) => { if (!dibatalkan) setJumlahAntrean([...konten, ...diksi].filter(bolehPeriksa).length); })
      .catch(() => { /* lencana hanya pelengkap; layar antrean menampilkan galatnya sendiri */ });
    return () => { dibatalkan = true; };
  }, [repo, rute, peran, sesi.userId]);

  useEffect(() => {
    if (!menulis || rute.layar === 'ajuan') { setKabarBaru(0); return; }
    let dibatalkan = false;
    Promise.all([repo.editorial.revisiSaya(sesi.userId), repo.diksi.revisiSaya(sesi.userId)])
      .then(([konten, diksi]) => { if (!dibatalkan) setKabarBaru(jumlahKabarBaru(susunAjuan(konten, diksi), bacaTerakhirDibuka())); })
      .catch(() => { /* lencana hanya pelengkap */ });
    return () => { dibatalkan = true; };
  }, [repo, rute, menulis, sesi.userId]);

  const aktif = menuAktif(rute, jenisEntri);
  const tautan = (kunci: KunciAktif, href: string, Ikon: LucideIcon, label: string, lencana?: number, labelLencana = 'menunggu review') => (
    <SidebarMenuItem key={String(kunci)}>
      <SidebarMenuButton asChild isActive={aktif === kunci}>
        <a href={href} aria-current={aktif === kunci ? 'page' : undefined} onClick={() => setOpenMobile(false)}>
          <Ikon /><span>{label}</span>
        </a>
      </SidebarMenuButton>
      {lencana ? <SidebarMenuBadge aria-label={`${lencana} ${labelLencana}`}>{lencana}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1 font-bold">Arif Waris<small className="block font-semibold text-muted-foreground">Portal Konten</small></div>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Navigasi portal">
          <SidebarGroup>
            <SidebarMenu>
              {tautan('beranda', tulisRute({ layar: 'beranda' }), House, 'Beranda')}
              {tautan('review', tulisRute({ layar: 'review' }), Inbox, 'Antrean review', jumlahAntrean)}
              {menulis ? tautan('ajuan', tulisRute({ layar: 'ajuan' }), Send, 'Ajuan saya', kabarBaru, 'kabar baru') : null}
            </SidebarMenu>
          </SidebarGroup>
          {URUTAN_GRUP.map(grup => (
            <SidebarGroup key={grup}>
              <SidebarGroupLabel>{grup}</SidebarGroupLabel>
              <SidebarMenu>
                {MENU_PORTAL.filter(menu => menu.grup === grup).map(menu =>
                  tautan(menu.kunci, tulisRute({ layar: 'menu', menu: menu.kunci, tab: menu.isi[0]! }), menu.ikon, menu.label))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
          {peran === 'admin' ? (
            <SidebarGroup><SidebarMenu>{tautan('peran', tulisRute({ layar: 'peran' }), Users, 'Peran')}</SidebarMenu></SidebarGroup>
          ) : null}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="font-semibold break-all">{sesi.email}</span>
        <span className="text-sm text-muted-foreground">{LABEL_PERAN[peran]}</span>
        <Button variant="outline" size="sm" onClick={onKeluar}><LogOut />Keluar</Button>
      </SidebarFooter>
    </Sidebar>
  );
}
