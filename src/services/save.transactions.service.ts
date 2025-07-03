// SPDX-License-Identifier: Apache-2.0
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import type { DataCache, Pacs008, Pain001, Pain013, TransactionRelationship } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import apm from '../apm';

export const handleTransaction = async (transaction: Pain001 | Pain013 | Pacs008): Promise<Pain001 | Pain013 | Pacs008 | boolean> => {
  switch (transaction.TxTp) {
    case 'pain.001.001.11':
      return await handlePain001(transaction as Pain001, transaction.TxTp);

    case 'pain.013.001.09':
      return await handlePain013(transaction as Pain013, transaction.TxTp);

    case 'pacs.008.001.10':
      return await handlePacs008(transaction as Pacs008, transaction.TxTp);

    default:
      throw Error('Error while selecting transaction type.');
  }
};

export const handlePain001 = async (transaction: Pain001, transactionType: string): Promise<Pain001 | boolean> => {
  const id = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', 'handlePain001()', id);
  const span = apm.startSpan('transaction.pain001');
  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { Amt } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;

  const othrCreditorAcct = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${othrCreditorAcct.Id}${othrCreditorAcct.SchmeNm.Prtry}${creditorMmbId}`;

  const othrCreditor = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const creditorId = `${othrCreditor.Id}${othrCreditor.SchmeNm.Prtry}`;

  const othrDebtor = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr[0];
  const debtorId = `${othrDebtor.Id}${othrDebtor.SchmeNm.Prtry}`;

  const { CreDtTm } = transaction.CstmrCdtTrfInitn.GrpHdr;

  const othrDebtorAcct = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${othrDebtorAcct.Id}${othrDebtorAcct.SchmeNm.Prtry}${debtorMmbId}`;

  const { EndToEndId } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId;
  const lat = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Lat;
  const long = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Long;
  const { MsgId } = transaction.CstmrCdtTrfInitn.GrpHdr;
  const { PmtInfId } = transaction.CstmrCdtTrfInitn.PmtInf;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorAcctId}`,
    to: `accounts/${creditorAcctId}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    lat,
    long,
    MsgId,
    PmtInfId,
    TxTp,
  };

  const dataCache: DataCache = {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
  };

  transaction.DataCache = dataCache;

  const spanInsert = apm.startSpan('db.insert.pain001');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction, `pain001_${EndToEndId}`),
      cacheDatabaseManager.addAccount(debtorAcctId.replaceAll(' ', '_')),
      cacheDatabaseManager.addAccount(creditorAcctId.replaceAll(' ', '_')),
      cacheDatabaseManager.addEntity(creditorId.replaceAll(' ', '_'), CreDtTm),
      cacheDatabaseManager.addEntity(debtorId.replaceAll(' ', '_'), CreDtTm),
    ]);

    await Promise.all([
      cacheDatabaseManager.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseManager.addAccountHolder(creditorId, creditorAcctId, CreDtTm),
      cacheDatabaseManager.addAccountHolder(debtorId, debtorAcctId, CreDtTm),
    ]);
    return transaction;
  } catch (err) {
    if (err instanceof Error) {
      loggerService.error(err.message);
    } else {
      const strErr = JSON.stringify(err);
      loggerService.error(strErr);
    }
    spanInsert?.end();
    span?.end();
    return false;
  }
};

export const handlePain013 = async (transaction: Pain013, transactionType: string): Promise<Pain013 | boolean> => {
  const logContext = 'handlePain013()';
  const id = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', logContext, id);
  const span = apm.startSpan('transaction.pain013');

  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { Amt } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { CreDtTm } = transaction.CdtrPmtActvtnReq.GrpHdr;
  const { EndToEndId } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId;
  const { MsgId } = transaction.CdtrPmtActvtnReq.GrpHdr;
  const { PmtInfId } = transaction.CdtrPmtActvtnReq.PmtInf;

  const creditorAcctOthr = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${creditorAcctOthr.Id}${creditorAcctOthr.SchmeNm.Prtry}${creditorMmbId}`;

  const debtorAcctOthr = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${debtorAcctOthr.Id}${debtorAcctOthr.SchmeNm.Prtry}${debtorMmbId}`;

  const dbtrOthr = transaction.CdtrPmtActvtnReq.PmtInf.Dbtr.Id.PrvtId.Othr[0];
  const dbtrId = `${dbtrOthr.Id}${dbtrOthr.SchmeNm.Prtry}`;

  const cdtrOthr = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const cdtrId = `${cdtrOthr.Id}${cdtrOthr.SchmeNm.Prtry}`;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${creditorAcctId}`,
    to: `accounts/${debtorAcctId}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
  };

  const dataCache: DataCache = {
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
    cdtrId,
    dbtrId,
  };

  transaction.DataCache = dataCache;
  transaction._key = MsgId;

  const spanInsert = apm.startSpan('db.insert.pain013');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction, `pain013_${EndToEndId}`),
      cacheDatabaseManager.addAccount(debtorAcctId),
      cacheDatabaseManager.addAccount(creditorAcctId),
    ]);

    await cacheDatabaseManager.saveTransactionRelationship(transactionRelationship);
    return transaction;
  } catch (err) {
    if (err instanceof Error) {
      loggerService.error(err.message, logContext, id);
    } else {
      const strErr = JSON.stringify(err);
      loggerService.error(strErr, logContext, id);
    }
    spanInsert?.end();
    span?.end();
    return false;
  }
};

