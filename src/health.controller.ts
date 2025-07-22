// SPDX-License-Identifier: Apache-2.0

import type { FastifyReply, FastifyRequest } from 'fastify';

const handleHealthCheck = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const data = {
    status: 'UP',
  };
  reply.send(data);
};

export { handleHealthCheck };
