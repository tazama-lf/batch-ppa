import axios from 'axios';
import apm from 'elastic-apm-node';
import * as fs from 'fs';
import { Context } from 'koa';
import NodeCache from 'node-cache';
import * as readline from 'readline';
import App from './app';
import { Pacs002 } from './classes/pacs.002.001.12';
import { Pacs008 } from './classes/pacs.008.001.10';
import { Pain001 } from './classes/pain.001.001.11';
import { Pain013 } from './classes/pain.013.001.09';
import { ArangoDBService, RedisService } from './clients';
import { configuration } from './config';
import { LoggerService } from './logger.service';

import { v4 as uuidv4 } from 'uuid';

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
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  let counter = 0;
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (counter === 0) {
      counter++;
      continue;
    }

    // var myUUID = v4.v4();
    let end2endID = uuidv4().replace('-','')
    let testID = uuidv4().replace('-','')

    const columns = line.split('|');
    let pain01: Pain001 = {
      CstmrCdtTrfInitn: {
        GrpHdr: {
          MsgId: testID,
          CreDtTm: new Date(columns[0]).toISOString(),
          InitgPty: {
            Nm: columns[13],
            Id: {
              PrvtId: {
                DtAndPlcOfBirth: {
                  BirthDt: '1968-02-01',
                  CityOfBirth: 'Unknown',
                  CtryOfBirth: 'ZZ',
                },
                Othr: {
                  Id: columns[17],
                  SchmeNm: {
                    Prtry: 'ACCOUNT NUMBER',
                  },
                },
              },
            },
            CtctDtls: {
              MobNb: '+11-762995524',
            },
          },
          NbOfTxs: 1,
        },
        PmtInf: {
          PmtInfId: columns[2],
          PmtMtd: 'TRA',
          ReqdAdvcTp: {
            DbtAdvc: {
              Cd: 'ADWD',
              Prtry: 'Advice with transaction details',
            },
          },
          ReqdExctnDt: {
            Dt: new Date(columns[0]).toISOString().substring(0, 10),
            DtTm: new Date(columns[0]).toISOString(),
          },
          Dbtr: {
            Nm: columns[13],
            CtctDtls: {
              MobNb: '+11-762995524',
            },
            Id: {
              PrvtId: {
                DtAndPlcOfBirth: {
                  BirthDt: '1968-02-01',
                  CityOfBirth: 'Unknown',
                  CtryOfBirth: 'ZZ',
                },
                Othr: {
                  Id: columns[17],
                  SchmeNm: {
                    Prtry: 'ACCOUNT NUMBER',
                  },
                },
              },
            },
          },

          DbtrAcct: {
            Id: {
              Othr: {
                Id: columns[14] == 'Y' ? `${columns[17]}${columns[13]}` : `${columns[17]}`,
                SchmeNm: {
                  Prtry: columns[14] == 'Y' ? 'SUSPENSE_ACCOUNT' : 'USER_ACCOUNT',
                },
              },
            },
            Nm: columns[13],
          },
          DbtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: `${columns[10]}${columns[15]}`,
              },
            },
          },
          CdtTrfTxInf: {
            PmtId: {
              EndToEndId: end2endID,
            },
            PmtTpInf: {
              CtgyPurp: {
                Prtry: columns[3],
              },
            },
            Amt: {
              InstdAmt: {
                Amt: {
                  Amt: parseInt(columns[12]),
                  Ccy: columns[11],
                },
              },
              EqvtAmt: {
                Amt: {
                  Amt: parseInt(columns[12]),
                  Ccy: columns[11],
                },
                CcyOfTrf: columns[11],
              },
            },
            ChrgBr: 'DEBT',
            CdtrAgt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: `${columns[10]}${columns[16]}`,
                },
              },
            },
            Cdtr: {
              Nm: columns[14],
              Id: {
                PrvtId: {
                  DtAndPlcOfBirth: {
                    BirthDt: '1968-02-01',
                    CityOfBirth: 'Unknown',
                    CtryOfBirth: 'ZZ',
                  },
                  Othr: {
                    Id: columns[18],
                    SchmeNm: {
                      Prtry: 'ACCOUNT NUMBER',
                    },
                  },
                },
              },
              CtctDtls: {
                MobNb: '+11-762995523',
              },
            },
            CdtrAcct: {
              Id: {
                Othr: {
                  Id: columns[14] == 'Y' ? `${columns[18]}${columns[14]}` : `${columns[18]}`,
                  SchmeNm: {
                    Prtry: columns[14] == 'Y' ? 'SUSPENSE_ACCOUNT' : 'USER_ACCOUNT',
                  },
                },
              },
              Nm: columns[14],
            },
            Purp: {
              Cd: 'MP2P',
            },
            RgltryRptg: {
              Dtls: {
                Tp: 'REPORTING CODE',
                Cd: columns[19],
              },
            },
            RmtInf: {
              Ustrd: '',
            },
            SplmtryData: {
              Envlp: {
                Doc: {
                  Dbtr: {
                    FrstNm: columns[13].split(' ')[0],
                    MddlNm: '',
                    LastNm: columns[13].split(' ')[1],
                    MrchntClssfctnCd: 'BLANK',
                  },
                  Cdtr: {
                    FrstNm: columns[14].split(' ')[0],
                    MddlNm: '',
                    LastNm: columns[14].split(' ')[1],
                    MrchntClssfctnCd: 'BLANK',
                  },
                  DbtrFinSvcsPrvdrFees: {
                    Amt: 0,
                    Ccy: columns[11],
                  },
                  Xprtn: new Date(new Date(columns[0]).getTime() + 5 * 60000).toISOString(),
                },
              },
            },
          },
        },
        SplmtryData: {
          Envlp: {
            Doc: {
              InitgPty: {
                InitrTp: '',
                Glctn: {
                  Lat: '',
                  Long: '',
                },
              },
            },
          },
        },
      },
      EndToEndId: end2endID,
      TxTp: 'pain.001.001.11',
    };

    let pain013: Pain013 = {
      TxTp: 'pain.013.001.09',
      EndToEndId: end2endID,
      CdtrPmtActvtnReq: {
        GrpHdr: {
          MsgId: uuidv4().replace('-',''),
          CreDtTm: new Date(new Date(columns[0]).getTime() + 10).toISOString(),
          NbOfTxs: 1,
          InitgPty: {
            Nm: pain01.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm,
          },
        },
        PmtInf: {
          PmtInfId: pain01.CstmrCdtTrfInitn.PmtInf.PmtInfId,
          PmtMtd: pain01.CstmrCdtTrfInitn.PmtInf.PmtMtd,
          ReqdAdvcTp: {
            DbtAdvc: {
              Cd: pain01.CstmrCdtTrfInitn.PmtInf.ReqdAdvcTp.DbtAdvc.Cd,
              Prtry: pain01.CstmrCdtTrfInitn.PmtInf.ReqdAdvcTp.DbtAdvc.Prtry,
            },
          },
          ReqdExctnDt: {
            DtTm: pain01.CstmrCdtTrfInitn.PmtInf.ReqdExctnDt.DtTm,
          },
          XpryDt: {
            DtTm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.SplmtryData.Envlp.Doc.Xprtn,
          },
          Dbtr: {
            Nm: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
            CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.CtctDtls,
          },
          DbtrAcct: {
            Id: {
              Othr: {
                Id: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id,
                SchmeNm: {
                  Prtry: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
                },
                Nm: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Nm,
              },
            },
          },
          DbtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
              },
            },
          },
          CdtTrfTxInf: {
            PmtId: {
              EndToEndId: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId,
            },
            PmtTpInf: {
              CtgyPurp: {
                Prtry: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtTpInf.CtgyPurp.Prtry,
              },
            },
            Amt: {
              InstdAmt: {
                Amt: {
                  Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt,
                  Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
                },
              },
              EqvtAmt: {
                Amt: {
                  Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.EqvtAmt.Amt.Amt,
                  Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.EqvtAmt.Amt.Ccy,
                },
                CcyOfTrf: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.EqvtAmt.CcyOfTrf,
              },
            },
            ChrgBr: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.ChrgBr,
            CdtrAgt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
                },
              },
            },
            Cdtr: {
              Nm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Nm,
              CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.CtctDtls,
            },
            CdtrAcct: {
              Id: {
                Othr: {
                  Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
                  SchmeNm: {
                    Prtry: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry,
                  },
                },
              },
              Nm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Nm,
            },
            Purp: {
              Cd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Purp.Cd,
            },
            RgltryRptg: {
              Dtls: {
                Tp: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RgltryRptg.Dtls.Tp,
                Cd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RgltryRptg.Dtls.Cd,
              },
            },
            RmtInf: {
              Ustrd: '',
            },
            SplmtryData: {
              Envlp: {
                Doc: {
                  PyeeRcvAmt: {
                    Amt: {
                      Amt: 0,
                      Ccy: 'ZAR',
                    },
                  },
                  PyeeFinSvcsPrvdrFee: {
                    Amt: {
                      Amt: 0,
                      Ccy: 'ZAR',
                    },
                  },
                  PyeeFinSvcsPrvdrComssn: {
                    Amt: {
                      Amt: 0,
                      Ccy: 'ZAR',
                    },
                  },
                },
              },
            },
          },
        },
        SplmtryData: {
          Envlp: {
            Doc: {
              InitgPty: {
                Glctn: {
                  Lat: '',
                  Long: '',
                },
              },
            },
          },
        },
      },
    };

    let pacs002: Pacs002 = {
      TxTp: 'pacs.002.001.12',
      EndToEndId: end2endID,
      FIToFIPmtSts: {
        GrpHdr: {
          MsgId: uuidv4().replace('-',''),
          CreDtTm: new Date(new Date(pain01.CstmrCdtTrfInitn.GrpHdr.CreDtTm).getTime() + 30).toISOString(),
        },
        TxInfAndSts: {
          OrgnlInstrId: pain01.CstmrCdtTrfInitn.PmtInf.PmtInfId,
          OrgnlEndToEndId: pain013.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId,
          TxSts: 'ACCC',
          ChrgsInf: [
            {
              Amt: {
                Amt: 0,
                Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
              },
              Agt: {
                FinInstnId: {
                  ClrSysMmbId: {
                    MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
                  },
                },
              },
            },
            {
              Amt: {
                Amt: 0,
                Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
              },
              Agt: {
                FinInstnId: {
                  ClrSysMmbId: {
                    MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
                  },
                },
              },
            },
            {
              Amt: {
                Amt: 0,
                Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
              },
              Agt: {
                FinInstnId: {
                  ClrSysMmbId: {
                    MmbId: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
                  },
                },
              },
            },
          ],
          AccptncDtTm: new Date(), // inquire
          InstgAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
              },
            },
          },
          InstdAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
              },
            },
          },
        },
      },
    };

    let pacs008: Pacs008 = {
      TxTp: 'pacs.008.001.10',
      EndToEndId: end2endID,
      FIToFICstmrCdt: {
        GrpHdr: {
          MsgId: uuidv4().replace('-',''),
          CreDtTm: new Date(new Date(pain01.CstmrCdtTrfInitn.GrpHdr.CreDtTm).getTime() + 20).toISOString(),
          NbOfTxs: pain01.CstmrCdtTrfInitn.GrpHdr.NbOfTxs,
          SttlmInf: {
            SttlmMtd: 'CLRG',
          },
        },
        CdtTrfTxInf: {
          PmtId: {
            InstrId: pain01.CstmrCdtTrfInitn.PmtInf.PmtInfId,
            EndToEndId: end2endID,
          },
          IntrBkSttlmAmt: {
            Amt: {
              Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt,
              Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
            },
          },
          InstdAmt: {
            Amt: {
              Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt,
              Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
            },
          },
          ChrgBr: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.ChrgBr,
          ChrgsInf: {
            Amt: {
              Amt: 0,
              Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
            },
            Agt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
                },
              },
            },
          },
          InitgPty: {
            Nm: pain01.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm,
            Id: pain01.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id,
            CtctDtls: pain01.CstmrCdtTrfInitn.GrpHdr.InitgPty.CtctDtls,
          },
          Dbtr: {
            Nm: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
            Id: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.Id,
            CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.CtctDtls,
          },
          DbtrAcct: {
            Id: {
              Othr: {
                Id: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id,
                SchmeNm: {
                  Prtry: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
                },
              },
            },
            Nm: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Nm,
          },
          DbtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
              },
            },
          },
          CdtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
              },
            },
          },
          Cdtr: {
            Nm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Nm,
            Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id,
            CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.CtctDtls,
          },
          CdtrAcct: {
            Id: {
              Othr: {
                Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
                SchmeNm: {
                  Prtry: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry,
                },
              },
            },
            Nm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Nm,
          },
          Purp: {
            Cd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Purp.Cd,
          },
        },
        RgltryRptg: {
          Dtls: {
            Tp: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RgltryRptg.Dtls.Tp,
            Cd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RgltryRptg.Dtls.Cd,
          },
        },
        RmtInf: {
          Ustrd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RmtInf.Ustrd,
        },
        SplmtryData: {
          Envlp: {
            Doc: {
              Xprtn: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.SplmtryData.Envlp.Doc.Xprtn,
            },
          },
        },
      },
    };

    console.log(`Line from file: ${line}`);

    console.log('Sending Pain001 message...');
    const pain001Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/execute`,
      pain01,
    );

    console.log('Sending Pain013 message...');
    const pain013Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/quoteReply`,
      pain013,
    );

    console.log('Sending Pacs008 message...');
    const pacs008Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/transfer`,
      pacs008,
    );

    console.log('Sending Pacs002 message...');
    const pacs002Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/transfer-response`,
      pacs002,
    );

    
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

processLineByLine();

export default app;
