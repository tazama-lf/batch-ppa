import { IncomingForm } from 'formidable';
import { Context, Next } from 'koa';
import { processLineByLine } from '.';
import { LoggerService } from './logger.service';

export const handleExecute = async (
  ctx: Context,
  next: Next,
): Promise<Context> => {
  LoggerService.log('Start - Handle execute request');
  try {
    let counter: number = (await processLineByLine()) || 0;
    await next();
    ctx.body = `${counter - 1} Transactions were submitted in executed batch`;
    return ctx;
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    LoggerService.error(failMessage, err as Error, 'ApplicationService');

    ctx.status = 500;
    ctx.body = failMessage;
    return ctx;
  } finally {
    LoggerService.log('End - Handle execute request');
  }
};

export const handleFileUpload = async (
  ctx: Context,
  next: Next,
): Promise<Context> => {
  LoggerService.log('Start - Handle quote reply request');
  try {
    ctx.status = 200;

    var form = new IncomingForm({
      uploadDir: './uploads/',
      keepExtensions: true,
      filename: () => {
        return 'input.txt';
      },
      maxFileSize: 300 * 1024 * 1024,
      maxFieldsSize: 300 * 1024 * 1024,
    });

    await new Promise<void>((resolve, reject) => {
      form.parse(ctx.req, (err, fields, files) => {
        // Handle form parsing completion here
        if (err) {
          // Handle any errors that occurred during parsing
          console.error(err);
          reject(err);
          return;
        } else {
          ctx.body = 'File was uploaded successfully!';
          resolve();
        }
      });
    });

    await next();
    return ctx;
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    LoggerService.error(failMessage, err as Error, 'ApplicationService');

    ctx.status = 500;
    ctx.body = failMessage;
    return ctx;
  } finally {
    LoggerService.log('End - Handle quote reply request');
  }
};
