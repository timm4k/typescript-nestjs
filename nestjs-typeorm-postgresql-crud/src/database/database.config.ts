import type { DataSourceOptions } from 'typeorm';

export type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

function readPort(input: string | undefined, fallback: number): number {
  const value = input ?? String(fallback);
  const port = Number(value);
  if (
    !/^[0-9]+$/.test(value) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }
  return port;
}

export function getDatabaseOptions(
  environment: NodeJS.ProcessEnv = process.env,
): PostgresOptions {
  if (environment['NODE_ENV'] === 'production') {
    throw new Error(
      'Automatic schema synchronization is enabled only for this development project',
    );
  }
  const password = environment['POSTGRES_PASSWORD'];
  if (password === undefined || password.trim().length === 0) {
    throw new Error('Set POSTGRES_PASSWORD in the local .env file');
  }
  const logSql = environment['DB_LOG_SQL'] ?? 'true';
  if (logSql !== 'true' && logSql !== 'false') {
    throw new Error('DB_LOG_SQL must be true or false');
  }
  return {
    type: 'postgres',
    host: environment['DB_HOST'] ?? '127.0.0.1',
    port: readPort(environment['DB_PORT'], 5432),
    username: environment['POSTGRES_USER'] ?? 'nest_user',
    password,
    database: environment['POSTGRES_DB'] ?? 'store_db',
    synchronize: true,
    logging: logSql === 'true' ? ['query', 'schema', 'error'] : ['error'],
    connectTimeoutMS: 5000,
    poolSize: 5,
    uuidExtension: 'pgcrypto',
  };
}
