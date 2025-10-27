import { Module } from '@nestjs/common';
import { HttpClientController } from './http-client.controller';
import { HttpClientService } from './http-client.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HttpClientController],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
