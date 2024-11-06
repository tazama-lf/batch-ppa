// SPDX-License-Identifier: Apache-2.0
import { fastifyCors } from '@fastify/cors';
import FastifyFormidable from 'fastify-formidable';
import Fastify, { type FastifyInstance } from 'fastify';
import Routes from '../router';

const fastify = Fastify();

export default async function initializeFastifyClient(): Promise<FastifyInstance> {
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
