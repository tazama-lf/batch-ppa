// SPDX-License-Identifier: Apache-2.0

import type { FastifyReply, FastifyRequest } from 'fastify';
import { extractTenant } from '@tazama-lf/auth-lib';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { configuration, loggerService } from './';
import { SendLineMessages } from './services/file.service';
import type { ExecuteReqBody } from './utils/interface.request';

export const handleExecute = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  loggerService.log('Start - Handle execute request');
  try {
    const tenantResponse = extractTenant(configuration.AUTHENTICATED, req.headers.authorization);
    if (!tenantResponse.success || !tenantResponse.tenantId) {
      loggerService.error('Tenant validation failed: No tenantId found in token', 'handleExecute()');
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    reply.send(await SendLineMessages(req?.body as ExecuteReqBody, tenantResponse.tenantId, req.headers.authorization));
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    loggerService.error(failMessage, err as Error, 'ApplicationService');
    reply.code(500);
    reply.send(err);
  } finally {
    loggerService.log('End - Handle execute request');
  }
};

export const handleFileUpload = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    // Check if request is multipart first
    if (!req.isMultipart()) {
      return await reply.status(400).send({
        error: 'Request must be multipart/form-data',
        contentType: req.headers['content-type'],
      });
    }

    const data = await req.file(); // Handles only a single file

    if (!data) {
      return await reply.status(400).send({ error: 'No file uploaded' });
    }

    const savePath = path.join(__dirname, 'uploads', 'batch.txt');
    if (!fs.existsSync(path.dirname(savePath))) {
      fs.mkdirSync(path.dirname(savePath), { recursive: true });
    }

    // Use pipeline instead of pipe for better error handling with v9
    await pipeline(data.file, fs.createWriteStream(savePath));

    return await reply.status(200).send({
      message: 'File uploading was handled successfully',
    });
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    loggerService.error(failMessage, err as Error, 'ApplicationService');
    reply.code(500);
    reply.send(err);
  } finally {
    loggerService.log('End - Handle file upload request');
  }
};
