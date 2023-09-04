/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Pain001 } from '../classes/pain.001.001.11';
import * as fs from 'fs';
import * as readline from 'readline';
import { databaseClient, dbService } from '..';
import { configuration } from '../config';
import { LoggerService } from '../logger.service';
import {
  GetPacs002,
  GetPacs008,
  GetPain013,
  GetPain001FromLine,
} from './message.generation.service';
import { executePost, Fields } from './utilities.service';
import { handleTransaction } from './save.transactions.service';
import { type Pain013 } from '../classes/pain.013.001.09';
import { type Pacs008 } from '../classes/pacs.008.001.10';

const getMissingTransaction = async (
  batchSourceFileLine: readline.Interface,
): Promise<string[]> => {
  let endToEndIds: string[] = [];
  for await (const line of batchSourceFileLine) {
    const columns = line.split('|');
    if (!new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime()) continue;

    endToEndIds.push(columns[Fields.END_TO_END_TRANSACTION_ID]);
  }

  endToEndIds = (await dbService.getUnExistingTransactions(endToEndIds))[0];

  return endToEndIds;
};

const sendPacs002Transaction = async (
  columns: string[],
  delta: number,
): Promise<boolean> => {
  LoggerService.log('Sending Pacs002 message...');
  const newPacs002Date =
    new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime() + delta;
  const currentPacs002 = GetPacs002(columns, new Date(newPacs002Date));
  LoggerService.log(
    `${JSON.stringify(currentPacs002.FIToFIPmtSts.GrpHdr.MsgId)} - Submitted`,
  );
  return await executePost(
    `${configuration.tmsEndpoint}transfer-response`,
    currentPacs002,
  );
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
  LoggerService.log('Sending Pain001 message...');
  const pain001Result = (await handleTransaction(currentPain001)) as Pain001;

  LoggerService.log('Sending Pain013 message...');
  const pain013Result = (await handleTransaction(currentPain013)) as Pain013;

  LoggerService.log('Sending Pacs008 message...');
  const pacs008Result = (await handleTransaction(currentPacs008)) as Pacs008;
  return { pain001Result, pain013Result, pacs008Result };
};

export const SendLineMessages = async (requestBody: any): Promise<string> => {
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  if (
    (requestBody.update && requestBody.pacs002) ||
    (requestBody.pacs002 === undefined && requestBody.update === undefined)
  ) {
    throw new Error(
      'Updating and sending messages with one request is not allowed',
    );
  }

  if (requestBody.update) {
    if (requestBody.update.seedPacs002) {
      await dbService.RemovePacs002Pseudonym();
    }
    await dbService.UpdateHistoryTransactionsTimestamp();
    await dbService.UpdatePseudonymEdgesTimestamp();
    LoggerService.log(
      `Updating preparation data transaction's created time date`,
    );
    return 'Updated the timestamp of the prepare data';
  }

  let oldestTimestamp: Date = new Date();
  let delta = 0;

  if (requestBody.pacs002) {
    oldestTimestamp = await dbService.getOldestTimestampPacs008();
  }

  const retry = requestBody.pacs002.overwrite ? configuration.retry : 1;
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
      LoggerService.log(
        `Batch had ${missedEndToEndIds.length} transactions missed`,
      );
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
        delta =
          new Date(oldestTimestamp).getTime() -
          new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime();
        if (requestBody.pacs002.overwrite) {
          if (
            missedEndToEndIds.filter(
              (missedEndToEndId) => missedEndToEndId === EndToEndId,
            ).length
          ) {
            pacs002Result = await sendPacs002Transaction(columns, delta);
            await delay(configuration.delay);
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

        await sendPrepareTransaction(
          currentPain001,
          currentPain013,
          currentPacs008,
        );
      }

      if (pacs002Result) {
        await delay(configuration.delay);

        if (configuration.verifyReports) {
          let value;
          try {
            value = await dbService.getTransactionReport(EndToEndId);
          } catch (ex) {
            LoggerService.error(
              `Failed to communicate with Arango to check report. ${JSON.stringify(
                ex,
              )}`,
            );
          }

          if (value && value.length > 0) {
            LoggerService.log(`Report generated for: ${EndToEndId}`);

            if (
              (columns[Fields.RECEIVER_SUSPENSE_ACCOUNT_FLAG]
                .toString()
                .trim() === 'N' &&
                value[0][0].report.status === 'NALT') ||
              (columns[Fields.RECEIVER_SUSPENSE_ACCOUNT_FLAG]
                .toString()
                .trim() === 'Y' &&
                value[0][0].report.status === 'ALT')
            ) {
              LoggerService.log(`Report Matches Test Data`);
            } else {
              LoggerService.log(`Report does not match Test Data`);
            }
          } else {
            LoggerService.log(`Failed to generate report for: ${EndToEndId}`);
          }
        }
      }
    }
    // databaseClient.SyncPacs002AndTransaction();
  }
  return `Submitted Transactions`;
  async function delay(time: number | undefined): Promise<unknown> {
    return await new Promise((resolve) => setTimeout(resolve, time));
  }
};
