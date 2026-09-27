// Polyfill jsdom untuk komponen shadcn/Radix: matchMedia (hook use-mobile sidebar) dan ResizeObserver.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
