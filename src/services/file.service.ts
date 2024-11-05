// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fs from 'fs';
import * as readline from 'readline';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import { GetPacs002, GetPacs008, GetPain013, GetPain001FromLine } from './message.generation.service';
import { executePost, Fields } from './utilities.service';
import { handleTransaction } from './save.transactions.service';
import { type Pain013, type Pacs008, type Pain001 } from '@tazama-lf/frms-coe-lib/lib/interfaces';

const getMissingTransaction = async (batchSourceFileLine: readline.Interface): Promise<string[]> => {
  let endToEndIds: string[] = [];
  for await (const line of batchSourceFileLine) {
    const columns = line.split('|');
    if (!new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime()) continue;

    endToEndIds.push(columns[Fields.END_TO_END_TRANSACTION_ID]);
  }
  endToEndIds = (await cacheDatabaseManager.getUnExistingTransactions(endToEndIds))[0];
  return endToEndIds;
};

const sendPacs002Transaction = async (columns: string[], delta: number): Promise<boolean> => {
  loggerService.log('Sending Pacs002 message...');
  const currentPacs002 = GetPacs002(columns, new Date(delta + Date.now()));
  loggerService.log(`${JSON.stringify(currentPacs002.FIToFIPmtSts.GrpHdr.MsgId)} - Submitted`);
  return await executePost(`${configuration.TMS_ENDPOINT}/v1/evaluate/iso20022/pacs.002.001.12`, currentPacs002);
};

const sendPrepareTransaction = async (
  currentPain001: Pain001,
  currentPain013: Pain013,
  currentPacs008: Pacs008,
): Promise<{
  pain001Result: Pain001;
  pain013Result: Pain013;
  pacs008Result: Pacs008;
}> => {
  loggerService.log('Sending Pain001 message...');
  const pain001Result = (await handleTransaction(currentPain001)) as Pain001;

  loggerService.log('Sending Pain013 message...');
  const pain013Result = (await handleTransaction(currentPain013)) as Pain013;

  loggerService.log('Sending Pacs008 message...');
  const pacs008Result = (await handleTransaction(currentPacs008)) as Pacs008;
  return { pain001Result, pain013Result, pacs008Result };
};

export const SendLineMessages = async (requestBody: any): Promise<string> => {
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  if ((requestBody.update && requestBody.pacs002) || (requestBody.pacs002 === undefined && requestBody.update === undefined)) {
    throw new Error('Updating and sending messages with one request is not allowed');
  }

  if (requestBody.update) {
    if (requestBody.update.seedPacs002) {
      await cacheDatabaseManager.removePacs002Pseudonym();
    }
    await cacheDatabaseManager.updateHistoryTransactionsTimestamp();
    await cacheDatabaseManager.updatePseudonymEdgesTimestamp();
    loggerService.log("Updating preparation data transaction's created time date");
    return 'Updated the timestamp of the prepare data';
  }

  let oldestTimestamp: Date;
  let delta = 0;

  if (requestBody.pacs002) {
    oldestTimestamp = await cacheDatabaseManager.getOldestTimestampPacs008();
    delta = Date.now() - new Date(oldestTimestamp).getTime();
  }

  const retry = requestBody.pacs002.overwrite ? configuration.RETRY : 1;
  for (let index = 0; index < retry; index++) {
    let missedEndToEndIds: string[] = [];
    if (requestBody.pacs002 && requestBody.pacs002.overwrite) {
      missedEndToEndIds = await getMissingTransaction(
        readline.createInterface({
          input: fs.createReadStream('./uploads/input.txt'),
          crlfDelay: Infinity,
        }),
      );
      if (!missedEndToEndIds?.length) break;
      loggerService.log(`Batch had ${missedEndToEndIds.length} transactions missed`);
    }

    const rl = readline.createInterface({
      input: fs.createReadStream('./uploads/input.txt'),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.
      const columns = line.split('|');
      if (!new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime()) continue;

      const EndToEndId = columns[Fields.END_TO_END_TRANSACTION_ID];

      let currentPain001: Pain001;
      let currentPain013: Pain013;
      let currentPacs008: Pacs008;

      let pacs002Result = false;
      if (requestBody.pacs002) {
        if (requestBody.pacs002.overwrite) {
          if (missedEndToEndIds.filter((missedEndToEndId) => missedEndToEndId === EndToEndId).length) {
            pacs002Result = await sendPacs002Transaction(columns, delta);
            await delay(configuration.DELAY);
            continue;
          } else {
            continue;
          }
        }
        pacs002Result = await sendPacs002Transaction(columns, delta);
      } else {
        currentPain001 = GetPain001FromLine(columns);
        currentPacs008 = GetPacs008(currentPain001);
        currentPain013 = GetPain013(currentPain001);

        await sendPrepareTransaction(currentPain001, currentPain013, currentPacs008);
      }

      if (pacs002Result) {
        await delay(configuration.DELAY);

        if (configuration.VERIFY_REPORTS) {
          let value: any;
          try {
            value = await cacheDatabaseManager.getTransactionReport(EndToEndId);
          } catch (ex) {
            loggerService.error(`Failed to communicate with Arango to check report. ${JSON.stringify(ex)}`);
          }

          if (value && value.length > 0) {
            loggerService.log(`Report generated for: ${EndToEndId}`);

            if (
              (columns[Fields.RECEIVER_SUSPENSE_ACCOUNT_FLAG].toString().trim() === 'N' && value[0][0].report.status === 'NALT') ||
              (columns[Fields.RECEIVER_SUSPENSE_ACCOUNT_FLAG].toString().trim() === 'Y' && value[0][0].report.status === 'ALT')
            ) {
              loggerService.log('Report Matches Test Data');
            } else {
              loggerService.log('Report does not match Test Data');
            }
          } else {
            loggerService.log(`Failed to generate report for: ${EndToEndId}`);
          }
        }
      }
    }
    await cacheDatabaseManager.syncPacs002AndTransaction();
  }
  return 'Submitted Transactions';
  async function delay(time: number | undefined): Promise<unknown> {
    return await new Promise((resolve) => setTimeout(resolve, time));
  }
};
