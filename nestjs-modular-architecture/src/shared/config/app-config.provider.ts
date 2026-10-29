import type { ValueProvider } from '@nestjs/common';

export const STORE_CONFIG = 'STORE_CONFIG';

export interface StoreConfig {
  readonly storeName: string;
  readonly defaultCurrency: string;
  readonly taxPercent: number;
}

export const StoreConfigProvider = {
  provide: STORE_CONFIG,
  useValue: Object.freeze({
    storeName: 'Thread & Form',
    defaultCurrency: 'UAH',
    taxPercent: 20,
  }),
} satisfies ValueProvider<StoreConfig>;
