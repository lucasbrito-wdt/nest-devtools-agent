import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';

@Module({
  imports: [HttpModule],
  controllers: [ReplayController],
  providers: [ReplayService],
})
export class ReplayModule {}
