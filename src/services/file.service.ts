/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Pain001 } from '../classes/pain.001.001.11';
import * as fs from 'fs';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '..';
import { configuration } from '../config';
import { LoggerService } from '../logger.service';
import {
  GetPacs002,
  GetPacs008,
  GetPain013,
} from './message.generation.service';
import { executePost } from './utilities.service';
import { handleTransaction } from './save.transactions.service';
import { type Pain013 } from '../classes/pain.013.001.09';
import { type Pacs008 } from '../classes/pacs.008.001.10';

export const GetPain001FromLine = (
  columns: string[],
  date: string,
): Pain001 => {
  const end2endID = uuidv4().replace('-', '');
  const testID = uuidv4().replace('-', '');

  const pain001: Pain001 = {
    CstmrCdtTrfInitn: {
      GrpHdr: {
        MsgId: testID,
        CreDtTm: date.length ? date : new Date(columns[0]).toISOString(),
        InitgPty: {
          Nm: columns[13],
          Id: {
            PrvtId: {
              DtAndPlcOfBirth: {
                BirthDt: new Date('1968-02-01'),
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
                BirthDt: new Date('1968-02-01'),
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
              Id:
                columns[14] === 'Y'
                  ? `${columns[17]}${columns[13]}`
                  : `${columns[17]}`,
              SchmeNm: {
                Prtry:
                  columns[14] === 'Y' ? 'SUSPENSE_ACCOUNT' : 'USER_ACCOUNT',
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
                  BirthDt: new Date('1968-02-01'),
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
                Id:
                  columns[14] === 'Y'
                    ? `${columns[18]}${columns[14]}`
                    : `${columns[18]}`,
                SchmeNm: {
                  Prtry:
                    columns[14] === 'Y' ? 'SUSPENSE_ACCOUNT' : 'USER_ACCOUNT',
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
                Xprtn: new Date(
                  new Date(columns[0]).getTime() + 5 * 60000,
                ).toISOString(),
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
    DebtorAcctId:
      columns[14] === 'Y' ? `${columns[17]}${columns[13]}` : `${columns[17]}`,
    CreditorAcctId:
      columns[14] === 'Y' ? `${columns[18]}${columns[14]}` : `${columns[18]}`,
    CreDtTm: new Date(columns[0]).toISOString(),
  };

  return pain001;
};

const sendPrepareTransaction = async (
  currentPain001: Pain001,
  currentPain013: Pain013,
  currentPacs008: Pacs008,
): Promise<{
  pain001Result: Pain001;
  pain013Result: Pain013;
  pacs008Result: Pacs008;
}> => {
  LoggerService.log('Sending Pain001 message...');
  const pain001Result = (await handleTransaction(currentPain001)) as Pain001;

  LoggerService.log('Sending Pain013 message...');
  const pain013Result = (await handleTransaction(currentPain013)) as Pain013;

  LoggerService.log('Sending Pacs008 message...');
  const pacs008Result = (await handleTransaction(currentPacs008)) as Pacs008;
  return { pain001Result, pain013Result, pacs008Result };
};

export const SendLineMessages = async (requestBody: any): Promise<number> => {
  const fileStream = fs.createReadStream('./uploads/input.txt');

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

    const columns = line.split('|');
    let date = '';
    if (requestBody.setDate) {
      if (String(requestBody.setDate) === 'now')
        date = new Date().toISOString();
      if (new Date(String(requestBody.setDate)).getMilliseconds() > 0)
        date = new Date(String(requestBody.setDate)).toISOString();
    }

    let currentPain001: Pain001;
    let currentPain013: Pain013;
    let currentPacs008: Pacs008;

    let pacs002Result = false;
    if (requestBody.pacs002) {
      currentPain001 = await dbService.getRelatedPain001(columns[2]);
      currentPain013 = await dbService.getRelatedPain013(columns[2]);
      LoggerService.log('Sending Pacs002 message...');
      const currentPacs002 = GetPacs002(currentPain001, currentPain013);
      LoggerService.log(
        `${JSON.stringify(
          currentPacs002.FIToFIPmtSts.GrpHdr.MsgId,
        )} - Submitted`,
      );
      pacs002Result = await executePost(
        `${configuration.tmsEndpoint}transfer-response`,
        currentPacs002,
      );
    } else {
      currentPain001 = GetPain001FromLine(columns, date);
      currentPacs008 = GetPacs008(currentPain001);
      currentPain013 = GetPain013(currentPain001);

      await sendPrepareTransaction(
        currentPain001,
        currentPain013,
        currentPacs008,
      );
    }

    if (pacs002Result) {
      await delay(configuration.delay);

      if (configuration.verifyReports) {
        let value;
        try {
          value = await dbService.getTransactionReport(
            currentPain001.EndToEndId,
          );
        } catch (ex) {
          LoggerService.error(
            `Failed to communicate with Arango to check report. ${JSON.stringify(
              ex,
            )}`,
          );
        }

        if (value && value.length > 0) {
          LoggerService.log(
            `Report generated for: ${currentPain001.EndToEndId}`,
          );

          if (
            (columns[24].toString().trim() === 'N' &&
              value[0][0].report.status === 'NALT') ||
            (columns[24].toString().trim() === 'Y' &&
              value[0][0].report.status === 'ALT')
          ) {
            LoggerService.log(`Report Matches Test Data`);
          } else {
            LoggerService.log(`Report does not match Test Data`);
          }
        } else {
          LoggerService.log(
            `Failed to generate report for: ${currentPain001.EndToEndId}`,
          );
        }
      }
    }
    counter++;
  }
  return counter;

  async function delay(time: number | undefined): Promise<unknown> {
    return await new Promise((resolve) => setTimeout(resolve, time));
  }
};
