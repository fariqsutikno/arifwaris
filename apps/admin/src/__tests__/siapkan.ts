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
