// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fs from 'fs';
import * as readline from 'readline';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import { Fields } from '../utils/transaction.enum';
import { getMissingTransaction, sendPacs002Transaction, sendPrepareTransaction } from '../utils/helper.functions';

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
  let missed = 0;
  for (let index = 0; index < retry; index++) {
    let missedEndToEndIds: string[] = [];
    if (requestBody.pacs002 && requestBody.pacs002.overwrite) {
      missedEndToEndIds = await getMissingTransaction(
        readline.createInterface({
          input: fs.createReadStream('./uploads/batch.txt'),
          crlfDelay: Infinity,
        }),
      );
      if (!missedEndToEndIds?.length) break;
      loggerService.log(`Batch had ${missedEndToEndIds.length} transactions missed`);
    }

    const rl = readline.createInterface({
      input: fs.createReadStream('./uploads/batch.txt'),
      crlfDelay: Infinity,
    });
    missed = 0;
    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.
      const columns = line.split('|');
      if (!new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime()) continue;

      const EndToEndId = columns[Fields.END_TO_END_TRANSACTION_ID];

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
        const { pacs008Result, pain001Result, pain013Result } = await sendPrepareTransaction(columns);

        if (!pacs008Result || !pain001Result || !pain013Result) {
          ++missed;
          loggerService.log(
            JSON.stringify({
              transaction: line,
              message: `Transaction failed to save history of ${pacs008Result ? '' : 'pacs002'}${pain001Result ? '' : ', pain001'}${pain013Result ? '' : ' pain013'} `,
            }),
          );
        }
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
  }
  return `Submitted Transactions while submitting ${requestBody.pacs002 ? 'pacs.002.001.12' : `preparation (${configuration.QUOTING ? 'pain.001.001.11, pain.013.001.09 and pacs.008.001.10' : 'pacs.008.001.10'})`} transactions, missed transactions ${missed}`;

  async function delay(time: number | undefined): Promise<unknown> {
    return await new Promise((resolve) => setTimeout(resolve, time));
  }
};
