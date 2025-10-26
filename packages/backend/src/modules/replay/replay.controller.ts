import { Controller, Post, Param, Body } from '@nestjs/common';
import { ReplayService } from './replay.service';

@Controller('replay')
export class ReplayController {
  constructor(private readonly replayService: ReplayService) {}

  @Post(':eventId')
  async replayRequest(
    @Param('eventId') eventId: string,
    @Body() options?: { targetUrl?: string },
  ) {
    return this.replayService.replayRequest(eventId, options);
  }
}

