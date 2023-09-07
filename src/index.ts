import apm from 'elastic-apm-node';
import { type Context } from 'koa';
import App from './app';
import { ArangoDBService, RedisService } from './clients';
import { configuration } from './config';
import { LoggerService } from './logger.service';
import { SendLineMessages } from './services/file.service';
import { GetPacs008FromXML } from './services/xml.service';
import {
  type IStartupService,
  StartupFactory,
} from '@frmscoe/frms-coe-startup-lib';
import {
  ServicesContainer,
  initCacheDatabase,
} from './services/services-container';

/*
 * Initialize the APM Logging
 **/
if (configuration.apm.active === 'true') {
  apm.start({
    serviceName: configuration.apm?.serviceName,
    secretToken: configuration.apm?.secretToken,
    serverUrl: configuration.apm?.url,
    usePathAsTransactionName: true,
    active: Boolean(configuration.apm?.active),
    transactionIgnoreUrls: ['/health'],
  });
}

export const app = new App();
export let natsServer: IStartupService;

export const cache = ServicesContainer.getCacheInstance();
export const databaseClient = new ArangoDBService();
export const cacheClient = new RedisService();

/*
 * Centralized error handling
 **/
app.on('error', handleError);

function handleError(err: Error, ctx: Context): void {
  if (ctx == null) {
    LoggerService.error(err, undefined, 'Unhandled exception occured');
  }
}

function terminate(signal: NodeJS.Signals): void {
  try {
    app.terminate();
  } finally {
    LoggerService.log('App is terminated');
    process.kill(process.pid, signal);
  }
}

export const runNatsServer = async (): Promise<void> => {
  for (let retryCount = 0; retryCount < 10; retryCount++) {
    LoggerService.log(`Connecting to nats server...`);
    if (!(await natsServer.initProducer())) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      LoggerService.log(`Connected to nats`);
      break;
    }
  }
};

if (
  Object.values(require.cache).filter(async (m) => m?.children.includes(module))
) {
  const server = app.listen(configuration.port, async () => {
    natsServer = new StartupFactory();
    LoggerService.log(
      `API server listening on PORT ${configuration.port}`,
      'execute',
    );
    await initCacheDatabase(configuration.cacheTTL, cacheClient);
    await runNatsServer();
  });
  server.on('error', handleError);

  const errors = ['unhandledRejection', 'uncaughtException'];
  errors.forEach((error) => {
    process.on(error, handleError);
  });

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  signals.forEach((signal) => {
    process.once(signal, () => {
      terminate(signal);
    });
  });
}

// read batch file line-by-line
export const processLineByLine = async (
  requestBody: unknown,
): Promise<void> => {
  switch (configuration.data.type) {
    case 'textfile':
      await SendLineMessages(requestBody);
      break;

    case 'xml':
      GetPacs008FromXML();
      break;

    default:
      console.log('No Data Method Set.');
      throw new Error('No Data Method Set in environment.');
  }
};

export const dbService = new ArangoDBService();
export default app;
