/** Kata kunci tebal ditandai **…** di teks diksi. */
export const Tebal = ({ teks }: { teks: string }) => <>{teks.split('**').map((potong, indeks) => (indeks % 2 ? <b key={indeks}>{potong}</b> : potong))}</>;
