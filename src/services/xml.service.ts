import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Pacs008 } from '../classes/pacs.008.001.10';

const xml2js = require('xml2js');
//const fs = require('fs');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

export const GetPacs008FromXML = () => { 
    let xml_string = fs.readFileSync("input.xml", "utf8");
    console.log("Testing");

    let end2endID = uuidv4().replace('-', '');
    let testID = uuidv4().replace('-', '');
  

    parser.parseString(xml_string, function(error, result) {
        if(error === null) {
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
            //           InstrId: pain01.CstmrCdtTrfInitn.PmtInf.PmtInfId,
            //           EndToEndId: end2endID,
            //         },
            //         IntrBkSttlmAmt: {
            //           Amt: {
            //             Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt,
            //             Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
            //           },
            //         },
            //         InstdAmt: {
            //           Amt: {
            //             Amt: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt,
            //             Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
            //           },
            //         },
            //         ChrgBr: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.ChrgBr,
            //         ChrgsInf: {
            //           Amt: {
            //             Amt: 0,
            //             Ccy: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy,
            //           },
            //           Agt: {
            //             FinInstnId: {
            //               ClrSysMmbId: {
            //                 MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
            //               },
            //             },
            //           },
            //         },
            //         InitgPty: {
            //           Nm: pain01.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm,
            //           Id: pain01.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id,
            //           CtctDtls: pain01.CstmrCdtTrfInitn.GrpHdr.InitgPty.CtctDtls,
            //         },
            //         Dbtr: {
            //           Nm: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
            //           Id: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.Id,
            //           CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.Dbtr.CtctDtls,
            //         },
            //         DbtrAcct: {
            //           Id: {
            //             Othr: {
            //               Id: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id,
            //               SchmeNm: {
            //                 Prtry: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
            //               },
            //             },
            //           },
            //           Nm: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Nm,
            //         },
            //         DbtrAgt: {
            //           FinInstnId: {
            //             ClrSysMmbId: {
            //               MmbId: pain01.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
            //             },
            //           },
            //         },
            //         CdtrAgt: {
            //           FinInstnId: {
            //             ClrSysMmbId: {
            //               MmbId: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
            //             },
            //           },
            //         },
            //         Cdtr: {
            //           Nm: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Nm,
            //           Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id,
            //           CtctDtls: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.CtctDtls,
            //         },
            //         CdtrAcct: {
            //           Id: {
            //             Othr: {
            //               Id: pain01.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
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
        }
        else {
            console.log(error);
        }
    });
}