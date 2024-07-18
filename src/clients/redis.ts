// SPDX-License-Identifier: Apache-2.0

import Redis from 'ioredis';
import { configuration } from '../config';
import { LoggerService } from '../logger.service';

export class RedisService {
  client: Redis;

  constructor() {
    this.client = new Redis({
      db: configuration.redis?.db,
      host: configuration.redis?.host,
      port: configuration.redis?.port,
      password: configuration.redis?.auth,
    });

    this.client.on('connect', () => {
      LoggerService.log('✅ Redis connection is ready');
    });
    this.client.on('error', (error) => {
      LoggerService.error('❌ Redis connection is not ready', error);
    });
  }

  getJson = async (key: string): Promise<string[]> =>
    await new Promise((resolve) => {
      this.client.smembers(key, (err, res) => {
        if (err) {
          LoggerService.error('Error while getting key from redis with message:', err, 'RedisService');

          resolve(['']);
        }
        resolve(res ?? ['']);
      });
    });

  setJson = async (key: string, value: string, expire: number): Promise<number> =>
    await new Promise((resolve) => {
      this.client.sadd(key, value, (err, res) => {
        if (err) {
          LoggerService.error('Error while adding key to redis with message:', err, 'RedisService');

          resolve(-1);
        }
        resolve(res!);
      });
    });

  deleteKey = async (key: string): Promise<number> =>
    await new Promise((resolve) => {
      this.client.del(key, (err, res) => {
        if (err) {
          LoggerService.error('Error while deleting key from redis with message:', err, 'RedisService');

          resolve(0);
        }
        resolve(res!);
      });
    });

  addOneGetAll = async (key: string, value: string): Promise<string[] | null> =>
    await new Promise((resolve) => {
      this.client
        .multi()
        .sadd(key, value)
        .smembers(key)
        .exec((err, res) => {
          // smembers result
          if (res && res[1] && res[1][1]) {
            resolve(res[1][1] as string[]);
          }

          if (err) {
            LoggerService.error('Error while executing transaction on redis with message:', err, 'RedisService');
          }

          resolve(null);
        });
    });

  quit(): void {
    this.client.quit();
  }
}
