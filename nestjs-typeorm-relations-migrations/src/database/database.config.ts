import type { DataSourceOptions } from 'typeorm';
import { ClothingEntity } from '../clothes/entities/clothing.entity.js';
import { CollectionEntity } from '../clothes/entities/collection.entity.js';
import { MaterialEntity } from '../clothes/entities/material.entity.js';
import { CareInstructionEntity } from '../clothes/entities/care-instruction.entity.js';

export function getDatabaseOptions(
  environment: NodeJS.ProcessEnv = process.env,
): Extract<DataSourceOptions, { type: 'postgres' }> {
  const password = environment['POSTGRES_PASSWORD'];
  if (password === undefined || password.trim().length === 0) {
    throw new Error('Set POSTGRES_PASSWORD in the local .env file');
  }
  const portInput = environment['DB_PORT'] ?? '5433';
  const port = Number(portInput);
  if (
    !/^\d+$/.test(portInput) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }
  const logSql = environment['DB_LOG_SQL'] ?? 'false';
  if (logSql !== 'true' && logSql !== 'false') {
    throw new Error('DB_LOG_SQL must be true or false');
  }
  return {
    type: 'postgres',
    host: environment['DB_HOST'] ?? '127.0.0.1',
    port,
    username: environment['POSTGRES_USER'] ?? 'nest_user',
    password,
    database: environment['POSTGRES_DB'] ?? 'relations_db',
    entities: [
      CollectionEntity,
      ClothingEntity,
      MaterialEntity,
      CareInstructionEntity,
    ],
    synchronize: false,
    migrationsRun: false,
    migrationsTableName: 'schema_migrations',
    uuidExtension: 'pgcrypto',
    logging: logSql === 'true' ? ['query', 'schema', 'error'] : ['error'],
    connectTimeoutMS: 5000,
    poolSize: 5,
  };
}
