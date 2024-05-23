// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';
import apm from 'elastic-apm-node';
import { LoggerService } from '../logger.service';

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

export enum Fields {
  PROCESSING_DATE_TIME = 0,
  PROCESSING_WINDOW = 1,
  MESSAGE_ID = 2,
  TRANSACTION_TYPE = 3,
  TCIBTXID = 4,
  TRANSACTION_ID = 5,
  END_TO_END_TRANSACTION_ID = 6,
  RESPONSE_CODE = 7,
  RESPONSE_MESSAGE = 8,
  SOURCE_COUNTRY_CODE = 9,
  PAYMENT_COUNTRY_CODE = 10,
  PAYMENT_CURRENCY_CODE = 11,
  TOTAL_PAYMENT_AMOUNT = 12,
  SENDER_NAME = 13,
  RECEIVER_NAME = 14,
  SENDER_AGENT_SPID = 15,
  RECEIVER_AGENT_SPID = 16,
  SENDER_ACCOUNT = 17,
  RECEIVER_ACCOUNT = 18,
  REPORTING_CODE = 19,
  RECEIVER_MESSAGE = 20,
  CREATED_DATE = 21,
  MIS_DATE = 22,
  SENDER_SUSPENSE_ACCOUNT_FLAG = 23,
  RECEIVER_SUSPENSE_ACCOUNT_FLAG = 24,
  KNOWN_FRAUD_FLAG = 25,
  FROM_FILENAME = 26,
  MODIFIED_DATE = 27,
  CREATED_BY = 28,
  MODIFIED_BY = 29,
  FILE_ID = 30,
}
