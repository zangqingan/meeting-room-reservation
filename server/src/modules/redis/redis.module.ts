import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory(configService: ConfigService) {
        const client = createClient({
          url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
          socket: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
        });
        client.on('error', (err) => console.log('Redis Client Error', err));
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService], // 记得导出
})
export class RedisModule {}
