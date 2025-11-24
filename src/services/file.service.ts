// SPDX-License-Identifier: Apache-2.0
import * as fs from 'node:fs';
import * as readline from 'node:readline';
import * as util from 'node:util';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import { sendPacs002Transaction, sendPrepareTransaction } from '../utils/helper.functions';
import type { ExecuteReqBody } from '../utils/interface.request';
import { Fields } from '../utils/transaction.enum';

export const SendLineMessages = async (requestBody: ExecuteReqBody): Promise<string> => {
  let oldestTimestamp: Date;
  let delta = 0;

  if (requestBody.evaluate) {
    try {
      oldestTimestamp = await cacheDatabaseManager.getOldestTimestampPacs008();
      delta = Date.now() - new Date(oldestTimestamp).getTime();
    } catch (err) {
      throw Error(`Error occurred while trying to get oldest pacs008 timestamp. ${util.inspect(err)}`);
    }
  }

  const rl = readline.createInterface({
    input: fs.createReadStream('./build/uploads/batch.txt'),
    crlfDelay: Infinity,
  });

  let index = 0;
  let processedCount = 0;
  const startTime = Date.now();

  for await (const line of rl) {
    index++;

    // Log progress every 1000 transactions for visibility without overwhelming logs
    if (index > 1 && index % 1000 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processedCount / elapsed;
      loggerService.log(`Processed ${processedCount} transactions (line ${index}) - ${rate.toFixed(2)} tx/sec`);
    }

    // Each line in input.txt will be successively available here as `line`.
    const columns = line.split(configuration.DELIMITER ?? '|');
    if (!new Date(columns[Fields.PROCESSING_DATE_TIME]).getTime()) {
      if (index === 1) {
        continue;
      } else {
        loggerService.error(`Error occurred while parsing line '${line}':${index}`);
        continue;
      }
    }

    if (requestBody.evaluate) {
      await sendPacs002Transaction(columns, delta);
      processedCount++;
    } else {
      const { pacs008Result, pain001Result, pain013Result } = await sendPrepareTransaction(columns);

      if ((!requestBody.evaluate && configuration.QUOTING && !pacs008Result) || !pain001Result || !pain013Result) {
        loggerService.error(
          util.inspect({
            transaction: line,
            message: `Transaction failed to save history of ${!pacs008Result ? '' : 'pacs008'}${!pain001Result ? '' : ', pain001'}${!pain013Result ? '' : ' pain013'} `,
          }),
        );
      } else if (!requestBody.evaluate && !configuration.QUOTING && !pacs008Result) {
        loggerService.error(
          util.inspect({
            transaction: line,
            message: 'Transaction failed to save history of pacs008',
          }),
        );
      } else {
        processedCount++; // Successfully processed preparation transaction
      }
    }
  }

  // Log final summary
  const totalTime = (Date.now() - startTime) / 1000;
  const finalRate = processedCount / totalTime;
  loggerService.log(
    `Batch processing complete: ${processedCount} transactions processed in ${totalTime.toFixed(2)}s (${finalRate.toFixed(2)} tx/sec)`,
  );

  return `Submitted Transactions while submitting ${requestBody.evaluate ? 'pacs.002.001.12' : `preparation (${configuration.QUOTING ? 'pain.001.001.11, pain.013.001.09 and pacs.008.001.10' : 'pacs.008.001.10'})`} transactions`;
};
