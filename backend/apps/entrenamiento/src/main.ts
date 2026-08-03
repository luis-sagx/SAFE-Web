import { NestFactory } from '@nestjs/core';
import { arrancar } from '@comun';
import { AppModule } from './app.module';

void arrancar(() => NestFactory.create(AppModule), 3002);
