import { type Pacs002 } from '../classes/pacs.002.001.12';
import { type Pacs008 } from '../classes/pacs.008.001.10';
import { type Pain001 } from '../classes/pain.001.001.11';
import { type Pain013 } from '../classes/pain.013.001.09';
import { v4 as uuidv4 } from 'uuid';

export const GetPain001FromLine = (columns: string[]): Pain001 => {
  const end2endID = columns[2];
  const testID = uuidv4().replace('-', '');

  const pain001: Pain001 = {
    CstmrCdtTrfInitn: {
      GrpHdr: {
        MsgId: testID,
        CreDtTm: new Date().toISOString(),
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
        CreDtTm: new Date(
          new Date(pain01.CstmrCdtTrfInitn.GrpHdr.CreDtTm).getTime() + 10,
        ).toISOString(),
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
          DtTm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.SplmtryData.Envlp.Doc
            .Xprtn,
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
                Prtry:
                  pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
              },
              Nm: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Nm,
            },
          },
        },
        DbtrAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId:
                pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId
                  .MmbId,
            },
          },
        },
        CdtTrfTxInf: {
          PmtId: {
            EndToEndId:
              pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId,
          },
          PmtTpInf: {
            CtgyPurp: {
              Prtry:
                pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtTpInf.CtgyPurp
                  .Prtry,
            },
          },
          Amt: {
            InstdAmt: {
              Amt: {
                Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt
                  .Amt,
                Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt
                  .Ccy,
              },
            },
            EqvtAmt: {
              Amt: {
                Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.EqvtAmt.Amt
                  .Amt,
                Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.EqvtAmt.Amt
                  .Ccy,
              },
              CcyOfTrf:
                pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.EqvtAmt.CcyOfTrf,
            },
          },
          ChrgBr: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.ChrgBr,
          CdtrAgt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId:
                  pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId
                    .ClrSysMmbId.MmbId,
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
                Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr
                  .Id,
                SchmeNm: {
                  Prtry:
                    pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr
                      .SchmeNm.Prtry,
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

  return pain013;
};

export const GetPacs008 = (pain01: Pain001): Pacs008 => {
  const pacs008: Pacs008 = {
    TxTp: 'pacs.008.001.10',
    EndToEndId: pain01.EndToEndId,
    FIToFICstmrCdt: {
      GrpHdr: {
        MsgId: uuidv4().replace('-', ''),
        CreDtTm: new Date(
          new Date(pain01.CstmrCdtTrfInitn.GrpHdr.CreDtTm).getTime() + 20,
        ).toISOString(),
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
            Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt
              .Amt,
            Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt
              .Ccy,
          },
        },
        InstdAmt: {
          Amt: {
            Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt
              .Amt,
            Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt
              .Ccy,
          },
        },
        ChrgBr: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.ChrgBr,
        ChrgsInf: {
          Amt: {
            Amt: 0,
            Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt
              .Ccy,
          },
          Agt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId:
                  pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId
                    .MmbId,
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
                Prtry:
                  pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
              },
            },
          },
          Nm: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Nm,
        },
        DbtrAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId:
                pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId
                  .MmbId,
            },
          },
        },
        CdtrAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId:
                pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId
                  .ClrSysMmbId.MmbId,
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
              Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr
                .Id,
              SchmeNm: {
                Prtry:
                  pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr
                    .SchmeNm.Prtry,
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
            Xprtn:
              pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.SplmtryData.Envlp.Doc
                .Xprtn,
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
    EndToEndId: columns[2],
    FIToFIPmtSts: {
      GrpHdr: {
        MsgId: uuidv4().replace('-', ''),
        CreDtTm: new Date(new Date(date).getTime() + 1000).toISOString(),
      },
      TxInfAndSts: {
        OrgnlInstrId: columns[2],
        OrgnlEndToEndId: columns[2],
        TxSts: 'ACCC',
        ChrgsInf: [
          {
            Amt: {
              Amt: 0,
              Ccy: columns[11],
            },
            Agt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: `${columns[10]}${columns[15]}`,
                },
              },
            },
          },
          {
            Amt: {
              Amt: 0,
              Ccy: columns[11],
            },
            Agt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: `${columns[10]}${columns[15]}`,
                },
              },
            },
          },
          {
            Amt: {
              Amt: 0,
              Ccy: columns[11],
            },
            Agt: {
              FinInstnId: {
                ClrSysMmbId: {
                  MmbId: `${columns[10]}${columns[16]}`,
                },
              },
            },
          },
        ],
        AccptncDtTm: new Date(),
        InstgAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: `${columns[10]}${columns[15]}`,
            },
          },
        },
        InstdAgt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: `${columns[10]}${columns[16]}`,
            },
          },
        },
      },
    },
  };

  return pacs002;
};
