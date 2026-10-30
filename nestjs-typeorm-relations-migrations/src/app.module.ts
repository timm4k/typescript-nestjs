import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseOptions } from './database/database.config.js';
import { ClothesModule } from './clothes/clothes.module.js';
import { CollectionsModule } from './collections/collections.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...getDatabaseOptions(),
      retryAttempts: 3,
      retryDelay: 1000,
    }),
    ClothesModule,
    CollectionsModule,
  ],
})
export class AppModule {}
