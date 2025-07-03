// SPDX-License-Identifier: Apache-2.0

import { type FastifyReply, type FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { loggerService } from './';
import { SendLineMessages } from './services/file.service';
import { type ExecuteReqBody } from './utils/interface.request';

export const handleExecute = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  loggerService.log('Start - Handle execute request');
  try {
    reply.send(await SendLineMessages(req?.body as ExecuteReqBody));
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
    const data = await req.file(); // Handles only a single file

    if (!data) {
      return await reply.status(400).send({ error: 'No file uploaded' });
    }

    const { file } = data; // file is a readable stream

    const savePath = path.join(__dirname, 'uploads', 'batch.txt');
    if (!fs.existsSync(path.dirname(savePath))) {
      fs.mkdirSync(path.dirname(savePath), { recursive: true });
    }
    const writeStream = fs.createWriteStream(savePath);

    // Pipe the incoming file stream into a local file
    file.pipe(writeStream);

    // Handle stream completion
    await new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve('File uploaded successfully');
      });
      writeStream.on('error', reject);
    });
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
