// Rekam video sinema: Region Capture (CropTarget) memotong tangkapan tab ke satu elemen (panggung + takarir), MediaRecorder
// menyimpan .webm. Hanya peramban berbasis Chromium yang punya CropTarget; yang lain tidak melihat menu rekam (`bisaMerekam`).
// Seluruh perekaman terjadi di perangkat; tidak ada yang diunggah.

const TIPE_VIDEO = 'video/webm';
const BITRATE_BPS = 4_000_000;

interface CropTargetStatik { fromElement: (elemen: Element) => Promise<unknown> }
type TrackCrop = MediaStreamTrack & { cropTo?: (target: unknown) => Promise<void> };

const cropTarget = (): CropTargetStatik | undefined => (window as unknown as { CropTarget?: CropTargetStatik }).CropTarget;

export const bisaMerekam = (): boolean =>
  typeof window !== 'undefined' && !!cropTarget() && !!navigator.mediaDevices?.getDisplayMedia && typeof MediaRecorder !== 'undefined';

export interface Rekaman { berhenti: () => Promise<Blob> }

/** Meminta izin menangkap tab ini (dialog peramban), memotong ke `elemen`, lalu mulai merekam. Menolak bila pengguna membatalkan. */
export async function mulaiRekam(elemen: HTMLElement): Promise<Rekaman> {
  const aliran = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false, preferCurrentTab: true } as DisplayMediaStreamOptions);
  try {
    const [jalur] = aliran.getVideoTracks() as [TrackCrop];
    await jalur.cropTo!(await cropTarget()!.fromElement(elemen));
  } catch (galat) {
    aliran.getTracks().forEach(satu => satu.stop());
    throw galat;
  }
  const potongan: Blob[] = [];
  const perekam = new MediaRecorder(aliran, { mimeType: TIPE_VIDEO, videoBitsPerSecond: BITRATE_BPS });
  perekam.ondataavailable = event => { if (event.data.size > 0) potongan.push(event.data); };
  perekam.start();
  return {
    berhenti: () => new Promise<Blob>(selesai => {
      perekam.onstop = () => { aliran.getTracks().forEach(satu => satu.stop()); selesai(new Blob(potongan, { type: TIPE_VIDEO })); };
      if (perekam.state !== 'inactive') perekam.stop(); else perekam.onstop?.(new Event('stop'));
    }),
  };
}

export function unduhVideo(video: Blob, nama: string): void {
  const alamat = URL.createObjectURL(video);
  const tautan = Object.assign(document.createElement('a'), { href: alamat, download: nama });
  tautan.click();
  URL.revokeObjectURL(alamat);
}
