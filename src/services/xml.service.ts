// SPDX-License-Identifier: Apache-2.0

/* eslint-disable*/
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Pacs008 } from '../classes/pacs.008.001.10';

const xml2js = require('xml2js');
// const fs = require('fs');
const parser = new xml2js.Parser({ attrkey: 'ATTR' });

export const GetPacs008FromXML = () => {
  const xml_string = fs.readFileSync('input.xml', 'utf8');
  console.log('Testing');

  const end2endID = uuidv4().replace('-', '');
  const testID = uuidv4().replace('-', '');

  parser.parseString(xml_string, function (error, result) {
    if (error === null) {
      console.log(result);

      // let pacs008: Pacs008 = {
      //     TxTp: 'pacs.008.001.10',
      //     EndToEndId: end2endID,
      //     FIToFICstmrCdt: {
      //       GrpHdr: {
      //         MsgId: uuidv4().replace('-',''),
      //         CreDtTm: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].GrpHdr[0].CreDtTm[0],
      //         NbOfTxs: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].GrpHdr[0].NbOfTxs[0],
      //         SttlmInf: {
      //           SttlmMtd: 'CLRG',
      //         },
      //       },
      //       CdtTrfTxInf: {
      //         PmtId: {
      //           InstrId: testID,
      //           EndToEndId: end2endID,
      //         },
      //         IntrBkSttlmAmt: {
      //           Amt: {
      //             Amt: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].IntrBkSttlmAmt[0]._,
      //             Ccy: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].IntrBkSttlmAmt[0].ATTR.Ccy,
      //           },
      //         },
      //         InstdAmt: {
      //           Amt: {
      //             Amt: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].IntrBkSttlmAmt[0]._,
      //             Ccy: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].IntrBkSttlmAmt[0].ATTR.Ccy,
      //           },
      //         },
      //         ChrgBr: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].ChrgBr,
      //         ChrgsInf: {
      //           Amt: {
      //             Amt: 0,
      //             Ccy: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].IntrBkSttlmAmt[0].ATTR.Ccy,
      //           },
      //           Agt: {
      //             FinInstnId: {
      //               ClrSysMmbId: {
      //                 MmbId:"",
      //               },
      //             },
      //           },
      //         },
      //         Dbtr: {
      //           Nm: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
      //           Id: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.Id,
      //           CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.CtctDtls,
      //         },
      //         DbtrAcct: {
      //           IBAN: "",
      //           Id: {
      //             Othr: {
      //               Id: "",
      //               SchmeNm: {
      //                 Prtry: "IBAN",
      //               },
      //             },
      //           },
      //         },
      //         Cdtr: {
      //           Nm: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].Cdtr[0].Nm,
      //           Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id,
      //           CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.CtctDtls,
      //         },
      //         CdtrAcct: {
      //           Id: {
      //             Othr: {
      //               Id: result.RequestPayload.Document[0].FIToFICstmrCdtTrf[0].CdtTrfTxInf[0].CdtrAcct[0].Id[0].Othr[0].Id,
      //               SchmeNm: {
      //                 Prtry: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry,
      //               },
      //             },
      //           },
      //           Nm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Nm,
      //         },
      //         Purp: {
      //           Cd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Purp.Cd,
      //         },
      //       },
      //       RgltryRptg: {
      //         Dtls: {
      //           Tp: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RgltryRptg.Dtls.Tp,
      //           Cd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RgltryRptg.Dtls.Cd,
      //         },
      //       },
      //       RmtInf: {
      //         Ustrd: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.RmtInf.Ustrd,
      //       },
      //       SplmtryData: {
      //         Envlp: {
      //           Doc: {
      //             Xprtn: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.SplmtryData.Envlp.Doc.Xprtn,
      //           },
      //         },
      //       },
      //     },
      //   };
    } else {
      console.log(error);
    }
  });
};
