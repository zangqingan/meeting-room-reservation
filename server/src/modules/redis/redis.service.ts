import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  /**
   * 注入 redisClient
   */
  @Inject('REDIS_CLIENT')
  private redisClient: RedisClientType;

  /**
   * @param key 键值
   * @returns 键值对应的值
   */
  async get(key: string) {
    return await this.redisClient.get(key);
  }

  /**
   * @param key 键值
   * @param value 键值对应的值
   * @param expire 过期时间
   * @returns
   */
  async set(key: string, value: string | number, expire?: number) {
    await this.redisClient.set(key, value, { EX: expire });
  }
}
