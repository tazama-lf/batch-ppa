import { Pacs002 } from "../classes/pacs.002.001.12";
import { Pacs008 } from "../classes/pacs.008.001.10";
import { Pain001 } from "../classes/pain.001.001.11";
import { Pain013 } from "../classes/pain.013.001.09";


import { v4 as uuidv4 } from 'uuid';

export const GetPain013 = (pain01: Pain001) : Pain013 => {
    let pain013: Pain013 = {
        TxTp: 'pain.013.001.09',
        EndToEndId: pain01.EndToEndId,
        CdtrPmtActvtnReq: {
          GrpHdr: {
            MsgId: uuidv4().replace('-',''),
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

    return pain013;
}

export const GetPacs008 = (pain01: Pain001) : Pacs008 => {
    let pacs008: Pacs008 = {
      TxTp: 'pacs.008.001.10',
      EndToEndId: pain01.EndToEndId,
      FIToFICstmrCdt: {
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
      DebtorAcctId: pain01.DebtorAcctId,
      CreditorAcctId: pain01.CreditorAcctId,
      CreDtTm: pain01.CreDtTm
    };

    return pacs008;
}

export const GetPacs002 = (pain01: Pain001, pain013: Pain013) : Pacs002 => {
    let pacs002: Pacs002 = {
        TxTp: 'pacs.002.001.12',
        EndToEndId: pain01.EndToEndId,
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

    return pacs002;

}
