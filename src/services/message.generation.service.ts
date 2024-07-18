// SPDX-License-Identifier: Apache-2.0

import { type Pacs002 } from '../classes/pacs.002.001.12';
import { type Pacs008 } from '../classes/pacs.008.001.10';
import { type Pain001 } from '../classes/pain.001.001.11';
import { type Pain013 } from '../classes/pain.013.001.09';
import { v4 as uuidv4 } from 'uuid';
import { Fields } from './utilities.service';

export const GetPain001FromLine = (columns: string[]): Pain001 => {
  const end2endID = columns[Fields.MESSAGE_ID];
  const testID = uuidv4().replace('-', '');

  const pain001: Pain001 = {
    CstmrCdtTrfInitn: {
      GrpHdr: {
        MsgId: testID,
        CreDtTm: new Date().toISOString(),
        InitgPty: {
          Nm: columns[Fields.SENDER_NAME],
          Id: {
            PrvtId: {
              DtAndPlcOfBirth: {
                BirthDt: new Date('1968-02-01'),
                CityOfBirth: 'Unknown',
                CtryOfBirth: 'ZZ',
              },
              Othr: [
                {
                  Id: columns[Fields.SENDER_ACCOUNT],
                  SchmeNm: {
                    Prtry: 'ACCOUNT NUMBER',
                  },
                },
              ],
            },
          },
          CtctDtls: {
            MobNb: '+11-762995524',
          },
        },
        NbOfTxs: 1,
      },
      PmtInf: {
        PmtInfId: columns[Fields.MESSAGE_ID],
        PmtMtd: 'TRA',
        ReqdAdvcTp: {
          DbtAdvc: {
            Cd: 'ADWD',
            Prtry: 'Advice with transaction details',
          },
        },
        ReqdExctnDt: {
          Dt: new Date(columns[Fields.PROCESSING_DATE_TIME]).toISOString().substring(0, 10),
          DtTm: new Date(columns[Fields.PROCESSING_DATE_TIME]).toISOString(),
        },
        Dbtr: {
          Nm: columns[Fields.SENDER_NAME],
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
              Othr: [
                {
                  Id: columns[Fields.SENDER_ACCOUNT],
                  SchmeNm: {
                    Prtry: 'ACCOUNT NUMBER',
                  },
                },
              ],
            },
          },
        },

        DbtrAcct: {
          Id: {
            Othr: [
              {
                Id:
                  columns[Fields.RECEIVER_NAME] === 'Y'
                    ? `${columns[Fields.SENDER_ACCOUNT]}${columns[Fields.SENDER_NAME]}`
                    : `${columns[Fields.SENDER_ACCOUNT]}`,
                SchmeNm: {
                  Prtry: columns[Fields.RECEIVER_NAME] === 'Y' ? 'SUSPENSE_ACCOUNT' : 'USER_ACCOUNT',
                },
              },
            ],
          },
          Nm: columns[Fields.SENDER_NAME],
        },
        DbtrAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: `${columns[Fields.PAYMENT_COUNTRY_CODE]}${columns[Fields.SENDER_AGENT_SPID]}`,
            },
          },
        },
        CdtTrfTxInf: {
          PmtId: {
            EndToEndId: end2endID,
          },
          PmtTpInf: {
            CtgyPurp: {
              Prtry: columns[Fields.TRANSACTION_TYPE],
            },
          },
          Amt: {
            InstdAmt: {
              Amt: {
                Amt: Number(columns[Fields.TOTAL_PAYMENT_AMOUNT]),
                Ccy: columns[Fields.PAYMENT_CURRENCY_CODE],
              },
            },
            EqvtAmt: {
              Amt: {
                Amt: Number(columns[Fields.TOTAL_PAYMENT_AMOUNT]),
                Ccy: columns[Fields.PAYMENT_CURRENCY_CODE],
              },
              CcyOfTrf: columns[Fields.PAYMENT_CURRENCY_CODE],
            },
          },
          ChrgBr: 'DEBT',
          CdtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: `${columns[Fields.PAYMENT_COUNTRY_CODE]}${columns[Fields.RECEIVER_AGENT_SPID]}`,
              },
            },
          },
          Cdtr: {
            Nm: columns[Fields.RECEIVER_NAME],
            Id: {
              PrvtId: {
                DtAndPlcOfBirth: {
                  BirthDt: new Date('1968-02-01'),
                  CityOfBirth: 'Unknown',
                  CtryOfBirth: 'ZZ',
                },
                Othr: [
                  {
                    Id: columns[Fields.RECEIVER_ACCOUNT],
                    SchmeNm: {
                      Prtry: 'ACCOUNT NUMBER',
                    },
                  },
                ],
              },
            },
            CtctDtls: {
              MobNb: '+11-762995523',
            },
          },
          CdtrAcct: {
            Id: {
              Othr: [
                {
                  Id:
                    columns[Fields.RECEIVER_NAME] === 'Y'
                      ? `${columns[Fields.RECEIVER_ACCOUNT]}${columns[Fields.RECEIVER_NAME]}`
                      : `${columns[Fields.RECEIVER_ACCOUNT]}`,
                  SchmeNm: {
                    Prtry: columns[Fields.RECEIVER_NAME] === 'Y' ? 'SUSPENSE_ACCOUNT' : 'USER_ACCOUNT',
                  },
                },
              ],
            },
            Nm: columns[Fields.RECEIVER_NAME],
          },
          Purp: {
            Cd: 'MP2P',
          },
          RgltryRptg: {
            Dtls: {
              Tp: 'REPORTING CODE',
              Cd: columns[Fields.REPORTING_CODE],
            },
          },
          RmtInf: {
            Ustrd: '',
          },
          SplmtryData: {
            Envlp: {
              Doc: {
                Dbtr: {
                  FrstNm: columns[Fields.SENDER_NAME].split(' ')[0],
                  MddlNm: '',
                  LastNm: columns[Fields.SENDER_NAME].split(' ')[1],
                  MrchntClssfctnCd: 'BLANK',
                },
                Cdtr: {
                  FrstNm: columns[Fields.RECEIVER_NAME].split(' ')[0],
                  MddlNm: '',
                  LastNm: columns[Fields.RECEIVER_NAME].split(' ')[1],
                  MrchntClssfctnCd: 'BLANK',
                },
                DbtrFinSvcsPrvdrFees: {
                  Amt: 0,
                  Ccy: columns[Fields.PAYMENT_CURRENCY_CODE],
                },
                Xprtn: new Date(new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime() + 5 * 60000).toISOString(),
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
      columns[Fields.RECEIVER_NAME] === 'Y'
        ? `${columns[Fields.SENDER_ACCOUNT]}${columns[Fields.SENDER_NAME]}`
        : `${columns[Fields.SENDER_ACCOUNT]}`,
    CreditorAcctId:
      columns[Fields.RECEIVER_NAME] === 'Y'
        ? `${columns[Fields.RECEIVER_ACCOUNT]}${columns[Fields.RECEIVER_NAME]}`
        : `${columns[Fields.RECEIVER_ACCOUNT]}`,
    CreDtTm: new Date().toISOString(),
  };

  return pain001;
};

export const GetPain013 = (pain01: Pain001): Pain013 => {
  const pain013: Pain013 = {
    TxTp: 'pain.013.001.09',
    EndToEndId: pain01.EndToEndId,
    CdtrPmtActvtnReq: {
      GrpHdr: {
        MsgId: uuidv4().replace('-', ''),
        CreDtTm: new Date(new Date(pain01.CstmrCdtTrfInitn.GrpHdr.CreDtTm).getTime() + 10).toISOString(),
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
            Othr: [
              {
                Id: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0].Id,
                SchmeNm: {
                  Prtry: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0].SchmeNm.Prtry,
                },
                Nm: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Nm,
              },
            ],
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
              Othr: [
                {
                  Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id,
                  SchmeNm: {
                    Prtry: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].SchmeNm.Prtry,
                  },
                },
              ],
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

  return pain013;
};

export const GetPacs008 = (pain01: Pain001): Pacs008 => {
  const pacs008: Pacs008 = {
    TxTp: 'pacs.008.001.10',
    EndToEndId: pain01.EndToEndId,
    FIToFICstmrCdtTrf: {
      GrpHdr: {
        MsgId: uuidv4().replace('-', ''),
        CreDtTm: new Date(new Date(pain01.CstmrCdtTrfInitn.GrpHdr.CreDtTm).getTime() + 20).toISOString(),
        NbOfTxs: pain01.CstmrCdtTrfInitn.GrpHdr.NbOfTxs,
        SttlmInf: {
          SttlmMtd: 'CLRG',
        },
      },
      CdtTrfTxInf: {
        PmtId: {
          InstrId: pain01.CstmrCdtTrfInitn.PmtInf.PmtInfId,
          EndToEndId: pain01.EndToEndId,
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
            Othr: [
              {
                Id: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0].Id,
                SchmeNm: {
                  Prtry: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0].SchmeNm.Prtry,
                },
              },
            ],
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
            Othr: [
              {
                Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id,
                SchmeNm: {
                  Prtry: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].SchmeNm.Prtry,
                },
              },
            ],
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
    DebtorAcctId: pain01.DebtorAcctId,
    CreditorAcctId: pain01.CreditorAcctId,
    CreDtTm: pain01.CreDtTm,
  };

  return pacs008;
};

export const GetPacs002 = (columns: string[], date: Date): Pacs002 => {
  const pacs002: Pacs002 = {
    TxTp: 'pacs.002.001.12',
    EndToEndId: columns[Fields.MESSAGE_ID],
    FIToFIPmtSts: {
      GrpHdr: {
        MsgId: uuidv4().replace('-', ''),
        CreDtTm: new Date(new Date(date).getTime() + 1000).toISOString(),
      },
      TxInfAndSts: {
        OrgnlInstrId: columns[Fields.MESSAGE_ID],
        OrgnlEndToEndId: columns[Fields.MESSAGE_ID],
        TxSts: 'ACCC',
        ChrgsInf: [
          {
            Amt: {
              Amt: 0,
              Ccy: columns[Fields.PAYMENT_CURRENCY_CODE],
            },
            Agt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: `${columns[Fields.PAYMENT_COUNTRY_CODE]}${columns[Fields.SENDER_AGENT_SPID]}`,
                },
              },
            },
          },
          {
            Amt: {
              Amt: 0,
              Ccy: columns[Fields.PAYMENT_CURRENCY_CODE],
            },
            Agt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: `${columns[Fields.PAYMENT_COUNTRY_CODE]}${columns[Fields.SENDER_AGENT_SPID]}`,
                },
              },
            },
          },
          {
            Amt: {
              Amt: 0,
              Ccy: columns[Fields.PAYMENT_CURRENCY_CODE],
            },
            Agt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: `${columns[Fields.PAYMENT_COUNTRY_CODE]}${columns[Fields.RECEIVER_AGENT_SPID]}`,
                },
              },
            },
          },
        ],
        AccptncDtTm: new Date(),
        InstgAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: `${columns[Fields.PAYMENT_COUNTRY_CODE]}${columns[Fields.SENDER_AGENT_SPID]}`,
            },
          },
        },
        InstdAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: `${columns[Fields.PAYMENT_COUNTRY_CODE]}${columns[Fields.RECEIVER_AGENT_SPID]}`,
            },
          },
        },
      },
    },
  };

  return pacs002;
};
