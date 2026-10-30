import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClothesModule } from './clothes/clothes.module.js';
import { getDatabaseOptions } from './database/database.config.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...getDatabaseOptions(),
      autoLoadEntities: true,
      retryAttempts: 3,
      retryDelay: 1000,
    }),
    ClothesModule,
  ],
})
export class AppModule {}
