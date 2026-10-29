import type { FactoryProvider } from '@nestjs/common';
import {
  STORE_CONFIG,
  type StoreConfig,
} from '../config/app-config.provider.js';
import { fromMinorUnits, toMinorUnits } from './money.js';

export const FEE_CALCULATOR = 'FEE_CALCULATOR';

export interface FeeCalculator {
  calculateTax(amount: number): number;
}

const basisPointsPerPercent = 100;
const basisPointsPerWhole = 10_000;

export const FeeCalculatorProvider = {
  provide: FEE_CALCULATOR,
  useFactory: (config: StoreConfig): FeeCalculator => {
    const basisPoints = config.taxPercent * basisPointsPerPercent;
    if (
      !Number.isSafeInteger(basisPoints) ||
      basisPoints < 0 ||
      basisPoints > basisPointsPerWhole
    ) {
      throw new Error(
        'Tax percent must be between 0 and 100 with at most two decimal places',
      );
    }
    return Object.freeze({
      calculateTax(amount: number): number {
        const numerator = BigInt(toMinorUnits(amount)) * BigInt(basisPoints);
        const taxInMinorUnits =
          (numerator + BigInt(basisPointsPerWhole / 2)) /
          BigInt(basisPointsPerWhole);
        return fromMinorUnits(Number(taxInMinorUnits));
      },
    });
  },
  inject: [STORE_CONFIG],
} satisfies FactoryProvider<FeeCalculator>;
