import axios from 'axios';
import apm from 'elastic-apm-node';
import { LoggerService } from '../logger.service';

export const executePost = async (endpoint: string, request: any) => {
  const span = apm.startSpan(`POST ${endpoint}`);
  try {
    const eventDirectorRes = await axios.post(endpoint, request);

    if (eventDirectorRes.status !== 200) {
      LoggerService.error(`Event-director Response StatusCode != 200, request:\r\n${request}`);
      return false;
    }
    span?.end();
    return true;
  } catch (error) {
    LoggerService.error(`Error while sending request to Event-director at ${endpoint ?? ''} with message: ${error}`);
    LoggerService.trace(`Event-director Error Request:\r\n${JSON.stringify(request)}`);
    return false;
  }
};
