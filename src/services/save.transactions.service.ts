// SPDX-License-Identifier: Apache-2.0

import apm from 'elastic-apm-node';
import { cacheClient, databaseClient } from '..';
import { type Pain001 } from '../classes/pain.001.001.11';
import { type Pacs008 } from '../classes/pacs.008.001.10';
import { type Pain013 } from '../classes/pain.013.001.09';
import { configuration } from '../config';
import { type DataCache } from '../classes/data-cache';
import { type TransactionRelationship } from '../interfaces/iTransactionRelationship';
import { cacheDatabaseClient } from './services-container';
import { LoggerService } from '../logger.service';

export const handleTransaction = async (transaction: Pain001 | Pain013 | Pacs008): Promise<Pain001 | Pain013 | Pacs008> => {
  switch (transaction.TxTp) {
    case 'pain.001.001.11':
      return await handlePain001(transaction as Pain001);

    case 'pain.013.001.09':
      return await handlePain013(transaction as Pain013);

    case 'pacs.008.001.10':
      return await handlePacs008(transaction as Pacs008);

    default:
      throw Error('Error while selecting transaction type.');
  }
};

const handlePain001 = async (transaction: Pain001): Promise<Pain001> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');

  transaction.EndToEndId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  transaction.DebtorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
  transaction.CreditorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  transaction.CreDtTm = transaction.CstmrCdtTrfInitn.GrpHdr.CreDtTm;

  const Amt = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const creditorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id || '';
  const creditorId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id?.PrvtId.Othr.Id ?? '';
  const CreDtTm = transaction.CstmrCdtTrfInitn.GrpHdr.CreDtTm;
  const debtorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
  const debtorId = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id?.PrvtId.Othr.Id ?? '';
  const EndToEndId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const lat = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Lat;
  const long = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Long;
  const MsgId = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;
  const PmtInfId = transaction.CstmrCdtTrfInitn.PmtInf.PmtInfId;
  const TxTp = transaction.TxTp;

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

  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(
        transaction,
        configuration.db.transactionhistory_pain001_collection,
        `pain001_${transaction.EndToEndId}`,
      ),
      cacheDatabaseClient.addAccount(debtorAcctId),
      cacheDatabaseClient.addAccount(creditorAcctId),
      cacheDatabaseClient.addEntity(creditorId, CreDtTm),
      cacheDatabaseClient.addEntity(debtorId, CreDtTm),
      cacheClient.setJson(transaction.EndToEndId, JSON.stringify(dataCache), 150),
    ]);

    await Promise.all([
      cacheDatabaseClient.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseClient.addAccountHolder(creditorId, creditorAcctId, CreDtTm),
      cacheDatabaseClient.addAccountHolder(debtorId, debtorAcctId, CreDtTm),
    ]);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw err;
  }

  span?.end();
  LoggerService.log('END - Handle transaction data');
  return transaction;
};

const handlePain013 = async (transaction: Pain013): Promise<Pain013> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');

  transaction.EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;

  const Amt = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.CdtrPmtActvtnReq.GrpHdr.CreDtTm;
  const EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  const PmtInfId = transaction.CdtrPmtActvtnReq.PmtInf.PmtInfId;
  const TxTp = transaction.TxTp;

  const creditorAcctId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  const debtorAcctId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.Id;

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

  transaction._key = MsgId;

  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(
        transaction,
        configuration.db.transactionhistory_pain013_collection,
        `pain013_${transaction.EndToEndId}`,
      ),
      cacheDatabaseClient.addAccount(debtorAcctId),
      cacheDatabaseClient.addAccount(creditorAcctId),
    ]);

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw err;
  }

  span?.end();
  LoggerService.log('END - Handle transaction data');
  return transaction;
};

const handlePacs008 = async (transaction: Pacs008): Promise<Pacs008> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');

  transaction.EndToEndId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.EndToEndId;
  transaction.DebtorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
  transaction.CreditorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  transaction.CreDtTm = transaction.FIToFICstmrCdt.GrpHdr.CreDtTm;

  const Amt = transaction.FIToFICstmrCdt.CdtTrfTxInf.InstdAmt.Amt.Amt;
  const Ccy = transaction.FIToFICstmrCdt.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.FIToFICstmrCdt.GrpHdr.CreDtTm;
  const EndToEndId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.FIToFICstmrCdt.GrpHdr.MsgId;
  const PmtInfId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.InstrId;
  const TxTp = transaction.TxTp;

  const debtorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
  const creditorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorAcctId}`,
    to: `accounts/${creditorAcctId}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
  };

  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(
        transaction,
        configuration.db.transactionhistory_pacs008_collection,
        `pacs008_${transaction.EndToEndId}`,
      ),
      cacheDatabaseClient.addAccount(debtorAcctId),
      cacheDatabaseClient.addAccount(creditorAcctId),
    ]);

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw err;
  }

  span?.end();
  LoggerService.log('END - Handle transaction data');
  return transaction;
};

export const rebuildCache = async (endToEndId: string): Promise<DataCache | undefined> => {
  const currentPain001 = (await databaseClient.getTransactionPain001(endToEndId)) as [Pain001[]];
  if (!currentPain001 || !currentPain001[0] || !currentPain001[0][0]) {
    LoggerService.error('Could not find pain001 transaction to rebuild dataCache with');
    return undefined;
  }
  const dataCache: DataCache = {
    cdtrId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id?.PrvtId.Othr.Id,
    dbtrId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.Dbtr.Id?.PrvtId.Othr.Id,
    cdtrAcctId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
    dbtrAcctId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id,
  };
  await cacheClient.setJson(endToEndId, JSON.stringify(dataCache), 150);

  return dataCache;
};
