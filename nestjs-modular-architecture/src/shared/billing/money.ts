import { BadRequestException } from '@nestjs/common';

const minorUnitsPerUnit = 100;

export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new BadRequestException(
      'Amount must be a finite non-negative number',
    );
  }
  return requireSafeMinorUnits(
    Math.round((amount + Number.EPSILON) * minorUnitsPerUnit),
  );
}

export function fromMinorUnits(amount: number): number {
  return requireSafeMinorUnits(amount) / minorUnitsPerUnit;
}

function requireSafeMinorUnits(amount: number): number {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new BadRequestException(
      'Amount exceeds the supported monetary range',
    );
  }
  return amount;
}
