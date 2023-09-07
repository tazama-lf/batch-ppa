import { dbService, natsServer } from '..';

const sendMissingTransactionsCMS = async (
  endToEndIds: string[],
): Promise<void> => {
  for (let index = 0; index < endToEndIds.length; index++) {
    // Request report on the arango
    const report = (await dbService.getTransactionReport(
      endToEndIds[index],
    )) as object;

    // Send to CMS
    await natsServer.handleResponse({ ...report[0][0] });
  }
};

export default sendMissingTransactionsCMS;
