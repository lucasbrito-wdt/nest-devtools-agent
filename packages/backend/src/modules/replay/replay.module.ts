import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Event])],
  controllers: [ReplayController],
  providers: [ReplayService],
})
export class ReplayModule {}

