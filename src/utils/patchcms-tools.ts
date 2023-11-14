import { dbService, natsServer } from '..';
import * as fs from 'fs';
import * as readline from 'readline';
import { LoggerService } from '../logger.service';

const sendMissingTransactionsCMS = async (): Promise<void> => {
  LoggerService.error('Started Patching the batch from cms');
  const rl = readline.createInterface({
    input: fs.createReadStream('./uploads/input.txt'),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Request report on the arango
    if (line.length < 30) {
      LoggerService.error(
        `Expected End to End id but got ${line} skiping this line `,
      );
      continue;
    }

    LoggerService.error(`Transaction ${line} is being evaluated`);

    const report = (await dbService.getTransactionReport(
      line.trim(),
    )) as object;

    LoggerService.error(`Transaction ${line} was sent to CMS for reporting`);
    // Send to CMS
    await natsServer.handleResponse({ ...report[0][0] });
  }

  LoggerService.error('Finished Patching the batch from cms');
};

export default sendMissingTransactionsCMS;
