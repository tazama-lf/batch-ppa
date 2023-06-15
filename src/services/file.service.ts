import { Pain001 } from '../classes/pain.001.001.11';

import * as fs from 'fs';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '..';
import { configuration } from '../config';
import { LoggerService } from '../logger.service';
import { GetPacs002, GetPacs008, GetPain013 } from './message.generation.service';
import { executePost } from './utilities.service';

export const GetPain001FromLine = (columns: string[]): Pain001 => {
  let end2endID = uuidv4().replace('-', '');
  let testID = uuidv4().replace('-', '');

  const pain001: Pain001 = {
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

  return pain001;
};

export const SendLineMessages = async () => {
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

    const columns = line.split('|');

    const currentPain001 = GetPain001FromLine(columns);
    const currentPain013 = GetPain013(currentPain001);
    const currentPacs008 = GetPacs008(currentPain001);
    const currentPacs002 = GetPacs002(currentPain001, currentPain013);

    LoggerService.log('Sending Pain001 message...');
    const pain001Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/execute`,
      currentPain001,
    );

    LoggerService.log('Sending Pain013 message...');
    const pain013Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/quoteReply`,
      currentPain013,
    );

    LoggerService.log('Sending Pacs008 message...');
    const pacs008Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/transfer`,
      currentPacs008,
    );

    LoggerService.log('Sending Pacs002 message...');
    const pacs002Result = await executePost(
      `${configuration.tmsEndpoint}function/off-transaction-monitoring-service-rel-1-0-0/transfer-response`,
      currentPacs002,
    );

    if (pacs002Result && pacs008Result && pain001Result && pain013Result) {
      LoggerService.log(`${currentPacs002.FIToFIPmtSts.GrpHdr.MsgId} - Submitted`);
      await delay(configuration.delay);

      if (configuration.verifyReports) {
        let value;
        try {
          value = await dbService.getTransactionReport(currentPain001.EndToEndId);
        } catch (ex) {
          LoggerService.error(`Failed to communicate with Arango to check report. ${JSON.stringify(ex)}`);
        }

        if (value && value.length > 0) {
          LoggerService.log(`Report generated for: ${currentPain001.EndToEndId}`);

          if (
            (columns[24].toString().trim() === 'N' && value[0][0].report.status === 'NALT') ||
            (columns[24].toString().trim() === 'Y' && value[0][0].report.status == 'ALT')
          ) {
            LoggerService.log(`Report Matches Test Data`);
          } else {
            LoggerService.log(`Report does not match Test Data`);
          }
        } else {
          LoggerService.log(`Failed to generate report for: ${currentPain001.EndToEndId}`);
        }
      }
    }
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
};
