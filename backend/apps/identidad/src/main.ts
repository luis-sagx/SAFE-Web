import { NestFactory } from '@nestjs/core';
import { bootstrap } from '@comun';
import { AppModule } from './app.module';

void bootstrap(() => NestFactory.create(AppModule), 3001);
