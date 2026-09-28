// Layar web di pratinjau & Sunting di layar dirender di dalam iframe (BingkaiWeb); query testing-library harus ke body-nya.
import { within } from '@testing-library/react';

export const layarWeb = () => within(document.querySelector('iframe')!.contentDocument!.body);
export const dokumenWeb = () => document.querySelector('iframe')!.contentDocument!;
