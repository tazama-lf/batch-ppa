// SPDX-License-Identifier: Apache-2.0
import axios from 'axios';
import apm from 'elastic-apm-node';
import * as util from 'node:util';
import { loggerService } from '..';

export const executePost = async (endpoint: string, request: unknown, authHeader?: string): Promise<boolean> => {
  const span = apm.startSpan(`POST ${endpoint}`);
  try {
    const headers = authHeader ? { Authorization: authHeader } : undefined;
    const eventDirectorRes = await axios.post(endpoint, request, { headers });

    if (eventDirectorRes.status !== 200) {
      loggerService.error(`Transaction-Monitoring-Service Response StatusCode != 200, request:\r\n${util.inspect(request)}`);
      return false;
    }
    span?.end();
    return true;
  } catch (error) {
    loggerService.error(
      `Error while sending request to Transaction-Monitoring-Service at ${endpoint ?? ''} with message: ${util.inspect(error)}`,
    );
    loggerService.trace(`Transaction-Monitoring-Service Error Request:\r\n${util.inspect(request)}`);
    return false;
  }
};
