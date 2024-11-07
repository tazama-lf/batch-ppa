// SPDX-License-Identifier: Apache-2.0
import { fastifyCors } from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import FastifyFormidable from 'fastify-formidable';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastifySwagger } from '@fastify/swagger';
import { configuration } from '..';
import Routes from '../router';
import executeBatchSchema from '../schemas/execute.batch.json';

const fastify = Fastify();
const schemaExecuteBatch = { ...executeBatchSchema, $id: 'executeBatchSchema' };

export default async function initializeFastifyClient(): Promise<FastifyInstance> {
  fastify.addSchema(schemaExecuteBatch);
  await fastify.register(fastifySwagger, {
    specification: {
      path: './build/swagger.yaml',
      postProcessor: function (swaggerObject) {
        return swaggerObject;
      },
      baseDir: '../../',
    },
    prefix: '/swagger',
  });
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
  await fastify.register(FastifyFormidable, {
    formidable: {
      maxFileSize: (configuration.MAX_FILE_SIZE ?? 100) * 1024 * 1024,
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
