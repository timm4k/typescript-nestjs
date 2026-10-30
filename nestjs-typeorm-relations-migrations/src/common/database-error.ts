import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function rethrowDatabaseError(error: unknown): never {
  if (error instanceof QueryFailedError) {
    const driver: unknown = error.driverError;
    if (typeof driver === 'object' && driver !== null && 'code' in driver) {
      if (driver.code === '23505')
        throw new ConflictException(
          'A record with this unique value already exists',
        );
      if (driver.code === '23503')
        throw new ConflictException('A related record no longer exists');
    }
  }
  throw error;
}
