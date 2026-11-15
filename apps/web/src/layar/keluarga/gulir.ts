// Menggulir elemen ke tengah layar; langsung (tanpa animasi) bila pengguna mematikan gerak. jsdom tidak punya scrollIntoView.

export function gulirKe(elemen: Element | null | undefined): void {
  const gerakKurang = document.documentElement.dataset.gerak === 'kurang';
  elemen?.scrollIntoView?.({ behavior: gerakKurang ? 'auto' : 'smooth', block: 'center' });
}
