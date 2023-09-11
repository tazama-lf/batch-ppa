import { dbService, natsServer } from '..';
import * as fs from 'fs';
import * as readline from 'readline';
import { LoggerService } from '../logger.service';

const sendMissingTransactionsCMS = async (): Promise<void> => {
  const rl = readline.createInterface({
    input: fs.createReadStream('./uploads/input.txt'),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Request report on the arango
    if (line.length < 30) {
      LoggerService.error(
        'File is not a patch file or EndToEndId not equal to 33 long',
      );
      return;
    }

    const report = (await dbService.getTransactionReport(
      line.trim(),
    )) as object;

    // Send to CMS
    await natsServer.handleResponse({ ...report[0][0] });
  }
};

export default sendMissingTransactionsCMS;
