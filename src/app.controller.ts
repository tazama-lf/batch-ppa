// SPDX-License-Identifier: Apache-2.0

import { type FastifyRequest, type FastifyReply } from 'fastify';
import { loggerService } from './';
import { SendLineMessages } from './services/file.service';
import { promises as fs, type PathLike } from 'fs';
import path from 'path';

export const handleExecute = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  loggerService.log('Start - Handle execute request');
  try {
    reply.send(await SendLineMessages(req?.body));
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    loggerService.error(failMessage, err as Error, 'ApplicationService');
    reply.code(500);
    reply.send(failMessage);
  } finally {
    loggerService.log('End - Handle execute request');
  }
};

export const handleFileUpload = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  loggerService.log('Start - Handle file upload request');
  try {
    await req.parseMultipart();
    // Access the uploaded file(s) from req.files
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return await reply.code(400).send({ message: 'No files uploaded' });
    }

    for (const [, file] of Object.entries(files)) {
      const fileProperties = file as { filepath: PathLike; size: number; originalFilename: string };
      loggerService.log(`Processing file: ${fileProperties.originalFilename}, size: ${fileProperties.size}`);
      const uploadPath = path.join(__dirname, '..', 'uploads', 'batch.txt');
      //Move the file from its temporary path to the upload directory
      await fs.rename(fileProperties.filepath, uploadPath);
    }

    // Send a success response
    reply.code(200).send({ message: 'File(s) processed successfully' });
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    loggerService.error(failMessage, err as Error, 'ApplicationService');
    reply.code(500);
    reply.send(err);
  } finally {
    loggerService.log('End - Handle file upload request');
  }
};
