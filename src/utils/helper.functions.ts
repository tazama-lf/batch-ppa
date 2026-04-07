// SPDX-License-Identifier: Apache-2.0
import type { Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import * as util from 'node:util';
import { configuration, loggerService } from '..';
import { GetPacs002, GetPacs008, GetPain001FromLine, GetPain013 } from '../services/message.generation.service';
import { handleTransaction } from '../services/save.transactions.service';
import { executePost } from '../utils/execute.https';

export const sendPacs002Transaction = async (columns: string[], delta: number): Promise<boolean> => {
  loggerService.trace('Sending Pacs002 message...');
  const currentPacs002 = GetPacs002(columns, new Date(delta + Date.now()));
  loggerService.trace(`${util.inspect(currentPacs002.FIToFIPmtSts.GrpHdr.MsgId)} - Submitted`);
  return await executePost(`${configuration.TMS_ENDPOINT}/v1/evaluate/iso20022/pacs.002.001.12`, currentPacs002);
};

export const sendPrepareTransaction = async (
  columns: string[],
  batchMetadata?: { timestamp?: string; fileName?: string; fileSize?: number },
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

    // Reduced logging for high-volume processing - use trace level for per-transaction logs
    loggerService.trace('Sending Pain001 message...');
    pain001Result = (await handleTransaction(currentPain001, batchMetadata)) as Pain001 | boolean;

    loggerService.trace('Sending Pain013 message...');
    pain013Result = (await handleTransaction(currentPain013, batchMetadata)) as Pain013 | boolean;
  }

  loggerService.trace('Sending Pacs008 message...');
  const pacs008Result = (await handleTransaction(currentPacs008, batchMetadata)) as Pacs008;
  return { pain001Result, pain013Result, pacs008Result };
};
