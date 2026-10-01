// Jaring pengaman: galat saat menggambar satu komponen tidak lagi mengosongkan seluruh aplikasi. Menampilkan satu kalimat
// dan tombol muat ulang; pindah halaman (hash berubah) mencoba menggambar lagi tanpa muat ulang.

import { Component, type ReactNode } from 'react';
import { t } from '../terjemah';

export class BatasGalat extends Component<{ children: ReactNode }, { galat: boolean }> {
  override state = { galat: false };
  static getDerivedStateFromError() { return { galat: true }; }
  override componentDidMount() { window.addEventListener('hashchange', this.coba); }
  override componentWillUnmount() { window.removeEventListener('hashchange', this.coba); }
  override componentDidCatch(galat: unknown) { console.error(galat); }
  private coba = () => { if (this.state.galat) this.setState({ galat: false }); };
  override render() {
    if (!this.state.galat) return this.props.children;
    return (
      <main className="halaman tumpuk" role="alert">
        <p>{t('umum.halaman_gagal_ditampilkan')}</p>
        <button type="button" className="aw-btn aw-btn-secondary" onClick={() => window.location.reload()}>{t('umum.muat_ulang')}</button>
      </main>
    );
  }
}
