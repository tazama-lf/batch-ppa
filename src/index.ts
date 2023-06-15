import axios from 'axios';
import apm from 'elastic-apm-node';
import { Context } from 'koa';
import NodeCache from 'node-cache';
import App from './app';
import { ArangoDBService } from './clients';
import { configuration } from './config';
import { LoggerService } from './logger.service';
import { SendLineMessages } from './services/file.service';
import { GetPacs008FromXML } from './services/xml.service';

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

export const cache = new NodeCache();
export const databaseClient = new ArangoDBService();
// export const cacheClient = new RedisService();

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

/*
 * Start server
 **/
if (Object.values(require.cache).filter(async (m) => m?.children.includes(module))) {
  const server = app.listen(configuration.port, () => {
    LoggerService.log(`API server listening on PORT ${configuration.port}`, 'execute');
  });
  server.on('error', handleError);

  const errors = ['unhandledRejection', 'uncaughtException'];
  errors.forEach((error) => {
    process.on(error, handleError);
  });

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  signals.forEach((signal) => {
    process.once(signal, () => terminate(signal));
  });
}

// read batch file line-by-line
export async function processLineByLine() {
  switch (configuration.data.type) {
    case 'textfile':
      await SendLineMessages();
      break;

    case 'xml':
      GetPacs008FromXML();
      break;

    default:
      console.log('No Data Method Set.');
      throw new Error('No Data Method Set in environment.');
  }
}

const executePost = async (endpoint: string, request: any) => {
  const span = apm.startSpan(`POST ${endpoint}`);
  try {
    const crspRes = await axios.post(endpoint, request);

    if (crspRes.status !== 200) {
      LoggerService.error(`CRSP Response StatusCode != 200, request:\r\n${request}`);
    }
    LoggerService.log(`CRSP Reponse - ${crspRes.status} with data\n ${JSON.stringify(crspRes.data)}`);
    span?.end();
  } catch (error) {
    LoggerService.error(`Error while sending request to CRSP at ${endpoint ?? ''} with message: ${error}`);
    LoggerService.trace(`CRSP Error Request:\r\n${JSON.stringify(request)}`);
  }
};

// Enable for testing without using Rest API
// processLineByLine();

export const dbService = new ArangoDBService();
export default app;
