import { determineAccountCreationTimestamp } from '../../src/utils/timestamp-handler';

// Mock database manager interface for testing
interface MockDbManager {
  saveAccount: jest.MockedFunction<(accountId: string, tenantId: string, createdAt: string) => Promise<void>>;
}

let mockDbManager: MockDbManager;

// Function to process transaction using timestamp logic
async function processTransaction(
  transaction: { accountId?: string; tenantId?: string; CreDtTm?: string },
  batchMetadata?: { timestamp?: string },
): Promise<void> {
  const accountId = transaction.accountId || 'DEFAULT_ACCOUNT';
  const tenantId = transaction.tenantId || 'DEFAULT_TENANT';

  // Use timestamp utility to determine CreDtTm
  const createdTimestamp = determineAccountCreationTimestamp(transaction, batchMetadata);

  // Call mocked database manager
  await mockDbManager.saveAccount(accountId, tenantId, createdTimestamp);
}

describe('Batch Account Creation', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockDbManager = {
      saveAccount: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should create account with transaction timestamp', async () => {
    const mockTransaction = {
      accountId: 'ACC123',
      tenantId: 'TENANT1',
      CreDtTm: '2026-02-11T10:00:00.000Z',
    };

    await processTransaction(mockTransaction, {});

    expect(mockDbManager.saveAccount).toHaveBeenCalledWith('ACC123', 'TENANT1', '2026-02-11T10:00:00.000Z');
  });

  it('should use batch file timestamp when transaction timestamp missing', async () => {
    const mockTransaction = {
      accountId: 'ACC123',
      tenantId: 'TENANT1',
      // No CreDtTm in transaction
    };

    const batchMetadata = {
      timestamp: '2026-02-11T09:00:00.000Z',
    };

    await processTransaction(mockTransaction, batchMetadata);

    expect(mockDbManager.saveAccount).toHaveBeenCalledWith('ACC123', 'TENANT1', '2026-02-11T09:00:00.000Z');
  });

  it('should use current time as fallback', async () => {
    const mockTransaction = {
      accountId: 'ACC123',
      tenantId: 'TENANT1',
    };

    const beforeTime = new Date().toISOString();
    await processTransaction(mockTransaction, {});
    const afterTime = new Date().toISOString();

    const actualTimestamp = mockDbManager.saveAccount.mock.calls[0][2];
    expect(new Date(actualTimestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
    expect(new Date(actualTimestamp).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
  });

  it('should handle invalid timestamp gracefully', async () => {
    const mockTransaction = {
      accountId: 'ACC123',
      tenantId: 'TENANT1',
      CreDtTm: 'INVALID-DATE',
    };

    // Should not throw, should use fallback
    await expect(processTransaction(mockTransaction, {})).resolves.not.toThrow();
  });
});
