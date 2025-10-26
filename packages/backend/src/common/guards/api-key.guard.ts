import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard para validação de API Key
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    const expectedKey = this.configService.get<string>('DEVTOOLS_API_KEY');

    if (!expectedKey) {
      throw new UnauthorizedException('API Key not configured on server');
    }

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}

