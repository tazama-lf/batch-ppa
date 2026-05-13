// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import type { FastifySchema } from 'fastify/types/schema';
import { configuration } from '../';
import { tokenHandler } from '../auth/authHandler';

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
  claim: string,
  schemaTransactionName?: string,
): { preHandler?: preHandler[]; handler: RouteHandlerMethod; schema: FastifySchema } => {
  const preHandlers: preHandler[] = configuration.AUTHENTICATED ? [tokenHandler(claim)] : [];

  const schema: FastifySchema = schemaTransactionName
    ? { body: { $ref: `${schemaTransactionName}#` }, response: responseSchema(schemaTransactionName) }
    : {};

  return {
    preHandler: preHandlers.length > 0 ? preHandlers : undefined,
    handler,
    schema,
  };
};

export default SetOptions;
