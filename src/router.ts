// SPDX-License-Identifier: Apache-2.0

import { type FastifyInstance } from 'fastify';
import { handleExecute, handleFileUpload } from './app.controller';
import { handleHealthCheck } from './health.controller';
import SetOptions from './utils/routes.options';

async function Routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  fastify.post('/v1/executebatch', SetOptions(handleExecute, 'executeBatchSchema'));
  fastify.post('/v1/uploadfile', handleFileUpload);
}

export default Routes;