export const handlePacs008 = async (transaction: Pacs008, transactionType: string): Promise<Pacs008 | boolean> => {
  const logContext = 'handlePacs008()';
  const id = transaction.FIToFICstmrCdtTrf.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', logContext, id);
  const span = apm.startSpan('transaction.pacs008');

  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const InstdAmt = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Amt;
  const InstdAmtCcy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const IntrBkSttlmAmt = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.IntrBkSttlmAmt.Amt.Amt;
  const IntrBkSttlmAmtCcy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.IntrBkSttlmAmt.Amt.Ccy;
  const { XchgRate } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf;
  const { Ccy } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt;
  const creDtTm = transaction.FIToFICstmrCdtTrf.GrpHdr.CreDtTm;
  const { EndToEndId } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId;
  const { MsgId } = transaction.FIToFICstmrCdtTrf.GrpHdr;
  const PmtInfId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.InstrId;
  const debtorOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0];
  const debtorId = `${debtorOthr.Id}${debtorOthr.SchmeNm.Prtry}`;

  const creditorOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const creditorId = `${creditorOthr.Id}${creditorOthr.SchmeNm.Prtry}`;

  const debtorAcctOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${debtorAcctOthr.Id}${debtorAcctOthr.SchmeNm.Prtry}${debtorMmbId}`;

  const creditorAcctOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${creditorAcctOthr.Id}${creditorAcctOthr.SchmeNm.Prtry}${creditorMmbId}`;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorAcctId}`,
    to: `accounts/${creditorAcctId}`,
    Amt: InstdAmt,
    Ccy,
    CreDtTm: creDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
  };

  const pendingPromises = [cacheDatabaseManager.addAccount(debtorAcctId), cacheDatabaseManager.addAccount(creditorAcctId)];

  const dataCache: DataCache = {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
    creDtTm,
    instdAmt: {
      amt: parseFloat(InstdAmt),
      ccy: InstdAmtCcy,
    },
    intrBkSttlmAmt: {
      amt: parseFloat(IntrBkSttlmAmt),
      ccy: IntrBkSttlmAmtCcy,
    },
    xchgRate: XchgRate,
  };
  transaction.DataCache = dataCache;

  const cacheBuffer = createMessageBuffer({ DataCache: { ...dataCache } });
  if (cacheBuffer) {
    const redisTTL = configuration.redisConfig.distributedCacheTTL;
    pendingPromises.push(cacheDatabaseManager.set(EndToEndId, cacheBuffer, redisTTL ?? 0));
  } else {
    // this is fatal
    throw new Error('[pacs008] data cache could not be serialized');
  }

  if (!configuration.QUOTING) {
    pendingPromises.push(cacheDatabaseManager.addEntity(creditorId, creDtTm));
    pendingPromises.push(cacheDatabaseManager.addEntity(debtorId, creDtTm));

    await Promise.all(pendingPromises);

    await Promise.all([
      cacheDatabaseManager.addAccountHolder(creditorId, creditorAcctId, creDtTm),
      cacheDatabaseManager.addAccountHolder(debtorId, debtorAcctId, creDtTm),
    ]);
  } else {
    await Promise.all(pendingPromises);
  }

  const spanInsert = apm.startSpan('db.insert.pacs008');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseManager.saveTransactionHistory(transaction, `pacs008_${EndToEndId}`),
    ]);
    return transaction;
  } catch (err) {
    if (err instanceof Error) {
      loggerService.error(err.message, logContext, id);
    } else {
      const strErr = JSON.stringify(err);
      loggerService.error(strErr, logContext, id);
    }
    spanInsert?.end();
    span?.end();
    return false;
  } finally {
    spanInsert?.end();
  }
};
