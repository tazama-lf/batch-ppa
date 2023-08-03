import axios from 'axios';
import apm from 'elastic-apm-node';
import { LoggerService } from '../logger.service';

export const executePost = async (endpoint: string, request: any) => {
  const span = apm.startSpan(`POST ${endpoint}`);
  try {
    const crspRes = await axios.post(endpoint, request);

    if (crspRes.status !== 200) {
      LoggerService.error(
        `CRSP Response StatusCode != 200, request:\r\n${request}`,
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
      } with message: ${error}`,
    );
    LoggerService.trace(`CRSP Error Request:\r\n${JSON.stringify(request)}`);
    return false;
  }
};
