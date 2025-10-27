import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import { EventType } from 'nest-devtools-shared';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async replayRequest(eventId: string, options?: { targetUrl?: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.type !== EventType.REQUEST) {
      throw new NotFoundException('Request event not found');
    }

    const payload = event.payload as any;
    const { method, url, headers, body } = payload;
    const targetUrl = options?.targetUrl || url;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: targetUrl,
          headers: this.sanitizeHeaders(headers),
          data: body,
        }),
      );

      return {
        success: true,
        original: { eventId, method, url },
        replay: {
          targetUrl,
          status: response.status,
          data: response.data,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        original: { eventId, method, url },
      };
    }
  }

  private sanitizeHeaders(headers: any) {
    const sanitized = { ...headers };
    delete sanitized.host;
    delete sanitized['content-length'];
    return sanitized;
  }
}
