import apm from 'elastic-apm-node';
import { Context } from 'koa';
import NodeCache from 'node-cache';
import App from './app';
import { ArangoDBService, RedisService } from './clients';
import { configuration } from './config';
import { LoggerService } from './logger.service';
import * as fs from 'fs';
import * as readline from 'readline';
import { Pain001 } from './classes/pain.001.001.11';

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
    transactionIgnoreUrls: ["/health"],
  });
}

export const app = new App();

export const cache = new NodeCache();
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
async function processLineByLine() {
  const fileStream = fs.createReadStream('input.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  let counter = 0;
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (counter === 0)
      continue;
    const columns = line.split('|');
    let pain01: Pain001 = {
      CstmrCdtTrfInitn: {
        GrpHdr: {
          MsgId: columns[2],
          CreDtTm: columns[0],
          InitgPty: {
            Nm: columns[13],
            CtctDtls: { MobNb: '' },
            Id: {
              PrvtId: {
                DtAndPlcOfBirth: {
                  BirthDt: new Date(), CityOfBirth: '', CtryOfBirth: '',
                },
                Othr: { Id: '', SchmeNm: { Prtry: '' } },
              }
            }
          },
          NbOfTxs: 0,
        },
        PmtInf: {
          CdtTrfTxInf: {
          
          }

          }
        },
        SplmtryData: {}
      },
      EndToEndId: '',
      TxTp: 'pain.001.001.11'
    };
    //pain01.CstmrCdtTrfInitn = {};
    console.log(`Line from file: ${line}`);
    counter++;
  }
}

processLineByLine();


export default app;
