// SPDX-License-Identifier: Apache-2.0
import { LoggerService, type ManagerConfig } from '@tazama-lf/frms-coe-lib';
import { validateProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config';
import './apm';
import { CacheDatabaseService } from './clients/cache-database';
import initializeFastifyClient from './clients/fastify';
import { additionalEnvironmentVariables, type Configuration } from './config';

let configuration = validateProcessorConfig(additionalEnvironmentVariables) as Configuration;

export const loggerService: LoggerService = new LoggerService(configuration);

let cacheDatabaseManager: CacheDatabaseService<ManagerConfig>;

export const dbInit = async (): Promise<void> => {
  const { config, db } = await CacheDatabaseService.create(configuration);
  cacheDatabaseManager = db;
  configuration = { ...configuration, ...config };
  loggerService.log(JSON.stringify(cacheDatabaseManager.isReadyCheck()));
};

const connect = async (): Promise<void> => {
  const fastify = await initializeFastifyClient();
  fastify.listen({ port: configuration.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      loggerService.error(err);
      throw Error(err.message);
    }

    loggerService.log(`Fastify listening on ${address}`);
  });
};

export const runServer = async (): Promise<void> => {
  if (configuration.nodeEnv !== 'test') await connect();
};

process.on('uncaughtException', (err) => {
  loggerService.error('process on uncaughtException error', err, 'index.ts');
});

process.on('unhandledRejection', (err) => {
  loggerService.error(`process on unhandledRejection error: ${JSON.stringify(err) ?? '[NoMetaData]'}`);
});

const start = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await dbInit();
      await runServer();
    }
  } catch (err) {
    loggerService.error(`Error while starting ${configuration.functionName}`, err);
    process.exit(1);
  }
};
start();

export { cacheDatabaseManager, configuration };
