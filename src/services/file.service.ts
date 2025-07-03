// SPDX-License-Identifier: Apache-2.0

import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { cacheDatabaseManager, configuration, loggerService } from '..';
import { Fields } from '../utils/transaction.enum';
import { sendPacs002Transaction, sendPrepareTransaction } from '../utils/helper.functions';
import type { ExecuteReqBody } from '../utils/interface.request';

export const SendLineMessages = async (requestBody: ExecuteReqBody): Promise<string> => {
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

  const rl = readline.createInterface({
    input: fs.createReadStream('./build/uploads/batch.txt'),
    crlfDelay: Infinity,
  });

  let index = 0;
  for await (const line of rl) {
    index++;
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
    } else {
      const { pacs008Result, pain001Result, pain013Result } = await sendPrepareTransaction(columns);

      if ((!requestBody.evaluate && configuration.QUOTING && !pacs008Result) || !pain001Result || !pain013Result) {
        loggerService.error(
          JSON.stringify({
            transaction: line,
            message: `Transaction failed to save history of ${!pacs008Result ? '' : 'pacs008'}${!pain001Result ? '' : ', pain001'}${!pain013Result ? '' : ' pain013'} `,
          }),
        );
      } else if (!requestBody.evaluate && !configuration.QUOTING && !pacs008Result) {
        loggerService.error(
          JSON.stringify({
            transaction: line,
            message: 'Transaction failed to save history of pacs008',
          }),
        );
      }
    }
  }

  return `Submitted Transactions while submitting ${requestBody.evaluate ? 'pacs.002.001.12' : `preparation (${configuration.QUOTING ? 'pain.001.001.11, pain.013.001.09 and pacs.008.001.10' : 'pacs.008.001.10'})`} transactions`;
};
