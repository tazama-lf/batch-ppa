// SPDX-License-Identifier: Apache-2.0
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { unwrap } from '@tazama-lf/frms-coe-lib/lib/helpers/unwrap';
import {
  type DataCache,
  type Pacs008,
  type Pain001,
  type Pain013,
  type TransactionRelationship,
} from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import apm from '../apm';

export const handleTransaction = async (transaction: Pain001 | Pain013 | Pacs008): Promise<Pain001 | Pain013 | Pacs008> => {
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

export const handlePain001 = async (transaction: Pain001, transactionType: string): Promise<Pain001> => {
  const id = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', 'handlePain001()', id);
  const span = apm.startSpan('transaction.pain001');
  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const Amt = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;

  const othrCreditorAcct = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${othrCreditorAcct.Id}${othrCreditorAcct.SchmeNm.Prtry}${creditorMmbId}`;

  const othrCreditor = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const creditorId = `${othrCreditor.Id}${othrCreditor.SchmeNm.Prtry}`;

  const othrDebtor = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr[0];
  const debtorId = `${othrDebtor.Id}${othrDebtor.SchmeNm.Prtry}`;

  const CreDtTm = transaction.CstmrCdtTrfInitn.GrpHdr.CreDtTm;

  const othrDebtorAcct = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${othrDebtorAcct.Id}${othrDebtorAcct.SchmeNm.Prtry}${debtorMmbId}`;

  const EndToEndId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const lat = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Lat;
  const long = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Long;
  const MsgId = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;
  const PmtInfId = transaction.CstmrCdtTrfInitn.PmtInf.PmtInfId;

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
      cacheDatabaseManager.saveTransactionHistory(
        transaction,
        configuration.TRANSACTION_HISTORY_PAIN001_COLLECTION,
        `pain001_${EndToEndId}`,
      ),
      cacheDatabaseManager.addAccount(debtorAcctId),
      cacheDatabaseManager.addAccount(creditorAcctId),
      cacheDatabaseManager.addEntity(creditorId, CreDtTm),
      cacheDatabaseManager.addEntity(debtorId, CreDtTm),
    ]);

    await Promise.all([
      cacheDatabaseManager.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseManager.addAccountHolder(creditorId, creditorAcctId, CreDtTm),
      cacheDatabaseManager.addAccountHolder(debtorId, debtorAcctId, CreDtTm),
    ]);
    return transaction;
  } catch (err) {
    let error: Error;
    if (err instanceof Error) {
      loggerService.error(err.message);
      error = err;
    } else {
      const strErr = JSON.stringify(err);
      loggerService.error(strErr);
      error = new Error(strErr);
    }
    spanInsert?.end();
    span?.end();
    throw error;
  }
};

export const handlePain013 = async (transaction: Pain013, transactionType: string): Promise<Pain013> => {
  const logContext = 'handlePain013()';
  const id = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', logContext, id);
  const span = apm.startSpan('transaction.pain013');

  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const Amt = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.CdtrPmtActvtnReq.GrpHdr.CreDtTm;
  const EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  const PmtInfId = transaction.CdtrPmtActvtnReq.PmtInf.PmtInfId;

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
      cacheDatabaseManager.saveTransactionHistory(
        transaction,
        configuration.TRANSACTION_HISTORY_PAIN013_COLLECTION,
        `pain013_${EndToEndId}`,
      ),
      cacheDatabaseManager.addAccount(debtorAcctId),
      cacheDatabaseManager.addAccount(creditorAcctId),
    ]);

    await cacheDatabaseManager.saveTransactionRelationship(transactionRelationship);
    return transaction;
  } catch (err) {
    let error: Error;
    if (err instanceof Error) {
      loggerService.error(err.message, logContext, id);
      error = err;
    } else {
      const strErr = JSON.stringify(err);
      error = new Error(strErr);
      loggerService.error(strErr, logContext, id);
    }
    spanInsert?.end();
    span?.end();
    throw error;
  }
};

export const handlePacs008 = async (transaction: Pacs008, transactionType: string): Promise<Pacs008> => {
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
  const XchgRate = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.XchgRate;
  const Ccy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const creDtTm = transaction.FIToFICstmrCdtTrf.GrpHdr.CreDtTm;
  const EndToEndId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.FIToFICstmrCdtTrf.GrpHdr.MsgId;
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
    pendingPromises.push(cacheDatabaseManager.set(EndToEndId, cacheBuffer, redisTTL ? Number(redisTTL) : 0));
  } else {
    // this is fatal
    throw new Error('[pacs008] data cache could not be serialised');
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
  cacheDatabaseManager.saveTransactionRelationship(transactionRelationship);

  const spanInsert = apm.startSpan('db.insert.pacs008');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(
        transaction,
        configuration.TRANSACTION_HISTORY_PACS008_COLLECTION,
        `pacs008_${EndToEndId}`,
      ),
    ]);
    return transaction;
  } catch (err) {
    let error: Error;
    if (err instanceof Error) {
      loggerService.error(err.message, logContext, id);
      error = err;
    } else {
      const strErr = JSON.stringify(err);
      loggerService.error(strErr, logContext, id);
      error = new Error(strErr);
    }
    spanInsert?.end();
    span?.end();
    throw error;
  } finally {
    spanInsert?.end();
  }
};

/**
 * Rebuilds the DataCache object using the given endToEndId to fetch a stored Pacs008 message
 *
 * @param {string} endToEndId
 * @return {*}  {(Promise<DataCache | undefined>)}
 */
export const rebuildCache = async (endToEndId: string, writeToRedis: boolean, id?: string): Promise<DataCache | undefined> => {
  const span = apm.startSpan('db.cache.rebuild');
  const context = 'rebuildCache()';
  const currentPacs008 = (await cacheDatabaseManager.getTransactionPacs008(endToEndId)) as [Pacs008[]];

  const pacs008 = unwrap(currentPacs008);

  if (!pacs008) {
    loggerService.error('Could not find pacs008 transaction to rebuild dataCache with', context, id);
    span?.end();
    return undefined;
  }

  const cdtTrfTxInf = pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf;

  const dataCache: DataCache = {
    cdtrId: cdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0].Id,
    dbtrId: cdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0].Id,
    cdtrAcctId: cdtTrfTxInf.CdtrAcct.Id.Othr[0].Id,
    dbtrAcctId: cdtTrfTxInf.DbtrAcct.Id.Othr[0].Id,
    creDtTm: pacs008.FIToFICstmrCdtTrf.GrpHdr.CreDtTm,
    instdAmt: {
      amt: parseFloat(cdtTrfTxInf.InstdAmt.Amt.Amt),
      ccy: cdtTrfTxInf.InstdAmt.Amt.Ccy,
    },
    intrBkSttlmAmt: {
      amt: parseFloat(cdtTrfTxInf.IntrBkSttlmAmt.Amt.Amt),
      ccy: cdtTrfTxInf.IntrBkSttlmAmt.Amt.Ccy,
    },
    xchgRate: cdtTrfTxInf.XchgRate,
  };

  if (writeToRedis) {
    const buffer = createMessageBuffer({ DataCache: { ...dataCache } });

    if (buffer) {
      const redisTTL = configuration.redisConfig.distributedCacheTTL;
      await cacheDatabaseManager.set(endToEndId, buffer, redisTTL ? Number(redisTTL) : 0);
    } else {
      loggerService.error('[pacs008] could not rebuild redis cache');
    }
  }

  span?.end();
  return dataCache;
};
