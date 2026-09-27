// Kerangka portal (spec tahap A "Kerangka & navigasi") di atas Sidebar shadcn: menu berkelompok dari MENU_PORTAL,
// lencana antrean review, email + peran + Keluar di kaki sidebar, isi layar di kanan. Layar sempit: sidebar jadi
// laci (Sheet) lewat tombol Menu dan menutup setelah memilih menu. Layar entri menyorot menu terakhir yang dibuka.
import { useEffect, useState, type ReactNode } from 'react';
import { House, Inbox, LogOut, Menu as IkonMenu, Users, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar,
} from '@/components/ui/sidebar';
import { MENU_PORTAL, menuUntukJenis, type GrupMenu, type KunciMenu } from './navigasi';
import { usePortal } from './repo';
import { tulisRute, type Rute } from './rute';

type KunciAktif = 'beranda' | 'review' | 'peran' | KunciMenu | null;
const URUTAN_GRUP: GrupMenu[] = ['Belajar', 'Bank soal', 'Tanya jawab', 'Pustaka', 'Aplikasi'];
const LABEL_PERAN = { admin: 'Admin', penulis: 'Penulis', reviewer: 'Reviewer' } as const;

export function menuAktif(rute: Rute, menuTerakhir: KunciMenu | null): KunciAktif {
  switch (rute.layar) {
    case 'beranda': case 'review': case 'peran': return rute.layar;
    case 'menu': return rute.menu;
    case 'entriBaru': return menuUntukJenis(rute.jenis).kunci;
    case 'entri': return menuTerakhir;
  }
}

export function Kerangka({ rute, onKeluar, children }: { rute: Rute; onKeluar: () => void; children: ReactNode }) {
  return (
    <SidebarProvider>
      <SisiPortal rute={rute} onKeluar={onKeluar} />
      <SidebarInset>
        <KepalaPortal />
        <main className="w-full max-w-6xl p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Tombol Menu tampil di semua lebar: laci di layar sempit, ciut/buka sidebar di layar lebar (juga lewat Ctrl+B).
function KepalaPortal() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2">
      <Button variant="outline" size="sm" onClick={toggleSidebar}><IkonMenu />Menu</Button>
      <b className="md:hidden">Arif Waris</b>
    </header>
  );
}

function SisiPortal({ rute, onKeluar }: { rute: Rute; onKeluar: () => void }) {
  const { repo, sesi, peran } = usePortal();
  const { setOpenMobile } = useSidebar();
  const [menuTerakhir, setMenuTerakhir] = useState<KunciMenu | null>(null);
  const [jumlahAntrean, setJumlahAntrean] = useState(0);

  useEffect(() => { if (rute.layar === 'menu') setMenuTerakhir(rute.menu); }, [rute]);
  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.editorial.antreanReview(), repo.diksi.antreanReview()])
      .then(([konten, diksi]) => { if (!dibatalkan) setJumlahAntrean(konten.length + diksi.length); })
      .catch(() => { /* lencana hanya pelengkap; layar antrean menampilkan galatnya sendiri */ });
    return () => { dibatalkan = true; };
  }, [repo]);

  const aktif = menuAktif(rute, menuTerakhir);
  const tautan = (kunci: KunciAktif, href: string, Ikon: LucideIcon, label: string, lencana?: number) => (
    <SidebarMenuItem key={String(kunci)}>
      <SidebarMenuButton asChild isActive={aktif === kunci}>
        <a href={href} aria-current={aktif === kunci ? 'page' : undefined} onClick={() => setOpenMobile(false)}>
          <Ikon /><span>{label}</span>
        </a>
      </SidebarMenuButton>
      {lencana ? <SidebarMenuBadge aria-label={`${lencana} menunggu review`}>{lencana}</SidebarMenuBadge> : null}
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
