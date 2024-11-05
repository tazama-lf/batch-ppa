// SPDX-License-Identifier: Apache-2.0

import { type FastifyInstance } from 'fastify';
import { handleHealthCheck } from './health.controller';
import { handleExecute, handleFileUpload } from './app.controller';

async function Routes(fastify: FastifyInstance, options: unknown): Promise<void> {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  fastify.post('/v1/executeBatch', handleExecute);
  fastify.post('/v1/uploadFile', handleFileUpload);
  fastify.post('/v1/repairBatch', handleFileUpload);
}

export default Routes;
