// Polyfill jsdom untuk komponen shadcn/Radix: matchMedia (hook use-mobile sidebar) dan ResizeObserver.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
// ProseMirror (Tiptap) mengukur posisi kursor untuk menggulir; jsdom tidak punya tata letak.
const kotakKosong = () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) }) as DOMRect;
const daftarKotakKosong = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
Range.prototype.getBoundingClientRect ??= kotakKosong;
Range.prototype.getClientRects ??= daftarKotakKosong;
Element.prototype.getClientRects ??= daftarKotakKosong;
document.elementFromPoint ??= () => null;
// Layar web di iframe (BingkaiWeb) punya window & Range sendiri: pasang polyfill yang sama saat dokumennya diambil.
const dokumenIframe = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentDocument')!;
Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
  get(this: HTMLIFrameElement) {
    const dok = dokumenIframe.get!.call(this) as Document | null;
    const jendela = dok?.defaultView as (Window & typeof globalThis) | null | undefined;
    if (jendela) {
      jendela.Range.prototype.getBoundingClientRect ??= kotakKosong;
      jendela.Range.prototype.getClientRects ??= daftarKotakKosong;
      (jendela as { ResizeObserver?: unknown }).ResizeObserver ??= globalThis.ResizeObserver;
    }
    return dok;
  },
});
