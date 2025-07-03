// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import type { FastifySchema } from 'fastify/types/schema';

type preHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

const responseSchema = (schemaTransactionName: string): Record<string, unknown> => ({
  '2xx': {
    type: 'object',
    properties: {
      message: {
        type: 'string',
      },
      data: {
        type: 'object',
        $ref: `${schemaTransactionName}#`,
      },
    },
  },
});

const SetOptions = (
  handler: RouteHandlerMethod,
  schemaTransactionName: string,
): { preHandler?: preHandler; handler: RouteHandlerMethod; schema: FastifySchema } => ({
  handler,
  schema: { body: { $ref: `${schemaTransactionName}#` }, response: responseSchema(schemaTransactionName) },
});

export default SetOptions;
