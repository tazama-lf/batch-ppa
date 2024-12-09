// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as protobuf from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { Pacs002Sample, Pacs008Sample, Pain001Sample, Pain013Sample } from '@tazama-lf/frms-coe-lib/lib/tests/data';
import { CacheDatabaseClientMocks, DatabaseManagerMocks } from '@tazama-lf/frms-coe-lib/lib/tests/mocks/mock-transactions';
import { cacheDatabaseManager, dbInit, loggerService, runServer, configuration } from '../src';
import * as LogicService from '../src/services/save.transactions.service';

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

beforeAll(async () => {
  await dbInit();
  await runServer();
});

afterAll(() => {
  cacheDatabaseManager.quit();
});

describe('App Controller & Logic Service', () => {
  beforeEach(() => {
    CacheDatabaseClientMocks(cacheDatabaseManager);
    DatabaseManagerMocks(cacheDatabaseManager);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleExecute', () => {
    it('should handle pain.001', async () => {
      const request = Pain001Sample as Pain001;

      const handleSpy = jest.spyOn(LogicService, 'handlePain001');

      await LogicService.handlePain001(request, 'pain.001.001.11');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle pain.001, database error', async () => {
      const request = Pain001Sample as Pain001;

      jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
        return new Promise((resolve, reject) => {
          throw new Error('Deliberate Error');
        });
      });

      let error = '';
      try {
        await LogicService.handlePain001(request, 'pain.001.001.11');
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('');
    });
  });

  it('should handle pain.001, database error that not of type Error', async () => {
    const request = Pain001Sample as Pain001;

    jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
      return new Promise((resolve, reject) => {
        throw { error: 'Deliberate Error' };
      });
    });

    let error = '';
    try {
      await LogicService.handlePain001(request, 'pain.001.001.11');
    } catch (err: any) {
      error = err?.message;
    }
    expect(error).toEqual('');
  });

  describe('handlePain.013', () => {
    it('should handle pain.013', async () => {
      const request = Pain013Sample as Pain013;

      const handleSpy = jest.spyOn(LogicService, 'handlePain013');

      await LogicService.handlePain013(request, 'pain.013.001.09');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle pain.013, database error', async () => {
      const request = Pain013Sample as Pain013;

      jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
        return new Promise((resolve, reject) => {
          throw new Error('Deliberate Error');
        });
      });

      let error = '';
      try {
        await LogicService.handlePain013(request, 'pain.013.001.09');
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('');
    });
  });

  describe('handlePacs.008', () => {
    it('should pacs.008', async () => {
      const request = Pacs008Sample as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      await LogicService.handlePacs008(request, 'pacs.008.001.10');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should pacs.008, createMessageBuffer undefined', async () => {
      const request = Pacs008Sample as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      jest.spyOn(protobuf, 'createMessageBuffer').mockImplementationOnce(() => undefined);

      try {
        await LogicService.handlePacs008(request, 'pacs.008.001.10');

        expect(true).toStrictEqual(false); //unreachable
      } catch (err) {
        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(err).toStrictEqual(new Error('[pacs008] data cache could not be serialized'));
      }
    });

    it('should handle pacs.008, database error', async () => {
      jest
        .spyOn(cacheDatabaseManager, 'saveTransactionHistory')
        .mockImplementation((transaction: Pain001 | Pain013 | Pacs008 | Pacs002) => {
          return new Promise((resolve, reject) => {
            throw new Error('Deliberate Error');
          });
        });
      const request = Pacs008Sample as Pacs008;

      let error = '';
      try {
        await LogicService.handlePacs008(request, 'pacs.008.001.10');
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('');
    });
  });

  describe('handlePacs.008, quoting enabled', () => {
    it('should handle pacs.008', async () => {
      configuration.QUOTING = true;
      const request = Pacs008Sample as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      await LogicService.handlePacs008(request, 'pacs.008.001.10');
      expect(configuration.QUOTING).toStrictEqual(true);
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
      configuration.QUOTING = false;
    });
  });
});
