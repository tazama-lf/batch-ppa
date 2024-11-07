// SPDX-License-Identifier: Apache-2.0
import { fastifyCors } from '@fastify/cors';
import FastifyFormidable from 'fastify-formidable';
import Fastify, { type FastifyInstance } from 'fastify';
import Routes from '../router';
import executeBatchSchema from '../schemas/execute.batch.json';

const fastify = Fastify();
const schemaExecuteBatch = { ...executeBatchSchema, $id: 'executeBatchSchema' };

export default async function initializeFastifyClient(): Promise<FastifyInstance> {
  fastify.addSchema(schemaExecuteBatch);
  await fastify.register(FastifyFormidable, {
    formidable: {
      maxFileSize: 10 * 1024 * 1024,
      uploadDir: './uploads/',
      keepExtensions: true,
    },
  });
  await fastify.register(fastifyCors, {
    origin: '*',
    methods: ['POST'],
    allowedHeaders: '*',
  });
  fastify.register(Routes);
  await fastify.ready();
  return await fastify;
}

export async function destroyFasityClient(): Promise<void> {
  await fastify.close();
}
