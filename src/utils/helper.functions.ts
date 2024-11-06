import { type Pacs008, type Pain001, type Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import type * as readline from 'readline';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import { executePost } from '../utils/execute.https';
import { Fields } from '../utils/transaction.enum';
import { GetPacs002, GetPacs008, GetPain001FromLine, GetPain013 } from '../services/message.generation.service';
import { handleTransaction } from '../services/save.transactions.service';

export const getMissingTransaction = async (batchSourceFileLine: readline.Interface): Promise<string[]> => {
  let endToEndIds: string[] = [];
  for await (const line of batchSourceFileLine) {
    const columns = line.split('|');
    if (!new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime()) continue;

    endToEndIds.push(columns[Fields.END_TO_END_TRANSACTION_ID]);
  }
  endToEndIds = (await cacheDatabaseManager.getUnExistingTransactions(endToEndIds))[0];
  return endToEndIds;
};

export const sendPacs002Transaction = async (columns: string[], delta: number): Promise<boolean> => {
  loggerService.log('Sending Pacs002 message...');
  const currentPacs002 = GetPacs002(columns, new Date(delta + Date.now()));
  loggerService.log(`${JSON.stringify(currentPacs002.FIToFIPmtSts.GrpHdr.MsgId)} - Submitted`);
  return await executePost(`${configuration.TMS_ENDPOINT}/v1/evaluate/iso20022/pacs.002.001.12`, currentPacs002);
};

export const sendPrepareTransaction = async (
  columns: string[],
): Promise<{
  pain001Result: Pain001 | boolean;
  pain013Result: Pain013 | boolean;
  pacs008Result: Pacs008 | boolean;
}> => {
  const currentPain001 = GetPain001FromLine(columns);
  const currentPacs008 = GetPacs008(currentPain001);

  let pain001Result: Pain001 | boolean = true;
  let pain013Result: Pain013 | boolean = true;

  if (configuration.QUOTING) {
    const currentPain013 = GetPain013(currentPain001);

    loggerService.log('Sending Pain001 message...');
    pain001Result = (await handleTransaction(currentPain001)) as Pain001 | boolean;

    loggerService.log('Sending Pain013 message...');
    pain013Result = (await handleTransaction(currentPain013)) as Pain013 | boolean;
  }

  loggerService.log('Sending Pacs008 message...');
  const pacs008Result = (await handleTransaction(currentPacs008)) as Pacs008;
  return { pain001Result, pain013Result, pacs008Result };
};
