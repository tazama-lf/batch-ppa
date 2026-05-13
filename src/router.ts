// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance } from 'fastify';
import { handleExecute, handleFileUpload } from './app.controller';
import { handleHealthCheck } from './health.controller';
import SetOptions from './utils/routes.options';

const routePrivilege = {
  executeBatch: 'POST_V1_EXECUTEBATCH',
  uploadFile: 'POST_V1_UPLOADFILE',
};

function Routes(fastify: FastifyInstance): void {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  fastify.post('/v1/executebatch', SetOptions(handleExecute, routePrivilege.executeBatch, 'executeBatchSchema'));
  fastify.post('/v1/uploadfile', SetOptions(handleFileUpload, routePrivilege.uploadFile));
}

export default Routes;
