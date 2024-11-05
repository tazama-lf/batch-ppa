// SPDX-License-Identifier: Apache-2.0

import { type FastifyRequest, type FastifyReply } from 'fastify';
import { configuration } from '.';
import { loggerService } from './';
import { SendLineMessages } from './services/file.service';
import { getPacs008FromXML } from './services/xml.service';
// import { promises as fs } from 'fs';
// import path from 'path';

export const handleExecute = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  loggerService.log('Start - Handle execute request');
  try {
    switch (configuration.DATA_TYPE) {
      case 'textfile':
        await SendLineMessages(req?.body);
        break;

      case 'xml':
        getPacs008FromXML();
        break;
      default:
        loggerService.log('No Data Method Set.');
        throw new Error('No Data Method Set in environment.');
    }
    reply.send('Transactions were submitted');
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
  loggerService.log('Start - Handle quote reply request');
  try {
    // Access the uploaded file(s) from req.files
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      throw new Error('No files uploaded');
    }

    for (const [fieldname, file] of Object.entries(files)) {
      loggerService.log(`Processing file: ${fieldname}, name: `);
      loggerService.log(JSON.stringify(file));
      //const uploadPath = path.join(__dirname, '..', 'uploads', 'unknown-file');

      // Move the file from its temporary path to the upload directory
      //await fs.rename(file.filepath, uploadPath);
    }

    // Send a success response
    reply.code(200).send({ message: 'File(s) processed successfully' });
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    loggerService.error(failMessage, err as Error, 'ApplicationService');
    reply.code(500);
    reply.send(err);
  } finally {
    loggerService.log('End - Handle quote reply request');
  }
};
