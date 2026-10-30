import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { getDatabaseOptions } from './database.config.js';

export default new DataSource({
  ...getDatabaseOptions(),
  migrations: [fileURLToPath(new URL('./migrations/*.js', import.meta.url))],
});
