// SPDX-License-Identifier: Apache-2.0

import * as fs from 'fs';
import * as readline from 'readline';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import { Fields } from '../utils/transaction.enum';
import { getMissingTransaction, sendPacs002Transaction, sendPrepareTransaction } from '../utils/helper.functions';
import { type Alert } from '@tazama-lf/frms-coe-lib/lib/interfaces/processor-files/Alert';
import { type ExecuteReqBody } from '../utils/interface.request';

export const SendLineMessages = async (requestBody: ExecuteReqBody): Promise<string> => {
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  if (
    (requestBody.timestampShift && requestBody.evaluate) ||
    (requestBody.evaluate === undefined && requestBody.timestampShift === undefined)
  ) {
    throw new Error('Updating and sending messages with one request is not allowed');
  }

  if (requestBody.timestampShift) {
    if (requestBody.timestampShift.removePacs002) {
      await cacheDatabaseManager.removePacs002Pseudonym();
    }
    await cacheDatabaseManager.updateHistoryTransactionsTimestamp();
    await cacheDatabaseManager.updatePseudonymEdgesTimestamp();
    return 'Updated the timestamp of the prepare data';
  }

  let oldestTimestamp: Date;
  let delta = 0;

  if (requestBody.evaluate) {
    try {
      oldestTimestamp = await cacheDatabaseManager.getOldestTimestampPacs008();
      delta = Date.now() - new Date(oldestTimestamp).getTime();
    } catch (err) {
      throw Error(`Error occurred while trying to get oldest pacs008 timestamp. ${JSON.stringify(err)}`);
    }
  }

  const retry = requestBody.evaluate.overwrite ? configuration.RETRY : 1;
  let missed = 0;
  for (let index = 0; index < retry; index++) {
    let missedEndToEndIds: string[] = [];
    if (requestBody.evaluate.overwrite) {
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
    let index = 0;
    for await (const line of rl) {
      index++;
      // Each line in input.txt will be successively available here as `line`.
      const columns = line.split('|');
      if (!new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime()) {
        if (index === 1) {
          continue;
        } else {
          loggerService.error(`Error occurred while parsing line '${line}':${index}`);
          continue;
        }
      }

      const EndToEndId = columns[Fields.END_TO_END_TRANSACTION_ID];

      let pacs002Result = false;
      if (requestBody.evaluate) {
        if (requestBody.evaluate.overwrite) {
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
          let report: Alert[][];
          try {
            report = (await cacheDatabaseManager.getTransactionReport(EndToEndId)) as Alert[][];

            if (report && report.length > 0) {
              loggerService.log(`Report generated for: ${EndToEndId}`);

              if (
                (columns[Fields.RECEIVER_SUSPENSE_ACCOUNT_FLAG].toString().trim() === 'N' && report[0][0].status === 'NALT') ||
                (columns[Fields.RECEIVER_SUSPENSE_ACCOUNT_FLAG].toString().trim() === 'Y' && report[0][0].status === 'ALT')
              ) {
                loggerService.log('Report Matches Test Data');
              } else {
                loggerService.log('Report does not match Test Data');
              }
            } else {
              loggerService.log(`Failed to generate report for: ${EndToEndId}`);
            }
          } catch (ex) {
            loggerService.error(`Failed to communicate with Arango to check report. ${JSON.stringify(ex)}`);
          }
        }
      }
    }
  }
  return `Submitted Transactions while submitting ${requestBody.evaluate ? 'pacs.002.001.12' : `preparation (${configuration.QUOTING ? 'pain.001.001.11, pain.013.001.09 and pacs.008.001.10' : 'pacs.008.001.10'})`} transactions, missed transactions ${missed}`;

  async function delay(time: number | undefined): Promise<unknown> {
    return await new Promise((resolve) => setTimeout(resolve, time));
  }
};
