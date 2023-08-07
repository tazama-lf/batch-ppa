import axios from 'axios';
import apm from 'elastic-apm-node';
import { LoggerService } from '../logger.service';
import { type Pain001 } from '../classes/pain.001.001.11';
import { type Pacs008 } from '../classes/pacs.008.001.10';
import { type Pain013 } from '../classes/pain.013.001.09';

export const executePost = async (
  endpoint: string,
  request: unknown,
): Promise<boolean> => {
  const span = apm.startSpan(`POST ${endpoint}`);
  try {
    const crspRes = await axios.post(endpoint, request);

    if (crspRes.status !== 200) {
      LoggerService.error(
        `CRSP Response StatusCode != 200, request:\r\n${JSON.stringify(
          request,
        )}`,
      );
      return false;
    }
    span?.end();
    return true;
    // LoggerService.log(`CRSP Reponse - ${crspRes.status} with data\n ${JSON.stringify(crspRes.data)}`);
  } catch (error) {
    LoggerService.error(
      `Error while sending request to CRSP at ${
        endpoint ?? ''
      } with message: ${JSON.stringify(error)}`,
    );
    LoggerService.trace(`CRSP Error Request:\r\n${JSON.stringify(request)}`);
    return false;
  }
};

export function updateMessageTimestampsPacs008(messages: Pacs008[]): Pacs008[] {
  // Step 1: Find the most recent and oldest timestamps in the set.
  let mostRecentTimestamp = new Date(0); // Initialize with a very old date
  let oldestTimestamp = new Date(); // Initialize with the current time

  messages.forEach((message: Pacs008) => {
    const createDate = new Date(message.FIToFICstmrCdt.GrpHdr.CreDtTm);
    if (createDate > mostRecentTimestamp) {
      mostRecentTimestamp = createDate;
    }
    if (createDate < oldestTimestamp) {
      oldestTimestamp = createDate;
    }
  });

  // Step 2: Update the most recent message's timestamp to the current time (now()).
  mostRecentTimestamp = new Date();

  // Step 3: Update the oldest message's timestamp to now() - difference.
  const timeDifference =
    mostRecentTimestamp.getTime() - oldestTimestamp.getTime();
  oldestTimestamp = new Date(mostRecentTimestamp.getTime() - timeDifference);

  // Step 4: Calculate the time difference between the updated timestamps of the most recent and oldest messages.

  // Step 5: Spread out the remaining messages' timestamps based on their create date,
  // maintaining an even distribution within the time difference calculated in Step 4.
  const messageCount = messages.length - 2; // Excluding the most recent and oldest messages
  if (messageCount > 0) {
    const interval = timeDifference / (messageCount + 1);

    messages.forEach((message) => {
      const createDate = new Date(message.FIToFICstmrCdt.GrpHdr.CreDtTm);
      if (
        createDate !== mostRecentTimestamp &&
        createDate !== oldestTimestamp
      ) {
        const newTimestamp = new Date(oldestTimestamp.getTime() + interval);
        message.FIToFICstmrCdt.GrpHdr.CreDtTm = newTimestamp.toISOString(); // Update the message timestamp
        oldestTimestamp = newTimestamp;
      }
    });
  }

  return messages;
}

export function updateMessageTimestampsPain001(messages: Pain001[]): Pain001[] {
  // Step 1: Find the most recent and oldest timestamps in the set.
  let mostRecentTimestamp = new Date(0); // Initialize with a very old date
  let oldestTimestamp = new Date(); // Initialize with the current time

  messages.forEach((message: Pain001) => {
    const createDate = new Date(message.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
    if (createDate > mostRecentTimestamp) {
      mostRecentTimestamp = createDate;
    }
    if (createDate < oldestTimestamp) {
      oldestTimestamp = createDate;
    }
  });

  // Step 2: Update the most recent message's timestamp to the current time (now()).
  mostRecentTimestamp = new Date();

  // Step 3: Update the oldest message's timestamp to now() - difference.
  const timeDifference =
    mostRecentTimestamp.getTime() - oldestTimestamp.getTime();
  oldestTimestamp = new Date(mostRecentTimestamp.getTime() - timeDifference);

  // Step 4: Calculate the time difference between the updated timestamps of the most recent and oldest messages.

  // Step 5: Spread out the remaining messages' timestamps based on their create date,
  // maintaining an even distribution within the time difference calculated in Step 4.
  const messageCount = messages.length - 2; // Excluding the most recent and oldest messages
  if (messageCount > 0) {
    const interval = timeDifference / (messageCount + 1);

    messages.forEach((message) => {
      const createDate = new Date(message.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
      if (
        createDate !== mostRecentTimestamp &&
        createDate !== oldestTimestamp
      ) {
        const newTimestamp = new Date(oldestTimestamp.getTime() + interval);
        message.CstmrCdtTrfInitn.GrpHdr.CreDtTm = newTimestamp.toISOString();
        oldestTimestamp = newTimestamp;
      }
    });
  }

  return messages;
}

export function updateMessageTimestampsPain013(messages: Pain013[]): Pain013[] {
  // Step 1: Find the most recent and oldest timestamps in the set.
  let mostRecentTimestamp = new Date(0); // Initialize with a very old date
  let oldestTimestamp = new Date(); // Initialize with the current time

  messages.forEach((message: Pain013) => {
    const createDate = new Date(message.CdtrPmtActvtnReq.GrpHdr.CreDtTm);
    if (createDate > mostRecentTimestamp) {
      mostRecentTimestamp = createDate;
    }
    if (createDate < oldestTimestamp) {
      oldestTimestamp = createDate;
    }
  });

  // Step 2: Update the most recent message's timestamp to the current time (now()).
  mostRecentTimestamp = new Date();

  // Step 3: Update the oldest message's timestamp to now() - difference.
  const timeDifference =
    mostRecentTimestamp.getTime() - oldestTimestamp.getTime();
  oldestTimestamp = new Date(mostRecentTimestamp.getTime() - timeDifference);

  // Step 4: Calculate the time difference between the updated timestamps of the most recent and oldest messages.

  // Step 5: Spread out the remaining messages' timestamps based on their create date,
  // maintaining an even distribution within the time difference calculated in Step 4.
  const messageCount = messages.length - 2; // Excluding the most recent and oldest messages
  if (messageCount > 0) {
    const interval = timeDifference / (messageCount + 1);

    messages.forEach((message) => {
      const createDate = new Date(message.CdtrPmtActvtnReq.GrpHdr.CreDtTm);
      if (
        createDate !== mostRecentTimestamp &&
        createDate !== oldestTimestamp
      ) {
        const newTimestamp = new Date(oldestTimestamp.getTime() + interval);
        message.CdtrPmtActvtnReq.GrpHdr.CreDtTm = newTimestamp.toISOString(); // Update the message timestamp
        oldestTimestamp = newTimestamp;
      }
    });
  }

  return messages;
}
