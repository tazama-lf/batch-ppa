// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-explicit-any */

import { extractTenant } from '@tazama-lf/auth-lib';
import type { FastifyReply, FastifyRequest } from 'fastify';

jest.mock('@tazama-lf/frms-coe-lib/lib/config/processor.config', () => ({
  validateProcessorConfig: jest.fn().mockReturnValue({
    functionName: 'test-ed',
    nodeEnv: 'test',
    maxCPU: 1,
  }),
}));

jest.mock('@tazama-lf/frms-coe-lib/lib/services/apm', () => ({
  Apm: jest.fn().mockReturnValue({
    startSpan: jest.fn(),
    getCurrentTraceparent: jest.fn().mockReturnValue(''),
  }),
}));

jest.mock('@tazama-lf/frms-coe-lib/lib/services/dbManager', () => ({
  CreateStorageManager: jest.fn().mockReturnValue({
    db: {
      set: jest.fn(),
      quit: jest.fn(),
      isReadyCheck: jest.fn().mockReturnValue({ nodeEnv: 'test' }),
    },
    config: {
      redisConfig: { distributedCacheTTL: 300 },
    },
  }),
}));

jest.mock('@tazama-lf/auth-lib', () => ({
  extractTenant: jest.fn(),
}));

const mockedExtractTenant = jest.mocked(extractTenant);

import { handleExecute } from '../../src/app.controller';
import * as FileService from '../../src/services/file.service';
import { configuration } from '../../src';
import { GetPain001FromLine } from '../../src/services/message.generation.service';
import { Fields } from '../../src/utils/transaction.enum';

const makeReply = (): FastifyReply => {
  const reply: any = {};
  reply.code = jest.fn().mockReturnValue(reply);
  reply.send = jest.fn().mockReturnValue(reply);
  return reply as FastifyReply;
};

const makeRequest = (authHeader?: string): FastifyRequest =>
  ({
    headers: { authorization: authHeader },
    body: { evaluate: false },
  }) as unknown as FastifyRequest;

const makeColumns = (): string[] => {
  const cols = new Array(14).fill('');
  cols[Fields.PROCESSING_DATE_TIME] = new Date().toISOString();
  cols[Fields.MESSAGE_ID] = 'msg-001';
  cols[Fields.TRANSACTION_TYPE] = 'TRANSFER';
  cols[Fields.PAYMENT_CURRENCY_CODE] = 'USD';
  cols[Fields.TOTAL_PAYMENT_AMOUNT] = '100.00';
  cols[Fields.SENDER_ID] = 'sender-001';
  cols[Fields.SENDER_NAME] = 'Test Sender';
  cols[Fields.RECEIVER_ID] = 'receiver-001';
  cols[Fields.RECEIVER_NAME] = 'Test Receiver';
  cols[Fields.SENDER_AGENT_SPID] = 'SPID001';
  cols[Fields.RECEIVER_AGENT_SPID] = 'SPID002';
  cols[Fields.SENDER_ACCOUNT] = 'acc-001';
  cols[Fields.RECEIVER_ACCOUNT] = 'acc-002';
  cols[Fields.REPORTING_CODE] = 'RC001';
  return cols;
};

describe('handleExecute - authentication', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when AUTHENTICATED is true', () => {
    beforeAll(() => {
      configuration.AUTHENTICATED = true;
    });

    afterAll(() => {
      configuration.AUTHENTICATED = false;
    });

    it('should return 401 when extractTenant fails', async () => {
      mockedExtractTenant.mockReturnValue({ success: false });
      const req = makeRequest();
      const reply = makeReply();

      await handleExecute(req, reply);

      expect(mockedExtractTenant).toHaveBeenCalledWith(true, undefined);
      expect(reply.code).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 401 when extractTenant succeeds but returns no tenantId', async () => {
      mockedExtractTenant.mockReturnValue({ success: true });
      const req = makeRequest('Bearer token');
      const reply = makeReply();

      await handleExecute(req, reply);

      expect(reply.code).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should call SendLineMessages with tenantId and authHeader on success', async () => {
      mockedExtractTenant.mockReturnValue({ success: true, tenantId: 'test-tenant' });
      const sendSpy = jest.spyOn(FileService, 'SendLineMessages').mockResolvedValue('done');
      const req = makeRequest('Bearer valid-token');
      const reply = makeReply();

      await handleExecute(req, reply);

      expect(sendSpy).toHaveBeenCalledWith({ evaluate: false }, 'test-tenant', 'Bearer valid-token');
      expect(reply.send).toHaveBeenCalledWith('done');
    });
  });

  describe('when AUTHENTICATED is false', () => {
    beforeAll(() => {
      configuration.AUTHENTICATED = false;
    });

    it('should call SendLineMessages with DEFAULT tenantId when not authenticated', async () => {
      mockedExtractTenant.mockReturnValue({ success: true, tenantId: 'DEFAULT' });
      const sendSpy = jest.spyOn(FileService, 'SendLineMessages').mockResolvedValue('done');
      const req = makeRequest();
      const reply = makeReply();

      await handleExecute(req, reply);

      expect(sendSpy).toHaveBeenCalledWith({ evaluate: false }, 'DEFAULT', undefined);
      expect(reply.send).toHaveBeenCalledWith('done');
    });
  });
});

describe('GetPain001FromLine - tenantId propagation', () => {
  it('should set TenantId from the tenantId parameter', () => {
    const columns = makeColumns();
    const result = GetPain001FromLine(columns, 'my-tenant');
    expect(result.TenantId).toBe('my-tenant');
  });

  it('should use DEFAULT tenantId when passed DEFAULT', () => {
    const columns = makeColumns();
    const result = GetPain001FromLine(columns, 'DEFAULT');
    expect(result.TenantId).toBe('DEFAULT');
  });
});
